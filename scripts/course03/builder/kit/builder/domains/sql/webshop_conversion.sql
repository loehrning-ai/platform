-- webshop_conversion.sql: order conversion by channel. Pooling rates, distinct counts, time zones.
--
-- In plain words
--   Conversion rate = orders / sessions. Search converts 400 of 20,000 sessions (2 %), email
--   80 of 1,000 (8 %). The export ships only the two rates; the AI averages them to 5.00 %.
--   The shop's real rate is 480 of 21,000 = 2.29 %. Two more traps: unique visitors do not add
--   across days, and an order at 01:30 Berlin time on 1 July happened on 30 June in UTC.
--
-- Run: createdb domain_packs; psql -X -d domain_packs -f domains/sql/webshop_conversion.sql
-- Synthetic data. Reporting time zone: UTC (written by the owner). Clock 2026-07-01 09:00 UTC.

\set ON_ERROR_STOP on
\ir 00_common.sql

-- ---------------------------------------------------------------------------------------
-- 1. Export lane (counter-example): a KPI export with rates and no counts.
-- ---------------------------------------------------------------------------------------
DROP TABLE IF EXISTS export_lane.web_kpis;
CREATE TABLE export_lane.web_kpis (
  month   text,           -- TRAP: '2026-06' as text
  channel text,
  cr      numeric(5,2)    -- TRAP: conversion rate? click rate? And no orders or sessions to pool.
);
INSERT INTO export_lane.web_kpis VALUES ('2026-06', 'search', 2.00), ('2026-06', 'email', 8.00);

-- ---------------------------------------------------------------------------------------
-- 2. Core: one row per UTC day and channel (counts only), plus visitor-days for distinct counts.
-- ---------------------------------------------------------------------------------------
DROP VIEW IF EXISTS analytics.conversion_by_channel_daily;
DROP TABLE IF EXISTS core.channel_days, core.visitor_days;

CREATE TABLE core.channel_days (
  activity_on  date    NOT NULL,     -- UTC calendar day
  channel_name text    NOT NULL CHECK (channel_name IN ('search', 'email')),
  sessions     integer NOT NULL CHECK (sessions >= 0),
  orders       integer NOT NULL CHECK (orders BETWEEN 0 AND sessions),
  PRIMARY KEY (activity_on, channel_name)
);
COMMENT ON TABLE core.channel_days IS
  'One row per UTC day and channel: sessions and orders (counts). Order times converted to UTC before the day is assigned.';

-- June 2026: search 20,000 sessions / 400 orders; email 1,000 sessions / 80 orders,
-- spread evenly over 30 days (each day gets floor(total*d/30) - floor(total*(d-1)/30)).
INSERT INTO core.channel_days
SELECT DATE '2026-06-01' + (d - 1), c.channel_name,
       (c.sessions_total * d / 30) - (c.sessions_total * (d - 1) / 30),
       (c.orders_total   * d / 30) - (c.orders_total   * (d - 1) / 30)
FROM generate_series(1, 30) AS d
CROSS JOIN (VALUES ('search', 20000, 400), ('email', 1000, 80)) AS c(channel_name, sessions_total, orders_total);

CREATE TABLE core.visitor_days (       -- a three-day sample, 1-3 June, for the distinct-count lesson
  visitor_key text NOT NULL,           -- pseudonymous cookie key, never served
  activity_on date NOT NULL,
  PRIMARY KEY (visitor_key, activity_on)
);
COMMENT ON TABLE core.visitor_days IS 'One row per pseudonymous visitor and UTC day seen. Core only.';
-- 1,450 visitors: 450 only on day 1, 300 only on day 2, 450 only on day 3,
-- 100 on days 1+2, 100 on days 2+3, 50 on days 1+3. Daily uniques: 600, 500, 600.
INSERT INTO core.visitor_days
SELECT 'v' || lpad(i::text, 4, '0'), DATE '2026-06-01' + dd
FROM generate_series(1, 1450) AS i
CROSS JOIN LATERAL unnest(CASE
  WHEN i <= 450  THEN ARRAY[0]
  WHEN i <= 750  THEN ARRAY[1]
  WHEN i <= 1200 THEN ARRAY[2]
  WHEN i <= 1300 THEN ARRAY[0, 1]
  WHEN i <= 1400 THEN ARRAY[1, 2]
  ELSE                ARRAY[0, 2] END) AS dd;

-- ---------------------------------------------------------------------------------------
-- 3. Analytics: counts first, the rate next to them.
-- ---------------------------------------------------------------------------------------
CREATE VIEW analytics.conversion_by_channel_daily AS
SELECT
  c.activity_on,
  date_trunc('month', c.activity_on)::date AS month_start,
  c.channel_name,
  c.sessions,
  c.orders,
  round(100.0 * c.orders / NULLIF(c.sessions, 0), 2) AS conversion_rate_pct,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.channel_days AS c
JOIN core.load_status AS s ON s.subject_area = 'web_shop'
WHERE date_trunc('month', c.activity_on)::date <= s.complete_through_month;

COMMENT ON VIEW analytics.conversion_by_channel_daily IS
  'One row per UTC day and channel. Sessions and orders add; the rate never does: pool sum(orders) / sum(sessions). Definition 1.0.0.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.activity_on IS 'UTC calendar day (the row key). Orders are assigned by their UTC time.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.month_start IS 'First day of the UTC month that contains activity_on.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.channel_name IS 'Traffic channel in words: search or email.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.sessions IS 'Denominator: sessions started that day. Adds across days and channels.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.orders IS 'Numerator: orders placed that day. Adds across days and channels.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.conversion_rate_pct IS 'Rate 0-100, 2 decimals: orders / sessions for this row only. Never average; recompute from counts.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.data_loaded_at_utc IS 'When the data was loaded (UTC).';
COMMENT ON COLUMN analytics.conversion_by_channel_daily.quality_status IS 'pass, warn or fail for the load.';

-- GRANT USAGE ON SCHEMA analytics TO your_reader_login;
-- GRANT SELECT ON analytics.conversion_by_channel_daily TO your_reader_login;

-- ---------------------------------------------------------------------------------------
-- 4. Verified question WEB-G01 and the counter-examples.
-- ---------------------------------------------------------------------------------------
\echo ''
\echo '== WEB-G01  June 2026 conversion by channel and in total: pool the counts =='
SELECT coalesce(channel_name, 'all channels') AS channel_name,
       sum(sessions) AS sessions, sum(orders) AS orders,
       round(100.0 * sum(orders) / NULLIF(sum(sessions), 0), 2) AS conversion_rate_pct
FROM analytics.conversion_by_channel_daily
WHERE month_start = DATE '2026-06-01'
GROUP BY ROLLUP (channel_name)
ORDER BY GROUPING(channel_name), sum(sessions) DESC;

\echo '== COUNTER-EXAMPLE  "June conversion" from the export: the two rates averaged =='
SELECT round(avg(cr), 2) AS june_conversion_wrong FROM export_lane.web_kpis WHERE month = '2026-06';
\echo 'Wrong: 1,000 email sessions weigh as much as 20,000 search sessions. Pooled: 480 / 21,000 = 2.29 %.'

\echo '== DISTINCT COUNTS  unique visitors, 1-3 June =='
SELECT (SELECT sum(n) FROM (SELECT count(DISTINCT visitor_key) AS n FROM core.visitor_days GROUP BY activity_on) d) AS sum_of_daily_uniques_wrong,
       (SELECT count(DISTINCT visitor_key) FROM core.visitor_days) AS unique_visitors_three_days;
\echo 'Wrong: 600 + 500 + 600 = 1,700 counts 250 returning visitors twice. Right: 1,450.'

\echo '== TIME ZONE  an order at 01:30 on 1 July in Berlin =='
SELECT (TIMESTAMP '2026-07-01 01:30' AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'UTC' AS ordered_at_utc_shown_as_utc;
\echo 'In UTC this is 30 June, 23:30: a June order. A reader using Berlin local time counts it in July.'

DO $check$
DECLARE r numeric; n integer; t timestamp;
BEGIN
  SELECT round(100.0 * sum(orders) / sum(sessions), 2) INTO r
  FROM analytics.conversion_by_channel_daily WHERE month_start = DATE '2026-06-01';
  IF r <> 2.29 THEN RAISE EXCEPTION 'WEB-G01 FAIL (pooled): got %', r; END IF;
  SELECT sum(sessions) INTO n FROM analytics.conversion_by_channel_daily;
  IF n <> 21000 THEN RAISE EXCEPTION 'WEB-G01 FAIL (sessions): got %', n; END IF;
  SELECT sum(orders) INTO n FROM analytics.conversion_by_channel_daily;
  IF n <> 480 THEN RAISE EXCEPTION 'WEB-G01 FAIL (orders): got %', n; END IF;
  SELECT round(avg(cr), 2) INTO r FROM export_lane.web_kpis;
  IF r <> 5.00 THEN RAISE EXCEPTION 'WEB trap FAIL: got %', r; END IF;
  SELECT count(DISTINCT visitor_key) INTO n FROM core.visitor_days;
  IF n <> 1450 THEN RAISE EXCEPTION 'WEB-Q01 FAIL (distinct): got %', n; END IF;
  SELECT sum(c) INTO n FROM (SELECT count(*) AS c FROM core.visitor_days GROUP BY activity_on) x;
  IF n <> 1700 THEN RAISE EXCEPTION 'WEB-Q01 FAIL (daily sum): got %', n; END IF;
  t := (TIMESTAMP '2026-07-01 01:30' AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'UTC';
  IF t <> TIMESTAMP '2026-06-30 23:30' THEN RAISE EXCEPTION 'WEB-Q02 FAIL (time zone): got %', t; END IF;
  RAISE NOTICE 'WEB SHOP CHECKS PASS: pooled 2.29 %% (480 / 21,000); trap 5.00; uniques 1,450 vs 1,700; 23:30 UTC on 30 June';
END
$check$;
