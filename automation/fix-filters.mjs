import fs from 'node:fs';
import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig } from './lib/config.mjs';

const config = requireJiraConfig(loadEnv());
const client = new JiraClient(config);

for (const id of [10005, 10006, 10007]) {
  await client.delete(`/rest/api/3/filter/${id}`);
  console.log(`Deleted duplicate filter ${id}`);
}

const fixes = [
  { id: 10001, jql: 'project = RECL AND sprint = 3 ORDER BY key ASC' },
  { id: 10002, jql: 'project = RECL AND sprint = 3 AND status = Done ORDER BY key ASC' },
  { id: 10003, jql: 'project = RECL AND sprint = 4 ORDER BY key ASC' },
];
for (const fix of fixes) {
  const current = await client.get(`/rest/api/3/filter/${fix.id}`);
  const updated = await client.put(`/rest/api/3/filter/${fix.id}`, {
    name: current.name,
    description: current.description,
    jql: fix.jql,
  });
  console.log(`Updated ${fix.id}: ${updated.name}\n  ${updated.jql}`);
}
