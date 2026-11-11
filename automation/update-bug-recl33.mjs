import { requireJiraConfig, readJson, ROOT } from './lib/config.mjs';
import { JiraClient } from './lib/jira.mjs';
import { bugDescription } from './lib/adf.mjs';
import path from 'node:path';

const cfg = requireJiraConfig();
const client = new JiraClient(cfg);

const epics = readJson(path.join(ROOT, 'jira', 'data', 'epics.json'));
const sprints = readJson(path.join(ROOT, 'jira', 'data', 'sprints.json'));
const delivery = readJson(path.join(ROOT, 'jira', 'data', 'stories-delivery.json'));
const bugDef = delivery.find((d) => d.id === 'BUG-01');
const epicDef = epics.find((e) => e.id === bugDef.epic);
const sprintDef = sprints.find((s) => s.id === bugDef.sprint);

console.log('Updating RECL-33 in Jira...');
const desc = bugDescription(bugDef, epicDef, sprintDef);

// 1. Update summary, description, and parent
await client.put('/rest/api/3/issue/RECL-33', {
  fields: {
    summary: bugDef.summary,
    description: desc,
    parent: { key: 'RECL-5' },
    labels: bugDef.labels,
  },
});
console.log('Updated RECL-33 summary, description, parent to RECL-5');

// 2. Add comments
for (const comment of bugDef.comments) {
  await client.addComment('RECL-33', comment);
}
console.log('Added bug verification comments');

// 3. Link to RECL-19 (US-03) and RECL-27 (US-11)
const existingLinks = (await client.get('/rest/api/3/issue/RECL-33')).fields.issuelinks || [];
for (const targetKey of ['RECL-19', 'RECL-27']) {
  const alreadyLinked = existingLinks.some(
    (l) => l.outwardIssue?.key === targetKey || l.inwardIssue?.key === targetKey
  );
  if (!alreadyLinked) {
    try {
      await client.post('/rest/api/3/issueLink', {
        type: { name: 'Relates' },
        inwardIssue: { key: 'RECL-33' },
        outwardIssue: { key: targetKey },
      });
      console.log(`Linked RECL-33 to ${targetKey}`);
    } catch (e) {
      console.log(`Failed linking to ${targetKey}: ${e.message}`);
    }
  } else {
    console.log(`Already linked to ${targetKey}`);
  }
}

// Verify
const updated = await client.get('/rest/api/3/issue/RECL-33');
console.log('Updated summary:', updated.fields.summary);
console.log('Parent:', updated.fields.parent?.key);
console.log('Status:', updated.fields.status.name);
console.log('Links:', updated.fields.issuelinks?.map((l) => l.outwardIssue?.key || l.inwardIssue?.key));

