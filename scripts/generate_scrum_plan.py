import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "jira" / "data"

project = json.loads((DATA / "project.json").read_text(encoding="utf-8"))
epics = json.loads((DATA / "epics.json").read_text(encoding="utf-8"))
sprints = json.loads((DATA / "sprints.json").read_text(encoding="utf-8"))
issues = []
for name in ("stories-foundation.json", "stories-discovery.json", "stories-delivery.json"):
    issues.extend(json.loads((DATA / name).read_text(encoding="utf-8")))

epic_by_id = {epic["id"]: epic for epic in epics}
sprint_by_id = {sprint["id"]: sprint for sprint in sprints}
story_points = sum(issue["points"] for issue in issues)
story_count = sum(1 for issue in issues if issue["type"] == "Story")

lines = []
lines += [
    "# ReClaim - Product Backlog and Scrum Plan",
    "",
    f"**Project:** {project['name']} (`{project['key']}`)  ",
    f"**Product:** {project['fullName']}  ",
    f"**Methodology:** Agile Scrum  ",
    f"**Backlog size:** {story_count} user stories + 1 defect / {story_points} total points  ",
    f"**Sprints planned:** {len(sprints)}",
    "",
    "## 1. Vision and product goal",
    "",
    f"> {project['vision']}",
    "",
    "The product goal is to make reusable industrial materials visible and trustworthy, while keeping the physical hand-off from listing to delivery accountable. The backlog is deliberately sliced so Sprint 1 establishes the trust foundation and Sprint 2 connects verified supply with buyer demand.",
    "",
    "## 2. Team and accountability",
    "",
    "The Jira project is executed in **solo assignment mode**, as agreed for this submission. Every issue is assigned to the Jira account owner so that assignment evidence is present. Role accountability is still explicit in each user story and label.",
    "",
    "| Role | Accountability in this delivery |",
    "| --- | --- |",
    "| Product Owner | Owns the backlog order, priorities, acceptance criteria and sprint goals. |",
    "| Scrum Master | Facilitates planning, daily review, board hygiene and the retrospective. |",
    "| Development | Implements stories and keeps status transitions current in Jira. |",
    "| Quality / Inspection SME | Owns the verification gate, acceptance testing and the Sprint 1 defect. |",
    "| Logistics / Sustainability SME | Validates transfer, discrepancy and impact-reporting requirements. |",
    "",
    "## 3. Epics",
    "",
    "| Epic | Goal | Stories | Points |",
    "| --- | --- | ---: | ---: |",
]
for epic in epics:
    epic_issues = [issue for issue in issues if issue["epic"] == epic["id"]]
    points = sum(issue["points"] for issue in epic_issues)
    lines.append(
        f"| **{epic['id']} - {epic['summary']}** | {epic['outcome']} | {len(epic_issues)} | {points} |"
    )

lines += [
    "",
    "## 4. Product Backlog",
    "",
    "Every item below has a Jira description containing the user story, context, testable acceptance criteria and definition of done, plus a priority, Fibonacci story points, labels and an epic association.",
    "",
    "| ID | Type | Summary | Epic | Priority | Points | Sprint | Labels |",
    "| --- | --- | --- | --- | --- | ---: | --- | --- |",
]
for issue in issues:
    sprint = sprint_by_id[issue["sprint"]]["name"] if issue["sprint"] else "Product Backlog"
    lines.append(
        f"| {issue['id']} | {issue['type']} | {issue['summary']} | {issue['epic']} | {issue['priority']} | {issue['points']} | {sprint} | {', '.join(issue['labels'])} |"
    )

lines += [
    "",
    "## 5. Sprint 1 plan",
    "",
    f"**Sprint:** {sprints[0]['name']}  ",
    f"**Dates:** {sprints[0]['startDate'][:10]} to {sprints[0]['endDate'][:10]}  ",
    f"**Goal:** {sprints[0]['goal']}  ",
    f"**Capacity:** {sprints[0]['capacityPoints']} points (24 committed story points + 2-point regression bug)",
    "",
    "| ID | Summary | Points | Status at close |",
    "| --- | --- | ---: | --- |",
]
for issue in issues:
    if issue["sprint"] == "SPR-1":
        lines.append(f"| {issue['id']} | {issue['summary']} | {issue['points']} | {issue['status']} |")
lines += [
    "",
    f"**Sprint 1 total:** {sum(issue['points'] for issue in issues if issue['sprint'] == 'SPR-1')} points.",
    "",
    "## 6. Sprint 2 plan",
    "",
    f"**Sprint:** {sprints[1]['name']}  ",
    f"**Dates:** {sprints[1]['startDate'][:10]} to {sprints[1]['endDate'][:10]}  ",
    f"**Goal:** {sprints[1]['goal']}  ",
    f"**Capacity:** {sprints[1]['capacityPoints']} points",
    "",
    "| ID | Summary | Points | Initial status |",
    "| --- | --- | ---: | --- |",
]
for issue in issues:
    if issue["sprint"] == "SPR-2":
        lines.append(f"| {issue['id']} | {issue['summary']} | {issue['points']} | {issue['status']} |")
lines += [
    "",
    f"**Sprint 2 total:** {sum(issue['points'] for issue in issues if issue['sprint'] == 'SPR-2')} points.",
    "",
    "## 7. Remaining Product Backlog",
    "",
    "The following items are intentionally deferred until after the first end-to-end reservation slice. They are still fully described, estimated and assigned in Jira.",
    "",
    "| ID | Summary | Points | Epic |",
    "| --- | --- | ---: | --- |",
]
for issue in issues:
    if not issue["sprint"]:
        lines.append(f"| {issue['id']} | {issue['summary']} | {issue['points']} | {issue['epic']} |")
lines += [
    "",
    f"**Remaining backlog:** {sum(issue['points'] for issue in issues if not issue['sprint'])} points.",
    "",
    "## 8. Ceremonies and cadence",
    "",
    "| Ceremony | When | Output |",
    "| --- | --- | --- |",
    "| Sprint Planning | Start of each sprint | Sprint goal, selected backlog, capacity and task ownership. |",
    "| Daily Scrum | Daily | Board review, blockers, next 24-hour plan. |",
    "| Sprint Review | End of sprint | Accepted increments, evidence, Product Owner decision. |",
    "| Retrospective | After review | What went well, what to improve, one owned action. |",
    "| Backlog Refinement | Mid-sprint | Ready stories with testable acceptance criteria. |",
    "",
    "## 9. Risks and controls",
    "",
    "| Risk | Control |",
    "| --- | --- |",
    "| Unverified material appears to buyers | Eligibility predicates in every search/query path; regression test and bug fix. |",
    "| Two buyers reserve the same stock | Approval transaction re-checks availability and reserves atomically. |",
    "| Inventory becomes negative | Ledger constraint, event-based changes and rejection of invalid edits. |",
    "| Location data is incomplete | Missing coordinates excluded from distance filters but labelled in text search. |",
    "| Sprint 1 scope is too large | Foundation-only sprint; remaining discovery and reservation features deferred to Sprint 2. |",
    "| Screenshots are incomplete | Evidence manifest maps every assignment requirement to a named capture. |",
    "",
    "## 10. Status model",
    "",
    "```text",
    "To Do -> In Progress -> Done",
    "```",
    "",
    "Sprint 1 demonstrates this progression for the six committed stories. **BUG-01** follows the same flow and closes with resolution **Fixed** before the sprint is completed. Sprint 2 begins with its selected backlog in To Do and the first story in progress.",
    "",
    "## 11. Assignment traceability",
    "",
    "| Assignment requirement | ReClaim evidence |",
    "| --- | --- |",
    "| Scrum project | Jira project `RECL`, Scrum board and two sprints. |",
    "| At least 10 stories | 16 user stories across five epics. |",
    "| Description / priority / points / acceptance criteria | Full description with numbered acceptance criteria; priority and Fibonacci points on every item. |",
    "| At least two sprints | Sprint 1 closed; Sprint 2 active. |",
    "| Sprint 1 planning | Sprint 1 scope, goal, dates and 26-point plan. |",
    "| Assignments | All issues assigned to the Jira account owner in solo mode. |",
    "| Status progression | Board captures show To Do, In Progress and Done; issue history retains transitions. |",
    "| Bug | `BUG-01` created, fixed and verified before Sprint 1 close. |",
    "| Sprint completion and result | Sprint 1 closed with 26 completed points and zero carry-over; sprint report screenshot. |",
    "| Sprint 2 from remaining backlog | Five remaining items selected for Sprint 2. |",
    "| Board and progress | Board and project summary captures. |",
    "",
]
(ROOT / "docs" / "Scrum_Plan.md").write_text("\n".join(lines), encoding="utf-8")
print("Wrote docs/Scrum_Plan.md")
