import path from 'node:path';
import { requireJiraConfig, readJson, ROOT } from './lib/config.mjs';
import { JiraClient } from './lib/jira.mjs';
import { storyDescription } from './lib/adf.mjs';

const cfg = requireJiraConfig();
const client = new JiraClient(cfg);

const state = readJson(path.join(ROOT, 'evidence', 'exports', 'jira-state.json'));
const epics = readJson(path.join(ROOT, 'jira', 'data', 'epics.json'));
const sprints = readJson(path.join(ROOT, 'jira', 'data', 'sprints.json'));

const allStories = [
  ...readJson(path.join(ROOT, 'jira', 'data', 'stories-foundation.json')),
  ...readJson(path.join(ROOT, 'jira', 'data', 'stories-discovery.json')),
  ...readJson(path.join(ROOT, 'jira', 'data', 'stories-delivery.json')),
];

console.log('Simplifying language on live Jira project (RECL)...');

for (const story of allStories) {
  if (story.type === 'Bug') continue; // BUG-01 was already updated
  const key = state.issues[story.id]?.key;
  if (!key) continue;

  const epic = epics.find((e) => e.id === story.epic) || { summary: 'General' };
  const sprint = sprints.find((s) => s.id === story.sprint) || null;
  const desc = storyDescription(story, epic, sprint);

  try {
    await client.put(`/rest/api/3/issue/${key}`, {
      fields: {
        description: desc,
      },
    });
    console.log(`Updated ${key} (${story.id}): ${story.summary}`);
  } catch (err) {
    console.error(`Failed to update ${key}: ${err.message}`);
  }
}

console.log('Done updating Jira stories with simplified language!');

