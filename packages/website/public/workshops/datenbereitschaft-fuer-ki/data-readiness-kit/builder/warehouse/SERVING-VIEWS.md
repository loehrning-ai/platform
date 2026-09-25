# Serving views: design what the AI reads

## In plain words

A serving view is a finished plate, cut to one question. Before you write one, answer a single question: **"Rows per what?"**

- One row per month answers "ending MRR by month".
- One row per quarter and segment answers "logo churn by segment".
- One row per account and month answers "top accounts in June".

If the view's rows match the question's rows, the AI only has to filter. If they do not, the AI must add or average numbers itself, and that is where it goes wrong. It added levels, subtracted changes, and put new accounts in a churn base.

## The grain ladder

FOLDLINE's data, from finest to coarsest grain:

```text
2,592 account-months      core.account_months               (144 accounts x 18 months)
   54 segment-months      (not served: no question needs it yet)
   18 months              analytics.mrr_summary_monthly
    3 rows for Q2         what G01 returns: 334,675 / 344,450 / 387,015
```

- G05 ("top ten accounts in June") needs the account grain, so `analytics.account_mrr_monthly` exists.
- G01 ("ending MRR by month") needs the month grain. Summing 2,592 rows correctly is possible, but it is a chance to be wrong, so the month view does it once.
- Serve the grain the question needs, not the lowest grain you have. The published `CLAUDE.example.md` says "lowest-grain"; the builder kit says "the approved view whose grain matches the question".

## Twelve rules

Each rule has a good example, a counter-example, and the reason the counter-example fails.

| # | Rule | Good (FOLDLINE) | Counter-example | Why it fails |
| --- | --- | --- | --- | --- |
| 1 | Put the grain in the name and in the key. | `mrr_summary_monthly`, unique on `month_start` (test Q01) | `monthly_revenue` with one row per month **and segment** | The name suggests one row per month. An AI grouped by `dt` and summed, which only worked by luck. |
| 2 | Serve level and change side by side, and make them reconcile. | `ending_mrr_eur` beside `net_new_mrr_eur`; previous level + change = level (Q02) | `amount` alone | With only a change in the view, the change gets read as a level: −19,960. |
| 3 | Ship a rate with its numerator and denominator. | `churned_accounts` 4, `starting_accounts` 40, `logo_churn_rate_pct` 10.0 | a `churn_rate` column alone | Nobody can check the base, and a quarter or a total cannot be recomputed. Averaging rates is wrong unless the bases are equal. |
| 4 | Put the data state on every row. | `complete_through_month`, `data_loaded_at_utc`, `quality_status` | the load time in a separate wiki page | The AI cannot say how old the answer is, and cannot refuse a failing load. |
| 5 | Serve complete periods only. | Rows stop at `2026-06-01`; the quarter view only lists quarters whose last month is complete (Q03) | `subscription_export` holding June only | It looks like a full table. April and May silently return nothing, or June's numbers. |
| 6 | Use half-open periods. | `period_start` = 2026-04-01, `period_end_exclusive` = 2026-07-01 | `quarter_start` plus `quarter_end` = 2026-06-30 | Is the 30th included? Is it 23:59:59? Half-open ranges never overlap and never leave gaps. |
| 7 | Store money as `numeric`, never `float`. | `numeric(14,2)` | `double precision` | Floating point cannot hold 0.10 exactly. Sums drift by cents, and tests with a tolerance of 0 fail. |
| 8 | Build a dense spine with explicit zeros. | `expansion_mrr_by_country_monthly` has all 18 x 8 = 144 rows; GB months without expansion show 0 | only rows where something happened | A missing row reads as "unknown", not 0, and "by country" results lose countries. |
| 9 | No direct identifiers; a pseudonymous key with a row limit. | `account_key` `fl_0006`, and the policy requires LIMIT (1,000 rows or fewer) | `customer_master.id`, names, emails | The system id joins back to every other system. Pseudonymous is not anonymous either: `fl_0006` is stable and joinable, so treat it as personal-adjacent. |
| 10 | Serve readable values, not codes. | `customer_segment` = `Mid-Market`; `account_status` decoded in core | `status` = `A`/`C`/`N` | It searched `'active'`; the table said `'A'`. Result: 0 of 0, no rate. |
| 11 | No `now()` inside a view. | `data_status_by_view` publishes the load time; the caller computes age against a stated clock | `age_hours = now() - loaded_at` inside the view | The same question gets a different answer every hour, and the frozen tests F00 and F01 become impossible. |
| 12 | One view per question family. | Five views, each with one job | one mega-view with every column at account-month grain | The AI must aggregate levels itself. Adding three month-end levels gives 1,066,140, which describes nothing. |

## The five views, annotated

The full DDL is in `sql/40_analytics.sql`. The key lines are below.

### `analytics.mrr_summary_monthly`: one row per complete month

```sql
CREATE VIEW analytics.mrr_summary_monthly AS
SELECT
  m.month_start,                                                             -- the grain
  sum(m.ending_mrr_eur)::numeric(14, 2)                           AS ending_mrr_eur,       -- LEVEL
  coalesce(sum(m.ending_mrr_eur)   FILTER (WHERE m.movement_type = 'new'), 0)         AS new_mrr_eur,
  coalesce(sum(m.net_new_mrr_eur)  FILTER (WHERE m.movement_type = 'expansion'), 0)   AS expansion_mrr_eur,
  coalesce(-sum(m.net_new_mrr_eur) FILTER (WHERE m.movement_type = 'contraction'), 0) AS contraction_mrr_eur,
  coalesce(sum(m.starting_mrr_eur) FILTER (WHERE m.movement_type = 'churn'), 0)       AS churned_mrr_eur,
  sum(m.net_new_mrr_eur)::numeric(14, 2)                          AS net_new_mrr_eur,      -- CHANGE
  (count(*) FILTER (WHERE m.ending_mrr_eur > 0))::integer         AS active_accounts,
  s.complete_through_month, s.data_loaded_at_utc, s.quality_status                          -- DATA STATE
FROM core.account_months AS m
CROSS JOIN core.load_status AS s
WHERE m.month_start <= s.complete_through_month                                             -- COMPLETE ONLY
GROUP BY m.month_start, s.complete_through_month, s.data_loaded_at_utc, s.quality_status;
```

Q2 2026 from this view:

| month_start | ending_mrr_eur | new | expansion | contraction | churned | net_new_mrr_eur | active_accounts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-03-01 | 354,635 | 48,060 | 12,880 | 780 | 0 | 60,160 | 120 |
| 2026-04-01 | 334,675 | 9,255 | 2,750 | 21,845 | 10,120 | −19,960 | 123 |
| 2026-05-01 | 344,450 | 21,900 | 3,850 | 2,645 | 13,330 | 9,775 | 123 |
| 2026-06-01 | 387,015 | 44,780 | 6,295 | 830 | 7,680 | 42,565 | 132 |

The ending and net new columns are fixed facts from the deck. The four component columns are generated by the seed and may change if the seed changes; their identity (new + expansion − contraction − churned = net new) never does.

### `analytics.logo_churn_by_segment_quarter`: one row per complete quarter and segment

```sql
-- base = accounts active at the END of the month BEFORE the quarter; joiners are excluded
JOIN core.account_months AS st ON st.month_start = b.base_month AND st.ending_mrr_eur > 0
JOIN core.account_months AS e  ON e.account_id = st.account_id AND e.month_start = b.last_month
...
count(*)::integer                            AS starting_accounts,     -- denominator: 40
(count(*) FILTER (WHERE e.ending_mrr_eur = 0))::integer AS churned_accounts, -- numerator: 4
round(100.0 * count(*) FILTER (WHERE e.ending_mrr_eur = 0)
      / nullif(count(*), 0), 1)::numeric(5, 1) AS logo_churn_rate_pct -- 10.0; 0/0 gives NULL, never 0 %
```

Counter-example: the deck's fixed export-lane database check (replay data, not on a slide) counted `status = 'C'` over every row of `customer_master`: 4 of 48 = 8.33 %. The recorded AI run found 0 of 0. The 48 includes the 8 accounts per segment that joined during Q2 and could not have churned from the starting base.

### `analytics.expansion_mrr_by_country_monthly`: dense month by country grid

A `CROSS JOIN` of all months and all countries, then a `LEFT JOIN` to the expansion sums, with `coalesce(..., 0)`. Q2 totals (G04): CH 1,990 · DE 1,780 · FR 1,780 · SE 1,780 · NL 1,655 · PL 1,640 · AT 1,565 · GB 705.

Counter-example: summing `billing_events` where `type = 'E'`. The retry copies add 390 in AT, 115 in DE, 230 in NL and 185 in PL. That is where the deck's export-lane numbers come from: AT 1,955, DE 1,895, NL 1,885, PL 1,825.

### `analytics.account_mrr_monthly`: one row per account and month

It serves `account_key`, never `account_id`, `account_name` or `contact_email`. The view is dense: 144 accounts x 18 months = 2,592 rows, with 0 before an account starts and after it leaves. G05 reads it with `LIMIT 10`.

### `analytics.data_status_by_view`: read this first

One row per data view: `view_name`, `data_loaded_at_utc`, `complete_through_month`, `quality_status`, `warn_after_hours` (36), `hard_expiry_hours` (NULL), `owner_team`, `definition_version`. The thresholds come from a table, `core.serving_contracts`, so a change is a data change with an owner, not a code edit.

## View, materialized view, or table?

| Option | Freshness | Cost per query | Consistency | Tests before publish | Burden | Use when |
| --- | --- | --- | --- | --- | --- | --- |
| **View** (this kit) | Always as fresh as core | Recomputed each time | Always matches core | Test core; views follow | Lowest | Core is small or indexed, and queries are fast enough. |
| **Materialized view** | As of the last `REFRESH` | Low | Can lag core | Refresh, test, then grant | Refresh schedule and monitoring | A view is too slow, and a known lag is acceptable. |
| **Table (write, audit, publish)** | As of the last publish | Lowest | Exactly what was tested | Build into a new table, run the checks, then swap names in one transaction | Highest | Many readers, strict "only tested data is visible" rules. |

Recommendation: keep core as tables and analytics as thin views. Switch a view to a materialized view or table only against a written latency budget, such as "p95 under 2 seconds". When you do, the refresh or publish time becomes `data_loaded_at_utc`. Never let the view's data state claim a fresher load than the data it serves.

## View security (verified on PostgreSQL 16)

| Behaviour | What happens | Consequence |
| --- | --- | --- |
| A view runs with its **owner's** rights (the default) | `foldline_ready_reader` reads `analytics.mrr_summary_monthly`, which reads `core.account_months`, with no grant on core | The reader needs SELECT on five views and nothing else. |
| The owner must not be a superuser | Owned by `foldline_owner` (NOLOGIN, no attributes) | A superuser-owned view bypasses row-level security on its base tables. |
| `WITH (security_invoker = true)` (PostgreSQL 15+) | The same view, read by the reader, fails with 42501 on the core table | Use it when row-level security on core must apply to the reader; then grant the needed core columns explicitly. |
| `WITH (security_barrier = true)` | Stops a caller's functions from seeing rows the view's WHERE clause filters out | Needed when a view filters rows for security, such as "only complete months" as a privacy rule. |
| Catalog visibility | The reader can list object names in core from `pg_class`, but reading data returns 42501 | Names are not secret. Never put sensitive words in object names. |
| Writes through views | Every FOLDLINE view is an aggregate or a join, so an UPDATE fails with 55000 ("cannot update view"), before any privilege check | A single-table view would be updatable. Then only the missing UPDATE grant stops a write. Never grant INSERT, UPDATE or DELETE on serving views. |

## What works and what does not

| Works | Does not work |
| --- | --- |
| Asking "rows per what?" before writing SQL | Starting from "which table has MRR in its name?" |
| `ending_mrr_eur` and `net_new_mrr_eur` in one view, with a reconciliation test | A level in one table and its change in another, with no stated link |
| `starting_accounts`, `churned_accounts` and `logo_churn_rate_pct` together | A rate alone, so nobody can check the base (8.33 % vs 10.0 %) |
| Half-open periods with `_exclusive` in the name | An inclusive end date that is ambiguous about the last day |
| Explicit zeros in a dense grid | Missing rows that mean "zero" to one reader and "unknown" to another |
| The data state in every row, and the caller's clock | `now()` in a view |
| Five small views, one job each | One mega-view "so the AI can answer anything" |
