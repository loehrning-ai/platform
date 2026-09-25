# Domain packs: the FOLDLINE rules in four other businesses

## In plain words

FOLDLINE is a subscription company. Your data may be about helmets, people, web visits or support
tickets. The traps are the same. Every business has **levels** (how much is there at one moment),
**changes** (what flowed in or out during a period) and **rates** (one count divided by another).
An AI that has to guess which is which will add the wrong things. Each pack below shows one
business, one question, the wrong answer an AI can plausibly give from a raw export, and the
approved view that makes the right answer the easy one.

Each pack is one page. Read the one closest to your own work first.

## The transfer table

| Domain | Level (never add across time) | Change (adds) | Rate (recompute) | The trap | Pack |
| --- | --- | --- | --- | --- | --- |
| FOLDLINE (subscriptions) | Ending MRR: 334,675 / 344,450 / 387,015 | Net new MRR: Q2 +32,380 | Logo churn: 4 of 40 = 10 % | A change read as a level: −19,960 / 9,775 / 42,565 | the workshop |
| Bike shop (inventory) | Helmets on hand: 110 / 95 / 110 | Received 180 − sold 190 = −10 | Sell-through: 190 of 300 = 63.3 % | Levels added: "Q2 stock = 315" | [RETAIL-INVENTORY.md](RETAIL-INVENTORY.md) |
| Company (headcount) | Headcount: 206 / 202 / 206 | Hires 25 − leavers 19 = +6 | Attrition: 19 of 200 = 9.5 % | Monthly rates averaged: 3.12 % | [PEOPLE-HEADCOUNT.md](PEOPLE-HEADCOUNT.md) |
| Web shop (conversion) | Registered customers (not served) | Sessions 21,000; orders 480 | Conversion: 480 of 21,000 = 2.29 % | Channel rates averaged: 5.00 %; daily uniques added: 1,700 vs 1,450 | [WEBSHOP-CONVERSION.md](WEBSHOP-CONVERSION.md) |
| Support desk (backlog) | Open tickets: 70 / 80 / 70 | Opened 900 − closed 910 = −10 | Median resolution: 14 h (a percentile) | Status code `O` only: 41, not 70; medians averaged: 17 h | [SUPPORT-BACKLOG.md](SUPPORT-BACKLOG.md) |

Every pack uses Q2 2026 (April to June), month-end levels, the clock 2026-07-01 09:00 UTC and
synthetic data.

## What every pack contains

1. The business question, and the decision it changes.
2. The level / change / rate table, with "May I add it?" for each.
3. The five boxes of the [question card](../../QUESTION-CARD.md), filled in.
4. Bad export names next to good serving names, with the naming rule each one breaks.
5. The serving view as SQL (runnable, in [`sql/`](sql/)).
6. Metric YAML in the same fields as [`../semantic/metric.yml`](../semantic/metric.yml).
7. One verified question with real expected rows.
8. The wrong answers an AI can plausibly give from the export, and why each is wrong.
9. A "what works / what does not" table.

## Exercise (15 minutes)

1. Pick the domain closest to your work. Do not open its pack yet.
2. Write its question in one sentence: period, shape, grain.
3. Fill the four blanks. Kind of number? Rows per what? Which months? Which table?
4. Write one wrong answer an AI could give, and the arithmetic behind it.
5. Now open the pack and compare. Where your blanks differ, ask: which one would a test catch?

| Good first question | Bad first question | Why the bad one fails |
| --- | --- | --- |
| "Show helmets on hand at month end for each month of Q2 2026 at the Harbour store." | "How much stock do we have?" | No period, no store, no unit: units on hand, or value in EUR? |
| "What was company-wide attrition in Q2 2026?" | "Is attrition bad?" | No period, no base, no threshold. Nothing to test |
| "What was the order conversion rate in June 2026, by channel and for the whole shop?" | "What is our CR?" | "CR" is ambiguous; no period; per session or per visitor? |
| "Show the open-ticket backlog at each month end in Q2 2026." | "How many tickets are open?" | "Open" is also a status code; which moment? |

## The same rules, four times

| Rule | FOLDLINE | Bike shop | Headcount | Web shop | Support desk |
| --- | --- | --- | --- | --- | --- |
| Never add a level across time (AP-M02) | 1,066,140 | 315 | 614 | (not served) | 220 |
| Changes add within complete periods | +32,380 | −10 | +6 | 21,000 sessions | 900 opened |
| Last level + change = new level (identity test) | 354,635 + 32,380 = 387,015 | 120 + 180 − 190 = 110 | 200 + 25 − 19 = 206 | n/a | 80 + 900 − 910 = 70 |
| Pool rates; never average them (AP-M05) | right by luck: 12 of 120 | 63.3 %, not 37.6 % | 9.5 %, not 3.12 % or 9.8 % | 2.29 %, not 5.00 % | 71.4 % closed within 24 h |
| Write the denominator (AP-M06) | 4 of 40, not 4 of 48 | starting + received | start base (9.5 %) vs average base (9.34 %) | sessions, not visitors | tickets closed in the period |
| Words, not codes (AP-N02) | A / C / N | HBR, HLM | term_flg Y/N | cr | O / P / C / R |
| No identifiers served (R02, D01) | contact_email in core only | supplier cost prices | person rows; groups under 5 merged | visitor keys | customer emails, ticket text |

## Run the packs

You need psql and a scratch database. No Python.

```
createdb domain_packs
psql -X -v ON_ERROR_STOP=1 -d domain_packs -f domains/sql/retail_inventory.sql
psql -X -v ON_ERROR_STOP=1 -d domain_packs -f domains/sql/people_headcount.sql
psql -X -v ON_ERROR_STOP=1 -d domain_packs -f domains/sql/webshop_conversion.sql
psql -X -v ON_ERROR_STOP=1 -d domain_packs -f domains/sql/support_backlog.sql
dropdb domain_packs
```

Each file prints the right answer, then the wrong ones, and ends with a line such as
`RETAIL INVENTORY CHECKS PASS`. If a number drifts, the file raises an error instead. The files
refuse to run inside `saas_ready` or `saas_bad`. They create no roles and no passwords.

## Honesty notes

- The wrong answers in these packs are **plausible**, not recorded. They are what the arithmetic
  gives when a reader trusts the export names. FOLDLINE's recorded run is the only recorded AI
  evidence in this course, and one run is an observation, not a benchmark.
- These database checks test the views and the numbers, not an AI. To test an AI on a domain,
  run each question 3 or more times and log it the way `../claude-demo/AI-RUN-LOG.md` does.
- A pack is a pattern, not a certified design. Your owner still writes the definitions.

## What works, what does not

| Works | Does not work | Why |
| --- | --- | --- |
| Start from one question with a period, a shape and a grain | Start from "make the HR data AI-ready" | Nothing to test, so nothing to build |
| Copy the shape of a pack and change the numbers | Copy the numbers | The numbers are synthetic. Your truth comes from your owner and a second person |
| Name every trap as a test case (`known_wrong_patterns`) | Only test the happy path | A test that only checks the right answer cannot show which mistake came back |
| Serve counts next to every rate | Serve the rate alone | Nobody can pool it, check it or roll it up |
| Keep identifiers in core; grant one view by name | Grant the schema "for flexibility" | Instructions guide; grants enforce |

<details>
<summary>For builders</summary>

- The naming lint (`../naming/lint_names.sql`) finds 0 problems in the web shop and support views.
  It flags LINT-02 on `*_units_on_hand` and `*_headcount`: the heuristic only knows plural counts
  and unit suffixes. Record them as accepted exceptions, or rename (`ending_on_hand_units`,
  `ending_employees`). On the six `export_lane` tables of the four packs it lists 64 problems.
- All four packs share `sql/00_common.sql`: schemas `export_lane`, `core`, `analytics`, and one
  `core.load_status` row per subject area. Every view carries `complete_through_month`,
  `data_loaded_at_utc` and `quality_status`, and none calls `now()`.
- Grants are commented at the end of each file. Grant each view by name to your reader login;
  revoke TEMP and CREATE as in `../warehouse/ACCESS.md`.

</details>
