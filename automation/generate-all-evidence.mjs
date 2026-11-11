import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { requireJiraConfig, ROOT } from './lib/config.mjs';

const EVIDENCE_DIR = path.join(ROOT, 'ReClaim_Evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const cfg = requireJiraConfig();
const baseUrl = cfg.baseUrl;

// Parse cookie pairs for Playwright
const cookiePairs = cfg.cookie.split('; ').map((s) => {
  const [name, ...rest] = s.split('=');
  return {
    name,
    value: rest.join('='),
    domain: '.atlassian.net',
    path: '/',
  };
});

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  locale: 'en-US',
  timezoneId: 'Asia/Kolkata',
});

await context.addCookies(cookiePairs);
const page = await context.newPage();

async function capture(url, fileName, label, { waitSelector, delay = 4000, fullPage = false } = {}) {
  console.log(`\nCapturing [${fileName}]: ${label}...`);
  console.log(`  URL: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 15000 }).catch(() => {});
  }
  await page.waitForTimeout(delay);
  const target = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: target, fullPage, animations: 'disabled' });
  const stat = fs.statSync(target);
  console.log(`  Saved: ${fileName} (${(stat.size / 1024).toFixed(1)} KB)`);
}

try {
  // 1. Project Dashboard / Summary
  await capture(
    `${baseUrl}/jira/software/projects/RECL/summary`,
    '01_Project_Dashboard.png',
    'Project creation / Project Dashboard',
    { delay: 5000 }
  );

  // 2. Product Backlog
  await capture(
    `${baseUrl}/jira/software/projects/RECL/backlog`,
    '02_Product_Backlog.png',
    'Product Backlog with User Stories and Sprints',
    { delay: 5000 }
  );

  // 3. User Story Details (RECL-20: Material Inspection)
  await capture(
    `${baseUrl}/browse/RECL-20`,
    '03_User_Story_Details.png',
    'User Story Details with Description, Acceptance Criteria, Story Points, Priority',
    { waitSelector: 'h1', delay: 4000 }
  );

  // 4. Sprint 1 Planning / Details
  // In Jira Cloud, Sprint 1 closed details or backlog with Sprint 1 filter
  await capture(
    `${baseUrl}/issues/?filter=10001`,
    '04_Sprint_1_Planning.png',
    'Sprint 1 Planning - Committed Scope (26 story points, 6 stories + 1 bug)',
    { delay: 5000 }
  );

  // 5. Scrum Board Execution
  // First let's capture the execution board
  await capture(
    `${baseUrl}/jira/software/projects/RECL/boards`,
    '05_Scrum_Board_Execution.png',
    'Scrum Board during Execution (To Do, In Progress, Done)',
    { delay: 5000 }
  );

  // 6. Assigned Issues
  await capture(
    `${baseUrl}/issues/?filter=10004`,
    '06_Assigned_Issues.png',
    'Assigned tasks/issues to Siddharth Sanjay with keys, priorities, points',
    { delay: 5000 }
  );

  // 7. Bug Tracking (RECL-33: Reserved Material Quantity Incorrectly Remains Available in Inventory)
  await capture(
    `${baseUrl}/browse/RECL-33`,
    '07_Bug_Tracking.png',
    'Bug Created and Resolved (RECL-33, High Priority, Fixed, Scenario & Criteria)',
    { waitSelector: 'h1', delay: 4000 }
  );

  // 8. Completed Sprint 1 / Sprint Report
  await capture(
    `${baseUrl}/issues/?filter=10002`,
    '08_Sprint_1_Report.png',
    'Completed Sprint 1 Result (7 items Done, 26 points, zero carry-over)',
    { delay: 5000 }
  );

  // 9. Sprint 2 Board
  await capture(
    `${baseUrl}/jira/software/projects/RECL/boards`,
    '09_Sprint_2_Board.png',
    'Sprint 2 Board (Active Sprint with In Progress and To Do work)',
    { delay: 5000 }
  );

  // 10. Final Project Dashboard
  await capture(
    `${baseUrl}/jira/dashboards/10001`,
    '10_Final_Dashboard.png',
    'Final Project Dashboard with Activity Stream and Sprint Gadgets',
    { delay: 6000 }
  );

  console.log('\nAll 10 required evidence screenshots captured successfully in ReClaim_Evidence/ !');
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
  process.exit(0);
}

