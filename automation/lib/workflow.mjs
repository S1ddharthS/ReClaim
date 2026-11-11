import { JiraError } from './jira.mjs';
import {
  epicDescription,
  storyDescription,
  bugDescription,
} from './adf.mjs';
import { logEvent } from './operations.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isoDate = (value) => (value ? value.slice(0, 10) : undefined);

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null)
  );
}

export async function getProjectIssues(client, projectKey) {
  const issues = await client.search(
    `project = "${projectKey}" ORDER BY created ASC`,
    ['summary', 'issuetype', 'status', 'parent', 'assignee', 'priority', 'labels']
  );
  return issues;
}

export async function ensureEpics(client, context) {
  const { projectKey, project, issueTypes, fields, accountId, epics, log, state } = context;
  const existing = await getProjectIssues(client, projectKey);
  const bySummary = new Map(existing.map((issue) => [issue.fields.summary, issue]));
  const epicMap = new Map();
  const epicLinkField = fields.epicLink;

  for (const epic of epics) {
    const found = bySummary.get(epic.summary);
    if (found) {
      logEvent(log, 'info', `Epic exists: ${epic.summary} (${found.key}).`);
      epicMap.set(epic.id, found.key);
      state.issues[epic.id] = {
        key: found.key,
        type: 'Epic',
        summary: epic.summary,
        url: `${state.siteUrl}/browse/${found.key}`,
      };
      continue;
    }

    const baseFields = {
      project: { key: projectKey },
      issuetype: { name: issueTypes.epic },
      summary: epic.summary,
      description: epicDescription(epic),
      labels: epic.labels,
      assignee: { accountId },
    };

    let created;
    try {
      created = await client.post('/rest/api/3/issue', { fields: baseFields });
    } catch (error) {
      if (error instanceof JiraError && error.status === 400 && epicLinkField) {
        // Some older company-managed projects reject description fields only when
        // a screen configuration is incomplete. Retry without assignee so the
        // issue can still be created and repaired later.
        const retry = { ...baseFields };
        delete retry.assignee;
        created = await client.post('/rest/api/3/issue', { fields: retry });
        logEvent(log, 'warn', `Created epic ${epic.summary} without assignee after a screen validation error.`);
      } else {
        throw error;
      }
    }

    epicMap.set(epic.id, created.key);
    state.issues[epic.id] = {
      key: created.key,
      type: 'Epic',
      summary: epic.summary,
      url: `${state.siteUrl}/browse/${created.key}`,
    };
    logEvent(log, 'info', `Created epic ${epic.summary} (${created.key}).`);
  }

  return epicMap;
}

function issueFieldsForCreate({ projectKey, issueType, issue, epicKey, context, sprint }) {
  const { state, fields, accountId } = context;
  const isBug = issue.type === 'Bug';
  const description = isBug
    ? bugDescription(issue, context.epicById.get(issue.epic), sprint)
    : storyDescription(issue, context.epicById.get(issue.epic), sprint);

  const base = {
    project: { key: projectKey },
    issuetype: { name: issueType },
    summary: issue.summary,
    description,
    priority: { name: context.priorityNames[issue.id] || issue.priority },
    labels: issue.labels,
    assignee: { accountId },
    ...(sprint ? { duedate: isoDate(sprint.endDate) } : {}),
  };

  if (context.project.simplified) {
    base.parent = { key: epicKey };
  } else if (context.fields.epicLink?.id) {
    base[context.fields.epicLink.id] = epicKey;
  } else {
    base.parent = { key: epicKey };
  }

  if (fields.storyPoints?.id) {
    base[fields.storyPoints.id] = issue.points;
  }
  return base;
}

function issueFieldsForUpdate({ issue, epicKey, context, sprint }) {
  const { fields, accountId, state } = context;
  const description =
    issue.type === 'Bug'
      ? bugDescription(issue, context.epicById.get(issue.epic), sprint)
      : storyDescription(issue, context.epicById.get(issue.epic), sprint);
  const update = {
    description,
    priority: { name: context.priorityNames[issue.id] || issue.priority },
    labels: issue.labels,
    assignee: { accountId },
    ...(sprint ? { duedate: isoDate(sprint.endDate) } : {}),
  };
  if (fields.storyPoints?.id) update[fields.storyPoints.id] = issue.points;
  if (!context.project.simplified && fields.epicLink?.id) {
    update[fields.epicLink.id] = epicKey;
  }
  return update;
}

async function createIssueWithFallback(client, fields, context, issue, epicKey) {
  try {
    return await client.post('/rest/api/3/issue', { fields });
  } catch (error) {
    if (!(error instanceof JiraError) || error.status !== 400) throw error;

    const retry = { ...fields };
    let changed = false;
    for (const key of Object.keys(retry)) {
      if (key === 'parent' || /^customfield_\d+$/.test(key)) {
        delete retry[key];
        changed = true;
      }
    }
    if (!changed) throw error;
    const created = await client.post('/rest/api/3/issue', { fields: retry });
    logEvent(
      context.log,
      'warn',
      `Created ${issue.id} without parent/story-point fields after a screen validation error; repairing fields next.`
    );
    return created;
  }
}

export async function ensureIssues(client, context) {
  const { projectKey, issueTypes, issues, epics, sprintsById, log, state } = context;
  const existing = await getProjectIssues(client, projectKey);
  const bySummary = new Map(existing.map((issue) => [issue.fields.summary, issue]));
  const issueKeyMap = new Map();

  for (const [epicId, key] of Object.entries(state.issueKeys || {})) {
    // Reserved for future state merges; epic keys are already loaded via state.issues.
  }

  for (const issue of issues) {
    const epicKey = state.issues[issue.epic]?.key;
    const epic = context.epicById.get(issue.epic);
    const sprint = issue.sprint ? sprintsById[issue.sprint] : null;
    if (!epicKey) throw new Error(`Epic ${issue.epic} is not available for ${issue.id}.`);

    const found = bySummary.get(issue.summary);
    if (found) {
      const typeName = found.fields.issuetype?.name;
      if (typeName !== (issue.type === 'Bug' ? issueTypes.bug : issueTypes.story)) {
        throw new Error(
          `An existing issue named "${issue.summary}" has type ${typeName}; expected ${issue.type}.`
        );
      }
      issueKeyMap.set(issue.id, found.key);
      state.issues[issue.id] = {
        key: found.key,
        type: issue.type,
        summary: issue.summary,
        url: `${state.siteUrl}/browse/${found.key}`,
      };
      logEvent(log, 'info', `${issue.type} exists: ${issue.id} (${found.key}).`);
      try {
        await client.put(`/rest/api/3/issue/${found.key}`, {
          fields: issueFieldsForUpdate({ issue, epicKey, context, sprint }),
        });
      } catch (error) {
        if (!(error instanceof JiraError)) throw error;
        logEvent(log, 'warn', `Could not refresh all fields on ${found.key}: ${error.message.split('\n')[0]}`);
      }
      continue;
    }

    const createFields = issueFieldsForCreate({
      projectKey,
      issueType: issue.type === 'Bug' ? issueTypes.bug : issueTypes.story,
      issue,
      epicKey,
      context,
      sprint,
    });
    const created = await createIssueWithFallback(client, createFields, context, issue, epicKey);
    issueKeyMap.set(issue.id, created.key);
    state.issues[issue.id] = {
      key: created.key,
      type: issue.type,
      summary: issue.summary,
      url: `${state.siteUrl}/browse/${created.key}`,
    };
    logEvent(log, 'info', `Created ${issue.type} ${issue.id}: ${issue.summary} (${created.key}).`);

    // Repair fields that had to be omitted during fallback creation.
    const repair = {};
    if (context.fields.storyPoints?.id) repair[context.fields.storyPoints.id] = issue.points;
    if (context.project.simplified) repair.parent = { key: epicKey };
    else if (context.fields.epicLink?.id) repair[context.fields.epicLink.id] = epicKey;
    if (Object.keys(repair).length) {
      try {
        await client.put(`/rest/api/3/issue/${created.key}`, { fields: repair });
      } catch (error) {
        if (!(error instanceof JiraError)) throw error;
        logEvent(log, 'warn', `Could not set epic/story points on ${created.key}: ${error.message.split('\n')[0]}`);
      }
    }
  }

  // Create issue links only once the referenced issues exist.
  for (const issue of issues) {
    if (!issue.links?.length) continue;
    const sourceKey = state.issues[issue.id]?.key;
    if (!sourceKey) continue;
    for (const link of issue.links) {
      const targetKey = state.issues[link.target]?.key;
      if (!targetKey) continue;
      try {
        const types = await client.get('/rest/api/3/issueLinkType');
        const type =
          (types.issueLinkTypes || []).find((item) =>
            item.name.toLowerCase().includes('relat')
          ) || (types.issueLinkTypes || [])[0];
        if (!type) continue;
        await client.post('/rest/api/3/issueLink', {
          type: { name: type.name },
          inwardIssue: { key: sourceKey },
          outwardIssue: { key: targetKey },
        });
        logEvent(log, 'info', `Linked ${sourceKey} to ${targetKey} (${type.name}).`);
      } catch (error) {
        if (error instanceof JiraError && error.status === 400) {
          logEvent(log, 'warn', `Link ${sourceKey} -> ${targetKey} already exists or is not permitted; continuing.`);
        } else {
          throw error;
        }
      }
    }
  }

  return issueKeyMap;
}

export async function getSprints(client, boardId) {
  const result = await client.get(`/rest/agile/1.0/board/${boardId}/sprint`, {
    query: { state: 'active,future,closed', maxResults: 100 },
  });
  return result.values || [];
}

export async function ensureSprint(client, boardId, sprint, state, log) {
  const existing = await getSprints(client, boardId);
  const found = existing.find((item) => item.name === sprint.name);
  if (found) {
    if (found.state === 'future') {
      try {
        await client.put(`/rest/agile/1.0/sprint/${found.id}`, {
          name: sprint.name,
          goal: sprint.goal,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        });
      } catch (error) {
        if (!(error instanceof JiraError) || error.status !== 400) throw error;
        logEvent(log, 'warn', `Sprint ${sprint.id} already has dates; kept existing dates.`);
      }
    }
    logEvent(log, 'info', `Sprint exists: ${sprint.name} (${found.id}, ${found.state}).`);
    return found;
  }

  let created;
  try {
    created = await client.post('/rest/agile/1.0/sprint', {
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      originBoardId: boardId,
    });
  } catch (error) {
    if (!(error instanceof JiraError) || error.status !== 400) throw error;
    created = await client.post('/rest/agile/1.0/sprint', {
      name: sprint.name,
      goal: sprint.goal,
      originBoardId: boardId,
    });
    await client.put(`/rest/agile/1.0/sprint/${created.id}`, {
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    });
  }
  logEvent(log, 'info', `Created sprint ${sprint.name} (${created.id}).`);
  return created;
}

export async function getSprintIssueKeys(client, sprintId) {
  const result = await client.get(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
    query: { maxResults: 100, fields: 'summary' },
  });
  return (result.issues || []).map((issue) => issue.key);
}

export async function addIssuesToSprint(client, sprintId, keys, log, sprintName) {
  if (!keys.length) return;
  const current = new Set(await getSprintIssueKeys(client, sprintId));
  const missing = keys.filter((key) => !current.has(key));
  if (!missing.length) {
    logEvent(log, 'info', `All ${keys.length} issues are already in ${sprintName}.`);
    return;
  }
  await client.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, { issues: missing });
  logEvent(log, 'info', `Added ${missing.length} issues to ${sprintName}.`, { issues: missing });
}

export async function startSprint(client, sprintId, sprint, log) {
  const current = await client.get(`/rest/agile/1.0/sprint/${sprintId}`);
  if (current.state === 'active') {
    logEvent(log, 'info', `Sprint ${sprint.name} is already active.`);
    return current;
  }
  if (current.state === 'closed') {
    throw new Error(`Sprint ${sprint.name} is already closed.`);
  }
  const updated = await client.put(`/rest/agile/1.0/sprint/${sprintId}`, {
    name: current.name,
    state: 'active',
    startDate: sprint.startDate,
    endDate: sprint.endDate,
  });
  logEvent(log, 'info', `Started sprint ${sprint.name}.`);
  return updated || current;
}

export async function closeSprint(client, sprintId, sprint, log) {
  const current = await client.get(`/rest/agile/1.0/sprint/${sprintId}`);
  if (current.state === 'closed') {
    logEvent(log, 'info', `Sprint ${sprint.name} is already closed.`);
    return current;
  }
  const closed = await client.put(`/rest/agile/1.0/sprint/${sprintId}`, {
    name: current.name,
    state: 'closed',
    startDate: current.startDate || sprint.startDate,
    endDate: current.endDate || sprint.endDate,
    completeDate: new Date().toISOString(),
  });
  logEvent(log, 'info', `Completed sprint ${sprint.name}.`);
  return closed || current;
}

export async function getIssue(client, key) {
  return client.get(`/rest/api/3/issue/${key}`, {
    query: { fields: 'summary,status,resolution,issuetype,assignee,priority,labels,parent' },
  });
}

export async function transitionIssue(client, key, target, { resolution, log } = {}) {
  const issue = await getIssue(client, key);
  const currentStatus = issue.fields.status?.name;
  if (currentStatus?.toLowerCase() === target.toLowerCase()) {
    return issue;
  }
  const result = await client.get(`/rest/api/3/issue/${key}/transitions`, {
    query: { expand: 'transitions.fields' },
  });
  const transitions = result.transitions || [];
  let transition =
    transitions.find((item) => item.to?.name?.toLowerCase() === target.toLowerCase()) ||
    transitions.find((item) => item.to?.statusCategory?.key === target.toLowerCase());
  if (!transition) {
    const labels = transitions.map((item) => `${item.name} -> ${item.to?.name}`).join(', ');
    throw new Error(`No transition to ${target} for ${key}. Available: ${labels}`);
  }

  const body = { transition: { id: transition.id } };
  const resolutionField = transition.fields?.resolution;
  if (resolution && resolutionField) {
    body.fields = { resolution: { name: resolution } };
  }
  await client.post(`/rest/api/3/issue/${key}/transitions`, body);
  if (log) logEvent(log, 'info', `${key} moved ${currentStatus} -> ${target}.`);

  if (resolution) {
    const after = await getIssue(client, key);
    if (!after.fields.resolution?.name) {
      try {
        await client.put(`/rest/api/3/issue/${key}`, {
          fields: { resolution: { name: resolution } },
        });
      } catch (error) {
        if (!(error instanceof JiraError)) throw error;
        // Some team-managed screens keep resolution internal; the Done state is
        // the primary required evidence.
      }
    }
  }
  return getIssue(client, key);
}

export async function issueStatus(client, key) {
  const issue = await getIssue(client, key);
  return {
    key,
    status: issue.fields.status?.name,
    resolution: issue.fields.resolution?.name || null,
    assignee: issue.fields.assignee?.displayName || null,
    type: issue.fields.issuetype?.name,
    summary: issue.fields.summary,
  };
}

export async function waitForSprintState(client, sprintId, expected, attempts = 10) {
  for (let i = 0; i < attempts; i += 1) {
    const sprint = await client.get(`/rest/agile/1.0/sprint/${sprintId}`);
    if (sprint.state === expected) return sprint;
    await sleep(700);
  }
  return client.get(`/rest/agile/1.0/sprint/${sprintId}`);
}
