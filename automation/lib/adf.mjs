const text = (value, marks) => ({
  type: 'text',
  text: String(value),
  ...(marks ? { marks } : {}),
});

const paragraph = (...content) => ({
  type: 'paragraph',
  content: content.flatMap((item) =>
    typeof item === 'string' ? [text(item)] : Array.isArray(item) ? item : [item]
  ),
});

const heading = (value, level = 2) => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
});

const listItem = (value) => ({
  type: 'listItem',
  content: [paragraph(value)],
});

const orderedList = (items) => ({
  type: 'orderedList',
  attrs: { order: 1 },
  content: items.map(listItem),
});

const bulletList = (items) => ({
  type: 'bulletList',
  content: items.map(listItem),
});

const rule = () => ({ type: 'rule' });

const doc = (content) => ({
  type: 'doc',
  version: 1,
  content: content.filter(Boolean),
});

const italic = (value) => text(value, [{ type: 'em' }]);
const strong = (value) => text(value, [{ type: 'strong' }]);

function traceability(issue, epic, sprint) {
  const parts = [`Story ID: ${issue.id}`, `Epic: ${epic.summary}`];
  if (sprint) parts.push(`Sprint: ${sprint.name}`);
  else parts.push('Sprint: Product Backlog');
  return paragraph(italic(parts.join('  |  ')));
}

export function storyDescription(issue, epic, sprint) {
  return doc([
    heading('User Story', 2),
    paragraph(issue.userStory),
    traceability(issue, epic, sprint),
    heading('Context', 2),
    paragraph(issue.context),
    heading('Acceptance Criteria', 2),
    orderedList(issue.acceptanceCriteria),
    heading('Definition of Done', 2),
    bulletList([
      'Acceptance criteria verified by the Product Owner.',
      'Automated checks and peer review completed.',
      'No open blocker defects for this story.',
      'Story accepted at Sprint Review.',
    ]),
    rule(),
    paragraph(
      strong('Priority: '),
      issue.priority,
      '   |   ',
      strong('Story Points: '),
      String(issue.points),
      '   |   ',
      strong('Labels: '),
      issue.labels.join(', ')
    ),
  ]);
}

export function bugDescription(issue, epic, sprint) {
  const content = [
    heading('Bug Report', 2),
    paragraph(issue.context),
    paragraph(
      strong('Environment: '),
      issue.environment,
      '   |   ',
      strong('Severity: '),
      issue.priority,
      '   |   ',
      strong('Found in: '),
      sprint ? sprint.name : 'Product Backlog'
    ),
    paragraph(
      strong('Story ID: '),
      issue.id,
      '   |   ',
      strong('Epic: '),
      epic.summary,
      '   |   ',
      strong('Story Points: '),
      String(issue.points)
    ),
    heading('Steps to Reproduce', 2),
    orderedList(issue.stepsToReproduce),
    heading('Expected Result', 2),
    paragraph(issue.expectedResult),
    heading('Actual Result', 2),
    paragraph(issue.actualResult),
    heading('Fix Verification / Acceptance Criteria', 2),
    orderedList(issue.acceptanceCriteria),
    heading('Resolution', 2),
    paragraph(
      'Status: Done. Resolution: Fixed. The regression fix was verified in staging and the relevant automated search regression test passes.'
    ),
  ];
  if (issue.links?.length) {
    content.push(heading('Related Issues', 2));
    content.push(
      bulletList(issue.links.map((link) => `${link.type}: ${link.target}`))
    );
  }
  content.push(rule());
  content.push(
    paragraph(
      strong('Labels: '),
      issue.labels.join(', '),
      '   |   ',
      strong('Priority: '),
      issue.priority
    )
  );
  return doc(content);
}

export function epicDescription(epic) {
  return doc([
    heading('Epic Goal', 2),
    paragraph(epic.description),
    heading('Target Outcome', 2),
    paragraph(epic.outcome),
    heading('Scope Discipline', 2),
    bulletList([
      'Stories must be independently testable and traceable to this epic.',
      'Only verified, eligible materials are exposed to buyers.',
      'Every state change that affects inventory or trust must be auditable.',
    ]),
    rule(),
    paragraph(strong('Labels: '), epic.labels.join(', ')),
  ]);
}

export function commentDoc(value) {
  return doc([paragraph(value)]);
}

export { doc, paragraph, heading, orderedList, bulletList, strong, italic };
