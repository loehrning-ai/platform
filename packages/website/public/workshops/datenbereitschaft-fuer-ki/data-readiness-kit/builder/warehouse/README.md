# Build the FOLDLINE warehouse with psql

## In plain words

In the workshop, one question got two answers.

- **Export lane.** Seven undocumented tables. An AI answered "ending MRR" with −19,960 / 9,775 / 42,565.
- **Approved lane.** Five approved views, a written definition, a read-only login and tests. The answer was 334,675 / 344,450 / 387,015.

This folder builds both lanes on your own PostgreSQL. It takes one command and about a minute. You get:

- two small databases: `saas_bad` (the export lane) and `saas_ready` (the approved lane);
- three roles with **no passwords**: an owner, the AI's reader and the export reader;
- a checker that asserts the workshop's numbers, and a replay that makes the wrong answers happen on purpose.

All data is synthetic: FOLDLINE is a made-up company with 144 business accounts. There are no real people, no email addresses and no credentials anywhere in this folder.

## Quick start: one command

You need `psql` and PostgreSQL 14 or newer (tested on 16). Your login must be allowed to create databases and roles: a superuser, or a role with CREATEDB and CREATEROLE. Point psql at your server the usual way (`PGHOST`, `PGPORT`, `PGUSER`, or `-h -p -U`). Keep any password in your shell or in `~/.pgpass`, never in a file here.

From this `warehouse/` folder:

```sh
psql -X -v ON_ERROR_STOP=1 -d postgres -f sql/00_build_all.sql
```

It builds everything, runs the database checks as the AI's reader, and replays the export lane's wrong answers. It is safe to run again: every step drops and rebuilds what it owns. The exit code is 0 when every check passes and 3 when one fails.

## What you should see

Shortened output from a real run on PostgreSQL 16:

```text
-- Step 8. Database checks (approved lane), tested as foldline_ready_reader
Mode A: builder session, switching with SET ROLE foldline_ready_reader.
        Privileges are real; login settings are not loaded (B-S01 will SKIP).
 case_id |   kind    | expected                                                | actual                                                  | result
---------+-----------+---------------------------------------------------------+---------------------------------------------------------+--------
 G01     | answer    | 2026-04-01 334675, 2026-05-01 344450, 2026-06-01 387015 | 2026-04-01 334675, 2026-05-01 344450, 2026-06-01 387015 | PASS
 G02     | answer    | 32380                                                   | 32380                                                   | PASS
 G03     | answer    | Enterprise 4/40=10.0, Mid-Market 4/40=10.0, SMB 4/40=10.0 | ...                                                   | PASS
 D01     | deny      | 42501 permission denied                                 | 42501 permission denied for schema core                 | PASS
 B-T01   | deny      | 42501 (even in READ WRITE)                              | 42501 permission denied to create temporary tables ...  | PASS
 B-S01   | error     | 42P01 with search_path empty                            | not tested: SET ROLE skips login settings               | SKIP
 Q02     | reconcile | 354635 + 32380 = 387015; breaks 0; parts 0              | 354635 + 32380 = 387015; breaks 0; parts 0              | PASS
 Q07     | lineage   | 5 views: upstreams as declared in model.yml             | 5 views: upstreams as declared in model.yml             | PASS
 F01     | freshness | 60 h, stale_disclosed: answer with warning              | 60 h, stale_disclosed: answer with warning @ ...        | PASS
DB CHECKS 21 of 21 PASS. 1 SKIP. 0 FAIL.
These test the database and course rules, not the AI. AI cases: claude-demo/AI-RUN-LOG.md.

-- Step 9. Replay the wrong answers (export lane), as foldline_bad_reader
== 1. RECORDED AI RUN: "ending MRR" from monthly_revenue ==
 2026-04-01 | -19960
 2026-05-01 |   9775
 2026-06-01 |  42565
...
REPLAY OK: every recorded and deck export-lane number above was reproduced exactly
```

| Line | What it proves |
| --- | --- |
| G01 PASS | The approved view returns the workshop's ending MRR, 334,675 / 344,450 / 387,015, using the deck's exact SQL. |
| G02 PASS | Net new MRR for Q2 is 32,380, and it adds up: −19,960 + 9,775 + 42,565. |
| G03 PASS | Logo churn is 4 of 40 = 10.0 % in every segment. Joiners are not in the base. |
| D01 PASS | Reading `core.accounts.contact_email` as the AI's reader fails with SQLSTATE 42501. The database is the lock. |
| B-T01 PASS | The reader cannot create a temporary table, even after `BEGIN READ WRITE`. |
| B-S01 SKIP | `SET ROLE` does not load a role's login settings. That is a lesson, not a bug; see "Full proof" below. |
| Q02 PASS | The bathtub identity holds: 354,635 + 32,380 = 387,015, and every month's last level plus its change gives its new level. |
| Q07 PASS | The lineage written in `semantic/model.yml` is exactly what each view reads, according to PostgreSQL's own dependency catalog (`pg_depend`). |
| F01 PASS | At 60 hours the data is past the 36-hour warning. The answer is still given, with a warning. As the deck says: "No age-based block rule was written." |
| DB CHECKS ... PASS | The database and the course rules behave. **This is not an AI score.** |
| REPLAY OK | The export lane still produces the recorded wrong answers, so the lesson stays reproducible. |

## Full proof: log in as the reader

PostgreSQL loads a role's settings (empty `search_path`, read-only default, 5-second timeout) only when that role **logs in**. `SET ROLE` skips them, so the quick start cannot test B-S01. For the full proof:

```sh
psql -X -d postgres -f sql/65_local_login.sql            # local sandbox only: LOGIN without a password
psql -X -v ON_ERROR_STOP=1 -d saas_ready -U foldline_ready_reader -f sql/70_checks.sql
```

Expected: `DB CHECKS 22 of 22 PASS. 0 SKIP. 0 FAIL.`

Built with other names? Pass the same `-v bad_db=...` (and `-d` your ready database) here.

Step one works only when your server trusts local connections (`trust` or `peer` in `pg_hba.conf`), which is typical for a laptop sandbox. On a shared server, a person with the right to do so creates the login outside version control. ACCESS.md, "Credentials", explains how.

## What-if: the same data, 60 hours old

The checks use a frozen clock: loaded 2026-07-01 06:00 UTC, checked 2026-07-01 09:00 UTC, so the data is 3 hours old. To see your own clock, pass it in:

```sh
psql -X -d saas_ready -v eval_clock=2026-07-03T18:00:00Z -f sql/70_checks.sql
```

The extra line reads `60 | stale_disclosed: answer with warning`. The verdicts in the table do not move, because F00 and F01 always use their own frozen clocks. FRESHNESS-LINEAGE.md explains the rule.

## Clean up

```sh
psql -X -d postgres -f sql/99_teardown.sql
```

This drops both databases and the three roles. Roles are cluster-wide, so they are dropped last.

## Files

| File | Layer | What it does |
| --- | --- | --- |
| `sql/00_build_all.sql` | all | The one command. Creates roles and databases, runs 10 to 80 in order. |
| `sql/10_export_lane.sql` | export (counter-example) | Seven look-alike tables in `saas_bad.public`, each with a `-- TRAP` note. |
| `sql/10_export_lane_data.sql` | export | Generated rows for the seven tables, with a self-check. |
| `sql/20_source_seed.sql` | source | Generated. The feeds exactly as received: bad names, cents, codes, retry copies. |
| `sql/30_core.sql` | core | Staging views (rename, type, decode, deduplicate), then tables at a stated grain, then a quality gate. |
| `sql/40_analytics.sql` | analytics | The five approved views, commented with `definition 1.0.0`. |
| `sql/60_access.sql` | access | Least privilege for `foldline_ready_reader`, with a self-check. |
| `sql/65_local_login.sql` | access | Optional. Enables LOGIN without a password on a local sandbox. |
| `sql/70_checks.sql` | tests | 22 database checks (one SKIPs under SET ROLE). Exit code 3 on failure. |
| `sql/80_export_lane_replay.sql` | tests | Runs the wrong queries on purpose, labelled, with an explanation after each. |
| `sql/99_teardown.sql` | all | Removes everything. |
| `seed/generate_seed.py` | seed | The single source of every number. Standard-library Python. Its output is committed. |
| `seed/SEED-FACTS.md` | seed | Every number, labelled by where it comes from. |

Guides in this folder:

- LAYERS.md: why source, core and analytics exist, and why the AI sees only analytics.
- SERVING-VIEWS.md: how to design the views an AI reads.
- ACCESS.md: the least-privilege script line by line; locks versus guardrails.
- FRESHNESS-LINEAGE.md: warn versus block, and where April's 334,675 comes from.
- TESTS.md: two evidence planes, and how to write the truth down first.

## Troubleshooting

| You see | It means | Do this |
| --- | --- | --- |
| `relation "mrr_summary_monthly" does not exist` | You used an unqualified name as the logged-in reader. That is intended (B-S01). | Write `analytics.mrr_summary_monthly`. |
| `permission denied for schema core` | The lock works (D01). | Nothing. Use the approved views. |
| `cannot execute CREATE TABLE in a read-only transaction` | The read-only default fired. It is a guardrail, not the lock. | Nothing. B-W01 shows the lock underneath. |
| `must be able to SET ROLE "foldline_owner"` | You are not a superuser and lack membership (PostgreSQL 16 or newer). | Re-run 00. Step 1 grants the membership. If it still fails, your role lacks CREATEROLE. |
| `role "foldline_owner" already exists` | Nothing. The scripts create roles only when they are missing. | Nothing. |
| `database "saas_ready" is being accessed by other users` at teardown | Another session is open. | Close it, then re-run 99. |
| `DB CHECKS ... FAIL` and exit code 3 | A number or a privilege drifted. | Read the `actual` column. Re-run `sql/60_access.sql` to repair grants, or 00 to rebuild. |

## Regenerating the seed (optional)

You never need this to run the kit. If you change the seed:

```sh
python3 seed/generate_seed.py            # rewrites the generated SQL, the CSVs and builder-data.json
python3 seed/generate_seed.py --check    # exit 1 if a committed file differs (for CI)
```

The generator asserts every fixed fact before it writes anything. The generated SQL asserts them again when it loads.

## Limits

- This is a teaching starter. It certifies nothing about production readiness.
- The database checks test the setup and the course rules, not the AI. Grade AI runs separately, at least three runs per case (TESTS.md).
- C01, R01 and R02 (clarify, refuse) are policy-plane cases. This kit has no policy engine. See `claude/README.md` for the guidance files and `claude/hooks/sql_guard.py` for the optional SQL guard hook.
