-- people_headcount.sql: workforce by department. A rate with a definitional fork, plus privacy.
--
-- In plain words
--   Headcount at month end is a LEVEL. Hires minus leavers is the CHANGE. Attrition is a RATE:
--   leavers divided by a base. Which base? Write it down: 19 / 200 = 9.5 % (headcount at the
--   start) and 19 / 203.5 = 9.34 % (average headcount) are both "attrition". The export gives
--   the AI a monthly rate column; it averages three months and reports 3.12 % for the quarter.
--   People data also needs a privacy rule: no person rows, and no group smaller than 5.
--
-- Run: createdb domain_packs; psql -X -d domain_packs -f domains/sql/people_headcount.sql
-- Synthetic data: no real people. Evaluation clock 2026-07-01 09:00 UTC.

\set ON_ERROR_STOP on
\ir 00_common.sql

-- ---------------------------------------------------------------------------------------
-- 1. Export lane (counter-example): company-level monthly KPI export.
-- ---------------------------------------------------------------------------------------
DROP TABLE IF EXISTS export_lane.hc_monthly;
CREATE TABLE export_lane.hc_monthly (
  dt        date,           -- TRAP: first day of the month? last day? report day?
  hc        integer,        -- TRAP: headcount at month end (a level), abbreviated
  attrition numeric(5,2)    -- TRAP: that MONTH's leavers / headcount at month start, in percent
);
INSERT INTO export_lane.hc_monthly VALUES
  (DATE '2026-04-01', 206, 2.00),   -- 4 leavers / 200
  (DATE '2026-05-01', 202, 2.91),   -- 6 leavers / 206
  (DATE '2026-06-01', 206, 4.46);   -- 9 leavers / 202

-- ---------------------------------------------------------------------------------------
-- 2. Core: one row per reporting department and month. Person rows stay in the HR system.
--    Departments with fewer than 5 people are merged into 'Other departments' HERE,
--    before anything is served (Finance 16 + Legal 4 = 20 at the end of March).
-- ---------------------------------------------------------------------------------------
DROP VIEW IF EXISTS analytics.attrition_by_department_quarter;
DROP VIEW IF EXISTS analytics.workforce_by_department_monthly;
DROP TABLE IF EXISTS core.department_months;

CREATE TABLE core.department_months (
  department_name    text    NOT NULL,
  month_start        date    NOT NULL CHECK (extract(day FROM month_start) = 1),
  starting_headcount integer NOT NULL CHECK (starting_headcount >= 0),
  hires              integer NOT NULL CHECK (hires >= 0),
  leavers            integer NOT NULL CHECK (leavers >= 0),
  voluntary_leavers  integer NOT NULL CHECK (voluntary_leavers BETWEEN 0 AND leavers),
  ending_headcount   integer NOT NULL CHECK (ending_headcount >= 0),
  PRIMARY KEY (department_name, month_start),
  CONSTRAINT bathtub_identity CHECK (starting_headcount + hires - leavers = ending_headcount)
);
COMMENT ON TABLE core.department_months IS
  'One row per reporting department and month. Built from person-level HR records; groups under 5 merged.';

INSERT INTO core.department_months VALUES
  -- department           month              start hires leavers voluntary end
  ('Engineering',       DATE '2026-04-01',  80, 4, 1, 1,  83),
  ('Sales',             DATE '2026-04-01',  60, 3, 2, 1,  61),
  ('Customer Support',  DATE '2026-04-01',  40, 2, 1, 1,  41),
  ('Other departments', DATE '2026-04-01',  20, 1, 0, 0,  21),
  ('Engineering',       DATE '2026-05-01',  83, 1, 2, 1,  82),
  ('Sales',             DATE '2026-05-01',  61, 0, 2, 2,  59),
  ('Customer Support',  DATE '2026-05-01',  41, 1, 1, 1,  41),
  ('Other departments', DATE '2026-05-01',  21, 0, 1, 1,  20),
  ('Engineering',       DATE '2026-06-01',  82, 5, 3, 2,  84),
  ('Sales',             DATE '2026-06-01',  59, 4, 3, 2,  60),
  ('Customer Support',  DATE '2026-06-01',  41, 3, 2, 1,  42),
  ('Other departments', DATE '2026-06-01',  20, 1, 1, 1,  20);
-- Assumption written by the owner: none of the 25 Q2 hires left in Q2, so all 19 leavers
-- were in the starting base. If one had, core would count them in leavers but not in
-- leavers_from_starting_headcount, and the quarter view would use the second column.

-- ---------------------------------------------------------------------------------------
-- 3. Analytics: a monthly view (level + change) and a quarter view (the rate + its counts).
-- ---------------------------------------------------------------------------------------
CREATE VIEW analytics.workforce_by_department_monthly AS
SELECT
  d.month_start,
  d.department_name,
  d.starting_headcount,
  d.hires,
  d.leavers,
  d.voluntary_leavers,
  d.hires - d.leavers AS net_change_headcount,
  d.ending_headcount,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.department_months AS d
JOIN core.load_status AS s ON s.subject_area = 'workforce'
WHERE d.month_start <= s.complete_through_month;

CREATE VIEW analytics.attrition_by_department_quarter AS
WITH q AS (
  SELECT
    date_trunc('quarter', d.month_start)::date AS period_start,
    d.department_name,
    (array_agg(d.starting_headcount ORDER BY d.month_start))[1] AS starting_headcount,
    sum(d.leavers)::integer            AS leavers,
    sum(d.voluntary_leavers)::integer  AS voluntary_leavers,
    count(*)                           AS months_in_period
  FROM core.department_months AS d
  GROUP BY 1, 2
)
SELECT
  q.period_start,
  (q.period_start + interval '3 months')::date AS period_end_exclusive,
  q.department_name,
  q.starting_headcount,
  q.leavers,
  q.voluntary_leavers,
  round(100.0 * q.leavers / NULLIF(q.starting_headcount, 0), 1) AS attrition_rate_pct,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM q
JOIN core.load_status AS s ON s.subject_area = 'workforce'
WHERE q.months_in_period = 3                                         -- complete quarters only
  AND (q.period_start + interval '2 months')::date <= s.complete_through_month;

COMMENT ON VIEW analytics.workforce_by_department_monthly IS
  'One row per reporting department (5 or more people) and complete month. Headcount is a level: never add across months. Definition 1.0.0.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.month_start IS 'First day of the calendar month (the row key).';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.department_name IS 'Reporting department; groups under 5 people are merged into Other departments.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.starting_headcount IS 'Level: people employed at the end of the previous month. Never add across months.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.hires IS 'Change: people who joined during the month. Adds across months.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.leavers IS 'Change: people whose last day fell in the month. Adds across months.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.voluntary_leavers IS 'Change: leavers who resigned (subset of leavers). Adds across months.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.net_change_headcount IS 'Change: hires - leavers. Adds across months. Never a level.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.ending_headcount IS 'Level: people employed at the last instant of the month. Never add across months.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.data_loaded_at_utc IS 'When the data was loaded (UTC).';
COMMENT ON COLUMN analytics.workforce_by_department_monthly.quality_status IS 'pass, warn or fail for the load.';

COMMENT ON VIEW analytics.attrition_by_department_quarter IS
  'One row per reporting department and complete quarter; half-open period. Rate ships with its counts. Never average rates. Definition 1.0.0.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.period_start IS 'First day of the quarter (inclusive).';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.period_end_exclusive IS 'First day after the quarter (exclusive).';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.department_name IS 'Reporting department; groups under 5 people are merged into Other departments.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.starting_headcount IS 'Denominator: people employed the day before period_start. Joiners in the period are excluded.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.leavers IS 'Numerator: leavers in the period who were in the starting headcount.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.voluntary_leavers IS 'Subset of leavers who resigned.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.attrition_rate_pct IS 'Rate 0-100, 1 decimal: leavers / starting_headcount. NULL when the base is 0. Pool counts; never average.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.data_loaded_at_utc IS 'When the data was loaded (UTC).';
COMMENT ON COLUMN analytics.attrition_by_department_quarter.quality_status IS 'pass, warn or fail for the load.';

-- GRANT USAGE ON SCHEMA analytics TO your_reader_login;
-- GRANT SELECT ON analytics.workforce_by_department_monthly, analytics.attrition_by_department_quarter TO your_reader_login;

-- ---------------------------------------------------------------------------------------
-- 4. Verified question HC-G01 and the counter-examples.
-- ---------------------------------------------------------------------------------------
\echo ''
\echo '== HC-G01  Company attrition, Q2 2026: pool the counts (approved view) =='
SELECT sum(starting_headcount) AS starting_headcount,
       sum(leavers)            AS leavers,
       round(100.0 * sum(leavers) / NULLIF(sum(starting_headcount), 0), 1) AS attrition_rate_pct
FROM analytics.attrition_by_department_quarter
WHERE period_start = DATE '2026-04-01' AND period_end_exclusive = DATE '2026-07-01';

\echo '== HC-G02  Month-end headcount, company, Q2 2026 (levels add across departments, not months) =='
SELECT month_start, sum(ending_headcount) AS ending_headcount, sum(hires) AS hires, sum(leavers) AS leavers
FROM analytics.workforce_by_department_monthly
WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
GROUP BY month_start ORDER BY month_start;

\echo '== FORK  The other base: average headcount (200 + 206 + 202 + 206) / 4 = 203.5 =='
SELECT round(100.0 * 19 / ((200 + 206 + 202 + 206) / 4.0), 2) AS attrition_avg_base_pct;
\echo 'Not wrong, but a different metric. The owner picks one base and writes it in metric.yml.'

\echo '== COUNTER-EXAMPLE  "Q2 attrition" as the average of the monthly export column =='
SELECT round(avg(attrition), 2) AS q2_attrition_wrong FROM export_lane.hc_monthly;
\echo 'Wrong: three monthly rates averaged give a MONTHLY rate (3.12 %), reported as the quarter. Q2 is 19 / 200 = 9.5 %.'

\echo '== COUNTER-EXAMPLE  average of department rates (unequal bases) =='
SELECT round(avg(attrition_rate_pct), 2) AS avg_department_rate_wrong
FROM analytics.attrition_by_department_quarter WHERE period_start = DATE '2026-04-01';
\echo 'Wrong: 7.5, 11.7, 10.0 and 10.0 weigh 80, 60, 40 and 20 people equally. Pooled: 9.5 %.'

DO $check$
DECLARE r numeric; v text; n integer;
BEGIN
  SELECT round(100.0 * sum(leavers) / sum(starting_headcount), 1) INTO r
  FROM analytics.attrition_by_department_quarter WHERE period_start = DATE '2026-04-01';
  IF r <> 9.5 THEN RAISE EXCEPTION 'HC-G01 FAIL: got %', r; END IF;

  SELECT string_agg(t::text, '/' ORDER BY m) INTO v FROM (
    SELECT month_start AS m, sum(ending_headcount) AS t FROM analytics.workforce_by_department_monthly
    GROUP BY month_start) x;
  IF v IS DISTINCT FROM '206/202/206' THEN RAISE EXCEPTION 'HC-G02 FAIL: got %', v; END IF;

  SELECT sum(hires) || '/' || sum(leavers) INTO v FROM analytics.workforce_by_department_monthly;
  IF v <> '25/19' THEN RAISE EXCEPTION 'HC-Q01 FAIL (hires/leavers): got %', v; END IF;

  SELECT min(starting_headcount) INTO n FROM analytics.workforce_by_department_monthly;
  IF n < 5 THEN RAISE EXCEPTION 'HC-P01 FAIL: a served group has % people (minimum 5)', n; END IF;

  SELECT round(avg(attrition), 2) INTO r FROM export_lane.hc_monthly;
  IF r <> 3.12 THEN RAISE EXCEPTION 'HC trap FAIL: got %', r; END IF;

  RAISE NOTICE 'PEOPLE HEADCOUNT CHECKS PASS: 9.5 %%; 206/202/206; hires 25, leavers 19; min group 20; trap 3.12';
END
$check$;
