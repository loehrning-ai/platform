--
-- 70_checks.sql: the database checks for the approved lane (saas_ready).
--
-- In plain words
--   Write the right answer down before you ask any AI. This file does that for FOLDLINE:
--   it asks the approved views the workshop's questions and compares every answer with
--   the fixed facts (334,675 / 344,450 / 387,015; 32,380; 4 of 40 = 10.0 % per segment).
--   It also attacks the setup on purpose: it tries to read core.accounts.contact_email
--   (test D01), to write, and to create a temporary table. Each attack must fail with
--   SQLSTATE 42501 ("permission denied"). That failure is the lock working.
--
--   These checks test the DATABASE and the course rules. They do not test the AI.
--   "DB CHECKS 22 of 22 PASS" never means "the AI scores 22 of 22".
--   AI runs are graded separately: claude-demo/AI-RUN-LOG.md.
--
-- Two ways to run it
--   A. Quick start (00_build_all.sql does this): as the builder, connected to saas_ready.
--      The file switches to the reader with SET ROLE. Every privilege check is real, but
--      SET ROLE does NOT load the reader's login settings (search_path, read-only default),
--      so B-S01 is reported as SKIP. That SKIP is a lesson, not a bug.
--   B. Full proof: log in AS the reader (after 65_local_login.sql on a local sandbox, or
--      with a real login created outside version control):
--        psql -X -d saas_ready -U foldline_ready_reader -f sql/70_checks.sql
--
-- For builders
--   - No writes: results are kept in session settings (set_config), because the reader may
--     not create even a temporary table. That restriction is test B-T01.
--   - Grade by value and behaviour, never by SQL text. G01-G05 run the deck's exact SQL.
--   - The clock is frozen. F00 uses 2026-07-01T09:00:00Z, F01 uses 2026-07-03T18:00:00Z.
--     -v eval_clock=... adds an extra line for your own what-if; it never changes a verdict.
--   - Exit code 3 (with ON_ERROR_STOP) when any check fails, so CI can use it.
--
\set ON_ERROR_STOP on
\set QUIET on
\if :{?bad_db}
\else
  \set bad_db saas_bad
\endif
\if :{?eval_clock}
\else
  \set eval_clock 2026-07-01T09:00:00Z
\endif
\pset footer off
SET client_min_messages = warning;

SELECT session_user = 'foldline_ready_reader' AS login_mode \gset
\if :login_mode
  \echo 'Mode B: logged in as foldline_ready_reader. Login settings are loaded: full proof.'
\else
  \echo 'Mode A: builder session, switching with SET ROLE foldline_ready_reader.'
  \echo '        Privileges are real; login settings are not loaded (B-S01 will SKIP).'
  SET ROLE foldline_ready_reader;
\endif
SET foldline.login_mode = :'login_mode';
SET foldline.bad_db = :'bad_db';
SET foldline.eval_clock = :'eval_clock';

\echo ''
\echo 'Session as the checks see it (guardrails are defaults, not locks):'
SELECT session_user, current_user,
       current_setting('default_transaction_read_only') AS read_only_default,
       current_setting('statement_timeout')             AS statement_timeout,
       current_setting('search_path')                   AS search_path;

-- =====================================================================================
-- G: gold questions. Inner queries are the deck's fixedSql, unchanged.
-- =====================================================================================

-- G01 Ending MRR by month, Q2 2026. The workshop question.
DO $g01$
DECLARE
  want text := '2026-04-01 334675, 2026-05-01 344450, 2026-06-01 387015';
  got  text;
BEGIN
  SELECT string_agg(to_char(month_start, 'YYYY-MM-DD') || ' ' || trim_scale(ending_mrr_eur), ', ' ORDER BY month_start)
  INTO got
  FROM (
    SELECT month_start, ending_mrr_eur
    FROM analytics.mrr_summary_monthly
    WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
    ORDER BY month_start
  ) q;
  PERFORM set_config('foldline.g01_expected', want, false),
          set_config('foldline.g01_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.g01_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$g01$;

-- G02 Net new MRR, Q2 2026. A change, so it adds: -19,960 + 9,775 + 42,565 = 32,380.
DO $g02$
DECLARE
  want text := '32380';
  got  text;
BEGIN
  SELECT trim_scale(net_new_mrr_eur)::text INTO got
  FROM (
    SELECT sum(net_new_mrr_eur)::numeric(14,2) AS net_new_mrr_eur
    FROM analytics.mrr_summary_monthly
    WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
  ) q;
  PERFORM set_config('foldline.g02_expected', want, false),
          set_config('foldline.g02_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.g02_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$g02$;

-- G03 Logo churn by segment, Q2 2026. A rate, shipped with its counts: 4 of 40 = 10.0 %.
DO $g03$
DECLARE
  want text := 'Enterprise 4/40=10.0, Mid-Market 4/40=10.0, SMB 4/40=10.0';
  got  text;
BEGIN
  SELECT string_agg(format('%s %s/%s=%s', customer_segment, churned_accounts, starting_accounts, logo_churn_rate_pct),
                    ', ' ORDER BY customer_segment)
  INTO got
  FROM (
    SELECT
      customer_segment,
      starting_accounts,
      churned_accounts,
      logo_churn_rate_pct
    FROM analytics.logo_churn_by_segment_quarter
    WHERE period_start = DATE '2026-04-01'
      AND period_end_exclusive = DATE '2026-07-01'
    ORDER BY customer_segment
  ) q;
  PERFORM set_config('foldline.g03_expected', want, false),
          set_config('foldline.g03_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.g03_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$g03$;

-- G04 Expansion MRR by country, Q2 2026.
DO $g04$
DECLARE
  want text := 'CH 1990, DE 1780, FR 1780, SE 1780, NL 1655, PL 1640, AT 1565, GB 705';
  got  text;
BEGIN
  SELECT string_agg(country_code || ' ' || trim_scale(expansion_mrr_eur), ', ' ORDER BY expansion_mrr_eur DESC, country_code)
  INTO got
  FROM (
    SELECT country_code, sum(expansion_mrr_eur)::numeric(14,2) AS expansion_mrr_eur
    FROM analytics.expansion_mrr_by_country_monthly
    WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
    GROUP BY country_code
    ORDER BY expansion_mrr_eur DESC, country_code
  ) q;
  PERFORM set_config('foldline.g04_expected', want, false),
          set_config('foldline.g04_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.g04_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$g04$;

-- G05 Top ten pseudonymous accounts by ending MRR, June 2026.
DO $g05$
DECLARE
  want text := 'fl_0006 PL 7705, fl_0132 NL 7695, fl_0060 NL 7595, fl_0114 AT 7435, fl_0078 PL 7385, '
            || 'fl_0042 AT 7335, fl_0069 FR 7280, fl_0033 DE 7265, fl_0123 CH 7250, fl_0087 SE 7235';
  got  text;
  n    int;
BEGIN
  SELECT string_agg(account_key || ' ' || country_code || ' ' || trim_scale(ending_mrr_eur), ', '
                    ORDER BY ending_mrr_eur DESC, account_key), count(*)
  INTO got, n
  FROM (
    SELECT account_key, customer_segment, country_code, plan_name, ending_mrr_eur
    FROM analytics.account_mrr_monthly
    WHERE month_start = DATE '2026-06-01' AND ending_mrr_eur > 0
    ORDER BY ending_mrr_eur DESC, account_key
    LIMIT 10
  ) q;
  IF got IS DISTINCT FROM want THEN
    RAISE WARNING 'G05 full result: %', got;
  END IF;
  PERFORM set_config('foldline.g05_expected', 'fl_0006 7705 ... fl_0087 7235 (10 rows)', false),
          set_config('foldline.g05_actual', CASE WHEN got = want THEN 'fl_0006 7705 ... fl_0087 7235 (10 rows)'
                                                 ELSE coalesce(left(got, 60), 'no rows') END, false),
          set_config('foldline.g05_result', CASE WHEN got = want AND n = 10 THEN 'PASS' ELSE 'FAIL' END, false);
END
$g05$;

-- =====================================================================================
-- D and B: attacks that must fail. We catch the error and read its SQLSTATE.
-- =====================================================================================

-- D01 Forced private read: the AI (or anyone with this login) tries to read identifiers.
DO $d01$
DECLARE
  state text := 'no error: data was returned';
BEGIN
  BEGIN
    PERFORM contact_email FROM core.accounts LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    state := SQLSTATE || ' ' || SQLERRM;
  END;
  PERFORM set_config('foldline.d01_expected', '42501 permission denied', false),
          set_config('foldline.d01_actual', left(state, 60), false),
          set_config('foldline.d01_result', CASE WHEN state LIKE '42501%' THEN 'PASS' ELSE 'FAIL' END, false);
END
$d01$;

-- B-W01 Write attempt AFTER overriding the read-only default (BEGIN READ WRITE).
--        The read-only default is a guardrail; the missing CREATE privilege is the lock.
BEGIN READ WRITE;
DO $bw01$
DECLARE
  state text := 'no error: table was created';
BEGIN
  BEGIN
    EXECUTE 'CREATE TABLE analytics.b_w01_probe (probe integer)';
    EXECUTE 'DROP TABLE analytics.b_w01_probe';
  EXCEPTION WHEN OTHERS THEN
    state := SQLSTATE || ' ' || SQLERRM;
  END;
  PERFORM set_config('foldline.b_w01_expected', '42501 (even in READ WRITE)', false),
          set_config('foldline.b_w01_actual', left(state, 60), false),
          set_config('foldline.b_w01_result', CASE WHEN state LIKE '42501%' THEN 'PASS' ELSE 'FAIL' END, false);
END
$bw01$;
COMMIT;

-- B-T01 Temporary table attempt, also in READ WRITE. Passes only after REVOKE TEMP FROM PUBLIC.
BEGIN READ WRITE;
DO $bt01$
DECLARE
  state text := 'no error: temp table was created';
BEGIN
  BEGIN
    EXECUTE 'CREATE TEMP TABLE b_t01_probe (probe integer)';
    EXECUTE 'DROP TABLE b_t01_probe';
  EXCEPTION WHEN OTHERS THEN
    state := SQLSTATE || ' ' || SQLERRM;
  END;
  PERFORM set_config('foldline.b_t01_expected', '42501 (even in READ WRITE)', false),
          set_config('foldline.b_t01_actual', left(state, 60), false),
          set_config('foldline.b_t01_result', CASE WHEN state LIKE '42501%' THEN 'PASS' ELSE 'FAIL' END, false);
END
$bt01$;
COMMIT;

-- B-S01 Unqualified view name must fail: the login's search_path is empty.
--        Only meaningful when logged in; SET ROLE never loads the role's search_path.
DO $bs01$
DECLARE
  state text := 'no error: the name resolved';
  path  text := current_setting('search_path');
BEGIN
  IF current_setting('foldline.login_mode') <> 't' THEN
    PERFORM set_config('foldline.b_s01_expected', '42P01 with search_path empty', false),
            set_config('foldline.b_s01_actual', 'not tested: SET ROLE skips login settings', false),
            set_config('foldline.b_s01_result', 'SKIP', false);
    RETURN;
  END IF;
  BEGIN
    EXECUTE 'SELECT month_start FROM mrr_summary_monthly LIMIT 1';
  EXCEPTION WHEN OTHERS THEN
    state := SQLSTATE || ' ' || SQLERRM;
  END;
  PERFORM set_config('foldline.b_s01_expected', '42P01 with search_path empty', false),
          set_config('foldline.b_s01_actual', left(state, 5) || ' undefined_table (search_path=' || path || ')', false),
          set_config('foldline.b_s01_result',
                     CASE WHEN state LIKE '42P01%' AND path IN ('', '""') THEN 'PASS' ELSE 'FAIL' END, false);
END
$bs01$;

-- B-X01 The approved login cannot connect to the export lane.
DO $bx01$
DECLARE
  db  text := current_setting('foldline.bad_db');
  got text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_database WHERE datname = db) THEN
    got := 'database ' || db || ' not found';
  ELSE
    got := CASE WHEN has_database_privilege(current_user, db, 'CONNECT') THEN 'CONNECT allowed' ELSE 'no CONNECT' END;
  END IF;
  PERFORM set_config('foldline.b_x01_expected', 'no CONNECT on ' || db, false),
          set_config('foldline.b_x01_actual', got || ' on ' || db, false),
          set_config('foldline.b_x01_result', CASE WHEN got = 'no CONNECT' THEN 'PASS' ELSE 'FAIL' END, false);
END
$bx01$;

-- B-P01 Exactly five SELECT grants, all on analytics views. Counts grants via PUBLIC too.
DO $bp01$
DECLARE
  want text := 'analytics.account_mrr_monthly:SELECT, analytics.data_status_by_view:SELECT, '
            || 'analytics.expansion_mrr_by_country_monthly:SELECT, analytics.logo_churn_by_segment_quarter:SELECT, '
            || 'analytics.mrr_summary_monthly:SELECT';
  got  text;
  n    int;
BEGIN
  SELECT string_agg(n.nspname || '.' || c.relname || ':' || p.privilege, ', ' ORDER BY n.nspname, c.relname, p.privilege),
         count(*)
  INTO got, n
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(privilege)
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
    AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
    AND has_table_privilege(current_user, c.oid, p.privilege);
  IF got IS DISTINCT FROM want THEN
    RAISE WARNING 'B-P01 privileges held: %', got;
  END IF;
  PERFORM set_config('foldline.b_p01_expected', '5 x SELECT, all on analytics', false),
          set_config('foldline.b_p01_actual',
                     CASE WHEN got = want THEN '5 x SELECT, all on analytics' ELSE n || ' grants: ' || left(got, 40) END, false),
          set_config('foldline.b_p01_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$bp01$;

-- =====================================================================================
-- Q: reconciliations. The numbers must agree with each other, not only with the facts.
-- =====================================================================================

-- Q01 Every view is unique at its declared grain.
DO $q01$
DECLARE
  got text;
BEGIN
  SELECT format('dups %s/%s/%s/%s, rows %s/%s/%s/%s', d1, d2, d3, d4, r1, r2, r3, r4) INTO got
  FROM
    (SELECT count(*) - count(DISTINCT month_start) AS d1, count(*) AS r1 FROM analytics.mrr_summary_monthly) a,
    (SELECT count(*) - count(DISTINCT (period_start, customer_segment)) AS d2, count(*) AS r2
       FROM analytics.logo_churn_by_segment_quarter) b,
    (SELECT count(*) - count(DISTINCT (month_start, country_code)) AS d3, count(*) AS r3
       FROM analytics.expansion_mrr_by_country_monthly) c,
    (SELECT count(*) - count(DISTINCT (month_start, account_key)) AS d4, count(*) AS r4
       FROM analytics.account_mrr_monthly) d;
  PERFORM set_config('foldline.q01_expected', 'dups 0/0/0/0, rows 18/15/144/2592', false),
          set_config('foldline.q01_actual', got, false),
          set_config('foldline.q01_result', CASE WHEN got = 'dups 0/0/0/0, rows 18/15/144/2592' THEN 'PASS' ELSE 'FAIL' END, false);
END
$q01$;

-- Q02 The bathtub: last level + change = new level, every month and for Q2.
DO $q02$
DECLARE
  got text;
BEGIN
  SELECT format('%s + %s = %s; breaks %s; parts %s',
                trim_scale(mar), trim_scale(q2), trim_scale(jun), breaks, parts)
  INTO got
  FROM
    (SELECT ending_mrr_eur AS mar FROM analytics.mrr_summary_monthly WHERE month_start = DATE '2026-03-01') a,
    (SELECT sum(net_new_mrr_eur) AS q2 FROM analytics.mrr_summary_monthly
      WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01') b,
    (SELECT ending_mrr_eur AS jun FROM analytics.mrr_summary_monthly WHERE month_start = DATE '2026-06-01') c,
    (SELECT count(*) AS breaks FROM (
        SELECT ending_mrr_eur, net_new_mrr_eur,
               lag(ending_mrr_eur, 1, 0::numeric) OVER (ORDER BY month_start) AS previous_ending_mrr_eur
        FROM analytics.mrr_summary_monthly) m
      WHERE previous_ending_mrr_eur + net_new_mrr_eur <> ending_mrr_eur) d,
    (SELECT count(*) AS parts FROM analytics.mrr_summary_monthly
      WHERE new_mrr_eur + expansion_mrr_eur - contraction_mrr_eur - churned_mrr_eur <> net_new_mrr_eur) e;
  PERFORM set_config('foldline.q02_expected', '354635 + 32380 = 387015; breaks 0; parts 0', false),
          set_config('foldline.q02_actual', got, false),
          set_config('foldline.q02_result',
                     CASE WHEN got = '354635 + 32380 = 387015; breaks 0; parts 0' THEN 'PASS' ELSE 'FAIL' END, false);
END
$q02$;

-- Q03 The views stop at the complete month and the quality gate passed.
DO $q03$
DECLARE
  got text;
BEGIN
  SELECT format('last %s, complete %s, after %s, %s',
                to_char(max(month_start), 'YYYY-MM-DD'), to_char(max(complete_through_month), 'YYYY-MM-DD'),
                count(*) FILTER (WHERE month_start > complete_through_month), min(quality_status))
  INTO got
  FROM analytics.mrr_summary_monthly;
  PERFORM set_config('foldline.q03_expected', 'last 2026-06-01, complete 2026-06-01, after 0, passing', false),
          set_config('foldline.q03_actual', got, false),
          set_config('foldline.q03_result',
                     CASE WHEN got = 'last 2026-06-01, complete 2026-06-01, after 0, passing' THEN 'PASS' ELSE 'FAIL' END, false);
END
$q03$;

-- Q04 Accounts per segment: 40 at the start - 4 churned + 8 new = 44 at the end.
DO $q04$
DECLARE
  got text;
BEGIN
  SELECT string_agg(format('%s %s-%s+%s=%s', customer_segment, starting, churned, joined, ending), ', '
                    ORDER BY customer_segment)
  INTO got
  FROM (
    SELECT customer_segment,
           count(*) FILTER (WHERE m03 > 0)            AS starting,
           count(*) FILTER (WHERE m03 > 0 AND m06 = 0) AS churned,
           count(*) FILTER (WHERE m03 = 0 AND m06 > 0) AS joined,
           count(*) FILTER (WHERE m06 > 0)            AS ending
    FROM (
      SELECT account_key, customer_segment,
             sum(ending_mrr_eur) FILTER (WHERE month_start = DATE '2026-03-01') AS m03,
             sum(ending_mrr_eur) FILTER (WHERE month_start = DATE '2026-06-01') AS m06
      FROM analytics.account_mrr_monthly
      GROUP BY account_key, customer_segment
    ) a
    GROUP BY customer_segment
  ) s;
  PERFORM set_config('foldline.q04_expected', 'Enterprise 40-4+8=44, Mid-Market 40-4+8=44, SMB 40-4+8=44', false),
          set_config('foldline.q04_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.q04_result',
                     CASE WHEN got = 'Enterprise 40-4+8=44, Mid-Market 40-4+8=44, SMB 40-4+8=44' THEN 'PASS' ELSE 'FAIL' END, false);
END
$q04$;

-- Q05 The accounts add up to the company level in every month.
DO $q05$
DECLARE
  got text;
BEGIN
  SELECT format('%s months, %s mismatched', count(*), count(*) FILTER (WHERE a.account_sum_eur <> s.ending_mrr_eur))
  INTO got
  FROM analytics.mrr_summary_monthly s
  JOIN (SELECT month_start, sum(ending_mrr_eur) AS account_sum_eur
        FROM analytics.account_mrr_monthly GROUP BY month_start) a USING (month_start);
  PERFORM set_config('foldline.q05_expected', '18 months, 0 mismatched', false),
          set_config('foldline.q05_actual', got, false),
          set_config('foldline.q05_result', CASE WHEN got = '18 months, 0 mismatched' THEN 'PASS' ELSE 'FAIL' END, false);
END
$q05$;

-- Q06 The catalog comment of every approved view carries the definition version.
--     Compiled is not consumed: this proves the catalog got the version, not that Claude used it.
DO $q06$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n
  FROM (VALUES ('analytics.mrr_summary_monthly'), ('analytics.logo_churn_by_segment_quarter'),
               ('analytics.expansion_mrr_by_country_monthly'), ('analytics.account_mrr_monthly'),
               ('analytics.data_status_by_view')) AS v(view_name)
  WHERE obj_description(to_regclass(v.view_name), 'pg_class') LIKE '%definition 1.0.0%';
  PERFORM set_config('foldline.q06_expected', '5 of 5 views say definition 1.0.0', false),
          set_config('foldline.q06_actual', n || ' of 5 views say definition 1.0.0', false),
          set_config('foldline.q06_result', CASE WHEN n = 5 THEN 'PASS' ELSE 'FAIL' END, false);
END
$q06$;

-- Q07 Declared lineage matches what the views really read (pg_depend). The expected text is
-- the upstream lists in semantic/model.yml. If a view starts reading a new table, this fails
-- until someone updates model.yml, so the written lineage cannot silently drift.
DO $q07$
DECLARE
  want text := 'analytics.account_mrr_monthly <- core.account_months, core.accounts, core.load_status; '
            || 'analytics.data_status_by_view <- core.load_status, core.serving_contracts; '
            || 'analytics.expansion_mrr_by_country_monthly <- core.account_months, core.accounts, core.load_status; '
            || 'analytics.logo_churn_by_segment_quarter <- core.account_months, core.accounts, core.load_status; '
            || 'analytics.mrr_summary_monthly <- core.account_months, core.load_status';
  got  text;
BEGIN
  SELECT string_agg(view_name || ' <- ' || upstreams, '; ' ORDER BY view_name) INTO got
  FROM (
    SELECT vn.nspname || '.' || v.relname AS view_name,
           string_agg(DISTINCT tn.nspname || '.' || t.relname, ', ') AS upstreams
    FROM pg_catalog.pg_class v
    JOIN pg_catalog.pg_namespace vn ON vn.oid = v.relnamespace
    JOIN pg_catalog.pg_rewrite r    ON r.ev_class = v.oid
    JOIN pg_catalog.pg_depend d     ON d.classid = 'pg_catalog.pg_rewrite'::pg_catalog.regclass
                                   AND d.objid = r.oid
                                   AND d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
    JOIN pg_catalog.pg_class t      ON t.oid = d.refobjid AND t.oid <> v.oid
    JOIN pg_catalog.pg_namespace tn ON tn.oid = t.relnamespace
    WHERE vn.nspname = 'analytics' AND v.relkind = 'v'
    GROUP BY 1
  ) l;
  PERFORM set_config('foldline.q07_expected', '5 views: upstreams as declared in model.yml', false),
          set_config('foldline.q07_actual', CASE WHEN got = want THEN '5 views: upstreams as declared in model.yml'
                                                 ELSE coalesce(got, 'no views') END, false),
          set_config('foldline.q07_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$q07$;

-- =====================================================================================
-- T: teaching examples for the extra metric shapes (metric.yml status: example).
-- =====================================================================================

-- T01 A distinct count over a period is counted at account grain, never by adding months.
DO $t01$
DECLARE
  want text := '141 distinct accounts; 378 account-months';
  got  text;
BEGIN
  SELECT format('%s distinct accounts; %s account-months', distinct_active_accounts, active_account_months) INTO got
  FROM (
    SELECT count(DISTINCT account_key) AS distinct_active_accounts,
           count(*) AS active_account_months
    FROM analytics.account_mrr_monthly
    WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
      AND ending_mrr_eur > 0
  ) q;
  PERFORM set_config('foldline.t01_expected', want, false),
          set_config('foldline.t01_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.t01_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$t01$;

-- T02 An average is a ratio at the same instant: ending MRR / active accounts, per month.
DO $t02$
DECLARE
  want text := '2026-04-01 2720.93, 2026-05-01 2800.41, 2026-06-01 2931.93';
  got  text;
BEGIN
  SELECT string_agg(to_char(month_start, 'YYYY-MM-DD') || ' ' || avg_mrr_per_active_account_eur, ', ' ORDER BY month_start)
  INTO got
  FROM (
    SELECT month_start, round(ending_mrr_eur / nullif(active_accounts, 0), 2) AS avg_mrr_per_active_account_eur
    FROM analytics.mrr_summary_monthly
    WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'
  ) q;
  PERFORM set_config('foldline.t02_expected', want, false),
          set_config('foldline.t02_actual', coalesce(got, 'no rows'), false),
          set_config('foldline.t02_result', CASE WHEN got = want THEN 'PASS' ELSE 'FAIL' END, false);
END
$t02$;

-- =====================================================================================
-- F: freshness at a frozen clock. The rule: fresh -> answer; older than warn_after_hours ->
-- answer WITH the load time and age; block only on a written rule (failing quality, or a
-- hard expiry that the owner wrote down). FOLDLINE wrote none, so nothing is invented.
-- =====================================================================================
DO $f$
DECLARE
  clocks text[] := ARRAY['2026-07-01T09:00:00Z', '2026-07-03T18:00:00Z'];
  wants  text[] := ARRAY['3 h, fresh: answer', '60 h, stale_disclosed: answer with warning'];
  ids    text[] := ARRAY['f00', 'f01'];
  got text;
BEGIN
  FOR i IN 1..2 LOOP
    SELECT format('%s h, %s', trim_scale(round(age_h, 1)),
             CASE
               WHEN quality_status <> 'passing'                             THEN 'blocked: quality failing'
               WHEN hard_expiry_hours IS NOT NULL AND age_h > hard_expiry_hours THEN 'blocked: past hard expiry'
               WHEN age_h > warn_after_hours                                THEN 'stale_disclosed: answer with warning'
               ELSE 'fresh: answer'
             END)
    INTO got
    FROM (
      SELECT d.*, extract(epoch FROM (clocks[i]::timestamptz - d.data_loaded_at_utc)) / 3600 AS age_h
      FROM analytics.data_status_by_view d
      WHERE d.view_name = 'analytics.mrr_summary_monthly'
    ) s;
    PERFORM set_config('foldline.' || ids[i] || '_expected', wants[i], false),
            set_config('foldline.' || ids[i] || '_actual', coalesce(got, 'no status row') || ' @ ' || left(clocks[i], 16), false),
            set_config('foldline.' || ids[i] || '_result', CASE WHEN got = wants[i] THEN 'PASS' ELSE 'FAIL' END, false);
  END LOOP;
END
$f$;

-- =====================================================================================
-- Report
-- =====================================================================================
\set case_ids 'G01,G02,G03,G04,G05,D01,B-W01,B-T01,B-S01,B-X01,B-P01,Q01,Q02,Q03,Q04,Q05,Q06,Q07,T01,T02,F00,F01'
\echo ''
\echo 'DATABASE CHECKS (approved lane). Evidence plane: database. Not an AI score.'
SELECT c.case_id,
       CASE left(c.case_id, 1)
         WHEN 'G' THEN 'answer'  WHEN 'T' THEN 'answer'  WHEN 'D' THEN 'deny'  WHEN 'F' THEN 'freshness'
         WHEN 'Q' THEN CASE WHEN c.case_id = 'Q07' THEN 'lineage' ELSE 'reconcile' END
         ELSE CASE WHEN c.case_id IN ('B-W01', 'B-T01') THEN 'deny' WHEN c.case_id = 'B-S01' THEN 'error' ELSE 'access' END
       END AS kind,
       current_setting('foldline.' || c.key || '_expected', true) AS expected,
       current_setting('foldline.' || c.key || '_actual', true)   AS actual,
       coalesce(current_setting('foldline.' || c.key || '_result', true), 'FAIL') AS result
FROM (SELECT id AS case_id, lower(replace(id, '-', '_')) AS key, ord
      FROM unnest(string_to_array(:'case_ids', ',')) WITH ORDINALITY AS u(id, ord)) c
ORDER BY c.ord;

SELECT count(*) FILTER (WHERE r = 'PASS') AS n_pass,
       count(*) FILTER (WHERE r = 'SKIP') AS n_skip,
       count(*) FILTER (WHERE r = 'FAIL') AS n_fail,
       count(*) FILTER (WHERE r <> 'SKIP') AS n_run
FROM (SELECT coalesce(current_setting('foldline.' || lower(replace(id, '-', '_')) || '_result', true), 'FAIL') AS r
      FROM unnest(string_to_array(:'case_ids', ',')) AS id) x \gset

-- Your own clock (information only; never changes a verdict above).
SELECT :'eval_clock' AS your_evaluation_clock,
       trim_scale(round(extract(epoch FROM (:'eval_clock'::timestamptz - data_loaded_at_utc)) / 3600, 1)) AS age_hours,
       CASE WHEN extract(epoch FROM (:'eval_clock'::timestamptz - data_loaded_at_utc)) / 3600 > warn_after_hours
            THEN 'stale_disclosed: answer with warning' ELSE 'fresh: answer' END AS freshness_state
FROM analytics.data_status_by_view
WHERE view_name = 'analytics.mrr_summary_monthly';

\echo 'DB CHECKS' :n_pass 'of' :n_run 'PASS.' :n_skip 'SKIP.' :n_fail 'FAIL.'
\echo 'These test the database and course rules, not the AI. AI cases: claude-demo/AI-RUN-LOG.md.'
\echo 'C01, R01, R02 (clarify, refuse) belong to the AI/policy plane; this kit has no policy engine.'
\if :login_mode
\else
  \echo 'SKIP means: log in as foldline_ready_reader for the full proof (see 65_local_login.sql).'
  RESET ROLE;
\endif

SET foldline.n_fail = :'n_fail';
DO $assert$
BEGIN
  IF current_setting('foldline.n_fail')::int > 0 THEN
    RAISE EXCEPTION 'DB CHECKS: % check(s) FAIL. Read the table above.', current_setting('foldline.n_fail');
  END IF;
END
$assert$;
