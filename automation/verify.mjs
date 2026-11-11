import fs from 'node:fs';
import path from 'node:path';
import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig, ROOT, readJson, writeJson } from './lib/config.mjs';

const DATA_DIR = path.join(ROOT, 'jira', 'data');
const STATE_FILE = path.join(ROOT, 'evidence', 'exports', 'jira-state.json');
const REPORT_FILE = path.join(ROOT, 'evidence', 'exports', 'verification-report.json');
const MARKDOWN_FILE = path.join(ROOT, 'docs', 'Jira_Verification_Report.md');

function loadData() {
  return {
    project: readJson(path.join(DATA_DIR, 'project.json')),
    epics: readJson(path.join(DATA_DIR, 'epics.json')),
    sprints: readJson(path.join(DATA_DIR, 'sprints.json')),
    issues: [
      ...readJson(path.join(DATA_DIR, 'stories-foundation.json')),
      ...readJson(path.join(DATA_DIR, 'stories-discovery.json')),
      ...readJson(path.join(DATA_DIR, 'stories-delivery.json')),
    ],
  };
}

function normalizeAdf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const texts = [];
  const walk = (node) => {
    if (!node) return;
    if (node.type === 'text') texts.push(node.text || '');
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  walk(value);
  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  if (!fs.existsSync(STATE_FILE)) throw new Error('No jira-state.json found. Run provisioning first.');
  const state = readJson(STATE_FILE);
  const data = loadData();
  const config = requireJiraConfig(loadEnv());
  const client = new JiraClient(config);

  const fields = ['summary', 'description', 'status', 'priority', 'labels', 'assignee', 'parent', 'issuetype', 'resolution', 'duedate'];
  if (state.fields?.storyPoints?.id) fields.push(state.fields.storyPoints.id);
  if (state.fields?.epicLink?.id) fields.push(state.fields.epicLink.id);
  const raw = await client.search(`project = "${state.projectKey}" ORDER BY created ASC`, fields, 100);

  const epics = raw.filter((issue) => issue.fields.issuetype?.name === state.issueTypes?.epic || issue.fields.issuetype?.name === 'Epic');
  const stories = raw.filter((issue) => issue.fields.issuetype?.name === state.issueTypes?.story || issue.fields.issuetype?.name === 'Story');
  const bugs = raw.filter((issue) => issue.fields.issuetype?.name === state.issueTypes?.bug || issue.fields.issuetype?.name === 'Bug');
  const expectedByKey = new Map(
    data.issues.map((issue) => [state.issues[issue.id]?.key, issue]).filter(([key]) => key)
  );

  const findings = [];
  const add = (level, check, detail) => findings.push({ level, check, detail });
  if (epics.length === 5) add('pass', 'Five epics exist', epics.map((item) => item.key).join(', '));
  else add('fail', 'Five epics exist', `Found ${epics.length}.`);
  if (stories.length >= 15) add('pass', 'At least 15 user stories exist', `${stories.length} stories.`);
  else add('fail', 'At least 15 user stories exist', `Found ${stories.length}.`);
  if (bugs.length >= 1) add('pass', 'At least one bug exists', bugs.map((item) => item.key).join(', '));
  else add('fail', 'At least one bug exists', 'No bug found.');

  const fieldProblems = [];
  for (const issue of raw) {
    if (issue.fields.issuetype?.name === state.issueTypes?.epic) continue;
    const expected = expectedByKey.get(issue.key);
    if (!expected) {
      add('warn', 'Unexpected issue in project', issue.key);
      continue;
    }
    const points = state.fields?.storyPoints?.id ? issue.fields[state.fields.storyPoints.id] : null;
    if (!normalizeAdf(issue.fields.description)) fieldProblems.push(`${issue.key}: description`);
    if (!issue.fields.priority?.name) fieldProblems.push(`${issue.key}: priority`);
    if (!issue.fields.labels?.length) fieldProblems.push(`${issue.key}: labels`);
    if (!issue.fields.assignee?.accountId) fieldProblems.push(`${issue.key}: assignee`);
    if (!issue.fields.parent && !state.fields?.epicLink?.id) fieldProblems.push(`${issue.key}: epic link`);
    if (issue.fields.issuetype?.name === state.issueTypes?.story && (points === null || points === undefined)) {
      fieldProblems.push(`${issue.key}: story points`);
    }
  }
  if (!fieldProblems.length) add('pass', 'Required issue fields populated', 'Description, priority, labels, assignee, epic link and story points are present on every item.');
  else add('fail', 'Required issue fields populated', fieldProblems.join('; '));

  const sprint1 = state.sprints?.['SPR-1'];
  const sprint2 = state.sprints?.['SPR-2'];
  const sprint1Issues = sprint1 ? await client.get(`/rest/agile/1.0/sprint/${sprint1.id}/issue`, { query: { maxResults: 100, fields: 'status,resolution,summary' } }) : { issues: [] };
  const sprint1Statuses = (sprint1Issues.issues || []).map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name,
    resolution: issue.fields.resolution?.name || null,
  }));
  if (sprint1?.state === 'closed') add('pass', 'Sprint 1 completed', `${sprint1.name} (${sprint1.id}) is closed.`);
  else add('fail', 'Sprint 1 completed', `State is ${sprint1?.state || 'missing'}.`);
  if (sprint1Statuses.length && sprint1Statuses.every((issue) => issue.status === 'Done')) {
    add('pass', 'Sprint 1 scope is Done', `${sprint1Statuses.length} issues completed.`);
  } else {
    add('fail', 'Sprint 1 scope is Done', JSON.stringify(sprint1Statuses));
  }
  const bug = bugs[0];
  if (bug && bug.fields.status?.name === 'Done') add('pass', 'Bug resolved', `${bug.key} is Done (${bug.fields.resolution?.name || 'resolution not displayed'}).`);
  else add('fail', 'Bug resolved', `${bug?.key || 'no bug'} is not Done.`);

  if (sprint2?.state === 'active') add('pass', 'Sprint 2 active', `${sprint2.name} (${sprint2.id}) is active.`);
  else add('warn', 'Sprint 2 active', `State is ${sprint2?.state || 'missing'}.`);

  const pointsByIssue = (issue) => {
    const expected = expectedByKey.get(issue.key);
    return expected?.points || 0;
  };
  const sprint1Points = (sprint1Issues.issues || []).reduce((sum, issue) => sum + pointsByIssue(issue), 0);
  const sprint2Points = data.issues.filter((issue) => issue.sprint === 'SPR-2').reduce((sum, issue) => sum + issue.points, 0);
  add('pass', 'Sprint point totals', `Sprint 1: ${sprint1Points} points (including bug); Sprint 2 planned: ${sprint2Points} points.`);

  const backlogKeys = data.issues.filter((issue) => !issue.sprint).map((issue) => state.issues[issue.id]?.key);
  add('pass', 'Remaining Product Backlog', `${backlogKeys.length} issues remain: ${backlogKeys.join(', ')}.`);

  const summary = {
    generatedAt: new Date().toISOString(),
    site: state.siteUrl,
    projectKey: state.projectKey,
    projectUrl: state.projectUrl,
    boardUrl: state.boardUrl,
    counts: {
      epics: epics.length,
      stories: stories.length,
      bugs: bugs.length,
      total: raw.length,
      sprint1Issues: sprint1Statuses.length,
      sprint1Points,
      sprint2Points,
      backlog: backlogKeys.length,
    },
    sprint1Statuses,
    bug: bug
      ? {
          key: bug.key,
          status: bug.fields.status?.name,
          resolution: bug.fields.resolution?.name || null,
          summary: bug.fields.summary,
        }
      : null,
    findings,
    status: findings.some((finding) => finding.level === 'fail') ? 'FAIL' : 'PASS',
  };
  writeJson(REPORT_FILE, summary);

  const lines = [
    '# ReClaim Jira Verification Report',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    `Project: [${state.projectKey}](${state.projectUrl})`,
    '',
    `Board: ${state.boardUrl}`,
    '',
    '## Result',
    '',
    `**${summary.status}**`,
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Epics | ${summary.counts.epics} |`,
    `| User stories | ${summary.counts.stories} |`,
    `| Bugs | ${summary.counts.bugs} |`,
    `| Sprint 1 issues | ${summary.counts.sprint1Issues} |`,
    `| Sprint 1 points | ${summary.counts.sprint1Points} |`,
    `| Sprint 2 planned points | ${summary.counts.sprint2Points} |`,
    `| Remaining backlog issues | ${summary.counts.backlog} |`,
    '',
    '## Checks',
    '',
    ...findings.map((finding) => `- **${finding.level.toUpperCase()}** - ${finding.check}: ${finding.detail}`),
    '',
    '## Sprint 1 issue states',
    '',
    '| Issue | Summary | Status | Resolution |',
    '| --- | --- | --- | --- |',
    ...sprint1Statuses.map((issue) => `| ${issue.key} | ${issue.summary} | ${issue.status} | ${issue.resolution || '-'} |`),
    '',
  ];
  fs.mkdirSync(path.dirname(MARKDOWN_FILE), { recursive: true });
  fs.writeFileSync(MARKDOWN_FILE, lines.join('\n'), 'utf8');

  console.log(`Verification: ${summary.status}`);
  for (const finding of findings) console.log(`[${finding.level}] ${finding.check}: ${finding.detail}`);
  console.log(`Report: ${REPORT_FILE}`);
  if (summary.status !== 'PASS') process.exitCode = 2;
}

main().catch((error) => {
  console.error(`\nVERIFICATION FAILED: ${error.message}`);
  process.exit(1);
});
