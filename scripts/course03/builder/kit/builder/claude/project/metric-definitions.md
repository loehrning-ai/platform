# FOLDLINE metric definitions (synthetic teaching data)

Owner: revenue_analytics. These definitions are the approved meaning of each number. They override
any assumption about column names. Compiled by hand from `semantic/metric.yml` (format version 1).
Every answer cites the metric name **and** its version, for example `ending_mrr 1.0.0`.

Money is EUR. Time is UTC. Evaluation clock: 2026-07-01 09:00 UTC unless the question states another.

## Reading the files

- Rows are labelled by the first day of the month. `ending_mrr_eur` on the `2026-06-01` row is the
  level at the **end** of June.
- `complete_through_month` = `2026-06-01` means June 2026 is complete. Later months are not answerable.
- `data_status_by_view.csv` lists the four data files. It does not list itself.
- An empty `hard_expiry_hours` means no expiry was written. Old data gets a warning, never a block
  by age alone.
- `account_key` (fl_0001 ... fl_0144) is pseudonymous, not anonymous. No names, emails, phone
  numbers or addresses exist in any approved file.

## Approved metrics

### ending_mrr (version 1.0.0): a level

| Field | Value |
| --- | --- |
| Label | Ending MRR |
| Kind of number | Snapshot (a level at the last instant of the month) |
| Rows per what | One row per complete calendar month |
| Which months | For a quarter, return each complete month-end: three rows. If one number is needed, return the last month-end and say so. Never sum or average month-ends |
| Which file | `mrr_summary_monthly.csv`, column `ending_mrr_eur` |
| Adds across | Accounts and segments. **Not** across months |
| Unit | EUR, whole euros |
| Limitations | Not revenue, cash collected, ARR or profit. Excludes setup fees, usage charges and taxes |
| Ask back on | "MRR", "revenue" without a kind or period |

### net_new_mrr (version 1.0.0): a change

| Field | Value |
| --- | --- |
| Label | Net new MRR |
| Kind of number | Movement (a change during the month) |
| Formula | `new_mrr_eur + expansion_mrr_eur - contraction_mrr_eur - churned_mrr_eur` |
| Rows per what | One row per complete calendar month |
| Which months | For a quarter, add the three complete months. The result equals ending MRR at the end of the quarter minus ending MRR at the end of the previous quarter |
| Which file | `mrr_summary_monthly.csv`, column `net_new_mrr_eur` |
| Sign | Negative means MRR shrank that month |
| Unit | EUR |
| Limitations | A monthly change, not a balance |

### logo_churn_rate (version 1.0.0): a rate

| Field | Value |
| --- | --- |
| Label | Logo churn rate |
| Kind of number | Ratio: `churned_accounts / starting_accounts`, in percent with one decimal |
| Base | Accounts active at the end of the month before `period_start`. Accounts that joined during the quarter are **not** in the base |
| Rows per what | One row per customer segment and quarter, `[period_start, period_end_exclusive)` |
| Across segments or time | Recompute from the counts: `sum(churned) / sum(starting)`. Never average the rates |
| Zero base | 0 of 0 is "no rate", never 0 % |
| Which file | `logo_churn_by_segment_quarter.csv` |
| Limitations | Counts accounts, not money. MRR churn is `churned_mrr_eur` in `mrr_summary_monthly.csv` |
| Ask back on | "churn" without accounts or money |

### expansion_mrr (version 1.0.0): a change by country

| Field | Value |
| --- | --- |
| Label | Expansion MRR |
| Kind of number | Movement: increase from accounts active at both month-ends. New accounts are not expansion |
| Rows per what | One row per complete month and `country_code` (zeros are explicit) |
| Which months | For a quarter, add the three months per country |
| Which file | `expansion_mrr_by_country_monthly.csv`, column `expansion_mrr_eur` |
| Unit | EUR |

### account_ending_mrr (version 1.0.0): the level per account

| Field | Value |
| --- | --- |
| Label | Account ending MRR |
| Kind of number | Snapshot per pseudonymous account |
| Rows per what | One row per `account_key` and complete month (144 accounts x 18 months) |
| Which months | Pick one month-end. For "top accounts", filter one month, order by value then `account_key`, and show at most 1,000 rows |
| Which file | `account_mrr_monthly.csv`, column `ending_mrr_eur` |
| Adds across | Accounts (the sum of one month equals `ending_mrr`). Not across months |
| Limitations | No direct identifiers. Requests for names or emails are refused |

## Not defined here: refuse, do not approximate

Profit, margin, cost, COGS, recognised revenue, LTV and any "proxy". No cost, margin, profit,
revenue-recognition or customer-contact field exists in the approved files. MRR is not a profit
proxy. A `plan_name` column exists; the missing pieces are cost data and an approved profit definition.
