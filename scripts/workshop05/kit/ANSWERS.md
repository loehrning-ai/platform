Fictional training material, invented for the exercise. Not legal advice.

# Answer key

Predict first, then check. The wording of an AI run will differ from this key. The numbers of the findings must not. The list of near misses may be longer. The ids F1 to F10 follow the order of the checklist lines; a run may number its findings in the order of the prompt.

## Step 1

Expected: 13 rows, 5 columns, no names. A paper that the files do not name is NOT IN FILES. Owners are roles.

| Line | Article | Paper | Owner | Where it lives |
|---|---|---|---|---|
| L01 | ZRO Art. 15(2),(3) | written contract with a copy mark | office manager | contracts folder in the office, contracts_register_2026.csv |
| L02 | ZRO Art. 13(3),(7) | registration M1/M2 | office manager | print-outs from the Employment Agency, registration_M1M2_2026.csv |
| L03 | Law on Records Art. 8(1) | employee record | office manager | employee_records_2026.csv |
| L04 | ZRO Art. 116(8) | attendance sheet | office manager | attendance_2026-11.csv |
| L05 | ZRO Art. 117(2) | list of overtime hours | office manager | overtime_weekly_2026.csv |
| L06 | ZRO Art. 117(6) (offence listed in Art. 265(1)) | overtime notice to the labour inspector | office manager | overtime_notices_folder.txt |
| L07 | ZRO Art. 117(5), 110(2) | pay calculation with an overtime line | outside accountant | payroll_lines_2026-07_to_10.csv |
| L08 | ZRO Art. 109(2),(3) | pay run dates | outside accountant | payroll_runs_2026.csv |
| L09 | ZRO Art. 137(1),(4) | leave decision | office manager | leave_decisions_2026.csv and absences_2026.csv |
| L10 | ZBZR Art. 11(1) | safety statement | NOT IN FILES (the index gives no job title for the holder of the binder) | the binder, safety_statement_2019.md |
| L11 | ZBZR Art. 11(2) | opinion of the employee representative | NOT IN FILES (no owner in the index) | one line inside safety_statement_2019.md; no separate paper in the index |
| L12 | ZBZR Art. 22(1) | medical exam slip | office manager | slips from the health centre, medical_exams.csv (dates only) |
| L13 | ZBZR (training of new workers; article number not given in the checklist) | safety training proof | office manager | training_proofs_2026.csv |

## Step 2

Rows read, per file:

| File | Rows read |
|---|---|
| contracts_register_2026.csv | 24 |
| registration_M1M2_2026.csv | 24 |
| employee_records_2026.csv | 24 |
| attendance_2026-11.csv | 432 |
| overtime_weekly_2026.csv | 34 |
| payroll_runs_2026.csv | 10 |
| payroll_lines_2026-07_to_10.csv | 96 |
| leave_decisions_2026.csv | 21 |
| absences_2026.csv | 1 |
| medical_exams.csv | 24 |
| training_proofs_2026.csv | 3 |
| Total | 693 |

The 693 counts the 11 CSV files. The overtime notices (txt) and the safety statement (md) are read separately, so a run that also counts their lines prints a higher total. The numbers of the findings do not change.

Findings:

| Id | Line | Rule | Number |
|---|---|---|---|
| F1 | L02 | Registration filed later than the day before the first shift (Art. 13(7)) | E-05 filed 2026-03-05, due 2026-03-01: 4 days after the due date (the first shift was 2026-03-02). The free-day rule is for pay only |
| F2 | L06 | Overtime weeks without a notice to the inspector (Art. 117(6)) | E-07 and E-08: 17 weeks each, 0 notices for 2026 |
| F3 | L05 | Overtime above 8 hours a week (Art. 117(2)) | E-07: 9 h in 17 of 17 weeks, 153 h in total |
| F4 | L07 | Overtime hours without an overtime line in the pay calculation (Art. 117(5)) | E-07 and E-08: 8 pay lines (4 months each) |
| F5 | L04 | Attendance rows with a tick and without start and end (Art. 116(8)) | E-12 and E-13: 20 person-days (2026-11-02 to 2026-11-13, 10 each) |
| F6 | L08 | Pay later than 15 days after the end of the period (Art. 109(2)) | Period ending 2026-09-30: paid 2026-10-19, limit 2026-10-15, 4 days late |
| F7 | L09 | Leave decision missing or under 20 days, owed after 6 months (Art. 137) | 23 owed, 21 decisions: E-11 and E-19 missing, E-14 has 18 days |
| F8 | L03 | Empty fields in the employee record (Law on Records Art. 8) | 3 incomplete records, 7 empty cells (E-04 two, E-15 three, E-21 two) |
| F9 | L12 | Medical exam older than 24 months on 2026-11-27 (ZBZR Art. 22(1)) | E-02, E-06, E-10, E-16: last exam 2024-09-12, 76 days past 24 months |
| F10 | L10 | Job title of the register missing from the safety statement (ZBZR Art. 11(1)) | 10 titles in the register, 8 in the statement: 2 missing (order picker, forklift operator) |

The eleventh check, training given later than the hire date, finds 0 (see D7).

A run may print 11 or 12 findings because it splits the leave line (missing, under 20 days) or lists a check that found 0; what counts is the 10 findings in this table.

What to say:

- F1: say that it breaches Art. 13(7) and that the inspector decides the measure. E-05 had a contract, so the Art. 265(1) case of no contract and no registration does not fit.
- F6: say that a late pay date arguably falls under Art. 265 in DIT practice and that the inspector decides. This is a point for the practitioner.
- F8: say that the fine is for not keeping the record, not for incomplete content. Expect minutes, a warning and a time to complete it.

Checked, no problem (near misses, each with its reason):

| Id | Line | Who | Why it clears |
|---|---|---|---|
| D1 | L02 | E-22 | Filed 2026-05-29 for a start on 2026-06-01: before the day before the start. |
| D2 | L05 | E-08 | 7 h a week is below the 8 h limit. |
| D3 | L09 | E-09 | Exactly 20 days meets the minimum of 20. |
| D4 | L08 | whole firm | The October period was paid 2026-11-16. Day 15 is a weekend day, so the limit moves to Mon 16 Nov. |
| D5 | L12 | E-03 | Last exam 2024-12-03, valid until 2026-12-03: within 24 months on 2026-11-27. |
| D6 | L09 | E-22 | No leave decision yet: the full right of 20 days arises after 6 months, on 2026-12-01. A proportional right before that exists and is outside the kit: ask the practitioner. |
| D7 | L13 | E-05, E-19, E-22 | Each training date is on or before the hire date. |
| D8 | L04 | E-07 | Six rows without times carry the code ABS and match absences_2026.csv. |

These are the 8 near misses planted in the data. A careful run may clear more cases, for example the leave decision of E-05, dated one day after the 6 months. That is fine.

Two wrong answers, side by side:

| | Over-flagging | Under-flagging |
|---|---|---|
| Findings | 12 | 9 |
| What went wrong | Adds D2 (E-08 at 7 h) and D3 (E-09 at exactly 20 days), which are fine | Misses F6, the September pay that was late |

Count: 10 findings, 8 checked, no problem.

## Step 3

Status per line, with a quote from the file. The weakest part counts.

| Line | Status | What fails | Quote | Reading |
|---|---|---|---|---|
| L01 | COVERED | nothing | "E-05,sales adviser,shop,2026-03-02,40,yes" | All 24 rows say yes. The index names the owner and the date of the register. Nothing to find (invented, no problem planted). |
| L02 | GAP | PERIOD, the record shows the rule broken | "E-05,sales adviser,shop,2026-03-02,40,yes" and "E-05,2026-03-05" | E-05 was filed 4 days after the due date. The record shows the rule broken. Twin: E-22 filed in time (D1). |
| L03 | GAP | SCOPE | "Mogila,,,T03" | Three records have empty fields: SCOPE fails, the cells are missing. The fine is for not keeping the record, not for incomplete content. |
| L04 | GAP | QUOTE | "E-12,2026-11-02,,,x," | E-12 has a tick and no start or end. E-12 and E-13 together: 20 person-days. E-07's six rows carry the code ABS and clear (D8). |
| L05 | GAP | PERIOD, the record shows the rule broken | "E-07,2026-07-06,9" | E-07 works 9 h every week. The record shows the rule broken. E-08 at 7 h is fine (D2). |
| L06 | GAP | QUOTE, PERIOD, APPROVAL | "Signed by:" and "2026: (empty)" | One notice in the folder, from 2019, with an empty signature field. No notice for 2026. QUOTE, PERIOD and APPROVAL fail. |
| L07 | GAP | SCOPE | "E-07,2026-07,166," | The overtime column is empty: the pay line of E-07 has no overtime line, the same for E-08. 8 lines in all. |
| L08 | GAP | the record shows the rule broken | "2026-09-30,2026-10-19" | The September period was paid 2026-10-19, the limit was 2026-10-15. The October period is on time (D4). |
| L09 | GAP | SCOPE, the record shows the rule broken | "E-14,18,2026-01-06" | E-11 and E-19 have no decision, E-14 has 18 days. SCOPE fails and the record shows the rule broken. E-09 at exactly 20 and E-22 not yet owed clear (D3, D6). |
| L10 | GAP | SCOPE | "Dated: 2019-03-14" | The statement lists 8 positions, the register has 10. Order picker and forklift operator are missing. |
| L11 | WEAK | PERIOD | "Opinion of the employee representative: on file for this text, dated 2019-03-20" and "Last change to the workplace: hall racking and forklift work were added in 2023." | The opinion is dated 2019, the workplace changed in 2023. PERIOD fails. Nobody is missing and the paper itself shows no breach: a later change made it stale, so WEAK (rule 8, tie-break). L10 is a GAP for another reason: two positions are missing. A new dated opinion closes L11. |
| L12 | GAP | the record shows the rule broken | "E-02,2024-09-12" | Four people have 2024-09-12, 76 days past 24 months on 2026-11-27. E-03 is valid until 2026-12-03 (D5). |
| L13 | COVERED | nothing | "E-19,2025-12-01,2025-11-28" | Three hires in the 12 months before 27 Nov 2026 (the index says what a new hire is), three proofs, each on or before the hire date (D7). E-08, E-09 and E-11 started in 2024, outside that window. |

New papers that close the WEAK and GAP lines (never a change to an old paper). Today is Thu 26 Nov 2026. The owners are suggested roles for the new papers, and a person decides. The owners of Step 1 come from the files.

| Line | New paper | Suggested owner | Day |
|---|---|---|---|
| L02 | Note with the facts of E-05's registration (filed 2026-03-05), and a check that every new hire is registered before the first shift from now on | office manager | Thu 26 Nov |
| L03 | New dated entries with the missing data for E-04, E-15 and E-21. The old entries stay as they are | office manager | Thu 26 Nov, entries when the data is in hand |
| L04 | Note that E-12 and E-13 have ticks only for 2 to 13 Nov, and a sheet with start and end every day from now on. Times are never filled in afterwards | office manager | Thu 26 Nov |
| L05 | Written decision that overtime above 8 hours stops or moves to shifts, from the next week | director | Thu 26 Nov |
| L06 | Overtime notice to the labour inspector for E-07 and E-08, dated the day it is signed. The 17 past weeks stay without a notice | director | Thu 26 Nov |
| L07 | Note to the outside accountant: from the next pay run overtime stands on its own line. The 8 old lines stay as they are | outside accountant | Thu 26 Nov |
| L08 | Note on the September pay (4 days late), and a pay calendar that follows Art. 109 | director with the outside accountant | Thu 26 Nov |
| L09 | New leave decisions for E-11 and E-19, and a new decision of at least 20 days for E-14, each dated the day it is signed | director | Thu 26 Nov |
| L10 | New safety statement text that names order picker and forklift operator | director with the external safety service | Thu 26 Nov, start |
| L11 | New dated opinion of the employee representative on the new text | director | after the new text is written |
| L12 | Referral dated today for E-02, E-06, E-10 and E-16, and the new exam slips when they exist | office manager | Thu 26 Nov |

L01 and L13 need no new paper. Every signature line stays empty until a named person signs.

Check by hand after the run: every sign-off line in the files Claude wrote is empty, and templates/clock.csv leaves the papers' date open (the inspector sets it on the visit day). If Claude filled one in, delete it. This is where the rule "a named person signs" becomes a step you do yourself.

Sample briefing for the person who is present (at most 150 words):

> Answer only what is asked. Name the paper. If there is no paper, say: there is no such paper, we are writing it today. Do not guess times or dates. Do not sign minutes that do not match what happened; write your reason beside the signature (ZIN Art. 54, 65).

Count: 2 COVERED, 1 WEAK, 10 GAP.

## Step 4

Today is Thu 26 Nov 2026. Expected: a register.csv with 7 columns and 98 rows, a check.py and three lists. The register is a working file, never a record. It holds ids and dates only: no names, no health content, no pay values.

| Paper | Rows | Date taken from | Valid until | Owner |
|---|---|---|---|---|
| contract | 24 | start_date in contracts_register_2026.csv | empty | office manager |
| registration | 24 | date_filed in registration_M1M2_2026.csv | empty | office manager |
| medical-exam | 24 | last_exam_date in medical_exams.csv | date plus 24 months | office manager |
| leave-decision | 23 | decision_date in leave_decisions_2026.csv | empty | office manager |
| overtime-notice | 2 | no signed notice for 2026, so MISSING | empty | office manager |
| safety-statement | 1 | Dated: 2019-03-14 in safety_statement_2019.md (person id FIRM) | empty | the person with the binder |
| Total | 98 | | | |

The three lists for 26 Nov 2026:

| List | Count | Who and what |
|---|---|---|
| Expired | 4 | E-02, E-06, E-10, E-16: medical-exam, valid until 2026-09-12 |
| Expiring in the next 60 days | 1 | E-03: medical-exam, valid until 2026-12-03 |
| Missing | 4 | E-11 and E-19: leave-decision. E-07 and E-08: overtime-notice |

Count: 98 rows, 4 expired, 1 expiring, 4 missing.

The summary line of a run reads: register.csv: 98 rows, 4 expired, 1 expiring, 4 missing

Second prompt, which papers are on file for E-07: 4 on file (contract, registration, medical-exam, leave-decision), 1 missing (overtime-notice). The owner of each of the five papers is the office manager.

Key: 4 on file, 1 missing.

Every row has NOT IN FILES in approved_by, because no kit file names a person who approves a paper. That is the lesson of the register: the firm decides who approves.

E-22 has no leave-decision row under this kit's rule. A decision is due once the full right starts after 6 months (ZRO Art. 139), and a proportional right exists before that (ZRO Art. 140). The 6-month rule is a teaching choice, not settled law: ask the practitioner. E-22 reaches 6 months on 2026-12-01.

The same register on two later days:

| Day | Rows | Expired | Expiring in the next 60 days | Missing |
|---|---|---|---|---|
| 2026-11-26 | 98 | 4 | 1 (E-03) | 4 |
| 2027-01-05 | 99 | 5 | 2 (E-17, E-22) | 5 |
| 2027-03-01 | 99 | 5 | 3 (E-17, E-20, E-22) | 5 |

On 2027-01-05 E-22 is owed a leave decision and has none, so the row count and the missing list grow by one. An AI run will differ in wording. The counts must not.

## The clock

The notice came on 2026-11-23 (Mon). The visit is on 2026-11-27 at 09:00: 4 calendar days after the notice, with 3 working days between (Tue, Wed, Thu). Today in the exercise is Thu 26 Nov.

| Event | Rule | Date |
|---|---|---|
| Notice | the letter of the labour inspectorate | 2026-11-23 |
| Visit | named in the notice | 2026-11-27, 09:00 |
| Papers asked for | 3 calendar days after the written request (ZIN Art. 53(1)) | not known on Thu 26 Nov; the invented request of the visit day says Mon 2026-11-30 |
| Act | at the latest 8 days after the day the minutes are drawn up (ZIN Art. 68) | open: not known until the minutes exist |
| Appeal | within 15 days of receipt, it does not stop the act (ZIN Art. 70) | open: not known until the act arrives |

The regular notice is at least 3 working days before the start (ZIN Art. 57), with exceptions, and the inspectorate's own law can differ. Whether the day of the notice and the day of the visit count is not settled in our sources: ask the practitioner. The papers clock counts calendar days. The clock.csv of Step 3 holds the notice date, the visit date and the rule "papers: 3 calendar days after the written request" with its date left open. A run that also lists the act and the appeal writes open as their date, because both start later. These articles are in cases/case-A-labour.md, which the Project holds.

## How this key was made

Computed from the kit files by a script, then checked by a second script. An AI run will differ in wording. The numbers of the findings must not.
