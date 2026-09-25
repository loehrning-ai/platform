--
-- 65_local_login.sql: OPTIONAL. Let the two readers log in on a LOCAL SANDBOX only.
--
-- In plain words
--   The build creates the readers with NOLOGIN, so nobody can log in as them. That is the
--   safe default for a file that lives in version control. For the full proof in
--   70_checks.sql you must log in AS the reader, because PostgreSQL loads a role's settings
--   (search_path, read-only default, timeouts) only at login. SET ROLE does not load them.
--
--   This file turns LOGIN on WITHOUT a password. That only works when the server trusts
--   local connections (pg_hba.conf "trust" or "peer"), which is typical for a laptop
--   sandbox and wrong for anything shared.
--
-- Never do this on a shared or production server. There, a person with the right to do so:
--   1. enables the login:        ALTER ROLE foldline_ready_reader LOGIN;
--   2. sets the secret by hand:  \password foldline_ready_reader     (psql prompts; no file)
--      or lets a secret manager / IAM / certificate authentication issue it,
--   3. gives the AI tool a DSN from an environment variable (FOLDLINE_READY_DSN),
--      never from CLAUDE.md, a Skill, a Project file or a committed .mcp.json.
--
-- Run:   psql -X -d postgres -f sql/65_local_login.sql
-- Undo:  ALTER ROLE foldline_ready_reader NOLOGIN; ALTER ROLE foldline_bad_reader NOLOGIN;
--
\set ON_ERROR_STOP on
\set QUIET on
ALTER ROLE foldline_ready_reader LOGIN;
ALTER ROLE foldline_bad_reader LOGIN;
\echo 'Local sandbox: foldline_ready_reader and foldline_bad_reader may now log in (no password).'
\echo 'Full proof: psql -X -d saas_ready -U foldline_ready_reader -f sql/70_checks.sql'
