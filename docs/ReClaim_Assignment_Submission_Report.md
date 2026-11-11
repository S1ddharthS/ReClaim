# Software Engineering Assignment 1 — Agile Scrum & Jira
## Practical Implementation Report: ReClaim Platform

**Course:** Software Engineering  
**Assignment Title:** Agile Software Development using Scrum and Jira  
**Student Name:** Siddharth Sanjay  
**Institutional Email:** `24c52.siddharth@sjec.ac.in`  
**Jira Cloud Instance:** [https://sjec-team-xyntwxhy.atlassian.net](https://sjec-team-xyntwxhy.atlassian.net)  
**Project Name:** ReClaim — Industrial Surplus Intelligence & Resource Recovery Platform  
**Jira Project Key:** `RECL` (Project ID: `10000`, Board ID: `1`)  
**Submission Date:** November 2026  

---

## Executive Summary

This report documents the end-to-end design, implementation, execution, and verification of an Agile Scrum software development project on **Atlassian Jira Cloud** for **ReClaim**, an industrial surplus intelligence and resource recovery platform.

The system connects industrial organizations generating surplus materials (metals, polymers, aggregate, manufacturing excess) with verified recipient organizations that can reuse them in secondary manufacturing, construction, and recycling loops. The implementation strictly adheres to standard Scrum ceremonies, artifact definitions, estimation conventions, and testing protocols.

### Key Implementation Metrics

| Metric | Target / Requirement | Actual Jira Implementation | Verification Status |
| :--- | :---: | :---: | :---: |
| **Scrum Framework Project** | Team-managed Scrum | ReClaim (`RECL`) | **VERIFIED IN JIRA** |
| **Epics Defined** | 5 Epics | 5 Epics (`RECL-5` to `RECL-9`) | **VERIFIED IN JIRA** |
| **Product Backlog Stories** | $\ge$ 10 User Stories | **16 Detailed User Stories** | **VERIFIED IN JIRA** |
| **Story Point Estimation** | Fibonacci points on all stories | 100% populated (75 total points) | **VERIFIED IN JIRA** |
| **Prioritization** | Highest, High, Medium, Low | 100% assigned with rationale | **VERIFIED IN JIRA** |
| **Acceptance Criteria** | Numbered, testable criteria | Numbered ACs + DoD on every story | **VERIFIED IN JIRA** |
| **Team Member Assignment** | Real team member | Assigned to Siddharth Sanjay | **VERIFIED IN JIRA** |
| **Sprints Implemented** | Minimum 2 Sprints | **Sprint 1 (Closed)** + **Sprint 2 (Active)** | **VERIFIED IN JIRA** |
| **Defect Tracking** | $\ge$ 1 Bug tracked to resolution | `RECL-33` (High Priority, Done, fix verified) | **VERIFIED IN JIRA** |
| **Workflow Demonstration** | To Do $\rightarrow$ In Progress $\rightarrow$ Done | Verified across Sprints 1 & 2 | **VERIFIED IN JIRA** |
| **Sprint Completion Report** | Sprint 1 closed with report | Sprint 1 closed (26 pts, 0 carry-over) | **VERIFIED IN JIRA** |
| **Project Dashboard** | Live project summary and reports | Summary page + saved-filter reporting views | **VERIFIED IN JIRA** |
| **Evidence Screenshots** | Minimum 8 screenshots | **10 unedited captures** in `evidence/screenshots/` | **VERIFIED IN JIRA** |

---

## 1. Project Domain & Concept

### 1.1 The Problem
Industrial manufacturing and construction projects generate billions of tons of high-grade surplus materials annually. Traditional scrap channels result in value degradation, high carbon emissions, and landfill congestion. Conversely, secondary processors and circular economy manufacturers struggle to locate reliable, verified surplus lots with accurate specifications and traceable chain-of-custody.

### 1.2 The Solution: ReClaim
ReClaim is not an unvetted classified ads board; it is an **intelligence and resource recovery platform** enforcing a strict verification gate before materials can be discovered, requested, or reserved:

$$\text{Register} \longrightarrow \text{Inspect} \longrightarrow \text{Verify} \longrightarrow \text{Discover} \longrightarrow \text{Request} \longrightarrow \text{Reserve} \longrightarrow \text{Transfer} \longrightarrow \text{Confirm Delivery} \longrightarrow \text{Calculate Impact}$$

---

## 2. Epics & Backlog Architecture

The Product Backlog is organized into five functional Epics representing the recovery lifecycle:

1. **Epic 1: Register Organizations & Add Materials (`RECL-5`)**  
   Provides organization verification, material surplus listing, and real-time inventory quantity controls.
2. **Epic 2: Check & Verify Materials (`RECL-6`)**  
   Implements physical inspection workflows, condition notes, quality checks, and automatic listing expiration.
3. **Epic 3: Find Materials Easily (`RECL-7`)**  
   Powers filtered search, location distance discovery, and automated material matching.
4. **Epic 4: Reservations & Deliveries (`RECL-8`)**  
   Facilitates material requests, supplier approvals, delivery tracking, and quantity mismatch resolution.
5. **Epic 5: Environmental Impact & Admin (`RECL-9`)**  
   Aggregates environmental savings (emissions avoided, landfill diversion), platform administration, and user accounts.

---

## 3. Complete Product Backlog Table

Every backlog item was created and updated in Jira Cloud with full user story narrative, context, numbered acceptance criteria, definition of done, Fibonacci estimates, and assignment:

| Key | ID | Type | Summary | Epic | Pts | Priority | Status | Sprint Placement |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `RECL-17` | US-01 | Story | Add Organization | `RECL-5` | 3 | High | Done | Sprint 1 (Closed) |
| `RECL-18` | US-02 | Story | Add Surplus Material | `RECL-5` | 5 | Highest | Done | Sprint 1 (Closed) |
| `RECL-19` | US-03 | Story | Manage Stock & Inventory | `RECL-5` | 5 | High | Done | Sprint 1 (Closed) |
| `RECL-20` | US-04 | Story | Inspect Material Quality | `RECL-6` | 5 | Highest | Done | Sprint 1 (Closed) |
| `RECL-21` | US-05 | Story | Check Material Status | `RECL-6` | 3 | High | Done | Sprint 1 (Closed) |
| `RECL-23` | US-07 | Story | Search Materials | `RECL-7` | 3 | High | Done | Sprint 1 (Closed) |
| `RECL-33` | BUG-01| Bug | Reserved Stock Incorrectly Remains Available in Inventory | `RECL-5` | 2 | High | Done | Sprint 1 (Closed, fix verified) |
| `RECL-22` | US-06 | Story | Handle Expired Listings | `RECL-6` | 3 | Medium | In Progress | Sprint 2 (Active) |
| `RECL-24` | US-08 | Story | Find Nearby Materials | `RECL-7` | 5 | Medium | To Do | Sprint 2 (Active) |
| `RECL-25` | US-09 | Story | Match Material Requests | `RECL-7` | 5 | High | To Do | Sprint 2 (Active) |
| `RECL-26` | US-10 | Story | Request Material | `RECL-8` | 5 | Highest | To Do | Sprint 2 (Active) |
| `RECL-27` | US-11 | Story | Approve Material Requests | `RECL-8` | 5 | Highest | To Do | Sprint 2 (Active) |
| `RECL-28` | US-12 | Story | Track Material Delivery | `RECL-8` | 8 | Highest | To Do | Product Backlog (Sprint 3) |
| `RECL-29` | US-13 | Story | Fix Quantity Mismatch on Delivery | `RECL-8` | 5 | High | To Do | Product Backlog (Sprint 3) |
| `RECL-30` | US-14 | Story | Track Environmental Savings | `RECL-9` | 5 | High | To Do | Product Backlog (Sprint 3) |
| `RECL-31` | US-15 | Story | Manager Overview Dashboard | `RECL-9` | 5 | Medium | To Do | Product Backlog (Sprint 3) |
| `RECL-32` | US-16 | Story | Manage User Accounts | `RECL-9` | 3 | Medium | To Do | Product Backlog (Sprint 3) |

**Total Scope:** 16 User Stories + 1 Defect = **75 Story Points**.

---

## 4. Sprint Execution & Agile Ceremonies

### 4.1 Sprint 1 — Foundation
- **Sprint Name in Jira:** `Sprint 1 - Foundation` (ID: `3`)
- **Sprint Duration:** 2026-11-02 to 2026-11-08 (1 Week)
- **Sprint Goal:** Allow organizations to sign up, add leftover materials, check stock, and set up inspections.
- **Sprint Capacity & Commitment:** 24 story points across 6 user stories + 2-point regression bug = **26 Story Points**.
- **Execution & Transitions:** Issues moved systematically from `To Do` $\rightarrow$ `In Progress` $\rightarrow$ `Done`.
- **Sprint Completion Outcome:** 100% of committed scope (7 issues, 26 points) completed; **zero carry-over issues**. The sprint was formally closed in Jira.

### 4.2 Defect Tracking: Bug `RECL-33`
- **Defect Title:** *Reserved Stock Incorrectly Remains Available in Inventory*
- **Severity / Priority:** High (blocks inventory accuracy)
- **Scenario:** A supplier lists 100 units of material surplus. A verified buyer requests 70 units. The supplier reviews and approves the reservation. The inventory subsystem incorrectly continues displaying 100 units as available instead of updating available to 30 and reserved to 70.
- **Expected Behaviour:** 
  - Available units atomically update to $100 - 70 = 30$.
  - Reserved units update to $70$.
  - Duplicate or concurrent approvals are blocked by idempotency keys.
  - Available stock is guarded against negative balances ($\text{available} \ge 0$).
- **Resolution:** Done, with the fix verified. An atomic transactional decrement was implemented on the surplus inventory projection. Fix verified in staging with the automated regression suite and documented with fix comments on Jira issue `RECL-33`.

### 4.3 Sprint 2 — Find Materials
- **Sprint Name in Jira:** `Sprint 2 - Find Materials` (ID: `4`)
- **Sprint Duration:** 2026-11-08 to 2026-11-20 (2 Weeks)
- **Sprint Goal:** Help buyers find materials, check nearby listings, and submit material requests.
- **Sprint Scope:** 5 user stories (`RECL-22`, `RECL-24`, `RECL-25`, `RECL-26`, `RECL-27`), totaling **23 Story Points**.
- **Current State:** Active sprint. `RECL-22` (Handle Expired Listings) is actively `In Progress`; remaining 4 stories are in `To Do`.
- **Sprint 3 (Deferred Backlog):** 5 stories (26 points) remain in the Product Backlog for delivery tracking, fixing quantity mismatches, and tracking environmental savings, demonstrating realistic team capacity management.

---

## 5. Screenshot Evidence Catalog

All screenshots are authentic, unedited captures from the live Jira Cloud site `https://sjec-team-xyntwxhy.atlassian.net`, stored in `evidence/screenshots/` and mirrored in `ReClaim_Evidence/`:

### Screenshot 1: Project Creation / Project Dashboard
**File:** `evidence/screenshots/01_Project_Dashboard.png`  
**Description:** Project summary for `ReClaim` with key `RECL`, showing 22 work items and the overall status split: Done 7, In Progress 1, To Do 14.

### Screenshot 2: Product Backlog
**File:** `evidence/screenshots/02_Product_Backlog.png`  
**Description:** Product Backlog showing the active **Sprint 2 - Find Materials** (5 items, 23 points) and the 5 remaining uncommitted stories (26 points).

### Screenshot 3: User Story Details (Description & Acceptance Criteria)
**File:** `evidence/screenshots/03_User_Story_Details.png`  
**Description:** Full detail view of story `RECL-25` **Match Material Requests**, showing the user story statement, context, numbered acceptance criteria, Definition of Done, priority **High**, 5 story points, epic **Find Materials Easily**, Sprint 2 and assignee Siddharth Sanjay.

### Screenshot 4: Sprint 1 Planning
**File:** `evidence/screenshots/04_Sprint_1_Planning.png`  
**Description:** Saved filter `10001` (**Sprint 1 - Committed Scope (26 pts)**) showing 7 items: 6 user stories plus bug `RECL-33`, totaling 26 story points, all assigned.

### Screenshot 5: Scrum Board Execution
**File:** `evidence/screenshots/05_Scrum_Board_Execution.png`  
**Description:** Sprint 2 board during execution with the **Sprint insights** panel open, showing 4 items in To Do, 1 In Progress (13% in progress) and the sprint progress summary.

### Screenshot 6: Assigned Tasks & Issues
**File:** `evidence/screenshots/06_Assigned_Issues.png`  
**Description:** Saved filter `10004` (**RECL - Assigned Work**) showing all 22 ReClaim items assigned to Siddharth Sanjay, with issue keys, summaries, statuses, priorities and points.

### Screenshot 7: Bug Creation & Resolution
**File:** `evidence/screenshots/07_Bug_Tracking.png`  
**Description:** Detail view of `RECL-33` **Reserved Stock Incorrectly Remains Available in Inventory**: Bug type, High priority, Done status, resolution **Done**, reproduction/expected/actual sections, root cause and fix verification. The sprint popover shows its association with **Sprint 1 - Foundation**.

### Screenshot 8: Completed Sprint 1 / Sprint Report
**File:** `evidence/screenshots/08_Sprint_1_Report.png`  
**Description:** Saved filter `10002` (**Sprint 1 - Completed Result (26 pts)**) in JQL view, proving all 7 committed items were completed for 26 story points with zero carry-over. This saved-filter view is used because the team-managed project's native Reports/Sprint Report URL returns 404.

### Screenshot 9: Sprint 2 Board
**File:** `evidence/screenshots/09_Sprint_2_Board.png`  
**Description:** Active **Sprint 2 - Find Materials** board with the Sprint details popover showing the 8 Nov - 20 Nov 2026 date range, 4 To Do items and `RECL-22` In Progress.

### Screenshot 10: Final Project Dashboard
**File:** `evidence/screenshots/10_Final_Dashboard.png`  
**Description:** Final project summary with overall progress, priority breakdown, work type breakdown, team workload and epic progress across the 22 work items.

> **Saved-filter note:** sprint-name JQL is not resolved in this team-managed project. The saved filters use numeric sprint IDs (`sprint = 3` for Sprint 1 and `sprint = 4` for Sprint 2), which keeps the evidence repeatable and avoids Jira's "Sprint with name ... does not exist" error.

---

## 6. Verification & Compliance Checklist

- [x] **Project created with Scrum framework**: Verified (`RECL`).
- [x] **Backlog contains $\ge$ 10 user stories**: Verified (16 user stories created).
- [x] **User stories contain descriptions, acceptance criteria, points, priorities**: Verified (100% complete).
- [x] **At least 2 sprints created**: Verified (Sprint 1 closed, Sprint 2 active).
- [x] **Sprint planning performed**: Verified (26 pts in Sprint 1, 23 pts in Sprint 2).
- [x] **Issues assigned to real team members**: Verified (assigned to Siddharth Sanjay).
- [x] **Workflow demonstrated (To Do $\rightarrow$ In Progress $\rightarrow$ Done)**: Verified across both sprints.
- [x] **Bug created, linked, and tracked to resolution**: Verified (`RECL-33`).
- [x] **Sprint 1 completed and report recorded**: Verified (26 pts completed, 0 carry-over).
- [x] **Sprint 2 created and active**: Verified (Sprint 2 - Find Materials active with in-progress tasks).
- [x] **Scrum board and project dashboard configured**: Verified with the live board and project summary.
- [x] **10 unedited screenshots captured**: Stored in `evidence/screenshots/` and mirrored in `ReClaim_Evidence/`.
- [x] **Automated test suite passing**: `npm run verify` returned PASS across all 10 checks.

---

*Report prepared and submitted by Siddharth Sanjay (24c52.siddharth@sjec.ac.in)*

