import { JiraError } from './jira.mjs';
import { epicDescription, storyDescription, bugDescription } from './adf.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function logEvent(log, level, message, data = undefined) {
  const entry = {
    at: new Date().toISOString(),
    level,
    message,
    ...(data === undefined ? {} : { data }),
  };
  log.push(entry);
  const suffix = data === undefined ? '' : ` ${JSON.stringify(data)}`;
  console.log(`[${level}] ${message}${suffix}`);
}

export async function getIssueTypes(client, projectKey) {
  try {
    const result = await client.get(
      `/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}/issuetypes`,
      { query: { maxResults: 100 } }
    );
    const list = result.issueTypes || result.values || (Array.isArray(result) ? result : null);
    if (list?.length) return list;
  } catch (error) {
    if (!(error instanceof JiraError)) throw error;
  }

  try {
    const result = await client.get('/rest/api/3/issue/createmeta', {
      query: { projectKeys: projectKey, expand: 'projects.issuetypes' },
    });
    const project = result.projects?.[0];
    const list = project?.issuetypes || project?.issueTypes;
    if (list?.length) return list;
  } catch (error) {
    if (!(error instanceof JiraError)) throw error;
  }

  const project = await client.getProject(projectKey);
  if (project?.issueTypes?.length) return project.issueTypes;
  throw new Error(`Could not resolve issue types for project ${projectKey}.`);
}

export function mapIssueTypes(issueTypes) {
  const byName = (name) =>
    issueTypes.find((type) => type.name?.toLowerCase() === name.toLowerCase());

  const epic =
    byName('Epic') ||
    issueTypes.find((type) => type.hierarchyLevel === 1 && !type.subtask);
  const story =
    byName('Story') ||
    issueTypes.find((type) => !type.subtask && type.hierarchyLevel === 0);
  const bug =
    byName('Bug') ||
    issueTypes.find((type) => type.name?.toLowerCase().includes('bug'));
  const task =
    byName('Task') ||
    issueTypes.find((type) => !type.subtask && type.hierarchyLevel === 0);

  if (!epic) throw new Error('No Epic issue type found in the project.');
  if (!story) throw new Error('No Story issue type found in the project.');
  if (!bug) throw new Error('No Bug issue type found in the project.');
  return {
    epic: epic.name,
    story: story.name,
    bug: bug.name,
    task: task?.name || story.name,
    epicId: epic.id,
    storyId: story.id,
    bugId: bug.id,
  };
}

export async function ensureProject(client, project, accountId, log) {
  let existing = await client.getProject(project.key);
  if (existing) {
    logEvent(log, 'info', `Project ${project.key} already exists; reusing it.`);
    return existing;
  }

  const payload = {
    name: project.name,
    key: project.key,
    description: project.description,
    leadAccountId: accountId,
    projectTypeKey: project.projectTypeKey,
    projectTemplateKey: project.projectTemplateKey,
  };

  try {
    await client.post('/rest/api/3/project', payload);
    logEvent(log, 'info', `Created Scrum project ${project.key}.`);
  } catch (error) {
    if (!(error instanceof JiraError) || error.status !== 400) throw error;
    logEvent(log, 'warn', 'Team-managed Scrum template was rejected; retrying with the company-managed Scrum template.');
    const fallback = {
      ...payload,
      projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-scrum-template',
    };
    await client.post('/rest/api/3/project', fallback);
    logEvent(log, 'info', `Created Scrum project ${project.key} (company-managed).`);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    existing = await client.getProject(project.key);
    if (existing) return existing;
    await sleep(750);
  }
  throw new Error(`Project ${project.key} was created but is not yet readable.`);
}

export async function getFields(client) {
  const fields = await client.get('/rest/api/3/field');
  return Array.isArray(fields) ? fields : [];
}

export function findStoryPointsField(fields, boardConfiguration) {
  const configured = boardConfiguration?.estimation?.field?.fieldId;
  if (configured) {
    const match = fields.find((field) => field.id === configured);
    if (match) return match;
  }
  const exact = fields.find(
    (field) => /^story point estimate$/i.test(field.name || '')
  );
  if (exact) return exact;
  return fields.find((field) => /story points?/i.test(field.name || '')) || null;
}

export function findEpicLinkField(fields) {
  return (
    fields.find((field) => /^epic link$/i.test(field.name || '')) ||
    fields.find((field) => /^parent$/i.test(field.name || '')) ||
    null
  );
}

export async function ensureBoard(client, projectKey, boardName, log) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await client.get('/rest/agile/1.0/board', {
      query: { projectKeyOrId: projectKey, maxResults: 50 },
    });
    const boards = result.values || [];
    if (boards.length) {
      const board =
        boards.find((item) => item.type?.toLowerCase() === 'scrum') || boards[0];
      if (board.name !== boardName) {
        try {
          await client.put(`/rest/agile/1.0/board/${board.id}`, { name: boardName });
          board.name = boardName;
          logEvent(log, 'info', `Renamed board ${board.id} to "${boardName}".`);
        } catch (error) {
          if (!(error instanceof JiraError) || error.status !== 405) throw error;
          logEvent(
            log,
            'info',
            `Board ${board.id} is team-managed and its name follows the space; keeping "${board.name}".`
          );
        }
      } else {
        logEvent(log, 'info', `Scrum board ${board.id} is ready.`);
      }
      return board;
    }
    if (attempt < 7) await sleep(1000);
  }

  logEvent(log, 'warn', 'No board was auto-created; creating a dedicated filter and Scrum board.');
  const filter = await client.post('/rest/api/3/filter', {
    name: `${projectKey} Scrum Filter`,
    description: `Issues for the ${projectKey} Scrum board.`,
    jql: `project = "${projectKey}" ORDER BY Rank ASC`,
    favourite: true,
  });
  const board = await client.post('/rest/agile/1.0/board', {
    name: boardName,
    type: 'scrum',
    filterId: filter.id,
  });
  logEvent(log, 'info', `Created Scrum board ${board.id}.`);
  return board;
}

export async function getBoardConfiguration(client, boardId) {
  try {
    return await client.get(`/rest/agile/1.0/board/${boardId}/configuration`);
  } catch (error) {
    if (error instanceof JiraError) return null;
    throw error;
  }
}

export async function getPriorities(client) {
  const priorities = await client.get('/rest/api/3/priority');
  return Array.isArray(priorities) ? priorities : priorities.values || [];
}

export function resolvePriorityName(priorities, requested) {
  const exact = priorities.find(
    (priority) => priority.name?.toLowerCase() === requested.toLowerCase()
  );
  return exact?.name || requested;
}
