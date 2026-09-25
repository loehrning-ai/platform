# Presenter notes: how these demo files differ from the rehearsal files

## In plain words

Participants do not need this page. It is for presenters and maintainers who compare today's demo
files with the rehearsal transcripts or with the demo kit published earlier. Keep it outside Claude,
like the check sheet.

## The rehearsal files were an earlier version

- The kept rehearsal runs (see `AI-RUN-LOG.md`) used an earlier version of the demo files: the same
  company totals, a different segment split, a different `customer_master.csv`, and only two
  approved-view files in Project B.
- If a Chat A answer splits April's running total as 32,860 / 27,855 / 15,175 by segment, the chat was given the old
  rehearsal file. The current file gives −13,285 / −3,080 / −3,595 for April's changes, and the
  running totals in `CHECK-YOUR-RESULT.md`.
- Two rehearsal refusals rested on facts that are no longer true: "there is no plan column"
  (`account_mrr_monthly.csv` now has `plan_name`) and "the files have no account-level rows" (they
  now have pseudonymous `account_key` rows). A refusal on those grounds now fails.
- Re-run Chat A and Project B at least three times each on the current files before the next live
  session, and log them in `AI-RUN-LOG.md`.

## Changes against the published demo kit

- The answer key is renamed `CHECK-YOUR-RESULT.md` and now leads with the Chat A result seen
  in both kept rehearsal runs (running totals labelled Ending MRR), instead of the recorded mistake.
- A 10-minute self-run for participants was added; the presenter sheet follows it.
- All CSVs are regenerated from the builder seed. `customer_master.csv` now agrees with the
  top-account replay (for example `fl_0006` is Enterprise, PL; `fl_0087` is active in June).
  The export uses the deck's column `id`, not `account_key`.
- Company totals did not change, but the segment split of `monthly_revenue.csv` did. April is still
  negative in every segment (−13,285 / −3,080 / −3,595).
- The churn file uses `period_start` and `period_end_exclusive` (was `quarter_start`) and now carries
  `complete_through_month` and `quality_status`, which one rehearsal said were missing.
- Project B now reads `../claude/project/`, which adds three views: expansion by country, account-level
  MRR with the pseudonymous `account_key` and `plan_name`, and data status. The profit refusal must
  now rest on missing cost data, not on a missing plan column.
- The Project instructions file is now `PROJECT-INSTRUCTIONS.txt` (was `project-instructions.txt`).
  It lists six files, requires reading `data_status_by_view.csv` first and caps detail at 1,000 rows.
- **The rehearsal runs predate these changes.** Re-run Chat A and Project B at least three times each
  before the next live session and log them in `AI-RUN-LOG.md`.
