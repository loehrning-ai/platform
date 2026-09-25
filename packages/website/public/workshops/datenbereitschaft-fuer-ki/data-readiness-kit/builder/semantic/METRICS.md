# Defining metrics: level, change, rate

## In plain words

Picture a bathtub.

- The **level** is how much water is in the tub at one moment. FOLDLINE's ending MRR on 30 June
  2026 is **€387,015**. That is a level.
- The **change** is what flowed in or out during a period. June's net new MRR is **+€42,565**.
  That is a change.
- The last level plus the change gives the new level: **€354,635 + €32,380 = €387,015**
  (end of March, plus Q2's net new, gives end of June).

A **rate** compares two counts: 4 of 40 accounts left = **10 %**.

Ask three questions about every number before anyone adds, averages or charts it:

1. **Is it a level, a change or a rate?**
2. **Can I add it, and across what?** (segments, months, accounts)
3. **What is the base?** (for a rate or an average: divided by what, counted when?)

The recorded AI run failed question 1. It treated each month's change as the month-end level and
reported **−€19,960 / €9,775 / €42,565**. Ending MRR cannot be negative here.

---

## The shapes

| Shape | What it is | FOLDLINE example | Another domain | Kit `type` |
| --- | --- | --- | --- | --- |
| Level (snapshot) | Amount at one instant | Ending MRR, 30 Jun 2026: €387,015 | Helmets on hand at month end: 110 | `snapshot` |
| Change (movement) | Amount that moved during a period | Net new MRR, June: +€42,565 | Helmets received minus sold | `movement` |
| Rate (ratio) | Numerator ÷ denominator | Logo churn: 4 of 40 = 10.0 % | Web conversion: 480 orders ÷ 21,000 sessions | `ratio` |
| Distinct count | Number of different things | Active accounts, end of June: 132 | Unique visitors: 1,450 | `distinct_count` |
| Average | A sum ÷ a count | €387,015 ÷ 132 = €2,931.93 per active account | Average handling time per ticket | `average` |
| Percentile / median | The middle (or 90th) value | Not served in FOLDLINE | Support: median time to close | not in this kit |

---

## Additivity: what you may add

Three words cover almost every case.

- **Additive**: you may add it along every axis. Changes are additive.
- **Semi-additive**: you may add it across things (accounts, segments), but **not across time**.
  Levels are semi-additive.
- **Non-additive**: you may not add it at all. Rates, averages and distinct counts are
  non-additive. You recompute them from their parts.

### The grid

| Shape | Across segments | Across months | Into one quarter figure |
| --- | --- | --- | --- |
| Level: ending MRR | Yes. Each account is in one segment | **No.** 334,675 + 344,450 + 387,015 = **1,066,140**, which describes nothing | Return three rows, or the last month-end (387,015) |
| Change: net new MRR | Yes | Yes, inside complete periods | Sum: −19,960 + 9,775 + 42,565 = **32,380** |
| Rate: logo churn | **Recompute**: 12 of 120 = 10.0 % | **Recompute** from the longer period's own base | Recompute; never average or add |
| Distinct count: active accounts | Yes: 44 + 44 + 44 = 132 | **No**: 123 + 123 + 132 = 378 account-months | Count distinct at account grain: 141 |
| Average: MRR per active account | **Recompute** from sums | **Recompute** | Owner's written rule (FOLDLINE: last month-end, €2,931.93) |

### Three FOLDLINE mistakes, one per shape confusion

| Mistake | Arithmetic | What it confused |
| --- | --- | --- |
| Change read as a level (recorded AI run) | April "ending MRR" = −19,960 | A change used where a level was asked |
| Levels added across months | 334,675 + 344,450 + 387,015 = 1,066,140 | A semi-additive level added over time |
| Changes subtracted as if they were levels (recorded export-lane run) | 42,565 − 60,160 = −17,595 | "Net new for the quarter" computed as level(end) − level(start), but with changes |

The correct quarter figure uses the identity in either direction:

- Sum of changes: −19,960 + 9,775 + 42,565 = **32,380**
- Difference of levels: 387,015 − 354,635 = **32,380**

---

## The identity as a rule and a test

Write the identity down in `metric.yml` (`reconciliation`) and test it (case Q02).

| Identity | FOLDLINE numbers | Test |
| --- | --- | --- |
| last level + change = new level | 354,635 + 32,380 = 387,015 | Q02 checks every month, not only Q2 |
| Month by month from the demo fill | 258,785 + 14,210 + 21,480 + 60,160 − 19,960 = 334,675 (Dec 2025 to Apr 2026) | Q02 |
| start − left + joined = end (accounts) | 40 − 4 + 8 = 44 per segment | Q04 |
| sum of accounts = company | sum of 144 account rows = ending MRR, every month | Q05 |

**A missing opening level breaks the identity.** In a dry run, a different Claude chat did not
repeat the recorded mistake. It correctly read `amount` as a monthly change, then added the
changes from January and labelled the result "Ending MRR": **75,890 / 85,665 / 128,230**. It
warned that the opening balance was missing. The true values are 258,785 higher (the end of
December 2025). That was one run per prompt: an observation, not a benchmark. The lesson: a
better AI route moves the failure. It does not remove it. Only a served level
(`ending_mrr_eur`) removes the need to reconstruct one.

---

## Rates

### Pooled, not averaged

A rate for a group is **total numerator ÷ total denominator**. It is never the average of the
sub-group rates.

**FOLDLINE is right by luck.** Every segment has 40 starting accounts. So the average of three
10 % rates (10 %) equals the pooled rate (12 of 120 = 10 %). Change one base and they split.

**Web shop, where it goes wrong:**

| Channel | Orders | Sessions | Rate |
| --- | --- | --- | --- |
| Search | 400 | 20,000 | 2.00 % |
| Email | 80 | 1,000 | 8.00 % |
| Average of the two rates | | | **5.00 %** (wrong) |
| Pooled | 480 | 21,000 | **2.29 %** (right) |

The average treats 1,000 email sessions as if they weighed as much as 20,000 search sessions.
Ship `orders` and `sessions` next to the rate so any reader can pool them.

### The denominator decides the number

| Base | Churned | Rate | Verdict |
| --- | --- | --- | --- |
| Accounts active at the end of March (40 per segment) | 4 | **10.0 %** | Right: the written population |
| Every row in `customer_master` (48 per segment, including 8 who joined in Q2) | 4 | **8.33 %** | Wrong: the deck's fixed export-lane database check (replay data, not on a slide). The recorded AI run found 0 of 0. Joiners cannot churn out of a base they were never in |
| Rows where `status = 'active'` (the table stored `A`) | 0 | "0 of 0" | Not a rate at all |

### Zero rule

**0 ÷ 0 is null, never 0 %.** An answer of "0 % churn" claims nobody left. "No rate: the base is
empty" says the question could not be answered. Write `zero_denominator: "null"` and use
`nullif(denominator, 0)` in SQL.

### Averages are rates too

MRR per active account is €387,015 ÷ 132 = **€2,931.93** at the end of June. The traps:

| Calculation | Result | Why it is wrong or right |
| --- | --- | --- |
| June: 387,015 ÷ 132 | €2,931.93 | Right: numerator and denominator at the same instant |
| June: 387,015 ÷ 144 | €2,687.60 | Wrong base: counts churned and not-yet-started accounts as paying 0 |
| Mean of monthly averages: (2,720.93 + 2,800.41 + 2,931.93) ÷ 3 | €2,817.76 | Average of averages. It is not the owner's rule: for one quarter figure the owner chose the last month-end, June, €2,931.93. It also sits close to 2,820.48 (sum of levels ÷ account-months), which only means "average per account-month" and nothing else. Both are close only because the monthly counts are similar |
| Sum of Q2 levels ÷ distinct Q2 accounts: 1,066,140 ÷ 141 | €7,561.28 | Mixed shapes: a meaningless sum over a different window. 2.6 times the June value, and it looks precise |

---

## Period rules

Clock: **2026-07-01 09:00 UTC**. Last complete quarter: **2026-04-01 (inclusive) to 2026-07-01
(exclusive)**, written as `period_start` and `period_end_exclusive`. Q3 is not finished.

| Question about Q2 | Shape | Period rule | FOLDLINE answer |
| --- | --- | --- | --- |
| Ending MRR by month | Level | Each complete month-end; never add | 334,675 / 344,450 / 387,015 |
| Ending MRR for the quarter, one number | Level | Last month-end, and say so | 387,015 |
| Net new MRR | Change | Sum the complete months | 32,380 |
| Logo churn by segment | Rate | Recompute from the quarter's own base and count | 4 of 40 = 10.0 % each |
| Active accounts at quarter end | Distinct count | Last month-end | 132 |
| Distinct accounts active at any Q2 month-end | Distinct count | Count distinct at account grain | 141 |

Two more rules:

- **Complete periods only.** Serve `month_start <= complete_through_month`. A July figure on
  1 July is a partial month; `subscription_export` holding June only is the same trap.
- **Half-open ranges.** `period_start <= t < period_end_exclusive` has no gaps and no double
  counting at the boundary. "BETWEEN 1 April AND 30 June" breaks on timestamps after 00:00 on
  30 June.

---

## The five FOLDLINE metrics in plain words

| Metric | Plain words | Shape | View | Q2 2026 truth |
| --- | --- | --- | --- | --- |
| `ending_mrr` | Recurring monthly value active on the last day of the month | Level | `analytics.mrr_summary_monthly` | 334,675 / 344,450 / 387,015 |
| `net_new_mrr` | How much MRR grew or shrank during the month | Change | `analytics.mrr_summary_monthly` | −19,960 / 9,775 / 42,565; quarter 32,380 |
| `logo_churn_rate` | Share of starting accounts that left during the quarter | Rate | `analytics.logo_churn_by_segment_quarter` | 10.0 % per segment (4 of 40) |
| `expansion_mrr` | Extra MRR from existing accounts that grew | Change | `analytics.expansion_mrr_by_country_monthly` | CH 1,990 highest, GB 705 lowest; total 12,895 |
| `account_ending_mrr` | The same level, per pseudonymous account | Level | `analytics.account_mrr_monthly` | fl_0006 is highest in June: 7,705 |

Two teaching examples add the remaining shapes: `active_accounts` (distinct count) and
`avg_mrr_per_active_account` (average). Both are in `metric.yml` with `status: example`.

---

## Governance: owner, version, synonyms, proxies

**Owner.** A team, not a person: `revenue_analytics`. The owner approves every change and
answers escalations (for example "the data is 60 hours old, do we block?").

**Versioning.** Use three numbers, MAJOR.MINOR.PATCH.

| Bump | When | FOLDLINE example | Effect on receipts |
| --- | --- | --- | --- |
| Patch 1.0.0 → 1.0.1 | Wording only | Clearer description | Keep receipts |
| Minor 1.0.0 → 1.1.0 | New synonym, new allowed dimension | Add `country_code` to ending MRR | Re-run the affected cases |
| Major 1.0.0 → 2.0.0 | Formula, population, grain or period rule changes | Exclude trial accounts from MRR | **Every receipt is invalid.** Re-run everything; keep 1.x served until consumers move |

**Synonyms and ambiguous terms are different lists.**

- `synonyms`: words that mean exactly this metric. Answer directly. ("closing MRR" → ending_mrr)
- `ambiguous_terms`: words that could mean this metric *or another*. Ask back. Bare "MRR" and
  "revenue" trigger C01: *"Specify the MRR meaning: ending MRR, net-new MRR, or an MRR movement
  component."*

**Proxies.** If a metric is not defined, refuse (R01: profit). Use a proxy only if the user asks
for a **labelled** proxy **and** the policy lists that proxy. FOLDLINE's policy lists none. MRR is
not a profit proxy.

---

## What works and what does not

| What works | What does not | Why the second one fails (FOLDLINE) |
| --- | --- | --- |
| Name the shape in the column: `ending_mrr_eur`, `net_new_mrr_eur` | `amount` | The recorded run read a change as a level: −19,960 |
| Return three month-end rows for a quarter | Add the month-ends | 1,066,140 describes nothing |
| Quarter change = sum of monthly changes, or level(end) − level(start) | Change(end) − change(start) | −17,595 instead of 32,380 |
| Serve the level | Rebuild the level from changes | Dry run: 75,890 / 85,665 / 128,230, missing an opening balance of 258,785 |
| Write the base: active at the end of the prior month | "All customers" | 4 of 48 = 8.33 % instead of 10.0 % |
| Pool rates: sum numerators ÷ sum denominators | Average the rates | Web shop 5.00 % instead of 2.29 % |
| 0 ÷ 0 = null, "no rate" | 0 % | Claims nobody left when nothing was measured |
| Readable status values: `active`, `churned`, `new` | `A`, `C`, `N` | Searched 'active', found 0 of 0 |
| A version on every definition, cited in every trace | An unversioned wiki page | Nobody can tell which definition produced an answer; cited 0 of 3 |
| Refuse an undefined metric | Answer with a proxy | Profit by plan from MRR silently changes the question |
