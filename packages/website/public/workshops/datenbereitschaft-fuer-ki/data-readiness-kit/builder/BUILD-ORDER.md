# Build order: from one question to a tested, Claude-ready lane

## In plain words

The five boxes from the lesson (question, approved view, four blanks, boundary, test) are a
**design order**: they tell you what to decide. This file is the **build order**: what to make,
in which sequence, and how you know each step is done.

Three rules hold the whole way through:

1. **Build one question end to end** before you add a second. FOLDLINE's is *"Show ending MRR by
   month for the last complete quarter."*
2. **Write the truth before you connect any AI.** The right answer (334,675 / 344,450 / 387,015)
   is written down in step 2. Claude arrives in step 10.
3. **Every step ends with evidence you can run**, not with a document you can read. A note by
   itself cannot make a failing check pass.

---

## Roles

One person may hold several roles. The tester should not be the person who built the lane.

| Role | Does | FOLDLINE |
| --- | --- | --- |
| Question owner | Decides what the number means; approves every definition change | revenue_analytics |
| Data builder | Names, cleans and serves the data (core and analytics) | analytics engineering |
| Database admin | Creates the login and the grants | platform team |
| AI configurer | Sets up the Claude Project, CLAUDE.md, Skill and connector | the analyst who uses Claude |
| Tester | Computes the truth independently and runs every case | a second person |

---

## The steps

Each step lists: who, input, output file, **done when** (executable evidence), the FOLDLINE
example, and the anti-patterns it prevents (IDs from `ANTI-PATTERNS.md`).

### Step 0. Pick the question and the owner

| | |
| --- | --- |
| Who | Question owner |
| Input | A decision someone makes every month or quarter |
| Output | The five boxes in `QUESTION-CARD.md` |
| Done when | A second person restates the period, the kind of number, the rows and the unit without asking a question |
| FOLDLINE | "Show ending MRR by month for the last complete quarter." Owner: revenue_analytics. Decision: the board pack |
| Prevents | AP-Q01 vague question, AP-Q02 no owner |

### Step 1. Fill the four blanks and list the expected behaviours

| | |
| --- | --- |
| Who | Question owner with the data builder |
| Input | Step 0 |
| Output | A first `semantic/metric.yml` block (`type`, `result_grain`, `period_rule`, `relation`) and the list of cases in `semantic/verified-questions.yml` (behaviours only, no rows yet) |
| Done when | Each blank has exactly one answer. Each case has one behaviour: answer, clarify, refuse, deny or stale |
| FOLDLINE | Level · one row per month · Apr–Jun, never add months · `analytics.mrr_summary_monthly`. Cases: G01 answer, C01 ask back, R01 and R02 refuse, D01 deny, F01 answer with a warning |
| Prevents | AP-M01 change read as a level, AP-M02 levels summed, AP-T01 one happy path |

### Step 2. Write the truth

| | |
| --- | --- |
| Who | Question owner and tester, **independently** |
| Input | The source data, a spreadsheet or SQL, and step 1 |
| Output | `expected_rows` and `truth_source` for every answer case in `verified-questions.yml` |
| Done when | Both people get the same numbers. No placeholder row is left. The AI under test was not used |
| FOLDLINE | G01 334,675 / 344,450 / 387,015; G02 32,380; G03 4 of 40 = 10.0 % per segment |
| Prevents | AP-T02 placeholder rows, AP-T04 truth computed by the AI |

### Step 3. Inventory the sources and name things

| | |
| --- | --- |
| Who | Data builder |
| Input | The tables you have today (FOLDLINE: seven export tables) |
| Output | `naming/NAMING-REVIEW.md` filled in; a rename map |
| Done when | Every column that will be served has a name a stranger can read. `naming/lint_names.sql` on the old tables prints the known failures |
| FOLDLINE | `monthly_revenue.amount` → `net_new_mrr_eur`; `dt` → `month_start`; `seg` → `customer_segment`; `A/C/N` → `active/churned/new` |
| Prevents | AP-N01 generic names, AP-N02 status codes, AP-N03 source-named tables, AP-N04 misleading alias |

### Step 4. Build core

| | |
| --- | --- |
| Who | Data builder |
| Input | Source tables, rename map |
| Output | `warehouse/sql/30_core.sql` (tables with keys, decoded values, deduplicated movements) |
| Done when | Primary keys hold; the retry duplicates are gone (uniqueness test); status codes are words; `core.account_months` has 2,592 rows (144 accounts × 18 months) |
| FOLDLINE | `billing_events` repeated every 19th movement; core keeps one |
| Prevents | AP-S04 retry duplicates, AP-L03 cleaning in the prompt |

### Step 5. Build the serving views

| | |
| --- | --- |
| Who | Data builder |
| Input | Core tables; the grain each question needs |
| Output | `warehouse/sql/40_analytics.sql`: one view per question family, with data-state columns and `COMMENT ON` carrying "definition 1.0.0" |
| Done when | Q01 (unique grain), Q02 (bathtub identity), Q03 (complete months only), Q05 (accounts sum to the company) and Q06 (version in the comment) pass. `lint_names.sql` returns 0 rows for `analytics` |
| FOLDLINE | Five views. `mrr_summary_monthly` holds the level and the changes side by side |
| Prevents | AP-S01 mixed grains, AP-S02 rate without counts, AP-S03 partial period, AP-S05 `now()` in a view, AP-S06 mega-view, AP-M04 missing opening balance |

### Step 6. Write the semantic files

| | |
| --- | --- |
| Who | Data builder, approved by the question owner |
| Input | The views and step 1 |
| Output | `semantic/model.yml`, `semantic/metric.yml` (complete) |
| Done when | Every column of every view appears in `model.yml` with a unit; every metric's `relation` exists; the four blanks can be read off each metric; the owner has approved version 1.0.0 |
| FOLDLINE | Five approved metrics; `ending_mrr` is `snapshot`, `across_time: none` |
| Prevents | AP-M05 averaged rates, AP-M06 wrong base, AP-M07 0/0 as 0 %, AP-N05 `_pct` stored as 0–1 |

### Step 7. Lock access

| | |
| --- | --- |
| Who | Database admin |
| Input | The list of five views |
| Output | `warehouse/sql/60_access.sql` |
| Done when | Connected **as the login** (not with `SET ROLE`): D01, B-W01, B-T01 return 42501; B-S01 returns 42P01; B-X01 returns false; B-P01 lists exactly five SELECT grants |
| FOLDLINE | `foldline_ready_reader`: SELECT on five views, no TEMP, no CREATE, no CONNECT on `saas_bad` |
| Prevents | AP-A01 read-only mode as the lock, AP-A02 TEMP left to PUBLIC, AP-A03 denylist, AP-A07 auto-granting default privileges, AP-A08 superuser-owned views, AP-A09 CONNECT left to PUBLIC, AP-T05 SET ROLE harness |

### Step 8. Write the policy

| | |
| --- | --- |
| Who | Question owner and database admin |
| Input | Steps 1 and 7 |
| Output | `semantic/policy.yml` |
| Done when | It is an allowlist. Every rule says what backs it (guides, application or database). The C01, R01 and R02 messages are written out. Freshness says warn at 36 h and names the only block rules |
| FOLDLINE | "Two locks: refuse early, enforce anyway." |
| Prevents | AP-C01 prompt as the lock, AP-F01 hiding the age, AP-F02 invented expiry |

### Step 9. Run the database checks

| | |
| --- | --- |
| Who | Tester |
| Input | Steps 2, 5 and 7 |
| Output | The printed output of `warehouse/sql/70_checks.sql`, saved as a receipt with date, dataset ID and definition version |
| Done when | `DB CHECKS n of n PASS`. The receipt says: "These test the database and course rules, not the AI." |
| FOLDLINE | The deck's nine (G01–G05, C01, R01, R02, D01) plus B-, Q-, T- and F- cases; `70_checks.sql` runs 22. In the deck, C01, R01 and R02 were course rules checked outside the AI tool, before any SQL. The builder kit has no policy engine, so Claude's instructions carry them and they are graded in step 11. A pass there is guidance evidence, not the deck's C01/R01/R02 result. R02 stays backed by D01 (42501) |
| Prevents | AP-E03 database checks read as an AI score |

### Step 10. Compile to Claude and connect

| | |
| --- | --- |
| Who | AI configurer |
| Input | `metric.yml`, `policy.yml`, the login |
| Output | `claude/project/` (Setup A), `CLAUDE.md` plus `.claude/skills/foldline-analytics/` (Setup B), or a connector config using `${FOLDLINE_READY_DSN}` (Setup C). FOLDLINE's finished versions are in `claude/` (`claude/README.md`; `CLAUDE.example.md` becomes your `CLAUDE.md`): copy and adapt them |
| Done when | Every reader shows `ending_mrr` version 1.0.0. The connector logs in as `foldline_ready_reader`. No credential appears in any file. The export tables are not uploaded "for context" |
| FOLDLINE | See `claude/README.md` |
| Prevents | AP-C03 vague Skill description, AP-C04 export uploaded for context, AP-C05 unqualified names, AP-A04 superuser connection, AP-A05 DSN in CLAUDE.md |

### Step 11. Run the AI cases and gate

| | |
| --- | --- |
| Who | Tester (a second person) |
| Input | The ai_run cases in `verified-questions.yml` |
| Output | `claude-demo/AI-RUN-LOG.md` (at least 3 runs per case), `READY-CANVAS.md` filled |
| Done when | Each run is graded on value, behaviour, schema-qualified relation, metric-and-version citation and stated freshness. The weakest canvas check sets the verdict |
| FOLDLINE | Values 3 of 3, definition cited 0 of 3, SQL leaned on `search_path`, one run each: **limited pilot, not signed off** |
| Prevents | AP-C02 definition loaded but not cited, AP-E01 "same model", AP-E02 one run as a benchmark, AP-E04 average across controls |

---

## Time guide

For a question of FOLDLINE's size, with a person who has done it once before:

| Steps | Typical time | Note |
| --- | --- | --- |
| 0–2 | One meeting, about an hour | Most delays come from step 2: two people disagree about the truth. That disagreement is the finding |
| 3–6 | Half a day to two days | Depends on how messy the sources are |
| 7–9 | About two hours | Most of it is reading the check output |
| 10–11 | About two hours plus the runs | Three runs per case, per AI route |

The FOLDLINE kit runs steps 4–9 for you in about a minute (`warehouse/README.md`); reading the output takes about 15 minutes.

---

## Re-run triggers

Each change below invalidates the old receipts. Re-run the checks it touches before anyone uses
an answer again.

| Change | Re-run | Why |
| --- | --- | --- |
| Schema change (a column, a view, a type) | Steps 5–11 | A renamed column can make a correct query return nothing, or something else |
| Metric version change | Steps 6, 9–11; for a major bump, every case | The truth itself may have changed |
| Policy change | Steps 7–11 | A new grant can open a door a test proved closed |
| Data load | Step 9 (Q- and F- cases); step 11 spot checks | Freshness and reconciliations are per load |
| AI route or model change | Step 11 | "Same AI route" is part of every AI receipt |
| A change to instructions, the Skill or CLAUDE.md | Step 11 | A clearer prompt can move the failure, not only remove it |

---

## Gate: the ship rule

Use `READY-CANVAS.md`. It has five gates (Restricted surface, Explicit structure, Agreed meaning,
Dependable data, Yardstick) with two checks each: R1, R2, E1, E2, A1, A2, D1, D2, Y1, Y2. Give each
check a level: **0** unproven (no evidence, or the test failed), **1** documented (written down, not
tested), **2** proven (a repeatable test passed). The weakest check decides; an average never
overrides it.

| Verdict | Meaning |
| --- | --- |
| Not ready | At least one check is at level 0 |
| Pilot only | Every check is at least documented; at least one is not proven |
| Bounded ready | All ten checks are proven for the declared question and surface |

**FOLDLINE: Pilot only, spoken as "limited pilot, not signed off".** The database checks pass and
the AI values matched 3 of 3. But check A2 (runtime consumption) stays at level 1: the definition
is written down, and the runs cited it 0 of 3, so nothing proves the answer used it. The SQL leaned
on a `search_path` setting, and there was one run per question, so Y2 (regression) is not proven
either.

## What works and what does not

| What works | What does not | Why the second one fails |
| --- | --- | --- |
| Write the truth (step 2) before any AI is connected | Ask the AI first, then check whether it "looks right" | FOLDLINE's wrong answer ran without errors, had valid SQL, a column named `ending_mrr` and three tidy rows |
| One question end to end | All metrics at once | Nothing reaches step 11, so nothing is proven |
| Lock access (step 7) before connecting Claude (step 10) | Connect Claude to a broad login "for now" | The export login saw all 7 tables; the first connection is the one that leaks |
| Keep database receipts and AI runs apart | One combined score | "9 of 9" was the database; the definition was cited 0 of 3 |
| Re-run on every trigger | Keep last month's green receipt | A receipt proves the system that existed when it ran |

---

## Printable checklist

- [ ] 0. Question and owner written; a second person restated it
- [ ] 1. Four blanks filled; behaviours listed (answer, clarify, refuse, deny, stale)
- [ ] 2. Truth rows computed twice, independently; no placeholders
- [ ] 3. Served names reviewed; rename map written
- [ ] 4. Core built; keys, dedupe and decoded statuses tested
- [ ] 5. Views built; Q01, Q02, Q03, Q05, Q06 pass; lint 0 rows on analytics
- [ ] 6. `model.yml` and `metric.yml` complete; owner approved 1.0.0
- [ ] 7. Access locked; D01, B-W01, B-T01, B-S01, B-X01, B-P01 pass as the login
- [ ] 8. `policy.yml` is an allowlist; every rule says what backs it
- [ ] 9. `DB CHECKS n of n PASS` saved as a receipt
- [ ] 10. Claude readers show metric and version; no credentials in files
- [ ] 11. AI cases run 3 times each and logged; READY-CANVAS verdict written
