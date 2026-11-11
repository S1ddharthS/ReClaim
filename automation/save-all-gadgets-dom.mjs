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
  const closePanel = page.getByRole('button', { name: /close the add gadget panel/i });
  if (await closePanel.count()) await closePanel.first().click().catch(() => {});
  await page.waitForTimeout(1000);

  // 1. Submit Sprint Health (10006)
  console.log('Submitting Sprint Health...');
  const healthBtn = page.locator('form').filter({ has: page.locator('#10006-board-type') }).locator('input[type="submit"]');
  if (await healthBtn.count()) {
    await healthBtn.click();
    await page.waitForTimeout(2500);
    console.log('Clicked Sprint Health save');
  }

  // 2. Submit Assigned to Me
  console.log('Submitting Assigned to Me...');
  const assignedForm = page.locator('form').filter({ has: page.locator('[id$="-number-results"]') }).filter({ hasNot: page.locator('[id$="-saved-filter"]') });
  if (await assignedForm.count()) {
    const btn = assignedForm.first().locator('input[type="submit"]');
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(2500);
      console.log('Clicked Assigned to Me save');
    }
  }

  // 3. Configure and submit Pie Chart (10008)
  console.log('Submitting Pie Chart...');
  await page.evaluate(() => {
    const picker = document.getElementById('10008-project-filter-picker');
    if (!picker) return;
    const form = picker.closest('form');
    if (!form) return;

    const idInput = form.querySelector('input[name="id"]');
    if (idInput) idInput.value = 'project-10000';
    const typeInput = form.querySelector('input[name="type"]');
    if (typeInput) typeInput.value = 'project';
    const nameInput = form.querySelector('input[name="name"]');
    if (nameInput) nameInput.value = 'ReClaim';

    const filterId = document.getElementById('filter_10008-project-filter-picker_id');
    if (filterId) filterId.value = 'project-10000';
    const filterName = document.getElementById('filter_10008-project-filter-picker_name');
    if (filterName) filterName.value = 'ReClaim';
    picker.value = 'ReClaim';

    const statType = document.getElementById('10008-stat-type');
    if (statType) statType.value = 'statuses';
  });

  const pieBtn = page.locator('form').filter({ has: page.locator('#10008-project-filter-picker') }).locator('input[type="submit"]');
  if (await pieBtn.count()) {
    await pieBtn.click();
    await page.waitForTimeout(2500);
    console.log('Clicked Pie Chart save');
  }

  // 4. Configure and submit Filter Results (10004)
  console.log('Submitting Filter Results...');
  await page.evaluate(() => {
    const sel = document.getElementById('10004-saved-filter');
    if (!sel) return;
    const form = sel.closest('form');
    if (!form) return;

    let opt = sel.querySelector('option[value="filter-10002"]');
    if (!opt) {
      opt = document.createElement('option');
      opt.value = 'filter-10002';
      opt.text = 'RECL Sprint 1 - Completed Result (7 items, 26 points)';
      sel.appendChild(opt);
    }
    opt.selected = true;

    const filterId = document.getElementById('filter_10004-saved-filter_id');
    if (filterId) filterId.value = 'filter-10002';
    const filterName = document.getElementById('filter_10004-saved-filter_name');
    if (filterName) filterName.value = 'RECL Sprint 1 - Completed Result (7 items, 26 points)';
    const field = document.getElementById('10004-saved-filter-field');
    if (field) field.value = 'RECL Sprint 1 - Completed Result (7 items, 26 points)';
  });

  const filterBtn = page.locator('form').filter({ has: page.locator('#10004-saved-filter') }).locator('input[type="submit"]');
  if (await filterBtn.count()) {
    await filterBtn.click();
    await page.waitForTimeout(2500);
    console.log('Clicked Filter Results save');
  }

  // Click Done editing if visible
  const doneEditing = page.getByRole('button', { name: /Done editing|Save changes|Done/i }).first();
  if (await doneEditing.count()) {
    await doneEditing.click().catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Go to view page
  await page.goto(`${site}/jira/dashboards/10001`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'evidence/exports/dashboard-final-view.png' });
  console.log('Captured dashboard-final-view.png');

  const text = await page.locator('body').innerText();
  const unconfigured = (text.match(/This gadget hasn't been configured yet/g) || []).length;
  console.log('Remaining unconfigured gadgets:', unconfigured);

} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

