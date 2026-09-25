--
-- 80_export_lane_replay.sql: make the wrong answers happen, on purpose (database saas_bad).
--
-- In plain words
--   Every query below runs without an error and returns tidy rows. Every result is wrong
--   for the question it claims to answer. After each one, a line says why it is wrong
--   and which rule fixes it. The right answers come from 70_checks.sql.
--
--   Labels you will see:
--     RECORDED AI RUN      what the AI answered in the workshop recording (one run each:
--                          an observation, not a benchmark)
--     DRY RUN              what Claude answered in Chat A during the demo rehearsals
--                          (one run each: observations)
--     DECK CHECK           the deck's own database check on the export lane (fixedSql).
--                          This seed reproduces those rows exactly; the DO block at the end
--                          stops the script if it ever does not.
--
-- Run it (after 00_build_all.sql), connected to saas_bad:
--     psql -X -d saas_bad -f sql/80_export_lane_replay.sql
--   As the builder it switches to foldline_bad_reader with SET ROLE, the export login.
--
\set ON_ERROR_STOP on
\set QUIET on
\pset footer off
SET client_min_messages = warning;
SELECT session_user = 'foldline_bad_reader' AS bad_login \gset
\if :bad_login
\else
  SET ROLE foldline_bad_reader;
\endif

\echo ''
\echo '== 1. RECORDED AI RUN: "ending MRR" from monthly_revenue =='
SELECT dt AS month_start, sum(amount) AS ending_mrr          -- the alias is a lie, and it looked trustworthy
FROM public.monthly_revenue
WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01'
GROUP BY dt
ORDER BY dt;
\echo 'Wrong: amount is each month''s CHANGE (new + expansion - contraction - churn), not the month-end level.'
\echo 'Ending MRR cannot be negative here. Truth: 334,675 / 344,450 / 387,015.'
\echo 'Fix: name it net_new_mrr_eur and serve the level beside it (naming rule; analytics.mrr_summary_monthly).'

\echo ''
\echo '== 2. DRY RUN (Chat A): running total of the changes from January =='
SELECT dt AS month_start,
       sum(sum(amount)) OVER (ORDER BY dt) AS running_total_from_january
FROM public.monthly_revenue
GROUP BY dt
ORDER BY dt;
\echo 'Better, still wrong: Apr-Jun 75,890 / 85,665 / 128,230. The export starts in January 2026, so the'
\echo 'opening balance (258,785 at the end of December 2025) is missing. A better AI route moved the failure.'
\echo 'Fix: serve the level itself (ending_mrr_eur); never rebuild a level from a partial window of changes.'

\echo ''
\echo '== 3. RECORDED AI RUN: net new MRR as June change minus March change =='
SELECT (SELECT sum(amount) FROM public.monthly_revenue WHERE dt = DATE '2026-06-01')
     - (SELECT sum(amount) FROM public.monthly_revenue WHERE dt = DATE '2026-03-01') AS net_new_mrr_q2;
\echo 'Wrong: two changes were subtracted as if they were levels. Truth: sum of the Q2 changes = 32,380.'
\echo 'Fix: a movement metric with a written period rule: sum within complete periods.'

\echo ''
\echo '== 4. RECORDED AI RUN: logo churn, searching for the word active =='
SELECT count(*) AS active_accounts_found
FROM public.customer_master
WHERE status = 'active';
\echo 'Zero rows, so "0 of 0, no rate". The table stores A, C and N. 0/0 is not 0 %.'
\echo 'Fix: decode codes into words once, in core; serve starting_accounts and churned_accounts.'

\echo ''
\echo '== 5. DECK CHECK G01 (export lane): balance + change from acct_history =='
SELECT dt AS month_start, sum(balance + change)::numeric(14,2) AS ending_mrr_eur
FROM public.acct_history
WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01'
GROUP BY dt
ORDER BY dt;
\echo 'Wrong: balance is already the month-END level; adding change counts the month twice.'
\echo 'Deck rows: 314,715 / 354,225 / 429,580. Truth: 334,675 / 344,450 / 387,015.'

\echo ''
\echo '== 6. DECK CHECK G02 (export lane): posted billing events =='
SELECT sum(amount)::numeric(14,2) AS net_new_mrr_eur
FROM public.billing_events
WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01'
  AND status = 'posted';
\echo 'Wrong twice: retry copies count twice, and pending late-June invoices are dropped. Deck: 27,055. Truth: 32,380.'
\echo 'Fix: deduplicate on the movement id in core (primary key), and measure MRR from subscriptions, not invoices.'

\echo ''
\echo '== 7. DECK CHECK G03 (export lane): churn over every customer =='
SELECT
  seg AS customer_segment,
  count(*)::bigint AS starting_accounts,
  count(*) FILTER (WHERE status = 'C')::bigint AS churned_accounts,
  round(count(*) FILTER (WHERE status = 'C') * 100.0 / nullif(count(*), 0), 2) AS logo_churn_rate_pct
FROM public.customer_master
GROUP BY seg
ORDER BY seg;
\echo 'Wrong base: 48 includes the 8 accounts that joined DURING the quarter. 4 of 48 = 8.33 %.'
\echo 'Truth: base = active at the end of March = 40; 4 of 40 = 10.0 %. Fix: write the denominator down.'

\echo ''
\echo '== 8. DECK CHECK G04 (export lane): expansion events by country =='
SELECT c.country AS country_code, sum(b.amount)::numeric(14,2) AS expansion_mrr_eur
FROM public.billing_events b
JOIN public.customer_master c ON c.id = b.acct_id
WHERE b.dt >= DATE '2026-04-01' AND b.dt < DATE '2026-07-01' AND b.type = 'E'
GROUP BY c.country
ORDER BY expansion_mrr_eur DESC, c.country;
\echo 'Wrong for AT, DE, NL and PL: a retry batch repeated one expansion each (390, 115, 230, 185).'
\echo 'Where to see it: every repeated movement id in Q2 (one of them is a downgrade, which also skews G02).'
SELECT event_id, acct_id, dt, type, status, amount, retry_batch
FROM public.billing_events
WHERE event_id IN (SELECT event_id FROM public.billing_events
                   WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01'
                   GROUP BY event_id HAVING count(*) > 1)
ORDER BY event_id, retry_batch NULLS FIRST;

\echo ''
\echo '== 9. subscription_export: looks like a table of subscriptions, holds one month =='
SELECT min(date) AS first_date, max(date) AS last_date, count(*) AS row_count
FROM public.subscription_export;
\echo 'June 2026 only. Any question about April or May gets no rows, or worse, June numbers.'
\echo 'Fix: serve complete periods with complete_through_month on every row.'

-- The seed must keep reproducing the recorded and deck numbers. Stop loudly if not.
DO $replay$
DECLARE
  v numeric[];
BEGIN
  SELECT array_agg(s ORDER BY dt) INTO v FROM (SELECT dt, sum(amount) s FROM public.monthly_revenue
    WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01' GROUP BY dt) x;
  IF v <> ARRAY[-19960, 9775, 42565]::numeric[] THEN RAISE EXCEPTION 'recorded G01 not reproduced: %', v; END IF;

  SELECT array_agg(s ORDER BY dt) INTO v FROM (SELECT dt, sum(sum(amount)) OVER (ORDER BY dt) s
    FROM public.monthly_revenue GROUP BY dt) x WHERE dt >= DATE '2026-04-01';
  IF v <> ARRAY[75890, 85665, 128230]::numeric[] THEN RAISE EXCEPTION 'dry-run totals not reproduced: %', v; END IF;

  SELECT ARRAY[(SELECT sum(amount) FROM public.monthly_revenue WHERE dt = DATE '2026-06-01')
             - (SELECT sum(amount) FROM public.monthly_revenue WHERE dt = DATE '2026-03-01')] INTO v;
  IF v <> ARRAY[-17595]::numeric[] THEN RAISE EXCEPTION 'recorded G02 not reproduced: %', v; END IF;

  SELECT array_agg(s ORDER BY dt) INTO v FROM (SELECT dt, sum(balance + change) s FROM public.acct_history
    WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01' GROUP BY dt) x;
  IF v <> ARRAY[314715, 354225, 429580]::numeric[] THEN RAISE EXCEPTION 'deck bad G01 not reproduced: %', v; END IF;

  SELECT ARRAY[sum(amount)] INTO v FROM public.billing_events
    WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01' AND status = 'posted';
  IF v <> ARRAY[27055]::numeric[] THEN RAISE EXCEPTION 'deck bad G02 not reproduced: %', v; END IF;

  SELECT array_agg(p ORDER BY seg) INTO v FROM (SELECT seg,
    round(count(*) FILTER (WHERE status = 'C') * 100.0 / nullif(count(*), 0), 2) p
    FROM public.customer_master GROUP BY seg) x;
  IF v <> ARRAY[8.33, 8.33, 8.33]::numeric[] THEN RAISE EXCEPTION 'deck bad G03 not reproduced: %', v; END IF;

  SELECT array_agg(s ORDER BY s DESC, country) INTO v FROM (SELECT c.country, sum(b.amount) s
    FROM public.billing_events b JOIN public.customer_master c ON c.id = b.acct_id
    WHERE b.dt >= DATE '2026-04-01' AND b.dt < DATE '2026-07-01' AND b.type = 'E' GROUP BY c.country) x;
  IF v <> ARRAY[1990, 1955, 1895, 1885, 1825, 1780, 1780, 705]::numeric[] THEN
    RAISE EXCEPTION 'deck bad G04 not reproduced: %', v;
  END IF;
END
$replay$;

\echo ''
\echo 'REPLAY OK: every recorded and deck export-lane number above was reproduced exactly'
\echo '(labels: recorded fixture). None of them answers the question. The approved lane does: 70_checks.sql.'
\if :bad_login
\else
  RESET ROLE;
\endif
