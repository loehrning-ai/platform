# The question card

Five boxes for one number, before it goes out. Each one catches a different mistake.
Paper is enough. On the right is the filled-in FOLDLINE example from the workshop "Data readiness for AI".
FOLDLINE is invented, all numbers are synthetic.

| Box | Your answer | FOLDLINE | Catches |
| --- | --- | --- | --- |
| 1. Question: period, kind, unit, clock |  | Ending MRR for each month end, April to June 2026, in EUR. Clock 1 July 2026. | "How much MRR do we have?" Without a period and a kind there is no right answer, so ask back. |
| 2. Approved view |  | `analytics.mrr_summary_monthly`, column `ending_mrr_eur`. Nothing else. | Seven export tables in which a change is called `amount`. |
| 3. Kind of number and who counts |  | Level at month end, one row per month, April to June each on its own. Subscriptions running at month end count, new ones included. Cancelled ones do not. | −19,960 (a change read as a level), 75,890 (summed with no opening level), 1,066,140 (levels added), 120 instead of 132 active accounts. |
| 4. Boundary |  | Claude sees no contact data. Locked because the file is not in the Project; in the database the login may read five views only. | An instruction "no emails" on its own. It steers, it locks nothing. |
| 5. Test |  | April €334,675, May €344,450, June €387,015. Source: finance month-end close. "How much MRR do we have?" gets a question back. The request for emails is refused. | A number that only looks right. |

## Box 3: the gaps, row by row

| Gap | What you fix | FOLDLINE |
| --- | --- | --- |
| Kind | level, change or rate | level at month end |
| Rows | one row per day, week, month or quarter | per month |
| Period | which periods, and whether they are complete | April, May, June 2026, each on its own, complete |
| Column | which column in which view | `ending_mrr_eur` in `analytics.mrr_summary_monthly` |
| Who counts | who is in and who is not, in words first, then the codes | subscriptions running at month end, new ones included: codes A and N, 132 accounts on 30 June |

## Adding up: when yes, when never

| | across groups | across months | one number for the quarter |
| --- | --- | --- | --- |
| Level | yes | never | each month on its own, or the last one |
| Change | yes | yes | the sum |
| Rate | recompute | recompute | sum numerator and denominator again: 12 of 120 = 10.0 % |

Check: last level plus change gives the new level. 354,635 + 32,380 = 387,015.

## Box 5: how to test

- The expected value comes from outside the AI: month-end close, an approved report, a recount by a
  second person. Never from the AI you are testing.
- Test three behaviours: an answer with a value, a question back, a refusal. If you have an age rule,
  add an answer with a warning.
- Grade value and behaviour, not the working.
- Run each question three times, each in a new chat. One run is one observation.
- The test list stays outside Claude. If it sits in the Project, Claude checks itself.

## Evidence in the kit, box by box

| Box | File in the kit | In the demo |
| --- | --- | --- |
| Start | `builder/claude-demo/AI-RUN-LOG.md`, `builder/claude-demo/A-export-tables/monthly_revenue.csv` | loehrning.ai/en/demos/datenbereitschaft-fuer-ki?beat=lesarten |
| 1 and 2 | `builder/semantic/verified-questions.yml` (case C01), `builder/claude/project/mrr_summary_monthly.csv` | loehrning.ai/en/demos/datenbereitschaft-fuer-ki?beat=sicht |
| 3 | `builder/CHEATSHEET.md`, `builder/claude-demo/A-export-tables/customer_master.csv` | loehrning.ai/en/demos/datenbereitschaft-fuer-ki?beat=wer-zaehlt |
| 4 | `builder/claude/project/PROJECT-INSTRUCTIONS.txt` rule 3, `builder/warehouse/ACCESS.md` | loehrning.ai/en/demos/datenbereitschaft-fuer-ki?beat=grenze |
| 5 | `builder/claude-demo/CHECK-YOUR-RESULT.md` | loehrning.ai/en/demos/datenbereitschaft-fuer-ki?beat=test |

## Blank card

| Box | |
| --- | --- |
| 1. Metric · question · clock |  |
| 2. Approved view · column |  |
| 3. Kind · who counts, who does not |  |
| 4. Never show · locked by |  |
| 5. Expected values · unit · source |  |

Under "Your card" in the demo this card becomes a skill, Project instructions with `kennzahlen.md` and a
test list, made in your browser.
