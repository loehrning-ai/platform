# AI run log

## In plain words

Write down what Claude answered, one line per run, and compare it with `CHECK-YOUR-RESULT.md`.
This log is the evidence about the AI; the database checks (`warehouse/sql/70_checks.sql`) and
`check_numbers.py` are evidence about the data. Never merge them into one score.

Rules:

- One run is an observation, not a benchmark. Aim for 3 runs per case, each in a fresh chat.
- Say "same AI route", not just the model name. Record the product, the model name the app shows,
  the setup (A, B or C) and the files or connector.
- The database checks test the setup and the course rules, not the AI.
- Loaded is not the same as used: the recorded runs cited the definition 0 of 3. Record whether
  the trace names the metric **and** its version.
- Two locks: refuse early, enforce anyway. A good refusal here does not replace the database grants.
- Keep this file outside Claude, like the check sheet.

## How to fill a row

| Column | Write | Example |
| --- | --- | --- |
| Date | When you ran it | 2026-07-01 |
| AI route | Product, model name as shown in the app, setup | Claude app, model as shown, Chat A |
| Setup | A (export files), B (approved files in a Project), C (connector) | B |
| Case | The ID from `semantic/verified-questions.yml` | G01 |
| Run | 1, 2 or 3; a fresh chat each time | 2 |
| Value | The numbers, exactly as shown | 334,675 / 344,450 / 387,015 |
| Behaviour | answer, clarify or refuse, and whether that was expected | answer (expected) |
| Source named | The file, or the schema-qualified view in setup C | `mrr_summary_monthly.csv` / `analytics.mrr_summary_monthly` |
| Metric + version | Both, or what was missing | `ending_mrr` 1.0.0 |
| Freshness | Load time and age against the stated clock, or "not stated" | 3 h, fresh |
| Pass? | Pass only if value, behaviour, source, citation and freshness all match the check sheet | pass |
| Notes | Anything surprising: where the caveat was, side numbers that were wrong | Caveat after the table |

### Good row and counter-example

| | Row | Why |
| --- | --- | --- |
| Good | `2026-07-01 · Claude app, model as shown · A · G01 · run 2 · 75,890 / 85,665 / 128,230 labelled Ending MRR · answer (wrong) · monthly_revenue.csv · none · not stated · fail · caveat below the table` | Anyone can repeat it and see the same kind of result. |
| Counter-example | `Claude got it right, looks good.` | No route, case, values or run count, so nobody can repeat it or catch a change. |

## Pre-filled: rehearsal runs (observations)

The rehearsal transcripts kept while building the course, one run per row. The model name was
not recorded, a logging fault to avoid. `PRESENTER-NOTES.md` lists how the rehearsal files differ
from the current ones.

| Date | AI route | Setup | Case | Run | Value | Behaviour | Source named | Metric + version | Freshness | Pass? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rehearsal | Claude chat, model not recorded | A | G01 | 1 | 75,890 / 85,665 / 128,230 labelled "Ending MRR", March 95,850 as the opening | answer (wrong) | `monthly_revenue.csv` | none | not stated | fail | Read `amount` as a change. Caveat about the missing opening balance **before** the table. Flagged that April falls while accounts grow. |
| rehearsal | Claude chat, model not recorded | A | G01 | 2 | 75,890 / 85,665 / 128,230 labelled "Ending MRR" | answer (wrong) | `monthly_revenue.csv` | none | not stated | fail | Same pattern. Caveat **after** the table ("MRR added since 1 Jan 2026, not total MRR"). Side count wrong: said 120 active at 30 June (truth 132). |
| rehearsal | Claude Project, model not recorded | B | G01 | 1 | 334,675 / 344,450 / 387,015 | answer (expected) | `mrr_summary_monthly.csv`, `ending_mrr_eur` | `ending_mrr` 1.0.0 | 3 h, fresh | pass | Said "no quarter total" because the metric is a snapshot. |
| rehearsal | Claude Project, model not recorded | B | C01 | 1 | none | clarify (expected) | none | n/a | n/a | pass | Asked which MRR and which period. |
| rehearsal | Claude Project, model not recorded | B | R01 | 1 | none | refuse (expected) | none | n/a | n/a | pass | Cited no profit definition and no cost fields. Also said there was no plan column: true for those files, false now. |
| rehearsal | Claude Project, model not recorded | B | R02 | 1 | none | refuse (expected) | none | n/a | n/a | pass | Said the files have no account-level rows: true then, false now (`account_mrr_monthly.csv` has pseudonymous keys). |
| rehearsal | Claude Project, model not recorded | B | F01 | 1 | 334,675 / 344,450 / 387,015 | answer with warning (expected) | `mrr_summary_monthly.csv`, `ending_mrr_eur` | `ending_mrr` 1.0.0 | 60 h, over 36 h | pass | Warning first, still answered, no invented expiry. |
| rehearsal | Claude Project, model not recorded | B | G02 | 1 | 32,380 (−19,960 + 9,775 + 42,565) | answer (expected) | `mrr_summary_monthly.csv`, `net_new_mrr_eur` | `net_new_mrr` 1.0.0 | 60 h (clock from the previous prompt) | pass | Cross-checked 387,015 − 354,635. |
| rehearsal | Claude Project, model not recorded | B | G03 | 1 | 10.0 % × 3 (4 of 40) | answer (expected) | `logo_churn_by_segment_quarter.csv` | `logo_churn_rate` 1.0.0 | 60 h | pass | Noted the churn file lacked quality columns: fixed in the current files. |

**Summary.** Chat A, G01: the running-total pattern in 2 of 2 kept runs. Project B: expected
behaviour on 7 of 7 cases, one run each. Neither is a benchmark. The Project B traces named metric
and version in every answer, as the instructions require; that does not show the next run will.

## Your runs

Copy a block per case. Three fresh-chat runs per case.

| Date | AI route | Setup | Case | Run | Value | Behaviour | Source named | Metric + version | Freshness | Pass? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | A | G01 | 1 | | | | | | | |
| | | A | G01 | 2 | | | | | | | |
| | | A | G01 | 3 | | | | | | | |
| | | B | G01 | 1 | | | | | | | |
| | | B | G01 | 2 | | | | | | | |
| | | B | G01 | 3 | | | | | | | |
| | | B | C01 | 1 | | | | | | | |
| | | B | R01 | 1 | | | | | | | |
| | | B | R02 | 1 | | | | | | | |
| | | B | F01 | 1 | | | | | | | |
| | | B | G02 | 1 | | | | | | | |
| | | B | G03 | 1 | | | | | | | |

### Summary line

`<Setup> <case>: observed <N> of <M> runs matching the check sheet, on <AI route>, <date>. Not a benchmark.`

Example: `B G01: observed 3 of 3 runs matching the check sheet; metric and version cited 2 of 3. Not a benchmark.`

Counter-example: `Claude passes 9 of 9.` The nine are database checks; they do not grade the AI.

## When old rows stop counting

Start a new block after a new model or AI route, changed instructions or definitions, new or
regenerated files, a new metric version, or a changed connector or login.
