import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

export function loadEnv(file = path.join(ROOT, '.env')) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      let value = rawValue.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
  return process.env;
}

export function requireJiraConfig(env = loadEnv()) {
  const baseUrl = (env.JIRA_BASE_URL || '').replace(/\/+$/, '');
  const email = env.JIRA_EMAIL || '';
  const token = env.JIRA_API_TOKEN || '';
  const cookie = (env.JIRA_COOKIE || '').trim();
  const xsrfToken = (env.JIRA_XSRF_TOKEN || '').trim();
  const missing = [];
  if (!baseUrl) missing.push('JIRA_BASE_URL');
  if (!email) missing.push('JIRA_EMAIL');
  if (!token && !cookie) missing.push('JIRA_API_TOKEN or JIRA_COOKIE');
  if (missing.length) {
    throw new Error(
      `Missing Jira configuration: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values. Do not commit .env.'
    );
  }
  if (!/^https:\/\/[^/]+\.atlassian\.net$/.test(baseUrl)) {
    throw new Error(
      'JIRA_BASE_URL must look like https://your-site.atlassian.net (no path).'
    );
  }
  return {
    baseUrl,
    email,
    token,
    cookie,
    xsrfToken,
    authMode: cookie ? 'cookie' : 'basic',
    projectKey: env.JIRA_PROJECT_KEY || 'RECL',
    root: ROOT,
  };
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export { ROOT };
