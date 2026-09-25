# Retail inventory: helmets at a bike shop

## In plain words

A bike shop counts its helmets at the end of every month. That count is a **level**: the water
in the bathtub at one moment. Deliveries in and sales out are the **change**. Sell-through is a
**rate**: helmets sold divided by the helmets the shop could have sold. The export gives an AI a
column called `qty`. The AI adds three month-end counts and reports "Q2 stock = 315". The
shop never held 315 helmets. On 30 June the shelf held 110.

FOLDLINE twin: ending MRR (a level) vs net new MRR (a change). The recorded run added changes as
if they were levels. Here the AI adds levels as if they were changes. Same bathtub, other side.

All data is synthetic. Stores: Harbour and Market. Clock: 2026-07-01 09:00 UTC. Q2 2026 is the
last complete quarter.

## The question

> Show helmets on hand at month end for each month of Q2 2026 at the Harbour store.

Decision it changes: how many helmets to reorder for July.

## Level, change, rate

| Shape | Harbour helmets, Q2 2026 | May I add it across months? |
| --- | --- | --- |
| Level: `ending_units_on_hand` | Mar 120 · Apr 110 · May 95 · Jun 110 | **Never.** 110 + 95 + 110 = 315 describes nothing |
| Change: `net_change_units` = received − sold + adjusted | Apr −10 · May −15 · Jun +15 = **−10** | Yes. Q2 received 180, sold 190, net −10 |
| Rate: `sell_through_pct` = sold ÷ (starting + received) | Q2: 190 ÷ (120 + 180) = **63.3 %** | Never. Recompute from counts. The average of the monthly rates is 37.6 % |

The identity is a test: **120 + 180 − 190 + 0 = 110.** Levels do add across stores at one moment:
Harbour 110 + Market 40 = 150 helmets on 30 June.

## The five boxes (QUESTION-CARD)

| Box | Filled in |
| --- | --- |
| 1. Question | Show helmets on hand at month end for each month of Q2 2026 at the Harbour store. |
| 2. Approved view | `analytics.inventory_by_store_category_monthly` |
| 3. Four blanks | Kind: month-end level (units). Rows: one per store, category and month. Months: Apr–Jun 2026, complete only. Table: the inventory view above. |
| 4. Boundary | The AI's login may SELECT this one view. It cannot see cost prices or supplier terms in core, so "margin by category" is refused. Database grants enforce this. |
| 5. Test | April = 110, May = 95, June = 110. "Q2 stock = 315" fails the test. |

## Bad export names, good serving names

| Export (bad) | What a stranger guesses | Served name (good) | Rule |
| --- | --- | --- | --- |
| `inv_export.qty` | A quantity sold? ordered? | `ending_units_on_hand` | R1 shape, R2 unit |
| `inv_export.ts` (timestamp, no zone) | An event time | `month_start` (date) | R3 time |
| `inv_export.loc` = `HBR` | Location of what? | `store_name` = `Harbour` | R5 words |
| `inv_export.cat` = `HLM` | ? | `category_name` = `Helmets` | R5 words |
| `stock_moves.qty` with `type` `R`/`S` | A signed change | `received_units`, `sold_units` (both positive) | R1, R5 |
| table `inv_export` | "Inventory, exported" | `inventory_by_store_category_monthly` | R4 grain in the name |

## The serving view

Full runnable file: [`sql/retail_inventory.sql`](sql/retail_inventory.sql) (core table,
comments, checks). The view:

```sql
CREATE VIEW analytics.inventory_by_store_category_monthly AS
SELECT
  m.month_start,
  m.store_name,
  m.category_name,
  m.starting_units_on_hand,                                        -- level
  m.received_units,                                                -- change
  m.sold_units,                                                    -- change, stored positive
  m.adjusted_units,                                                -- change, signed count correction
  m.received_units - m.sold_units + m.adjusted_units AS net_change_units,
  m.ending_units_on_hand,                                          -- level
  m.starting_units_on_hand + m.received_units        AS available_units,   -- rate denominator
  round(100.0 * m.sold_units
        / NULLIF(m.starting_units_on_hand + m.received_units, 0), 1) AS sell_through_pct,
  s.complete_through_month, s.data_loaded_at_utc, s.quality_status        -- data state
FROM core.stock_months AS m
JOIN core.load_status  AS s ON s.subject_area = 'inventory'
WHERE m.month_start <= s.complete_through_month;                          -- complete months only
```

`core.stock_months` carries the bathtub identity as a `CHECK` constraint, so a load that breaks
it fails before anyone reads it.

## Metric YAML

```yaml
metrics:
  - name: ending_units_on_hand
    label: Units on hand at month end
    description: Units on the shelf at the last instant of a complete month, one row per store, category and month. Never add it across months.
    type: snapshot
    relation: analytics.inventory_by_store_category_monthly
    expression: ending_units_on_hand
    result_grain: one row per store, category and complete calendar month
    valid_dimensions: [month_start, store_name, category_name]
    period_rule: For a quarter, return each month-end (three rows), or the last month-end if one number is asked. Never sum.
    completeness: month_start <= complete_through_month
    additivity: {class: semi-additive, across_segments: sum, across_time: none, time_rollup: last_value}
    unit: units
    synonyms: [closing stock, stock on hand at month end]
    ambiguous_terms: [stock, inventory]        # could mean on hand, received or value in EUR: ask back
    reconciliation: "starting + received - sold + adjusted = ending (Harbour Q2: 120 + 180 - 190 + 0 = 110)"
    owner: store_operations
    version: 1.0.0
    limitations: ["Units, not EUR value.", "Never add month-ends."]
    # Counter-example: "Q2 stock = 315" (110 + 95 + 110).

  - name: sell_through_rate
    label: Sell-through
    type: ratio
    relation: analytics.inventory_by_store_category_monthly
    numerator: sold_units                      # summed over the period
    denominator: available_units               # starting on hand of the FIRST month + received in the period
    zero_denominator: "null"
    additivity: {class: non-additive, time_rollup: recompute_from_components}
    unit: percent
    scale: 0-100
    precision: 1
    owner: store_operations
    version: 1.0.0
    # Counter-example: averaging April 35.3, May 38.7, June 38.9 gives 37.6 %. Q2 is 190 / 300 = 63.3 %.
```

## Verified question

```yaml
  - id: INV-G01
    plane: db_check
    question: Show helmets on hand at month end for each month of Q2 2026 at the Harbour store.
    expected_behavior: answer
    metric: ending_units_on_hand
    relation: analytics.inventory_by_store_category_monthly
    truth_source: shop stock count sheets, checked by a second person
    evaluation_clock: "2026-07-01T09:00:00Z"
    sql: |
      SELECT month_start, ending_units_on_hand
      FROM analytics.inventory_by_store_category_monthly
      WHERE store_name = 'Harbour' AND category_name = 'Helmets'
        AND month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
      ORDER BY month_start
    expected_rows:
      - {month_start: 2026-04-01, ending_units_on_hand: 110}
      - {month_start: 2026-05-01, ending_units_on_hand: 95}
      - {month_start: 2026-06-01, ending_units_on_hand: 110}
    known_wrong_patterns:
      - {values: [315], cause: "month-end levels added"}
      - {values: [370], cause: "receipts and sales both positive in stock_moves, then summed"}
```

## What an AI plausibly answers from the export

These wrong answers were not recorded from an AI run. They are what the arithmetic gives if a
reader takes the export names at face value. Use them as test cases, not as evidence.

| Plausible answer | How it happens | Why it is wrong |
| --- | --- | --- |
| "Q2 helmet stock: 315." | `SUM(qty)` over three `inv_export` rows | `qty` is a level. Three month-end counts added are no count at all |
| "Net stock movement in Q2: +370." | `SUM(qty)` over `stock_moves` | Sales are stored positive with `type = 'S'`. The net change is 180 − 190 = −10 |
| "Q2 sell-through: 37.6 %." | Average of three monthly rates | Each monthly rate has its own base. Recompute: 190 ÷ 300 = 63.3 % |

## What works, what does not

| Works | Does not work | Why |
| --- | --- | --- |
| Serve the level and the change side by side | Serve only `qty` and let readers guess | A reader cannot tell a count from a flow |
| Store sales positive in `sold_units`; the sign lives in the formula | One signed `qty` column with a type code | One forgotten `WHERE type = 'S'` flips the answer |
| Ship `sold_units` and `available_units` next to `sell_through_pct` | Ship the rate alone | Nobody can recompute a quarter |
| `CHECK` the bathtub identity in core | Trust the export to balance | A stock-count correction silently breaks every level after it |
| List "stock" under `ambiguous_terms` and ask back | Map "stock" to on-hand units | "Stock value" in EUR is a different metric |

<details>
<summary>For builders</summary>

- Run it: `createdb domain_packs`, then `psql -X -d domain_packs -f domains/sql/retail_inventory.sql`.
  The file ends with `RETAIL INVENTORY CHECKS PASS`, or it raises an exception.
- Naming lint (`naming/lint_names.sql`) on this view: no findings except LINT-02 on
  `starting_units_on_hand` and `ending_units_on_hand`. That heuristic only knows plural counts and
  unit suffixes. Record it as an accepted exception, or rename to `ending_on_hand_units`.
- Average inventory (for turnover) is a legitimate metric. Name it `average_units_on_hand` and
  write its formula (mean of the month-ends, or of daily counts). It is still never a sum.
- Value in EUR needs a cost price and a valuation rule (FIFO, average cost). Until the owner
  writes one, refuse "stock value".

</details>
