# ReClaim - Jira Setup and Execution Runbook

This runbook documents how the version-controlled backlog became the live Jira Cloud Scrum project, and how the final evidence was captured. The live project is already provisioned and verified; the automated path remains reproducible.

## 1. Prerequisites

- A Jira Cloud site with Jira Software (free plan is sufficient).
- An Atlassian account that can create projects and administer the site.
- Node.js 20 or newer.
- Either a Jira API token created at <https://id.atlassian.com/manage-profile/security/api-tokens>, or an authenticated browser session cookie when token creation is unavailable.

## 2. Credentials

Create a local `.env` file in the workspace root. **Do not commit this file or paste a token or cookie into a screenshot.**

```dotenv
JIRA_BASE_URL=https://your-site.atlassian.net
JIRA_EMAIL=your-atlassian-account@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=RECL
```

If the site blocks API-token creation for the account, use the browser-session fallback instead of `JIRA_API_TOKEN`:

```dotenv
JIRA_COOKIE=atlassian.xsrf.token=...; cloud.session.token=...
```

The cookie can be copied from an authenticated Jira tab in Chrome DevTools (Application > Cookies). It expires, so refresh it before a capture run. Never commit it.

Validate the connection:

```powershell
npm run check
```

Expected output: the connected site, the Atlassian display name and account ID, the project status (exists or not) and any Scrum board.

## 3. Live project record

| Object | Live value |
| --- | --- |
| Project | `ReClaim` / key `RECL`, project ID `10000`, team-managed Scrum. |
| Board | `SCRUM board`, board ID `1`, type `simple`. |
| Project summary | <https://sjec-team-xyntwxhy.atlassian.net/jira/software/projects/RECL/summary> |
| Product Backlog | <https://sjec-team-xyntwxhy.atlassian.net/jira/software/projects/RECL/boards/1/backlog> |
| Scrum board | <https://sjec-team-xyntwxhy.atlassian.net/jira/software/projects/RECL/boards/1> |
| Epics | `RECL-5` to `RECL-9`. |
| User stories | 16 stories, `RECL-17` to `RECL-32`, with descriptions, numbered acceptance criteria, priority, Fibonacci points, labels, epic parent and assignee. |
| Defect | `RECL-33` (`BUG-01`), High priority, 2 points, Done with resolution and fix verification. |
| Sprints | `Sprint 1 - Foundation` (ID `3`, closed) and `Sprint 2 - Find Materials` (ID `4`, active). |
| Sprint 1 | 6 stories (24 points) + 2-point bug = 26 points; all Done at close; zero carry-over. |
| Sprint 2 | 5 stories, 23 points; `RECL-22` In Progress and the other four To Do. |
| Assignments | Every issue assigned to the Jira account owner (solo mode). |

## 4. Automated execution sequence

The live project has already been provisioned. The commands below reproduce the setup from source data or re-run individual checks. `npm run capture` captures the 10 final screenshots from the current live board state and writes `evidence/screenshots/manifest.json`.

```powershell
npm run validate          # offline data validation; no API calls
npm run check             # verifies credentials and reports the site/user
npm run provision         # idempotent all-phase setup: project, epics, backlog, board, sprints
npm run verify            # compares live Jira against the source data and writes the report
npm run capture           # captures the 10 final screenshots over CDP
```

The older staged entry points (`bootstrap`, `execute`, `complete`, `sprint2`) remain available in `provision.mjs` for rebuilding a sprint lifecycle from scratch. They should not be run against the submission project after evidence has been captured, because they would change the current sprint state.

The live evidence uses saved filters instead of a native team-managed Sprint Report:

| Filter | Name | JQL |
| --- | --- | --- |
| `10001` | Sprint 1 - Committed Scope (26 pts) | `project = RECL AND sprint = 3 ORDER BY key ASC` |
| `10002` | Sprint 1 - Completed Result (26 pts) | `project = RECL AND sprint = 3 AND status = Done ORDER BY key ASC` |
| `10003` | Sprint 2 - Active Scope (23 pts) | `project = RECL AND sprint = 4 ORDER BY key ASC` |
| `10004` | RECL - Assigned Work (Siddharth Sanjay) | `project = RECL AND assignee = currentUser() ORDER BY key ASC` |

Sprint names cannot be used in this team-managed project's JQL; use the numeric sprint IDs as shown above.

## 5. Idempotency and recovery

- The provisioner finds an existing project by key and reuses it.
- Epics and issues are matched by exact summary; existing records are refreshed rather than duplicated.
- Sprints are matched by exact name. A closed sprint is never reopened.
- Issue comments carry no token or secret and are de-duplicated by prefix.
- If a phase fails, inspect `evidence/exports/provision-log.json` and `evidence/exports/jira-state.json`; rerun the failed phase.
- `--force` with `--phase=bootstrap` allows a deliberate rebuild attempt but should not be used after evidence has been captured.

## 6. Manual Jira fallback

If API project creation is unavailable on the site, create the project in the Jira UI:

1. **Projects > Create project > Software development > Scrum**.
2. Name `ReClaim`, key `RECL`, template **Scrum**.
3. Open **Project settings > Features** and confirm Backlog, Sprints and Reports are enabled.
4. Create the five epics from `jira/import/ReClaim_Epics_Import.csv`.
5. Import `jira/import/ReClaim_Backlog_Import.csv` (map Priority, Story Points and Epic fields during import) or create the 16 stories and one bug manually.
6. Create Sprint 1 and Sprint 2 from `jira/import/ReClaim_Sprint_Plan.csv`.
7. Move the six Sprint 1 stories and `BUG-01` into Sprint 1; start the sprint.
8. Set the execution snapshot: US-01 and US-02 Done; US-03, US-04, US-07 and BUG-01 In Progress; US-05 To Do.
9. Complete all Sprint 1 items, move BUG-01 to Done with fix verification recorded, and close Sprint 1.
10. Move US-06, US-08, US-09, US-10 and US-11 into Sprint 2, start it, and move US-06 to In Progress.
11. Capture the screenshots listed in `docs/Evidence_Manifest.md`.

The API path is meaningfully faster and reduces mapping errors. The CSV files are an audit-friendly backup, not a substitute for the live Jira project.

## 7. Field mapping notes

- **Story Points:** The script detects the board estimation field, preferring **Story point estimate**. It never hard-codes a custom field ID because IDs differ between Jira sites.
- **Epic association:** Team-managed projects use the issue `parent` field; company-managed projects use Epic Link when available.
- **Acceptance criteria:** Stored inside the issue description as a numbered list under an **Acceptance Criteria** heading. This guarantees they are visible in the issue view and remain available to every Jira viewer.
- **Priorities:** Standard Jira priorities Highest, High, Medium, Low. The script verifies the site's priority scheme before use.
- **Statuses:** To Do, In Progress, Done. The script discovers valid transitions rather than assuming transition IDs.

## 8. Screenshot authentication

The REST API credentials create and verify data, but Jira's browser UI requires an authenticated user session. `npm run capture` connects to an existing Chrome instance over the Chrome DevTools Protocol at `http://127.0.0.1:9223`. Start Chrome with remote debugging enabled, sign in to Jira normally, and leave the session open. The capture script opens one page, dismisses cookie/announcement overlays, captures the 10 required views and closes the page.

The cookie fallback in `.env` is used by the REST scripts; it is not written into screenshots. Regenerate it if Jira returns `401`/`403` during a capture run.

## 9. Evidence integrity

- Every screenshot must show `ReClaim`, `RECL`, or both.
- Do not edit or composite screenshots.
- Do not include the browser address bar if it contains a secret; the Jira URL itself is safe.
- Do not expose the `JIRA_COOKIE` value or any API token in a capture.
- Capture the real issue state after the corresponding provisioning phase.
- Team-managed projects do not expose a native Sprint Report URL; use saved filters `10001`/`10002` as documented.
- Keep the generated JSON verification report and screenshot manifest alongside the screenshots.

## 10. Troubleshooting

| Symptom | Resolution |
| --- | --- |
| `Missing Jira configuration` | Create `.env` from `.env.example` and re-run. |
| `401` | Token is invalid, expired or paired with the wrong email. Create a new token. |
| `403` creating project | The account lacks project-create permission; use a site-admin account or create the project manually. |
| `No Story Points field` | Enable board estimation in Jira: Board settings > Estimation > Story points. |
| No board found | The automation creates a dedicated filter and Scrum board; if that is forbidden, create the board manually and rerun. |
| Sprint cannot start | Only one sprint can be active. Close Sprint 1 before starting Sprint 2. |
| Sprint 1 close is blocked | Ensure all scoped issues are Done; the provisioner verifies this before closing. |
| `Sprint with name ... does not exist` in JQL | Team-managed projects resolve sprints by ID. Use `sprint = 3` / `sprint = 4`. |
| Reports or Sprint Report returns 404 | Expected in this team-managed project. Use saved filters `10001`/`10002` for Sprint 1 evidence. |
| Cookie session expired | Copy a fresh `JIRA_COOKIE` from a signed-in Jira tab and re-run the REST step. |
| Login loop in capture | Sign in with the Atlassian account that owns the project, complete MFA, and confirm the CDP endpoint is on port `9223`. |
