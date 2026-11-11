import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "jira" / "data"
OUT = ROOT / "jira" / "import"
OUT.mkdir(parents=True, exist_ok=True)

project = json.loads((DATA / "project.json").read_text(encoding="utf-8"))
epics = json.loads((DATA / "epics.json").read_text(encoding="utf-8"))
sprints = json.loads((DATA / "sprints.json").read_text(encoding="utf-8"))
issues = []
for name in ("stories-foundation.json", "stories-discovery.json", "stories-delivery.json"):
    issues.extend(json.loads((DATA / name).read_text(encoding="utf-8")))

epic_by_id = {e["id"]: e for e in epics}
sprint_by_id = {s["id"]: s for s in sprints}


def description(issue):
    parts = []
    if issue["type"] == "Bug":
        parts += [
            "BUG REPORT",
            issue["context"],
            "",
            f"Environment: {issue.get('environment', '')}",
            "",
            "Steps to reproduce:",
            *[f"{n}. {step}" for n, step in enumerate(issue.get("stepsToReproduce", []), 1)],
            "",
            f"Expected: {issue.get('expectedResult', '')}",
            f"Actual: {issue.get('actualResult', '')}",
            "",
            "Fix verification / acceptance criteria:",
            *[f"- {ac}" for ac in issue["acceptanceCriteria"]],
        ]
    else:
        parts += [
            "USER STORY",
            issue["userStory"],
            "",
            "CONTEXT",
            issue["context"],
            "",
            "ACCEPTANCE CRITERIA",
            *[f"{n}. {ac}" for n, ac in enumerate(issue["acceptanceCriteria"], 1)],
            "",
            "DEFINITION OF DONE",
            "- Acceptance criteria verified by the Product Owner.",
            "- Automated checks and peer review completed.",
            "- No open blocker defects remain.",
            "- Story accepted at Sprint Review.",
        ]
    parts += [
        "",
        f"Traceability: {issue['id']} | Epic: {epic_by_id[issue['epic']]['summary']} | "
        f"Sprint: {sprint_by_id[issue['sprint']]['name'] if issue['sprint'] else 'Product Backlog'} | "
        f"Priority: {issue['priority']} | Story Points: {issue['points']}",
    ]
    return "\n".join(parts).strip()


fieldnames = [
    "Issue ID",
    "Issue Type",
    "Summary",
    "Description",
    "Priority",
    "Story Points",
    "Epic",
    "Labels",
    "Sprint",
    "Assignee",
    "Initial Status",
    "Resolution",
]
with (OUT / "ReClaim_Backlog_Import.csv").open("w", newline="", encoding="utf-8-sig") as handle:
    writer = csv.DictWriter(handle, fieldnames=fieldnames)
    writer.writeheader()
    for issue in issues:
        writer.writerow(
            {
                "Issue ID": issue["id"],
                "Issue Type": issue["type"],
                "Summary": issue["summary"],
                "Description": description(issue),
                "Priority": issue["priority"],
                "Story Points": issue["points"],
                "Epic": epic_by_id[issue["epic"]]["summary"],
                "Labels": " ".join(issue["labels"]),
                "Sprint": sprint_by_id[issue["sprint"]]["name"] if issue["sprint"] else "",
                "Assignee": issue["assignee"],
                "Initial Status": issue["status"],
                "Resolution": issue.get("resolution", ""),
            }
        )

with (OUT / "ReClaim_Epics_Import.csv").open("w", newline="", encoding="utf-8-sig") as handle:
    writer = csv.DictWriter(handle, fieldnames=["Epic ID", "Epic Name", "Description", "Labels", "Color"])
    writer.writeheader()
    for epic in epics:
        writer.writerow(
            {
                "Epic ID": epic["id"],
                "Epic Name": epic["summary"],
                "Description": epic["description"] + "\n\nTarget outcome: " + epic["outcome"],
                "Labels": " ".join(epic["labels"]),
                "Color": epic["color"],
            }
        )

with (OUT / "ReClaim_Sprint_Plan.csv").open("w", newline="", encoding="utf-8-sig") as handle:
    writer = csv.DictWriter(
        handle,
        fieldnames=["Sprint", "Goal", "Start", "End", "Status", "Planned Points", "Issues"],
    )
    writer.writeheader()
    for sprint in sprints:
        writer.writerow(
            {
                "Sprint": sprint["name"],
                "Goal": sprint["goal"],
                "Start": sprint["startDate"][:10],
                "End": sprint["endDate"][:10],
                "Status": sprint["status"],
                "Planned Points": sprint["plannedPoints"],
                "Issues": ", ".join(sprint["scope"]),
            }
        )

print(f"Wrote 3 CSV files to {OUT}")
