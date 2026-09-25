--
-- 60_access.sql: least privilege for the AI reader in the approved database (saas_ready).
--
-- In plain words
--   "Please do not read the customer table" is an instruction. "permission denied" is a
--   lock. This file builds the lock. After it runs, foldline_ready_reader can do exactly
--   one thing: SELECT from five named views in analytics. It cannot read source or core,
--   cannot write, cannot create temporary tables, and cannot connect to the export lane.
--   Read-only alone is not least privilege: the export login was read-only too, and it
--   could still read all seven look-alike tables.
--
-- Locks and guardrails. Know which is which.
--   LOCKS (the database refuses; the reader cannot undo them):
--     - no CONNECT on saas_bad, no TEMP, no CREATE anywhere, no USAGE on source or core
--     - SELECT on five named views, nothing else (an allowlist, not a denylist)
--   GUARDRAILS (defaults loaded at login; the reader CAN override them in a session):
--     - default_transaction_read_only = on   (BEGIN READ WRITE overrides it)
--     - statement_timeout = 5s               (SET statement_timeout = 0 overrides it)
--     - search_path = ''                     (forces schema-qualified names)
--   Guardrails are still worth having. Just never call them the lock.
--
-- No passwords in this file, ever.
--   The roles are created NOLOGIN in 00_build_all.sql. The quick start tests them with
--   SET ROLE. To log in for real, a person with the right to do so enables LOGIN and sets
--   the secret OUTSIDE version control (see ACCESS.md, "Credentials"):
--     psql> ALTER ROLE foldline_ready_reader LOGIN;
--     psql> \password foldline_ready_reader        -- prompts; nothing lands in a file
--   Local sandbox with trust or peer auth only: 65_local_login.sql.
--
-- For builders
--   - Idempotent: safe to run again after any rebuild of 40_analytics.sql.
--   - Run as the database owner or a superuser, connected to saas_ready.
--   - Role-level settings apply at LOGIN. SET ROLE does not load them. Test with a login.
--
\set ON_ERROR_STOP on
\set QUIET on
\if :{?bad_db}
\else
  \set bad_db saas_bad
\endif
SET client_min_messages = warning;

-- 1. Database level: nobody gets anything by default. The reader may connect, nothing more.
--    REVOKE ALL removes PUBLIC's default CONNECT and TEMPORARY. Without it, B-T01 fails:
--    any role could BEGIN READ WRITE and CREATE TEMP TABLE.
DO $db$
BEGIN
  EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO foldline_ready_reader', current_database());
END
$db$;

-- 2. Schema level: close every door, then open one.
REVOKE ALL ON SCHEMA public FROM PUBLIC;             -- PostgreSQL 14 and older grant CREATE here
SET ROLE foldline_owner;                             -- only the owner may grant on its objects
REVOKE ALL ON SCHEMA source, core, analytics FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA source, core, analytics FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA source, core, analytics FROM foldline_ready_reader;
REVOKE ALL ON SCHEMA source, core FROM foldline_ready_reader;
GRANT USAGE ON SCHEMA analytics TO foldline_ready_reader;   -- USAGE: may look up names. Not CREATE.

-- 3. Object level: an ALLOWLIST of five named views.
--    Never "GRANT SELECT ON ALL TABLES IN SCHEMA analytics": a sixth view added next month
--    would be exposed without anyone deciding it. Never ALTER DEFAULT PRIVILEGES ... TO the
--    reader, for the same reason.
GRANT SELECT ON
  analytics.mrr_summary_monthly,
  analytics.logo_churn_by_segment_quarter,
  analytics.expansion_mrr_by_country_monthly,
  analytics.account_mrr_monthly,
  analytics.data_status_by_view
TO foldline_ready_reader;
RESET ROLE;

-- 4. Guardrails, loaded at login.
ALTER ROLE foldline_ready_reader SET default_transaction_read_only = on;
ALTER ROLE foldline_ready_reader SET statement_timeout = '5s';
ALTER ROLE foldline_ready_reader SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE foldline_ready_reader SET search_path = '';
ALTER ROLE foldline_ready_reader CONNECTION LIMIT 5;

-- 5. The export lane: the approved login must not even connect to it.
--    10_export_lane.sql already revoked PUBLIC's CONNECT on saas_bad; this makes sure no
--    direct grant slipped in.
SELECT format('REVOKE CONNECT ON DATABASE %I FROM foldline_ready_reader', :'bad_db')
WHERE EXISTS (SELECT 1 FROM pg_database WHERE datname = :'bad_db') \gexec

-- 6. Optional, commented out: finer locks you may need later.
--    Column grant: expose only some columns of a view.
--      REVOKE SELECT ON analytics.account_mrr_monthly FROM foldline_ready_reader;
--      GRANT SELECT (month_start, customer_segment, ending_mrr_eur) ON analytics.account_mrr_monthly
--        TO foldline_ready_reader;
--    Row-level security: apply it on the core TABLE and create the view WITH
--    (security_invoker = true) (PostgreSQL 15+), or filter inside a view marked
--    WITH (security_barrier = true). Example policy on a table:
--      ALTER TABLE core.account_months ENABLE ROW LEVEL SECURITY;
--      CREATE POLICY only_complete ON core.account_months FOR SELECT TO foldline_ready_reader
--        USING (month_start <= DATE '2026-06-01');

-- 7. Self-check: print what the reader can do, and stop if it is more than intended.
\echo '    access: privileges held by foldline_ready_reader (expected: 5 x SELECT on analytics)'
SELECT n.nspname AS table_schema, c.relname AS table_name,
       string_agg(p.privilege, ', ' ORDER BY p.privilege) AS privileges
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(privilege)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
  AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
  AND has_table_privilege('foldline_ready_reader', c.oid, p.privilege)
GROUP BY n.nspname, c.relname
ORDER BY 1, 2;

SELECT set_config('foldline.bad_db', :'bad_db', false) AS bad_db_name \gset
DO $selfcheck$
DECLARE
  v_objects text;
  v_n int;
  v_bad_db text := current_setting('foldline.bad_db');
BEGIN
  SELECT count(*), string_agg(n.nspname || '.' || c.relname || ':' || p.privilege, ', ')
    INTO v_n, v_objects
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(privilege)
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
    AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
    AND has_table_privilege('foldline_ready_reader', c.oid, p.privilege);
  IF v_n <> 5 OR v_objects ~ '(INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER)' OR v_objects ~ '(source|core|public)\.' THEN
    RAISE EXCEPTION 'access self-check failed: reader holds % privileges: %', v_n, v_objects;
  END IF;
  IF has_database_privilege('foldline_ready_reader', current_database(), 'TEMPORARY') THEN
    RAISE EXCEPTION 'access self-check failed: reader may create temporary tables';
  END IF;
  IF has_schema_privilege('foldline_ready_reader', 'analytics', 'CREATE')
     OR has_schema_privilege('foldline_ready_reader', 'core', 'USAGE')
     OR has_schema_privilege('foldline_ready_reader', 'source', 'USAGE')
     OR has_schema_privilege('foldline_ready_reader', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'access self-check failed: reader has a schema privilege it should not have';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = v_bad_db)
     AND has_database_privilege('foldline_ready_reader', v_bad_db, 'CONNECT') THEN
    RAISE EXCEPTION 'access self-check failed: reader can connect to %', v_bad_db;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foldline_ready_reader'
             AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)) THEN
    RAISE EXCEPTION 'access self-check failed: reader has a role attribute it must not have';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_default_acl WHERE defaclacl::text LIKE '%foldline_ready_reader%') THEN
    RAISE EXCEPTION 'access self-check failed: a default privilege auto-grants new objects to the reader';
  END IF;
END
$selfcheck$;

\echo '    access ready: foldline_ready_reader = SELECT on 5 views; locks enforced, guardrails set'
