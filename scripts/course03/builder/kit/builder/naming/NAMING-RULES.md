# Naming rules

## In plain words

A name is the only documentation that travels with every query. A person can ask a colleague
what `amount` means. An AI cannot. It reads the name, guesses, and writes a query that runs.

That is what happened at FOLDLINE. The question was "Show ending MRR by month for the last
complete quarter." The AI picked a table called `monthly_revenue`, summed a column called
`amount`, and labelled the result `ending_mrr`. It answered −€19,960 / €9,775 / €42,565.
The true ending MRR was €334,675 / €344,450 / €387,015. The column held each month's
*change*, not the month-end level. Nothing was broken. The names just did not say what the
numbers were.

The same thing happened with churn. The AI searched for `'active'`; the table said `'A'`.
It found 0 of 0 and gave no rate. The true answer was 4 of 40 per segment, 10 %.

Good names fix this before anyone writes a definition. Seven rules cover almost everything:

| # | Rule | Say it like this | Not like this |
| --- | --- | --- | --- |
| R1 | Say the shape: a level, a change, a rate or a count | `ending_mrr_eur`, `net_new_mrr_eur` | `amount`, `mrr` |
| R2 | Say the unit | `_eur`, `_pct` (0–100), `_hours` | `value`, `mrr_cents` |
| R3 | Say the time | `month_start`, `started_on`, `data_loaded_at_utc` | `dt`, `date`, `ts` |
| R4 | Put the grain in the table name | `mrr_summary_monthly` | `monthly_revenue`, `customer_master` |
| R5 | Use words, not codes | `active` / `churned` / `new` | `A` / `C` / `N` |
| R6 | One entity, one key name, everywhere | `account_key` (served), `account_id` (core only) | `id`, `acct_id`, `customer_id` |
| R7 | Always write the schema | `analytics.mrr_summary_monthly` | `mrr_summary_monthly` |

If you only have five minutes, stop here and use the table above. The rest of this page gives
each rule a good example, a counter-example and the reason the counter-example fails. It ends
with a rename catalogue (40 pairs), a checklist and an executable lint.

Related files: `NAMING-REVIEW.md` (a 10-minute worksheet), `lint_names.sql` (the lint),
`../ANTI-PATTERNS.md` (group AP-N), `../CHEATSHEET.md` (block 3).

---

## Why names matter more for an AI than for a person

- **An AI picks tables by the words in your question.** "Ending MRR by month" overlaps with
  `monthly_revenue` on two words. At FOLDLINE, three of the seven export tables sounded like
  the answer. The AI chose the one whose *name* matched best.
- **An AI never walks over to ask.** It fills every gap with its best guess, and a guess that
  produces valid SQL looks exactly like knowledge.
- **A label is not evidence.** The recorded run named its output column `ending_mrr`. The
  deck's checklist listed "Column named ending_mrr" as a reason to trust the answer. The
  label was on a sum of changes.
- **The name is read on every route.** A definition file helps only if the AI loads it *and*
  uses it (the recorded runs cited the definition 0 of 3). The column name is in front of the
  AI every single time it writes SQL.

Good names do not replace definitions, grants or tests. They reduce the number of guesses
those controls have to catch.

---

## 1. The seven rules

Each rule: the rule, a good example, a counter-example, why the counter-example fails, and a
"For builders" note.

### R1. Say the shape: level, change, rate or count

The bathtub: a **level** is the water at one moment; a **change** is what flowed in or out
during a period. A **rate** is one count divided by another. A **count** says how many things.

| Shape | Name pattern | FOLDLINE | Adds across months? |
| --- | --- | --- | --- |
| Level (snapshot) | `ending_<measure>_<unit>`, `starting_<measure>_<unit>` | `ending_mrr_eur` = €387,015 on 30 Jun | Never |
| Change (movement) | `net_new_<measure>_<unit>`, `<direction>_<measure>_<unit>` | `net_new_mrr_eur` = +€42,565 in June; `expansion_mrr_eur`, `churned_mrr_eur` | Yes, within complete periods |
| Rate | `<what>_rate_pct` or `_ratio`, next to its two counts | `logo_churn_rate_pct` = 10.0 with `starting_accounts` 40, `churned_accounts` 4 | Never; recompute from the counts |
| Count | a plural noun | `active_accounts`, `starting_accounts` | Depends: a count of things *at a moment* is a level |

- **Good:** `analytics.mrr_summary_monthly(month_start, ending_mrr_eur, net_new_mrr_eur, ...)`.
  The level and the change sit side by side and cannot be confused.
- **Counter-example:** `public.monthly_revenue(dt, segment, amount)`, where `amount` is
  new + expansion − contraction − churn for the month.
- **Why it fails:** `amount` says nothing about shape. The AI read it as a level and answered
  "Ending MRR, April: −€19,960". A level cannot be negative here. The recorded run
  for net new MRR subtracted two changes as if they were levels: €42,565 − €60,160 = −€17,595. The true
  Q2 net new is €32,380 (= €387,015 − €354,635).

*For builders.* An output alias is a name too. `SUM(amount) AS ending_mrr` is the most
dangerous line in the FOLDLINE story, because it turns a guess into a label. In reviewed SQL,
the alias must match the formula: `SUM(net_new_mrr_eur) AS net_new_mrr_eur`.

### R2. Say the unit

| Suffix | Means | FOLDLINE example | Counter-example |
| --- | --- | --- | --- |
| `_eur` | Euros, numeric(14,2) | `ending_mrr_eur` | `amount`, `mrr_cents` (source) |
| `_pct` | Percent, 0–100 | `logo_churn_rate_pct` = 10.0 | `churn` = 0.1 |
| `_ratio` | Fraction, 0–1 | (not served at FOLDLINE) | `_pct` holding 0.1 |
| `_hours`, `_days` | Durations | `warn_after_hours` = 36 | `sla` = 36 |
| `_units`, `_kg`, `_kwh` | Physical quantities | `ending_units_on_hand` (bike shop) | `qty` |
| plural noun | A count of things | `churned_accounts` = 4 | `cnt`, `n`, `total` |

- **Good:** `churned_mrr_eur` stored as a positive number, with the sign convention in the
  COMMENT: "Change component: previous value of accounts that left, EUR, stored positive."
  The net column carries the sign: `net_new_mrr_eur` = new + expansion − contraction − churned.
- **Counter-example:** `billing_events.amount` holds signed changes; `subscription_export.amount`
  holds a June level; `monthly_revenue.amount` holds a monthly change. Three meanings, one name.
- **Why it fails:** the AI cannot tell a balance from a change from a price, and cannot tell
  euros from cents. The source feed really does deliver `mrr_cents`; core divides by 100 and
  names the result `ending_mrr_eur`. If core had kept the name `mrr`, a factor of 100 would be
  one careless join away.

*For builders.* If you hold several currencies, never mix them in one `_eur` column. Keep
`amount_local` plus `currency_code`, and serve a converted `_eur` column whose COMMENT names
the exchange-rate date. Store money as `numeric`, never `real` or `double precision`
(lint rule LINT-11).

### R3. Say the time

| Name | Type | Means | FOLDLINE |
| --- | --- | --- | --- |
| `month_start` | date | First day of the calendar month; the row's month key | `2026-04-01` for April |
| `period_start`, `period_end_exclusive` | date | Half-open period: `period_start <= day < period_end_exclusive` | Q2 = `2026-04-01` to `2026-07-01` |
| `*_on` | date | A calendar day on which something happened | `started_on`, `churned_on`, `posted_on` |
| `*_month` | date | A month that is not the row key | `complete_through_month` = `2026-06-01` |
| `*_at_utc` | timestamptz | An instant, in UTC | `data_loaded_at_utc` = 2026-07-01 06:00 UTC |

- **Good:** `analytics.logo_churn_by_segment_quarter(period_start, period_end_exclusive, ...)`.
  Q2 2026 is `2026-04-01` to `2026-07-01`. Nobody has to guess whether 30 June is inside.
- **Counter-example:** `dt` (in `monthly_revenue`, `billing_events`, `acct_history`,
  `usage_log`), `date` (in `subscription_export`), `status_dt`, `opened`, `closed`.
- **Why it fails:** `dt` in `monthly_revenue` is the first day of a month. `dt` in
  `billing_events` is a posting day. Same name, two meanings. A filter such as
  `dt <= '2026-06-30'` is right for one and silently wrong for the other. Timestamps without a
  zone fail the same way: an order at 01:30 Berlin time on 1 July is 23:30 UTC on 30 June. One
  reader puts it in Q3, another in Q2.

*For builders.* Why `period_start` and not `quarter_start`? `quarter_start` is fine in a table
that only ever holds quarters. FOLDLINE uses `period_start` and `period_end_exclusive` because
the deck's database checks use exactly those names, and because the pair works for any period
length. Pick one and keep it; never mix both in one lane. Evaluation clocks are also times:
the course clock is 2026-07-01 09:00 UTC, stated in the question, never `now()` inside a view.

### R4. Put the grain in the table or view name

"Rows per what?" should be answerable from the name alone.

Pattern for served views: `<subject>[_by_<dimension>...]_<time grain>`.

| View | Rows per what? | How to read the name |
| --- | --- | --- |
| `analytics.mrr_summary_monthly` | one per month | subject `mrr_summary`, grain `monthly` |
| `analytics.logo_churn_by_segment_quarter` | one per segment and quarter | `by_segment`, time grain `quarter` |
| `analytics.expansion_mrr_by_country_monthly` | one per country and month | `by_country`, `monthly` |
| `analytics.account_mrr_monthly` | one per account and month | the entity leads: `account` |
| `analytics.data_status_by_view` | one per approved view | `by_view` |

Inside core, entity tables are named as the plural of their grain: `core.accounts` (one row per
account), `core.account_months` (one per account per month, 2,592 rows). Staging views are
`core.stg_<source table>` and keep the source name on purpose.

- **Good:** `analytics.expansion_mrr_by_country_monthly`. The name promises 8 countries × 18
  months, with explicit zeros.
- **Counter-example:** `monthly_revenue` (one row per month *and segment*, 18 rows; the name
  puts "monthly" in front as an adjective and hides the segment), `customer_master`,
  `subscription_export`, `acct_history`, `usage_log`.
- **Why it fails:** "Three of them sound like the answer." The AI picked by name. The export
  names describe where the data came from (`_export`, `_master`, `_log`, `_history`), not what
  one row is. `subscription_export` held June 2026 only; nothing in the name said so.

*For builders.* Honest exceptions are allowed if written down. The published view is
`logo_churn_by_segment_quarter`, not `_quarterly`. It keeps the name because the deck, the tests
and the Skill use it (see §7). The lint accepts both suffixes.

### R5. Use words, not codes

- **Good:** `core.accounts.account_status IN ('active', 'churned', 'new')`, decoded once in
  `core.stg_crm_accounts`. A CHECK constraint makes an unknown code fail the load.
- **Counter-example:** `customer_master.status` and `acct_history.state` hold `A`, `C`, `N`.
  `billing_events.type` holds `N`, `E`, `D`, `C`. `tickets.status` holds `O`, `P`, `C`, `R`.
- **Why it fails:** the AI searched for `'active'` and found 0 of 0, so it gave no rate. Worse,
  `C` means *churned* in `customer_master` and *cancel* in `billing_events`, and nobody wrote
  down whether a ticket's `C` means closed or cancelled.

Booleans read as yes/no questions: `is_voluntary_leaver`, `has_open_ticket`. Never `flag`,
`term_flg` or a text column holding `Y`/`N`. If a thing has more than two states, use a status
column with words, not several booleans that can contradict each other.

*For builders.* One exception: published standard codes, with a `_code` suffix and the standard
named in the COMMENT. `country_code` holds ISO 3166-1 alpha-2 values (`AT`, `DE`, `SE`). The
suffix tells every reader "this is a code from a standard list", and the lint allows it.

### R6. One entity, one key name, everywhere

| Name | Where | Means |
| --- | --- | --- |
| `account_id` | core only | The system number. Joinable to every other system. Never served |
| `account_key` | analytics | Pseudonymous analytics key (`fl_0006`). Served with a row limit |
| `id` | nowhere | Banned |

- **Good:** `analytics.account_mrr_monthly.account_key`, with the COMMENT "Pseudonymous
  analytics key. Stable and joinable, so not anonymous."
- **Counter-example:** the same account is `customer_master.id`, `billing_events.acct_id` and
  `subscription_export.customer_id`. The ticket number in `tickets` is also called `id`.
- **Why it fails:** the AI must guess which columns join. `tickets.id = customer_master.id` is
  valid SQL and joins tickets to the wrong accounts. Three names for one thing also look like
  three different things, so a careful AI may refuse to join at all.

*For builders.* Pseudonymous is not anonymous. A stable key can be joined back to a company.
Serve it only in the view that needs it (`account_mrr_monthly`, for the top-10 question G05),
and cap the rows (policy: 1,000 or fewer).

### R7. Always write the schema, and name schemas by their job

| Schema | Job | Who reads it |
| --- | --- | --- |
| `source` | Feeds exactly as received; never renamed | The owner only |
| `core` | Renamed, typed, decoded, deduplicated; identifiers live here | The owner only |
| `analytics` | Five approved views, cut to the question | People and AI tools |

Crosswalk: raw / landing / bronze = `source`; staging / intermediate / silver = `core`
(staging is a step inside core here, not a fourth schema); marts / gold = `analytics`.

- **Good:** `SELECT ... FROM analytics.mrr_summary_monthly`. The AI login has
  `search_path = ''`, so an unqualified name fails loudly (SQLSTATE 42P01, test B-S01).
- **Counter-example:** the recorded ready-lane SQL wrote `FROM mrr_summary_monthly`. It worked
  only because that connection had `search_path analytics,public`.
- **Why it fails:** on another connection the same query finds nothing, or finds a different
  object with the same name in `public`. Schemas named after tools, people or states
  (`fivetran_raw`, `dbt_anna`, `tmp_export`, `final`) fail the same way: the name says who made
  it, not whether it is approved.

---

## 2. The name vocabulary

Use these tokens and nothing else. One token, one meaning, across the whole lane.

| Token | Position | Means | Example |
| --- | --- | --- | --- |
| `ending_` | prefix | Level at the end of the row's period | `ending_mrr_eur` |
| `starting_` | prefix | Level at the end of the previous period | `starting_mrr_eur`, `starting_accounts` |
| `net_new_` | prefix | Signed change over the period | `net_new_mrr_eur` |
| `new_`, `expansion_`, `contraction_`, `churned_` | prefix | Change components, stored positive | `contraction_mrr_eur` |
| `active_` | prefix | Count of things active at the end of the period | `active_accounts` |
| `_rate_pct`, `_rate_ratio` | suffix | A rate, 0–100 or 0–1 | `logo_churn_rate_pct` |
| `_eur` | suffix | Euros | `expansion_mrr_eur` |
| `_hours` | suffix | Duration in hours | `warn_after_hours` |
| `_key` | suffix | Pseudonymous surrogate key, servable | `account_key` |
| `_id` | suffix | System identifier, core only | `account_id` |
| `_code` | suffix | A value from a named standard | `country_code` |
| `_name` | suffix | A readable label of a category | `plan_name` |
| `_status` | suffix | A state in words | `account_status`, `quality_status` |
| `is_`, `has_` | prefix | Boolean | `is_voluntary_leaver` |
| `month_start` | whole name | Month key, first day | `2026-06-01` |
| `period_start`, `period_end_exclusive` | whole name | Half-open period | Q2 2026 |
| `_on` | suffix | Calendar day | `churned_on` |
| `_at_utc` | suffix | Instant in UTC | `data_loaded_at_utc` |
| `_monthly`, `_daily`, `_quarter`, `_by_<dim>` | relation suffix | Grain | `mrr_summary_monthly` |
| `stg_` | relation prefix, core only | Staging view of one source table | `core.stg_billing_events` |

Style: lower case, words separated by `_`, no quotes needed, English, no abbreviations except
`mrr`, `utc`, `pct`, `eur` and standard codes. Singular nouns for column subjects, plural for
counts and for core entity tables.

## 3. The banned list

Never serve these names. `lint_names.sql` rule LINT-01 finds them.

| Banned | Why | Use instead |
| --- | --- | --- |
| `amount`, `value`, `val`, `total` | No shape, no unit | `net_new_mrr_eur`, `ending_mrr_eur` |
| `balance`, `change` | Shape without a subject or unit | `ending_mrr_eur`, `net_new_mrr_eur` |
| `dt`, `date`, `ts`, `time` | Which day? Which clock? | `month_start`, `posted_on`, `ordered_at_utc` |
| `seg`, `acct`, `cust`, `amt`, `qty`, `prio`, `flg`, `txn` | Abbreviations force a guess | `customer_segment`, `account_`, `priority_rank` |
| `status`, `state`, `type` (bare) | Whose status? Which codes? | `account_status`, `movement_type` |
| `id` (bare) | Id of what? | `account_id` (core), `account_key` (served) |
| `mrr`, `revenue` (bare column) | Ambiguous: the clarify case C01 exists because of it | `ending_mrr_eur`, `net_new_mrr_eur` |
| `A`/`C`/`N` and other 1–2 letter codes | Unsearchable; one letter, several meanings | `active` / `churned` / `new` |
| `final`, `_v2`, `new`, `old`, `tmp`, `test`, `copy`, `bak` | State of the work, not content | One published name; versions live in the definition |
| `_export`, `_dump`, `_master`, `_log` as the whole description | Origin, not content or grain | Content + grain: `account_mrr_monthly` |
| An alias that does not match its formula | `SUM(amount) AS ending_mrr` | Alias = the served name of what was computed |

---

## 4. FOLDLINE: the export lane renamed

Every row below is a real export-lane column from the deck's database checks, with the name it
gets in the approved lane. Verified against the builder's `saas_bad` and `saas_ready` databases.

| Export column (`saas_bad.public`) | What it really holds | Approved-lane name | Layer |
| --- | --- | --- | --- |
| `monthly_revenue` (table) | One row per month and segment; each month's change; Jan–Jun 2026 only | not served; the numbers become `net_new_mrr_eur` in `analytics.mrr_summary_monthly` | analytics |
| `monthly_revenue.dt` | First day of the month | `month_start` | core, analytics |
| `monthly_revenue.amount` | new + expansion − contraction − churn, EUR | `net_new_mrr_eur` | core, analytics |
| `monthly_revenue.segment` | Segment name | `customer_segment` | core, analytics |
| `customer_master.id` | The account's system number | `account_id` (core); `account_key` `fl_0006` (analytics) | core / analytics |
| `customer_master.seg` | Enterprise, Mid-Market or SMB | `customer_segment` | core, analytics |
| `customer_master.country` | ISO 3166-1 alpha-2 | `country_code` | core, analytics |
| `customer_master.plan` | Plan label | `plan_name` | core, analytics |
| `customer_master.status` | `A`/`C`/`N` | `account_status` = `active`/`churned`/`new` | core |
| `customer_master.status_dt` | Day of the last status change | `churned_on` (when churned); `started_on` comes from the CRM's start date | core |
| `acct_history.balance` | Month-END MRR level (April sum: €334,675) | `ending_mrr_eur` | core |
| `acct_history.change` | The month's change, already inside `balance` | `net_new_mrr_eur` | core |
| `acct_history.state` | `A`/`C`/`N` again | `account_status` | core |
| `billing_events.acct_id` | Same account number, third name | `account_id` | core |
| `billing_events.event_id` | Movement number; retry copies repeat it | `movement_id` (primary key, so a copy cannot load) | core |
| `billing_events.type` | `N`/`E`/`D`/`C` | `movement_type` = `new`/`expansion`/`contraction`/`churn` | core |
| `billing_events.amount` | Signed EUR change | `mrr_change_eur` | core |
| `billing_events.dt` | Posting day | `posted_on` | core |
| `billing_events.status` | `posted`/`pending` | `billing_status` | core |
| `subscription_export` (table) | June 2026 levels only | not served; months come from `analytics.account_mrr_monthly` with `complete_through_month` | analytics |
| `subscription_export.customer_id`, `.date`, `.amount` | Account, month, June level | `account_key`, `month_start`, `ending_mrr_eur` | analytics |
| `usage_log.events` | Product usage count per account per month | `product_events` (if ever served, in `product_usage_monthly`) | not served |
| `tickets.status` | `O`/`P`/`C`/`R`, never documented | `ticket_status` in words, after the owner writes the decode down | not served |

Two numbers show why the rename matters. `acct_history.balance` already contains the month's
change, so `SUM(balance + change)` counts it twice: the deck's export-lane database check
returned €314,715 for April instead of €334,675. And `customer_master` counted the 8 accounts
that joined in Q2 in each segment's base: 4 of 48 = 8.33 % instead of 4 of 40 = 10.0 %.
Words and grain in the names make both mistakes much harder to write.

---

## 5. The rename catalogue: 40 bad → good pairs

Each pair says why the bad name misleads an AI. "Rule" points to §1.

### FOLDLINE (1–24)

| # | Bad | Good | Why the bad name misleads an AI | Rule |
| --- | --- | --- | --- | --- |
| 1 | table `monthly_revenue` | `analytics.mrr_summary_monthly` | The name matches "by month" and sounds like a total; the AI picked it and read changes as levels (−€19,960) | R4 |
| 2 | `monthly_revenue.amount` | `net_new_mrr_eur` | "Amount" invites summing and reading as a level; nothing says it is a change | R1 |
| 3 | alias `SUM(amount) AS ending_mrr` | `SUM(net_new_mrr_eur) AS net_new_mrr_eur` | The label becomes a trust signal on the wrong number | R1 |
| 4 | `monthly_revenue.dt` | `month_start` | The AI cannot tell a month key from an event day; range filters go wrong at month ends | R3 |
| 5 | `customer_master.seg` | `customer_segment` | Could be a segment, a segmentation model or a sales territory | R2, banned |
| 6 | `customer_master.status` = `A`/`C`/`N` | `account_status` = `active`/`churned`/`new` | A search for `'active'` returns 0 rows; the AI reports "0 of 0" | R5 |
| 7 | `customer_master.id` | `account_id` (core), `account_key` (served) | "Id" joins to any other "id", such as `tickets.id` | R6 |
| 8 | `customer_master.country` | `country_code` | Without `_code`, `AT` looks like an unexplained abbreviation | R5 |
| 9 | `customer_master.status_dt` | `churned_on` | Which status? Which day? The AI may use it as a start date | R3 |
| 10 | table `customer_master` | `core.accounts` | "Master" says where it came from; nothing says it includes accounts that joined this quarter | R4 |
| 11 | table `subscription_export` | not served (months come from `analytics.account_mrr_monthly`) | Looks like a full table; holds June 2026 only, so any trend is one month | R4 |
| 12 | `subscription_export.customer_id` | `account_key` | A third name for one account; joins are guessed | R6 |
| 13 | `subscription_export.date` | `month_start` | A column named after its type says nothing | R3 |
| 14 | `subscription_export.amount` | `ending_mrr_eur` | Same name as two other `amount` columns with different shapes | R1 |
| 15 | `billing_events.type` = `N`/`E`/`D`/`C` | `movement_type` = `new`/`expansion`/`contraction`/`churn` | `C` means cancel here and churned elsewhere | R5 |
| 16 | `billing_events.amount` | `mrr_change_eur` | A signed change that looks like an invoice total | R1, R2 |
| 17 | `billing_events.status` = `posted`/`pending` | `billing_status` | Bare `status` collides with the account status | banned |
| 18 | table `acct_history` | `core.account_months` | "History" of what, at which grain? It has no rows before an account starts and keeps zero-balance rows after it churns (1,388 rows); `core.account_months` is dense (2,592) | R4 |
| 19 | `acct_history.balance` | `ending_mrr_eur` | The deck's export-lane check added `balance + change` and double counted April (€314,715) | R1 |
| 20 | `acct_history.change` | `net_new_mrr_eur` | Reads like something to add to the balance | R1 |
| 21 | source `billing_account_mrr.mrr_cents`, `period` text | `ending_mrr_eur`, `month_start` date | Cents vs euros is a factor of 100; `'2026-04'` as text sorts and filters like a string | R2, R3 |
| 22 | source `load_log.loaded_at` | `data_loaded_at_utc` | Which clock? The 60-hour warning depends on it | R3 |
| 23 | a view column `mrr` | `ending_mrr_eur` or `net_new_mrr_eur` | Bare "MRR" is exactly the ambiguity the clarify case C01 exists for | R1 |
| 24 | `churn` = 0.1 | `logo_churn_rate_pct` = 10.0, with `starting_accounts`, `churned_accounts` | 0.1 read as percent is 0.1 % churn; without counts nobody can check 4 of 40 | R2 |

### Other domains (25–40)

| # | Domain | Bad | Good | Why the bad name misleads an AI | Rule |
| --- | --- | --- | --- | --- | --- |
| 25 | Bike shop | `qty` | `ending_units_on_hand` | A level that looks like a flow; the AI sums three months: "Q2 stock = 315" (110 + 95 + 110) | R1 |
| 26 | Bike shop | `loc` | `store_name` | Location of what: store, warehouse, shelf? | banned |
| 27 | Bike shop | `ts` on a monthly stock count | `month_start` | A timestamp suggests an event; this is a month-end snapshot | R3 |
| 28 | Bike shop | `sold` | `units_sold` | Units or euros? Sold 190 units is not €190 | R2 |
| 29 | Headcount | `hc` | `ending_headcount` | An abbreviation; also hides that it is a month-end level | R1 |
| 30 | Headcount | `term_flg` = `Y`/`N` | `is_voluntary_leaver` boolean | Terminated? Term date? Voluntary or not? A `Y`/`N` text column also defeats `WHERE is_...` | R5 |
| 31 | Headcount | `attrition` = 9.5 | `attrition_rate_pct` with `leavers` 19 and `starting_headcount` 200 | Without the base, the AI cannot tell 9.5 % (start base) from 9.34 % (average base) | R1, R2 |
| 32 | Web shop | `cr` | `conversion_rate_pct` with `orders` and `sessions` | "CR" could be click rate or credit; and the AI averages 2 % and 8 % to 5.00 % instead of pooling 480 / 21,000 = 2.29 % | R2 |
| 33 | Web shop | `conv` | `orders` | Conversions of what? A count needs a plural noun | R2 |
| 34 | Web shop | `ts` | `ordered_at_utc` | 01:30 Berlin on 1 July is 23:30 UTC on 30 June; the month depends on the clock | R3 |
| 35 | Web shop | `visitors` in a daily table | `unique_visitors` with COMMENT "distinct per day; never add across days" | Summing daily uniques gives 1,700; the true count for the period is 1,450 | R1 |
| 36 | Support desk | `status` = `O`/`P`/`C`/`R` | `ticket_status` in words, from the owner's written decode | Is `C` closed or cancelled? The AI picks one silently | R5 |
| 37 | Support desk | `avg_res` | `median_resolution_hours` | Average or median? Minutes or hours? Medians do not average: the 17 h "average of medians" is not the combined median | R2 |
| 38 | Support desk | `prio` = 1 | `priority_rank` (1 = highest) or `priority_level` = `high` | Is 1 high or low? | R2, R5 |
| 39 | Energy | `reading` | `meter_reading_kwh` (a level) and `consumption_kwh` (a change) | A meter reading is a running level, like the bathtub; summing readings means nothing | R1, R2 |
| 40 | Any | `created` (timestamp without time zone) | `created_at_utc` (timestamptz) | The AI cannot know the zone; day and month boundaries drift | R3 |

---

## 6. Comments are names that can hold a sentence

`COMMENT ON` stores a description in the database catalog. Catalog browsers, many SQL clients and
some AI connectors can show it. Whether your connector sends comments to the AI is a fact to
check, not to assume (verify against its current documentation).

**The rule:** one sentence with shape, unit and grain, plus one "never".

- **Good** (from `40_analytics.sql`):
  `ending_mrr_eur`: "Level: recurring value active at the final instant of the month, EUR.
  Never sum across months; for a quarter return each month or the last month."
- **Good:** `logo_churn_rate_pct`: "Rate: 100 * churned / starting, 0-100, one decimal. NULL when
  starting is 0. Never average; recompute from the counts."
- **Counter-example:** "MRR value." or "Revenue amount from billing." Both are true of every
  column in the lane.
- **Why it fails:** a comment that repeats the name adds nothing the AI can act on. The "never"
  sentence is the part that prevents −€19,960 and 1,066,140 (three levels added).

Every served view comment also carries the definition version (`definition 1.0.0`); test Q06
checks it. A comment is a compiled copy of the definition, not proof that anyone read it: the
answer's trace must still cite the metric name and version.

---

## 7. Renaming something already published

Names in `analytics` are a contract. Tests, the Skill, CLAUDE.md, Project instructions,
dashboards and saved queries all use them. A silent rename can make a correct query return
nothing, or something else.

1. **Create the new name as the real view.** Run as the owner (`SET ROLE foldline_owner`), never
   as yourself: a view owned by the builder, or by a superuser, is AP-A08. Copy the real `SELECT`
   body from `40_analytics.sql`. Grant it by name.
2. **Turn the old name into a thin alias of the new one for one version**, commented as
   deprecated. The alias lists its columns explicitly, so it keeps exactly the old shape:

   ```sql
   BEGIN;
   SET LOCAL ROLE foldline_owner;                     -- the owner creates and grants; not you
   -- 1. The new name is the real view (same body as 40_analytics.sql).
   CREATE VIEW analytics.mrr_by_account_monthly AS    -- example rename, not a FOLDLINE plan
   SELECT
     m.month_start,
     a.account_key,
     a.customer_segment,
     a.country_code,
     a.plan_name,
     m.ending_mrr_eur::numeric(14, 2) AS ending_mrr_eur,
     s.complete_through_month,
     s.data_loaded_at_utc,
     s.quality_status
   FROM core.account_months AS m
   JOIN core.accounts AS a ON a.account_id = m.account_id
   CROSS JOIN core.load_status AS s
   WHERE m.month_start <= s.complete_through_month;
   COMMENT ON VIEW analytics.mrr_by_account_monthly IS
     'One row per account and complete month. Replaces analytics.account_mrr_monthly. definition 1.1.0.';
   GRANT SELECT ON analytics.mrr_by_account_monthly TO foldline_ready_reader;

   -- 2. The old name now reads the new one. Same columns, same order, same types.
   CREATE OR REPLACE VIEW analytics.account_mrr_monthly AS
   SELECT month_start, account_key, customer_segment, country_code, plan_name, ending_mrr_eur,
          complete_through_month, data_loaded_at_utc, quality_status
   FROM analytics.mrr_by_account_monthly;
   COMMENT ON VIEW analytics.account_mrr_monthly IS
     'DEPRECATED in 1.1.0: use analytics.mrr_by_account_monthly. Removed in 2.0.0. definition 1.1.0.';
   COMMIT;
   ```

   The direction matters. If the new name were an alias of the old view, the old name would stay
   the real view, and step 5 would fail: PostgreSQL refuses to drop a view that another view
   depends on. `DROP ... CASCADE` would then silently drop the new name too.

3. **Update every reader in the same change**: `semantic/model.yml`, `metric.yml` (`relation`),
   `policy.yml` (allowlist), `60_access.sql` (grants), the Skill references, CLAUDE.md and the
   Project files. For the deprecation window, also update the checks that count views, or they
   fail by design: the self-check in `60_access.sql` (`v_n <> 5` becomes 6), B-P01 in
   `70_checks.sql` (its expected list of five grants), Q06 (five commented views) and Q07 (the
   old name now reads `analytics.mrr_by_account_monthly`). Re-run the affected cases.
4. **Log it** in the definition's changelog with the date and the owner's approval.
5. **Remove the alias** in the next major version. Removal breaks stored queries, so treat it as
   a breaking change: re-run every case (see `../semantic/METRICS.md`, versioning).

Honest exception: `analytics.logo_churn_by_segment_quarter` keeps `_quarter` instead of
`_quarterly`. The deck, the database checks and the Skill use that name, and a rename would buy
consistency at the cost of a broken contract. Written down here, it is a decision, not an
accident.

Counter-example: renaming `account_mrr_monthly` in place and "telling people on chat". The
next Claude run still follows the Skill, which names the old view. It fails with 42P01, or a
helpful person recreates the old name as a copy, and now two views drift apart.

---

## 8. Running the lint

`lint_names.sql` reads the catalog and a little data and prints every name that breaks a rule.

```sh
# Approved lane, as the AI's own login (search_path is empty; the lint qualifies everything)
psql -X -d saas_ready -U foldline_ready_reader -f naming/lint_names.sql
# Export lane
psql -X -d saas_bad -v lint_schema=public -f naming/lint_names.sql
```

Results on the builder databases (PostgreSQL 16):

| Schema | Rows | By rule |
| --- | --- | --- |
| `saas_ready.analytics` | **0** | none |
| `saas_bad.public` | 99 | LINT-01 27 · LINT-02 6 · LINT-04 8 · LINT-06 5 · LINT-07 5 · LINT-08 8 · LINT-09 40 |
| `saas_ready.core` (optional) | 64 | LINT-08 13 · LINT-09 51 |

How to read them:

- **analytics = 0.** The five served views pass every rule. That is necessary, not sufficient:
  a person still fills in `NAMING-REVIEW.md`.
- **public = 99.** Every trap the deck showed is on the list: `amount`, `dt`, `seg`, the A/C/N
  codes, `subscription_export`, `monthly_revenue`, no comments at all. Notice LINT-06 on
  `customer_master.country`: the values are fine ISO codes, but the name does not say so.
  Renaming it `country_code` fixes the hit.
- **core = 64.** The LINT-08 rows (`account_id`, `account_name`, `contact_email`) are expected:
  they are the reason core is never served. The LINT-09 rows show core columns that still lack
  a comment. Core is not served, so this is a to-do, not a failure.

The lint is a set of heuristics. It cannot see that `amount` is a change rather than a level.
Only a person who knows the data can. Keep accepted exceptions, with reasons, in the header of
`lint_names.sql`.

---

## 9. What works and what does not

| What works | What does not | Why |
| --- | --- | --- |
| `ending_mrr_eur` beside `net_new_mrr_eur` | `amount` | The AI read the change as a level: −€19,960 |
| `account_status` = `active` | `status` = `A` | A search for `'active'` found 0 of 0 |
| Grain in the view name: `_monthly`, `_by_segment_quarter` | Origin in the name: `_export`, `_master`, `_log` | "Three of them sound like the answer" |
| `month_start`; `period_start` + `period_end_exclusive` | `dt`, `date` | Two `dt` columns meant two different days |
| `data_loaded_at_utc` (timestamptz) | `loaded_at` (no zone in the name) | Freshness warnings at 36 h depend on the clock |
| `logo_churn_rate_pct` with its two counts | `churn` = 0.1 | 0.1 read as percent; nothing to check 4 of 40 against |
| `account_key` served, `account_id` in core | `id`, `acct_id`, `customer_id` for one account | Guessed joins; system ids leak |
| `analytics.mrr_summary_monthly` | `mrr_summary_monthly` via `search_path` | Works on one connection only (B-S01: 42P01) |
| A one-sentence COMMENT with a "never" | No comment, or "MRR value" | The "never" sentence is what stops the mistake |
| Rename with an alias view for one version | Rename in place | Stored queries and the Skill break silently |

---

## 10. Checklist

Copy this into your review. Every served name must pass.

- [ ] Every number says its shape: `ending_`, `starting_`, `net_new_`, a direction, `_rate_`, or a plural count.
- [ ] Every number says its unit: `_eur`, `_pct` (0–100), `_ratio` (0–1), `_hours`, `_units`.
- [ ] Every rate has its numerator and denominator in the same view.
- [ ] Every date says which day: `month_start`, `period_start` / `period_end_exclusive`, `*_on`, `*_month`.
- [ ] Every instant is `timestamptz` and ends in `_at_utc`.
- [ ] Every view name ends in its grain: `_monthly`, `_quarter`, `_by_<dimension>`.
- [ ] No status codes: values are words; booleans start with `is_` or `has_`; standard codes end in `_code`.
- [ ] One key name per entity; `_id` stays in core; `_key` is served and called pseudonymous.
- [ ] No banned names: `amount`, `value`, `dt`, `date`, `seg`, bare `status`/`type`/`id`, `final`, `_v2`.
- [ ] Every output alias matches its formula.
- [ ] Every relation and column has a one-sentence COMMENT with a "never", and the version.
- [ ] Every query names the schema: `analytics.<view>`.
- [ ] `lint_names.sql` returns 0 rows on `analytics`; exceptions are written down with a reason.
- [ ] A second person filled in `NAMING-REVIEW.md` and scored "names that force a guess: 0 of m".
