/**
 * Repository-authored text files of the published Data Readiness workshop.
 * Shared by the export script and scripts/course03/refresh-published.mjs.
 */

const SITE = "https://loehrning.ai/workshops/datenbereitschaft-fuer-ki";

export const KIT_README = `# Data Readiness kit

Kit for Workshop 03, "Datenbereitschaft für KI" (Data readiness for AI). Everything uses FOLDLINE, a
made-up subscription software company. Use invented examples only. Do not enter employer, customer,
personal, or sensitive data.

## Open these first

1. \`START-HIER.md\` (Deutsch) or \`START-HERE.md\` (English): three steps, in order.
2. \`FRAGEKARTE.md\` or \`QUESTION-CARD.md\`: the five boxes for one number, with the FOLDLINE example.
3. \`claude/README.md\`: the three files for your Claude and how to install them.

## Online parts (not in this archive)

- Demo "Die Fragekarte": https://loehrning.ai/demos/datenbereitschaft-fuer-ki
- Learner guide: ${SITE}/guide.html
- Builder guide for data teams (optional follow-up): ${SITE}/builder.html

## What is in this archive

| File | What it is for |
| --- | --- |
| \`START-HIER.md\`, \`START-HERE.md\` | Three steps: the demo, the same question in your Claude, your own card. |
| \`UEBUNG.md\` | The 10-minute exercise in German: one question, two setups in your Claude. The English version is \`builder/claude-demo/README.md\`. |
| \`FRAGEKARTE.md\`, \`QUESTION-CARD.md\` | Five boxes for one number, each with the evidence file in this kit. |
| \`claude/kennzahl-fragekarte/\` | A Claude skill: before any metric, fix its kind and source, ask back on gaps, name the trace. The FOLDLINE definition sits in \`references/kennzahlen.md\`. |
| \`claude/PROJEKT-ANWEISUNG-VORLAGE.txt\`, \`claude/PROJECT-INSTRUCTIONS-TEMPLATE.txt\` | Instructions for a Claude Project, FOLDLINE edition. They guide; they do not enforce. |
| \`claude/PRUEFLISTE-VORLAGE.md\`, \`claude/TEST-LIST-TEMPLATE.md\` | Tests with expected values, FOLDLINE edition. They stay outside Claude. |
| \`builder/\` | Optional follow-up for data teams (English): warehouse SQL starter, semantic layer and short templates, naming rules, metric definitions, Claude setup, an evidence canvas, four other domains and a live Claude demo. Start with \`builder/README.md\`. |
| \`ASSET-RIGHTS.md\` | Rights notice. |

The templates are examples, not active controls. Only what Claude cannot reach is locked: a file
that is not uploaded, or a database login without the read grant.

Copyright Tim Löhr. All rights reserved. Publication on loehrning.ai does not grant reuse rights.
`;

export const KIT_ASSET_RIGHTS = "# Worksheet rights\n\nOriginal course material by Tim Löhr, published by the owner on loehrning.ai. All rights reserved. No third-party visual assets are included. Public access is not a reuse license.\n";

export const PUBLICATION = `# Public teaching edition

Published by the course owner on loehrning.ai. Original course content remains copyright Tim Löhr, all rights reserved. Fonts retain their bundled SIL Open Font License notices.

This edition includes the interactive deck, presenter notes, learner guide, an interactive demo page (\`demo.html\`) that replays results captured from the course kit on PostgreSQL 16, the kit's learner layer (start pages, question card, Claude files), and an optional builder guide with a starter kit for data teams (\`builder.html\` and \`data-readiness-kit/builder/\`). Slide 2 reuses the author-supplied portrait already published in Workshop 02, at the author's request. Its existing asset restrictions remain unchanged. This edition omits third-party interface screenshots, unused third-party marks, the supplied syllabus, authoring logs, runtime services and credentials. The screenshot appendix uses an explicitly labelled textual teaching summary. The source monospace derivatives are replaced with the platform's inventoried JetBrains Mono variable font. The cover shows the date of the live session, 25 September 2026.

The learner guide, the builder guide and its kit are written in this repository. The kit's learner layer is written here too. Fixes to the exported deck and presenter console are kept as reviewed overrides in the repository and are re-applied on every export. An export stops when the course source changes underneath one of them. The builder kit uses only the synthetic FOLDLINE company and invented examples from four other domains. It contains no passwords, keys or connection strings.

The deck always replays embedded historical observations. The demo page replays captured database results; it calls no AI and no database. The builder kit is a starting point, not a certified configuration. None of them establishes present-day model reliability, permissions or production readiness.
`;
