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

  const forms = page.locator('form');
  
  // 1. Save Sprint burndown gadget (Form 4)
  console.log('Saving Sprint burndown gadget...');
  const burndownSave = forms.nth(4).locator('input[type="submit"], button[type="submit"], input[value="Save"], button:has-text("Save")').first();
  await burndownSave.click();
  await page.waitForTimeout(3000);

  // 2. Save Sprint health gadget (Form 6)
  console.log('Saving Sprint health gadget...');
  const healthSave = forms.nth(6).locator('input[type="submit"], button[type="submit"], input[value="Save"], button:has-text("Save")').first();
  await healthSave.click();
  await page.waitForTimeout(3000);

  // 3. Save Assigned to me gadget (Form 8)
  console.log('Saving Assigned to me gadget...');
  const assignedSave = forms.nth(8).locator('input[type="submit"], button[type="submit"], input[value="Save"], button:has-text("Save")').first();
  await assignedSave.click();
  await page.waitForTimeout(3000);

  // 4. For Pie chart (Form 2)
  console.log('Configuring Pie chart gadget...');
  const pieForm = forms.nth(2);
  const pieInput = pieForm.locator('[id$="quickfind-field"], [id$="project-or-filter-field"], [id$="projectOrFilterId-field"], input[type="text"]').first();
  if (await pieInput.count()) {
    await pieInput.click();
    await pieInput.fill('ReClaim');
    await page.waitForTimeout(2000);
    const suggestion = page.locator('.aui-list-item, [role="option"]').filter({ hasText: /ReClaim/i }).first();
    if (await suggestion.count()) {
      await suggestion.click();
      console.log('Selected ReClaim project for Pie chart');
      await page.waitForTimeout(1000);
    }
    const pieSave = pieForm.locator('input[type="submit"], button[type="submit"], input[value="Save"], button:has-text("Save")').first();
    await pieSave.click();
    await page.waitForTimeout(3000);
  }

  // Done button on dashboard edit page
  const doneEditing = page.getByRole('button', { name: /Done editing|Save changes|Done/i }).first();
  if (await doneEditing.count()) {
    await doneEditing.click();
    console.log('Clicked Done editing');
    await page.waitForTimeout(3000);
  }

  // Navigate to dashboard view
  await page.goto(`${site}/jira/dashboards/10001`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'evidence/exports/dashboard-saved-view.png' });
  console.log('Saved evidence/exports/dashboard-saved-view.png');

  const bodyText = await page.locator('body').innerText();
  console.log('Body summary:', bodyText.slice(0, 1500).replace(/\n+/g, ' '));

} finally {
  await page.close().catch(() => {});
  process.exit(0);
}

