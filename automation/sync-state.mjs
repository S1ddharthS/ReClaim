import fs from 'node:fs';
import path from 'node:path';
import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig, ROOT } from './lib/config.mjs';

const config = requireJiraConfig(loadEnv());
const client = new JiraClient(config);
const statePath = path.join(ROOT, 'evidence', 'exports', 'jira-state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

const site = config.baseUrl.replace(/\/+$/, '');
state.generatedAt = new Date().toISOString();
state.siteUrl = site;
state.projectUrl = `${site}/jira/software/projects/RECL/summary`;
state.boardUrl = `${site}/jira/software/projects/RECL/boards/1`;
state.backlogUrl = `${site}/jira/software/projects/RECL/boards/1/backlog`;
state.board = {
  id: 1,
  name: 'SCRUM board',
  url: state.boardUrl,
  backlogUrl: state.backlogUrl,
};
state.lastError = null;

const issues = await client.search(
  'project = RECL ORDER BY key ASC',
  ['summary', 'issuetype', 'status', 'priority', 'customfield_10016', 'parent', 'assignee', 'labels'],
  100
);
const keyToId = new Map(Object.entries(state.issues).map(([id, item]) => [item.key, id]));
for (const issue of issues) {
  const id = keyToId.get(issue.key);
  if (!id) continue;
  state.issues[id] = {
    ...state.issues[id],
    key: issue.key,
    type: issue.fields.issuetype.name,
    summary: issue.fields.summary,
    url: `${site}/browse/${issue.key}`,
    status: issue.fields.status.name,
    priority: issue.fields.priority?.name ?? null,
    storyPoints: issue.fields.customfield_10016 ?? null,
    parent: issue.fields.parent?.key ?? null,
    assignee: issue.fields.assignee?.displayName ?? null,
    labels: issue.fields.labels ?? [],
  };
}

const sprintResponse = await client.get('/rest/agile/1.0/board/1/sprint', {
  query: { state: 'active,closed,future', maxResults: 50 },
});
const sprintIds = { 'SPR-1': 3, 'SPR-2': 4 };
state.sprints = {};
state.sprintIssues = {};
state.sprintPoints = {};
for (const [id, sprintId] of Object.entries(sprintIds)) {
  const sprint = (sprintResponse.values || []).find((item) => item.id === sprintId);
  if (!sprint) continue;
  const sprintIssues = await client.get(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
    query: { maxResults: 100, fields: 'key,customfield_10016' },
  });
  const keys = (sprintIssues.issues || []).map((issue) => issue.key);
  const points = (sprintIssues.issues || []).reduce(
    (sum, issue) => sum + (issue.fields.customfield_10016 || 0),
    0
  );
  state.sprints[id] = {
    id: sprint.id,
    name: sprint.name,
    state: sprint.state,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    completeDate: sprint.completeDate ?? null,
    goal: sprint.goal ?? null,
    url: `${state.boardUrl}?sprint=${sprint.id}`,
  };
  state.sprintIssues[id] = keys;
  state.sprintPoints[id] = points;
}

state.filters = {
  sprint1Scope: {
    id: '10001',
    name: 'Sprint 1 - Committed Scope (26 pts)',
    url: `${site}/issues/?filter=10001`,
  },
  sprint1Result: {
    id: '10002',
    name: 'Sprint 1 - Completed Result (26 pts)',
    url: `${site}/issues/?filter=10002`,
  },
  sprint2Scope: {
    id: '10003',
    name: 'Sprint 2 - Active Scope (23 pts)',
    url: `${site}/issues/?filter=10003`,
  },
  assignedWork: {
    id: '10004',
    name: 'RECL - Assigned Work (Siddharth Sanjay)',
    url: `${site}/issues/?filter=10004`,
  },
};
state.dashboard = {
  id: 10001,
  name: 'ReClaim – Sprint 1 Report & Project Overview',
  url: `${site}/jira/dashboards/10001`,
};
state.sprintOutcome = {
  outcome: 'Sprint 1 completed with 7 of 7 items Done (26 points), including BUG-01. No carry-over.',
  carryOver: 0,
};
state.lastRun = {
  at: new Date().toISOString(),
  phase: 'evidence-prep',
  site,
  accountId: state.accountId,
};

fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
console.log(`Updated ${statePath}`);
console.log('Sprints:', JSON.stringify(state.sprints, null, 2));
console.log('Sprint points:', state.sprintPoints);
console.log('Sprint issues:', state.sprintIssues);
