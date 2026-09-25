--
-- 30_core.sql: the CORE layer of the approved database (saas_ready).
--
-- In plain words
--   This is the prep kitchen. Raw deliveries come in from source; clean, labelled
--   ingredients go out. Core does four jobs, in this order:
--     1. Staging: rename, type and decode each feed (views named core.stg_*).
--        'A' becomes 'active', 'seg' becomes customer_segment, cents become euros.
--     2. Deduplicate: the billing feed repeats every 19th movement in a retry batch.
--        Core keeps one row per movement id, and a primary key makes a repeat impossible.
--     3. Model: one clean table per business thing, at a stated grain.
--        core.accounts        one row per account (identifiers live here and only here)
--        core.account_months  one row per account per month (144 x 18 = 2,592 rows)
--        core.mrr_movements   one row per billing movement (deduplicated)
--     4. Check: a quality gate writes 'passing' or 'failing' into core.load_status.
--        The approved views show that status, so a reader can refuse on 'failing'.
--   The AI never reads core. It holds direct identifiers (account_name, contact_email).
--
-- For builders
--   - "staging" is a step inside core here, not a fourth schema. Crosswalk:
--     raw/landing/bronze = source; staging/intermediate/silver = core; marts/gold = analytics.
--   - Tables, not views, for the modelled layer: the analytics views stay thin and fast,
--     and constraints (PRIMARY KEY, CHECK) prove the grain at load time.
--   - Everything is owned by foldline_owner (NOLOGIN), so views in analytics read core
--     with the owner's rights and the AI login needs no grant here at all.
--   - Idempotent: DROP SCHEMA core CASCADE also drops the analytics views; 40 rebuilds them.
--
\set ON_ERROR_STOP on
SET client_min_messages = warning;
SET ROLE foldline_owner;                  -- everything below is created and owned by the owner role
DROP SCHEMA IF EXISTS core CASCADE;
CREATE SCHEMA core;
COMMENT ON SCHEMA core IS 'Layer 2 of 3. Renamed, typed, decoded, deduplicated entities and facts at a stated grain. Holds direct identifiers. Never exposed to AI tools.';

-- =====================================================================================
-- Step 1. Staging views: one per source table. Rename, type, decode. No joins, no logic.
-- =====================================================================================

CREATE VIEW core.stg_crm_accounts AS
SELECT
  id                                  AS account_id,
  'fl_' || lpad(id::text, 4, '0')     AS account_key,       -- pseudonymous key for analytics
  seg                                 AS customer_segment,
  upper(country)                      AS country_code,
  plan                                AS plan_name,
  CASE status                                               -- decode once, here, with words
    WHEN 'A' THEN 'active'
    WHEN 'C' THEN 'churned'
    WHEN 'N' THEN 'new'
  END                                 AS account_status,    -- an unknown code becomes NULL and
  created_dt                          AS started_on,        -- fails the NOT NULL/CHECK below
  CASE WHEN status = 'C' THEN status_dt END AS churned_on,
  account_name,
  contact_email
FROM source.crm_accounts;
-- Counter-example: decoding in the prompt ("A means active") or in each report. Every
-- reader then decodes differently, and the AI that searched 'active' found 0 rows.

CREATE VIEW core.stg_billing_account_mrr AS
SELECT
  acct_id                                   AS account_id,
  to_date(period, 'YYYY-MM')                AS month_start,      -- text -> date
  (mrr_cents / 100.0)::numeric(12, 2)       AS ending_mrr_eur    -- cents -> EUR; a month-END level
FROM source.billing_account_mrr;

CREATE VIEW core.stg_billing_events AS
SELECT DISTINCT ON (event_id)                                   -- the retry batch repeats event_id
  event_id                                  AS movement_id,
  acct_id                                   AS account_id,
  date_trunc('month', dt)::date             AS month_start,
  dt                                        AS posted_on,
  CASE type
    WHEN 'N' THEN 'new'
    WHEN 'E' THEN 'expansion'
    WHEN 'D' THEN 'contraction'
    WHEN 'C' THEN 'churn'
  END                                       AS movement_type,
  status                                    AS billing_status,  -- 'posted' or 'pending'
  amount::numeric(12, 2)                    AS mrr_change_eur,
  retry_batch
FROM source.billing_events
ORDER BY event_id, retry_batch NULLS FIRST;                     -- keep the original, drop the copy
-- Counter-example: sum(amount) straight from the feed. The deck's export-lane check did that
-- for expansion by country and got AT 1,955 instead of 1,565 (a repeated 390).

-- =====================================================================================
-- Step 2 and 3. Modelled tables with their grain enforced by keys and CHECKs.
-- =====================================================================================

CREATE TABLE core.accounts (
  account_id       integer PRIMARY KEY,
  account_key      text    NOT NULL UNIQUE CHECK (account_key ~ '^fl_[0-9]{4}$'),
  customer_segment text    NOT NULL CHECK (customer_segment IN ('Enterprise', 'Mid-Market', 'SMB')),
  country_code     text    NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  plan_name        text    NOT NULL,
  account_status   text    NOT NULL CHECK (account_status IN ('active', 'churned', 'new')),
  started_on       date    NOT NULL,
  churned_on       date    CHECK (churned_on IS NULL OR churned_on >= started_on),
  account_name     text,                   -- direct identifier: stays in core
  contact_email    text                    -- direct identifier: stays in core (NULL in this kit)
);
INSERT INTO core.accounts
SELECT account_id, account_key, customer_segment, country_code, plan_name, account_status,
       started_on, churned_on, account_name, contact_email
FROM core.stg_crm_accounts;

CREATE TABLE core.account_months (
  account_id        integer       NOT NULL REFERENCES core.accounts (account_id),
  month_start       date          NOT NULL CHECK (extract(day FROM month_start) = 1),
  starting_mrr_eur  numeric(12,2) NOT NULL CHECK (starting_mrr_eur >= 0),  -- level at the previous month end
  ending_mrr_eur    numeric(12,2) NOT NULL CHECK (ending_mrr_eur >= 0),    -- level at this month end
  net_new_mrr_eur   numeric(12,2) GENERATED ALWAYS AS (ending_mrr_eur - starting_mrr_eur) STORED,  -- change
  movement_type     text          NOT NULL,
  PRIMARY KEY (account_id, month_start),                                   -- the grain, enforced
  CHECK (                                                                  -- the label must match the numbers
       (movement_type = 'new'         AND starting_mrr_eur = 0 AND ending_mrr_eur > 0)
    OR (movement_type = 'churn'       AND starting_mrr_eur > 0 AND ending_mrr_eur = 0)
    OR (movement_type = 'expansion'   AND starting_mrr_eur > 0 AND ending_mrr_eur > starting_mrr_eur)
    OR (movement_type = 'contraction' AND ending_mrr_eur > 0 AND ending_mrr_eur < starting_mrr_eur)
    OR (movement_type = 'unchanged'   AND ending_mrr_eur > 0 AND ending_mrr_eur = starting_mrr_eur)
    OR (movement_type = 'inactive'    AND starting_mrr_eur = 0 AND ending_mrr_eur = 0)
  )
);
INSERT INTO core.account_months (account_id, month_start, starting_mrr_eur, ending_mrr_eur, movement_type)
SELECT account_id, month_start, starting_mrr_eur, ending_mrr_eur,
       CASE
         WHEN starting_mrr_eur = 0 AND ending_mrr_eur > 0 THEN 'new'
         WHEN starting_mrr_eur > 0 AND ending_mrr_eur = 0 THEN 'churn'
         WHEN ending_mrr_eur > starting_mrr_eur           THEN 'expansion'
         WHEN ending_mrr_eur < starting_mrr_eur           THEN 'contraction'
         WHEN ending_mrr_eur > 0                          THEN 'unchanged'
         ELSE 'inactive'
       END
FROM (
  SELECT account_id, month_start, ending_mrr_eur,
         coalesce(lag(ending_mrr_eur) OVER (PARTITION BY account_id ORDER BY month_start), 0) AS starting_mrr_eur
  FROM core.stg_billing_account_mrr
) m;
-- Counter-example: keep only rows with a movement (a sparse table). Then "ending MRR in May"
-- needs the last row on or before May per account, and a join to a month list. Dense is simpler.

CREATE TABLE core.mrr_movements (
  movement_id     integer       PRIMARY KEY,                 -- a retried copy cannot load twice
  account_id      integer       NOT NULL REFERENCES core.accounts (account_id),
  month_start     date          NOT NULL,
  posted_on       date          NOT NULL,
  movement_type   text          NOT NULL CHECK (movement_type IN ('new', 'expansion', 'contraction', 'churn')),
  billing_status  text          NOT NULL CHECK (billing_status IN ('posted', 'pending')),
  mrr_change_eur  numeric(12,2) NOT NULL CHECK (mrr_change_eur <> 0)
);
INSERT INTO core.mrr_movements
SELECT movement_id, account_id, month_start, posted_on, movement_type, billing_status, mrr_change_eur
FROM core.stg_billing_events;

CREATE TABLE core.load_status (
  dataset_id             text        PRIMARY KEY,
  data_loaded_at_utc     timestamptz NOT NULL,
  complete_through_month date        NOT NULL CHECK (extract(day FROM complete_through_month) = 1),
  quality_status         text        NOT NULL DEFAULT 'failing' CHECK (quality_status IN ('passing', 'failing')),
  failed_rules           text                                   -- NULL when passing
);
INSERT INTO core.load_status (dataset_id, data_loaded_at_utc, complete_through_month)
SELECT dataset_id, loaded_at, to_date(complete_through, 'YYYY-MM')
FROM source.load_log;

-- Contract settings that the approved views publish. Data, not code: change a threshold here.
CREATE TABLE core.serving_contracts (
  view_name          text    PRIMARY KEY CHECK (view_name ~ '^analytics\.[a-z_]+$'),
  warn_after_hours   integer NOT NULL CHECK (warn_after_hours > 0),
  hard_expiry_hours  integer CHECK (hard_expiry_hours IS NULL OR hard_expiry_hours > warn_after_hours),
  owner_team         text    NOT NULL,
  definition_version text    NOT NULL CHECK (definition_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);
INSERT INTO core.serving_contracts VALUES
  ('analytics.account_mrr_monthly',              36, NULL, 'revenue_analytics', '1.0.0'),
  ('analytics.expansion_mrr_by_country_monthly', 36, NULL, 'revenue_analytics', '1.0.0'),
  ('analytics.logo_churn_by_segment_quarter',    36, NULL, 'revenue_analytics', '1.0.0'),
  ('analytics.mrr_summary_monthly',              36, NULL, 'revenue_analytics', '1.0.0');
-- hard_expiry_hours is NULL on purpose: nobody wrote a block rule, so none is invented.

-- =====================================================================================
-- Step 4. Quality gate. Each rule returns a number of bad rows; all must be 0.
-- Only then does load_status say 'passing'. (Write, audit, then publish.)
-- =====================================================================================
DO $gate$
DECLARE
  v_failed text[] := '{}';
  v_n bigint;
BEGIN
  -- R1 dense grid: every account has every month
  SELECT (SELECT count(*) FROM core.accounts) * (SELECT count(DISTINCT month_start) FROM core.account_months)
         - (SELECT count(*) FROM core.account_months) INTO v_n;
  IF v_n <> 0 THEN v_failed := v_failed || format('R1 dense grid off by %s rows', v_n); END IF;

  -- R2 the movement feed (deduplicated) reconciles with the snapshots, month by month
  SELECT count(*) INTO v_n
  FROM (SELECT month_start, sum(net_new_mrr_eur) AS s FROM core.account_months GROUP BY month_start) a
  FULL JOIN (SELECT month_start, sum(mrr_change_eur) AS s FROM core.mrr_movements GROUP BY month_start) b
    USING (month_start)
  WHERE coalesce(a.s, 0) <> coalesce(b.s, 0);
  IF v_n <> 0 THEN v_failed := v_failed || format('R2 movements do not reconcile in %s months', v_n); END IF;

  -- R3 every account is active at least once
  SELECT count(*) INTO v_n FROM core.accounts a
  WHERE NOT EXISTS (SELECT 1 FROM core.account_months m WHERE m.account_id = a.account_id AND m.ending_mrr_eur > 0);
  IF v_n <> 0 THEN v_failed := v_failed || format('R3 %s accounts never active', v_n); END IF;

  -- R4 CRM churn agrees with billing: zero MRR at the end of the churn month
  SELECT count(*) INTO v_n FROM core.accounts a
  JOIN core.account_months m ON m.account_id = a.account_id
   AND m.month_start = date_trunc('month', a.churned_on)::date
  WHERE a.churned_on IS NOT NULL AND m.ending_mrr_eur <> 0;
  IF v_n <> 0 THEN v_failed := v_failed || format('R4 %s churned accounts still bill', v_n); END IF;

  -- R5 nothing after the complete month
  SELECT count(*) INTO v_n FROM core.account_months m, core.load_status s
  WHERE m.month_start > s.complete_through_month;
  IF v_n <> 0 THEN v_failed := v_failed || format('R5 %s rows after complete_through_month', v_n); END IF;

  UPDATE core.load_status
  SET quality_status = CASE WHEN cardinality(v_failed) = 0 THEN 'passing' ELSE 'failing' END,
      failed_rules   = CASE WHEN cardinality(v_failed) = 0 THEN NULL ELSE array_to_string(v_failed, '; ') END;

  IF cardinality(v_failed) > 0 THEN
    RAISE WARNING 'quality gate FAILING: %', array_to_string(v_failed, '; ');
  END IF;
END
$gate$;

-- =====================================================================================
-- Catalog comments: one sentence each. Shape, unit, grain, and one "never".
-- =====================================================================================
COMMENT ON TABLE core.accounts IS 'One row per account. Holds direct identifiers (account_name, contact_email); never exposed to AI tools.';
COMMENT ON TABLE core.account_months IS 'One row per account per month (dense, 2,592 rows). ending_mrr_eur is a month-end level; net_new_mrr_eur is the change. Never add levels across months.';
COMMENT ON TABLE core.mrr_movements IS 'One row per billing movement after removing retry duplicates. Signed EUR changes; never a balance.';
COMMENT ON TABLE core.load_status IS 'One row per dataset load: when it finished (UTC), the last complete month, and the quality gate result.';
COMMENT ON TABLE core.serving_contracts IS 'Freshness and ownership settings published by analytics.data_status_by_view. NULL hard_expiry_hours means no block rule was written.';
COMMENT ON VIEW core.stg_crm_accounts IS 'Staging: CRM feed renamed and decoded (A/C/N to words). No business logic.';
COMMENT ON VIEW core.stg_billing_account_mrr IS 'Staging: billing snapshot typed (period text to month_start, cents to EUR).';
COMMENT ON VIEW core.stg_billing_events IS 'Staging: billing movements decoded and deduplicated on movement id (retry batches removed).';
COMMENT ON COLUMN core.account_months.ending_mrr_eur IS 'Level: recurring value active at the final instant of the month, EUR. Never sum across months.';
COMMENT ON COLUMN core.account_months.starting_mrr_eur IS 'Level: previous month-end value, EUR (0 in the first month).';
COMMENT ON COLUMN core.account_months.net_new_mrr_eur IS 'Change: ending minus starting within the month, EUR. Sums across months within a period.';
COMMENT ON COLUMN core.account_months.account_id IS 'System identifier of the account. Never served; analytics uses account_key.';
COMMENT ON COLUMN core.account_months.month_start IS 'First day of the calendar month (UTC). With account_id, the grain.';
COMMENT ON COLUMN core.account_months.movement_type IS 'new, expansion, contraction, churn, unchanged or inactive. A CHECK keeps it consistent with the numbers.';
COMMENT ON COLUMN core.accounts.account_id IS 'System identifier used by billing and CRM. Never served to AI tools.';
COMMENT ON COLUMN core.accounts.account_key IS 'Pseudonymous analytics key (fl_0001). Stable and joinable, so not anonymous.';
COMMENT ON COLUMN core.accounts.customer_segment IS 'Enterprise, Mid-Market or SMB (decoded from the CRM field seg).';
COMMENT ON COLUMN core.accounts.country_code IS 'ISO 3166-1 alpha-2 country code.';
COMMENT ON COLUMN core.accounts.plan_name IS 'Current plan name.';
COMMENT ON COLUMN core.accounts.account_status IS 'active, churned or new, decoded from the CRM codes A, C, N. Never compare with the codes.';
COMMENT ON COLUMN core.accounts.started_on IS 'Day the first subscription started.';
COMMENT ON COLUMN core.accounts.churned_on IS 'Day the subscription ended; NULL while active.';
COMMENT ON COLUMN core.accounts.account_name IS 'Direct identifier. Never served to AI tools.';
COMMENT ON COLUMN core.accounts.contact_email IS 'Direct identifier. Never served to AI tools. NULL in this synthetic kit.';
COMMENT ON COLUMN core.mrr_movements.movement_id IS 'Billing movement id; primary key, so a retried copy cannot load twice.';
COMMENT ON COLUMN core.mrr_movements.account_id IS 'System identifier of the account. Never served.';
COMMENT ON COLUMN core.mrr_movements.month_start IS 'Month of the movement (first day, UTC).';
COMMENT ON COLUMN core.mrr_movements.posted_on IS 'Day billing posted the movement.';
COMMENT ON COLUMN core.mrr_movements.movement_type IS 'new, expansion, contraction or churn (decoded from N, E, D, C).';
COMMENT ON COLUMN core.mrr_movements.billing_status IS 'posted or pending. Pending movements still change MRR; never filter them out of MRR.';
COMMENT ON COLUMN core.mrr_movements.mrr_change_eur IS 'Change: signed EUR change of monthly recurring value. Never a balance.';
COMMENT ON COLUMN core.load_status.dataset_id IS 'Name of the loaded dataset (foldline_saas_2026q2).';
COMMENT ON COLUMN core.load_status.data_loaded_at_utc IS 'When the load finished (UTC).';
COMMENT ON COLUMN core.load_status.complete_through_month IS 'Latest month the load vouches for.';
COMMENT ON COLUMN core.load_status.quality_status IS 'passing only when every quality rule returned 0 bad rows.';
COMMENT ON COLUMN core.load_status.failed_rules IS 'Which rules failed, NULL when passing.';
COMMENT ON COLUMN core.serving_contracts.view_name IS 'Schema-qualified approved view.';
COMMENT ON COLUMN core.serving_contracts.warn_after_hours IS 'Hours after which answers must state load time and age.';
COMMENT ON COLUMN core.serving_contracts.hard_expiry_hours IS 'Hours after which answering is blocked. NULL: no block rule was written.';
COMMENT ON COLUMN core.serving_contracts.owner_team IS 'Team that owns the definition.';
COMMENT ON COLUMN core.serving_contracts.definition_version IS 'Semantic version of the metric definitions the view serves.';

RESET ROLE;
\echo '    core ready: accounts (144), account_months (2,592), mrr_movements (deduplicated), quality gate run'
