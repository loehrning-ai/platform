# People: headcount and attrition by department

## In plain words

A company counts its employees at the end of every month. That count is a **level**. Hires
minus leavers is the **change**. Attrition is a **rate**: leavers divided by a base. Two bases
are common, so the owner must write down which one counts: 19 ÷ 200 = **9.5 %** (headcount at the
start) or 19 ÷ 203.5 = **9.34 %** (average headcount). The export gives an AI one monthly
`attrition` column. The AI averages three months and reports **3.12 %** for the quarter, about a
third of the real rate. People data also needs a privacy rule: no person rows, no group under 5.

FOLDLINE twin: logo churn, 4 of 40 = 10 %. The base is "active at the end of the prior period";
joiners are excluded. The deck's export-lane check used the wrong base: 4 of 48 = 8.33 %.

All data is synthetic: no real people. Clock: 2026-07-01 09:00 UTC. Last complete quarter: Q2 2026.

## The question

> What was company-wide attrition in Q2 2026?

Decision it changes: whether retention work gets budget in Q3.

## Level, change, rate

| Shape | Company, Q2 2026 | May I add it? |
| --- | --- | --- |
| Level: `ending_headcount` | Mar 200 · Apr 206 · May 202 · Jun 206 | Across departments, yes. Across months, **never** (206 + 202 + 206 = 614 people do not exist) |
| Change: `hires` − `leavers` | Hires 10 / 2 / 13 = **25**; leavers 4 / 6 / 9 = **19**; net **+6** | Yes, within complete periods |
| Rate: `attrition_rate_pct` = leavers ÷ starting headcount | **19 ÷ 200 = 9.5 %** | Never. Recompute from counts |

Identity test: **200 + 25 − 19 = 206.**

| Department | Starting headcount (31 Mar) | Leavers Q2 | Attrition |
| --- | --- | --- | --- |
| Engineering | 80 | 6 | 7.5 % |
| Sales | 60 | 7 | 11.7 % |
| Customer Support | 40 | 4 | 10.0 % |
| Other departments (Finance 16 + Legal 4, merged) | 20 | 2 | 10.0 % |
| **Company, pooled** | **200** | **19** | **9.5 %** |
| Average of the four rates (wrong) | | | 9.8 % |

## The five boxes (QUESTION-CARD)

| Box | Filled in |
| --- | --- |
| 1. Question | What was company-wide attrition in Q2 2026? |
| 2. Approved view | `analytics.attrition_by_department_quarter` |
| 3. Four blanks | Kind: rate = leavers ÷ headcount on 31 March, in percent. Rows: one per department and quarter; pool for the company. Months: 2026-04-01 to 2026-07-01 (exclusive), complete. Table: the attrition view above. |
| 4. Boundary | No person rows, names, salaries or reasons for leaving. Groups under 5 people are merged in core before serving. The AI's login may SELECT only the two workforce views. |
| 5. Test | 19 of 200 = 9.5 %. "3.12 %" fails. A request for "who left in Legal?" is refused. |

## Bad export names, good serving names

| Export (bad) | What a stranger guesses | Served name (good) | Rule |
| --- | --- | --- | --- |
| `hc_monthly.hc` | ? | `ending_headcount` | R1 shape, no abbreviations |
| `hc_monthly.attrition` = 2.91 | Attrition for what period? Which base? | `attrition_rate_pct` with `leavers` and `starting_headcount` beside it | R1, R2 |
| `hc_monthly.dt` | Which day? | `month_start`; quarters use `period_start`, `period_end_exclusive` | R3 |
| `emp_master.term_flg` = `Y`/`N` | Terminated? Term date? Voluntary? | `voluntary_leavers` (a count) in the view; `is_voluntary_leaver` in core | R5, LINT-10 |
| `emp_master.dept` = `LGL` | ? | `department_name` = `Other departments` (merged, 5 or more) | R5 + privacy |

## The serving view

Full runnable file: [`sql/people_headcount.sql`](sql/people_headcount.sql). It also builds
`analytics.workforce_by_department_monthly` (levels and flows per month).

```sql
CREATE VIEW analytics.attrition_by_department_quarter AS
WITH q AS (
  SELECT date_trunc('quarter', d.month_start)::date                     AS period_start,
         d.department_name,
         (array_agg(d.starting_headcount ORDER BY d.month_start))[1]    AS starting_headcount, -- base: day before the quarter
         sum(d.leavers)::integer                                         AS leavers,
         sum(d.voluntary_leavers)::integer                               AS voluntary_leavers,
         count(*)                                                        AS months_in_period
  FROM core.department_months AS d            -- departments under 5 people already merged
  GROUP BY 1, 2
)
SELECT q.period_start,
       (q.period_start + interval '3 months')::date AS period_end_exclusive,
       q.department_name, q.starting_headcount, q.leavers, q.voluntary_leavers,
       round(100.0 * q.leavers / NULLIF(q.starting_headcount, 0), 1) AS attrition_rate_pct,  -- 0/0 -> NULL
       s.complete_through_month, s.data_loaded_at_utc, s.quality_status
FROM q
JOIN core.load_status AS s ON s.subject_area = 'workforce'
WHERE q.months_in_period = 3                                                  -- complete quarters only
  AND (q.period_start + interval '2 months')::date <= s.complete_through_month;
```

## Metric YAML

```yaml
metrics:
  - name: attrition_rate
    label: Attrition rate (starting base)
    description: Leavers in a complete period divided by headcount the day before it starts, in percent. Pool counts; never average rates.
    type: ratio
    relation: analytics.attrition_by_department_quarter
    numerator: leavers                         # leavers who were in the starting headcount
    denominator: starting_headcount            # employed the day before period_start; joiners excluded
    zero_denominator: "null"
    result_grain: one row per department and complete quarter; company = pooled sums
    valid_dimensions: [period_start, department_name]
    period_rule: Recompute from summed counts for any longer period or wider group.
    additivity: {class: non-additive, across_segments: recompute_from_components, time_rollup: recompute_from_components}
    unit: percent
    scale: 0-100
    precision: 1
    population: Employees on payroll the day before period_start. Contractors excluded.
    synonyms: [attrition, leaver rate]
    ambiguous_terms: [turnover]                # staff turnover, or revenue in British English: ask back
    reconciliation: starting_headcount + hires - leavers = ending_headcount (200 + 25 - 19 = 206)
    sensitivity: aggregate; minimum group size 5
    owner: people_analytics
    version: 1.0.0
    limitations: ["Not the average-headcount variant (9.34 %).", "Never average monthly or department rates."]
    # Counter-example: averaging the monthly export column (2.00, 2.91, 4.46) gives 3.12 %.
```

## Verified question

```yaml
  - id: HC-G01
    plane: db_check
    question: What was company-wide attrition in Q2 2026?
    expected_behavior: answer
    metric: attrition_rate
    relation: analytics.attrition_by_department_quarter
    truth_source: HR system leaver list, counted independently by people_analytics and finance
    evaluation_clock: "2026-07-01T09:00:00Z"
    sql: |
      SELECT sum(starting_headcount) AS starting_headcount, sum(leavers) AS leavers,
             round(100.0 * sum(leavers) / NULLIF(sum(starting_headcount), 0), 1) AS attrition_rate_pct
      FROM analytics.attrition_by_department_quarter
      WHERE period_start = DATE '2026-04-01' AND period_end_exclusive = DATE '2026-07-01'
    expected_rows:
      - {starting_headcount: 200, leavers: 19, attrition_rate_pct: 9.5}
    known_wrong_patterns:
      - {values: [3.12], cause: "average of monthly rates, reported as a quarterly rate"}
      - {values: [9.8], cause: "average of department rates with unequal bases"}
      - {values: [9.34], cause: "average-headcount base, a different (unapproved) metric"}
  - id: HC-R01
    plane: ai_run
    question: Who left the Legal team in Q2?
    expected_behavior: refuse
    reason: Person-level data and groups under 5 are outside the approved surface.
    query_must_not_execute: true
```

## What an AI plausibly answers from the export

Not recorded runs: the arithmetic a reader gets by trusting the export names. Use them as tests.

| Plausible answer | How it happens | Why it is wrong |
| --- | --- | --- |
| "Q2 attrition: 3.12 %." | `AVG(attrition)` over three monthly rows | The average of monthly rates is a monthly rate. It is reported as the quarter. Q2 is 19 ÷ 200 = 9.5 % |
| "Average headcount in Q2: 614." | `SUM(hc)` | Three month-end levels added |
| Any Legal-only figure, such as "Legal: 25 %". | Person rows grouped by `dept` | Legal has 4 people. With so few, one leaver is 25 %, and the figure points at a person. It is not a statistic |

## What works, what does not

| Works | Does not work | Why |
| --- | --- | --- |
| Write the base: "headcount the day before the period" | "Attrition = leavers ÷ headcount" | 9.5 % and 9.34 % are both defensible. Unwritten, the AI picks one silently |
| Ship `leavers` and `starting_headcount` beside the rate | Ship `attrition` alone | Nobody can pool a quarter or the company |
| Merge small groups in core before serving | Serve every department, suppress small rows in the report | The company total minus the other rows reveals the small group |
| Serve department-month counts only | Give the AI the employee table "to be flexible" | Names and exit reasons are one join away. Grants, not prompts, keep them out |
| Leavers counted from the starting base | Count every leaver, including Q2 hires who left in Q2 | The numerator then contains people the denominator never held. FOLDLINE's 4 of 48 is the mirror image: it put joiners in the denominator; this puts them in the numerator |

<details>
<summary>For builders</summary>

- Run it: `psql -X -d domain_packs -f domains/sql/people_headcount.sql`. It ends with
  `PEOPLE HEADCOUNT CHECKS PASS` and asserts the minimum group size (HC-P01).
- Naming lint: only LINT-02 on `*_headcount` columns (the heuristic wants a plural or a unit).
  Record the exception, or name them `ending_employees`.
- Owner assumption, written in the SQL file: none of the 25 Q2 hires left in Q2. If one does,
  add `leavers_from_starting_headcount` in core and use it as the numerator.
- Row-level security is the next step if managers may see only their own department. It does
  not replace the minimum group size.

</details>
