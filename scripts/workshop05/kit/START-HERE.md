Fictional training material, invented for the exercise. Not legal advice.

## The rules in one minute

A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote.
COVERED, WEAK or GAP. A file out of date or unapproved: WEAK. A part without evidence, or the record shows “not met”: GAP. The weakest part counts.
No quote, no COVERED. A policy shows intent; only a record shows practice.

## What you do

You learn to use Claude on an invented audit case. You are the office of Gradba-Pro, an invented building materials shop in Bitola with 24 people. On 23 Nov 2026 a notice came from the labour inspectorate: an inspector visits on 27 Nov at 09:00, with three checklists of questions (notice_DIT_2026-11-23.md). In four steps Claude helps you build a table, run a check, write a plan and build a register. A person decides and signs.

What you practise works for any task with Claude. One project holds the instructions and the files, so you set them up once. Claude answers with a quote from the files, or with NOT IN FILES. Code does the counting, not the model. You compare every answer with ANSWERS.md.

## Set up once

1. Download gradba-audit-kit.zip from the kit page, loehrning.ai/en/workshops/audit-vorbereitung-mit-ki/kit, and unzip it.
2. Open Claude (claude.ai or the desktop app). Choose “Projects”, then “New project”. Call it Gradba audit.
3. Open project-instructions.md, copy all of it and paste it into the project's instructions. Save.
4. Add files to the project: all files inside checklists/ (3) and folder/ (14), plus cases/case-A-labour.md and templates/register.csv. That is 19 files. The project shows them in one flat list; that is fine.
5. In “Settings”, “Capabilities”, switch on “Code execution and file creation”. Step 2 runs a script. Without it, ask Claude for check.py and run it on your own computer.
6. Start a chat inside the project. For each step, paste that step's prompt from this file and send it; then compare the answer with ANSWERS.md.
7. Before Step 3, add four more files to the project: notice_DIT_2026-11-23.md, templates/evidence-index.csv, templates/clock.csv and templates/new-paper-note.md.
8. Step 4 runs in the same chat. Then ask the register the E-07 question (the second prompt of Step 4).

Tested in claude.ai on 13 Nov 2026 with two full runs: all four steps matched ANSWERS.md.

Why these files: the case file holds the time limits that Step 3 uses, and the register template holds the columns of Step 4. Leave everything in extras/ out of this project.

These files are invented, so they may go into Claude. With your own firm's real files, personal data stays on your own computer: Claude writes the script, you run it, and Claude sees only column names and 3 invented rows. A named person signs, not Claude.

On the Free plan all project files must fit into Claude's context window. If they do not, add the files of one step at a time.

## Step 1: make the table

Start a chat inside the project, paste this prompt and send it. Then compare the answer with ANSWERS.md.
In the room 6 minutes. At your desk about 20, our estimate, not measured.

    Read the three checklist excerpts. Make a table with one row per checklist question: line id, article, the paper that answers it, its owner, where it lives (use folder-index.md). Do not open the folder files yet. If a paper is not in the files, write NOT IN FILES. Use ids, no names. Answer with the table only.

## Step 2: run the check

In the same chat, paste this prompt and send it. Then compare the answer with ANSWERS.md.
In the room 9 minutes. At your desk about 20, our estimate, not measured.

    Write and run a check on the folder's CSV, txt and md files, skipping CSV lines that start with #. Print how many rows you read in each file. For every finding print id, rule and number: filing later than the day before the first shift; overtime weeks above 8 hours; overtime weeks without a notice; pay lines without an overtime line; attendance rows without start and end; pay later than 15 days after the period (a free day moves it); leave decisions missing or under 20 days (owed after 6 months); empty record fields; exams older than 24 months on 27 Nov 2026; job titles missing from the safety statement; training given later than the hire date. Then list each near miss you ruled out and why. End with one totals line: rows read, findings, near misses checked. Change no file. Answer in 16 lines at most.

Code execution switched off? Ask Claude for check.py and run it on your own computer. Run it with python3 check.py folder/ (Windows: py check.py folder). Real firm: take the script and run it on your own machine; send Claude only column names and 3 invented rows. To practise that, use extras/templates/sample-rows_attendance.csv.

## Step 3: status, plan, briefing

First add four files to the project: notice_DIT_2026-11-23.md, templates/evidence-index.csv, templates/clock.csv and templates/new-paper-note.md. The prompt reads them. In the same chat, paste this prompt and send it. Then compare the answer with ANSWERS.md.
In the room 8 minutes. At your desk about 30, our estimate, not measured.

    Give every question COVERED, WEAK or GAP with the four tests and a quote. GAP: someone has no paper, or the record shows the rule broken. WEAK: the paper is there, only date or approval fails. For each WEAK and GAP name the new paper that closes it (never a change to an old one), its owner by role and day; today is 26 Nov 2026. Fill templates/evidence-index.csv. Write templates/clock.csv from the notice, the papers' date left open (the inspector sets it on the visit day). Write one page for the person present on 27 Nov: what happens, what they answer, what they do not sign. Draft new paper notes for E-11 and E-19 (leave) and the overtime notice from templates/new-paper-note.md. Leave every sign-off line empty. Answer with one line per question: line id, status, at most 8 words why. The rest goes in the files. At most 16 lines.

After the run, check two things yourself. Every sign-off line in the files Claude wrote (the new paper notes, the briefing and evidence-index.csv) must be empty, and templates/clock.csv must leave the papers' date open, because the inspector sets it on the visit day. Delete anything Claude filled in. A named person signs, not Claude.

## Step 4: build the register

In the same chat, paste this prompt and send it. Then compare the answer with ANSWERS.md.
In the room 11 minutes. At your desk about 20, our estimate, not measured.

    Build the register. Read folder-index.md and the CSV files in the folder. Skip the lines that start with #. Make register.csv with the columns of templates/register.csv and one row per person and paper. Papers: contract, registration, medical-exam (valid 24 months), leave-decision (only for people with 6 months of service on 26 Nov 2026), overtime-notice (for every person with overtime weeks) and safety-statement (one row for the firm, person_id FIRM). Take the owner from folder-index.md. Where a paper is missing, write MISSING in the date column. Where no file names an approver, write NOT IN FILES. Use ids, no names, and no health content, dates only. Then write check.py. It reads register.csv and prints three lists for today: expired, expiring in the next 60 days, missing. Run it with today's date, 26 Nov 2026. Answer in 16 lines at most: the three counts, then the first five rows of register.csv.

Then ask the register:

    Look at register.csv. Which papers are on file for E-07, which one is missing, and who owns each? Answer from register.csv only, in 8 lines at most. If a row is not there, say NOT IN FILES.

Code execution switched off? Ask Claude for check.py and run it on your own computer.

## extras/ (optional, for after the session)

The four steps do not need this folder. Open it after the session.

- extras/keep-watch/: keeps the register current after the audit, with a weekly scheduled task (paid plans), the same check by hand once a month (Free plan), instructions for a register project, a one-page safety card and a watch list of official sources.
- extras/inspector/: a sample document request and sample minutes of the visit.
- extras/cases/: case B (tax office) and case C (certifier), for other kinds of audit.
- extras/templates/: a reply to the minutes, the monthly check, 3 invented sample rows to practise with, and a transfer sheet for your own audit.
- extras/claude/audit-nachweise/: the skill. The four steps work without it. How to install it is below.

## Optional: install the skill

The skill is the folder extras/claude/audit-nachweise/ in this kit, and also a zip to download at loehrning.ai/skills/audit-nachweise.zip. This kit holds no zip file. Install it once, where you use Claude:

<!-- claude-ui:en -->
