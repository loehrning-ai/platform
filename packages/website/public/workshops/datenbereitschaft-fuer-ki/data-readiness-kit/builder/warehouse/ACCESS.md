# Access: least privilege for the AI reader

## In plain words

"Please do not read the customer table" is an instruction. "permission denied" is a lock.

Instructions guide the AI from three places: `CLAUDE.md` (Claude Code), Project instructions (Claude Projects) and an Agent Skill (`.claude/skills/foldline-analytics/SKILL.md`); see `../claude/README.md`. They help it refuse early. Only the database can **enforce**. The course's rule: "two locks: refuse early, enforce anyway".

Read-only is not least privilege. The export login is read-only too, and it sees all seven look-alike tables. The approved login can read exactly five views.

After `sql/60_access.sql` runs, `foldline_ready_reader`:

- **can** SELECT from five named views in `analytics`;
- **cannot** read `source` or `core` (42501), write (42501), create a temporary table (42501), or connect to `saas_bad`.

## Locks and guardrails

Only locks hold against a user, or an AI, who tries on purpose.

| Control | Kind | Can the reader undo it? | Verified result |
| --- | --- | --- | --- |
| No USAGE on `source`, `core` | **Lock** | No | `SELECT contact_email FROM core.accounts` gives 42501 (D01) |
| SELECT on five named views only | **Lock** | No | Exactly five privileges held (B-P01) |
| No CREATE on any schema | **Lock** | No | `BEGIN READ WRITE; CREATE TABLE analytics.x ...` gives 42501 (B-W01) |
| No TEMP on the database | **Lock** | No | `BEGIN READ WRITE; CREATE TEMP TABLE ...` gives 42501 (B-T01) |
| No CONNECT on `saas_bad` | **Lock** | No | `\connect saas_bad` fails: "User does not have CONNECT privilege" (B-X01) |
| `default_transaction_read_only = on` | Guardrail | Yes: `BEGIN READ WRITE` | Without the override, a CREATE fails with 25006: the default, not the lock. |
| `statement_timeout = 5s` | Guardrail | Yes: `SET statement_timeout = 0` works | Stops an accidental runaway query. |
| `search_path = ''` | Guardrail | Yes: `SET search_path = analytics` works | Forces schema-qualified names by default (B-S01). The recorded ready run relied on `search_path analytics,public`. |
| `CONNECTION LIMIT 5` | Guardrail | No, but it limits load, not access | |

Guardrails stop accidents; never call them the lock. If a connector or a hook must enforce a timeout or a row limit, enforce it there too (see `claude/CONNECTOR.md`).

## `60_access.sql`, line by line

```sql
-- 1. Database: nobody gets anything by default; the reader may connect.
REVOKE ALL ON DATABASE saas_ready FROM PUBLIC;          -- removes PUBLIC's default CONNECT and TEMPORARY
GRANT CONNECT ON DATABASE saas_ready TO foldline_ready_reader;
```

PostgreSQL gives PUBLIC (every role) CONNECT and TEMPORARY on every new database. Without the REVOKE, any role can `BEGIN READ WRITE; CREATE TEMP TABLE` and write scratch data, and B-T01 fails. Verified: before the REVOKE the reader created and filled a temp table; after it, 42501.

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

The explicit revokes from the reader repair drift: a hand-made grant of SELECT on `core.accounts` disappears when you re-run 60. Tested: after a manual grant, D01, B-T01 and B-P01 failed; after re-running 60, they passed.

```sql
-- 3. Objects: an allowlist of five named views.
GRANT SELECT ON
  analytics.mrr_summary_monthly, analytics.logo_churn_by_segment_quarter,
  analytics.expansion_mrr_by_country_monthly, analytics.account_mrr_monthly,
  analytics.data_status_by_view
TO foldline_ready_reader;
RESET ROLE;
```

There is deliberately no `GRANT SELECT ON ALL TABLES IN SCHEMA analytics` and no `ALTER DEFAULT PRIVILEGES ... TO foldline_ready_reader`. Both would expose a sixth view the day someone creates it. The self-check at the end of 60 fails if a default privilege mentions the reader.

```sql
-- 4. Guardrails, loaded at login.
ALTER ROLE foldline_ready_reader SET default_transaction_read_only = on;
ALTER ROLE foldline_ready_reader SET statement_timeout = '5s';
ALTER ROLE foldline_ready_reader SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE foldline_ready_reader SET search_path = '';
ALTER ROLE foldline_ready_reader CONNECTION LIMIT 5;
```

These settings apply **at login only**; `SET ROLE foldline_ready_reader` does not load them. So the quick start reports B-S01 as SKIP, and the full proof logs in as the reader.

```sql
-- 5. The export lane: no CONNECT for the approved reader.
REVOKE CONNECT ON DATABASE saas_bad FROM foldline_ready_reader;   -- PUBLIC was revoked in 10_export_lane.sql
```

The closing self-check stops the build if the reader holds more than five SELECT privileges in analytics, holds TEMP, can create in any schema, can use core or source, can connect to `saas_bad`, has a role attribute such as SUPERUSER or BYPASSRLS, or is named in a default privilege.

## Ownership: who owns what

| Role | Login | Owns | Why |
| --- | --- | --- | --- |
| `foldline_owner` | NOLOGIN | `source`, `core`, `analytics` and everything in them | Views run with their owner's rights, so the reader needs no core grant. Nobody can log in as the owner. |
| `foldline_ready_reader` | NOLOGIN in version control | nothing | The AI's reader. SELECT on five views. |
| `foldline_bad_reader` | NOLOGIN in version control | nothing | The export lane's reader. SELECT on all seven export tables: the counter-example. |
| you (the builder) | your login | the two databases | Creates roles and databases, then switches to the owner with `SET ROLE`. On PostgreSQL 16+, membership is WITH SET TRUE and INHERIT FALSE, so the builder never uses the owner's rights by accident. |

A superuser must never own the views: a superuser owner bypasses row-level security on the tables the view reads. So does a table's owner, unless the table uses `FORCE ROW LEVEL SECURITY`.

## Finer locks: columns and rows

FOLDLINE's five views already remove identifiers, so it needs neither. You may.

**Column grants.** Expose only some columns of a view:

```sql
REVOKE SELECT ON analytics.account_mrr_monthly FROM foldline_ready_reader;
GRANT SELECT (month_start, customer_segment, ending_mrr_eur) ON analytics.account_mrr_monthly TO foldline_ready_reader;
```

A `SELECT *` then fails with 42501, and queries that name the allowed columns work.

**Row-level security, by example.** A people-analytics view in `domains/PEOPLE-HEADCOUNT.md` must never show a department with fewer than 5 people. Two options:

1. Filter in the view itself (`HAVING count(*) >= 5`) and mark it `WITH (security_barrier = true)`. Simplest, and needs no policy.
2. Put a policy on the core table and create the view `WITH (security_invoker = true)` (PostgreSQL 15+), so the policy applies to the reader:

```sql
ALTER TABLE core.account_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY only_complete ON core.account_months FOR SELECT TO foldline_ready_reader
  USING (month_start <= DATE '2026-06-01');
```

Verified: a `security_invoker` view over `core.accounts` fails with 42501 for a reader without a core grant, so option 2 also needs a column grant on the core table.

## Allowlist, not denylist

| Allowlist (this kit) | Denylist alone |
| --- | --- |
| `allow: schemas [analytics]; relations [5 names]` | `deny: schemas [raw, core, staging]` |
| A new schema `tmp_export` stays invisible until granted | A new schema `tmp_export` is readable the day it appears, if its grants are open |
| The reader holds exactly five grants in the database | The denylist lives in a YAML file; the database may disagree |

The course's `semantic-template/policy.yml` has both an allow list (`operations: [select]`, `models: [analytics.mrr_summary_monthly]`, `metrics: [ending_mrr]`) and a `deny: schemas` list, and requires database grants. Grants that followed only the deny list would leave a new schema open. The allow list plus grants on named views fails closed. The builder's `semantic/policy.yml` keeps only the allowlist, names the identity `foldline_ready_reader` (the template says `ai_analytics_reader`), and matches this script.

## Pseudonymous is not anonymous

`account_key` (`fl_0006`) hides the CRM number and the name, but it is stable and joinable. Anyone with access to `core.accounts` can map it back, and a rare mix of country, segment and MRR can single out an account. Treat account-grain views as personal-adjacent:

- serve them only when a question needs them (G05);
- require LIMIT (policy: 1,000 rows or fewer);
- never serve the mapping table.

## Credentials

No file in this kit holds a password, a connection string with a secret, or an API key. Keep it that way.

| Do | Do not |
| --- | --- |
| Create the login outside version control: `ALTER ROLE foldline_ready_reader LOGIN;` then `\password foldline_ready_reader` in psql, which prompts and writes nothing to disk | `CREATE ROLE ... PASSWORD '...'` in a committed SQL file |
| Or let a secret manager, cloud IAM authentication or client certificates issue the credential | A shared "analytics" password in a wiki page |
| Give each AI surface its own role (one for the Claude connector, one for a BI tool) | One role for every tool, so a leak means rotating everything |
| Pass the DSN through an environment variable, such as `FOLDLINE_READY_DSN` | A DSN in CLAUDE.md, a Skill, a Project file or a committed `.mcp.json` |
| Rotate on any suspected exposure; log connections (`log_connections = on`) | Wait for proof of misuse |
| Use `scram-sha-256` in `pg_hba.conf` for anything beyond a local sandbox | `trust` on a shared server. `65_local_login.sql` is for a laptop only. |
