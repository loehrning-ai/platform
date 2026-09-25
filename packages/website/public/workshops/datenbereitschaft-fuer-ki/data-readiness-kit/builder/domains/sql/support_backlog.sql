-- support_backlog.sql: support desk backlog. A level / flow pack with status codes and medians.
--
-- In plain words
--   Open tickets at month end is a LEVEL (the backlog). Opened and closed tickets are the FLOWS.
--   Median resolution time is a PERCENTILE: it cannot be added or averaged. The export stores
--   status codes O/P/C/R, so the AI counts status = 'O' and reports 41 open tickets on 30 June;
--   the backlog is 70. It also averages three monthly medians (17 h); the quarter's median,
--   computed from the 910 closed tickets, is 14 h.
--
-- Run: createdb domain_packs; psql -X -d domain_packs -f domains/sql/support_backlog.sql
-- Synthetic data. Evaluation clock 2026-07-01 09:00 UTC. FOLDLINE's own export lane has the
-- same kind of table: saas_bad.public.tickets(id, acct_id, opened, closed, status, prio).

\set ON_ERROR_STOP on
\ir 00_common.sql

-- ---------------------------------------------------------------------------------------
-- 1. Export lane (counter-example).
-- ---------------------------------------------------------------------------------------
DROP TABLE IF EXISTS export_lane.tickets, export_lane.support_kpi_monthly;

CREATE TABLE export_lane.tickets (      -- snapshot taken 2026-07-01 00:00 UTC
  id     integer,
  opened date,
  closed date,
  status text,                          -- TRAP: O / P / C / R. P = pending customer? R = reopened? resolved?
  prio   integer                        -- TRAP: is 1 high or low?
);
INSERT INTO export_lane.tickets
SELECT i, DATE '2026-06-01' + (i % 29), NULL,
       CASE WHEN i <= 41 THEN 'O' WHEN i <= 63 THEN 'P' ELSE 'R' END, 1 + i % 3
FROM generate_series(1, 70) AS i;                                  -- 70 tickets not closed
INSERT INTO export_lane.tickets
SELECT 1000 + i, DATE '2026-06-01' + (i % 25), DATE '2026-06-02' + (i % 25), 'C', 1 + i % 3
FROM generate_series(1, 30) AS i;                                  -- a few closed June tickets

CREATE TABLE export_lane.support_kpi_monthly (
  dt      date,
  opened  integer,
  closed  integer,
  backlog integer,
  avg_res numeric(5,1)                  -- TRAP: named "avg", holds the MONTH's MEDIAN, in hours
);
INSERT INTO export_lane.support_kpi_monthly VALUES
  (DATE '2026-04-01', 300, 310, 70, 12.0),
  (DATE '2026-05-01', 310, 300, 80, 26.0),
  (DATE '2026-06-01', 290, 300, 70, 13.0);

-- ---------------------------------------------------------------------------------------
-- 2. Core: backlog by month (identity as a constraint) and one row per closed ticket.
-- ---------------------------------------------------------------------------------------
DROP VIEW IF EXISTS analytics.ticket_backlog_monthly, analytics.ticket_resolution_by_bucket_monthly,
                    analytics.ticket_resolution_quarter;
DROP TABLE IF EXISTS core.ticket_months, core.ticket_closures;

CREATE TABLE core.ticket_months (
  month_start           date    PRIMARY KEY CHECK (extract(day FROM month_start) = 1),
  starting_open_tickets integer NOT NULL CHECK (starting_open_tickets >= 0),
  opened_tickets        integer NOT NULL CHECK (opened_tickets >= 0),   -- new tickets + reopenings
  closed_tickets        integer NOT NULL CHECK (closed_tickets >= 0),
  ending_open_tickets   integer NOT NULL CHECK (ending_open_tickets >= 0),
  CONSTRAINT bathtub_identity CHECK (starting_open_tickets + opened_tickets - closed_tickets = ending_open_tickets)
);
COMMENT ON TABLE core.ticket_months IS
  'One row per month. Open = status open, pending_customer or reopened (decoded from O, P, R by the owner).';
INSERT INTO core.ticket_months VALUES
  (DATE '2026-04-01', 80, 300, 310, 70),
  (DATE '2026-05-01', 70, 310, 300, 80),
  (DATE '2026-06-01', 80, 290, 300, 70);

CREATE TABLE core.ticket_closures (
  ticket_key         text    PRIMARY KEY,
  closed_month_start date    NOT NULL,
  resolution_hours   numeric(7,1) NOT NULL CHECK (resolution_hours >= 0)
);
COMMENT ON TABLE core.ticket_closures IS 'One row per closed ticket: month of closing and hours from open to close.';
INSERT INTO core.ticket_closures
SELECT 't' || to_char(v.m, 'YYYYMM') || '-' || lpad(row_number() OVER (PARTITION BY v.m ORDER BY v.h, g)::text, 3, '0'),
       v.m, v.h
FROM (VALUES
  -- April: 310 closed; middle two tickets (155th, 156th) = 12 h
  (DATE '2026-04-01', 2.0, 34), (DATE '2026-04-01', 4.0, 33), (DATE '2026-04-01', 6.0, 33),
  (DATE '2026-04-01', 10.0, 27), (DATE '2026-04-01', 11.0, 27), (DATE '2026-04-01', 12.0, 2),
  (DATE '2026-04-01', 13.0, 18), (DATE '2026-04-01', 14.0, 18), (DATE '2026-04-01', 15.0, 18),
  (DATE '2026-04-01', 20.0, 50), (DATE '2026-04-01', 30.0, 35), (DATE '2026-04-01', 60.0, 15),
  -- May: 300 closed; middle two (150th, 151st) = 26 h
  (DATE '2026-05-01', 4.0, 50), (DATE '2026-05-01', 9.0, 25), (DATE '2026-05-01', 10.0, 25),
  (DATE '2026-05-01', 20.0, 40), (DATE '2026-05-01', 25.0, 9), (DATE '2026-05-01', 26.0, 2),
  (DATE '2026-05-01', 30.0, 99), (DATE '2026-05-01', 60.0, 50),
  -- June: 300 closed; middle two (150th, 151st) = 13 h
  (DATE '2026-06-01', 4.0, 95), (DATE '2026-06-01', 11.0, 27), (DATE '2026-06-01', 12.0, 27),
  (DATE '2026-06-01', 13.0, 2), (DATE '2026-06-01', 14.0, 25), (DATE '2026-06-01', 15.0, 24),
  (DATE '2026-06-01', 20.0, 50), (DATE '2026-06-01', 30.0, 35), (DATE '2026-06-01', 60.0, 15)
) AS v(m, h, n)
CROSS JOIN LATERAL generate_series(1, v.n) AS g;

-- ---------------------------------------------------------------------------------------
-- 3. Analytics: backlog (level + flows), buckets (poolable), quarter median (from rows).
-- ---------------------------------------------------------------------------------------
CREATE VIEW analytics.ticket_backlog_monthly AS
SELECT
  t.month_start,
  t.starting_open_tickets,
  t.opened_tickets,
  t.closed_tickets,
  t.ending_open_tickets,
  r.median_resolution_hours,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.ticket_months AS t
JOIN core.load_status AS s ON s.subject_area = 'support'
LEFT JOIN (
  SELECT closed_month_start,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY resolution_hours)::numeric(7,1) AS median_resolution_hours
  FROM core.ticket_closures GROUP BY closed_month_start
) AS r ON r.closed_month_start = t.month_start
WHERE t.month_start <= s.complete_through_month;

CREATE VIEW analytics.ticket_resolution_by_bucket_monthly AS
SELECT
  c.closed_month_start AS month_start,
  b.resolution_bucket,
  b.lower_bound_hours,
  b.upper_bound_hours,
  count(c.ticket_key)::integer AS closed_tickets,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM (VALUES ('0 to under 8 h', 0, 8), ('8 to under 16 h', 8, 16), ('16 to under 24 h', 16, 24),
             ('24 to under 48 h', 24, 48), ('48 h or more', 48, NULL))
     AS b(resolution_bucket, lower_bound_hours, upper_bound_hours)
JOIN core.ticket_closures AS c
  ON c.resolution_hours >= b.lower_bound_hours
 AND (b.upper_bound_hours IS NULL OR c.resolution_hours < b.upper_bound_hours)
JOIN core.load_status AS s ON s.subject_area = 'support'
WHERE c.closed_month_start <= s.complete_through_month
GROUP BY 1, 2, 3, 4, 6, 7, 8;

CREATE VIEW analytics.ticket_resolution_quarter AS
SELECT
  date_trunc('quarter', c.closed_month_start)::date                          AS period_start,
  (date_trunc('quarter', c.closed_month_start) + interval '3 months')::date AS period_end_exclusive,
  count(*)::integer                                                          AS closed_tickets,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY c.resolution_hours)::numeric(7,1) AS median_resolution_hours,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.ticket_closures AS c
JOIN core.load_status AS s ON s.subject_area = 'support'
GROUP BY 1, 2, 5, 6, 7
HAVING (date_trunc('quarter', min(c.closed_month_start)) + interval '2 months')::date <= min(s.complete_through_month);

COMMENT ON VIEW analytics.ticket_backlog_monthly IS
  'One row per complete month: open-ticket backlog (level) and flows. Never add backlog across months; never average medians. Definition 1.0.0.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.month_start IS 'First day of the calendar month (the row key).';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.starting_open_tickets IS 'Level: tickets open, pending_customer or reopened at the end of the previous month.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.opened_tickets IS 'Flow: new tickets plus reopenings during the month. Adds across months.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.closed_tickets IS 'Flow: tickets closed during the month. Adds across months.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.ending_open_tickets IS 'Level: the backlog (open + pending_customer + reopened) at the last instant of the month. Never add across months.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.median_resolution_hours IS 'Percentile: median hours from open to close for tickets closed this month. Never average or add; use the quarter view.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.data_loaded_at_utc IS 'When the data was loaded (UTC).';
COMMENT ON COLUMN analytics.ticket_backlog_monthly.quality_status IS 'pass, warn or fail for the load.';

COMMENT ON VIEW analytics.ticket_resolution_by_bucket_monthly IS
  'One row per month and resolution-time bucket; counts add across months, so a median bucket can be found for any period. Definition 1.0.0.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.month_start IS 'First day of the month the tickets were closed.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.resolution_bucket IS 'Bucket label in words; lower bound inclusive, upper bound exclusive.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.lower_bound_hours IS 'Inclusive lower bound of the bucket, hours.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.upper_bound_hours IS 'Exclusive upper bound of the bucket, hours; NULL for the open-ended bucket.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.closed_tickets IS 'Count of tickets closed in the month within the bucket. Adds across months.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.data_loaded_at_utc IS 'When the data was loaded (UTC).';
COMMENT ON COLUMN analytics.ticket_resolution_by_bucket_monthly.quality_status IS 'pass, warn or fail for the load.';

COMMENT ON VIEW analytics.ticket_resolution_quarter IS
  'One row per complete quarter (half-open): median resolution hours computed from every closed ticket. Definition 1.0.0.';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.period_start IS 'First day of the quarter (inclusive).';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.period_end_exclusive IS 'First day after the quarter (exclusive).';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.closed_tickets IS 'Count of tickets closed in the quarter.';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.median_resolution_hours IS 'Percentile: median hours from open to close over all tickets closed in the quarter. Never the average of monthly medians.';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.data_loaded_at_utc IS 'When the data was loaded (UTC).';
COMMENT ON COLUMN analytics.ticket_resolution_quarter.quality_status IS 'pass, warn or fail for the load.';

-- GRANT USAGE ON SCHEMA analytics TO your_reader_login;
-- GRANT SELECT ON analytics.ticket_backlog_monthly, analytics.ticket_resolution_by_bucket_monthly,
--   analytics.ticket_resolution_quarter TO your_reader_login;

-- ---------------------------------------------------------------------------------------
-- 4. Verified questions SUP-G01, SUP-G02 and the counter-examples.
-- ---------------------------------------------------------------------------------------
\echo ''
\echo '== SUP-G01  Open-ticket backlog at each month end, Q2 2026 (approved view) =='
SELECT month_start, ending_open_tickets, opened_tickets, closed_tickets
FROM analytics.ticket_backlog_monthly
WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
ORDER BY month_start;

\echo '== SUP-G02  Median resolution time, Q2 2026, from all closed tickets =='
SELECT period_start, period_end_exclusive, closed_tickets, median_resolution_hours
FROM analytics.ticket_resolution_quarter
WHERE period_start = DATE '2026-04-01';

\echo '== Buckets pooled over Q2: the median ticket (455th / 456th of 910) sits in 8 to under 16 h =='
SELECT resolution_bucket, sum(closed_tickets) AS closed_tickets,
       sum(sum(closed_tickets)) OVER (ORDER BY lower_bound_hours) AS cumulative_tickets
FROM analytics.ticket_resolution_by_bucket_monthly
WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
GROUP BY resolution_bucket, lower_bound_hours ORDER BY lower_bound_hours;

\echo '== COUNTER-EXAMPLE  "open tickets on 30 June" from the export: status = O only =='
SELECT count(*) AS open_tickets_wrong FROM export_lane.tickets WHERE status = 'O';
\echo 'Wrong: pending (P, 22) and reopened (R, 7) tickets are open too. The backlog is 41 + 22 + 7 = 70.'

\echo '== COUNTER-EXAMPLE  "average resolution time in Q2" = average of the avg_res column =='
SELECT round(avg(avg_res), 1) AS q2_resolution_wrong FROM export_lane.support_kpi_monthly;
\echo 'Wrong twice: avg_res holds medians, and medians do not average. The Q2 median of 910 tickets is 14 h.'

DO $check$
DECLARE v text; r numeric; n integer;
BEGIN
  SELECT string_agg(ending_open_tickets::text, '/' ORDER BY month_start) INTO v
  FROM analytics.ticket_backlog_monthly WHERE month_start >= DATE '2026-04-01';
  IF v IS DISTINCT FROM '70/80/70' THEN RAISE EXCEPTION 'SUP-G01 FAIL: got %', v; END IF;
  SELECT sum(opened_tickets) || '/' || sum(closed_tickets) INTO v FROM analytics.ticket_backlog_monthly;
  IF v <> '900/910' THEN RAISE EXCEPTION 'SUP-Q01 FAIL (flows): got %', v; END IF;
  SELECT string_agg(median_resolution_hours::text, '/' ORDER BY month_start) INTO v FROM analytics.ticket_backlog_monthly;
  IF v <> '12.0/26.0/13.0' THEN RAISE EXCEPTION 'SUP-Q02 FAIL (monthly medians): got %', v; END IF;
  SELECT median_resolution_hours, closed_tickets INTO r, n FROM analytics.ticket_resolution_quarter WHERE period_start = DATE '2026-04-01';
  IF r <> 14.0 OR n <> 910 THEN RAISE EXCEPTION 'SUP-G02 FAIL: got % h over % tickets', r, n; END IF;
  SELECT count(*) INTO n FROM export_lane.tickets WHERE status = 'O';
  IF n <> 41 THEN RAISE EXCEPTION 'SUP trap FAIL: got %', n; END IF;
  SELECT count(*) INTO n FROM export_lane.tickets WHERE status <> 'C';
  IF n <> 70 THEN RAISE EXCEPTION 'SUP-Q03 FAIL (export backlog): got %', n; END IF;
  RAISE NOTICE 'SUPPORT BACKLOG CHECKS PASS: 70/80/70; opened 900, closed 910; medians 12/26/13 -> Q2 median 14 h (not 17 h); trap 41';
END
$check$;
