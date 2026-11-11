import { chromium } from 'playwright-core';

const site = 'https://sjec-team-xyntwxhy.atlassian.net';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 60000 });
const context = browser.contexts()[0];
const page = await context.newPage();

try {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(`${site}/jira/dashboards/10001/edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);

  // Close add gadget drawer if open
  const closePanel = page.getByRole('button', { name: /close the add gadget panel/i });
  if (await closePanel.count()) await closePanel.first().click().catch(() => {});
  await page.waitForTimeout(1000);

  // Each gadget on Jira dashboard is inside a container, usually with class .gadget or div[id^="gadget-"]
  const gadgets = page.locator('.gadget, div[id^="gadget-"]');
  const count = await gadgets.count();
  console.log(`Gadget count: ${count}`);

  for (let i = 0; i < count; i++) {
    const g = gadgets.nth(i);
    const title = (await g.locator('.dashboard-item-title, h3, .gadget-title').innerText().catch(() => '')).trim();
    const hasForm = await g.locator('form').count();
    const saveBtn = await g.locator('input[value="Save"], button:has-text("Save")').count();
    console.log(`Gadget ${i}: title="${title}", hasForm=${hasForm}, saveButtons=${saveBtn}`);
  }

} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

