import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig } from './lib/config.mjs';

const config = requireJiraConfig(loadEnv());
const client = new JiraClient(config);

const replacements = [
  ['RECL Sprint 1 - Registry & Verification', 'Sprint 1 - Foundation'],
  ['RECL Sprint 2 - Discovery & Reservations', 'Sprint 2 - Find Materials'],
  ['RECL Sprint 1 - Registry', 'Sprint 1 - Foundation'],
  ['RECL Sprint 2 - Discovery', 'Sprint 2 - Find Materials'],
];

function replaceInAdf(node) {
  let changed = false;
  if (!node || typeof node !== 'object') return changed;
  if (node.type === 'text' && typeof node.text === 'string') {
    let text = node.text;
    for (const [from, to] of replacements) text = text.split(from).join(to);
    if (text !== node.text) {
      node.text = text;
      changed = true;
    }
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) changed = replaceInAdf(child) || changed;
  }
  return changed;
}

const issues = await client.search('project = RECL ORDER BY key ASC', ['description'], 100);
for (const issue of issues) {
  const description = issue.fields.description;
  if (!description) continue;
  if (replaceInAdf(description)) {
    await client.put(`/rest/api/3/issue/${issue.key}`, { fields: { description } });
    console.log(`Updated description: ${issue.key}`);
  }
}
console.log('Description sprint-name sync complete.');
