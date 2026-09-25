# Field reference

## In plain words

You do not need every field on day one. Start with the six starter fields. They answer the four
blanks plus "in what unit?" and "who decides?".

| Starter field | Plain question it answers | FOLDLINE `ending_mrr` |
| --- | --- | --- |
| `type` | Kind of number? | `snapshot` (a level) |
| `result_grain` | Rows per what? | one row per complete calendar month |
| `period_rule` | Which months, and may I add them? | each complete month-end; never sum across months |
| `relation` | Which table? | `analytics.mrr_summary_monthly` |
| `unit` | Measured in what? | `EUR` |
| `owner` | Who approves a change? | `revenue_analytics` |

Everything else makes those six testable, or stops them drifting.

---

## Metric fields (`metric.yml`)

Deck column: the name the workshop appendix used for the same idea ("The full ending MRR
contract"). The kit keeps its own names; this column resolves the difference.
Product column: the nearest concept, not exact syntax. Verify against current product docs.

| Field | Plain meaning | FOLDLINE value | Read by | Deck appendix name | Nearest product concept |
| --- | --- | --- | --- | --- | --- |
| `name` | Stable ID cited in every trace | `ending_mrr` | all | `slug` | MetricFlow metric name; Cube member name |
| `label` | Display name | Ending MRR | people, charts | (visible title) | label / title |
| `description` | One sentence: shape, unit, grain, one "never" | "... Never add it across months." | people, Claude, catalog | (notes) | description |
| `type` (starter) | Kind of number: `snapshot`, `movement`, `ratio`, `distinct_count`, `average` | `snapshot` | tests, Claude | `aggregation: snapshot` | MetricFlow metric type + measure agg; Cube measure type |
| `relation` (starter) | Schema-qualified approved view | `analytics.mrr_summary_monthly` | Claude, tests | `model` | semantic model / cube |
| `expression` | Column or formula in that view | `ending_mrr_eur` | tests, Claude | (implied) | measure expr / sql |
| `formula` | Written-out arithmetic for a derived number | `new + expansion - contraction - churned` | people | (visible on the failure slide) | derived metric expression |
| `numerator`, `denominator` | Parts of a ratio or average | `churned_accounts`, `starting_accounts` | tests, Claude | (not shown) | ratio metric numerator / denominator |
| `result_grain` (starter) | What one output row stands for | one row per complete calendar month | tests, Claude | `result_grain: monthly` | time granularity + entities |
| `valid_dimensions` | Breakdowns allowed | `[month_start]` | Claude | (not shown) | dimensions |
| `allowed_values` | Legal values of a dimension | `country_code: [AT, CH, ...]` | tests | (not shown) | (accepted values tests) |
| `period_rule` (starter) | How a period becomes rows; what may be added | three month-ends; never sum | Claude, tests | `time_behavior.period_rule: end_of_period` | non-additive dimension (MetricFlow) |
| `completeness` | Which periods are answerable | `month_start <= complete_through_month` | Claude, tests | "complete through June 2026" | (freshness / completeness checks) |
| `additivity` | Where it may be added: `class`, `across_segments`, `across_time`, `time_rollup` | semi-additive; `across_time: none`; `last_value` | Claude, tests | `limitations: [Never sum ...]` | non_additive_dimension; rollup type |
| `zero_denominator` | What 0 ÷ 0 returns | `"null"` | Claude, tests | (notes: "0/0 is not 0%") | (none; write it) |
| `unit` (starter) | Currency or unit | `EUR`, `percent`, `accounts` | all | `unit: EUR` | format / meta |
| `scale` | Range of a percent | `0-100` | Claude | (not shown) | format |
| `precision` | Decimals shown | `0` (EUR), `1` (percent) | people | (not shown) | format |
| `population` | Who is counted, at which instant | "Accounts active at the end of the prior month" | people, Claude | (not shown) | filters |
| `inclusions`, `exclusions` | What is inside or outside | "Setup fees" excluded | people, Claude | (not shown) | filters / description |
| `synonyms` | Words that mean exactly this | `closing mrr` | Claude | (not shown) | synonyms (Snowflake semantic views) |
| `ambiguous_terms` | Words that could mean this or another metric: ask back | `[mrr, revenue]` | Claude | C01 rule `bare_mrr` | (none; write it) |
| `reconciliation` | Identity a test checks | 354,635 + 32,380 = 387,015 | tests | (visible on failure slide) | tests |
| `owner` (starter) | Team that approves changes | `revenue_analytics` | people | `owner: revenue_analytics` | owner / meta |
| `version` | MAJOR.MINOR.PATCH of the definition | `1.0.0` | all; cited in trace | (compiled checksums) | (your own convention) |
| `status` | `approved`, `draft`, `example`, `deprecated` | `approved` | Claude, policy | (not shown) | (your own convention) |
| `verified_questions` | Case IDs that prove it | `[G01, F00, F01]` | tests | appendix-evaluation IDs | saved queries / verified queries |
| `limitations` | What it is not; one "never" | "Not revenue, cash collected, ARR or profit." | people, Claude | `limitations` | description |
| `sensitivity`, `max_rows` | Privacy class and row limit for detail | pseudonymous; 1000 | Claude, hook | "account_key is ... pseudonymous, not anonymous" | access policy |
| `freshness` (in model) | Warn threshold and block rules | `warn_after_hours: 36` | Claude, tests | `freshness_sla_hours: 36` | freshness checks |

## Model fields (`model.yml`)

| Field | Plain meaning | FOLDLINE example |
| --- | --- | --- |
| `relation` | What SQL writes, schema included | `analytics.logo_churn_by_segment_quarter` |
| `contract_version` | Version of the table's shape; bump on any column or grain change | `1.0.0` |
| `grain`, `primary_key` | Rows per what; which columns make a row unique | `[period_start, customer_segment]` |
| `expected_row_count` | A cheap test that the grain is dense | `2592` for account-months |
| `time` | Time column, type, time zone, completeness rule; `end_column` for half-open periods | `period_end_exclusive` |
| `dimensions` | Columns you group or filter by, with `allowed_values` | `customer_segment: [Enterprise, Mid-Market, SMB]` |
| `measures` | Numbers, each with `unit`, `additivity`, `metric` | `ending_mrr_eur`, semi-additive |
| `data_state` | The three columns on every view | `complete_through_month`, `data_loaded_at_utc`, `quality_status` |
| `freshness` | `warn_after_hours`, `hard_expiry_hours`, `block_when` | 36, null, two written rules |
| `lineage` | Real upstream relations and sources | `core.account_months` ← `source.billing_account_mrr` |
| `quality` | Named tests: unique, accepted values, expressions, row counts | `bathtub_identity` |
| `sensitivity` | Aggregate, pseudonymous or identifying; row limit | `pseudonymous`, `max_rows: 1000` |

## Policy fields (`policy.yml`)

| Field | Plain meaning | Backed by |
| --- | --- | --- |
| `identity` | The login the AI uses | database |
| `allow` | Schemas, relations and metrics that are in scope (an allowlist) | database + guides |
| `deny` | Written reminder of what is out of scope | database (nothing granted) + guides |
| `execution` | Row limit, timeout, single statement, qualified names | guardrail: database defaults + application |
| `behavior.clarify` / `refuse` | Stop before any SQL, with the exact message | guides (+ optional hook for identifiers) |
| `behavior.freshness` | Warn vs block, against a stated clock | guides |
| `behavior.trace` | What every answer must cite | guides; graded in ai_run |
| `enforcement` | Which file backs which rule | documentation |

## Verified-question fields (`verified-questions.yml`)

| Field | Plain meaning |
| --- | --- |
| `id`, `plane` | A case is identified by both. `db_check` tests the database; `ai_run` tests Claude |
| `expected_behavior` | `answer`, `clarify`, `refuse`, `database_deny`, `database_error` |
| `sql` | Fixed SQL for db_check cases (the deck's fixedSql where one exists) |
| `expected_rows` / `expected_sqlstate` | The truth, written before the run |
| `truth_source` | Where the truth came from; never the AI under test |
| `evaluation_clock` | Frozen clock for the case |
| `required_trace`, `grade`, `runs_required` | What an AI answer must show, how it is graded, how often it runs |
| `query_must_not_execute` | For clarify and refuse: no SQL may run |

---

## Synonyms vs ambiguous terms

| Word in the question | List it under | What Claude does | Example |
| --- | --- | --- | --- |
| Means exactly one metric | `synonyms` | Answers | "closing MRR" → `ending_mrr` |
| Could mean two or more metrics | `ambiguous_terms` | Asks back once (C01) | "MRR", "revenue", "churn" |
| Means a metric that is not defined | nothing; the policy refuses | Refuses (R01) | "profit", "LTV" |

Counter-example: putting "MRR" under `synonyms` of `ending_mrr`. Then "How much MRR did we add in
Q2?" returns a level (387,015) when a change (32,380) was asked.

---

## Checklist: adding a sixth metric

1. Write the question and its owner. Get the owner to agree in writing.
2. Fill the four blanks. If any blank says "it depends", split it into two metrics.
3. Pick the shape. Write `additivity` for segments, time and the quarter rollup.
4. For a rate or average: write `numerator`, `denominator`, `population` and `zero_denominator`.
   Serve both parts in the view.
5. Check the view has the grain the question needs. If not, the view comes first (`../warehouse/SERVING-VIEWS.md`).
6. Add the metric to `policy.yml` `allow.metrics`. A metric not listed is refused.
7. Write at least one db_check case with expected rows computed by two people, and one ai_run case.
8. Add synonyms and ambiguous terms. Add a clarify case for each ambiguous term.
9. Compile by hand into each reader's file (full table: `SEMANTIC-LAYER.md`, "Compile"):
   Claude Project: `../claude/project/metric-definitions.md`; Claude Code: the Agent Skill's
   `../claude/skills/foldline-analytics/references/metrics.md` (copied to
   `.claude/skills/foldline-analytics/`) and `../claude/CLAUDE.example.md`; the database connector (Setup C)
   reads the same Skill; people: `COMMENT ON` in `40_analytics.sql`. Formats: `../claude/README.md`.
10. Run all cases. A new metric is a minor version bump for the file's consumers.

---

## Blank skeletons

Copy one. Replace every `# Ask your owner:` line with an answer before the metric is used.

### Level (snapshot)

```yaml
  - name:                         # Ask your owner: what exact name will every trace cite?
    label:
    description: >-               # Ask your owner: one sentence with shape, unit, grain and one "never".
    type: snapshot
    relation:                     # Ask your owner: which approved view, schema included?
    expression:                   # Column ending in its unit, e.g. _eur, _units.
    result_grain:                 # Ask your owner: one row per what per which period?
    valid_dimensions: []
    period_rule: >-               # Ask your owner: for a longer period, all period-ends, or the last one?
    completeness:                 # e.g. month_start <= complete_through_month
    additivity:
      class: semi-additive
      across_segments: sum        # Ask your owner: is every thing in exactly one segment?
      across_time: none
      time_rollup: last_value
    unit:
    precision:
    population:                   # Ask your owner: what is counted, at which instant?
    synonyms: []
    ambiguous_terms: []
    reconciliation:               # previous level + change = level
    owner:
    version: 1.0.0
    status: draft
    limitations: []               # Ask your owner: at least one "not" and one "never".
```

### Change (movement)

```yaml
  - name:
    label:
    description: >-
    type: movement
    relation:
    expression:                   # Ask your owner: which components, with which signs?
    formula:
    result_grain:
    valid_dimensions: []
    period_rule: >-               # Sum complete periods only.
    completeness:
    additivity:
      class: additive
      across_segments: sum
      across_time: sum
      time_rollup: sum
    unit:
    precision:
    sign_convention:              # Ask your owner: what does a negative value mean?
    synonyms: []
    ambiguous_terms: []
    reconciliation:               # sum of changes = level(end) - level(start)
    owner:
    version: 1.0.0
    status: draft
    limitations: []
```

### Rate (ratio)

```yaml
  - name:
    label:
    description: >-
    type: ratio
    relation:
    numerator:                    # Ask your owner: counted how, at which instant?
    denominator:                  # Ask your owner: who is in the base, and who is not?
    expression:                   # round(100.0 * numerator / nullif(denominator, 0), 1)
    result_grain:
    valid_dimensions: []
    period_rule: >-               # Recompute for every period; never average.
    completeness:
    population:
    zero_denominator: "null"
    additivity:
      class: non-additive
      across_segments: recompute_from_components
      across_time: recompute_from_components
      time_rollup: recompute_from_components
    unit: percent
    scale: 0-100
    precision: 1
    synonyms: []
    ambiguous_terms: []
    reconciliation:               # start - left + joined = end
    owner:
    version: 1.0.0
    status: draft
    limitations: []
```
