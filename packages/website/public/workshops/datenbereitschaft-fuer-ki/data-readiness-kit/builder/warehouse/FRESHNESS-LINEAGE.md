# Freshness and lineage

## In plain words

The right meaning is not the same as fresh data. A perfectly defined "ending MRR" computed from last week's load is still last week's number. So every answer needs two more facts: **how old is the data**, and **where did this number come from**.

- **Freshness** says how old the data is, measured against a stated clock, and what to do about it: answer, answer with a warning, or stop.
- **Lineage** is the path from a number back to the feeds it came from. It lets anyone check the answer without trusting the AI.

## FOLDLINE's clock

| Fact | Value |
| --- | --- |
| Data loaded | 2026-07-01 06:00 UTC (6 hours after the quarter closed) |
| Evaluation clock (the course's "now") | 2026-07-01 09:00 UTC |
| Age | 3 hours: **fresh, answer** (F00) |
| Warn after | 36 hours: answer, and state the load time and age |
| Hard expiry | none written |
| What-if clock | 2026-07-03 18:00 UTC gives 60 hours: **stale_disclosed, answer with a warning** (F01) |

At 60 hours the answer is still given. The data did not change, and nobody wrote a rule that blocks at 60 hours. The right move is to disclose the age and **escalate to the owner** (`revenue_analytics`), not to invent an expiry on the spot. The 60-hour scene in the deck was a what-if, not a rerun.

## The decision rule

In this order:

1. **Block** if `quality_status` is not `passing`. The load failed its gate.
2. **Block** if the question asks for a period after `complete_through_month`. The period is incomplete.
3. **Block** if the owner wrote a `hard_expiry_hours` and the age exceeds it. FOLDLINE wrote none: `NULL`.
4. **Warn** if the age exceeds `warn_after_hours` (36). Answer, and state the load time and the age.
5. Otherwise, **answer**, and still state the load time in the trace.

`sql/70_checks.sql` implements rules 1, 3, 4 and 5 against `analytics.data_status_by_view`. Rule 2 is enforced by the views themselves, which serve complete months only (Q03).

## Choosing thresholds

| Threshold | How to choose it | FOLDLINE | Counter-example | Why it fails |
| --- | --- | --- | --- | --- |
| `warn_after_hours` | Decision cadence plus normal load delay. People read MRR daily; loads land about 6 hours after close; so warn well before a second day passes. | 36 | No threshold: answer silently whatever the age | Right meaning, stale data, no disclosure. The reader cannot judge the answer. |
| Block rules | Only rules the owner wrote down: failing quality, an incomplete period, a hard expiry | Quality and incomplete period only | "It feels old, so refuse" at 60 hours | An invented rule is an undocumented policy. The next run behaves differently, and the test cannot be written. |
| `hard_expiry_hours` | Only when stale data would cause harm, such as a pricing decision on a live number. The owner writes it with a reason. | `NULL` | A hard expiry of 24 hours on month-end data | Month-end MRR does not change after the close. A 24-hour expiry blocks correct answers every weekend. |

## `analytics.data_status_by_view`

One row per approved data view. The AI reads it **before** it answers.

| Column | FOLDLINE value | Meaning |
| --- | --- | --- |
| `view_name` | `analytics.mrr_summary_monthly` (and three more) | Which view this row describes. Schema-qualified. |
| `data_loaded_at_utc` | 2026-07-01 06:00:00+00 | When the load finished. |
| `complete_through_month` | 2026-06-01 | Last complete month. |
| `quality_status` | passing | Result of the quality gate in `30_core.sql`. |
| `warn_after_hours` | 36 | Disclose above this age. |
| `hard_expiry_hours` | NULL | No block rule written. |
| `owner_team` | revenue_analytics | Whom to escalate to. |
| `definition_version` | 1.0.0 | Cite it in every answer. |

There is **no `age_hours` column**, on purpose. Age depends on the clock. A view that computes `now() - data_loaded_at_utc` gives a different answer every hour, and the frozen tests F00 and F01 become impossible. The caller computes age against a stated clock:

```sql
SELECT view_name,
       extract(epoch FROM (TIMESTAMPTZ '2026-07-01 09:00:00+00' - data_loaded_at_utc)) / 3600 AS age_hours
FROM analytics.data_status_by_view
WHERE view_name = 'analytics.mrr_summary_monthly';
-- age_hours = 3
```

The thresholds live in a table, `core.serving_contracts`, not in the view body. Changing 36 to 48 is a data change with an owner and a version bump, not a code edit.

## Worked lineage: where does April's 334,675 come from?

```text
analytics.mrr_summary_monthly        month_start 2026-04-01, ending_mrr_eur 334,675
  <- core.account_months             144 rows for April 2026 (123 with MRR above 0), sum 334,675
       <- core.stg_billing_account_mrr   period '2026-04' -> month_start; cents -> EUR
            <- source.billing_account_mrr   144 rows, period '2026-04', sum(mrr_cents) / 100 = 334,675
  <- core.load_status                complete_through_month 2026-06-01, quality passing
       <- source.load_log            loaded_at 2026-07-01 06:00 UTC, complete_through '2026-06'
```

Each step can be re-run by the builder (the reader cannot, by design):

```sql
SELECT sum(mrr_cents) / 100 FROM source.billing_account_mrr WHERE period = '2026-04';         -- 334675
SELECT count(*), count(*) FILTER (WHERE ending_mrr_eur > 0), sum(ending_mrr_eur)
FROM core.account_months WHERE month_start = DATE '2026-04-01';                               -- 144 | 123 | 334675
```

The same number, reconciled from the level at the end of 2025 and the monthly changes (the bathtub):

```text
258,785   ending MRR, December 2025
+14,210   net new, January 2026      = 272,995
+21,480   net new, February 2026     = 294,475
+60,160   net new, March 2026        = 354,635
-19,960   net new, April 2026        = 334,675
```

This is the reconciliation the Chat A dry run could not do. Its export started in January, so it had the four changes but not the 258,785. Its running total, 75,890, is exactly 334,675 − 258,785.

### Churn lineage: from A, C, N to 4 of 40

```text
analytics.logo_churn_by_segment_quarter   2026-04-01, Enterprise, starting 40, churned 4, 10.0 %
  <- core.account_months    base: ending_mrr_eur > 0 at 2026-03-01 (40 per segment)
                            churned: of those, ending_mrr_eur = 0 at 2026-06-01 (4 per segment)
  <- core.accounts          customer_segment, decoded from source.crm_accounts.seg
       <- core.stg_crm_accounts   status 'A' -> active, 'C' -> churned, 'N' -> new
            <- source.crm_accounts    108 'A', 12 'C', 24 'N'
```

The CRM status is used for a cross-check only: quality rule R4 confirms that every account marked churned has zero MRR at the end of its churn month. The rate itself comes from billing snapshots, so a late CRM update cannot change it.

## Declaring and testing lineage

`semantic/model.yml` declares, per view, its upstream relations and its sources:

```yaml
lineage:
  upstream: [core.account_months, core.load_status]
  sources: [source.billing_account_mrr, source.crm_accounts, source.load_log]
  transformation: 40_analytics.sql (view), built on 30_core.sql (tables)
```

A declaration that nobody checks rots. Test that every declared relation exists (run as the builder):

```sql
SELECT rel, to_regclass(rel) IS NOT NULL AS exists
FROM (VALUES ('core.account_months'), ('core.accounts'), ('core.load_status'),
             ('source.billing_account_mrr'), ('source.crm_accounts'), ('source.load_log')) AS v(rel);
-- all true on the builder databases
```

PostgreSQL can also tell you which relations a view really reads, so you can compare it with the declaration:

```sql
SELECT DISTINCT d.refobjid::regclass AS reads_from
FROM pg_depend d JOIN pg_rewrite r ON r.oid = d.objid
WHERE r.ev_class = 'analytics.mrr_summary_monthly'::regclass AND d.refobjid <> r.ev_class;
-- core.account_months, core.load_status
```

Test Q07 in `sql/70_checks.sql` does this for all five views and compares the result with the
`upstream` lists in `semantic/model.yml`. When a view starts reading a new table, Q07 fails until
someone updates the declaration. The first declaration in this kit was written from memory. It
missed that the expansion and account views also read `core.accounts` (for country and segment),
and that `analytics.data_status_by_view` reads `core.serving_contracts` (for its thresholds). A
review against `pg_depend` caught it; Q07 now does.

At larger scale, generate lineage instead of writing it. dbt builds a lineage graph from `ref()` calls, and OpenLineage collects lineage events from schedulers and engines. Verify the current documentation of whichever tool you choose; this kit does not depend on either.

## What works and what does not

| Works | Why | Does not work | Why it fails |
| --- | --- | --- | --- |
| A stated evaluation clock in every test and every answer | The same inputs give the same verdict | `now()` inside a view or a test | Verdicts change by the hour; F00 and F01 cannot exist. |
| Warn at 36 hours and still answer | The reader gets the number and knows its age | Hide the data's age | Right meaning, unknown freshness. |
| Block only on written rules | Behaviour is predictable and testable | Invent a block at 60 hours | An undocumented policy; the owner never agreed to it. |
| `data_status_by_view` read first | One place for load time, completeness and quality | Load time in a wiki page | The AI cannot read it, and nobody updates it. |
| Lineage declared and tested | A declaration that breaks gets noticed | "The pipeline is documented in Confluence" | Nobody can check it from the database. |
| A reconciliation from the last known level | Catches a missing opening balance | A running total from the start of an export | 75,890 instead of 334,675: the missing 258,785. |
