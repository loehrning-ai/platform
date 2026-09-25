# Web shop: order conversion by channel

## In plain words

A web shop wants to know how many visits turn into orders. That is a **rate**: orders divided by
sessions. Search brought 20,000 sessions and 400 orders (2 %). Email brought 1,000 sessions and
80 orders (8 %). The export ships only the two rates. The AI averages them and reports **5.00 %**.
The shop's real rate is 480 ÷ 21,000 = **2.29 %**. Two more traps sit in the same data: unique
visitors do not add across days, and the clock decides which month an order belongs to.

FOLDLINE twin: logo churn. Every segment had 40 starting accounts, so averaging three 10 % rates
happened to give the pooled 10 %. FOLDLINE was right by luck. The web shop is where the luck runs out.

All data is synthetic. Reporting time zone: UTC (written by the owner). Clock: 2026-07-01 09:00 UTC.

## The question

> What was the order conversion rate in June 2026, by channel and for the whole shop?

Decision it changes: how the July marketing budget is split between search and email.

## Shapes in this pack

| Shape | Web shop, June 2026 | May I add it? |
| --- | --- | --- |
| Flow counts: `sessions`, `orders` | 21,000 sessions; 480 orders | Yes, across days and channels |
| Rate: `conversion_rate_pct` = orders ÷ sessions | Search 2.00 %, email 8.00 %, shop **2.29 %** | Never. Pool the counts |
| Distinct count: unique visitors | 1–3 June: 600, 500, 600 per day; **1,450** over the three days | Never across days. 250 visitors came back and would be counted twice (1,700) |
| Level (not served here): registered customers at month end | A balance, like ending MRR | Across months, never |

## The five boxes (QUESTION-CARD)

| Box | Filled in |
| --- | --- |
| 1. Question | What was the order conversion rate in June 2026, by channel and for the whole shop? |
| 2. Approved view | `analytics.conversion_by_channel_daily` |
| 3. Four blanks | Kind: rate = orders ÷ sessions, pooled, in percent. Rows: one per channel plus one total. Months: June 2026 as UTC days 1–30, complete. Table: the conversion view above. |
| 4. Boundary | No visitor keys, cookies, IP addresses or customer emails. The AI's login may SELECT only this view, which holds daily channel counts. |
| 5. Test | Search 2.00 %, email 8.00 %, all channels 2.29 % (480 of 21,000). "5.00 %" fails. |

## Bad export names, good serving names

| Export (bad) | What a stranger guesses | Served name (good) | Rule |
| --- | --- | --- | --- |
| `web_kpis.cr` | Conversion rate? click rate? credit? | `conversion_rate_pct`, with `orders` and `sessions` beside it | R2 unit, LINT-05 |
| `conv` | Conversions of what? | `orders` (a count is a plural noun) | R2 |
| `ts` (timestamp, no zone) | Local time? UTC? | `ordered_at_utc` in core; `activity_on` (UTC day) in the view | R3 time |
| `visitors` in a daily table | Adds up like sessions | `unique_visitors` with the COMMENT "distinct per day; never add across days" | R1 shape |
| `month` = `'2026-06'` (text) | A date | `month_start` (date) | R3, LINT-04 |

## The serving view

Full runnable file: [`sql/webshop_conversion.sql`](sql/webshop_conversion.sql).

```sql
CREATE VIEW analytics.conversion_by_channel_daily AS
SELECT
  c.activity_on,                                         -- UTC day; orders assigned by UTC time
  date_trunc('month', c.activity_on)::date AS month_start,
  c.channel_name,                                        -- 'search' or 'email', in words
  c.sessions,                                            -- denominator: adds
  c.orders,                                              -- numerator: adds
  round(100.0 * c.orders / NULLIF(c.sessions, 0), 2) AS conversion_rate_pct,   -- this row only
  s.complete_through_month, s.data_loaded_at_utc, s.quality_status
FROM core.channel_days AS c
JOIN core.load_status AS s ON s.subject_area = 'web_shop'
WHERE date_trunc('month', c.activity_on)::date <= s.complete_through_month;
```

Unique visitors are not in this view. A distinct count must be computed from visitor rows at
exactly the grain it is asked for (day, week, month). Serve it in its own view per grain, or
refuse for grains you do not serve.

## Metric YAML

```yaml
metrics:
  - name: order_conversion_rate
    label: Order conversion rate
    description: Orders divided by sessions for a complete period and channel set, in percent. Pool counts; never average rates.
    type: ratio
    relation: analytics.conversion_by_channel_daily
    numerator: orders
    denominator: sessions
    zero_denominator: "null"
    result_grain: one row per channel for the asked period, plus an all-channel row
    valid_dimensions: [activity_on, month_start, channel_name]
    period_rule: Sum orders and sessions over the period and channels, then divide.
    completeness: month_start <= complete_through_month
    time_zone: UTC                              # an order at 01:30 Berlin on 1 July is a June order
    additivity: {class: non-additive, across_segments: recompute_from_components, time_rollup: recompute_from_components}
    unit: percent
    scale: 0-100
    precision: 2
    synonyms: [session conversion rate]
    ambiguous_terms: [conversion, cr]           # per session or per visitor? orders or sign-ups? ask back
    owner: ecommerce_analytics
    version: 1.0.0
    limitations: ["Per session, not per visitor.", "Never average channel or daily rates."]
    # Counter-example: (2.00 + 8.00) / 2 = 5.00 %. Pooled: 480 / 21,000 = 2.29 %.
```

## Verified question

```yaml
  - id: WEB-G01
    plane: db_check
    question: What was the order conversion rate in June 2026, by channel and for the whole shop?
    expected_behavior: answer
    metric: order_conversion_rate
    relation: analytics.conversion_by_channel_daily
    truth_source: order system counts and analytics session counts, reconciled by ecommerce_analytics
    evaluation_clock: "2026-07-01T09:00:00Z"
    sql: |
      SELECT coalesce(channel_name, 'all channels') AS channel_name,
             sum(sessions) AS sessions, sum(orders) AS orders,
             round(100.0 * sum(orders) / NULLIF(sum(sessions), 0), 2) AS conversion_rate_pct
      FROM analytics.conversion_by_channel_daily
      WHERE month_start = DATE '2026-06-01'
      GROUP BY ROLLUP (channel_name)
      ORDER BY GROUPING(channel_name), sum(sessions) DESC
    expected_rows:
      - {channel_name: search,       sessions: 20000, orders: 400, conversion_rate_pct: 2.00}
      - {channel_name: email,        sessions: 1000,  orders: 80,  conversion_rate_pct: 8.00}
      - {channel_name: all channels, sessions: 21000, orders: 480, conversion_rate_pct: 2.29}
    known_wrong_patterns:
      - {values: [5.00], cause: "average of the channel rates"}
      - {values: [1700], cause: "daily unique visitors added (true three-day count: 1,450)"}
```

## What an AI plausibly answers from the export

Not recorded runs: the arithmetic a reader gets by trusting the export names. Use them as tests.

| Plausible answer | How it happens | Why it is wrong |
| --- | --- | --- |
| "June conversion: 5.00 %." | `AVG(cr)` over two channel rows | 1,000 email sessions weigh as much as 20,000 search sessions. Pooled: 2.29 % |
| "1,700 unique visitors on 1–3 June." | `SUM(visitors)` over three days | 250 visitors came on two days. Distinct over the period: 1,450 |
| "Order 01:30 on 1 July counts in July." | Local timestamp without a zone | 01:30 Berlin summer time is 23:30 UTC on 30 June: a June order in a UTC report |

## What works, what does not

| Works | Does not work | Why |
| --- | --- | --- |
| Serve `orders` and `sessions`; compute the rate last | Serve `cr` alone | A rate without counts cannot be pooled or checked |
| Write the denominator: sessions, not visitors | "Conversion = orders ÷ traffic" | Per session and per visitor differ by the return rate |
| Distinct counts per grain, from visitor rows | Daily uniques summed into weekly | Returning visitors are counted again every day |
| One written reporting zone (UTC) and `_at_utc` names | Timestamps without zone | The month of an order depends on who reads it |
| Keep visitor keys in core | Serve cookie IDs "for funnels" | A stable key is pseudonymous, not anonymous |

<details>
<summary>For builders</summary>

- Run it: `psql -X -d domain_packs -f domains/sql/webshop_conversion.sql`. It ends with
  `WEB SHOP CHECKS PASS`. The time-zone check uses PostgreSQL's own `AT TIME ZONE 'Europe/Berlin'`.
- Naming lint: 0 findings on this view.
- Large sites use approximate distinct counts (HyperLogLog sketches). A sketch can be merged
  across days; a plain count cannot. Label the result "approximate".
- If the business reports in local time, write `time_zone: Europe/Berlin` in the metric and
  name the day column accordingly. Pick one zone per metric; never mix them in one view.

</details>
