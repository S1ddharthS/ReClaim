# ReClaim - Product Backlog and Scrum Plan

**Project:** ReClaim (`RECL`)  
**Product:** Industrial Surplus Intelligence & Resource Recovery Platform  
**Methodology:** Agile Scrum  
**Backlog size:** 16 user stories + 1 defect / 75 total points  
**Sprints planned:** 2

## 1. Vision and product goal

> Help businesses easily find, check, and reuse leftover materials instead of throwing them away.

Our product goal is to make leftover materials easy to discover and trustworthy, while making sure pickup and delivery are tracked clearly. Sprint 1 sets up the trust foundation (signing up, listing materials, quality checks), and Sprint 2 connects verified materials with buyers through requests and reservations.

## 2. Team and accountability

The Jira project is executed in **solo assignment mode**, as agreed for this submission. Every issue is assigned to the Jira account owner so that assignment evidence is present. Role accountability is still explicit in each user story and label.

| Role | Accountability in this delivery |
| --- | --- |
| Product Owner | Owns the backlog order, priorities, acceptance criteria and sprint goals. |
| Scrum Master | Facilitates planning, daily review, board hygiene and the retrospective. |
| Development | Implements stories and keeps status transitions current in Jira. |
| Quality / Inspection SME | Owns the verification gate, acceptance testing and the Sprint 1 defect. |
| Logistics / Sustainability SME | Validates transfer, discrepancy and impact-reporting requirements. |

## 3. Epics

| Epic | Key | Goal | Stories | Points |
| --- | --- | --- | ---: | ---: |
| **Register Organizations & Add Materials** | `RECL-5` | Verified organizations can sign up, list leftover materials, and manage available or reserved stock accurately. | 3 + bug | 13 (+2 bug) |
| **Check & Verify Materials** | `RECL-6` | Certified inspectors check material quality so buyers only see verified, good-condition materials. | 3 | 11 |
| **Find Materials Easily** | `RECL-7` | Buyers can easily find materials by keyword, category, or distance from their site. | 3 | 13 |
| **Reservations & Deliveries** | `RECL-8` | Buyers can request items, suppliers can approve holds, and deliveries are tracked step-by-step. | 4 | 23 |
| **Environmental Impact & Admin** | `RECL-9` | Managers can track waste prevented, view environmental savings, and manage platform accounts. | 3 | 13 |

## 4. Product Backlog

Every item below has a Jira description containing the user story, context, testable acceptance criteria and definition of done, plus a priority, Fibonacci story points, labels and an epic association. The summaries match the live Jira issues.

| ID | Key | Type | Summary | Epic | Priority | Points | Sprint | Labels |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| US-01 | `RECL-17` | Story | Add Organization | E1 | High | 3 | Sprint 1 - Foundation | onboarding, organization, foundation |
| US-02 | `RECL-18` | Story | Add Surplus Material | E1 | Highest | 5 | Sprint 1 - Foundation | materials, supplier, listing, foundation |
| US-03 | `RECL-19` | Story | Manage Stock & Inventory | E1 | High | 5 | Sprint 1 - Foundation | inventory, supplier, consistency |
| US-04 | `RECL-20` | Story | Inspect Material Quality | E2 | Highest | 5 | Sprint 1 - Foundation | inspection, quality, trust |
| US-05 | `RECL-21` | Story | Check Material Status | E2 | High | 3 | Sprint 1 - Foundation | verification, buyer, trust |
| US-06 | `RECL-22` | Story | Handle Expired Listings | E2 | Medium | 3 | Sprint 2 - Find Materials | expiry, supplier, listing |
| US-07 | `RECL-23` | Story | Search Materials | E3 | High | 3 | Sprint 1 - Foundation | search, discovery, buyer |
| US-08 | `RECL-24` | Story | Find Nearby Materials | E3 | Medium | 5 | Sprint 2 - Find Materials | location, discovery, buyer, logistics |
| US-09 | `RECL-25` | Story | Match Material Requests | E3 | High | 5 | Sprint 2 - Find Materials | matching, discovery, buyer, requirements |
| US-10 | `RECL-26` | Story | Request Material | E4 | Highest | 5 | Sprint 2 - Find Materials | request, buyer, reservation |
| US-11 | `RECL-27` | Story | Approve Material Requests | E4 | Highest | 5 | Sprint 2 - Find Materials | reservation, supplier, inventory, approval |
| US-12 | `RECL-28` | Story | Track Material Delivery | E4 | Highest | 8 | Product Backlog | transfer, logistics, tracking, delivery |
| US-13 | `RECL-29` | Story | Fix Quantity Mismatch on Delivery | E4 | High | 5 | Product Backlog | discrepancy, logistics, inventory, resolution |
| US-14 | `RECL-30` | Story | Track Environmental Savings | E5 | High | 5 | Product Backlog | impact, sustainability, reporting, analytics |
| US-15 | `RECL-31` | Story | Manager Overview Dashboard | E5 | Medium | 5 | Product Backlog | dashboard, administration, operations |
| US-16 | `RECL-32` | Story | Manage User Accounts | E5 | Medium | 3 | Product Backlog | administration, users, roles, security |
| BUG-01 | `RECL-33` | Bug | Reserved Stock Incorrectly Remains Available in Inventory | E1 | High | 2 | Sprint 1 - Foundation | bug, inventory, reservation, sprint-1, defect |

## 5. Sprint 1 plan

**Sprint:** Sprint 1 - Foundation  
**Jira sprint ID:** `3`  
**Dates:** 2026-11-02 to 2026-11-08  
**Goal:** Deliver a trusted material registry: organization onboarding, surplus-material registration, accurate inventory, inspection, verification and verified-only buyer search.  
**Capacity:** 26 points (24 committed story points + 2-point regression bug)

| ID | Key | Summary | Points | Status at close |
| --- | --- | --- | ---: | --- |
| US-01 | `RECL-17` | Add Organization | 3 | Done |
| US-02 | `RECL-18` | Add Surplus Material | 5 | Done |
| US-03 | `RECL-19` | Manage Stock & Inventory | 5 | Done |
| US-04 | `RECL-20` | Inspect Material Quality | 5 | Done |
| US-05 | `RECL-21` | Check Material Status | 3 | Done |
| US-07 | `RECL-23` | Search Materials | 3 | Done |
| BUG-01 | `RECL-33` | Reserved Stock Incorrectly Remains Available in Inventory | 2 | Done |

**Sprint 1 total:** 26 points.

## 6. Sprint 2 plan

**Sprint:** Sprint 2 - Find Materials  
**Jira sprint ID:** `4`  
**Dates:** 2026-11-08 to 2026-11-20  
**Goal:** Connect verified supply and demand: listing expiry, location-aware discovery, requirement matching, buyer request submission and supplier reservation decisions.  
**Capacity:** 26 points

| ID | Key | Summary | Points | Initial status |
| --- | --- | --- | ---: | --- |
| US-06 | `RECL-22` | Handle Expired Listings | 3 | In Progress |
| US-08 | `RECL-24` | Find Nearby Materials | 5 | To Do |
| US-09 | `RECL-25` | Match Material Requests | 5 | To Do |
| US-10 | `RECL-26` | Request Material | 5 | To Do |
| US-11 | `RECL-27` | Approve Material Requests | 5 | To Do |

**Sprint 2 total:** 23 points.

## 7. Remaining Product Backlog

The following items are intentionally deferred until after the first end-to-end reservation slice. They are still fully described, estimated and assigned in Jira.

| ID | Key | Summary | Points | Epic |
| --- | --- | --- | ---: | --- |
| US-12 | `RECL-28` | Track Material Delivery | 8 | E4 |
| US-13 | `RECL-29` | Fix Quantity Mismatch on Delivery | 5 | E4 |
| US-14 | `RECL-30` | Track Environmental Savings | 5 | E5 |
| US-15 | `RECL-31` | Manager Overview Dashboard | 5 | E5 |
| US-16 | `RECL-32` | Manage User Accounts | 3 | E5 |

**Remaining backlog:** 26 points.

## 8. Ceremonies and cadence

| Ceremony | When | Output |
| --- | --- | --- |
| Sprint Planning | Start of each sprint | Sprint goal, selected backlog, capacity and task ownership. |
| Daily Scrum | Daily | Board review, blockers, next 24-hour plan. |
| Sprint Review | End of sprint | Accepted increments, evidence, Product Owner decision. |
| Retrospective | After review | What went well, what to improve, one owned action. |
| Backlog Refinement | Mid-sprint | Ready stories with testable acceptance criteria. |

## 9. Risks and controls

| Risk | Control |
| --- | --- |
| Unverified material appears to buyers | Eligibility predicates in every search/query path; regression test and bug fix. |
| Two buyers reserve the same stock | Approval transaction re-checks availability and reserves atomically. |
| Inventory becomes negative | Ledger constraint, event-based changes and rejection of invalid edits. |
| Location data is incomplete | Missing coordinates excluded from distance filters but labelled in text search. |
| Sprint 1 scope is too large | Foundation-only sprint; remaining discovery and reservation features deferred to Sprint 2. |
| Screenshots are incomplete | Evidence manifest maps every assignment requirement to a named capture. |

## 10. Status model

```text
To Do -> In Progress -> Done
```

Sprint 1 demonstrates this progression for the six committed stories. **BUG-01** follows the same flow and closes as **Done** with fix verification before the sprint is completed. Sprint 2 begins with its selected backlog in To Do and the first story in progress.

## 11. Assignment traceability

| Assignment requirement | ReClaim evidence |
| --- | --- |
| Scrum project | Jira project `RECL`, Scrum board and two sprints. |
| At least 10 stories | 16 user stories across five epics. |
| Description / priority / points / acceptance criteria | Full description with numbered acceptance criteria; priority and Fibonacci points on every item. |
| At least two sprints | Sprint 1 closed; Sprint 2 active. |
| Sprint 1 planning | Sprint 1 scope, goal, dates and 26-point plan. |
| Assignments | All issues assigned to the Jira account owner in solo mode. |
| Status progression | Board captures show To Do, In Progress and Done; issue history retains transitions. |
| Bug | `BUG-01` created, fixed and verified before Sprint 1 close. |
| Sprint completion and result | Sprint 1 closed with 26 completed points and zero carry-over; sprint report screenshot. |
| Sprint 2 from remaining backlog | Five remaining items selected for Sprint 2. |
| Board and progress | Board and project summary captures. |
