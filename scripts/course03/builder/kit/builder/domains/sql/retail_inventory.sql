-- retail_inventory.sql: bike shop, helmets category. A level / change pack.
--
-- In plain words
--   Helmets on hand at month end is a LEVEL (water in the tub). Received minus sold is the
--   CHANGE (what flowed in or out). Sell-through is a RATE and is recomputed from counts.
--   The export gives the AI one column called qty and a timestamp. It adds three month-ends
--   and says "Q2 stock = 315". This file builds the fix and shows both answers.
--
-- Run: createdb domain_packs; psql -X -d domain_packs -f domains/sql/retail_inventory.sql
-- Synthetic data. Evaluation clock 2026-07-01 09:00 UTC. Last complete quarter: Q2 2026.

\set ON_ERROR_STOP on
\ir 00_common.sql

-- ---------------------------------------------------------------------------------------
-- 1. Export lane (counter-example). Generic names, no comments, mixed meanings.
-- ---------------------------------------------------------------------------------------
DROP TABLE IF EXISTS export_lane.inv_export, export_lane.stock_moves;

CREATE TABLE export_lane.inv_export (   -- TRAP: one row per store, category and month-end count
  loc text,                             -- TRAP: store? warehouse? shelf?
  cat text,
  qty integer,                          -- TRAP: a level that looks like a flow
  ts  timestamp                         -- TRAP: a timestamp without zone on a month-end snapshot
);
INSERT INTO export_lane.inv_export VALUES
  ('HBR', 'HLM', 120, '2026-03-31 23:59'), ('HBR', 'HLM', 110, '2026-04-30 23:59'),
  ('HBR', 'HLM',  95, '2026-05-31 23:59'), ('HBR', 'HLM', 110, '2026-06-30 23:59'),
  ('MKT', 'HLM',  35, '2026-03-31 23:59'), ('MKT', 'HLM',  38, '2026-04-30 23:59'),
  ('MKT', 'HLM',  36, '2026-05-31 23:59'), ('MKT', 'HLM',  40, '2026-06-30 23:59');

CREATE TABLE export_lane.stock_moves (  -- TRAP: qty is positive for receipts AND sales
  loc  text,
  cat  text,
  qty  integer,
  type text,                            -- TRAP: 'R' received, 'S' sold; never written down
  ts   timestamp
);
INSERT INTO export_lane.stock_moves VALUES
  ('HBR', 'HLM', 50, 'R', '2026-04-15 10:00'), ('HBR', 'HLM', 60, 'S', '2026-04-30 18:00'),
  ('HBR', 'HLM', 45, 'R', '2026-05-15 10:00'), ('HBR', 'HLM', 60, 'S', '2026-05-31 18:00'),
  ('HBR', 'HLM', 85, 'R', '2026-06-15 10:00'), ('HBR', 'HLM', 70, 'S', '2026-06-30 18:00');

-- ---------------------------------------------------------------------------------------
-- 2. Core: one row per store, category and month. The bathtub identity is a constraint.
-- ---------------------------------------------------------------------------------------
DROP VIEW IF EXISTS analytics.inventory_by_store_category_monthly;
DROP TABLE IF EXISTS core.stock_months;

CREATE TABLE core.stock_months (
  store_name             text    NOT NULL,
  category_name          text    NOT NULL,
  month_start            date    NOT NULL CHECK (extract(day FROM month_start) = 1),
  starting_units_on_hand integer NOT NULL CHECK (starting_units_on_hand >= 0),
  received_units         integer NOT NULL CHECK (received_units >= 0),
  sold_units             integer NOT NULL CHECK (sold_units >= 0),
  adjusted_units         integer NOT NULL DEFAULT 0,   -- signed stock-count correction
  ending_units_on_hand   integer NOT NULL CHECK (ending_units_on_hand >= 0),
  PRIMARY KEY (store_name, category_name, month_start),
  CONSTRAINT bathtub_identity CHECK (
    starting_units_on_hand + received_units - sold_units + adjusted_units = ending_units_on_hand)
);
COMMENT ON TABLE core.stock_months IS
  'One row per store, category and calendar month. Decoded from inv_export (levels) and stock_moves (flows).';

INSERT INTO core.stock_months VALUES
  ('Harbour', 'Helmets', DATE '2026-03-01', 130, 40, 50, 0, 120),
  ('Harbour', 'Helmets', DATE '2026-04-01', 120, 50, 60, 0, 110),
  ('Harbour', 'Helmets', DATE '2026-05-01', 110, 45, 60, 0,  95),
  ('Harbour', 'Helmets', DATE '2026-06-01',  95, 85, 70, 0, 110),
  ('Market',  'Helmets', DATE '2026-03-01',  30, 20, 15, 0,  35),
  ('Market',  'Helmets', DATE '2026-04-01',  35, 20, 17, 0,  38),
  ('Market',  'Helmets', DATE '2026-05-01',  38, 15, 17, 0,  36),
  ('Market',  'Helmets', DATE '2026-06-01',  36, 22, 18, 0,  40);

-- ---------------------------------------------------------------------------------------
-- 3. Analytics: the approved view. Level and change side by side; the rate ships with
--    its numerator and denominator; the data-state columns are on every row.
-- ---------------------------------------------------------------------------------------
CREATE VIEW analytics.inventory_by_store_category_monthly AS
SELECT
  m.month_start,
  m.store_name,
  m.category_name,
  m.starting_units_on_hand,
  m.received_units,
  m.sold_units,
  m.adjusted_units,
  m.received_units - m.sold_units + m.adjusted_units              AS net_change_units,
  m.ending_units_on_hand,
  m.starting_units_on_hand + m.received_units                     AS available_units,
  round(100.0 * m.sold_units
        / NULLIF(m.starting_units_on_hand + m.received_units, 0), 1) AS sell_through_pct,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.stock_months AS m
JOIN core.load_status  AS s ON s.subject_area = 'inventory'
WHERE m.month_start <= s.complete_through_month;

COMMENT ON VIEW analytics.inventory_by_store_category_monthly IS
  'One row per store, category and complete month; units. Levels (on hand) never add across months. Definition 1.0.0.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.month_start IS 'First day of the calendar month (the row key).';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.store_name IS 'Store in words. Levels add across stores for the same month.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.category_name IS 'Product category in words.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.starting_units_on_hand IS 'Level: units on hand at the end of the previous month. Never add across months.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.received_units IS 'Change: units received during the month. Adds across months.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.sold_units IS 'Change: units sold during the month, stored positive. Adds across months.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.adjusted_units IS 'Change: signed stock-count correction during the month. Adds across months.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.net_change_units IS 'Change: received - sold + adjusted. Adds across months. Never a level.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.ending_units_on_hand IS 'Level: units on hand at the last instant of the month. Never add across months.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.available_units IS 'Sell-through denominator: starting on hand + received. Recompute for longer periods.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.sell_through_pct IS 'Rate 0-100: sold / (starting + received). Never average across months; recompute from counts.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.complete_through_month IS 'Last complete month in the load.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.data_loaded_at_utc IS 'When the data was loaded (UTC). Age is computed against a stated clock.';
COMMENT ON COLUMN analytics.inventory_by_store_category_monthly.quality_status IS 'pass, warn or fail for the load.';

-- GRANT USAGE ON SCHEMA analytics TO your_reader_login;
-- GRANT SELECT ON analytics.inventory_by_store_category_monthly TO your_reader_login;

-- ---------------------------------------------------------------------------------------
-- 4. Verified question INV-G01 and the counter-examples, side by side.
-- ---------------------------------------------------------------------------------------
\echo ''
\echo '== INV-G01  Helmets on hand at month end, Harbour store, Q2 2026 (approved view) =='
SELECT month_start, ending_units_on_hand, net_change_units
FROM analytics.inventory_by_store_category_monthly
WHERE store_name = 'Harbour' AND category_name = 'Helmets'
  AND month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
ORDER BY month_start;

\echo '== INV-G02  Q2 sell-through, recomputed from counts (approved view) =='
SELECT sum(sold_units) AS sold_units,
       (array_agg(starting_units_on_hand ORDER BY month_start))[1] + sum(received_units) AS available_units,
       round(100.0 * sum(sold_units)
             / ((array_agg(starting_units_on_hand ORDER BY month_start))[1] + sum(received_units)), 1) AS sell_through_pct
FROM analytics.inventory_by_store_category_monthly
WHERE store_name = 'Harbour' AND category_name = 'Helmets'
  AND month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01';

\echo '== COUNTER-EXAMPLE  "Q2 stock" from the export: three month-end levels added =='
SELECT sum(qty) AS q2_stock_wrong
FROM export_lane.inv_export
WHERE loc = 'HBR' AND cat = 'HLM' AND ts >= '2026-04-01' AND ts < '2026-07-01';
\echo 'Wrong: 110 + 95 + 110 = 315 helmets never existed at once. The shelf held 110 on 30 June.'

\echo '== COUNTER-EXAMPLE  "net movement" from the export: qty is positive for R and S =='
SELECT sum(qty) AS net_movement_wrong FROM export_lane.stock_moves WHERE loc = 'HBR' AND cat = 'HLM';
\echo 'Wrong: 180 received + 190 sold = 370. The true net change is 180 - 190 = -10 (120 -> 110).'

\echo '== COUNTER-EXAMPLE  average of monthly sell-through rates =='
SELECT round(avg(sell_through_pct), 1) AS avg_monthly_sell_through_wrong
FROM analytics.inventory_by_store_category_monthly
WHERE store_name = 'Harbour' AND month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01';
\echo 'Wrong for the quarter: monthly rates use monthly bases. Q2 is 190 / 300 = 63.3 %.'

DO $check$
DECLARE v text; r numeric;
BEGIN
  SELECT string_agg(ending_units_on_hand::text, '/' ORDER BY month_start) INTO v
  FROM analytics.inventory_by_store_category_monthly
  WHERE store_name = 'Harbour' AND category_name = 'Helmets'
    AND month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01';
  IF v IS DISTINCT FROM '110/95/110' THEN RAISE EXCEPTION 'INV-G01 FAIL: got %', v; END IF;

  -- Recompute the quarter from the view's own counts: sold / (level at the start + received).
  SELECT format('%s sold of %s available = %s %%', sold, available, round(100.0 * sold / nullif(available, 0), 1))
  INTO v
  FROM (
    SELECT sum(sold_units) AS sold,
           (array_agg(starting_units_on_hand ORDER BY month_start))[1] + sum(received_units) AS available
    FROM analytics.inventory_by_store_category_monthly
    WHERE store_name = 'Harbour' AND category_name = 'Helmets'
      AND month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
  ) q;
  IF v IS DISTINCT FROM '190 sold of 300 available = 63.3 %' THEN RAISE EXCEPTION 'INV-G02 FAIL: got %', v; END IF;

  SELECT sum(ending_units_on_hand) INTO r FROM analytics.inventory_by_store_category_monthly
  WHERE category_name = 'Helmets' AND month_start = DATE '2026-06-01';
  IF r <> 150 THEN RAISE EXCEPTION 'INV-Q01 FAIL (stores add at one month-end): got %', r; END IF;

  RAISE NOTICE 'RETAIL INVENTORY CHECKS PASS: 110/95/110; sell-through 63.3; both stores on 30 Jun = 150';
END
$check$;
