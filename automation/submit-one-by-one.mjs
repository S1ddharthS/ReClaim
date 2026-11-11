import { chromium } from 'playwright-core';

const site = 'https://sjec-team-xyntwxhy.atlassian.net';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 60000 });
const context = browser.contexts()[0];
const page = await context.newPage();

try {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(`${site}/jira/dashboards/10001/edit`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  // Close drawer
  const closePanel = page.getByRole('button', { name: /close the add gadget panel/i });
  if (await closePanel.count()) await closePanel.first().click().catch(() => {});
  await page.waitForTimeout(1000);

  // Click submit in Form 5 (Sprint health)
  console.log('Clicking Sprint Health submit...');
  const forms = page.locator('form');
  const f5Submit = forms.nth(5).locator('input[type="submit"]');
  console.log('f5 submit count:', await f5Submit.count());
  if (await f5Submit.count()) {
    await f5Submit.click();
    await page.waitForTimeout(5000);
    console.log('f5 submitted!');
  }

  // Next, click submit in Form 7 (Assigned to me) - let's find it by input[name="number-results"]
  console.log('Clicking Assigned to me submit...');
  const assignedSubmit = page.locator('form').filter({ has: page.locator('input[name="number-results"]') }).first().locator('input[type="submit"]');
  console.log('assigned submit count:', await assignedSubmit.count());
  if (await assignedSubmit.count()) {
    await assignedSubmit.click();
    await page.waitForTimeout(5000);
    console.log('assigned submitted!');
  }

  await page.screenshot({ path: 'evidence/exports/dashboard-after-submits.png' });

} catch (err) {
  console.error('Error:', err);
} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

