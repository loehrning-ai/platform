# Access: least privilege for the AI reader

## In plain words

"Please do not read the customer table" is an instruction. "permission denied" is a lock.

Instructions guide the AI, in three places: `CLAUDE.md` (Claude Code), Project instructions (Claude Projects) and an Agent Skill (`.claude/skills/foldline-analytics/SKILL.md`). See `../claude/README.md`. They help it refuse early and politely. Only the database can **enforce**. The course's rule is "two locks: refuse early, enforce anyway".

Read-only is not least privilege. In this kit's rebuild, the export login is read-only too, and it still sees all seven look-alike tables. The approved login can read exactly five views.

After `sql/60_access.sql` runs, `foldline_ready_reader`:

- **can** SELECT from five named views in `analytics`;
- **cannot** read `source` or `core` (42501), write (42501), create a temporary table (42501), or connect to `saas_bad`.

## Locks and guardrails

Know which is which. Only locks survive a user, or an AI, who tries on purpose.

| Control | Kind | Can the reader undo it? | Verified result |
| --- | --- | --- | --- |
| No USAGE on `source`, `core` | **Lock** | No | `SELECT contact_email FROM core.accounts` gives 42501 (D01) |
| SELECT on five named views only | **Lock** | No | Exactly five privileges held (B-P01) |
| No CREATE on any schema | **Lock** | No | `BEGIN READ WRITE; CREATE TABLE analytics.x ...` gives 42501 (B-W01) |
| No TEMP on the database | **Lock** | No | `BEGIN READ WRITE; CREATE TEMP TABLE ...` gives 42501 (B-T01) |
| No CONNECT on `saas_bad` | **Lock** | No | `\connect saas_bad` fails: "User does not have CONNECT privilege" (B-X01) |
| `default_transaction_read_only = on` | Guardrail | Yes: `BEGIN READ WRITE` | Without the override, a CREATE fails with 25006. That is the default speaking, not the lock. |
| `statement_timeout = 5s` | Guardrail | Yes: `SET statement_timeout = 0` works | Protects the server from an accidental runaway query. |
| `search_path = ''` | Guardrail | Yes: `SET search_path = analytics` works | Forces schema-qualified names by default (B-S01). The recorded ready run leaned on `search_path analytics,public`. |
| `CONNECTION LIMIT 5` | Guardrail | No, but it limits load, not access | |

Guardrails are still worth having: they stop accidents. Just never call them the lock. If a connector or a hook must enforce a timeout or a row limit, enforce it there as well (see `claude/CONNECTOR.md`).

## `60_access.sql`, line by line

```sql
-- 1. Database: nobody gets anything by default; the reader may connect.
REVOKE ALL ON DATABASE saas_ready FROM PUBLIC;          -- removes PUBLIC's default CONNECT and TEMPORARY
GRANT CONNECT ON DATABASE saas_ready TO foldline_ready_reader;
```

PostgreSQL gives PUBLIC (every role) CONNECT and TEMPORARY on every new database. Without the REVOKE, any role could `BEGIN READ WRITE; CREATE TEMP TABLE` and write scratch data, and test B-T01 fails. Verified: before the REVOKE the reader created and filled a temp table; after it, 42501.

```sql
-- 2. Schemas: close every door, then open one.
REVOKE ALL ON SCHEMA public FROM PUBLIC;                -- PostgreSQL 14 and older grant CREATE here
SET ROLE foldline_owner;                                -- only the owner may grant on its objects
REVOKE ALL ON SCHEMA source, core, analytics FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA source, core, analytics FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA source, core, analytics FROM foldline_ready_reader;
REVOKE ALL ON SCHEMA source, core FROM foldline_ready_reader;
GRANT USAGE ON SCHEMA analytics TO foldline_ready_reader;   -- may look up names; not CREATE
```

The explicit revokes from the reader make the script repair drift. If someone granted the reader SELECT on `core.accounts` by hand, re-running 60 removes it. This was tested: after a manual grant, D01, B-T01 and B-P01 failed; after re-running 60, they passed again.

```sql
-- 3. Objects: an allowlist of five named views.
GRANT SELECT ON
  analytics.mrr_summary_monthly, analytics.logo_churn_by_segment_quarter,
  analytics.expansion_mrr_by_country_monthly, analytics.account_mrr_monthly,
  analytics.data_status_by_view
TO foldline_ready_reader;
RESET ROLE;
```

There is deliberately no `GRANT SELECT ON ALL TABLES IN SCHEMA analytics` and no `ALTER DEFAULT PRIVILEGES ... TO foldline_ready_reader`. Both would expose a sixth view the day someone creates it, without anyone deciding. The self-check at the end of 60 fails if a default privilege mentions the reader.

```sql
-- 4. Guardrails, loaded at login.
ALTER ROLE foldline_ready_reader SET default_transaction_read_only = on;
ALTER ROLE foldline_ready_reader SET statement_timeout = '5s';
ALTER ROLE foldline_ready_reader SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE foldline_ready_reader SET search_path = '';
ALTER ROLE foldline_ready_reader CONNECTION LIMIT 5;
```

These settings apply **at login only**. `SET ROLE foldline_ready_reader` from another session does not load them. That is why the quick start reports B-S01 as SKIP, and why the full proof logs in as the reader.

```sql
-- 5. The export lane: no CONNECT for the approved reader.
REVOKE CONNECT ON DATABASE saas_bad FROM foldline_ready_reader;   -- PUBLIC was revoked in 10_export_lane.sql
```

The file ends with a self-check. It raises an error (and stops the build) if the reader holds anything beyond five SELECT privileges in analytics, holds TEMP, can create in any schema, can use core or source, can connect to `saas_bad`, has a role attribute such as SUPERUSER or BYPASSRLS, or is named in a default privilege.

## Ownership: who owns what

| Role | Login | Owns | Why |
| --- | --- | --- | --- |
| `foldline_owner` | NOLOGIN | `source`, `core`, `analytics` and everything in them | Views run with their owner's rights, so the reader needs no core grant. Nobody can log in as the owner and misuse it. |
| `foldline_ready_reader` | NOLOGIN in version control | nothing | The AI's reader. SELECT on five views. |
| `foldline_bad_reader` | NOLOGIN in version control | nothing | The export lane's reader. SELECT on all seven export tables: the counter-example. |
| you (the builder) | your login | the two databases | Creates roles and databases, then switches to the owner with `SET ROLE`. On PostgreSQL 16+, the builder gets membership WITH SET TRUE and INHERIT FALSE, so it never uses the owner's rights by accident. |

The views must never be owned by a superuser. A superuser owner bypasses row-level security on the tables the view reads. The same is true for a table's owner unless the table uses `FORCE ROW LEVEL SECURITY`.

## Finer locks: columns and rows

The five views already remove identifiers, so FOLDLINE needs neither. You may.

**Column grants.** Expose only some columns of a view:

```sql
REVOKE SELECT ON analytics.account_mrr_monthly FROM foldline_ready_reader;
GRANT SELECT (month_start, customer_segment, ending_mrr_eur) ON analytics.account_mrr_monthly TO foldline_ready_reader;
```

A `SELECT *` then fails with 42501, and queries that name the allowed columns work.

**Row-level security, by example.** A people-analytics view in `domains/PEOPLE-HEADCOUNT.md` must never show a department with fewer than 5 people. Two options:

1. Filter in the view itself (`HAVING count(*) >= 5`) and mark it `WITH (security_barrier = true)`. This is the simplest option and needs no policy.
2. Put a policy on the core table and create the view `WITH (security_invoker = true)` (PostgreSQL 15+), so the policy applies to the reader:

```sql
ALTER TABLE core.account_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY only_complete ON core.account_months FOR SELECT TO foldline_ready_reader
  USING (month_start <= DATE '2026-06-01');
```

Verified: a `security_invoker` view over `core.accounts`, read by the reader without a core grant, fails with 42501. So option 2 also needs a column grant on the core table.

## Allowlist, not denylist

| Allowlist (this kit) | Denylist alone |
| --- | --- |
| `allow: schemas [analytics]; relations [5 names]` | `deny: schemas [raw, core, staging]` |
| A new schema `tmp_export` is invisible until someone grants it | A new schema `tmp_export` is readable the day it appears, if its grants are open |
| The database agrees: the reader holds exactly five grants | The denylist lives in a YAML file; the database may disagree |

The course's `semantic-template/policy.yml` has both: an allow list (`operations: [select]`, `models: [analytics.mrr_summary_monthly]`, `metrics: [ending_mrr]`) and a `deny: schemas` list, and it requires database grants. Its deny list alone is a denylist: if the grants followed only that list, a new schema would be open. The allow list plus grants on named views is what fails closed. The builder's `semantic/policy.yml` keeps only the allowlist, names the identity `foldline_ready_reader` (the template says `ai_analytics_reader`), and matches this script.

## Pseudonymous is not anonymous

`account_key` (`fl_0006`) hides the CRM number and the name, but it is stable and joinable. Anyone with access to `core.accounts` can map it back, and a rare combination of country, segment and MRR can single out an account. Treat account-grain views as personal-adjacent:

- serve them only when a question needs them (G05);
- require LIMIT (policy: 1,000 rows or fewer);
- never serve the mapping table.

## Credentials

No file in this kit contains a password, a connection string with a secret, or an API key. Keep it that way.

| Do | Do not |
| --- | --- |
| Create the login outside version control: `ALTER ROLE foldline_ready_reader LOGIN;` then `\password foldline_ready_reader` in psql, which prompts and writes nothing to disk | `CREATE ROLE ... PASSWORD '...'` in a committed SQL file |
| Or let a secret manager, cloud IAM authentication or client certificates issue the credential | A shared "analytics" password in a wiki page |
| Give each AI surface its own role (one for the Claude connector, one for a BI tool) | One role for every tool, so a leak means rotating everything |
| Pass the DSN through an environment variable, such as `FOLDLINE_READY_DSN` | A DSN in CLAUDE.md, a Skill, a Project file or a committed `.mcp.json` |
| Rotate on any suspected exposure; log connections (`log_connections = on`) | Wait for proof of misuse |
| Use `scram-sha-256` in `pg_hba.conf` for anything beyond a local sandbox | `trust` on a shared server. `65_local_login.sql` is for a laptop only. |

## What works and what does not

| Works | Why | Does not work | Why it fails |
| --- | --- | --- | --- |
| SELECT on five named views | The database refuses everything else (42501) | "Read-only login" as the whole plan | The export login was read-only and still saw all seven tables. |
| `REVOKE ALL ON DATABASE ... FROM PUBLIC` | Removes default CONNECT and TEMP | Trusting defaults | PUBLIC can create temp tables in every new database. |
| An allowlist of relations | New objects are private until granted | A denylist of schemas | A new schema is open by default. |
| Views owned by a NOLOGIN, non-superuser owner | Owner's rights reach core; nobody logs in as the owner | Views owned by the superuser that built them | Row-level security is bypassed, and the owner is a login. |
| Testing as the real login | Login settings are loaded | Testing with `SET ROLE` only | `search_path` and the read-only default are never tested (B-S01). |
| Re-running 60 after any change | Drift is repaired and the self-check re-runs | Granting by hand in production | Nobody reviews it; nothing re-checks it. |
| One role per AI surface, DSN from the environment | A leak is contained and rotatable | A superuser DSN in `.mcp.json` "for testing" | The connector can then do anything the superuser can, whatever the prompt says. |
| Prompt refusal and database denial together | Refuse early for a good answer; enforce for safety | The prompt as the lock | Guidance is not enforcement. The runs cited the definition 0 of 3; they can skip a rule too. |
