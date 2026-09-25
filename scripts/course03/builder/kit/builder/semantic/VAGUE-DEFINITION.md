# Counter-example: a vague metric definition, field by field

## In plain words

A definition can exist and still fail. If a field is vague, the reader (a person, a test or
Claude) fills the gap with a guess. Each guess below produced a real wrong FOLDLINE answer.

Read the vague version first. Then read the table: every vague field, the guess it allowed, and
the number that came out.

---

## The vague version (do not copy)

```yaml
# COUNTER-EXAMPLE. Every line here is valid YAML. Almost every line is a trap.
metrics:
  - name: mrr                      # 1. Which MRR? Ending, net new, or a component?
    label: MRR
    description: Monthly revenue.  # 2. "Revenue" is not MRR. No shape, no unit, no "never".
    type: sum                      # 3. How to aggregate, not what kind of number it is.
    model: monthly_revenue         # 4. Unqualified (no schema), and it names the export table.
    expression: amount             # 5. A generic column name that hides "this is a change".
    result_grain: monthly          # 6. Fine on a view keyed by month; this table is per segment AND month.
    period_rule: last quarter      # 7. Which quarter? Complete or not? Rows or one total?
    population: all customers      # 8. Including the 8 per segment who joined during Q2?
    status_filter: active          # 9. The table stores A, C and N. 'active' matches nothing.
    unit: currency                 # 10. Which currency? Whole euros or cents?
    owner: data team               # 11. Nobody in particular approves a change.
    version: latest                # 12. A trace cannot cite "latest"; it changes under you.
    freshness: daily               # 13. Warn? Block? Measured against which clock?
    limitations: []                # 14. Nothing says "not profit" or "never add months".
```

---

## What each vague field caused

| # | Vague field | The guess it allowed | FOLDLINE result | The fix (from `metric.yml`) |
| --- | --- | --- | --- | --- |
| 1 | `name: mrr` | "MRR" means whatever the reader expects | "How much MRR?" answered without asking back (lab: "Answered “How much MRR?” without asking which MRR was meant.") | Separate names `ending_mrr`, `net_new_mrr`; `ambiguous_terms: [mrr, revenue]` triggers C01 |
| 2 | `description: Monthly revenue.` | Recognised revenue, invoices or MRR | Profit and revenue questions look answerable | One sentence with shape, unit, grain and one "never"; limitation "Not revenue, cash collected, ARR or profit" |
| 3 | `type: sum` | Summing is always allowed | Month-end levels added: 1,066,140 | `type: snapshot` plus `additivity.across_time: none` |
| 4 | `model: monthly_revenue` | The export table is approved | The recorded run picked `monthly_revenue` | Keep the key, fix the value: `model: analytics.mrr_summary_monthly` (schema-qualified, the approved view). `metric.yml` in this kit calls the same field `relation` |
| 5 | `expression: amount` | `amount` is a balance | −19,960 / 9,775 / 42,565 labelled "ending MRR" | `expression: ending_mrr_eur`; the change lives in `net_new_mrr_eur` |
| 6 | `result_grain: monthly` on `monthly_revenue` | Rows per segment are fine | The export table's grain is mixed: one row per segment **and** month, while the line says only "monthly". The recorded run silently summed the segments per `dt` | On a view whose key is `month_start`, `result_grain: monthly` is exactly what the deck's contract uses. The trap is the table, not the word. This kit spells it out: `one row per complete calendar month` |
| 7 | `period_rule: last quarter` | Q3 (in progress), or one quarter total | A partial month, or one summed number | "Each complete month-end (three rows); never sum across months"; `completeness: month_start <= complete_through_month` |
| 8 | `population: all customers` | New joiners are in the churn base | 4 of 48 = 8.33 %: the deck's fixed export-lane database check (replay data, not on a slide). The recorded AI run found 0 of 0 | "Accounts active at the end of the month before period_start; joiners are not in the base" |
| 9 | `status_filter: active` | The table says 'active' | 0 of 0, "no rate" | Readable values decoded in core: `active`, `churned`, `new`; `zero_denominator: "null"` |
| 10 | `unit: currency` | Any currency, any scale | Cents shown as euros would be 100 times too large (not observed in FOLDLINE; a common trap) | `unit: EUR`, `precision: 0`, column suffix `_eur` |
| 11 | `owner: data team` | Anyone may change it | The 60-hour case has no one to escalate to, so a reader is tempted to invent a block rule (a risk, not a recorded run) | `owner: revenue_analytics` (a named team) |
| 12 | `version: latest` | Receipts stay valid after a change | Old tests "pass" against a new meaning | `version: 1.0.0`; a major bump invalidates every receipt |
| 13 | `freshness: daily` | Hide the age, or block at 24 h | A 60-hour snapshot returned with no warning (lab: "Hide the data's age") | `warn_after_hours: 36`, `hard_expiry_hours: null`, stated evaluation clock |
| 14 | `limitations: []` | Everything not forbidden is fine | MRR used as a profit proxy | "Never sum ending MRR across months"; "Not revenue, cash collected, ARR or profit" |

---

## The dry-run twist

In a later dry run, a different Claude chat got field 5 right on its own. It noticed April was
negative, concluded that `amount` is a change, and said so. It then filled field 7 and the
missing opening balance with a guess: it added the changes from January and labelled the result
"Ending MRR" (75,890 / 85,665 / 128,230), with a caveat. The true values are 258,785 higher.

A better AI route moved the failure from field 5 to the missing level. It did not remove it.
One run per prompt: an observation, not a benchmark.

---

## Check your own definition in two minutes

Read each field aloud and ask: **"Could a stranger guess two different things from this?"**

| If the field says... | Replace it with... |
| --- | --- |
| A bare business word (MRR, revenue, churn, customers) | A specific name plus `ambiguous_terms` |
| `sum`, `count`, `avg` as the type | `snapshot`, `movement`, `ratio`, `distinct_count` or `average`, plus `additivity` |
| A table name without a schema | `<schema>.<view>`, whatever the key is called (`model:` in the course template, `relation:` in this kit) |
| `amount`, `value`, `dt`, `status` | A column name with shape and unit (`ending_mrr_eur`, `month_start`, `account_status`) |
| `monthly`, `daily` as the grain on a table with more keys than the period (segment, account) | The grain that matches the key, or "one row per <thing> per <period>" |
| "last quarter", "recent" | Complete periods, half-open dates, and rows-or-total |
| "all customers" as a base | Who is in, who is out, counted at which instant |
| A team alias or a person's name as owner | A named team that approves changes |
| `latest` as version | MAJOR.MINOR.PATCH |
| Empty `limitations` | At least one "not" and one "never" |
