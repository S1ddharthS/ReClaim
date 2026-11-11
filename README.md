# ReClaim - Jira & Scrum Assignment Workspace

**Project:** ReClaim - Industrial Surplus Intelligence & Resource Recovery Platform  
**Jira project key:** `RECL`  
**Framework:** Agile Scrum  
**Assignment source:** [`docs/Assignment-1.pdf`](docs/Assignment-1.pdf)  
**Prepared by:** Siddharth Sanjay

## What this workspace contains

- The complete, validated Scrum dataset: five epics, 16 user stories and one resolved bug.
- Detailed descriptions with numbered, testable acceptance criteria; priorities; Fibonacci story points; labels; epic associations; sprint allocation and sprint goals.
- A Jira Cloud REST provisioner that creates the project, board, epics, backlog, sprints, assignments, status transitions and Sprint 1 close.
- Reusable CSV imports that act as an auditable backup for manual Jira entry.
- A verification script that checks the live Jira project against the source data.
- A screenshot/evidence plan aligned to every requirement in the assignment brief.
- A project charter and full Scrum plan suitable for submission.

## Current status

| Area | Status |
| --- | --- |
| Assignment parsed | Complete |
| Product vision, epics, backlog and acceptance criteria | Complete |
| Sprint 1 and Sprint 2 plans | Complete |
| CSV backup exports | Complete |
| Jira live provisioning | **Complete (Verified in Jira: RECL)** |
| Verification | **Complete (PASS - 100% verified)** |
| Screenshots / final submission evidence | **Complete (10/10 in `evidence/screenshots/`)** |

The live Jira Scrum project is active on Atlassian Cloud (`RECL`), fully populated with 5 epics, 16 user stories, 1 defect, Sprint 1 (closed), Sprint 2 (active), and full evidence captured. The final screenshots are mirrored in `ReClaim_Evidence/` for document insertion.

## Live Jira links

| Area | URL |
| --- | --- |
| Project summary | <https://sjec-team-xyntwxhy.atlassian.net/jira/software/projects/RECL/summary> |
| Product Backlog | <https://sjec-team-xyntwxhy.atlassian.net/jira/software/projects/RECL/boards/1/backlog> |
| Scrum board | <https://sjec-team-xyntwxhy.atlassian.net/jira/software/projects/RECL/boards/1> |
| Sprint 1 committed scope (26 pts) | <https://sjec-team-xyntwxhy.atlassian.net/issues/?filter=10001> |
| Sprint 1 completed result (26 pts) | <https://sjec-team-xyntwxhy.atlassian.net/issues/?filter=10002> |
| Sprint 2 active scope (23 pts) | <https://sjec-team-xyntwxhy.atlassian.net/issues/?filter=10003> |
| Assigned work | <https://sjec-team-xyntwxhy.atlassian.net/issues/?filter=10004> |

## Quick start

1. Start the interactive web application & Scrum Hub:
```powershell
npm start
```
Visit `http://localhost:3000` to interact with the full-stack surplus platform, test real material additions and atomic inventory holds, or click **🎯 Scrum & Jira Hub** to inspect the live board, backlog, defect simulator, and evidence gallery.

2. Run automated Jira Cloud verification (10/10 PASS):
```powershell
npm run verify
```

3. Generate downloadable PDF reports (2 screenshots per page):
```powershell
npm run pdf
```

## Downloadable Submission Deliverables

- **Complete Evidence Report (5 pages, 2 screenshots per page):** [`ReClaim_Jira_Evidence_Report.pdf`](ReClaim_Jira_Evidence_Report.pdf)
- **1-Page 2-Screenshot Summary:** [`ReClaim_2_Screenshots_Page.pdf`](ReClaim_2_Screenshots_Page.pdf)
- **HTML Submission Document:** [`docs/ReClaim_Assignment_Submission_Report.html`](docs/ReClaim_Assignment_Submission_Report.html)
- **Full Markdown Submission Report:** [`docs/ReClaim_Assignment_Submission_Report.md`](docs/ReClaim_Assignment_Submission_Report.md)

## Key files

| Path | Purpose |
| --- | --- |
| `jira/data/project.json` | Project identity, vision, working agreement. |
| `jira/data/epics.json` | Five epics. |
| `jira/data/stories-foundation.json` | Epics 1-2 stories. |
| `jira/data/stories-discovery.json` | Epics 3-4 stories. |
| `jira/data/stories-delivery.json` | Epics 4-5 stories and the defect. |
| `jira/data/sprints.json` | Sprint 1 and Sprint 2 goals, dates and allocation. |
| `jira/import/*.csv` | Manual-import backups and sprint/assignment reference. |
| `automation/provision.mjs` | Staged Jira Cloud provisioning. |
| `automation/capture-evidence.mjs` | Playwright-over-CDP runner for the 10 final screenshots. |
| `automation/verify.mjs` | Live Jira acceptance checks and verification report generator. |
| `evidence/screenshots/` | Final 10 screenshot captures plus `manifest.json`. |
| `docs/ReClaim_Project_Charter.md` | Problem, scope, roles, success measures. |
| `docs/Scrum_Plan.md` | Full backlog, sprint plans, ceremonies, risks. |
| `docs/Evidence_Manifest.md` | Required screenshots and pre-submission checklist. |
| `docs/Jira_Setup_Runbook.md` | End-to-end setup and troubleshooting. |

## Backlog summary

- **5 epics**
- **16 detailed user stories**
- **1 High-priority bug** (`BUG-01`) resolved and fix-verified
- **75 total story points**
- **Sprint 1 - Foundation:** 24 story points + 2-point bug, six stories, closed
- **Sprint 2 - Find Materials:** 23 points across five stories, active
- **Product Backlog:** 26 points remaining for Sprint 3

## Delivery principles

- Verification before discovery: unverified, expired or out-of-stock materials never appear as available.
- Inventory is event-driven and cannot go negative.
- Every trust or inventory change is auditable.
- The project remains a realistic student system: no blockchain, AI or payment complexity added for appearance.
- Jira is the system of record; local files are source data and evidence, not a substitute for the live project.

## Security

`.env` and `automation/.auth/` are git-ignored. Never commit API tokens or browser session files. Do not include secrets in screenshots.
