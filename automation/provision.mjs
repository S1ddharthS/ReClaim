import fs from 'node:fs';
import path from 'node:path';
import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig, ROOT, readJson, writeJson } from './lib/config.mjs';
import {
  ensureProject,
  ensureBoard,
  getBoardConfiguration,
  getFields,
  getIssueTypes,
  getPriorities,
  findEpicLinkField,
  findStoryPointsField,
  logEvent,
  mapIssueTypes,
  resolvePriorityName,
} from './lib/operations.mjs';
import {
  addIssuesToSprint,
  closeSprint,
  ensureEpics,
  ensureIssues,
  ensureSprint,
  getIssue,
  getSprintIssueKeys,
  getSprints,
  issueStatus,
  startSprint,
  transitionIssue,
} from './lib/workflow.mjs';

const DATA_DIR = path.join(ROOT, 'jira', 'data');
const STATE_FILE = path.join(ROOT, 'evidence', 'exports', 'jira-state.json');
const LOG_FILE = path.join(ROOT, 'evidence', 'exports', 'provision-log.json');

const loadData = () => ({
  project: readJson(path.join(DATA_DIR, 'project.json')),
  epics: readJson(path.join(DATA_DIR, 'epics.json')),
  sprints: readJson(path.join(DATA_DIR, 'sprints.json')),
  issues: [
    ...readJson(path.join(DATA_DIR, 'stories-foundation.json')),
    ...readJson(path.join(DATA_DIR, 'stories-discovery.json')),
    ...readJson(path.join(DATA_DIR, 'stories-delivery.json')),
  ],
});

function parseArgs() {
  const args = process.argv.slice(2);
  const phase = args.find((arg) => arg.startsWith('--phase='))?.split('=')[1] ||
    (args.includes('--phase') ? args[args.indexOf('--phase') + 1] : 'all');
  return {
    phase,
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
}

function validateData(data) {
  if (data.epics.length !== 5) throw new Error('Exactly five epics are required.');
  if (data.issues.length < 17) throw new Error('The backlog must contain at least 17 records.');
  const storyCount = data.issues.filter((issue) => issue.type === 'Story').length;
  if (storyCount < 15) throw new Error(`At least 15 user stories are required; found ${storyCount}.`);
  const epicIds = new Set(data.epics.map((epic) => epic.id));
  const sprintIds = new Set(data.sprints.map((sprint) => sprint.id));
  for (const issue of data.issues) {
    if (!epicIds.has(issue.epic)) throw new Error(`Unknown epic ${issue.epic} on ${issue.id}.`);
    if (issue.sprint && !sprintIds.has(issue.sprint)) {
      throw new Error(`Unknown sprint ${issue.sprint} on ${issue.id}.`);
    }
    if (issue.type === 'Story' && issue.acceptanceCriteria.length < 4) {
      throw new Error(`Story ${issue.id} needs at least four acceptance criteria.`);
    }
  }
  const totalPoints = data.issues.reduce((sum, issue) => sum + issue.points, 0);
  return { storyCount, totalPoints };
}

function baseState(siteUrl, projectKey) {
  return {
    generatedAt: new Date().toISOString(),
    siteUrl,
    projectKey,
    projectUrl: `${siteUrl}/jira/software/projects/${projectKey}/summary`,
    boardUrl: `${siteUrl}/jira/software/projects/${projectKey}/board`,
    backlogUrl: `${siteUrl}/jira/software/projects/${projectKey}/backlog`,
    issues: {},
    phases: {},
    sprintOutcome: null,
  };
}

function dataWithJiraSprints(data, jiraSprints) {
  return data.sprints.map((sprint) => {
    const jira = jiraSprints.find((item) => item.name === sprint.name);
    if (!jira) throw new Error(`Jira sprint ${sprint.name} was not created.`);
    return { ...sprint, jiraId: jira.id, jiraState: jira.state };
  });
}

async function buildContext(client, data, state, accountId, options = {}) {
  const log = options.log || [];
  const project = await client.getProject(state.projectKey);
  if (!project) throw new Error(`Project ${state.projectKey} not found.`);
  const issueTypes = mapIssueTypes(await getIssueTypes(client, state.projectKey));
  const fields = await getFields(client);
  const board = await ensureBoard(client, state.projectKey, data.project.boardName, log);
  const boardConfiguration = await getBoardConfiguration(client, board.id);
  const storyPoints = findStoryPointsField(fields, boardConfiguration);
  if (!storyPoints) {
    throw new Error(
      'No Story Points field is enabled for the project. Open the board estimation settings and enable Story point estimate, then re-run.'
    );
  }
  const epicLink = findEpicLinkField(fields);
  const priorities = await getPriorities(client);
  const priorityNames = Object.fromEntries(
    data.issues.map((issue) => [issue.id, resolvePriorityName(priorities, issue.priority)])
  );
  const epicById = new Map(data.epics.map((epic) => [epic.id, epic]));
  const sprintObjects = [];
  for (const sprint of data.sprints) {
    const jira = await ensureSprint(client, board.id, sprint, state, log);
    sprintObjects.push({ ...sprint, jiraId: jira.id, jiraState: jira.state });
  }
  const sprintsById = Object.fromEntries(sprintObjects.map((sprint) => [sprint.id, sprint]));
  state.projectId = project.id;
  state.projectStyle = project.simplified ? 'team-managed' : 'company-managed';
  state.board = { id: board.id, name: board.name, url: state.boardUrl };
  state.accountId = accountId;
  state.issueTypes = issueTypes;
  state.fields = {
    storyPoints: { id: storyPoints.id, name: storyPoints.name },
    epicLink: epicLink ? { id: epicLink.id, name: epicLink.name } : null,
  };
  state.sprints = Object.fromEntries(
    sprintObjects.map((sprint) => [
      sprint.id,
      { id: sprint.jiraId, name: sprint.name, state: sprint.jiraState, url: `${state.siteUrl}/jira/software/projects/${state.projectKey}/board?sprint=${sprint.jiraId}` },
    ])
  );
  state.sprintPoints = Object.fromEntries(
    data.sprints.map((sprint) => [
      sprint.id,
      data.issues.filter((issue) => issue.sprint === sprint.id).reduce((sum, issue) => sum + issue.points, 0),
    ])
  );
  return {
    project,
    projectKey: state.projectKey,
    issueTypes,
    fields: { storyPoints, epicLink },
    board,
    boardConfiguration,
    priorities,
    priorityNames,
    epicById,
    sprintObjects,
    sprintsById,
    log,
    state,
    data,
    accountId,
  };
}

async function phaseBootstrap(client, data, state, accountId, log) {
  state.siteUrl = state.siteUrl || client.baseUrl;
  await ensureProject(client, data.project, accountId, log);
  const context = await buildContext(client, data, state, accountId, { log });
  const epicKeys = await ensureEpics(client, {
    projectKey: state.projectKey,
    project: context.project,
    issueTypes: context.issueTypes,
    fields: context.fields,
    accountId,
    epics: data.epics,
    log,
    state,
  });
  for (const epic of data.epics) {
    state.issues[epic.id].key = epicKeys.get(epic.id);
  }

  const issueKeys = await ensureIssues(client, {
    ...context,
    epics: data.epics,
    issues: data.issues,
    sprintObjects: context.sprintObjects,
    sprint: context.sprintsById,
    accountId,
  });

  const sprint1 = context.sprintsById['SPR-1'];
  const sprint1Keys = data.issues
    .filter((issue) => issue.sprint === 'SPR-1')
    .map((issue) => state.issues[issue.id].key);
  await addIssuesToSprint(client, sprint1.jiraId, sprint1Keys, log, sprint1.name);

  state.phases.bootstrap = {
    at: new Date().toISOString(),
    projectCreated: true,
    epics: data.epics.length,
    issues: data.issues.length,
    stories: data.issues.filter((issue) => issue.type === 'Story').length,
    bug: data.issues.filter((issue) => issue.type === 'Bug').length,
    sprint1Issues: sprint1Keys.length,
    totalPoints: data.issues.reduce((sum, issue) => sum + issue.points, 0),
    sprint1Points: state.sprintPoints['SPR-1'],
  };
  logEvent(log, 'info', 'Bootstrap phase complete.', state.phases.bootstrap);
  return issueKeys;
}

async function phaseExecute(client, data, state, log) {
  if (!state.phases.bootstrap) throw new Error('Run --phase=bootstrap before execute.');
  const sprint1 = state.sprints['SPR-1'];
  const sprint1Data = data.sprints.find((sprint) => sprint.id === 'SPR-1');
  const current = await client.get(`/rest/agile/1.0/sprint/${sprint1.id}`);
  if (current.state === 'future') {
    await startSprint(client, sprint1.id, sprint1Data, log);
  }
  state.sprints['SPR-1'].state = 'active';

  const inProgress = ['US-03', 'US-04', 'US-07', 'BUG-01'];
  const done = ['US-01', 'US-02'];
  for (const id of inProgress) {
    const key = state.issues[id]?.key;
    if (!key) throw new Error(`Missing issue ${id}.`);
    await transitionIssue(client, key, 'In Progress', { log });
  }
  for (const id of done) {
    const key = state.issues[id]?.key;
    if (!key) throw new Error(`Missing issue ${id}.`);
    await transitionIssue(client, key, 'Done', { log });
    await client.addComment(
      key,
      'Sprint 1 execution evidence: implementation and acceptance checks are complete; no open blocker remains.'
    );
  }
  await client.addComment(
    state.issues['BUG-01'].key,
    'Defect reproduced from buyer search. Root cause isolated to the empty-category query branch; verification predicate fix is in progress.'
  );

  state.phases.execute = {
    at: new Date().toISOString(),
    sprintState: 'active',
    statusSnapshot: {
      done,
      inProgress,
      toDo: ['US-05'],
    },
  };
  logEvent(log, 'info', 'Execution phase complete; board has a mixed To Do / In Progress / Done snapshot.');
}

async function phaseComplete(client, data, state, log) {
  if (!state.phases.execute) throw new Error('Run --phase=execute before complete.');
  const sprint1 = state.sprints['SPR-1'];
  const sprint1Data = data.sprints.find((sprint) => sprint.id === 'SPR-1');
  const keys = data.issues
    .filter((issue) => issue.sprint === 'SPR-1')
    .map((issue) => state.issues[issue.id].key);

  for (const issue of data.issues.filter((item) => item.sprint === 'SPR-1')) {
    const key = state.issues[issue.id].key;
    await transitionIssue(client, key, 'Done', {
      resolution: issue.type === 'Bug' ? 'Fixed' : undefined,
      log,
    });
    for (const comment of issue.comments || []) {
      await client.addComment(key, comment);
    }
  }

  const statuses = [];
  for (const key of keys) statuses.push(await issueStatus(client, key));
  if (statuses.some((status) => status.status?.toLowerCase() !== 'done')) {
    throw new Error(`Not all Sprint 1 issues are Done: ${JSON.stringify(statuses)}`);
  }

  const closed = await closeSprint(client, sprint1.id, sprint1Data, log);
  state.sprints['SPR-1'].state = closed.state || 'closed';
  state.phases.complete = {
    at: new Date().toISOString(),
    completedIssues: keys.length,
    completedPoints: state.sprintPoints['SPR-1'],
    bugResolution: 'Fixed',
    sprintState: 'closed',
    sprintReportNote:
      'All committed stories and the regression bug were completed. Sprint 1 closed with no carry-over.',
  };
  logEvent(log, 'info', 'Sprint 1 completed and all scoped issues are Done.', {
    points: state.phases.complete.completedPoints,
  });
}

async function phaseSprint2(client, data, state, log) {
  if (!state.phases.complete) throw new Error('Run --phase=complete before sprint2.');
  const sprint2 = state.sprints['SPR-2'];
  const sprint2Data = data.sprints.find((sprint) => sprint.id === 'SPR-2');
  const keys = data.issues
    .filter((issue) => issue.sprint === 'SPR-2')
    .map((issue) => state.issues[issue.id].key);
  await addIssuesToSprint(client, sprint2.id, keys, log, sprint2Data.name);
  const current = await client.get(`/rest/agile/1.0/sprint/${sprint2.id}`);
  if (current.state === 'future') {
    await startSprint(client, sprint2.id, sprint2Data, log);
  }
  state.sprints['SPR-2'].state = 'active';
  await transitionIssue(client, state.issues['US-06'].key, 'In Progress', { log });
  await client.addComment(
    state.issues['US-06'].key,
    'Sprint 2 execution started: expiry job and renewal eligibility rules are being implemented.'
  );

  state.phases.sprint2 = {
    at: new Date().toISOString(),
    sprintState: 'active',
    sprintIssues: keys,
    plannedPoints: state.sprintPoints['SPR-2'],
    boardSnapshot: {
      inProgress: ['US-06'],
      toDo: ['US-08', 'US-09', 'US-10', 'US-11'],
    },
  };
  logEvent(log, 'info', 'Sprint 2 is active with the selected remaining backlog.');
}

async function main() {
  const options = parseArgs();
  const env = loadEnv();
  const data = loadData();
  const counts = validateData(data);
  console.log(`ReClaim data validated: ${counts.storyCount} user stories, ${data.issues.length - counts.storyCount} bug(s), ${counts.totalPoints} total points.`);

  if (options.dryRun) {
    console.log('Dry run complete. No Jira requests were made.');
    return;
  }

  const config = requireJiraConfig(env);
  const client = new JiraClient(config);
  const me = await client.myself();
  const accountId = me.accountId;
  console.log(`Connected to ${config.baseUrl} as ${me.displayName || me.emailAddress} (${accountId}).`);

  const state = fs.existsSync(STATE_FILE)
    ? readJson(STATE_FILE)
    : baseState(config.baseUrl, config.projectKey);
  state.siteUrl = config.baseUrl;
  state.projectKey = config.projectKey;
  const log = [];

  const runBootstrap = async () => {
    if (!state.phases?.bootstrap || options.force) {
      await phaseBootstrap(client, data, state, accountId, log);
      writeJson(STATE_FILE, state);
    } else {
      logEvent(log, 'info', 'Bootstrap already recorded; skipping creation.');
    }
  };

  try {
    if (options.phase === 'bootstrap') {
      await runBootstrap();
    } else if (options.phase === 'execute') {
      await phaseExecute(client, data, state, log);
    } else if (options.phase === 'complete') {
      await phaseComplete(client, data, state, log);
    } else if (options.phase === 'sprint2') {
      await phaseSprint2(client, data, state, log);
    } else if (options.phase === 'all') {
      await runBootstrap();
      await phaseExecute(client, data, state, log);
      await phaseComplete(client, data, state, log);
      await phaseSprint2(client, data, state, log);
    } else {
      throw new Error(`Unknown phase "${options.phase}". Use bootstrap, execute, complete, sprint2 or all.`);
    }

    state.generatedAt = new Date().toISOString();
    state.lastRun = {
      at: new Date().toISOString(),
      phase: options.phase,
      site: config.baseUrl,
      accountId,
    };
    writeJson(STATE_FILE, state);
    writeJson(LOG_FILE, { generatedAt: new Date().toISOString(), events: log });
    console.log(`\nJira state written to ${STATE_FILE}`);
    console.log(`Project: ${state.projectUrl}`);
    console.log(`Board:   ${state.boardUrl}`);
    console.log(`Backlog: ${state.backlogUrl}`);
  } catch (error) {
    state.generatedAt = new Date().toISOString();
    state.lastError = {
      at: new Date().toISOString(),
      phase: options.phase,
      message: error.message,
    };
    writeJson(STATE_FILE, state);
    writeJson(LOG_FILE, { generatedAt: new Date().toISOString(), events: log, error: error.message });
    throw error;
  }
}

main().catch((error) => {
  console.error(`\nPROVISIONING FAILED: ${error.message}`);
  if (error.body) console.error(JSON.stringify(error.body, null, 2));
  process.exit(1);
});
