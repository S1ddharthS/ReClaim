# ReClaim - Evidence Manifest

All screenshots are unedited captures of the **same live Jira Cloud project** (`ReClaim`, key `RECL`) at <https://sjec-team-xyntwxhy.atlassian.net>. The assignment minimum is 8 screenshots; this submission contains all **10 required captures** in [`evidence/screenshots/`](../evidence/screenshots/). The same final files are mirrored in `ReClaim_Evidence/` for document insertion.

## Core screenshots

| # | File | Requirement | What the capture shows |
| --- | --- | --- | --- |
| 01 | `01_Project_Dashboard.png` | Jira project creation / project dashboard | Project summary for **ReClaim** (`RECL`), 22 work items, Done 7 / In Progress 1 / To Do 14, and project navigation. |
| 02 | `02_Product_Backlog.png` | Product Backlog | Backlog with active **Sprint 2 - Find Materials** (5 items, 23 pts) and 5 uncommitted Product Backlog stories (26 pts). |
| 03 | `03_User_Story_Details.png` | User story with description and acceptance criteria | `RECL-25` **Match Material Requests**: user story, context, numbered acceptance criteria, Definition of Done, priority, 5 story points, epic **Find Materials Easily**, Sprint 2 and assignee. |
| 04 | `04_Sprint_1_Planning.png` | Sprint 1 planning | Saved filter `10001` (**Sprint 1 - Committed Scope (26 pts)**): 7 items (6 stories + 1 bug), 26 points, all assigned. |
| 05 | `05_Scrum_Board_Execution.png` | Scrum Board during execution | Sprint 2 board during execution with the **Sprint insights** panel: 4 To Do, 1 In Progress, 13% in progress. |
| 06 | `06_Assigned_Issues.png` | Assigned tasks/issues | Saved filter `10004` (**RECL - Assigned Work**): all 22 ReClaim items assigned to **Siddharth Sanjay**. |
| 07 | `07_Bug_Tracking.png` | Bug created and its status | `RECL-33` **Reserved Stock Incorrectly Remains Available in Inventory**: Bug, High priority, Done, resolution **Done**, fix verification, and the sprint popover showing **Sprint 1 - Foundation**. |
| 08 | `08_Sprint_1_Report.png` | Completed Sprint / Sprint Report | Saved filter `10002` (**Sprint 1 - Completed Result (26 pts)**) in JQL view: 7 rows, 26 points, every item Done, zero carry-over. |
| 09 | `09_Sprint_2_Board.png` | Sprint 2 board | Active Sprint 2 board with the **Sprint details** popover: **Sprint 2 - Find Materials**, 8 Nov - 20 Nov 2026. |
| 10 | `10_Final_Dashboard.png` | Final project dashboard / report | Final project summary with overall status, priority, work type, team workload and epic progress. |

## Why saved filters are used for Sprint 1 evidence

This is a **team-managed** Jira project. Its native Reports and Sprint Report URLs return 404, and sprint-name JQL is not resolved. The saved filters therefore use the numeric sprint IDs:

```jql
-- Filter 10001 - Sprint 1 committed scope
project = RECL AND sprint = 3 ORDER BY key ASC

-- Filter 10002 - Sprint 1 completed result
project = RECL AND sprint = 3 AND status = Done ORDER BY key ASC

-- Filter 10003 - Sprint 2 active scope
project = RECL AND sprint = 4 ORDER BY key ASC

-- Filter 10004 - Assigned work
project = RECL AND assignee = currentUser() ORDER BY key ASC
```

`10001` and `10002` therefore provide repeatable evidence of Sprint 1 planning and completion even though the team-managed project does not expose a native Sprint Report page.

## Machine-readable evidence

Keep these files with the submission package:

- `evidence/exports/jira-state.json` - live project, board, sprint, issue and filter map.
- `evidence/exports/verification-report.json` - machine-readable pass/fail checks.
- `evidence/screenshots/manifest.json` - capture URLs, labels and timestamps for all 10 screenshots.
- `docs/Jira_Verification_Report.md` - human-readable verification summary.
- `docs/Assignment-1.pdf` - the supplied assignment brief for traceability.

## Pre-submission checks

- [x] Screenshot 01 clearly shows **ReClaim** and **RECL**.
- [x] Backlog shows 16 user stories plus one bug, with Sprint 2 and the remaining backlog.
- [x] Story detail shows description, priority, story points and acceptance criteria (`RECL-25`).
- [x] Sprint 1 planning screenshot shows 7 items and 26 points.
- [x] Board screenshot shows real status columns, cards and sprint progress.
- [x] Assigned issues screenshot shows Siddharth Sanjay as assignee.
- [x] Bug screenshot shows Done, resolution, fix verification and Sprint 1 association.
- [x] Sprint 1 result shows all 7 items Done with 26 points and zero carry-over.
- [x] Sprint 2 board is active and shows its dates.
- [x] Final dashboard shows overall project progress.
- [x] No API token, password or private session cookie is visible.
- [x] `npm run verify` returns PASS.
