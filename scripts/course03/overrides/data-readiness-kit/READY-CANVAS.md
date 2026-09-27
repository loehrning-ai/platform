# Evidence canvas

Optional technical follow-up to the five boxes in `QUESTION-CARD.md`: does each choice have
evidence behind it? Score one question and one AI-facing data surface, and attach evidence, not
intentions. Terms: [guide glossary](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html#glossary).

## Scope

| Field | Your entry | FOLDLINE lab example |
| --- | --- | --- |
| Question |  | Show ending MRR by month for the last complete quarter. |
| Data surface (approved view) |  | `analytics.mrr_summary_monthly` |
| Practice data (fixture) |  | `FOLDLINE-AGG-001` |
| Definition version |  | `ending_mrr` 1.0.0 |

Lock the four blanks and who counts from box 3 of the question card.

## Lab run log

The witness fills one row per lab run. The run hash changes whenever a choice changes.

| Run | Choice changed | Run hash | Pass / fail / not run | Verdict | First weak check | Old results out of date? (skeptic) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | none (defaults) |  |  /  /  |  |  | n/a |
| 2 |  |  |  /  /  |  |  | yes / no |
| 3 |  |  |  /  /  |  |  | yes / no |
| 4 |  |  |  /  /  |  |  | yes / no |
| 5 |  |  |  /  /  |  |  | yes / no |
| 6 |  |  |  /  /  |  |  | yes / no |

## The ten checks

Five gates, two checks each, named as in the browser lab. "Yardstick" is the set of tests that
judges the result.

Level: **0** = unproven (no evidence, or the test failed). **1** = documented (written down, not
tested). **2** = proven (a repeatable test passed).

| Gate | Check | Required proof | Level (0/1/2) | Evidence | Owner | Next test |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Restricted surface | R1 Catalog boundary | One named read-only login can read only the approved view. |  |  |  |  |
| 1. Restricted surface | R2 Hard denial | A test shows the database denies raw tables and direct identifiers (PostgreSQL: SQLSTATE 42501). |  |  |  |  |
| 2. Explicit structure | E1 Grain contract | The approved view declares one row per month, a stable key and its time rule. |  |  |  |  |
| 2. Explicit structure | E2 Structural validation | Names, types, allowed values and relationships are machine-readable and validated. |  |  |  |  |
| 3. Agreed meaning | A1 Metric contract | Formula, population, period, unit, owner and limits are written down and versioned. |  |  |  |  |
| 3. Agreed meaning | A2 Runtime consumption | The answer shows it used the versioned definition (for example, it cites `ending_mrr@1`). A correct value alone cannot show this. |  |  |  |  |
| 4. Dependable data | D1 Observable state | Freshness, lineage, version and owner appear with the answer. |  |  |  |  |
| 4. Dependable data | D2 Failure path | A test shows what happens with old data: warn after 36 h, and escalate because no hard expiry is declared. |  |  |  |  |
| 5. Yardstick | Y1 Ground truth | Fixed questions carry reviewed values, periods, units and allowed views. |  |  |  |  |
| 5. Yardstick | Y2 Regression | All test cases run again after every relevant change: answers, questions back, refusals and denials. |  |  |  |  |

## Ship rule

- **Not ready:** at least one check is at level 0.
- **Pilot only:** every check is at least documented, but at least one is not proven.
- **Bounded ready:** all ten checks are proven for the declared question and surface.

An average never overrides a weak check. This is an evidence gate for one question, not a maturity
model or a certification. Lab run records prove only the FOLDLINE practice data; grade another
system with its own runtime and database evidence.
