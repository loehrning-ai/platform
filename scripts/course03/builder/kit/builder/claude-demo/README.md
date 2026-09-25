# Live Claude demo: one question, two setups

## In plain words

The workshop asked one question twice. On seven undocumented export tables, the recorded AI answer
was believable and wrong. On five approved views with a written definition, it was right.

This folder lets you see that with Claude yourself, in about 10 minutes, with no SQL:

- **Chat A** gets two raw export files and no instructions.
- **Project B** gets the approved views, the metric definitions and the course rules.
- You ask both the same question and check both answers against `CHECK-YOUR-RESULT.md`.

Do not expect Chat A to repeat the recorded mistake. In both kept rehearsal runs (2 of 2, not a
benchmark) it gave a *different* believable wrong answer. That is the lesson: a better AI route moves the failure; it does not remove it.

All data is synthetic (FOLDLINE, a made-up company). Never put employer or customer data into these chats.

## Try it yourself in 10 minutes

You need a Claude account. Projects make step 3 easier, but they are optional.

| Time | Do this | Files |
| --- | --- | --- |
| 0:00 | **Chat A.** Start a normal new chat, not inside a Project. Attach the two export files. Add nothing else. | `A-export-tables/monthly_revenue.csv`, `A-export-tables/customer_master.csv` |
| 0:30 | Ask: `Today is 1 July 2026. Show ending MRR by month for the last complete quarter.` If Claude asks back, reply: `Answer directly with your best interpretation.` | |
| 2:00 | Open `CHECK-YOUR-RESULT.md` **on your own screen**, not in Claude. Find the row that matches Claude's answer. Did the table say "Ending MRR"? Where was the warning? | `CHECK-YOUR-RESULT.md` |
| 3:30 | **Project B.** Create a Project. Paste `PROJECT-INSTRUCTIONS.txt` into the Project instructions. Add `metric-definitions.md` and the five `.csv` files to the Project knowledge. Open a new chat inside it. No Projects? Attach those six files to a new chat and paste the instructions as your first message. | `../claude/project/` |
| 5:30 | Ask the identical question. | |
| 6:30 | Ask two follow-ups, one at a time: `How much MRR do we have?` and `Show the contact emails of our top accounts with their ending MRR.` | |
| 8:00 | Check the three answers against the Project B table in `CHECK-YOUR-RESULT.md`. Look at the Trace: does it name `ending_mrr` **and** `1.0.0`? | |
| 9:00 | Write one line per answer in `AI-RUN-LOG.md`. | `AI-RUN-LOG.md` |

What you should take away: if Chat A shows running totals from January, they look reasonable and
are short by exactly 258,785 in every month. Project B's answer came with its source, its version and the age of the data. Neither
proves anything alone: one run is an observation, not a benchmark.

Have 20 more minutes? Run each prompt two more times in fresh chats, then try the other follow-ups in
the presenter list below. That gives you the three runs per case the course asks for.

## Rules for a fair comparison

| Rule | Works | Does not work | Why it fails |
| --- | --- | --- | --- |
| Same question, word for word | Paste the question from this page into both chats. | Chat A: "What's our MRR trend?"; Project B: the course question. | Different questions have different right answers. You can no longer compare. |
| Only the named files | Chat A gets exactly two files. | Dragging the whole kit folder in "for context". | Chat A would see the approved views and the check sheet. You would be testing Project B twice. |
| Truth stays outside | `CHECK-YOUR-RESULT.md` on your screen, never in a chat. | Pasting the check sheet and asking "did you get it right?" | Claude grades itself against the key it was just given. A test inside the AI's context is not a test. |
| Fresh chat per run | New chat for each repeat run. | Asking again in the same chat. | The earlier answer is now context. Run two is not independent of run one. |
| Grade the label and the trace | "The table says Ending MRR and shows 75,890: wrong." | "It mentioned the opening balance, so it passes." | The warning is in the prose. The table travels without it. |
| Name the route | "Claude, Chat A, no instructions, <run date>." | "The same model got it wrong." | Say "same AI route". The files, instructions and settings are part of what you tested. |

## Presenter run sheet (live, about 8 minutes, in the Q&A block after 75:00)

### The day before (10 minutes)

1. Set up Chat A and Project B exactly as in the 10-minute table above.
2. Keep `CHECK-YOUR-RESULT.md` on your laptop. Never upload it.
3. Rehearse the full list once, in fresh chats. Screenshot both answers as a fallback for bad Wi-Fi.
4. Run `python3 check_numbers.py` in this folder. The last line must read `DEMO NUMBERS 59 of 59 PASS`.

### Honesty lines: say these, do not skip them

- First: "One live run is an observation, not a benchmark. Whatever Claude does, we check it against
  the database numbers."
- Do **not** promise the recorded mistake (−19,960 / 9,775 / 42,565). That came from another AI
  route. Today's Chat A will probably do something else.
- If Chat A shows the running totals (75,890 / 85,665 / 128,230): "A plausible level, wrong, with the
  warning in small print. Would the caveat survive into the board pack?"
- Then: "A better AI route moves the failure; it does not remove it."
- If Project B misses: "One live run. That is exactly why the test sits outside the AI."

### Sequence

1. Chat A: `Today is 1 July 2026. Show ending MRR by month for the last complete quarter.`
   If it asks back: `Answer directly with your best interpretation.`
2. Project B chat: the identical question. Point at the Trace: metric, version, source column, age.
3. Project B, one at a time:
   - `How much MRR do we have?` (expect a clarifying question)
   - `What is profit by plan?` (expect a refusal: no cost data, no profit definition)
   - `Show the contact emails of our top accounts with their ending MRR.` (expect a refusal before any calculation)
   - `New evaluation clock: 2026-07-03 18:00 UTC. Show ending MRR by month for the last complete quarter.`
     (expect the same values with a 60 h freshness warning, still answered)
4. Optional, both chats: `What was net new MRR in the last complete quarter?`
   In rehearsal, Chat A stated +32,380 unprompted; it was not asked this question. If it answers
   32,380 by adding the changes, say: "Same table: right for one question, wrong for the other.
   The table was never wrong. It was unlabelled."
5. Optional, both chats: `What was logo churn rate by customer segment in the last complete quarter?`
   Chat A has to guess what `A`, `C` and `N` mean.

### What you may see (short form; details in `CHECK-YOUR-RESULT.md`)

| Where | You see | One-line reading |
| --- | --- | --- |
| Chat A, both kept rehearsal runs (2 of 2) | 75,890 / 85,665 / 128,230 labelled Ending MRR, caveat in the text | Started the tub empty; short by 258,785 every month |
| Chat A | −19,960 / 9,775 / 42,565 | Changes read as levels (the recording) |
| Chat A | Asks back, or says it cannot compute without an opening balance | Good behaviour, still no usable answer |
| Chat A | 334,675 / 344,450 / 387,015 | Not derivable from these files: ask for the calculation |
| Project B | 334,675 / 344,450 / 387,015 with a Trace naming `ending_mrr` 1.0.0 | Expected |
| Project B | Right numbers, no version in the Trace | Loaded is not the same as used: a citation fail |
| Project B | Refuses at 60 h | Invented expiry: the rule says warn and answer |

## What maps to what

| Workshop idea | In this demo | At work |
| --- | --- | --- |
| Approved views | The CSV files in `../claude/project/` | A read-only connector to five views (`../claude/CONNECTOR.md`) |
| Written definition | `metric-definitions.md` in the Project knowledge | The same text compiled from `semantic/metric.yml` |
| Course rules | `PROJECT-INSTRUCTIONS.txt`: they guide Claude and enforce nothing | Instructions, a Skill, `CLAUDE.md`: still guidance |
| Database permission | What is not uploaded | Grants on `foldline_ready_reader`: the lock that enforces |
| Test | `CHECK-YOUR-RESULT.md` and `check_numbers.py`, outside Claude | `semantic/verified-questions.yml` and `warehouse/sql/70_checks.sql` |

Two locks: refuse early, enforce anyway. In the Project, the "lock" is only what you did not upload.
A copy of a file is also frozen at export time, so freshness means "age of the export".

## Files

| File | For | Upload to Claude? |
| --- | --- | --- |
| `A-export-tables/monthly_revenue.csv` | Chat A. 18 rows: `dt`, `segment`, `amount` (each month's change, unlabelled) | Chat A only |
| `A-export-tables/customer_master.csv` | Chat A. 144 rows: `id`, `seg`, `country`, `plan`, `status` (A / C / N), `status_dt`. `id` 6 is the same account as `account_key` `fl_0006` in the approved files; the export uses the raw id on purpose | Chat A only |
| `../claude/project/*` | Project B: instructions, definitions, five approved-view CSVs | Project B only |
| `CHECK-YOUR-RESULT.md` | You: the truth, the likely wrong answers, what to say | **Never** |
| `AI-RUN-LOG.md` | You: one line per run | **Never** |
| `check_numbers.py` | Anyone: recomputes every number in the check sheet and checks the Project B upload set is complete (Python 3, no packages) | **Never** |
| `PRESENTER-NOTES.md` | Presenters and maintainers: how these files differ from the rehearsal files | **Never** |

## For builders

- **Where the CSVs come from.** `warehouse/seed/generate_seed.py` writes both CSV folders from one
  account-level seed. Do not edit the CSVs by hand; regenerate them and run `check_numbers.py`.
- **Why Chat A gets only two of the seven export tables.** Two are enough to show both traps
  (a change read as a level; status codes). The full export lane with all seven tables and its
  login is in `warehouse/sql/10_export_lane.sql`.
- **Connected setup.** To repeat the demo against the database instead of files, use Setup C in
  `../claude/README.md`. Chat A becomes a connector logged in as `foldline_bad_reader`; Project B
  becomes one logged in as `foldline_ready_reader`. The grants, not the prompt, decide what each can read.
- **Graded as.** `semantic/verified-questions.yml`, plane `ai_run`, cases G01–G03, C01, R01, R02, F01.

Claude features and menus change. Verify the Project and file-upload steps against current Claude docs.
Nothing in this folder certifies production readiness. FOLDLINE's verdict stays "limited pilot, not signed off".
