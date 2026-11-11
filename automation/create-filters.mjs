import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig } from './lib/config.mjs';

const config = requireJiraConfig(loadEnv());
const client = new JiraClient(config);

// Team-managed projects resolve the sprint field by ID in JQL. Filtering by
// sprint name returns no rows (and makes dashboard gadgets fail), so the saved
// filters deliberately use the numeric sprint IDs: 3 = Sprint 1, 4 = Sprint 2.
const filters = [
  {
    name: 'Sprint 1 - Committed Scope (26 pts)',
    description: 'Sprint 1 committed scope: 6 user stories plus defect BUG-01. Closed with 0 carry-over.',
    jql: 'project = RECL AND sprint = 3 ORDER BY key ASC',
  },
  {
    name: 'Sprint 1 - Completed Result (26 pts)',
    description: 'Completed Sprint 1 result: all 7 items are Done and verified.',
    jql: 'project = RECL AND sprint = 3 AND status = Done ORDER BY key ASC',
  },
  {
    name: 'Sprint 2 - Active Scope (23 pts)',
    description: 'Sprint 2 active scope: 5 user stories selected for discovery and material requests.',
    jql: 'project = RECL AND sprint = 4 ORDER BY key ASC',
  },
  {
    name: 'RECL - Assigned Work (Siddharth Sanjay)',
    description: 'All ReClaim (RECL) work assigned to the project owner for this solo Scrum assignment.',
    jql: 'project = RECL AND assignee = currentUser() ORDER BY key ASC',
  },
];

const existing = await client.get('/rest/api/3/filter/search', {
  query: { filterName: 'RECL', maxResults: 100 },
});
const byName = new Map((existing.values || []).map((filter) => [filter.name, filter]));

for (const spec of filters) {
  const found = byName.get(spec.name);
  if (found) {
    const updated = await client.put(`/rest/api/3/filter/${found.id}`, spec);
    console.log(`Updated filter ${found.id}: ${spec.name}`);
  } else {
    const created = await client.post('/rest/api/3/filter', { ...spec, favourite: true });
    console.log(`Created filter ${created.id}: ${spec.name}`);
  }
}

const all = await client.get('/rest/api/3/filter/search', { query: { filterName: 'RECL', maxResults: 100 } });
console.log('\nSaved filters:');
for (const filter of all.values || []) {
  console.log(`${filter.id} | ${filter.name} | ${filter.jql}`);
}
