# Anti-pattern gallery

## In plain words

This page shows the mistakes that matter most as worked cards. Each card has five short parts:

- **Symptom:** what you would notice.
- **Cause:** why it happens.
- **Fix:** what to do instead, with a bad line and a good line.
- **FOLDLINE moment:** where the workshop showed it, with the real number.
- **Caught by:** the test or check that finds it.

The cards come in five groups: **Data**, **Meaning**, **Access**, **Claude setup** and **Testing**.
Read one group before you build that part. If an answer already looks wrong, search this page for
the symptom.

The full list, with every entry in one table, is `ANTI-PATTERNS.md`. This gallery uses the same IDs
(AP-N01, AP-M01 ...), so you can move between the two. Test IDs refer to
`semantic/verified-questions.yml` and `naming/lint_names.sql`. "Review" means a person has to
check it; no query can.

All numbers are from the synthetic FOLDLINE company (144 accounts, EUR, UTC). "Recorded" means
the workshop's recorded run: one observation, not a benchmark. "Dry run" means one later run
with a different AI route: also an observation.

| Group | Cards |
| --- | --- |
| [Data](#data) | AP-N01, AP-N02, AP-N03, AP-S01, AP-S03, AP-S04 |
| [Meaning](#meaning) | AP-M01, AP-M02, AP-M03, AP-M04, AP-M05, AP-M06, AP-M07 |
| [Access](#access) | AP-L02, AP-A01, AP-A02, AP-A03, AP-A06 |
| [Claude setup](#claude-setup) | AP-C01, AP-C02, AP-C04, AP-C05, AP-A05 |
| [Testing](#testing) | AP-T02, AP-T04, AP-T05, AP-E01, AP-E03, AP-F02 |

---

## Data

### AP-N01 · A generic column name

- **Symptom:** a column called `amount`, `value`, `dt` or `seg`. Every query runs; nobody can say
  what the number is without asking.
- **Cause:** the name was set by the system that exported it, for its own purpose. Nobody renamed
  it for readers.
- **Fix:** rename in core so the name says shape, unit and time (`naming/NAMING-RULES.md`, R1–R3).

  ```sql
  -- bad:  SELECT dt, sum(amount) FROM public.monthly_revenue GROUP BY dt
  -- good: SELECT month_start, net_new_mrr_eur FROM analytics.mrr_summary_monthly
  ```
- **FOLDLINE moment:** `monthly_revenue.amount` held each month's change. The recorded run
  summed it by `dt` and answered "Ending MRR" −€19,960 / €9,775 / €42,565.
- **Caught by:** LINT-01 and LINT-02 (99 lint rows on the export lane, 0 on `analytics`); G01.

### AP-N02 · Status codes instead of words

- **Symptom:** a filter on a readable word returns 0 rows, and the AI reports "0 of 0" or "no data".
- **Cause:** the source stores one-letter codes, and the decode lives in someone's head.
- **Fix:** decode once in core, with a CHECK constraint so an unknown code fails the load.

  ```sql
  -- bad:  WHERE status = 'active'                  -- the table holds 'A'
  -- good: CASE status WHEN 'A' THEN 'active' WHEN 'C' THEN 'churned' WHEN 'N' THEN 'new' END
  --       AS account_status   ... CHECK (account_status IN ('active', 'churned', 'new'))
  ```
- **FOLDLINE moment:** "It searched 'active'; the table says 'A'." Logo churn on the export
  lane: 0 of 0, no rate. On the approved views: 4 of 40 per segment, 10 %. The letter `C` also
  means *churned* in `customer_master` and *cancel* in `billing_events`.
- **Caught by:** LINT-06 (finds A/C/N, N/E/D/C and O/P/C/R); G03.

### AP-N03 · A table named after where it came from

- **Symptom:** several tables "sound like the answer" and the AI picks by name.
- **Cause:** names describe origin (`_export`, `_master`, `_log`, `_history`) or an adjective
  (`monthly_`), not what one row is.
- **Fix:** name content and grain: `<subject>[_by_<dimension>]_<time grain>`.

  ```text
  bad:  monthly_revenue, subscription_export, customer_master
  good: analytics.mrr_summary_monthly, analytics.account_mrr_monthly, core.accounts
  ```
- **FOLDLINE moment:** "Three of them sound like the answer." The AI picked `monthly_revenue`.
- **Caught by:** LINT-07, LINT-01; review.

### AP-S01 · Mixed or hidden grain

- **Symptom:** two people sum the same table and get different totals.
- **Cause:** "rows per what?" has no written answer, so each reader decides.
- **Fix:** one grain per relation, stated in the name, the key and the COMMENT. A primary key
  proves it: `PRIMARY KEY (account_id, month_start)` on `core.account_months` (2,592 rows).
- **FOLDLINE moment:** `monthly_revenue` has one row per month *and segment* (18 rows), but its
  name says only "monthly". `acct_history` has no rows before an account starts and keeps zero-balance rows after it
  churns (1,388 rows), so "ending MRR in May" depends on which missing rows mean zero.
- **Caught by:** Q01 (unique grain); LINT-07.

### AP-S03 · A partial period that looks complete

- **Symptom:** a trend or a top-10 that is quietly one month long.
- **Cause:** nothing in the table says which periods it covers.
- **Fix:** serve complete periods only, and put `complete_through_month` on every row.

  ```sql
  WHERE m.month_start <= s.complete_through_month   -- in every approved view
  ```
- **FOLDLINE moment:** `subscription_export` holds June 2026 only. Nothing in the name says so.
- **Caught by:** Q03.

### AP-S04 · Duplicate rows inflate sums

- **Symptom:** a total that is a little too high in some groups and right in others.
- **Cause:** a retry process re-sends some rows, and nothing stops them loading twice.
- **Fix:** deduplicate in core and make repeats impossible with a primary key.

  ```sql
  SELECT DISTINCT ON (event_id) ... ORDER BY event_id, retry_batch NULLS FIRST
  -- then: movement_id integer PRIMARY KEY
  ```
- **FOLDLINE moment:** `billing_events` repeats every 19th movement in a retry batch. The deck's
  export-lane check for expansion by country returned AT €1,955; the approved view says €1,565.
- **Caught by:** G04; Q01; the core quality gate (movements reconcile with snapshots).

---

## Meaning

### AP-M01 · A change read as a level

- **Symptom:** a month-end balance that is negative, or jumps around more than the business does.
- **Cause:** the table holds changes (flows), and nothing marks them as changes.
- **Fix:** serve the level itself, named as a level, next to the change.

  ```text
  bad:  "Ending MRR, April: −€19,960"      (April's change)
  good: "Ending MRR, April: €334,675"      (analytics.mrr_summary_monthly.ending_mrr_eur)
  ```
- **FOLDLINE moment:** the recorded export-lane run: −€19,960 / €9,775 / €42,565. "Why is April
  negative?"
- **Caught by:** G01.

### AP-M02 · Levels added across months

- **Symptom:** one "quarter" figure that is about three times too big.
- **Cause:** a level (a snapshot) is summed like a flow.
- **Fix:** for a quarter, return each month-end or the last month. Write it in the definition:
  `additivity.across_time: none`.
- **FOLDLINE moment:** €334,675 + €344,450 + €387,015 = €1,066,140. It describes nothing.
- **Caught by:** G01 (AI plane); review.

### AP-M03 · Changes subtracted as if they were levels

- **Symptom:** a quarter's net change with the wrong sign or size.
- **Cause:** "end minus start" works for levels only; applied to two monthly changes it
  compares two flows.
- **Fix:** sum the changes (−19,960 + 9,775 + 42,565 = €32,380), or subtract the levels
  (€387,015 − €354,635 = €32,380). Both must agree: that is test Q02.
- **FOLDLINE moment:** the recorded wrong net new: €42,565 − €60,160 = −€17,595.
- **Caught by:** G02; Q02.

### AP-M04 · A level rebuilt from changes with no opening balance

- **Symptom:** believable, rising "balances" that are all short by the same amount.
- **Cause:** the AI adds up changes from the first row it can see. The balance before that row is
  missing.
- **Fix:** serve the level. Never ask an AI to reconstruct one.
- **FOLDLINE moment:** a dry run with a different AI route did not repeat −€19,960. It added the
  changes from January and labelled €75,890 / €85,665 / €128,230 as "Ending MRR", with a caveat
  that the opening balance was missing. Every month was short by December's €258,785. A better AI
  route moved the failure; it did not remove it.
- **Caught by:** G01 (AI plane).

### AP-M05 · Rates averaged instead of pooled

- **Symptom:** a combined rate that sits halfway between the groups, whatever their size.
- **Cause:** an average of rates gives a small group the same weight as a large one.
- **Fix:** recompute from the counts: total numerator ÷ total denominator. Serve both counts
  beside every rate.
- **FOLDLINE moment:** FOLDLINE is right by luck: every segment has a base of 40, so averaging
  three 10 % rates gives 10 %, and pooling 12 of 120 also gives 10 %. The web shop shows the
  trap: 2 % and 8 % average to 5.00 %; pooled, 480 of 21,000 is 2.29 %.
- **Caught by:** review; LINT-05 (a rate without its counts).

### AP-M06 · New joiners counted in the churn base

- **Symptom:** a churn rate that looks slightly better than it should.
- **Cause:** the base is "everyone in the table", not "everyone who could have left".
- **Fix:** base = accounts active at the end of the month before the period. Write it in the
  definition (`population`) and name the columns `starting_accounts`, `churned_accounts`.
- **FOLDLINE moment:** the deck's export-lane check counted the 8 Q2 joiners per segment:
  4 of 48 = 8.33 %. The approved view: 4 of 40 = 10.0 %. Accounts at the end: 40 + 8 − 4 = 44.
- **Caught by:** G03; Q04.

### AP-M07 · 0 ÷ 0 shown as 0 %

- **Symptom:** "0 % churn" for a group or period with nobody in it.
- **Cause:** a division that turns "no data" into a number.
- **Fix:** `100.0 * churned / nullif(starting, 0)` returns NULL; the answer says "no rate".
- **FOLDLINE moment:** the export lane's "0 of 0" after searching for `'active'`. The honest
  answer was "no rate", not "0 %".
- **Caught by:** review; the `nullif` in `analytics.logo_churn_by_segment_quarter`.

---

## Access

### AP-L02 · One login that sees everything

- **Symptom:** the AI's login can list every table, including ones nobody meant it to use.
- **Cause:** "give it read access to the database" instead of "give it these views".
- **Fix:** a login with SELECT on the five approved views and nothing else.
- **FOLDLINE moment:** `foldline_bad_reader` sees all 7 export tables. `foldline_ready_reader`
  sees 5 views.
- **Caught by:** B-P01 (exactly five SELECT grants); D01.

### AP-A01 · Read-only mode treated as the lock

- **Symptom:** "The login is read-only, so it is least privilege."
- **Cause:** `default_transaction_read_only` is a *default*. The session can change it.
- **Fix:** the lock is missing privileges: no write, TEMP or CREATE, and SELECT on five named
  views. Keep read-only mode as a guardrail and call it that.

  ```sql
  BEGIN READ WRITE;            -- allowed: the read-only default is overridden
  CREATE TEMP TABLE t (x int); -- 42501 only because TEMP was revoked (AP-A02)
  ```
- **FOLDLINE moment:** the export login was read-only too, and it could still read all 7 tables.
  Verified on PostgreSQL 16: the reader ran `BEGIN READ WRITE` successfully.
- **Caught by:** B-W01, B-T01.

### AP-A02 · TEMP left to PUBLIC

- **Symptom:** a "read-only" login can create objects.
- **Cause:** PostgreSQL grants TEMPORARY on every new database to PUBLIC.
- **Fix:** `REVOKE ALL ON DATABASE saas_ready FROM PUBLIC`, then grant CONNECT to the reader only.
- **FOLDLINE moment:** verified on PostgreSQL 16. Before the revoke, the reader created a temp
  table inside `BEGIN READ WRITE`. After it: `42501 permission denied to create temporary tables`.
- **Caught by:** B-T01.

### AP-A03 · A denylist instead of an allowlist

- **Symptom:** a new schema or view is visible to the AI the day someone creates it.
- **Cause:** the rule lists what is forbidden, so everything else is allowed.
- **Fix:** list what is allowed: schema `analytics`, five named views, granted by name. Never
  `GRANT SELECT ON ALL TABLES IN SCHEMA`, never `ALTER DEFAULT PRIVILEGES ... TO` the reader.
- **FOLDLINE moment:** the course template's `deny: schemas [raw, core, staging]` list is a
  denylist. If the grants followed that list alone, a new schema called `tmp_export` would be
  open. The template's allow list (`models: [analytics.mrr_summary_monthly]`) plus grants on named
  views is what fails closed.
- **Caught by:** B-P01; the self-check at the end of `60_access.sql`.

### AP-A06 · Pseudonymous treated as anonymous

- **Symptom:** a report or prompt calls an account key "anonymous".
- **Cause:** a key without a name looks harmless.
- **Fix:** call it pseudonymous. Serve it only where a question needs it, cap the rows, and keep
  names and contacts in core.
- **FOLDLINE moment:** `account_key` `fl_0006` in `analytics.account_mrr_monthly` answers the
  top-10 question (G05). It is stable and joinable, so it is not anonymous.
- **Caught by:** R02 (refuse identifiers); D01 (`core.accounts` is denied); LINT-08.

---

## Claude setup

### AP-C01 · The prompt used as the lock

- **Symptom:** "CLAUDE.md says never read contact emails, so we are safe."
- **Cause:** instructions guide the AI. They cannot stop a query.
- **Fix:** two locks: refuse early (instructions, Skill, Project instructions) and enforce anyway
  (database grants).

  ```text
  guide:   "Refuse requests for contact details."          (CLAUDE.md, SKILL.md)
  enforce: SELECT on core.accounts -> 42501 permission denied (60_access.sql)
  ```
- **FOLDLINE moment:** the lab's verdict: "A prompt warning did not stop the email request."
- **Caught by:** R02 (AI plane) and D01 (database plane), both required.

### AP-C02 · The definition loaded but not used

- **Symptom:** the numbers are right, but nobody can tell whether the AI used the definition or
  got lucky.
- **Cause:** a file in the context is not a rule the AI follows. Loaded is not the same as used.
- **Fix:** require the metric name and version in every answer's trace, and grade it.

  ```text
  Trace: metric ending_mrr, version 1.0.0; relation analytics.mrr_summary_monthly;
         data loaded 2026-07-01 06:00 UTC, 3 h old at 2026-07-01 09:00 UTC.
  ```
- **FOLDLINE moment:** the approved-lane runs matched 3 of 3, but cited the definition 0 of 3.
- **Caught by:** the AI-plane cases G01–G03 (`required_trace`); `claude-demo/AI-RUN-LOG.md`.

### AP-C04 · The export uploaded "for context"

- **Symptom:** a Claude Project that had the right answer last week gives an export-lane answer.
- **Cause:** someone added a raw file to the Project knowledge "so Claude has more context".
  Now there is a look-alike again.
- **Fix:** Project knowledge holds approved files only: the definitions and the approved-view
  exports in `claude/project/`. The presenter's answer key never goes in.
- **FOLDLINE moment:** Chat A (export CSVs, no instructions) and Project B (approved files) differ
  only in what was uploaded.
- **Caught by:** review of the Project file list; G01 (AI plane).

### AP-C05 · Unqualified names that rely on search_path

- **Symptom:** a query works in one tool and fails, or returns something else, in another.
- **Cause:** `FROM mrr_summary_monthly` depends on the connection's `search_path`.
- **Fix:** always write `analytics.<view>`, and set the AI login's `search_path` to empty so an
  unqualified name fails loudly.

  ```text
  bad:  SELECT ... FROM mrr_summary_monthly          -- ERROR 42P01 as foldline_ready_reader
  good: SELECT ... FROM analytics.mrr_summary_monthly
  ```
- **FOLDLINE moment:** the recorded ready-lane SQL was unqualified and worked only because the
  connection had `search_path analytics,public`. The deck lists it as a known gap.
- **Caught by:** B-S01, run as the login (see AP-T05).

### AP-A05 · A connection string in CLAUDE.md or a Skill

- **Symptom:** a `postgres://<user>:<password>@<host>/<database>` line in a file Claude reads.
- **Cause:** "it is easier to paste it where Claude can see it".
- **Fix:** the connector reads `${FOLDLINE_READY_DSN}` from the environment. Deny reads of `.env`
  in the Claude Code settings. Rotate any secret that was ever committed.
- **FOLDLINE moment:** the kit ships no password anywhere. The roles are created without one, and
  logins are enabled outside version control.
- **Caught by:** review; a secret scan.

---

## Testing

### AP-T02 · Placeholder expected rows

- **Symptom:** a test file that always "passes", or that nobody can run.
- **Cause:** the expected answer was never written down.
- **Fix:** real expected rows with a `truth_source`, computed before anyone asks the AI.

  ```yaml
  # bad:  expected_rows: replace-with-reviewed-values
  # good: expected_rows:
  #         - {month_start: 2026-04-01, ending_mrr_eur: 334675}
  #         - {month_start: 2026-05-01, ending_mrr_eur: 344450}
  #         - {month_start: 2026-06-01, ending_mrr_eur: 387015}
  ```
- **FOLDLINE moment:** an unfilled copy of the course's `verified-questions.yml` template. The
  kit's template now carries the three reviewed rows, and this builder version fills every case.
- **Caught by:** review; a harness should fail on any placeholder.

### AP-T04 · The truth computed by the AI under test

- **Symptom:** the AI always passes.
- **Cause:** the expected answer came from the same AI route. The test measures agreement with
  itself.
- **Fix:** the owner and a second person compute the truth independently, from the database,
  and record how.
- **FOLDLINE moment:** the fixed facts (€334,675 / €344,450 / €387,015; 4 of 40) come from the
  seed and an independent database check, never from a model answer.
- **Caught by:** review of `truth_source`.

### AP-T05 · The harness uses SET ROLE

- **Symptom:** the search_path test passes (or fails) for the wrong reason.
- **Cause:** role settings such as `search_path = ''` and the read-only default load at **login**.
  `SET ROLE` switches privileges but keeps the session's settings.
- **Fix:** connect as the login: `psql -d saas_ready -U foldline_ready_reader`. Use `SET ROLE` only
  for pure privilege checks.
- **FOLDLINE moment:** verified on PostgreSQL 16. After `SET ROLE` the session still showed
  `search_path = "$user", public` and `default_transaction_read_only = off`. Logged in as the
  reader, `search_path` was empty and the unqualified view name failed with 42P01.
- **Caught by:** B-S01, when the harness connects as the login.

### AP-E01 · "Same model"

- **Symptom:** a report claims both lanes used the same model.
- **Cause:** the recording shows the AI route (the app and connector), not the model version
  behind it.
- **Fix:** say "same AI route" and record what you actually know.
- **FOLDLINE moment:** "The recording names the AI route, not the model version."
- **Caught by:** review.

### AP-E03 · Database checks read as an AI score

- **Symptom:** "9 of 9 tests pass, so the AI scores 9 of 9."
- **Cause:** two kinds of evidence merged into one number.
- **Fix:** two planes, two reports. The database checks test the setup and the course rules.
  AI runs are logged separately, three or more per case, graded on value, behaviour, relation
  and citation.
- **FOLDLINE moment:** 9 of 9 database checks passed; the AI runs matched 3 of 3 on value and
  cited the definition 0 of 3. Verdict: "limited pilot, not signed off".
- **Caught by:** review; the footer line of `70_checks.sql`.

### AP-F02 · An invented expiry

- **Symptom:** the AI refuses to answer from 60-hour-old data "because it is stale".
- **Cause:** someone (or the AI) made up a block rule that the owner never wrote.
- **Fix:** warn after 36 h and still answer, stating load time and age. Block only on written
  rules (an incomplete period, a failing quality check). If the owner wants a hard expiry, they
  write it down; until then `hard_expiry_hours` is NULL.
- **FOLDLINE moment:** the what-if at 60 h: answer with a warning. "No age-based block rule was written."
- **Caught by:** F01 (clock 2026-07-03 18:00 UTC: 60 h, stale_disclosed, answer still given).

---

## The pattern behind the patterns

Almost every card has the same shape: a gap that nobody wrote down, filled by a guess that
produces valid SQL. The fixes follow the same order as the build:

1. **Name it** so the guess is harder (Data).
2. **Define it** so the guess is wrong on paper (Meaning).
3. **Lock it** so the guess cannot reach what it should not (Access).
4. **Guide it** so the AI refuses early and shows its work (Claude setup).
5. **Test it** with truth written down first, on two separate planes (Testing).
