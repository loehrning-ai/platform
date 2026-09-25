# Anti-patterns

## In plain words

This is every known way the FOLDLINE question went wrong, or could have gone wrong, in one list.
Each entry says what you would notice, what happened at FOLDLINE, why it fails, how to fix it,
and which test catches it.

Use it two ways:

- **Before you build:** read the group for the step you are on (see `BUILD-ORDER.md`).
- **After something looks wrong:** search this page for the symptom.

Test IDs refer to `semantic/verified-questions.yml` (G, C, R, D, B, Q, F, T cases) and
`naming/lint_names.sql` (LINT cases). "Review" means a person has to check it; no query can.
"Module" is the matching module in `builder.html`.

Groups: [Question](#ap-q-question) · [Naming](#ap-n-naming) · [Layers](#ap-l-layers) ·
[Metrics](#ap-m-metrics) · [Serving views](#ap-s-serving-views) · [Access](#ap-a-access) ·
[Claude](#ap-c-claude) · [Freshness](#ap-f-freshness) · [Tests](#ap-t-tests) ·
[Evidence](#ap-e-evidence)

---

## AP-Q Question

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-Q01 | The goal has no period, shape or unit | "Make our data AI-ready." "How much revenue?" | No question means no truth, so nothing can be tested | One sentence with a period, a level-or-change and a grain | Review; C01 for the "revenue" form | Semantic layer |
| AP-Q02 | Nobody can approve a definition change | An unfilled template: `owner: replace-with-team` | Every edge case becomes an argument; the 60-hour case has nobody to escalate to | A named team: `owner: revenue_analytics` | Review | Semantic layer |

## AP-N Naming

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-N01 | Generic column names | `monthly_revenue.amount`, `.dt`, `customer_master.seg` | `amount` hides that the value is a monthly change; the recorded run read it as a level | `net_new_mrr_eur`, `month_start`, `customer_segment` | LINT-01 | Names |
| AP-N02 | Status codes | `acct_history.state` and `customer_master.status` = A, C, N | The AI searched 'active' and found 0 of 0 | Decode in core: `active`, `churned`, `new` | LINT-06 | Names |
| AP-N03 | Table named after where it came from, or after what it sounds like | `subscription_export` (June only); `monthly_revenue` (holds changes) | "Three of them sound like the answer." The name promises a total and a full history | Name the content and grain: `mrr_summary_monthly` | LINT-07; review | Names |
| AP-N04 | A trusted-looking alias on the wrong number | The recorded run's output column `ending_mrr` on a sum of changes | A label is not evidence; the checklist counted it as a trust signal | Serve `ending_mrr_eur`; grade values against the truth, not labels | G01 | Names |
| AP-N05 | Percent stored as 0–1 in a `_pct` column | (Trap; FOLDLINE stores 10.0) | 0.100 read as percent shows 0.1 % churn | `_pct` means 0–100; `_ratio` means 0–1 | Review; a range check such as `max(logo_churn_rate_pct) > 1` on real data | Names |

## AP-L Layers

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-L01 | The AI reads source or core | `CLAUDE.example.md` says "Never query raw, core, or staging assets directly": an instruction, not a grant | Core holds identifiers and unserved columns; the AI has many look-alike choices | Serve only `analytics`; grant nothing else | D01 | Layers |
| AP-L02 | One login sees every table | `foldline_bad_reader` sees all 7 export tables | Too much reach, too many choices, no meaning | A login that sees the 5 approved views | B-P01 | Layers |
| AP-L03 | Cleaning happens in the prompt | "Ignore rows in a retry batch; A means active" | Every run re-derives the cleaning, differently | Clean once in core; test it | Review; Q01 | Layers |

## AP-M Metrics

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-M01 | A change read as a level | Ending MRR "April −€19,960" (recorded run) | A monthly change answers a different question; a level cannot be negative here | `type: snapshot` on `ending_mrr_eur`; the change is `net_new_mrr_eur` | G01 | Bathtub |
| AP-M02 | Levels added across months | 334,675 + 344,450 + 387,015 = 1,066,140 | Three month-ends added describe nothing | `additivity.across_time: none`; return three rows or the last month | G01 (ai_run); review | Can I add these? |
| AP-M03 | Changes subtracted as if they were levels | 42,565 − 60,160 = −17,595 (recorded export-lane run) | Level(end) − level(start) works only for levels | Sum the changes (32,380) or subtract levels (387,015 − 354,635) | G02, Q02 | Bathtub |
| AP-M04 | A level rebuilt from changes with no opening balance | 75,890 / 85,665 / 128,230 (dry run, one observation) | The first level is missing; every month is short by 258,785 | Serve the level; never ask the AI to reconstruct it | G01 (ai_run) | Bathtub |
| AP-M05 | Rates averaged | Web shop: (2 % + 8 %) ÷ 2 = 5.00 % vs pooled 2.29 % | Small groups weigh as much as large ones | Pool: total numerator ÷ total denominator; ship both counts | Review; FOLDLINE is right by luck (equal bases of 40) | Can I add these? |
| AP-M06 | New joiners in the churn base | 4 of 48 = 8.33 % (deck's export-lane check) | Joiners were never in the starting base | `population`: active at the end of the prior month | G03, Q04 | Can I add these? |
| AP-M07 | 0 ÷ 0 shown as 0 % | "0 of 0" after searching 'active' | Claims nobody left when nothing was measured | `zero_denominator: "null"`; say "no rate" | Review; `nullif` in the view | Can I add these? |
| AP-M08 | A proxy for an undefined metric | Profit by plan answered from MRR | Silently changes the question | Refuse (R01) unless a labelled proxy is requested and allowed | R01 | Semantic layer |

## AP-S Serving views

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-S01 | Mixed grains in one table | `monthly_revenue` has one row per segment per month; readers sum it in different ways | "Rows per what?" has two answers | Grain in the name and the key; one grain per view | Q01; LINT-07 | Serving views |
| AP-S02 | A rate without its counts | (Avoided: the churn view ships 40 and 4 with 10.0 %) | Nobody can check or pool the rate | `starting_accounts`, `churned_accounts` next to `logo_churn_rate_pct` | LINT-05 | Serving views |
| AP-S03 | A partial period that looks complete | `subscription_export` holds June 2026 only | A top-10 or a trend from it is silently one month | Serve complete periods; `complete_through_month` on every row | Q03 | Serving views |
| AP-S04 | Duplicate rows inflate sums | `billing_events` repeats every 19th movement in a retry batch | The recorded export check is higher in four countries (AT 1,955 vs 1,565), consistent with the repeated rows | Deduplicate in core with a uniqueness test | G04; Q01 | Layers |
| AP-S05 | `now()` inside a view | (Avoided: `data_status_by_view` stores facts; the reader supplies the clock) | Every re-run gives a different age; frozen tests are impossible | Store `data_loaded_at_utc`; compute age against a stated clock | F00, F01 | Freshness |
| AP-S06 | One mega-view for everything | "Give the AI one wide table with every column" | Mixed grains, identifiers and many look-alike columns come back | One view per question family (FOLDLINE: five) | Review; B-P01 | Serving views |

## AP-A Access

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-A01 | Read-only mode treated as the lock | `ALTER ROLE ... SET default_transaction_read_only = on` | It is a default. The reader can run `BEGIN READ WRITE` | The lock is missing privileges: no write, TEMP or CREATE; SELECT on five views | B-W01 | Access |
| AP-A02 | TEMP left to PUBLIC | PostgreSQL grants TEMP on a new database to PUBLIC | With `BEGIN READ WRITE`, the reader created a temp table (verified on PostgreSQL 16) | `REVOKE TEMP ON DATABASE saas_ready FROM PUBLIC` | B-T01 | Access |
| AP-A03 | A denylist | Grants that follow only a `deny: schemas [raw, core, staging]` list | A new schema such as `tmp_export` is open the day it appears | An allowlist: `analytics`, five named views | B-P01 | Access |
| AP-A04 | The connector logs in as a superuser or owner | "It's only for the demo" | Every instruction becomes the only lock | Connector uses `foldline_ready_reader` | D01 via the connector | Claude |
| AP-A05 | A connection string in CLAUDE.md or a Skill | `postgres://...` pasted "for convenience" | The file is read by Claude and often committed | `${FOLDLINE_READY_DSN}` from the environment | Review; secret scan | Claude |
| AP-A06 | Pseudonymous treated as anonymous | `account_key` fl_0006 called "anonymous" | A stable key is joinable back to a person or company | Call it pseudonymous; row limit; no identifiers served | R02; review | Access |
| AP-A07 | Default privileges auto-grant new views | `ALTER DEFAULT PRIVILEGES ... GRANT SELECT ON TABLES TO` the reader | A new view is exposed before anyone reviews it | Grant each view by name | B-P01 | Access |
| AP-A08 | Views owned by a superuser | Views created by `postgres` | Views run with the owner's rights; a superuser owner bypasses row-level security | Owner `foldline_owner` (NOLOGIN, not superuser) | Review | Access |
| AP-A09 | CONNECT left to PUBLIC on other databases | `saas_bad` created with default privileges | The reader can connect to the export lane | `REVOKE CONNECT ON DATABASE saas_bad FROM PUBLIC` | B-X01 | Access |

## AP-C Claude

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-C01 | The prompt used as the lock | "Please do not read contact emails" | An instruction guides; the lab reports that a prompt warning did not stop the email request | Refuse early (instructions) and enforce anyway (grants) | R02 and D01 | Claude |
| AP-C02 | The definition loaded but not used | Runs used an approved example 3 of 3, cited the definition 0 of 3 | Loaded is not the same as used | Require metric name and version in the trace; grade it | ai_run G01–G03 `metric_citation` | Semantic layer |
| AP-C03 | A vague Skill description | `description: analytics helper` | Claude loads a Skill when the description matches; a vague one never triggers, or triggers everywhere | Name the trigger words: ending MRR, net new MRR, logo churn, expansion, top accounts | Review; ai_run trace | Claude |
| AP-C04 | The export uploaded "for context" | Adding `monthly_revenue.csv` to the Project B knowledge | Claude may pick it; the look-alike returns | Upload only approved files | Review; G01 (ai_run) | Claude |
| AP-C05 | Unqualified names relying on `search_path` | Recorded ready run: unqualified SQL resolved via `analytics,public` | Another connection finds nothing, or something else | Always `analytics.<view>`; role `search_path = ''` | B-S01 | Claude |

## AP-F Freshness

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-F01 | The data's age is hidden | Lab choice "Hide the data's age": a 60-hour snapshot returned with no warning | Right meaning is not the same as fresh data | Warn after 36 h; state load time, age and clock | F01 | Freshness |
| AP-F02 | An invented expiry | "Older than 48 h: refuse" | No block rule was written; the owner never agreed | Warn and escalate to the owner; block only on written rules | F01 (`hard_expiry_hours: null`) | Freshness |

## AP-T Tests

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-T01 | One happy-path test | Lab choice 05 "only one ordinary answer" | It cannot report on clarify, refuse, deny or stale | Five behaviours: answer, ask back, refuse, deny, stale | Review of the case list | Tests |
| AP-T02 | Placeholder expected rows | An unfilled template: `expected_rows: replace-with-reviewed-values` | A test with no truth cannot fail | Real rows with `truth_source` | Review; a harness should fail on any placeholder | Tests |
| AP-T03 | Grading the SQL text | "The query must match this string" | Two correct queries differ; a pretty wrong query passes | Grade value and behaviour | Review | Tests |
| AP-T04 | The truth computed by the AI under test | "Ask Claude what April should be" | The test then measures agreement with itself | Owner plus a second person, independently | Review of `truth_source` | Tests |
| AP-T05 | The harness uses `SET ROLE` | `SET ROLE foldline_ready_reader` in a superuser session | Role settings (search_path, read-only default) apply only at login; B-S01 passes or fails for the wrong reason | Connect as the login (`psql -U foldline_ready_reader`) | B-S01 | Tests |

## AP-E Evidence

| ID | Symptom | FOLDLINE instance | Why it fails | Fix | Caught by | Module |
| --- | --- | --- | --- | --- | --- | --- |
| AP-E01 | "Same model" | The recording names the AI route, not the model version | The underlying model version was not established | Say "same AI route" | Review | Tests |
| AP-E02 | One run used as a benchmark | One recorded run per question per lane | Another run can differ, as the dry runs did | "One run is an observation, not a benchmark"; 3 or more runs per case | Review of the run log | Tests |
| AP-E03 | Database checks read as an AI score | "9 of 9 tests pass, so the AI scores 9 of 9" | They test the database and course rules, not the AI | Two planes, two reports | Review | Tests |
| AP-E04 | An average across controls | "Eight of ten checks proven: 80 % ready" | A weak check hides behind the average | The weakest check decides: not ready, pilot only, bounded ready | Review of READY-CANVAS | Build |

---

## The five that matter most for a first build

1. **AP-M01** (change read as a level): serve the level and name it `ending_mrr_eur`.
2. **AP-A01** (read-only as the lock): the lock is missing privileges; test with B-W01.
3. **AP-C02** (loaded, not used): require and grade the metric citation.
4. **AP-T04** (truth from the AI): two people compute it first.
5. **AP-E03** (database checks as an AI score): keep the two planes apart.
