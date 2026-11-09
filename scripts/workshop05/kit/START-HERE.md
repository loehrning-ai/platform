Fictional training material, invented for the exercise. Not legal advice.

## The rules in one minute

A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote.
COVERED, WEAK or GAP. A file out of date or unapproved: WEAK. A part without evidence, or the record shows “not met”: GAP. The weakest part counts.
No quote, no COVERED. A policy shows intent; only a record shows practice.

## What you do

You are the office of an invented firm that has received a notice of inspection. In four steps Claude helps you build a table, run a check, write a plan and build a register. A person decides and signs. After the audit, keep-watch/ keeps the register current.
Level 2 means the files are invented, so you may put them in Claude. Level 3 is your own firm: Claude writes a script, you run it on your own computer, and Claude sees only column names and 3 invented rows.

## Set up once

Open Claude, make a Project, paste project-instructions.md, add checklists/ and folder/. These files are invented, so this is Level 2 of the data ladder. Your own firm later: Level 3, only column names and 3 invented rows.

Add cases/case-A-labour.md and templates/register.csv to the Project as well. The clocks and the article numbers of Step 3 are in the case file, the columns of Step 4 in the template. Cases B and C are for other audits and stay out of the Project. On the Free plan all Project files must fit into Claude's context window; if they do not, add the files of one step at a time.
Optional: the skill audit-nachweise. The four steps also work with the Project instructions alone. How to install it is in the last section of this file.

## Step 1: make the table

Predict first, then check ANSWERS.md.
In the room 6 minutes. At your desk about 20, our estimate, not measured.

    Read the three checklist excerpts. Make a table with one row per checklist question: line id, article, the paper that answers it, its owner, where it lives (use folder-index.md). Do not open the folder files yet. If a paper is not in the files, write NOT IN FILES. Use ids, no names. Answer with the table only.

## Step 2: run the check

Predict first, then check ANSWERS.md.
In the room 9 minutes. At your desk about 20, our estimate, not measured.

    Write and run a check on the folder's CSV, txt and md files, skipping CSV lines that start with #. Print how many rows you read in each file. For every finding print id, rule and number: filing later than the day before the first shift; overtime weeks above 8 hours; overtime weeks without a notice; pay lines without an overtime line; attendance rows without start and end; pay later than 15 days after the period (a free day moves it); leave decisions missing or under 20 days (owed after 6 months); empty record fields; exams older than 24 months on 27 Nov 2026; job titles missing from the safety statement; training given later than the hire date. Then list each near miss you ruled out and why. End with one totals line: rows read, findings, near misses checked. Change no file. Answer in 16 lines at most.

Code execution switched off? Ask Claude for check.py and run it on your own computer. Run it with python3 check.py folder/ (Windows: py check.py folder). Real firm: take the script and run it on your own machine; send the tool only column names and 3 invented rows. To practise that, use templates/sample-rows_attendance.csv.

## Step 3: status, plan, briefing

Predict first, then check ANSWERS.md.
In the room 8 minutes. At your desk about 30, our estimate, not measured. Do it in two goes: the statuses and the new papers first, then the briefing, the notes and the files.

    Give every question COVERED, WEAK or GAP with the four tests and a quote. GAP: someone has no paper, or the record shows the rule broken. WEAK: the paper is there, only date or approval fails. For each WEAK and GAP name the new paper that closes it (never a change to an old one), its owner by role and day; today is 26 Nov 2026. Fill templates/evidence-index.csv. Write templates/clock.csv from the notice, the papers' date left open (the inspector sets it on the visit day). Write one page for the person present on 27 Nov: what happens, what they answer, what they do not sign. Draft new paper notes for E-11 and E-19 (leave) and the overtime notice from templates/new-paper-note.md. Leave every sign-off line empty. Answer with one line per question: line id, status, at most 8 words why. The rest goes in the files. At most 16 lines.

After the run, check two things yourself. Every sign-off line in the files Claude wrote (the new paper notes, the briefing and evidence-index.csv) must be empty, and templates/clock.csv must leave the papers' date open, because the inspector sets it on the visit day. Delete anything Claude filled in. A named person signs, not Claude.

## Step 4: build the register

Predict first, then check ANSWERS.md.
In the room 11 minutes. At your desk about 20, our estimate, not measured.

    Build the register. Read folder-index.md and the CSV files in the folder. Skip the lines that start with #. Make register.csv with the columns of templates/register.csv and one row per person and paper. Papers: contract, registration, medical-exam (valid 24 months), leave-decision (only for people with 6 months of service on 26 Nov 2026), overtime-notice (for every person with overtime weeks) and safety-statement (one row for the firm, person_id FIRM). Take the owner from folder-index.md. Where a paper is missing, write MISSING in the date column. Where no file names an approver, write NOT IN FILES. Use ids, no names, and no health content, dates only. Then write check.py. It reads register.csv and prints three lists for today: expired, expiring in the next 60 days, missing. Run it with today's date, 26 Nov 2026. Answer in 16 lines at most: the three counts, then the first five rows of register.csv.

Then ask the register:

    Look at register.csv. Which papers are on file for E-07, which one is missing, and who owns each? Answer from register.csv only, in 8 lines at most. If a row is not there, say NOT IN FILES.

Code execution switched off? Ask Claude for check.py and run it on your own computer.

Every month: see templates/monthly-check.md.

## Stay ready

After the audit the register stays. The folder keep-watch/ keeps it current:

- keep-watch/weekly-check_scheduled-task.md: the check as a weekly scheduled task, on paid plans only.
- keep-watch/monthly-check_by-hand.md: the same check once a month by hand, for the Free plan.
- keep-watch/register-project-instructions.md: the instructions for a second project that holds the register.
- keep-watch/safety-card.md: what goes in, what never, who signs.
- keep-watch/watch-list.md: where new rules and checks appear.

## After the visit (optional)

The two files in inspector/ stay closed until their day: the request on the day of the visit, the minutes after Step 3. Open inspector/minutes_sample_2026-11-27.md and use templates/comment-on-minutes.md. Write at most four sentences on each point that does not match what happened. This is a draft only: a named person signs, or writes the reason beside the sign-off line.

## Optional: install the skill

The skill is the folder claude/audit-nachweise/ in this kit, and also a zip to download at loehrning.ai/skills/audit-nachweise.zip. This kit holds no zip file. Install it once, where you use Claude:

<!-- claude-ui:en -->
