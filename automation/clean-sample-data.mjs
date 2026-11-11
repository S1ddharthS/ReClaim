import { JiraClient, JiraError } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig } from './lib/config.mjs';

const config = requireJiraConfig(loadEnv());
const client = new JiraClient(config);

const SAMPLE_SUMMARIES = new Set(['Task 1', 'Task 2', 'Task 3', 'Subtask 2.1']);
const SAMPLE_SPRINTS = new Set(['SCRUM Sprint 0', 'SCRUM Sprint 1']);

const issues = await client.search(`project = "${config.projectKey}" ORDER BY created ASC`, [
  'summary',
  'issuetype',
  'parent',
]);
const sampleIssues = issues.filter((issue) => SAMPLE_SUMMARIES.has(issue.fields.summary));
const keepIssues = issues.filter((issue) => !SAMPLE_SUMMARIES.has(issue.fields.summary));

if (keepIssues.length) {
  console.log(
    `Refusing to continue: ${keepIssues.length} non-sample issue(s) already exist:\n` +
      keepIssues.map((issue) => `  ${issue.key} ${issue.fields.summary}`).join('\n')
  );
  process.exit(2);
}

const ordered = [...sampleIssues].sort((a, b) => {
  const rank = (issue) => (issue.fields.issuetype?.subtask ? 0 : 1);
  return rank(a) - rank(b);
});

for (const issue of ordered) {
  try {
    await client.delete(`/rest/api/3/issue/${issue.key}?deleteSubtasks=true`);
    console.log(`Deleted sample issue ${issue.key} (${issue.fields.summary}).`);
  } catch (error) {
    if (error instanceof JiraError && error.status === 404) {
      console.log(`Sample issue ${issue.key} was already gone.`);
    } else {
      throw error;
    }
  }
}

const sprints = await client.get('/rest/agile/1.0/board/1/sprint', {
  query: { state: 'active,future,closed', maxResults: 100 },
});
const sampleSprints = (sprints.values || []).filter((sprint) => SAMPLE_SPRINTS.has(sprint.name));
const keepSprints = (sprints.values || []).filter((sprint) => !SAMPLE_SPRINTS.has(sprint.name));

if (keepSprints.length) {
  console.log(
    `Refusing to delete sprints: ${keepSprints.length} non-sample sprint(s) exist: ` +
      keepSprints.map((sprint) => sprint.name).join(', ')
  );
  process.exit(2);
}

for (const sprint of sampleSprints) {
  try {
    await client.delete(`/rest/agile/1.0/sprint/${sprint.id}`);
    console.log(`Deleted sample sprint ${sprint.id} (${sprint.name}, ${sprint.state}).`);
  } catch (error) {
    if (!(error instanceof JiraError) || error.status !== 400) throw error;
    await client.put(`/rest/agile/1.0/sprint/${sprint.id}`, {
      state: 'closed',
      completeDate: new Date().toISOString(),
    });
    await client.delete(`/rest/agile/1.0/sprint/${sprint.id}`);
    console.log(`Closed then deleted sample sprint ${sprint.id} (${sprint.name}).`);
  }
}

const remaining = await client.search(`project = "${config.projectKey}"`, ['summary']);
const remainingSprints = await client.get('/rest/agile/1.0/board/1/sprint', {
  query: { state: 'active,future,closed', maxResults: 100 },
});
console.log(
  `Cleanup complete: ${remaining.length} issue(s) and ${remainingSprints.values?.length || 0} sprint(s) remain in ${config.projectKey}.`
);
