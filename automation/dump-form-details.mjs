import { chromium } from 'playwright-core';

const site = 'https://sjec-team-xyntwxhy.atlassian.net';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 60000 });
const context = browser.contexts()[0];
const page = await context.newPage();

try {
  await page.goto(`${site}/jira/dashboards/10001/edit`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  const info = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.map((f, i) => {
      const inputs = Array.from(f.querySelectorAll('input, select, textarea')).map((el) => ({
        tag: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        value: el.value,
        visible: el.offsetParent !== null,
      }));
      return {
        index: i,
        id: f.id,
        className: f.className,
        heading: f.closest('.gadget, .dashboard-item')?.querySelector('h1, h2, h3, .gadget-title, .dashboard-item-title')?.textContent?.trim() || '',
        inputs,
      };
    });
  });

  console.log(JSON.stringify(info, null, 2));
} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

