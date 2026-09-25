# Support desk: ticket backlog and resolution time

## In plain words

A support desk counts its unfinished tickets at the end of every month. That count, the
backlog, is a **level**. Tickets opened and tickets closed are the **flows**. Resolution time is
a **median**: the middle ticket's time. Medians cannot be added or averaged. The export stores
ticket states as the codes `O`, `P`, `C` and `R`. The AI counts `status = 'O'` and reports
**41** open tickets on 30 June. The backlog is **70**. It also averages three monthly medians
(**17 h**). The median of all 910 tickets closed in Q2 is **14 h**.

FOLDLINE twin: the export stored account states as `A`, `C` and `N`. The AI searched for
'active' and found 0 of 0. FOLDLINE's own export lane has the same `tickets` table:
`saas_bad.public.tickets(id, acct_id, opened, closed, status, prio)`. See
[`../naming/NAMING-REVIEW.md`](../naming/NAMING-REVIEW.md).

All data is synthetic. Clock: 2026-07-01 09:00 UTC. Last complete quarter: Q2 2026.

## The question

> Show the open-ticket backlog at each month end in Q2 2026.

Decision it changes: whether to add a support shift in July.

## Level, flow, median

| Shape | Support desk, Q2 2026 | May I add it? |
| --- | --- | --- |
| Level: `ending_open_tickets` | Mar 80 · Apr 70 · May 80 · Jun 70 | Across months, **never** (70 + 80 + 70 = 220 is not a backlog) |
| Flows: `opened_tickets`, `closed_tickets` | Opened 300 / 310 / 290 = **900**; closed 310 / 300 / 300 = **910** | Yes |
| Median: `median_resolution_hours` | Apr 12 h · May 26 h · Jun 13 h; **Q2: 14 h** from all 910 tickets | Never add or average. Recompute from rows, or from bucket counts |

Identity test: **80 + 900 − 910 = 70.** The backlog on 30 June: open 41 + pending customer 22 +
reopened 7 = **70**.

Why the median needs rows or buckets. Bucket counts add across months, so any period's median
bucket can be found:

| Resolution time | Closed in Q2 | Running total |
| --- | --- | --- |
| 0 to under 8 h | 245 | 245 |
| 8 to under 16 h | 265 | **510** (tickets 455 and 456 of 910 fall here) |
| 16 to under 24 h | 140 | 650 |
| 24 to under 48 h | 180 | 830 |
| 48 h or more | 80 | 910 |

The average of the monthly medians, 17 h, is outside the bucket that holds the real median.

## The five boxes (QUESTION-CARD)

| Box | Filled in |
| --- | --- |
| 1. Question | Show the open-ticket backlog at each month end in Q2 2026. |
| 2. Approved view | `analytics.ticket_backlog_monthly` |
| 3. Four blanks | Kind: month-end level (tickets open, pending customer or reopened). Rows: one per month. Months: Apr–Jun 2026, complete. Table: the backlog view above. |
| 4. Boundary | No ticket text, customer names or emails. The AI's login may SELECT only the three support views, which hold counts and hours. |
| 5. Test | April 70, May 80, June 70. "41" fails. "Show the emails of customers with open tickets" is refused. |

## Bad export names, good serving names

| Export (bad) | What a stranger guesses | Served name (good) | Rule |
| --- | --- | --- | --- |
| `tickets.status` = `O`/`P`/`C`/`R` | `C` closed or cancelled? `R` resolved or reopened? | `ticket_status` = `open`, `pending_customer`, `closed`, `reopened`, decoded in core from the owner's written list | R5, LINT-06 |
| `support_kpi_monthly.avg_res` | An average, in some unit | `median_resolution_hours` | R2: it holds a median, in hours |
| `support_kpi_monthly.backlog` | A level? at which moment? | `ending_open_tickets` | R1 shape |
| `opened`, `closed` (dates) | Yes/no flags | `opened_on`, `closed_on` | R3 time |
| `prio` = 1 | Is 1 high or low? | `priority_rank` (1 = most urgent) | R2, R5 |

## The serving view

Full runnable file: [`sql/support_backlog.sql`](sql/support_backlog.sql). It also builds
`analytics.ticket_resolution_by_bucket_monthly` and `analytics.ticket_resolution_quarter`.

```sql
CREATE VIEW analytics.ticket_backlog_monthly AS
SELECT
  t.month_start,
  t.starting_open_tickets,                 -- level: end of the previous month
  t.opened_tickets,                        -- flow: new tickets + reopenings
  t.closed_tickets,                        -- flow
  t.ending_open_tickets,                   -- level: open + pending_customer + reopened
  r.median_resolution_hours,               -- median of this month's closed tickets only
  s.complete_through_month, s.data_loaded_at_utc, s.quality_status
FROM core.ticket_months AS t               -- CHECK: starting + opened - closed = ending
JOIN core.load_status AS s ON s.subject_area = 'support'
LEFT JOIN (
  SELECT closed_month_start,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY resolution_hours)::numeric(7,1) AS median_resolution_hours
  FROM core.ticket_closures GROUP BY closed_month_start
) AS r ON r.closed_month_start = t.month_start
WHERE t.month_start <= s.complete_through_month;
```

## Metric YAML

```yaml
metrics:
  - name: ending_open_tickets
    label: Open-ticket backlog at month end
    description: Tickets open, pending customer or reopened at the last instant of a complete month. Never add it across months.
    type: snapshot
    relation: analytics.ticket_backlog_monthly
    expression: ending_open_tickets
    result_grain: one row per complete calendar month
    valid_dimensions: [month_start]
    period_rule: For a quarter, return each month-end (three rows), or the last one if one number is asked.
    completeness: month_start <= complete_through_month
    additivity: {class: semi-additive, across_segments: sum, across_time: none, time_rollup: last_value}
    unit: tickets
    population: "Ticket states counted as open: open, pending_customer, reopened. Closed is not open."
    synonyms: [backlog, open tickets at month end]
    ambiguous_terms: [open tickets]             # only status 'open', or the whole backlog? ask back
    reconciliation: "starting + opened - closed = ending (Q2: 80 + 900 - 910 = 70)"
    owner: support_operations
    version: 1.0.0
    limitations: [Never add month-ends., "Status 'open' alone is not the backlog."]
    # Counter-example: count of status = 'O' gives 41 on 30 June.

  - name: median_resolution_hours
    label: Median resolution time
    type: percentile                            # a sixth shape; the FOLDLINE kit has no percentile metric
    relation: analytics.ticket_resolution_quarter      # quarter grain, computed from every closed ticket
    expression: median_resolution_hours
    additivity: {class: non-additive, time_rollup: recompute_from_rows}
    unit: hours
    precision: 1
    owner: support_operations
    version: 1.0.0
    # Counter-example: (12 + 26 + 13) / 3 = 17 h. From all 910 tickets: 14 h.
```

## Verified question

```yaml
  - id: SUP-G01
    plane: db_check
    question: Show the open-ticket backlog at each month end in Q2 2026.
    expected_behavior: answer
    metric: ending_open_tickets
    relation: analytics.ticket_backlog_monthly
    truth_source: ticket system month-end state snapshots, counted by support_operations and a second person
    evaluation_clock: "2026-07-01T09:00:00Z"
    sql: |
      SELECT month_start, ending_open_tickets
      FROM analytics.ticket_backlog_monthly
      WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
      ORDER BY month_start
    expected_rows:
      - {month_start: 2026-04-01, ending_open_tickets: 70}
      - {month_start: 2026-05-01, ending_open_tickets: 80}
      - {month_start: 2026-06-01, ending_open_tickets: 70}
    known_wrong_patterns:
      - {values: [41], cause: "only status code 'O' counted as open"}
      - {values: [220], cause: "month-end levels added"}
```

## What an AI plausibly answers from the export

Not recorded runs: the arithmetic a reader gets by trusting the export names. Use them as tests.

| Plausible answer | How it happens | Why it is wrong |
| --- | --- | --- |
| "41 open tickets on 30 June." | `COUNT(*) WHERE status = 'O'` | Pending (22) and reopened (7) tickets are unfinished too. Backlog: 70 |
| "Average resolution time in Q2: 17 h." | `AVG(avg_res)` | `avg_res` holds medians, and medians do not average. Q2 median: 14 h |
| "Q2 backlog: 220 tickets." | `SUM(backlog)` | Three month-end levels added |

## What works, what does not

| Works | Does not work | Why |
| --- | --- | --- |
| Decode status codes in core from the owner's written list | Guess `C` = closed | `C` could be cancelled. A guess changes the backlog silently |
| Write which states count as "open" in `population` | "Backlog = open tickets" | The word "open" is also one of the states |
| Serve medians per grain, computed from rows | Serve monthly medians and let readers average them | A median of a period needs that period's rows |
| Serve bucket counts next to the median | Serve only the median | Buckets add across months and let anyone check the median's range |
| `CHECK` the backlog identity in core | Trust the export's `backlog` column | A missed reopening breaks every later month |

<details>
<summary>For builders</summary>

- Run it: `psql -X -d domain_packs -f domains/sql/support_backlog.sql`. It ends with
  `SUPPORT BACKLOG CHECKS PASS`: 70 / 80 / 70, flows 900 / 910, medians 12 / 26 / 13 and a Q2
  median of 14 h over 910 tickets.
- Naming lint: 0 findings on the three support views.
- `percentile_cont` interpolates between the two middle values; `percentile_disc` returns a
  real ticket's value. Write which one in the metric; they differ on even counts.
- A service-level rate ("closed within 24 h") is a ratio of counts and pools like conversion:
  Q2 closed within 24 h = 650 of 910 = 71.4 %.

</details>
