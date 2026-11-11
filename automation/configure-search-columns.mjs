import { chromium } from 'playwright-core';

const site = process.env.JIRA_BASE_URL || 'https://sjec-team-xyntwxhy.atlassian.net';
const cdpUrl = process.env.JIRA_CDP_URL || 'http://127.0.0.1:9223';
const filterIds = (process.argv.slice(2).filter((arg) => /^\d+$/.test(arg)).length
  ? process.argv.slice(2).filter((arg) => /^\d+$/.test(arg))
  : ['10001', '10002', '10003', '10004']);

const wanted = new Map([
  ['Work item key', true],
  ['Summary', true],
  ['Assignee', true],
  ['Priority', true],
  ['Status', true],
  ['Story point estimate', true],
  ['Work type', true],
  ['Reporter', false],
  ['Resolution', false],
  ['Created', false],
  ['Updated', false],
  ['Due date', false],
  ['Sprint', false],
]);

const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0];
const page = await context.newPage();
await page.setViewportSize({ width: 1600, height: 1000 });

for (const filterId of filterIds) {
  await page.goto(`${site}/issues/?filter=${filterId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  const gotIt = page.getByRole('button', { name: /^Got it$/ }).first();
  if (await gotIt.count()) {
    await gotIt.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await page.getByRole('button', { name: /configure columns/i }).first().click();
  await page.waitForTimeout(1800);

  const filterTab = page.getByRole('tab', { name: /Filter/ }).first();
  await filterTab.click().catch(() => {});
  await page.waitForTimeout(800);

  for (const [field, select] of wanted) {
    const option = page.getByRole('option', { name: field, exact: true }).first();
    if (!(await option.count())) {
      console.log(`  ${filterId}: option "${field}" not found`);
      continue;
    }
    const selected = (await option.getAttribute('aria-selected')) === 'true';
    if (selected !== select) {
      const box = await option.boundingBox();
      if (!box) {
        console.log(`  ${filterId}: option "${field}" not visible, scrolling`);
        await option.scrollIntoViewIfNeeded().catch(() => {});
      }
      await option.click({ force: true });
      await page.waitForTimeout(350);
      console.log(`  ${filterId}: ${select ? 'added' : 'removed'} ${field}`);
    }
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(1800);
  const body = await page.locator('body').innerText();
  const headers = ['Work', 'Assignee', 'Priority', 'Status', 'Story point estimate', 'Work type'].filter((name) =>
    new RegExp(`More actions for ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(body)
  );
  console.log(`${filterId}: columns -> ${headers.join(', ')}`);
}

await page.close();
await browser.close();
