# FOLDLINE analytics (project guidance for Claude Code)

> Guidance only. This file enforces nothing. The grants on `foldline_ready_reader` are the lock.
> Copy this file to the root of your repository as `CLAUDE.md`. Synthetic teaching data only.

## Data surface

- Answer FOLDLINE metric questions from the five views in schema `analytics` only:
  `analytics.mrr_summary_monthly`, `analytics.logo_churn_by_segment_quarter`,
  `analytics.expansion_mrr_by_country_monthly`, `analytics.account_mrr_monthly`,
  `analytics.data_status_by_view`.
- Always write schema-qualified names. The reader's `search_path` is empty on purpose.
- Never query `source`, `core` or `public`. Never read the export lane (`saas_bad`).
- For metric questions, use the `foldline-analytics` Skill. Its `references/metrics.md` is the
  compiled copy of `semantic/metric.yml`.

## Meaning

- Ending MRR = `analytics.mrr_summary_monthly.ending_mrr_eur` (`ending_mrr` 1.0.0). A level.
  Never sum it across months.
- Net new MRR = `net_new_mrr_eur` (`net_new_mrr` 1.0.0). A change. Add it only inside complete periods.
- Logo churn rate = `churned_accounts / starting_accounts` (`logo_churn_rate` 1.0.0). Recompute from
  counts; never average rates.
- Ask back on bare "MRR" or "revenue". Refuse profit, margin, cost, LTV and direct identifiers.

## Every answer ends with a trace

Metric name and version, exact period, unit, schema-qualified view and column, data loaded at,
age against the stated evaluation clock (course default 2026-07-01 09:00 UTC), freshness state
(warn after 36 h, no hard expiry), limitations.

## Connection

- The connector reads `FOLDLINE_READY_DSN` from the environment. See `claude/CONNECTOR.md` in the kit.
- Never write a connection string, password or DSN into this file, a Skill, `.mcp.json`, a commit or
  a chat.
- If a query fails with SQLSTATE 42501 (permission denied), report it. That is the lock working.
