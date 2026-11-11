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

  // Find all forms with a submit/save button
  const forms = page.locator('form');
  const count = await forms.count();
  console.log(`Found ${count} forms`);

  for (let i = 0; i < count; i++) {
    const form = forms.nth(i);
    const formText = (await form.innerText().catch(() => '')).slice(0, 100).replace(/\n/g, ' ');
    const saveBtn = form.locator('input[type="submit"], button[type="submit"], input[value="Save"], button:has-text("Save")');
    const saveCount = await saveBtn.count();
    console.log(`Form ${i}: text="${formText}", save buttons=${saveCount}`);
  }

} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

