# Start here

This kit belongs to the workshop "Data readiness for AI". It works with FOLDLINE, an invented company
that sells software by subscription. All numbers are synthetic.

The goal in one sentence:

> Before I pass on a number an AI produced, I fill five boxes: question, approved view, kind of number
> and who counts, never show, test.

## Three steps

| Step | Open | Time | Result |
| --- | --- | --- | --- |
| 1 | Demo "The question card": loehrning.ai/en/demos/datenbereitschaft-fuer-ki | 4 minutes | Four wrong tables from the same correct file, and which box catches each. |
| 2 | `builder/claude-demo/README.md` | 10 minutes | The same question twice in your Claude: with two export files and with the approved files. Check with `builder/claude-demo/CHECK-YOUR-RESULT.md`. |
| 3 | `QUESTION-CARD.md` | 15 minutes | Your card for a number you pass on regularly. Under "Your card" in the demo it becomes the three files in `claude/`. |

## What you have afterwards

- `claude/kennzahl-fragekarte/`: a skill. Before any metric, Claude fixes its kind and source, asks
  back on gaps and names the trace at the end. The skill is bilingual; its body is German.
- `claude/PROJECT-INSTRUCTIONS-TEMPLATE.txt`: instructions for a Claude Project with your approved files.
- `claude/TEST-LIST-TEMPLATE.md`: your tests with expected values. This file never goes into Claude.

All three are filled in with the FOLDLINE example. How to install them is in `claude/README.md`.

## What this kit is not

No maturity model and no certification. It checks one question on one source. The setup for a data
team with PostgreSQL is in `builder/`.

Enter no data from your employer, your customers or any person.
