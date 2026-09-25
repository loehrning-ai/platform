--
-- 10_export_lane.sql: the EXPORT LANE (database saas_bad, schema public). The counter-example.
--
-- In plain words
--   This is what many companies hand to an AI first: seven tables copied out of other
--   systems. Nothing here is broken. Every table loads, every query runs. But no table
--   says what its numbers mean, three of them sound like "the MRR table", and one login
--   can read all seven. In the workshop an AI picked monthly_revenue and answered
--   -19,960 / 9,775 / 42,565 for "ending MRR". Ending MRR was 334,675 / 344,450 / 387,015.
--
--   Read the "-- TRAP" notes. Each one is fixed in the approved lane (30_core.sql,
--   40_analytics.sql, 60_access.sql). Never copy this file's design into a real project.
--
-- For builders
--   - Run while connected to saas_bad. 00_build_all.sql does that for you.
--   - Idempotent: drops and recreates the seven tables every run.
--   - Column names are the deck's real export columns, so the deck's database checks
--     (fixedSql) run unchanged. See 80_export_lane_replay.sql.
--   - Deliberately missing: primary keys, COMMENT ON, CHECK constraints, units in names.
--
\set ON_ERROR_STOP on
SET client_min_messages = warning;

DROP TABLE IF EXISTS public.customer_master, public.subscription_export, public.billing_events,
  public.monthly_revenue, public.acct_history, public.usage_log, public.tickets CASCADE;

CREATE TABLE public.customer_master (
  id        integer,   -- TRAP: "id" of what? The same number is "acct_id" and "customer_id" elsewhere.
  seg       text,      -- TRAP: abbreviation. Segment? Segmentation model? Sales territory?
  country   text,
  plan      text,
  status    text,      -- TRAP: codes 'A', 'C', 'N'. A search for 'active' finds 0 rows ("0 of 0, no rate").
  status_dt date       -- TRAP: "dt" says nothing about which event or which time zone.
);                     -- TRAP: 'N' accounts joined DURING Q2. Counting them in a churn base gives 4 of 48 = 8.33 %.

CREATE TABLE public.subscription_export (
  customer_id integer, -- TRAP: third name for the same account number.
  date        date,    -- TRAP: a column named after its type. It holds 2026-06-01 only.
  amount      numeric  -- TRAP: "amount" of what, in which unit, at which moment?
);                     -- TRAP: June 2026 ONLY. Looks like a full table; it is one month.

CREATE TABLE public.billing_events (
  event_id    integer, -- the retry batch REPEATS this id: every 19th movement appears twice.
  acct_id     integer,
  dt          date,
  type        text,    -- TRAP: 'N', 'E', 'D', 'C'. Here 'C' means cancel; in customer_master 'C' means churned.
  status      text,    -- TRAP: 'posted' or 'pending'. Filtering on 'posted' silently drops late June invoices.
  amount      numeric, -- TRAP: signed change, not a balance.
  retry_batch text     -- TRAP: set only on the repeated copy. Nothing stops you from summing both rows.
);

CREATE TABLE public.monthly_revenue (
  dt      date,        -- TRAP: first day of the month, not a timestamp.
  segment text,
  amount  numeric      -- TRAP: each month's CHANGE (new + expansion - contraction - churn), not revenue,
);                     --        not a balance. The table name sounds like the answer. Export window: 2026 only.

CREATE TABLE public.acct_history (
  acct_id integer,
  dt      date,
  balance numeric,     -- TRAP: month-END balance. Adding "change" to it double counts the month.
  change  numeric,     -- TRAP: the month's change, already inside "balance".
  state   text         -- TRAP: 'A', 'C', 'N' again.
);

CREATE TABLE public.usage_log (
  acct_id integer,
  dt      date,
  events  integer      -- TRAP: product usage, easy to mistake for billing events.
);

CREATE TABLE public.tickets (
  id      integer,
  acct_id integer,
  opened  date,
  closed  date,
  status  text,        -- TRAP: 'O', 'P', 'C', 'R'. Is 'C' closed or cancelled? Nobody wrote it down.
  prio    integer      -- TRAP: is 1 high or low?
);

\ir 10_export_lane_data.sql

-- The export login. Read-only by default, and still the wrong design:
-- read-only is not least privilege. It sees all seven look-alike tables.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
DO $grant$
BEGIN
  EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO foldline_bad_reader', current_database());
END
$grant$;
GRANT USAGE ON SCHEMA public TO foldline_bad_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO foldline_bad_reader;
ALTER ROLE foldline_bad_reader SET default_transaction_read_only = on;

\echo '    export lane ready: 7 tables in public, no definitions, foldline_bad_reader sees all 7'
