import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { ROOT, writeJson } from './lib/config.mjs';

const AUTH_DIR = path.join(ROOT, 'automation', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'jira-storage.json');
const SITES_FILE = path.join(AUTH_DIR, 'sites.json');
const SHOT_FILE = path.join(ROOT, 'evidence', 'exports', 'login-sites.png');

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!executablePath) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');

fs.mkdirSync(AUTH_DIR, { recursive: true });
const browser = await chromium.launch({
  executablePath,
  headless: false,
  timeout: 30000,
  args: ['--start-maximized', '--no-first-run', '--no-default-browser-check'],
});
const context = await browser.newContext({
  viewport: null,
  storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
});
const page = await context.newPage();
await page.goto('https://id.atlassian.com/login?continue=https%3A%2F%2Fstart.atlassian.com%2F', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(2500);

console.log('\nATLASSIAN SIGN-IN WINDOW OPEN');
console.log('Sign in with the account that owns your Jira site.');
console.log('This helper waits up to 10 minutes; the browser also shows a token page after sign-in.\n');

async function loggedIn() {
  const url = page.url();
  if (url.includes('id.atlassian.com') || /\/login/i.test(url)) return false;
  return true;
}

for (let attempt = 0; attempt < 300; attempt += 1) {
  if (await loggedIn()) break;
  await page.waitForTimeout(2000);
  if (attempt % 15 === 0 && attempt > 0) console.log(`Waiting for sign-in... ${attempt * 2}s`);
}
if (!(await loggedIn())) {
  console.error('Timed out waiting for sign-in.');
  await browser.close();
  process.exit(1);
}

await page.waitForTimeout(3000);
await context.storageState({ path: AUTH_FILE });
console.log(`Saved browser session: ${AUTH_FILE}`);

await page.goto('https://start.atlassian.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: SHOT_FILE, fullPage: true }).catch(() => {});

const links = await page.locator('a').evaluateAll((anchors) =>
  anchors
    .map((anchor) => ({ text: (anchor.innerText || '').trim(), href: anchor.href }))
    .filter((item) => item.href && /atlassian\.net|start\.atlassian\.com\/.*\/(jira|wiki)/i.test(item.href))
);
const unique = [];
for (const link of links) {
  if (!unique.some((item) => item.href === link.href)) unique.push(link);
}

const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 6000);
writeJson(SITES_FILE, {
  generatedAt: new Date().toISOString(),
  startUrl: page.url(),
  links: unique,
  body,
});
console.log('\nDetected Atlassian sites/links:');
for (const link of unique) console.log(`- ${link.text || '(no text)'} -> ${link.href}`);
console.log(`\nSites snapshot: ${SITES_FILE}`);
console.log(`Login screenshot: ${SHOT_FILE}`);

// Leave the browser open on the token page so the user can create a token.
await page.goto('https://id.atlassian.com/manage-profile/security/api-tokens', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(4000);
console.log('\nAPI token page opened. If automatic provisioning is blocked, create a token there.');
console.log('The browser will stay open for 2 minutes; then it closes. Use the token page before it closes.');
await page.waitForTimeout(120000);
await browser.close();
