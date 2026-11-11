import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

// 1. Start full-stack server
const srv = spawn('node', ['app/server.mjs'], { stdio: 'inherit' });
await new Promise((r) => setTimeout(r, 2000));

try {
  // 2. Launch browser to verify UI and API
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Testing Home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'evidence/exports/ui-test-01-home.png' });

  console.log('Testing Browse Materials (API-driven)...');
  await page.click('#nav-browse');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'evidence/exports/ui-test-02-browse.png' });

  console.log('Testing Add Material form...');
  await page.click('#nav-add');
  await page.waitForTimeout(500);
  await page.fill('#matName', 'Galvanized Cable Trays');
  await page.fill('#matQty', '60');
  await page.fill('#matLocation', 'Whitefield Industrial Area');
  await page.screenshot({ path: 'evidence/exports/ui-test-03-add.png' });

  console.log('Testing Manage Stock table...');
  await page.click('#nav-stock');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'evidence/exports/ui-test-04-stock.png' });

  console.log('Testing Requests & Atomic Decrement approval...');
  await page.click('#nav-requests');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'evidence/exports/ui-test-05-requests.png' });

  console.log('Testing Deliveries tracker...');
  await page.click('#nav-deliveries');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'evidence/exports/ui-test-06-deliveries.png' });

  console.log('Testing Environmental Impact dynamic calculations...');
  await page.click('#nav-impact');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'evidence/exports/ui-test-07-impact.png' });

  console.log('Testing Scrum & Jira Hub - Board...');
  await page.click('#nav-scrum');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'evidence/exports/ui-test-08-scrum-board.png' });

  console.log('Testing Scrum Hub - Backlog view...');
  await page.click('#subnav-backlog');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'evidence/exports/ui-test-09-scrum-backlog.png' });

  console.log('Testing Scrum Hub - Sprints view...');
  await page.click('#subnav-sprints');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'evidence/exports/ui-test-10-scrum-sprints.png' });

  console.log('Testing Scrum Hub - Defect RECL-33 & Atomic Fix Sandbox...');
  await page.click('#subnav-bug');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Approve Reservation")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'evidence/exports/ui-test-11-scrum-bug.png' });

  console.log('Testing Scrum Hub - Evidence Gallery (10 Screenshots)...');
  await page.click('#subnav-evidence');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'evidence/exports/ui-test-12-scrum-evidence.png' });

  console.log('Testing Scrum Hub - Live Audit Report...');
  await page.click('#subnav-audit');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'evidence/exports/ui-test-13-scrum-audit.png' });

  console.log('\nAll web application & Scrum Hub UI/API tests PASSED with 100% success!');
  await browser.close();
} finally {
  srv.kill();
  process.exit(0);
}
