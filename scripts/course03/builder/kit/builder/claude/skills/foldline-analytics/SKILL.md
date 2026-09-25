---
name: foldline-analytics
description: Answer FOLDLINE questions about ending MRR, net new MRR, MRR movements, logo churn rate, expansion MRR by country and top accounts by MRR from the five approved analytics views, with a metric trace. Use when a question names one of these metrics, FOLDLINE revenue or churn numbers, or the analytics schema. Asks back on bare "MRR" or "revenue"; refuses profit and customer identifiers.
---

# FOLDLINE analytics

This Skill guides. It does not lock anything. The database login `foldline_ready_reader` is the lock:
it can read five views and nothing else.

## Steps, every time

1. Decide the behaviour before any SQL:
   - Bare "MRR", "revenue", "churn" or "growth", or no period: ask one short question back. No SQL.
   - Profit, margin, cost, COGS, recognised revenue, LTV or any proxy: refuse. Say what is missing.
   - Names, emails, phone numbers, addresses or other direct identifiers: refuse before any SQL.
     You may offer results by the pseudonymous `account_key`.
2. Read `analytics.data_status_by_view` for the view you will use. Compute
   age = evaluation clock - `data_loaded_at_utc`. The clock is the one in the question, else
   2026-07-01 09:00 UTC in this course. Never use the wall clock silently.
   - Age over `warn_after_hours` (36): answer, and start with a warning that states load time and age.
   - Requested month after `complete_through_month`, or `quality_status` not `passing`: refuse.
   - `hard_expiry_hours` is null: no expiry was written. Do not invent one.
3. Pick the metric in `references/metrics.md`. Use only the view and column it names.
4. Write one `SELECT` with schema-qualified names (`analytics.<view>`). Never rely on
   `search_path`. Detail queries on `analytics.account_mrr_monthly` carry `LIMIT 1000` or less.
5. Never add ending MRR across months. Add movements only inside complete periods. Recompute rates
   and averages from their counts.
6. End with a Trace.

## Trace (required in every answer)

```text
Trace
- Metric: ending_mrr 1.0.0
- Period: 2026-04-01 to 2026-06-30 (three month-ends), EUR
- Relation: analytics.mrr_summary_monthly.ending_mrr_eur
- Data loaded: 2026-07-01 06:00 UTC; age 3 h at clock 2026-07-01 09:00 UTC; fresh (warn after 36 h)
- Limitations: not revenue, cash, ARR or profit
```

A correct value without the metric name and version fails the course's citation check.
Loaded is not the same as used.

## Never

- Query `source`, `core` or `public`, or any object outside the five views. If a query is denied
  with SQLSTATE 42501, report the denial. Do not look for another route.
- Put a connection string, password or DSN in any file, message or command.
- Answer from memory or from an export file "for context".
