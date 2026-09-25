# Naming review worksheet

## In plain words

Ten minutes, one table, one question per column: **would a stranger guess right?**

A stranger is anyone who has not seen the data: a new colleague, an auditor, or an AI.
Read each column name out loud. Write down what a stranger would think it means. If that is not
what it holds, the name forces a guess, and an AI will guess too.

At FOLDLINE, `monthly_revenue.amount` sounded like revenue. It was each month's change. The AI
guessed "ending MRR" and answered −€19,960 for April. The true ending MRR was €334,675.

**How to use this sheet**

1. Pick one table or view that you plan to show an AI.
2. Copy its column names into the blank table at the bottom. Names only, no data.
3. For each column, fill in the five boxes. Use the rules in `NAMING-RULES.md` (R1–R7).
4. Count the rows where the stranger's guess is wrong or impossible. Write the score line.
5. Ask a second person to fill in column 2 without looking at yours. Compare.
6. Run `lint_names.sql` on the same schema. The lint catches patterns; you catch meaning.

Optional stranger test with an AI: paste only the table name and column names into a chat with no
other context, and ask "What does each column hold, in which unit, at which moment?" Every wrong
answer is a name that forces a guess. Use synthetic or already-public names only; never paste
data or anything your employer has not approved.

---

## Worked example: FOLDLINE's export lane (all 33 columns)

Rule codes: R1 shape, R2 unit, R3 time, R4 grain, R5 words not codes, R6 keys, R7 schema;
"banned" = on the banned list. The "What it really holds" column is verified against the builder's
`saas_bad` database.

### `public.customer_master` (one row per account, 144 rows)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | Some row number | The account's system number; also called `acct_id` and `customer_id` elsewhere | R6, banned | `account_id` (core); `account_key` (served) | System identifier of the account. Core only; never served. | yes |
| `seg` | Segment? Segmentation model? | Enterprise, Mid-Market or SMB | banned | `customer_segment` | Customer segment: Enterprise, Mid-Market or SMB. | yes |
| `country` | Country name | ISO 3166-1 alpha-2 code (`AT`, `DE`) | R5 | `country_code` | ISO 3166-1 alpha-2 country of the account. | no (rename for consistency) |
| `plan` | Plan name | Plan label (`Growth`, `Scale`) | minor | `plan_name` | Current plan name. | no |
| `status` | Active or not | `A` / `C` / `N`; `N` = joined this quarter | R5, banned | `account_status` = `active` / `churned` / `new` | Account state in words. Never count `new` accounts in a churn base. | yes |
| `status_dt` | Some date | Day of the last status change | R3 | `churned_on` (when churned) | Day the account churned; NULL if it never did. | yes |

### `public.subscription_export` (144 rows, June 2026 only)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| (table) | All subscriptions | One month, June 2026 | R4 | not served; use `analytics.account_mrr_monthly` | — | yes |
| `customer_id` | A customer number, maybe a CRM id | The same account number as `customer_master.id` | R6 | `account_key` | Pseudonymous analytics key. Not anonymous. | yes |
| `date` | Subscription start? Invoice day? | First day of the month (`2026-06-01`) | R3, banned | `month_start` | First day of the calendar month (UTC). | yes |
| `amount` | Price? Invoice? | June month-end MRR level, EUR | R1, R2, banned | `ending_mrr_eur` | Level: the account's recurring value at month end, EUR. Never sum across months. | yes |

### `public.billing_events` (movements, with retry copies)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| `event_id` | Unique event number | Movement number; a retry copy repeats it | (grain, not name) | `movement_id`, primary key | One row per billing movement; retry copies removed. | no |
| `acct_id` | Account number | Account number | abbreviation | `account_id` | System identifier of the account. Core only. | no |
| `dt` | Event day | Posting day | R3, banned | `posted_on` | Day the movement was posted. | yes |
| `type` | Event type | `N` / `E` / `D` / `C` (C = cancel here, churned elsewhere) | R5, banned | `movement_type` = `new` / `expansion` / `contraction` / `churn` | Kind of MRR movement, in words. | yes |
| `status` | Event status | `posted` / `pending` | banned (bare) | `billing_status` | posted or pending; pending invoices are not yet final. | no |
| `amount` | Invoice total | Signed change of monthly recurring value, EUR | R1, R2, banned | `mrr_change_eur` | Change: signed EUR change of MRR. Never a balance. | yes |
| `retry_batch` | A batch number | Set only on a repeated copy | R1 | drop in core (deduplicate) | — | yes |

### `public.monthly_revenue` (one row per month and segment, 18 rows)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| (table) | Monthly revenue totals | Monthly MRR changes, Jan–Jun 2026 | R4 | not served; `analytics.mrr_summary_monthly.net_new_mrr_eur` | — | yes |
| `dt` | Some date | First day of the month | R3, banned | `month_start` | First day of the calendar month (UTC). | yes |
| `segment` | Segment | Segment name | minor | `customer_segment` | Customer segment. | no |
| `amount` | Revenue for the month | new + expansion − contraction − churn, EUR | R1, R2, banned | `net_new_mrr_eur` | Change: net new MRR in the month, EUR. Adds across months; never read it as a level. | yes |

### `public.acct_history` (one row per account per active month, 1,388 rows)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| `acct_id` | Account number | Account number | abbreviation | `account_id` | System identifier. Core only. | no |
| `dt` | Some date | First day of the month | R3, banned | `month_start` | First day of the calendar month (UTC). | yes |
| `balance` | Start or end balance? | Month-END MRR level (April sum €334,675) | R1, R2, banned | `ending_mrr_eur` | Level at month end, EUR. Already contains the month's change. | yes |
| `change` | Something to add to the balance | The month's change, already inside `balance` | R1, R2, banned | `net_new_mrr_eur` | Change within the month, EUR. Never add it to ending_mrr_eur. | yes |
| `state` | Some state | `A` / `C` / `N` | R5, banned | `account_status` | Account state in words. | yes |

### `public.usage_log` (one row per account per month, Apr–Jun 2026)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| `acct_id` | Account number | Account number | abbreviation | `account_id` | System identifier. Core only. | no |
| `dt` | Log time | First day of the month | R3, banned | `month_start` | First day of the calendar month (UTC). | yes |
| `events` | Billing events? | Product usage count | R1, banned | `product_events` | Count of product usage events in the month. Not billing. | yes |

### `public.tickets` (60 support tickets, Q2 2026)

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | Ticket or account? | Ticket number | R6, banned | `ticket_id` | System identifier of the ticket. | yes |
| `acct_id` | Account number | Account number | abbreviation | `account_id` | System identifier. Core only. | no |
| `opened` | A yes/no flag? | Day the ticket was opened | R3 | `opened_on` | Day the ticket was opened. | yes |
| `closed` | A yes/no flag? | Day the ticket was closed | R3 | `closed_on` | Day the ticket was closed; NULL while open. | yes |
| `status` | Open or closed | `O` / `P` / `C` / `R`, never documented | R5, banned | `ticket_status` (ask the owner for the decode) | Ticket state in words. | yes |
| `prio` | Priority | 1–n, direction unknown | R2, banned | `priority_rank` (1 = highest) | Priority rank; 1 is the most urgent. | yes |

### Score

> **Names that force a guess: 24 of 33.**
> For comparison, the five approved views have 43 columns. `lint_names.sql` returns 0 rows on
> them. A reviewer's target for a served view is **0 of m**.

The score is a judgement, not a measurement. Two reviewers may disagree on a row, and that
disagreement is useful: write down the reason and settle it with the owner.

---

## Your table

Table or view: `______________________`  Rows per what? `______________________`
Reviewer 1: `________`  Reviewer 2: `________`  Date: `________`

| Current name | What would a stranger guess? | What it really holds | Rule broken | Proposed name | Description sentence (COMMENT) | Forces a guess? |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

> **Names that force a guess: ___ of ___.**

**Before you finish**

- [ ] Every "yes" has a proposed name and a one-sentence description with a "never".
- [ ] Every proposed name passes the checklist in `NAMING-RULES.md` §10.
- [ ] The rename map is written down (old name → new name → layer). The build runbook uses it
      (`../RUNBOOK.md`, the naming step).
- [ ] Anything already published is renamed with an alias view, not in place (`NAMING-RULES.md` §7).
- [ ] `lint_names.sql` has been run on the old and on the new schema.
