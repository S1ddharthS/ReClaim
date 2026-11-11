import { chromium } from 'playwright-core';

const site = 'https://sjec-team-xyntwxhy.atlassian.net';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 60000 });
const context = browser.contexts()[0];
const page = await context.newPage();

try {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(`${site}/jira/dashboards/10001/edit`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  // Close add gadget drawer if open
  try {
    const closePanel = page.getByRole('button', { name: /close the add gadget panel/i });
    if (await closePanel.count()) await closePanel.first().click().catch(() => {});
  } catch (e) {
    console.log('closePanel error:', e.message);
  }
  await page.waitForTimeout(1000);

  // Let's check which gadgets currently have submit buttons:
  const formsData = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('form')).map((f, i) => ({
      i,
      id: f.id,
      text: f.innerText.slice(0, 60).replace(/\n/g, ' '),
      hasSubmit: !!f.querySelector('input[type="submit"], button[type="submit"]')
    }));
  });
  console.log('Forms with submit:', JSON.stringify(formsData, null, 2));

} catch (err) {
  console.error('TOP LEVEL ERROR:', err);
} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

