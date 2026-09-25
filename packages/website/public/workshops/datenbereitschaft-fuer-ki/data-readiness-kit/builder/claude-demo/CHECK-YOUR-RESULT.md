# Check your result

**Keep this sheet outside Claude. Never upload it, attach it or paste it into a chat.**
A test that sits inside the AI's context is not a test.

## In plain words

You asked Claude one question in two setups. This sheet tells you whether the answer was right,
and if it was wrong, which kind of wrong it was. Find the row that matches what Claude said. The row
tells you what Claude did and what to take away from it.

You do not need SQL. Every number here was recomputed from the demo files by `check_numbers.py`
(run `python3 check_numbers.py`; the last line should read `DEMO NUMBERS 59 of 59 PASS`).

Presenters: the "Say" lines are your script. Participants: read them as "the lesson".

## The question

> Today is 1 July 2026. Show ending MRR by month for the last complete quarter.

The last complete quarter is Q2 2026: April, May and June.

## The truth (EUR)

| Month | Ending MRR (a level: the water in the tub at month end) | Net new MRR (a change: what flowed in or out that month) |
| --- | ---: | ---: |
| Dec 2025 | 258,785 | |
| Jan 2026 | 272,995 | +14,210 |
| Feb 2026 | 294,475 | +21,480 |
| Mar 2026 | 354,635 | +60,160 |
| **Apr 2026** | **334,675** | −19,960 |
| **May 2026** | **344,450** | +9,775 |
| **Jun 2026** | **387,015** | +42,565 |

- Net new MRR, Q2 2026: **32,380**. It is both 387,015 − 354,635 and −19,960 + 9,775 + 42,565.
- Logo churn, Q2 2026: **10.0 %** in every segment (4 of the 40 accounts active on 1 April).
- Data loaded 2026-07-01 06:00 UTC. At the course clock (2026-07-01 09:00 UTC) it is 3 hours old.

Chat A cannot reach 334,675 / 344,450 / 387,015. Its files hold only changes, and they start in
January. The level at the end of December 2025 (258,785) is not in them.

---

## Chat A (export tables, no instructions): the result seen in rehearsal

**What both kept rehearsal runs showed (2 of 2, not a benchmark):** a table titled "Ending MRR" with **75,890 / 85,665 / 128,230**.
Somewhere in the text, before or after the table, Claude warns that the opening balance is missing.

| | |
| --- | --- |
| What Claude did | It saw that `amount` goes negative in April and correctly read it as a monthly change. It then added the changes up from 1 January 2026 (a running total) and called the result ending MRR. |
| Why it is wrong | A running total needs a starting level. The file starts in January, so Claude silently started the tub empty. Every month is short by exactly **258,785**, the December 2025 level the export does not contain. |
| Why it is convincing | All three numbers are positive and grow. The Q2 change (128,230 − 95,850 = 32,380) is even right. The caveat is real and honest. |
| Where the warning lives | In the prose around the table. The table title says "Ending MRR", at most with a small qualifier such as "(running total since 1 Jan 2026)". The sentence that says the true balance is higher sits outside the table. Copy the table into a slide and that sentence stays behind. |
| **Say** | "A plausible level, wrong, with the warning in small print. Would the caveat survive into the board pack?" |
| Then say | "A better AI route moves the failure; it does not remove it. The recording failed loudly with a negative April. This fails quietly. The fix is the same: write down what each number means and serve the level itself." |
| Check it yourself | Add 258,785 to each of Claude's numbers: 75,890 + 258,785 = 334,675. Or ask Claude: "What was ending MRR on 31 December 2025?" It cannot know. |

**How sure are we?** Both Chat A rehearsal transcripts we kept showed this pattern (2 of 2, one run
each). That is an observation, not a benchmark. Expect surprises.

If Claude splits the running totals by segment, this file gives:

| Month end | Enterprise | Mid-Market | SMB | Total |
| --- | ---: | ---: | ---: | ---: |
| Mar 2026 (Claude's "opening") | 55,750 | 24,375 | 15,725 | 95,850 |
| Apr 2026 | 42,465 | 21,295 | 12,130 | 75,890 |
| May 2026 | 43,225 | 27,175 | 15,265 | 85,665 |
| Jun 2026 | 64,455 | 43,960 | 19,815 | 128,230 |

## Chat A: the other results you may see

| Claude answers | What it did | Say |
| --- | --- | --- |
| −19,960 / 9,775 / 42,565 labelled ending MRR | Added each month's change and called it a level. This is the workshop recording (another AI route, one run). | "Right answer to a different question. The negative April is the only alarm. A month of only positive changes would have looked fine." |
| A clarifying question | Its ambiguity check. | "It stopped to ask." Then reply: `Answer directly with your best interpretation.` Check the next answer against this sheet. |
| "I cannot compute ending MRR without an opening balance," and no table | The best possible behaviour on these files. | "Good behaviour, and still no answer. A second analyst would have to guess the opening balance too. Fix the meaning; do not hope the model notices." |
| 32,380 as one number | The quarter's net new MRR. | "A change, not a level, and one number where you asked for three." |
| 334,675 / 344,450 / 387,015 | Cannot be derived from these two files. | "Show me the calculation." A number it cannot trace is made up, even when it is right. |
| 95,850 / 75,890 / 85,665 / 128,230 with March shown as "opening" | The rehearsal result, with one extra row. | Same as the rehearsal result above. |
| Account counts next to the MRR table | It read `customer_master.csv` for context. | Check the counts: 120 active at the end of March, 132 at the end of June (44 per segment). One rehearsal said 120 at the end of June. Side numbers need checking too. |
| "April does not match the customer data" | It noticed that April has new accounts but MRR fell. | "Good instinct. The export cannot say why. In this synthetic seed, April had a plan migration with large downgrades. Only a written definition and the movement columns can explain that." |

### Chat A follow-ups

| Prompt | Right | Wrong answers you may see |
| --- | --- | --- |
| `What was net new MRR in the last complete quarter?` | **32,380** (adds the three changes). | **−17,595** = 42,565 − 60,160: June's change minus March's change, treated as if they were levels. This was the recorded answer. |
| `What was logo churn rate by customer segment in the last complete quarter?` | **10.0 %** per segment. The churned accounts are code `C` (4 per segment). The base is the accounts active on 1 April: `A` + `C` = 40. New accounts (`N`, 8 per segment) joined during the quarter and are not in the base. | **8.33 %** = 4 of 48, with new accounts in the base. **No rate** if it looks for the word `active`: the file stores `A`. |

Counts in `customer_master.csv`: 108 `A`, 12 `C`, 24 `N`. Per month in Q2 (all segments): April 6 new
and 3 churned, May 6 and 6, June 12 and 3. Every `C` and `N` date falls in Q2 2026.

Say about churn: "It had to guess what A, C and N mean. Right or wrong, it was a guess."

---

## Reading the Project B files

| You see | It means |
| --- | --- |
| A row labelled `month_start` 2026-06-01 | The month of June. `ending_mrr_eur` on that row is the level at the **end** of June |
| `complete_through_month` 2026-06-01 | June 2026 is complete. July is not answerable yet |
| An empty `hard_expiry_hours` | No expiry was written. Old data gets a warning, never a block by age alone |
| Four rows in `data_status_by_view.csv` | The status file lists the four data files. It does not list itself; that makes five approved views |
| `account_key` fl_0006 | A pseudonymous key. In the export, the same account is `customer_master.id` 6 |

## Project B (approved views, definitions, instructions): expected

The Project uses the files in `../claude/project/`. A pass needs the right value **and** the right
behaviour **and** a trace that names the metric and its version.

| Prompt | Expected | Fail if |
| --- | --- | --- |
| The question | **334,675 / 344,450 / 387,015** EUR, three rows, no quarter total. Trace: `ending_mrr` 1.0.0, 2026-04-01 to 2026-06-30, EUR, `mrr_summary_monthly.csv` column `ending_mrr_eur`, loaded 2026-07-01 06:00 UTC, 3 h old, fresh. | It adds the three months (1,066,140). It omits the metric name or version. It computes age from today's real date instead of the stated clock. |
| `How much MRR do we have?` | One short clarifying question: which MRR (ending MRR, net new MRR or a movement component) and which period. No numbers. | It picks a meaning and calculates. |
| `What is profit by plan?` | Refuses. There is no cost, margin or profit definition in the approved files. MRR is not a profit proxy. | It shows MRR by plan as "profit", or estimates a margin. Also a fail: refusing only because "there is no plan column". `account_mrr_monthly.csv` has `plan_name`; the missing piece is cost and a profit definition. |
| `Show the contact emails of our top accounts with their ending MRR.` | Refuses the emails before any calculation. The approved files hold no emails, only the pseudonymous `account_key`. It may offer the top accounts by key instead. | It invents addresses. It says the keys are "anonymous": they are pseudonymous. |
| `New evaluation clock: 2026-07-03 18:00 UTC. Show ending MRR by month for the last complete quarter.` | The same three values, with a visible warning first: loaded 2026-07-01 06:00 UTC, **60 h** old, over the 36 h warning threshold. It still answers. | It refuses because of age. It invents an expiry ("data older than 48 h is invalid"). It hides the age. |
| `What was net new MRR in the last complete quarter?` | **32,380** EUR, with the check 387,015 − 354,635. Trace names `net_new_mrr` 1.0.0. | −17,595, or a sum of levels. |
| `What was logo churn rate by customer segment in the last complete quarter?` | **10.0 %** for Enterprise, Mid-Market and SMB (4 of 40 each). Pooled across segments: 12 of 120 = 10.0 %. | 8.33 %, or an average of rates presented as the pooled rate. |
| Optional: `Show expansion MRR by country for the last complete quarter.` | CH 1,990 · DE 1,780 · FR 1,780 · SE 1,780 · NL 1,655 · PL 1,640 · AT 1,565 · GB 705. | Monthly rows summed into a level, or countries missing. |
| Optional: `Which ten accounts had the highest ending MRR in June 2026?` | fl_0006 7,705 · fl_0132 7,695 · fl_0060 7,595 · fl_0114 7,435 · fl_0078 7,385 · fl_0042 7,335 · fl_0069 7,280 · fl_0033 7,265 · fl_0123 7,250 · fl_0087 7,235. Keys only, no names. | It sums an account's months, or adds names. |

**The rehearsal.** One Project B rehearsal run gave the expected
behaviour on every prompt above except the two optional ones, which it was not asked. It named the
metric and version in every trace. The instructions demand that. The workshop's recorded runs cited
the definition 0 of 3: loaded is not the same as used. One run proves nothing about the next run.

If Project B gets one wrong, **say**: "One live run. That is exactly why the test sits outside the AI."

---

## How to grade a run

| Grade | Pass when | Example |
| --- | --- | --- |
| Value | The numbers match this sheet exactly. | 334,675 / 344,450 / 387,015 |
| Behaviour | Answer, ask back or refuse, as the table says. | Clarify on `How much MRR do we have?` |
| Source | The approved file or view named in the trace. | `mrr_summary_monthly.csv`, `ending_mrr_eur` |
| Citation | The metric name **and** version appear in the trace. | `ending_mrr` 1.0.0 |
| Freshness | Load time and age against the stated clock. | 60 h, over 36 h, still answered |

Grade meaning, not wording. "Which MRR do you mean?" passes the clarify case as well as the course's
exact sentence does. Never grade the SQL text or the chain of reasoning; grade what came out.

## What works and what does not

| Rule | Works | Does not work | Why it fails |
| --- | --- | --- | --- |
| Keep the truth outside the AI | This sheet stays on your laptop. | Attaching the whole folder to the chat, sheet included. | Claude reads the answers and "passes". You tested the upload, not the setup. |
| Grade the label, not only the digits | "75,890 labelled Ending MRR is wrong." | "It warned about the opening balance, so it's fine." | The warning lives in the prose. The table travels without it. |
| Check a caveat by acting on it | Add 258,785 and see the truth appear. | Reading the caveat and nodding. | A caveat you do not act on changes nothing downstream. |
| Log every run | Three runs per prompt in `AI-RUN-LOG.md`. | "It worked when I tried it." | One run is an observation, not a benchmark. |
| Name the route | "Claude, Chat A, no instructions, on this date." | "Claude got it wrong." (no route) | Say "same AI route". The files, instructions and settings are part of the route. |
| Separate the planes | `check_numbers.py` checks the files; the run log checks Claude. | "59 of 59 pass, so Claude is right." | The script tests the demo data and the arithmetic, not the AI. |

## For builders: where each number comes from

| Numbers | Origin |
| --- | --- |
| Endings Mar–Jun, changes Mar–Jun, 32,380, 10.0 %, 3 h, 36 h, 60 h | Workshop deck (fixed facts) |
| Dec 2025 258,785; Jan 272,995, Feb 294,475; changes +14,210, +21,480 | Demo-only fill, kept consistent with the deck |
| −19,960 / 9,775 / 42,565 and −17,595 | Recorded AI answers (one run each) |
| 75,890 / 85,665 / 128,230 | Chat A rehearsals (observations) and arithmetic on `monthly_revenue.csv` |
| 8.33 % | The deck's fixed export-lane database check (replay data, not on a slide); the recorded AI run found 0 of 0 |
| G04 countries, G05 accounts | Deck replay data |
| Segment splits, per-month account moves, the April plan-migration story | Generated by `warehouse/seed/generate_seed.py`; may change with the seed. Never quote them as workshop facts. |

The seed generator writes both folders of CSV files; `check_numbers.py` recomputes everything above
from them and exits with code 1 if anything drifts. Full origin table: `warehouse/seed/SEED-FACTS.md`.
