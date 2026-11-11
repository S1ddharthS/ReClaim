# ReClaim - Project Charter

**Course assignment:** Software Engineering - Jira & Scrum  
**Project:** ReClaim - Industrial Surplus Intelligence & Resource Recovery Platform  
**Project key:** RECL  
**Methodology:** Agile Scrum  
**Delivery model:** Jira Cloud Scrum project  
**Prepared by:** Siddharth Sanjay  
**Assignment source:** `docs/Assignment-1.pdf`

## 1. Problem statement

Industrial and construction companies often have leftover materials they no longer need. Today, these good materials are often thrown into landfills because there is no easy way to find who needs them.

ReClaim makes reusing leftover materials simple, safe, and reliable. Companies can easily list leftover materials, have them checked for quality by certified inspectors, search for materials nearby, request items, and track delivery from pickup to drop-off.

## 2. Vision

> Help businesses easily find, check, and reuse leftover materials instead of throwing them away.

## 3. Objectives

1. Prevent usable materials from going to landfills.
2. Build a trusted catalog where every item is quality-checked before buyers see it.
3. Keep material quantities accurate at all times (Listed, Reserved, and Available stock).
4. Make pickup and delivery easy to track from start to finish.
5. Show clear environmental savings: kilograms saved, waste diverted, and emissions prevented.
6. Demonstrate practical Agile Scrum in Jira with real backlog items, sprints, defect fixes, and reports.

## 4. Product scope

### In scope

- Organization registration and verification status.
- Surplus-material registration and inventory management.
- Material inspection and verification.
- Text, category, location and requirement-based discovery.
- Buyer requests and supplier reservation decisions.
- Dispatch, delivery and discrepancy tracking.
- Environmental impact reporting.
- Administrative controls, audit history and operational monitoring.

### Out of scope

- AI-driven price prediction or generative recommendations.
- Blockchain-based ownership ledgers.
- Online payments, escrow or invoicing.
- International customs or hazardous-material transportation compliance.
- Native mobile applications.
- Automated logistics-carrier integration.

These exclusions keep the student project realistic while preserving an end-to-end, testable business flow.

## 5. User roles

| Role | Primary responsibilities |
| --- | --- |
| Supplier Organization | Register materials, maintain quantity, review requests, approve or reject reservations. |
| Buyer Organization | Discover verified materials, submit requests and track approved transfers. |
| Material Inspector | Review listings, record condition, approve or reject materials and preserve inspection evidence. |
| Logistics Coordinator | Schedule dispatch, track delivery, record proof of delivery and manage discrepancies. |
| Platform Administrator | Manage organizations and users, monitor activity, review exceptions and generate impact reports. |

## 6. Success measures

| Measure | Target |
| --- | --- |
| Product Backlog depth | At least 15 detailed user stories across five epics. |
| Sprint completion | Sprint 1 completed with all committed issues Done. |
| Quality gate | At least one defect found, fixed and verified before sprint completion. |
| Inventory integrity | No negative available quantity and one source of truth for reserved/transferred stock. |
| Discovery eligibility | 100% of standard search results are Verified, active, unexpired and in stock. |
| Traceability | Every request, reservation, transfer and discrepancy has an auditable status history. |
| Assignment evidence | Every issue has an accountable assignee in Jira. |

## 7. Assumptions and constraints

- Jira Cloud is the system of record for backlog, sprints, assignments and reporting.
- The academic project is executed in solo mode; one Jira account owns all roles, while role accountability remains explicit in story descriptions and labels.
- Sprint 1 is a one-week foundation sprint. Sprint 2 is a two-week discovery-and-reservation sprint.
- Sprint dates describe the planned cadence; a sprint may be completed only after all committed issues are Done.
- Payment, carrier integration and advanced regulatory workflows are deliberately excluded.
- Environment secrets such as the Jira API token are stored only in the local `.env` file and are never committed.

## 8. Non-functional requirements

- **Security:** Role-based access control, least-privilege administration and session revocation on deactivation.
- **Auditability:** Immutable inspection decisions and append-only status/inventory history.
- **Data integrity:** Transactional reservation approval and non-negative inventory constraints.
- **Performance:** Search p95 under two seconds for 10,000 active listings.
- **Usability:** Clear empty states, validation messages and status explanations.
- **Privacy:** Organizations see their own transaction detail; platform reporting is aggregated unless explicitly authorized.
- **Reliability:** Scheduled expiry processing is idempotent and retry-safe.

## 9. Definition of ready

A user story enters a sprint only when it has a clear role-oriented statement, at least four testable acceptance criteria, an agreed priority, Fibonacci story points, an epic association, known dependencies and a test approach.

## 10. Definition of done

A story is Done only when its acceptance criteria are verified, code review and automated checks pass, no blocker defect remains open, documentation and test evidence are updated, and the Product Owner accepts the result.
