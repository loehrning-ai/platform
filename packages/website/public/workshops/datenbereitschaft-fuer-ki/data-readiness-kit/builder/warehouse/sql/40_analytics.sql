--
-- 40_analytics.sql: the ANALYTICS layer. The five approved views. The only thing the AI sees.
--
-- In plain words
--   This is the pass in a restaurant kitchen: finished plates, cut to the question.
--   Each view answers one family of questions at one grain ("rows per what?"):
--     analytics.mrr_summary_monthly              one row per month          (ending MRR, net new MRR)
--     analytics.logo_churn_by_segment_quarter    one row per quarter+segment (logo churn rate)
--     analytics.expansion_mrr_by_country_monthly one row per month+country   (expansion MRR)
--     analytics.account_mrr_monthly              one row per account+month   (top accounts)
--     analytics.data_status_by_view              one row per view            (how old is the data?)
--   The workshop question "Show ending MRR by month for the last complete quarter" is
--   answered by the first view: 334,675 / 344,450 / 387,015.
--
-- Design rules used here (SERVING-VIEWS.md explains each with a counter-example)
--   - The grain is in the name (_monthly, _by_segment_quarter) and in the key.
--   - Units are in the column name (_eur, _pct). Money is numeric, never float.
--   - Levels and changes sit side by side: ending_mrr_eur and net_new_mrr_eur.
--   - A rate ships with its numerator and denominator (churned_accounts, starting_accounts).
--   - Every row carries its data state: complete_through_month, data_loaded_at_utc, quality_status.
--   - Complete periods only. Periods are half-open: period_start <= day < period_end_exclusive.
--   - No direct identifiers. account_key is pseudonymous (fl_0006), not anonymous.
--   - No now(): age is computed by the caller against a stated clock.
--   - Every object name is schema-qualified. The recorded run leaned on search_path; this does not.
--
-- For builders
--   - Views are owned by foldline_owner (NOLOGIN) and run with the owner's rights, so the AI
--     login needs SELECT on these five views and nothing in core.
--   - COMMENT ON carries 'definition 1.0.0'. Test Q06 checks it. The comment is a compiled
--     copy of semantic/metric.yml for catalog readers; it is not proof that anyone read it.
--
\set ON_ERROR_STOP on
SET client_min_messages = warning;
SET ROLE foldline_owner;                  -- everything below is created and owned by the owner role
DROP SCHEMA IF EXISTS analytics CASCADE;
CREATE SCHEMA analytics;
COMMENT ON SCHEMA analytics IS 'Layer 3 of 3. The five approved views for people and AI tools. definition 1.0.0. No direct identifiers.';

-- -------------------------------------------------------------------------------------
-- 1. analytics.mrr_summary_monthly: one row per complete month, company level.
-- -------------------------------------------------------------------------------------
CREATE VIEW analytics.mrr_summary_monthly AS
SELECT
  m.month_start,
  sum(m.ending_mrr_eur)::numeric(14, 2)                                                        AS ending_mrr_eur,
  coalesce(sum(m.ending_mrr_eur)    FILTER (WHERE m.movement_type = 'new'), 0)::numeric(14, 2)         AS new_mrr_eur,
  coalesce(sum(m.net_new_mrr_eur)   FILTER (WHERE m.movement_type = 'expansion'), 0)::numeric(14, 2)   AS expansion_mrr_eur,
  coalesce(-sum(m.net_new_mrr_eur)  FILTER (WHERE m.movement_type = 'contraction'), 0)::numeric(14, 2) AS contraction_mrr_eur,
  coalesce(sum(m.starting_mrr_eur)  FILTER (WHERE m.movement_type = 'churn'), 0)::numeric(14, 2)       AS churned_mrr_eur,
  sum(m.net_new_mrr_eur)::numeric(14, 2)                                                       AS net_new_mrr_eur,
  (count(*) FILTER (WHERE m.ending_mrr_eur > 0))::integer                                      AS active_accounts,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.account_months AS m
CROSS JOIN core.load_status AS s
WHERE m.month_start <= s.complete_through_month                 -- complete months only
GROUP BY m.month_start, s.complete_through_month, s.data_loaded_at_utc, s.quality_status;
-- Counter-example: public.monthly_revenue(dt, segment, amount). Same numbers as net_new_mrr_eur,
-- but named like a total and with no level beside it. An AI read it as ending MRR: -19,960.

COMMENT ON VIEW analytics.mrr_summary_monthly IS 'One row per complete calendar month, company level, EUR. Ending MRR (a level) beside its movements (changes). definition 1.0.0. Never add ending_mrr_eur across months.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.month_start IS 'First day of the calendar month (UTC). The grain: one row per month.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.ending_mrr_eur IS 'Level: recurring value active at the final instant of the month, EUR. Never sum across months; for a quarter return each month or the last month.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.new_mrr_eur IS 'Change component: value of accounts that started this month, EUR. Adds across months.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.expansion_mrr_eur IS 'Change component: increases on existing accounts, EUR, positive. Adds across months.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.contraction_mrr_eur IS 'Change component: decreases on accounts that stayed, EUR, stored positive. Adds across months.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.churned_mrr_eur IS 'Change component: previous value of accounts that left, EUR, stored positive. Adds across months.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.net_new_mrr_eur IS 'Change: new + expansion - contraction - churned, EUR. Adds across months; never read it as a level.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.active_accounts IS 'Distinct count of accounts with ending MRR above 0 at month end. Never add across months.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.complete_through_month IS 'Data state: latest month that is complete and approved for answers.';
COMMENT ON COLUMN analytics.mrr_summary_monthly.data_loaded_at_utc IS 'Data state: when the load behind this row finished (UTC). Compare with a stated clock, never with now().';
COMMENT ON COLUMN analytics.mrr_summary_monthly.quality_status IS 'Data state: passing or failing. Refuse to answer from a failing load.';

-- -------------------------------------------------------------------------------------
-- 2. analytics.logo_churn_by_segment_quarter: one row per complete quarter and segment.
--    Base = accounts active at the end of the month BEFORE the quarter. Joiners excluded.
-- -------------------------------------------------------------------------------------
CREATE VIEW analytics.logo_churn_by_segment_quarter AS
WITH quarters AS (
  SELECT DISTINCT date_trunc('quarter', month_start)::date AS period_start
  FROM core.account_months
), bounds AS (
  SELECT period_start,
         (period_start + interval '3 months')::date AS period_end_exclusive,
         (period_start - interval '1 month')::date  AS base_month,      -- month-end before the quarter
         (period_start + interval '2 months')::date AS last_month       -- last month-end in the quarter
  FROM quarters
)
SELECT
  b.period_start,
  b.period_end_exclusive,
  a.customer_segment,
  count(*)::integer                                           AS starting_accounts,  -- denominator
  (count(*) FILTER (WHERE e.ending_mrr_eur = 0))::integer     AS churned_accounts,   -- numerator
  round(100.0 * count(*) FILTER (WHERE e.ending_mrr_eur = 0)
        / nullif(count(*), 0), 1)::numeric(5, 1)              AS logo_churn_rate_pct, -- 0/0 is NULL, never 0 %
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM bounds AS b
CROSS JOIN core.load_status AS s
JOIN core.account_months AS st ON st.month_start = b.base_month AND st.ending_mrr_eur > 0
JOIN core.account_months AS e  ON e.account_id = st.account_id AND e.month_start = b.last_month
JOIN core.accounts       AS a  ON a.account_id = st.account_id
WHERE b.last_month <= s.complete_through_month                  -- complete quarters only
GROUP BY b.period_start, b.period_end_exclusive, a.customer_segment,
         s.complete_through_month, s.data_loaded_at_utc, s.quality_status;
-- Counter-example: count 'C' over every row in customer_master. The base then includes the
-- 8 accounts that joined during the quarter: 4 of 48 = 8.33 % instead of 4 of 40 = 10.0 %.

COMMENT ON VIEW analytics.logo_churn_by_segment_quarter IS 'One row per complete quarter and customer segment. Logo churn rate with its numerator and denominator. definition 1.0.0. Never average the rate across segments or quarters; recompute from the counts.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.period_start IS 'First day of the quarter (inclusive).';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.period_end_exclusive IS 'First day after the quarter (exclusive). Filter with period_start <= day < period_end_exclusive.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.customer_segment IS 'Enterprise, Mid-Market or SMB.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.starting_accounts IS 'Denominator: accounts active at the end of the month before the quarter. Accounts that joined during the quarter are excluded.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.churned_accounts IS 'Numerator: starting accounts with zero MRR at the last month-end of the quarter.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.logo_churn_rate_pct IS 'Rate: 100 * churned / starting, 0-100, one decimal. NULL when starting is 0. Never average; recompute from the counts.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.complete_through_month IS 'Data state: latest month that is complete and approved for answers.';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.data_loaded_at_utc IS 'Data state: when the load behind this row finished (UTC).';
COMMENT ON COLUMN analytics.logo_churn_by_segment_quarter.quality_status IS 'Data state: passing or failing.';

-- -------------------------------------------------------------------------------------
-- 3. analytics.expansion_mrr_by_country_monthly: dense month x country grid, zeros explicit.
-- -------------------------------------------------------------------------------------
CREATE VIEW analytics.expansion_mrr_by_country_monthly AS
WITH months AS (
  SELECT DISTINCT month_start FROM core.account_months
), countries AS (
  SELECT DISTINCT country_code FROM core.accounts
), expansion AS (
  SELECT m.month_start, a.country_code, sum(m.net_new_mrr_eur) AS expansion_mrr_eur
  FROM core.account_months AS m
  JOIN core.accounts AS a ON a.account_id = m.account_id
  WHERE m.movement_type = 'expansion'
  GROUP BY m.month_start, a.country_code
)
SELECT
  mo.month_start,
  c.country_code,
  coalesce(x.expansion_mrr_eur, 0)::numeric(14, 2) AS expansion_mrr_eur,   -- a real zero, not a missing row
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM months AS mo
CROSS JOIN countries AS c
CROSS JOIN core.load_status AS s
LEFT JOIN expansion AS x ON x.month_start = mo.month_start AND x.country_code = c.country_code
WHERE mo.month_start <= s.complete_through_month;
-- Counter-example: sum billing_events where type = 'E'. Retry copies count twice (AT 1,955 vs 1,565),
-- and a country with no expansion simply has no row, which reads as "unknown" rather than 0.

COMMENT ON VIEW analytics.expansion_mrr_by_country_monthly IS 'One row per complete month and country (dense: 18 x 8 = 144 rows, zeros explicit). Expansion MRR in EUR. definition 1.0.0. Never compare with billing_events sums, which contain retry duplicates.';
COMMENT ON COLUMN analytics.expansion_mrr_by_country_monthly.month_start IS 'First day of the calendar month (UTC).';
COMMENT ON COLUMN analytics.expansion_mrr_by_country_monthly.country_code IS 'ISO 3166-1 alpha-2 country of the account.';
COMMENT ON COLUMN analytics.expansion_mrr_by_country_monthly.expansion_mrr_eur IS 'Change: increases on existing accounts in the month, EUR, 0 when none. Adds across months and countries.';
COMMENT ON COLUMN analytics.expansion_mrr_by_country_monthly.complete_through_month IS 'Data state: latest month that is complete and approved for answers.';
COMMENT ON COLUMN analytics.expansion_mrr_by_country_monthly.data_loaded_at_utc IS 'Data state: when the load behind this row finished (UTC).';
COMMENT ON COLUMN analytics.expansion_mrr_by_country_monthly.quality_status IS 'Data state: passing or failing.';

-- -------------------------------------------------------------------------------------
-- 4. analytics.account_mrr_monthly: one row per account and month (dense, 2,592 rows).
--    Pseudonymous account_key only. Callers must use LIMIT (policy: 1000 rows or fewer).
-- -------------------------------------------------------------------------------------
CREATE VIEW analytics.account_mrr_monthly AS
SELECT
  m.month_start,
  a.account_key,
  a.customer_segment,
  a.country_code,
  a.plan_name,
  m.ending_mrr_eur::numeric(14, 2) AS ending_mrr_eur,
  s.complete_through_month,
  s.data_loaded_at_utc,
  s.quality_status
FROM core.account_months AS m
JOIN core.accounts AS a ON a.account_id = m.account_id
CROSS JOIN core.load_status AS s
WHERE m.month_start <= s.complete_through_month;
-- Counter-example: SELECT * FROM core.accounts. It carries account_name and contact_email,
-- and account_id is the number every other system uses. That is test D01: denied with 42501.

COMMENT ON VIEW analytics.account_mrr_monthly IS 'One row per account and complete month (dense, 2,592 rows). Pseudonymous account_key, never names or contacts. definition 1.0.0. Never treat account_key as anonymous; always use LIMIT.';
COMMENT ON COLUMN analytics.account_mrr_monthly.month_start IS 'First day of the calendar month (UTC).';
COMMENT ON COLUMN analytics.account_mrr_monthly.account_key IS 'Pseudonymous analytics key (fl_0006). Stable and joinable, so not anonymous. Never map it back to a person.';
COMMENT ON COLUMN analytics.account_mrr_monthly.customer_segment IS 'Enterprise, Mid-Market or SMB.';
COMMENT ON COLUMN analytics.account_mrr_monthly.country_code IS 'ISO 3166-1 alpha-2 country of the account.';
COMMENT ON COLUMN analytics.account_mrr_monthly.plan_name IS 'Current plan name.';
COMMENT ON COLUMN analytics.account_mrr_monthly.ending_mrr_eur IS 'Level: the account''s recurring value at month end, EUR. 0 before it started and after it left. Never sum across months.';
COMMENT ON COLUMN analytics.account_mrr_monthly.complete_through_month IS 'Data state: latest month that is complete and approved for answers.';
COMMENT ON COLUMN analytics.account_mrr_monthly.data_loaded_at_utc IS 'Data state: when the load behind this row finished (UTC).';
COMMENT ON COLUMN analytics.account_mrr_monthly.quality_status IS 'Data state: passing or failing.';

-- -------------------------------------------------------------------------------------
-- 5. analytics.data_status_by_view: read this FIRST. One row per data view.
--    No age column: age depends on the caller's clock (2026-07-01T09:00:00Z in the course).
-- -------------------------------------------------------------------------------------
CREATE VIEW analytics.data_status_by_view AS
SELECT
  c.view_name,
  s.data_loaded_at_utc,
  s.complete_through_month,
  s.quality_status,
  c.warn_after_hours,
  c.hard_expiry_hours,
  c.owner_team,
  c.definition_version
FROM core.serving_contracts AS c
CROSS JOIN core.load_status AS s;
-- Counter-example: an age_hours column computed with now(). The same question then gets a
-- different answer every hour, and the frozen tests F00 and F01 become impossible.

COMMENT ON VIEW analytics.data_status_by_view IS 'One row per approved data view: load time (UTC), last complete month, quality gate, freshness thresholds, owner and definition version. definition 1.0.0. Read it before answering; never compute age with now().';
COMMENT ON COLUMN analytics.data_status_by_view.view_name IS 'Schema-qualified name of the approved view.';
COMMENT ON COLUMN analytics.data_status_by_view.data_loaded_at_utc IS 'When the load finished (UTC). Age = stated evaluation clock minus this.';
COMMENT ON COLUMN analytics.data_status_by_view.complete_through_month IS 'Latest complete month approved for answers. Refuse periods after it.';
COMMENT ON COLUMN analytics.data_status_by_view.quality_status IS 'passing or failing. Refuse to answer from a failing load.';
COMMENT ON COLUMN analytics.data_status_by_view.warn_after_hours IS 'Hours after which the answer must state the load time and age (36). The answer is still given.';
COMMENT ON COLUMN analytics.data_status_by_view.hard_expiry_hours IS 'Hours after which answering is blocked. NULL: no block rule was written; escalate, never invent one.';
COMMENT ON COLUMN analytics.data_status_by_view.owner_team IS 'Team that owns the definition and approves changes.';
COMMENT ON COLUMN analytics.data_status_by_view.definition_version IS 'Metric definition version these views serve. Cite it in every answer.';

RESET ROLE;
\echo '    analytics ready: 5 approved views, schema-qualified, commented with definition 1.0.0'
