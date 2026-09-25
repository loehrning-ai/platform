# What a semantic layer is, and how to build one

## In plain words

A **semantic layer** is a written dictionary that sits between your tables and everyone who
reads them. For each number, it says what the number means, which table answers it, and what
must be refused.

Think of a restaurant menu. It names each dish, its portion and its allergens. Guests order from
the menu. They never walk into the cold store and pick ingredients themselves. In FOLDLINE, the
cold store is the seven export tables. The menu is five approved views plus four small files.

You already built a tiny semantic layer in the workshop: the **four blanks**.

| Blank | FOLDLINE answer for ending MRR |
| --- | --- |
| Kind of number? | The month-end balance, a level |
| Rows per what? | One row per month |
| Which months? | Each complete month: Apr, May, Jun. Never add months together |
| Which table? | Only the MRR summary by month |

On the export tables, nobody wrote these down. The AI guessed all four and returned
**−€19,960 / €9,775 / €42,565**. With the blanks written down and the approved views in place,
the same question returned **€334,675 / €344,450 / €387,015**.

The deck's phrase for this: **"One definition, four readers, separate locks."**

---

## Where it sits

```
 source            core                 analytics (5 views)          semantic files             readers
 as received  ->   cleaned, named,  ->  one view per question   ->   model.yml             ->   AI tool (Claude Project, Skill, connector)
 (never served)    identifiers here     family, no identifiers       metric.yml                 tests (verified-questions.yml)
                                                                      policy.yml                 guide for coding assistants (CLAUDE.md)
                                                                      verified-questions.yml     catalog for people (COMMENT ON)
                                          ^                                                          |
                                          |__________ PostgreSQL grants: the reader sees only analytics (the lock)
```

- **The warehouse layers** (source, core, analytics) decide what data exists and in what shape.
  See `../warehouse/LAYERS.md`.
- **The semantic layer** (the four files) decides what each served number *means*.
- **Claude** reads a compiled copy of the semantic layer. It does not read the YAML by magic.
  See `../claude/README.md`.
- **The grants** decide what the AI's login can touch. The semantic layer cannot deny anything.

---

## The four blanks become fields

| Blank | Field in `metric.yml` | Field in `model.yml` | FOLDLINE value |
| --- | --- | --- | --- |
| Kind of number? | `type` + `additivity` | measure `additivity` | `snapshot`, `across_time: none` |
| Rows per what? | `result_grain` | `grain`, `primary_key` | one row per complete calendar month |
| Which months? | `period_rule` + `completeness` | `time.completeness` | each complete month-end; `month_start <= complete_through_month` |
| Which table? | `relation` (schema-qualified) | `relation` | `analytics.mrr_summary_monthly` |

Every other field (unit, owner, version, synonyms, limitations) makes these four blanks
checkable and keeps them from drifting. Field-by-field notes: `FIELD-REFERENCE.md`.

---

## Build it: nine steps

Do them in this order. Each step names the file it produces and how you know it is done.

| # | Step | You write | Done when | FOLDLINE value |
| --- | --- | --- | --- | --- |
| 1 | Pick one question and its owner | One sentence plus a team name | A second person reads it and asks no question about period, shape or unit | "Show ending MRR by month for the last complete quarter." Owner: revenue_analytics |
| 2 | Fill the four blanks | Four short answers | Each blank has one answer, not "it depends" | Level · one row per month · Apr–Jun, never add · MRR summary by month |
| 3 | Write the truth rows | Expected rows, computed by two people independently | Both people get the same numbers without asking the AI | 334,675 / 344,450 / 387,015 |
| 4 | Write `model.yml` | Grain, key, columns with units, freshness, lineage, tests | Every column in the view is listed; nothing listed is missing from the view | `analytics.mrr_summary_monthly`, key `month_start` |
| 5 | Write `metric.yml` | Type, relation, period rule, additivity, owner, version, limitations | The four blanks can be read off the file | `ending_mrr`, `snapshot`, version 1.0.0 |
| 6 | Write `policy.yml` | An allowlist, clarify and refuse rules, freshness rules | Every rule says what backs it: guides, application or database | Five views; C01, R01, R02 messages; warn after 36 h |
| 7 | Write `verified-questions.yml` | Gold, clarify, refuse, deny and stale cases | No placeholder rows remain | G01 to G05, C01, R01, R02, D01, F00, F01 |
| 8 | Compile by hand | Copy the definition into each reader's format | Every reader shows metric name and version 1.0.0 | See the compile table below |
| 9 | Test that readers use it | Run the db_check cases, then the ai_run cases 3 times | DB CHECKS n of n PASS, and the AI trace cites `ending_mrr` 1.0.0 | Recorded runs cited the definition 0 of 3: not yet |

Steps 1 to 3 need no tools. You can do them on paper in the workshop's five boxes.

---

## Compile: one definition, four readers

"Compile" here means: turn `metric.yml` into the format each reader actually loads. There is no
compiler in this kit. You copy by hand, and tests check some of the copies:
`claude-demo/check_numbers.py` checks that the Project copy names each approved metric with
version 1.0.0, and Q06 checks the catalog. The Skill copy is checked by review and by the AI trace.

| Reader | File it receives | What must appear | Checked by |
| --- | --- | --- | --- |
| AI tool, Claude Project (Setup A) | `../claude/project/metric-definitions.md` | Name, version 1.0.0, type, period rule, limitations | `check_numbers.py`; ai_run trace cites `ending_mrr` 1.0.0 |
| AI tool, Claude Code (Setups B and C) | `../claude/skills/foldline-analytics/references/metrics.md` (copied to `.claude/skills/foldline-analytics/`) and `../claude/CLAUDE.example.md` (copied to the repository root) | Same, plus the routing rule | ai_run trace |
| Catalog for people | `COMMENT ON VIEW` / `COMMENT ON COLUMN` in `../warehouse/sql/40_analytics.sql` | One sentence plus "definition 1.0.0" | db_check Q06 |
| Tests | `verified-questions.yml` | metric, relation, expected rows | db_check G01 to G05 |

**Compiled is not consumed.** Q06 proves the catalog received version 1.0.0. It does not prove
Claude used it. In the recorded runs, the definition was loaded and cited 0 of 3 times. Only a
required trace, graded in every AI run, shows whether the definition was used.

---

## How this maps to semantic-layer products

The kit is plain YAML so that you can learn the ideas without a product. If you use one, the
same ideas have other names. Verify exact syntax against each product's current documentation;
the table below maps concepts, not syntax.

| This kit | dbt Semantic Layer (MetricFlow) | Cube | Also seen as |
| --- | --- | --- | --- |
| `model.yml` model | semantic model | cube (or view) | LookML view; Snowflake semantic view; Databricks metric view |
| `grain`, `primary_key` | entities, primary entity | primary key dimension | |
| measure with `additivity: semi-additive` | measure with a non-additive dimension (time) | model the balance explicitly; check current docs for the pattern | "balance" or "snapshot" measure |
| `metric.yml` metric | metric (simple, ratio, derived, cumulative) | measure or view member | |
| `type: ratio` with numerator and denominator | ratio metric | a calculated measure over two measures | |
| `synonyms` | (labels and descriptions) | (titles and descriptions) | Snowflake synonyms |
| `verified-questions.yml` | saved queries plus your own tests | your own tests (no built-in equivalent assumed) | Snowflake Cortex Analyst verified queries |
| `policy.yml` allowlist | access through the warehouse role | access policies / security context | grants remain the lock in every case |

A product can compile definitions for you and serve them through an API. It still does not
replace the database grant.

---

## What works and what does not

| What works | What does not | Why the second one fails |
| --- | --- | --- |
| Write the four blanks before you build a view | Build the view, then describe what it happens to contain | The view then decides the meaning. monthly_revenue "sounded like the answer" and meant something else |
| One definition, copied to four readers with the same name and version | A slightly different wording in the prompt, the catalog and the test | Readers drift. A test passes against one meaning while Claude answers another |
| A schema-qualified name: `analytics.mrr_summary_monthly` (the key may be `model:` or `relation:`) | An unqualified name: `mrr_summary_monthly`, whatever the key | The recorded run needed `search_path analytics,public` to find the view. Another connection finds nothing, or something else |
| A required trace that names metric and version | "The definition is in the project, so it is used" | Loaded is not the same as used: 0 of 3 citations |
| A semantic layer **and** grants | A semantic layer **instead of** grants | It guides; it cannot deny. D01 is denied by PostgreSQL, not by YAML |

**Counter-example: the export lane had no semantic layer.** Seven tables, and "three of them
sound like the answer". Every table worked and every query ran. None said what its numbers
meant, so the AI picked `monthly_revenue`, read a change as a level, and labelled it
`ending_mrr`. A definition file would not have changed the data. It would have given the AI,
the test and the reviewer the same written answer to "which table, which kind of number".

See also: `METRICS.md` (level, change, rate), `VAGUE-DEFINITION.md` (a bad definition, field
by field), `FIELD-REFERENCE.md` (every field).
