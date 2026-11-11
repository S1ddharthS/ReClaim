import path from 'node:path';
import { requireJiraConfig, readJson, writeJson, ROOT } from './lib/config.mjs';
import { JiraClient } from './lib/jira.mjs';
import { storyDescription, bugDescription, epicDescription } from './lib/adf.mjs';

const cfg = requireJiraConfig();
const client = new JiraClient(cfg);

const statePath = path.join(ROOT, 'evidence', 'exports', 'jira-state.json');
const state = readJson(statePath);

const epicsPath = path.join(ROOT, 'jira', 'data', 'epics.json');
const sprintsPath = path.join(ROOT, 'jira', 'data', 'sprints.json');
const foundPath = path.join(ROOT, 'jira', 'data', 'stories-foundation.json');
const discPath = path.join(ROOT, 'jira', 'data', 'stories-discovery.json');
const delivPath = path.join(ROOT, 'jira', 'data', 'stories-delivery.json');

const epics = readJson(epicsPath);
const sprints = readJson(sprintsPath);
const foundStories = readJson(foundPath);
const discStories = readJson(discPath);
const delivStories = readJson(delivPath);

// Simplified mappings for issue summaries (titles)
const simplifiedSummaries = {
  // Epics
  'E1': 'Register Organizations & Add Materials',
  'E2': 'Check & Verify Materials',
  'E3': 'Find Materials Easily',
  'E4': 'Reservations & Deliveries',
  'E5': 'Environmental Impact & Admin',
  // Stories
  'US-01': 'Add Organization',
  'US-02': 'Add Surplus Material',
  'US-03': 'Manage Stock & Inventory',
  'US-04': 'Inspect Material Quality',
  'US-05': 'Check Material Status',
  'US-06': 'Handle Expired Listings',
  'US-07': 'Search Materials',
  'US-08': 'Find Nearby Materials',
  'US-09': 'Match Material Requests',
  'US-10': 'Request Material',
  'US-11': 'Approve Material Requests',
  'US-12': 'Track Material Delivery',
  'US-13': 'Fix Quantity Mismatch on Delivery',
  'US-14': 'Track Environmental Savings',
  'US-15': 'Manager Overview Dashboard',
  'US-16': 'Manage User Accounts',
  // Defect
  'BUG-01': 'Reserved Stock Incorrectly Remains Available in Inventory',
};

console.log('=== Updating Jira Website Directly ===\n');

// 1. Update Project
console.log('1. Updating Project Details...');
try {
  await client.put('/rest/api/3/project/RECL', {
    description: 'ReClaim - Industrial Surplus Intelligence & Resource Recovery Platform (Easy Material Reuse)'
  });
  console.log('-> Project description updated successfully.');
} catch (err) {
  console.error('-> Project update error:', err.message);
}

// 2. Update Sprints
console.log('\n2. Updating Sprints...');
try {
  const s3 = await client.get('/rest/agile/1.0/sprint/3');
  await client.put('/rest/agile/1.0/sprint/3', {
    name: 'Sprint 1 - Foundation',
    startDate: s3.startDate,
    endDate: s3.endDate,
    state: s3.state,
    goal: 'Allow organizations to sign up, add leftover materials, check stock, and set up inspections.'
  });
  console.log('-> Sprint 1 (id: 3) updated: Sprint 1 - Foundation');
} catch (err) {
  console.error('-> Sprint 1 update error:', err.message);
}

try {
  const s4 = await client.get('/rest/agile/1.0/sprint/4');
  await client.put('/rest/agile/1.0/sprint/4', {
    name: 'Sprint 2 - Find Materials',
    startDate: s4.startDate,
    endDate: s4.endDate,
    state: s4.state,
    goal: 'Help buyers find materials, check nearby listings, and submit material requests.'
  });
  console.log('-> Sprint 2 (id: 4) updated: Sprint 2 - Find Materials');
} catch (err) {
  console.error('-> Sprint 2 update error:', err.message);
}

// 3. Update Epics in Jira
console.log('\n3. Updating Epics in Jira...');
for (const epic of epics) {
  const key = state.issues[epic.id]?.key;
  if (!key) continue;
  const newSummary = simplifiedSummaries[epic.id] || epic.summary;
  epic.summary = newSummary;
  const desc = epicDescription(epic);

  try {
    await client.put(`/rest/api/3/issue/${key}`, {
      fields: {
        summary: newSummary,
        description: desc
      }
    });
    console.log(`-> Updated Epic ${key} (${epic.id}): ${newSummary}`);
    if (state.issues[epic.id]) state.issues[epic.id].summary = newSummary;
  } catch (err) {
    console.error(`-> Failed to update Epic ${key}:`, err.message);
  }
}

// 4. Update Stories and Bug in Jira
console.log('\n4. Updating User Stories and Bug in Jira...');
const allStories = [...foundStories, ...discStories, ...delivStories];

for (const story of allStories) {
  const key = state.issues[story.id]?.key;
  if (!key) continue;

  const newSummary = simplifiedSummaries[story.id] || story.summary;
  story.summary = newSummary;

  const epic = epics.find((e) => e.id === story.epic) || { summary: 'General' };
  const sprint = sprints.find((s) => s.id === story.sprint) || null;

  const desc = story.type === 'Bug' ? bugDescription(story, epic, sprint) : storyDescription(story, epic, sprint);

  try {
    await client.put(`/rest/api/3/issue/${key}`, {
      fields: {
        summary: newSummary,
        description: desc
      }
    });
    console.log(`-> Updated ${key} (${story.id}): ${newSummary}`);
    if (state.issues[story.id]) state.issues[story.id].summary = newSummary;
  } catch (err) {
    console.error(`-> Failed to update ${key}:`, err.message);
  }
}

// 5. Update local data files
console.log('\n5. Saving synchronized data to local files...');
writeJson(epicsPath, epics);
writeJson(foundPath, foundStories);
writeJson(discPath, discStories);
writeJson(delivPath, delivStories);
writeJson(statePath, state);
console.log('-> Local JSON data files updated.');

console.log('\n=== All Jira Website Updates Completed Successfully! ===');

