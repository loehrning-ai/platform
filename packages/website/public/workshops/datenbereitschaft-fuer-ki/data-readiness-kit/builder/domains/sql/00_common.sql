-- 00_common.sql: shared setup for the four domain packs (synthetic teaching data).
--
-- In plain words
--   The domain packs copy the FOLDLINE design into four other businesses. Each pack file
--   builds three things in a scratch database: a bad export table (what an AI usually gets),
--   a clean core table, and one or two approved analytics views. Then it prints the right
--   answer and the wrong answer side by side.
--
-- Run it (psql only, PostgreSQL 14+; tested on 16)
--   createdb domain_packs
--   psql -X -v ON_ERROR_STOP=1 -d domain_packs -f domains/sql/retail_inventory.sql
--   (each pack includes this file itself; run the packs in any order)
--
-- For builders
--   - Use a throwaway database. Never run this in saas_ready or saas_bad: it refuses to.
--   - No roles are created (roles are cluster-wide). Each pack ends with the GRANT lines for
--     a reader login, commented out. Grant each view by name; never grant a schema's tables.
--   - Every view reads the data-state row below. No view calls now(): the reader supplies
--     the evaluation clock, exactly as FOLDLINE does (2026-07-01 09:00 UTC).

\set ON_ERROR_STOP on

DO $guard$
BEGIN
  IF current_database() IN ('saas_ready', 'saas_bad', 'postgres', 'template1') THEN
    RAISE EXCEPTION 'Run the domain packs in a scratch database (createdb domain_packs), not in %',
      current_database();
  END IF;
END
$guard$;

CREATE SCHEMA IF NOT EXISTS export_lane;   -- the look-alike tables an AI usually gets
CREATE SCHEMA IF NOT EXISTS core;          -- cleaned, renamed, decoded; identifiers live here
CREATE SCHEMA IF NOT EXISTS analytics;     -- the only schema a reader login may use

COMMENT ON SCHEMA export_lane IS 'Counter-example lane: raw exports with generic names. Never granted to an AI login.';
COMMENT ON SCHEMA core IS 'Cleaned tables. Not served to an AI.';
COMMENT ON SCHEMA analytics IS 'Approved views, one per question family. The only schema a reader login may use.';

CREATE TABLE IF NOT EXISTS core.load_status (
  subject_area           text PRIMARY KEY,
  complete_through_month date        NOT NULL,
  data_loaded_at_utc     timestamptz NOT NULL,
  quality_status         text        NOT NULL CHECK (quality_status IN ('pass', 'warn', 'fail'))
);
COMMENT ON TABLE core.load_status IS
  'One row per subject area: last complete month, load time (UTC) and quality result. Views read it; they never call now().';

INSERT INTO core.load_status VALUES
  ('inventory', DATE '2026-06-01', TIMESTAMPTZ '2026-07-01 06:00:00+00', 'pass'),
  ('workforce', DATE '2026-06-01', TIMESTAMPTZ '2026-07-01 06:00:00+00', 'pass'),
  ('web_shop',  DATE '2026-06-01', TIMESTAMPTZ '2026-07-01 06:00:00+00', 'pass'),
  ('support',   DATE '2026-06-01', TIMESTAMPTZ '2026-07-01 06:00:00+00', 'pass')
ON CONFLICT (subject_area) DO NOTHING;
