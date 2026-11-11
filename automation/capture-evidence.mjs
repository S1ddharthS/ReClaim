import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { ROOT, readJson, writeJson } from './lib/config.mjs';

const STATE_FILE = path.join(ROOT, 'evidence', 'exports', 'jira-state.json');
const SHOT_DIR = path.join(ROOT, 'evidence', 'screenshots');
const MANIFEST_FILE = path.join(SHOT_DIR, 'manifest.json');
const CDP_URL = process.env.JIRA_CDP_URL || 'http://127.0.0.1:9223';

const state = readJson(STATE_FILE);
const site = state.siteUrl.replace(/\/+$/, '');
const filters = state.filters || {};
const captures = [];

async function dismissOverlays(page) {
  for (const name of [/^Got it$/i, /accept all/i, /^Accept$/i]) {
    const button = page.getByRole('button', { name });
    if (await button.count()) await button.first().click({ timeout: 3000 }).catch(() => {});
  }
  const dismiss = page.getByText('Dismiss', { exact: true });
  if (await dismiss.count()) await dismiss.first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function waitForText(page, text, timeout = 30000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
  } catch {
    // A changed label should not block the screenshot; the visual check catches it later.
  }
}

async function open(page, url, expectedText, viewport = { width: 1920, height: 1200 }) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
  await dismissOverlays(page);
  if (expectedText) await waitForText(page, expectedText);
  await page.waitForTimeout(1200);
}

async function shot(page, file, label) {
  const target = path.join(SHOT_DIR, file);
  await page.screenshot({ path: target, fullPage: false, animations: 'disabled' });
  const stat = fs.statSync(target);
  const entry = {
    file: path.relative(ROOT, target).replaceAll('\\', '/'),
    label,
    url: page.url(),
    title: await page.title().catch(() => ''),
    bytes: stat.size,
    capturedAt: new Date().toISOString(),
  };
  captures.push(entry);
  console.log(`Saved ${file} (${(stat.size / 1024).toFixed(0)} KB) -> ${page.url()}`);
  return entry;
}

const browser = await chromium.connectOverCDP(CDP_URL, { timeout: 60000 });
const context = browser.contexts()[0];
const page = await context.newPage();

try {
  // 01 - Project summary / creation evidence
  await open(page, state.projectUrl, 'ReClaim');
  await shot(page, '01_Project_Dashboard.png', 'Jira project ReClaim (RECL) summary dashboard');

  // 02 - Product backlog
  await open(
    page,
    state.backlogUrl,
    'Sprint 2 - Find Materials',
    { width: 1920, height: 1200 }
  );
  await waitForText(page, 'Backlog');
  await shot(page, '02_Product_Backlog.png', 'Product backlog with active Sprint 2 and remaining backlog');

  // 03 - Story with description and acceptance criteria
  await open(page, `${site}/browse/RECL-25`, 'Acceptance Criteria');
  await waitForText(page, 'Match Material Requests');
  await shot(
    page,
    '03_User_Story_Details.png',
    'User story RECL-25 with description, acceptance criteria, epic, sprint and story points'
  );

  // 04 - Sprint 1 planning / committed scope
  await open(page, filters.sprint1Scope?.url || `${site}/issues/?filter=10001`, 'Sprint 1 - Committed Scope');
  await waitForText(page, 'Story point estimate');
  await shot(
    page,
    '04_Sprint_1_Planning.png',
    'Sprint 1 committed scope: 7 items, 26 story points, all assigned'
  );

  // 05 - Scrum board during execution with Sprint insights open
  await open(page, state.boardUrl, 'To Do', { width: 1920, height: 880 });
  const insights = page.getByRole('button', { name: 'Sprint insights', exact: true });
  if (await insights.count()) {
    await insights.first().click({ timeout: 10000 }).catch(() => {});
    await waitForText(page, 'Sprint progress');
    await page.waitForTimeout(2500);
  }
  await shot(
    page,
    '05_Scrum_Board_Execution.png',
    'Scrum board during Sprint 2 execution with Sprint insights panel'
  );

  // 06 - Assigned issues
  await open(
    page,
    filters.assignedWork?.url || `${site}/issues/?filter=10004`,
    'RECL - Assigned Work',
    { width: 1920, height: 1080 }
  );
  await waitForText(page, 'Siddharth Sanjay');
  await shot(page, '06_Assigned_Issues.png', 'All ReClaim work assigned to Siddharth Sanjay');

  // 07 - Bug created and resolved
  await open(page, `${site}/browse/RECL-33`, 'Bug Report', { width: 1920, height: 1200 });
  await waitForText(page, 'Resolution');
  const completedSprint = page.getByText('+1', { exact: true });
  if (await completedSprint.count()) {
    await completedSprint.first().click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  await shot(
    page,
    '07_Bug_Tracking.png',
    'Bug RECL-33: High severity, Done, in Sprint 1, resolution and fix verification'
  );

  // 08 - Sprint 1 completed result (saved filter report)
  await open(
    page,
    filters.sprint1Result?.url || `${site}/issues/?filter=10002`,
    'Sprint 1 - Completed Result'
  );
  const jqlToggle = page.getByText('JQL', { exact: true });
  if (await jqlToggle.count()) {
    await jqlToggle.first().click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2500);
  }
  await shot(
    page,
    '08_Sprint_1_Report.png',
    'Sprint 1 completed result: 7 of 7 items Done, 26 story points'
  );

  // 09 - Sprint 2 board with sprint dates
  await open(page, state.boardUrl, 'To Do');
  const sprintDetails = page.getByRole('button', { name: 'Sprint details', exact: true });
  if (await sprintDetails.count()) {
    await sprintDetails.first().click({ timeout: 10000 }).catch(() => {});
    await waitForText(page, 'Start date');
    await page.waitForTimeout(1500);
  }
  await shot(
    page,
    '09_Sprint_2_Board.png',
    'Sprint 2 board with sprint dates, 4 To Do and 1 In Progress'
  );

  // 10 - Final project summary / report
  await open(page, state.projectUrl, 'ReClaim', { width: 1920, height: 1600 });
  await page.waitForTimeout(1500);
  await shot(
    page,
    '10_Final_Dashboard.png',
    'Final ReClaim project summary: status, priority and work type breakdown'
  );
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}

writeJson(MANIFEST_FILE, {
  generatedAt: new Date().toISOString(),
  site,
  projectKey: state.projectKey,
  captures,
});
console.log(`\nCaptured ${captures.length} screenshots. Manifest: ${MANIFEST_FILE}`);
