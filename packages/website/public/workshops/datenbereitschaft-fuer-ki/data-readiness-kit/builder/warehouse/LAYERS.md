# Layers: source, core, analytics

## In plain words

Think of a restaurant kitchen.

- **The delivery room (source).** Boxes arrive exactly as the supplier packed them. You do not relabel them here, so you can always prove what arrived.
- **The prep kitchen (core).** Cooks wash, cut and label everything. Rotten items go back. Every container says what is inside.
- **The pass (analytics).** Finished plates wait for the waiter. Each plate is one dish, cut to one order.

The AI is a guest: **it is served only at the pass**, never in the delivery room.

FOLDLINE's export lane skipped the kitchen. It handed the AI seven delivery boxes (`customer_master`, `monthly_revenue`, `billing_events` ...), and three looked like the answer. The AI picked `monthly_revenue` and answered −19,960 for April's ending MRR. The approved lane served one plate, `analytics.mrr_summary_monthly`: 334,675.

## The three layers

| Layer | Job | Rule | FOLDLINE objects (rows) |
| --- | --- | --- | --- |
| **source** | Keep the feeds exactly as received. | Never rename, never fix. Append, then load again. | `source.crm_accounts` (144), `source.billing_account_mrr` (2,592), `source.billing_events` (334, including 16 retry copies), `source.load_log` (1) |
| **core** | Make the data true and labelled. | Rename, type, decode and deduplicate first (staging). Then build one table per business thing at a stated grain. Keys and CHECKs enforce it. Run the quality gate. | staging views `core.stg_crm_accounts`, `core.stg_billing_account_mrr`, `core.stg_billing_events`; tables `core.accounts` (144), `core.account_months` (2,592), `core.mrr_movements` (318), `core.load_status` (1), `core.serving_contracts` (4) |
| **analytics** | Answer one family of questions per object. | Thin views. Approved names, units, data state, complete periods. No direct identifiers. | `analytics.mrr_summary_monthly` (18), `analytics.logo_churn_by_segment_quarter` (15), `analytics.expansion_mrr_by_country_monthly` (144), `analytics.account_mrr_monthly` (2,592), `analytics.data_status_by_view` (4) |

The export lane, `saas_bad.public`, is what you get when source is served directly.

## Names you will meet elsewhere

| This kit | Also called | Notes |
| --- | --- | --- |
| source | raw, landing, bronze, "stage" in some loaders | Loaded as delivered. |
| core, staging step (`core.stg_*`) | staging, `stg_` models | Rename, type, decode, deduplicate. One view per source table, no joins. |
| core, modelled tables | intermediate, silver, integration, "the warehouse" | Business entities and facts at a stated grain. |
| analytics | marts, gold, serving, presentation, semantic views | What people and AI tools read. |

In this kit, staging is a **step inside core**, so the picture stays at three boxes and matches the deck ("source · core · analytics"). The rules are the same. In a dbt project, the split is usually three folders: `staging/`, `intermediate/` and `marts/`.

## Where each trap gets fixed

Each trap from the appendix has one home in the approved lane.

| Trap in the export lane | Fixed in | How | Test that catches a relapse |
| --- | --- | --- | --- |
| `monthly_revenue.amount` holds each month's **change**, but it is named like a total | core, then analytics | The change is called `net_new_mrr_eur` and sits beside `ending_mrr_eur`. The level is computed from the account grain, not from a window of changes. | G01, Q02 |
| `billing_events` repeats every 19th movement in a retry batch | core (staging) | `core.stg_billing_events` keeps one row per `event_id`. `core.mrr_movements` has `movement_id` as its PRIMARY KEY, so a repeat cannot load. Quality rule R2 reconciles movements with snapshots. | quality gate R2, G04 |
| `acct_history.state` and `customer_master.status` store A, C, N | core (staging) | Decoded once into `active`, `churned`, `new`. A CHECK rejects an unknown code, so it fails the build instead of becoming a silent NULL. | G03, Q04 |
| `subscription_export` holds June 2026 only | analytics | Views serve complete months only and carry `complete_through_month` on every row. | Q03 |
| `balance` + `change` in `acct_history` double counts | core | `core.account_months` stores `starting_mrr_eur`, `ending_mrr_eur` and a generated `net_new_mrr_eur`. A CHECK ties `movement_type` to the numbers. | Q02 |

`monthly_revenue` was never wrong, only unlabelled. Its sums are the true monthly changes: −19,960 + 9,775 + 42,565 = 32,380, the correct net new MRR for Q2. The fix is a name and a neighbouring level column.

## Why the AI sees only analytics

| Reason | Export lane | Approved lane |
| --- | --- | --- |
| Fewer choices | 7 tables, 3 of them sound like "MRR" | 5 views, one per question family |
| Certified meaning | Nothing written down | Each view has a comment with `definition 1.0.0` and a metric in `semantic/metric.yml` |
| No direct identifiers | `customer_master.id` and the CRM number are everywhere | Only the pseudonymous `account_key`; names and contacts stay in core |
| Stable names | Feed names change when the vendor changes | View names are a published contract; renames get an alias for one version |
| Data state on every row | None | `complete_through_month`, `data_loaded_at_utc`, `quality_status` |
| Enforced | One login reads all 7 tables | The reader holds SELECT on 5 views; core returns 42501 (D01) |

## One database or two?

The deck uses two databases, `saas_bad` and `saas_ready`, so the comparison stays legible and a login for one cannot connect to the other (test B-X01). A real warehouse usually keeps one database and separates the layers with schemas and roles. The principles hold: separate the layers, grant only the last one, test the grants. With one database, drop B-X01 and keep the rest.

## What works and what does not

| Works | Does not work | Why it fails |
| --- | --- | --- |
| Fix meaning in core, once | "Fix it in the prompt": "A means active" in the instructions | Each tool decodes differently. The recorded run searched `'active'` and found 0 rows. |
| Keep source untouched | Clean data in place in source | The first bad fix destroys the evidence. |
| Serve the AI five views at the grains its questions need | "Give the AI core so it can answer anything" | Core has 2,592 account-months, identifiers and system ids; D01 would have nothing to deny. |
| One view per question family, at its grain | One wide mega-view at account-month grain | The AI must aggregate levels itself (1,066,140 = three levels summed). |
| Constraints in core (PRIMARY KEY, CHECK) | Tests only in a report downstream | The wrong number is already in the board pack when the test runs. |

## For builders

- **Tables or views in core?** The modelled core objects are tables: constraints prove the grain at load time, and the analytics views stay thin. Staging is views, because it only renames.
- **Ownership.** `foldline_owner`, which cannot log in, owns everything in source, core and analytics. Views run with their owner's rights, so the AI login needs no privilege on core. ACCESS.md has the details and the `security_invoker` alternative.
- **Idempotence.** Each layer file starts with `DROP SCHEMA ... CASCADE` and rebuilds. For large data, load core incrementally and keep the same names, grain and checks.
- **Lineage.** Analytics views read only core; core reads only source. `semantic/model.yml` lists each view's upstream relations; FRESHNESS-LINEAGE.md walks one number back to the feed.
