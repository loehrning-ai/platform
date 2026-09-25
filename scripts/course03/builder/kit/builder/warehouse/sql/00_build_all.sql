--
-- 00_build_all.sql: build the whole FOLDLINE warehouse with one command, then check it.
--
-- In plain words
--   This file builds two small databases from the workshop and tests them:
--     saas_bad    the export lane: 7 look-alike tables, no definitions (the counter-example)
--     saas_ready  the approved lane: source -> core -> analytics, 5 approved views
--   plus three roles, no passwords:
--     foldline_owner         owns core and analytics; nobody logs in as it
--     foldline_ready_reader  the AI's reader: SELECT on 5 views, nothing else
--     foldline_bad_reader    the export lane's reader: sees all 7 tables
--   At the end it runs the database checks (70) and replays the wrong answers (80).
--
-- Run it (from the warehouse folder):
--     psql -X -v ON_ERROR_STOP=1 -d postgres -f sql/00_build_all.sql
--   Safe to run again: every step drops and rebuilds what it owns.
--   Clean up with sql/99_teardown.sql.
--
-- For builders
--   - Needs psql and PostgreSQL 14 or newer (tested on 16). Your login must be allowed to
--     create databases and roles (a superuser, or a role with CREATEDB and CREATEROLE).
--   - Optional variables: -v bad_db=... -v ready_db=... (defaults saas_bad, saas_ready),
--     -v skip_checks=1 to build only.
--   - Roles are cluster-wide: they exist in every database on this server.
--
\set ON_ERROR_STOP on
\set QUIET on
\if :{?bad_db}
\else
  \set bad_db saas_bad
\endif
\if :{?ready_db}
\else
  \set ready_db saas_ready
\endif
SET client_min_messages = warning;

\echo ''
\echo '== FOLDLINE builder: one question, two lanes =='
\echo 'Question: Show ending MRR by month for the last complete quarter.'
\echo ''
\echo '-- Step 1. Roles (no passwords; NOLOGIN until someone decides otherwise)'
SELECT 'CREATE ROLE foldline_owner NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foldline_owner') \gexec
SELECT 'CREATE ROLE foldline_ready_reader NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foldline_ready_reader') \gexec
SELECT 'CREATE ROLE foldline_bad_reader NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foldline_bad_reader') \gexec
COMMENT ON ROLE foldline_owner IS 'Owns source, core and analytics in the approved lane. NOLOGIN.';
COMMENT ON ROLE foldline_ready_reader IS 'AI reader for the approved lane: SELECT on five analytics views only.';
COMMENT ON ROLE foldline_bad_reader IS 'Export-lane reader: sees all seven export tables. The counter-example.';
-- The builder (you) switches to the owner to create objects (SET ROLE foldline_owner),
-- and to the readers to test them. A superuser may always do that. A CREATEROLE user needs
-- the membership below; on PostgreSQL 16+ with SET but without INHERIT, so the builder
-- never silently uses the owner's or the readers' rights.
SELECT current_setting('server_version_num')::int >= 160000 AS pg16 \gset
\if :pg16
SELECT format('GRANT %I TO CURRENT_USER WITH INHERIT FALSE, SET TRUE', r)
FROM unnest(ARRAY['foldline_owner', 'foldline_ready_reader', 'foldline_bad_reader']) AS r
WHERE NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user)
  AND NOT pg_has_role(current_user, r, 'SET') \gexec
\else
SELECT format('GRANT %I TO CURRENT_USER', r)
FROM unnest(ARRAY['foldline_owner', 'foldline_ready_reader', 'foldline_bad_reader']) AS r
WHERE NOT pg_has_role(current_user, r, 'MEMBER') \gexec
\endif

\echo '-- Step 2. Databases'
SELECT format('CREATE DATABASE %I', :'bad_db')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'bad_db') \gexec
SELECT format('CREATE DATABASE %I', :'ready_db')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'ready_db') \gexec
-- The owner role creates the three layers' schemas, so it needs CREATE on this database.
SELECT format('GRANT CREATE ON DATABASE %I TO foldline_owner', :'ready_db') \gexec

\echo '-- Step 3. Export lane (the counter-example): 7 tables copied out of other systems'
\connect :bad_db
SET client_min_messages = warning;
\ir 10_export_lane.sql

\echo '-- Step 4. Approved lane, layer 1: source = feeds exactly as received'
\connect :ready_db
SET client_min_messages = warning;
\ir 20_source_seed.sql
\echo '    source ready: crm_accounts (144), billing_account_mrr (2,592), billing_events (with retry copies), load_log'

\echo '-- Step 5. Approved lane, layer 2: core = renamed, typed, decoded, deduplicated, checked'
\ir 30_core.sql

\echo '-- Step 6. Approved lane, layer 3: analytics = the five approved views'
\ir 40_analytics.sql

\echo '-- Step 7. Access: least privilege for the AI reader'
\ir 60_access.sql

\if :{?skip_checks}
  \echo ''
  \echo 'Built. Checks skipped. Run: psql -X -d' :ready_db '-f sql/70_checks.sql'
\else
  \echo ''
  \echo '-- Step 8. Database checks (approved lane), tested as foldline_ready_reader'
  \ir 70_checks.sql
  \echo ''
  \echo '-- Step 9. Replay the wrong answers (export lane), as foldline_bad_reader'
  \connect :bad_db
  \ir 80_export_lane_replay.sql
\endif
