/**
 * Repository-authored text files of the published Data Readiness workshop.
 * Shared by the export script and scripts/course03/refresh-published.mjs.
 */

const SITE = "https://loehrning.ai/workshops/datenbereitschaft-fuer-ki";

export const KIT_README = `# Data Readiness worksheets

Worksheets and example templates for Workshop 03, "Data Readiness for AI". Everything uses
FOLDLINE, a made-up subscription software company. Use invented examples only. Do not enter
employer, customer, personal, or sensitive data.

## Open these first

1. \`START-HERE.md\`: how to use this kit, in order, plus the short words you need.
2. \`QUESTION-CARD.md\`: the five boxes. This is the only file you need during the lesson.

## Online parts (not in this archive)

- Learner guide: ${SITE}/guide.html
- Browser lab (optional, 12 minutes): ${SITE}/data-readiness-kit/readiness-lab.html
  The lab is a fixed simulation in your browser. It calls no AI and connects to no database.
- Builder guide for data teams (optional follow-up): ${SITE}/builder.html

## What is in this archive

| File | What it is for |
| --- | --- |
| \`START-HERE.md\` | The recommended order and the 12-minute lab run. |
| \`QUESTION-CARD.md\` | Five boxes for one question, with a worked FOLDLINE example. |
| \`READY-CANVAS.md\` | Optional: a lab run log and the ten checks (two per gate) with their evidence. |
| \`FOLDLINE-SCENARIOS.md\` | Optional: the six test cases the lab runs and their expected results. |
| \`semantic-template/\` | Commented example definition files: metric, model, policy and verified questions. |
| \`agent/CLAUDE.example.md\` | Example instructions for an AI assistant. They guide; they do not enforce. |
| \`builder/\` | Optional follow-up for data teams: warehouse SQL starter, semantic layer, naming rules, metric definitions, Claude setup, four other domains and a live Claude demo. Start with \`builder/README.md\`. |
| \`ASSET-RIGHTS.md\` | Rights notice. |

The templates are examples, not active controls. Instructions guide, grants enforce: only database
permissions make a forbidden read fail.

Copyright Tim Löhr. All rights reserved. Publication on loehrning.ai does not grant reuse rights.
`;

export const KIT_ASSET_RIGHTS = "# Worksheet rights\n\nOriginal course material by Tim Löhr, published by the owner on loehrning.ai. All rights reserved. No third-party visual assets are included. Public access is not a reuse license.\n";

export const PUBLICATION = `# Public teaching edition

Published by the course owner on loehrning.ai. Original course content remains copyright Tim Löhr, all rights reserved. Fonts retain their bundled SIL Open Font License notices.

This edition includes the interactive deck, presenter notes, learner guide, an interactive demo page (\`demo.html\`) that replays results captured from the course kit on PostgreSQL 16, synthetic browser lab, text worksheets, and an optional builder guide with a starter kit for data teams (\`builder.html\` and \`data-readiness-kit/builder/\`). Slide 2 reuses the author-supplied portrait already published in Workshop 02, at the author's request. Its existing asset restrictions remain unchanged. This edition omits third-party interface screenshots, unused third-party marks, the supplied syllabus, authoring logs, runtime services and credentials. The screenshot appendix uses an explicitly labelled textual teaching summary. The source monospace derivatives are replaced with the platform's inventoried JetBrains Mono variable font. The cover shows the date of the live session, 25 September 2026.

The learner guide, the builder guide and its kit are written in this repository. Fixes to the exported deck, presenter console, lab and worksheets are kept as reviewed overrides in the repository and are re-applied on every export. An export stops when the course source changes underneath one of them. The builder kit uses only the synthetic FOLDLINE company and invented examples from four other domains. It contains no passwords, keys or connection strings.

The deck always replays embedded historical observations. The demo page replays captured database results; it calls no AI and no database. The lab is a deterministic browser simulation. The builder kit is a starting point, not a certified configuration. None of them establishes present-day model reliability, permissions or production readiness.
`;
