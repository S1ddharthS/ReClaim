import { JiraClient } from './lib/jira.mjs';
import { loadEnv, requireJiraConfig } from './lib/config.mjs';

async function main() {
  const config = requireJiraConfig(loadEnv());
  const client = new JiraClient(config);
  const me = await client.myself();
  console.log(`Connected: ${config.baseUrl}`);
  console.log(`User:      ${me.displayName || '(no display name)'} <${me.emailAddress || 'hidden'}>`);
  console.log(`Account:   ${me.accountId}`);
  console.log(`Timezone:  ${me.timeZone || 'not reported'}`);

  const project = await client.getProject(config.projectKey);
  if (project) {
    console.log(`Project:   ${project.name} (${project.key}) - ${project.style || (project.simplified ? 'team-managed' : 'company-managed')}`);
    console.log(`Project ID: ${project.id}`);
  } else {
    console.log(`Project:   ${config.projectKey} does not exist yet; provisioning will create it.`);
  }

  const boards = await client.get('/rest/agile/1.0/board', {
    query: { projectKeyOrId: config.projectKey, maxResults: 50 },
  });
  console.log(`Boards:    ${(boards.values || []).map((board) => `${board.name} [${board.type}] (${board.id})`).join(', ') || 'none yet'}`);
}

main().catch((error) => {
  console.error(`\nCHECK FAILED: ${error.message}`);
  process.exit(1);
});
