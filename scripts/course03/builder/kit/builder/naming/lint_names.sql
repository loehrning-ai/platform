--
-- lint_names.sql: a naming lint for one schema. Every row it prints is a name that forces a guess.
--
-- In plain words
--   A column name is the only documentation that travels with every query. This file reads
--   the database catalog (and, for two rules, a little of the data) and lists every table,
--   view or column whose name breaks a rule in NAMING-RULES.md. It changes nothing.
--
--   Expected results on the FOLDLINE builder databases:
--     saas_ready, schema analytics  ->  0 rows. The five approved views pass every rule.
--     saas_bad,   schema public     ->  a long list. The export lane was never named for readers.
--   An empty result does not prove the names are good. It proves they break none of these rules.
--   A person still reads NAMING-REVIEW.md.
--
-- Run it
--   psql -X -d saas_ready -U foldline_ready_reader -f naming/lint_names.sql                 (analytics is the default)
--   psql -X -d saas_bad   -v lint_schema=public -f naming/lint_names.sql                     (the export lane)
--   psql -X -d saas_ready -v lint_schema=core   -f naming/lint_names.sql                     (optional, see below)
--
-- For builders
--   - Read-only. One SELECT per rule family, no temporary objects, no functions created, every
--     name schema-qualified. It runs as foldline_ready_reader, whose search_path is empty and
--     who may not create TEMP tables.
--   - Catalog rules read pg_catalog. Two data rules (LINT-05b, LINT-06) read column values with
--     query_to_xml(), a built-in that runs a query string inside a plain SELECT. They only scan
--     relations the current login may SELECT; others are skipped silently.
--   - On a large table, the data rules scan every row. Point them at a sample view, or add
--     TABLESAMPLE to the format() strings below, before you run this on production data.
--   - Heuristics, not proofs: LINT-02 treats an integer column ending in "s" as a count
--     (starting_accounts); LINT-05a looks for two integer columns next to a rate. Record every
--     accepted exception in the exceptions list at the bottom of this header, with a reason.
--   - Linting core is allowed and teaches something: LINT-08 lists account_id, account_name and
--     contact_email there. Those hits are the reason core is never served to an AI.
--     Linting source is pointless: source keeps feed names as received, on purpose.
--
-- Rules (IDs match ANTI-PATTERNS.md and NAMING-RULES.md)
--   LINT-01  banned generic names, abbreviations and version/state tokens (amount, dt, seg, final_v2)
--   LINT-02  a numeric column without a unit suffix (_eur, _pct, _hours ...)
--   LINT-03  a timestamp without a time zone, or not named *_at_utc
--   LINT-04  a date column not named month_start / period_start / period_end_exclusive / *_on / *_month,
--            or a date stored as text
--   LINT-05  a rate without _pct/_ratio, a rate without two count columns beside it (05a),
--            or a _pct column whose values all sit between -1 and 1 (05b, probably stored as 0-1)
--   LINT-06  a text column whose values are all 1-2 characters (status codes like A/C/N);
--            columns ending in _code (ISO country_code) are allowed
--   LINT-07  a relation name without a grain token (_monthly, _by_segment_quarter ...)
--   LINT-08  an identifier-like column (email, phone, person or company name, a system *_id)
--   LINT-09  a relation or column without a COMMENT
--   LINT-10  a boolean not named is_/has_/was_/can_
--   LINT-11  money stored as float (real, double precision) or the money type
--
-- Accepted exceptions (object | rule | reason). Keep this list short and dated.
--   analytics.logo_churn_by_segment_quarter | naming style | "_quarter", not "_quarterly": the name
--   is published in the deck and tests; renaming needs an alias view for one version (NAMING-RULES.md §7).
--   The lint accepts both suffixes, so no suppression is needed.
--
\set ON_ERROR_STOP on
\if :{?lint_schema}
\else
  \set lint_schema analytics
\endif
\echo ''
\echo '== Naming lint for schema' :lint_schema 'in database' :DBNAME '=='
\echo 'Each row is a name that forces a reader (a person or an AI) to guess.'

WITH
params AS (
  SELECT :'lint_schema'::text AS lint_schema
),
rels AS (                                   -- tables, views, materialized views in the schema
  SELECT c.oid, n.nspname AS schema_name, c.relname AS rel_name, c.relkind,
         pg_catalog.obj_description(c.oid, 'pg_class') AS rel_comment,
         pg_catalog.has_table_privilege(c.oid, 'SELECT') AS can_read
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN params p ON n.nspname = p.lint_schema
  WHERE c.relkind IN ('r', 'v', 'm', 'p', 'f')
),
cols AS (
  SELECT r.oid, r.schema_name, r.rel_name, r.can_read, a.attname AS col_name, a.attnum,
         pg_catalog.format_type(a.atttypid, NULL) AS col_type,
         pg_catalog.col_description(r.oid, a.attnum) AS col_comment
  FROM rels r
  JOIN pg_catalog.pg_attribute a ON a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
),
-- Word lists. Change them here, in one place.
banned_exact(word) AS (VALUES
  ('amount'), ('value'), ('val'), ('dt'), ('date'), ('ts'), ('time'), ('timestamp'), ('seg'),
  ('status'), ('state'), ('type'), ('flag'), ('id'), ('data'), ('info'), ('total'), ('count'),
  ('cnt'), ('num'), ('qty'), ('misc'), ('other'), ('name'), ('code'), ('balance'), ('change'),
  ('events'), ('reading'), ('rate'), ('pct'), ('metric'), ('kpi'), ('revenue'), ('mrr')
),
banned_token(word) AS (VALUES               -- abbreviations and tokens that hide meaning in any position
  ('acct'), ('cust'), ('seg'), ('amt'), ('qty'), ('prio'), ('flg'), ('hc'), ('cr'), ('conv'),
  ('dt'), ('ts'), ('val'), ('cnt'), ('txn'), ('tmp'), ('temp'), ('test'), ('final'), ('old'),
  ('new2'), ('bak'), ('backup'), ('copy'), ('export'), ('dump'), ('misc')
),
id_like(pattern) AS (VALUES                 -- direct identifiers: allowed in core only
  ('email'), ('phone'), ('mobile'), ('first_name'), ('last_name'), ('full_name'), ('account_name'),
  ('customer_name'), ('company_name'), ('contact'), ('address'), ('street'), ('postcode'),
  ('zip_code'), ('iban'), ('ip_address'), ('birth'), ('tax_id'), ('passport')
),
violations AS (
  -- LINT-01a: a column called by a generic word
  SELECT 'LINT-01' AS rule_id, c.schema_name || '.' || c.rel_name AS object, c.col_name AS column_name,
         'generic name "' || c.col_name || '": say what it holds, its unit, its shape and its time' AS message
  FROM cols c JOIN banned_exact b ON c.col_name = b.word
  UNION ALL
  -- LINT-01b: an abbreviation or a version/state token inside a column name
  SELECT 'LINT-01', c.schema_name || '.' || c.rel_name, c.col_name,
         'abbreviation or version token "' || t.word || '" inside the name: spell it out'
  FROM cols c
  JOIN banned_token t ON t.word = ANY (pg_catalog.string_to_array(c.col_name, '_'))
  WHERE c.col_name NOT IN (SELECT word FROM banned_exact)
  UNION ALL
  -- LINT-01c: a relation named after where it came from, or with a version/state token
  SELECT 'LINT-01', r.schema_name || '.' || r.rel_name, NULL,
         'relation name token "' || t.word || '": name the content and grain, not the origin or version'
  FROM rels r
  JOIN banned_token t ON t.word = ANY (pg_catalog.string_to_array(r.rel_name, '_'))
  UNION ALL
  SELECT 'LINT-01', r.schema_name || '.' || r.rel_name, NULL,
         'version suffix: publish one name and keep versions in the definition (mrr_final_v2 -> mrr_summary_monthly)'
  FROM rels r WHERE r.rel_name ~ '_v[0-9]+$'

  UNION ALL
  -- LINT-02: numbers without a unit
  SELECT 'LINT-02', c.schema_name || '.' || c.rel_name, c.col_name,
         'numeric column without a unit suffix (_eur, _pct, _ratio, _hours, _units ...): "' || c.col_name || '" of what?'
  FROM cols c
  WHERE c.col_type IN ('numeric', 'real', 'double precision', 'money')
    AND c.col_name !~ '_(eur|usd|gbp|chf|local|pct|ratio|hours|minutes|seconds|days|units|kg|kwh|count)$'
  UNION ALL
  SELECT 'LINT-02', c.schema_name || '.' || c.rel_name, c.col_name,
         'integer column is neither a count (plural noun: starting_accounts), a key (_key, _id) nor carries a unit'
  FROM cols c
  WHERE c.col_type IN ('integer', 'bigint', 'smallint')
    AND c.col_name !~ '(s|_key|_id|_rank|_number|_year|_(pct|hours|minutes|seconds|days|units|count|eur))$'
    AND c.col_name NOT IN (SELECT word FROM banned_exact)   -- already reported by LINT-01

  UNION ALL
  -- LINT-03: timestamps
  SELECT 'LINT-03', c.schema_name || '.' || c.rel_name, c.col_name,
         'timestamp without time zone: store timestamptz and name it *_at_utc'
  FROM cols c WHERE c.col_type = 'timestamp without time zone'
  UNION ALL
  SELECT 'LINT-03', c.schema_name || '.' || c.rel_name, c.col_name,
         'timestamptz not named *_at_utc: the reader cannot see which clock it uses'
  FROM cols c WHERE c.col_type = 'timestamp with time zone' AND c.col_name !~ '_at_utc$'
  UNION ALL
  SELECT 'LINT-03', c.schema_name || '.' || c.rel_name, c.col_name,
         'named *_at_utc but typed ' || c.col_type || ': the name promises an instant in UTC'
  FROM cols c WHERE c.col_name ~ '_at_utc$' AND c.col_type <> 'timestamp with time zone'

  UNION ALL
  -- LINT-04: dates and period keys
  SELECT 'LINT-04', c.schema_name || '.' || c.rel_name, c.col_name,
         'date column name does not say which day it is: use month_start, period_start, period_end_exclusive, *_on or *_month'
  FROM cols c
  WHERE c.col_type = 'date'
    AND c.col_name !~ '^((month|week|quarter|year|period)_start|period_end_exclusive)$'
    AND c.col_name !~ '_(on|month)$'
  UNION ALL
  SELECT 'LINT-04', c.schema_name || '.' || c.rel_name, c.col_name,
         'looks like a date or period but is stored as ' || c.col_type || ': type it as date (period ''2026-04'' -> month_start)'
  FROM cols c
  WHERE c.col_type IN ('text', 'character varying', 'character')
    AND (c.col_name ~ '(^|_)(date|dt|period|month|day)$' OR c.col_name ~ '_(on|start|at_utc)$')

  UNION ALL
  -- LINT-05: rates
  SELECT 'LINT-05', c.schema_name || '.' || c.rel_name, c.col_name,
         'rate without a scale suffix: _pct means 0-100, _ratio means 0-1'
  FROM cols c
  WHERE c.col_name ~ '(rate|ratio|pct|percent|share)'
    AND c.col_name !~ '_(pct|ratio)$'
    AND c.col_name NOT IN (SELECT word FROM banned_exact)
  UNION ALL
  SELECT 'LINT-05', c.schema_name || '.' || c.rel_name, c.col_name,
         '05a rate without its numerator and denominator in the same relation: nobody can check or pool it'
  FROM cols c
  WHERE c.col_name ~ '_(pct|ratio)$'
    AND (SELECT count(*) FROM cols k
         WHERE k.oid = c.oid AND k.col_type IN ('integer', 'bigint', 'smallint', 'numeric')
           AND k.col_name !~ '_(pct|ratio|key|id|hours|eur)$') < 2
  UNION ALL
  SELECT 'LINT-05', x.object, x.col_name,
         '05b every value in this _pct column is between -1 and 1 (max ' || x.max_abs || '): stored as 0-1? then name it _ratio'
  FROM (
    SELECT c.schema_name || '.' || c.rel_name AS object, c.col_name,
           (pg_catalog.xpath('/row/m/text()', pg_catalog.query_to_xml(
              pg_catalog.format('SELECT max(abs(%I)) AS m FROM %I.%I', c.col_name, c.schema_name, c.rel_name),
              false, true, '')))[1]::text::numeric AS max_abs
    FROM cols c
    WHERE c.can_read AND c.col_name ~ '_pct$' AND c.col_type IN ('numeric', 'real', 'double precision')
  ) x
  WHERE x.max_abs IS NOT NULL AND x.max_abs <= 1 AND x.max_abs > 0

  UNION ALL
  -- LINT-06: codes instead of words (reads data)
  SELECT 'LINT-06', x.object, x.col_name,
         'values are ' || x.max_len || '-character codes (' || x.sample || '): store readable words (A -> active)'
  FROM (
    SELECT c.schema_name || '.' || c.rel_name AS object, c.col_name,
           (pg_catalog.xpath('/row/max_len/text()', q.doc))[1]::text::int AS max_len,
           (pg_catalog.xpath('/row/sample/text()', q.doc))[1]::text        AS sample
    FROM cols c
    CROSS JOIN LATERAL (
      SELECT pg_catalog.query_to_xml(pg_catalog.format(
        'SELECT max(length(%1$I::text)) AS max_len, '
        || 'string_agg(DISTINCT %1$I::text, ''/'' ORDER BY %1$I::text) AS sample FROM %2$I.%3$I',
        c.col_name, c.schema_name, c.rel_name), false, true, '') AS doc
    ) q
    WHERE c.can_read
      AND c.col_type IN ('text', 'character varying', 'character')
      AND c.col_name !~ '_code$'
  ) x
  WHERE x.max_len BETWEEN 1 AND 2

  UNION ALL
  -- LINT-07: grain in the relation name
  SELECT 'LINT-07', r.schema_name || '.' || r.rel_name, NULL,
         CASE WHEN r.schema_name = 'analytics'
              THEN 'served relation without a grain token at the end (_daily, _monthly, _quarter, _by_<dimension>)'
              ELSE 'no grain in the name: end with a grain token or name the entity in the plural (accounts, account_months)'
         END
  FROM rels r
  WHERE r.rel_name !~ '_(daily|weekly|monthly|quarterly|quarter|yearly|annual)$'
    AND r.rel_name !~ '_by_[a-z0-9]+(_[a-z0-9]+)*$'
    AND NOT (r.schema_name <> 'analytics' AND r.rel_name ~ 's$')
    AND r.rel_name !~ '^stg_'                      -- staging views mirror their source name on purpose

  UNION ALL
  -- LINT-08: identifiers
  SELECT 'LINT-08', c.schema_name || '.' || c.rel_name, c.col_name,
         'identifier-like column: never serve it to an AI; keep it in core'
  FROM cols c
  WHERE EXISTS (SELECT 1 FROM id_like i WHERE c.col_name LIKE '%' || i.pattern || '%')
  UNION ALL
  SELECT 'LINT-08', c.schema_name || '.' || c.rel_name, c.col_name,
         'system identifier (*_id or id): serve a pseudonymous <entity>_key instead, and only where needed'
  FROM cols c
  WHERE c.col_name ~ '(^id$|_id$)'

  UNION ALL
  -- LINT-09: descriptions travel with the object
  SELECT 'LINT-09', r.schema_name || '.' || r.rel_name, NULL,
         'relation without COMMENT: one sentence with grain, unit and one "never"'
  FROM rels r WHERE r.rel_comment IS NULL OR btrim(r.rel_comment) = ''
  UNION ALL
  SELECT 'LINT-09', c.schema_name || '.' || c.rel_name, c.col_name,
         'column without COMMENT: say shape (level, change, rate), unit and one "never"'
  FROM cols c WHERE c.col_comment IS NULL OR btrim(c.col_comment) = ''

  UNION ALL
  -- LINT-10: booleans read as questions
  SELECT 'LINT-10', c.schema_name || '.' || c.rel_name, c.col_name,
         'boolean should read as a yes/no question: is_, has_, was_ or can_ (term_flg -> is_voluntary_leaver)'
  FROM cols c WHERE c.col_type = 'boolean' AND c.col_name !~ '^(is|has|was|can)_'

  UNION ALL
  -- LINT-11: money in float
  SELECT 'LINT-11', c.schema_name || '.' || c.rel_name, c.col_name,
         'money stored as ' || c.col_type || ': use numeric(14,2); floats drift when summed'
  FROM cols c
  WHERE c.col_type IN ('real', 'double precision', 'money')
    AND (c.col_name ~ '_(eur|usd|gbp|chf|local)$' OR c.col_type = 'money')
)
SELECT rule_id, object, column_name, message
FROM violations
ORDER BY rule_id, object, column_name NULLS FIRST, message;

\set lint_violations :ROW_COUNT
\echo 'NAMING LINT' :lint_schema ':' :lint_violations 'violation(s). Expected: 0 for analytics.'
\echo 'Fix the names, or record an accepted exception with its reason in the header of this file.'
-- 70_checks.sql (or CI) can \ir this file and then read :lint_violations.
