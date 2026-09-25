# FOLDLINE metrics, compiled for the foldline-analytics Skill

Compiled by hand from `semantic/metric.yml`. Same names and versions as the source, or the readers
drift. Cite `<name> <version>` in every trace. Every relation is schema-qualified; the reader's
`search_path` is empty.

| Metric | Version | Kind | View and column | Rows per what | Across months |
| --- | --- | --- | --- | --- | --- |
| `ending_mrr` | 1.0.0 | snapshot (level) | `analytics.mrr_summary_monthly.ending_mrr_eur` | complete calendar month | never add; a quarter's single value is its last month-end |
| `net_new_mrr` | 1.0.0 | movement (change) | `analytics.mrr_summary_monthly.net_new_mrr_eur` | complete calendar month | add inside complete periods |
| `logo_churn_rate` | 1.0.0 | ratio | `analytics.logo_churn_by_segment_quarter`: `churned_accounts / starting_accounts`, stored as `logo_churn_rate_pct` | segment and quarter, `[period_start, period_end_exclusive)` | recompute from counts; never average |
| `expansion_mrr` | 1.0.0 | movement | `analytics.expansion_mrr_by_country_monthly.expansion_mrr_eur` | month and `country_code` | add inside complete periods |
| `account_ending_mrr` | 1.0.0 | snapshot per account | `analytics.account_mrr_monthly.ending_mrr_eur` | `account_key` and month | never add; LIMIT 1000 or fewer |

Status and freshness: `analytics.data_status_by_view` (one row per data view; it does not list itself).

## Period and sign rules

- "Last complete quarter" at 2026-07-01 09:00 UTC: `month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'`.
- Answerable only when `month_start <= complete_through_month` and `quality_status = 'passing'`.
- `net_new_mrr` = `new_mrr_eur + expansion_mrr_eur - contraction_mrr_eur - churned_mrr_eur`. Negative means MRR shrank.
- Reconciliation: previous `ending_mrr` + `net_new_mrr` = `ending_mrr`.
- Logo churn base: accounts active at the end of the month before `period_start`. Joiners during the quarter are not in the base. 0 of 0 is no rate.

## Ambiguous words: ask back

| Word | Could mean |
| --- | --- |
| MRR, revenue | ending MRR, net new MRR or a movement component |
| churn, churn rate | logo churn (accounts) or churned MRR (money) |
| growth | net new MRR or expansion MRR |
| customer, client | a pseudonymous `account_key`, or an identity (refuse identities) |

## Not defined: refuse

Profit, margin, cost, COGS, recognised revenue, LTV, any proxy. `active_accounts` and
`avg_mrr_per_active_account` exist in `metric.yml` with `status: example`; they are not in the
policy allowlist, so refuse them until the owner approves them.

## Worked example (the workshop question)

```sql
SELECT month_start, ending_mrr_eur
FROM analytics.mrr_summary_monthly
WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
ORDER BY month_start;
```

Three rows, one per month-end. No quarter total. The expected values live in
`semantic/verified-questions.yml`, outside this Skill: a test inside the AI's context is not a test.
