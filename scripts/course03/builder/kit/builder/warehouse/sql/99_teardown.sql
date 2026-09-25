--
-- 99_teardown.sql: remove everything the builder created.
--
-- In plain words
--   Drops the two databases and the three roles. Your other databases are not touched.
--   Roles are cluster-wide, so they are dropped last, after the databases that used them.
--
-- Run (connected to any other database, for example postgres):
--   psql -X -d postgres -f sql/99_teardown.sql
--   Optional: -v bad_db=... -v ready_db=... if you built with other names.
--
-- If a DROP DATABASE fails with "being accessed by other users", close those sessions
-- (on PostgreSQL 13+ you may add WITH (FORCE) to the DROP DATABASE statements).
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
SELECT format('DROP DATABASE IF EXISTS %I', :'bad_db') \gexec
SELECT format('DROP DATABASE IF EXISTS %I', :'ready_db') \gexec
DROP ROLE IF EXISTS foldline_ready_reader;
DROP ROLE IF EXISTS foldline_bad_reader;
DROP ROLE IF EXISTS foldline_owner;
\echo 'Removed: databases' :bad_db 'and' :ready_db ', roles foldline_ready_reader, foldline_bad_reader, foldline_owner.'
