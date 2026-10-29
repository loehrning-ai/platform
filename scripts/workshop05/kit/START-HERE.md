# Audit preparation with Claude: the Vardar Works folder

Fictional training material. Every company, person and document is invented, except the two lines quoted from Anthropic's public privacy page.

In the workshop Tim operates Claude. You predict and check quotes. These setup steps are for repeating the case at home.

Exercise date: Monday 9 November 2026. Read every date in the folder as of that day.

Vardar Works DOOEL in Skopje (120 staff) runs customer service for Tannwald Haustechnik GmbH in Hamburg. That makes Vardar Tannwald's processor. On 9 November 2026 Tannwald sent a document request for a remote supplier audit on 10 December 2026. You hold the folder: 11 files, and every request item has a file whose name fits.

What you practise, in one sentence: "A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote." The result is a gap list you can defend.

| Test | Holds when |
|---|---|
| QUOTE | Words copied exactly from the file answer the request. A policy or a note says what should happen; only a record shows it happened. |
| PERIOD | A record is dated on or after 10 December 2025. A policy was approved or reviewed on or after that date. The file holds for the whole window. |
| SCOPE | It covers the systems and people the request names. |
| APPROVAL | A policy names who approved it, with a date, inside the file. A register, log or export names its owner. A vendor page names the vendor and the page date. DRAFT, "(open)" or "FINAL" in a file name is no approval. |

The same four tests as in Workshop 04, now for a whole folder. COVERED, WEAK or GAP. A file out of date or unapproved: WEAK. A part without evidence, or the record shows “not met”: GAP. The weakest part counts. No quote, no COVERED. A policy shows intent; only a record shows practice.

## What you need
- Claude (claude.ai or the desktop app), any plan, with code execution on: Settings > Capabilities > "Code execution and file creation" ("Create and edit files" in the updated layout). On Team or Enterprise your owner may need to allow it. Codex or Claude Code can also read the extracted folder; see below.
- About 60 minutes. ANSWERS.md is the key. Open it after each step, not before.
- Optional: the demo at loehrning.ai/demos/audit-vorbereitung-mit-ki walks through this folder in three minutes.

## Setup (5 minutes)
1. In Claude open Projects and create "Vardar audit".
2. Open "Set project instructions", paste all of project-instructions.md, then choose "Save instructions".
3. In Project knowledge choose "+" and upload request_tannwald.md and the 11 files in folder/. If a .md or .csv file will not upload, rename it to .txt.
4. No Projects? Start one chat, attach the 12 files and paste project-instructions.md above your first prompt.

Start every step in a new chat inside the Project. Earlier chat answers are not shared: download the index after Step 1 and attach it in Step 2; save the R1-to-R8 table after Step 2 and attach it in Step 3. Use "+", then "Add files or photos". Without a Project, stay in the same chat for all three steps.

## With Codex or Claude Code
Open the extracted vardar-audit-kit folder in Codex, or start Claude Code from that folder. Give it this instruction, then the same three prompts below, one at a time:

    Read project-instructions.md and follow its rules for this exercise. Use only request_tannwald.md and the eleven files in folder/ as evidence. Do not read ANSWERS.md. Do not change the source files. Work as of 9 November 2026. Compute the figures in code and show the calculation.

Keep the same conversation for all three steps. For Step 3 also read templates/gap-request.md and draft-reply.md. Open ANSWERS.md yourself after each step. No skill installation is needed for this case.

## Step 1: the evidence index (15 minutes)
On paper first: how many of the 11 files pass PERIOD and APPROVAL?

    Build the evidence index of the folder: one row per file, 11 rows.
    Columns: File | Type (POLICY, REGISTER, RECORD, STATEMENT) | Date and its kind (approved, reviewed, done, generated, exported, printed, edited) | Approved or owned by | Covers (systems, people, period) | PERIOD | APPROVAL.
    Copy dates and roles from the file text. If the text does not say it, write NOT IN FILE.

Check against ANSWERS.md, Step 1. Look at the two policy files: what did Claude write as approver?

## Step 2: the eight requests (20 minutes)
In the new Project chat attach your index from Step 1.
On paper first: give R1 to R8 a status.

    Map R1 to R8 from request_tannwald.md to our files.
    One row per request: Item | File | Quote (exact words, in quotation marks) | QUOTE | PERIOD | SCOPE | APPROVAL | Status | What is missing.
    Compute the training share and the incident hours in code.
    Then find every quote in its file again. Delete any status whose quote you cannot find word for word, and say so.

Then send:

    Does "Backups are restore-tested twice a year" make R7 COVERED?

Open the code box and check two numbers: staff trained, and hours until Tannwald was told. Then check ANSWERS.md, Step 2.

Optional: paste Claude's table into the Zitat-Probe (quote check) on the demo page. It checks every quote against the files, in your browser.

## Step 3: gap list and reply (20 minutes)
Attach your R1-to-R8 table from Step 2, templates/gap-request.md and draft-reply.md, then send:

    1. Gap list for every WEAK and GAP item: Item | What is missing | Document that closes it | Owner | Needed by 2 December 2026.
    2. For each gap, a request email to the owner from the attached template.
    3. Check each sentence of the draft reply: KEEP (quote the COVERED evidence), REWRITE (a sentence our files prove today) or DELETE (quote the file that says otherwise).
    4. A reply to Lena Keller, at most 150 words, with only sentences our files prove. For each item we cannot cover, say what follows and by when. Mention clause 7.

Edit one sentence of the reply by hand. You sign it, not Claude.

Check against ANSWERS.md, Step 3.

If the answer differs, open the named file and check its exact quote. Claude may find extra gaps or refuse a claim more cautiously. The key is a worked interpretation of this folder; do not ask Claude to imitate its wording or force its tally. Missing files: attach them again. Usage limit or service outage: continue with ANSWERS.md and the demo, labelled as the prepared example.

## Your own audit
- Install the skill audit-nachweise. It is in this kit at claude/audit-nachweise/SKILL.md; to upload it to claude.ai, download audit-nachweise.zip from loehrning.ai/skills/audit-nachweise.zip or from the demo page. The steps follow below.
- Or copy project-instructions.md into a new Project and change the customer, the dates and the thresholds.
- Every GAP is a task with an owner. A person checks every quote and signs every answer. Claude prepares; it certifies nothing.
- Upload company documents only into the company account your firm approved. Replace staff names in access and training lists with IDs first. Contracts under NDA and penetration test reports stay out unless the contract allows it.

## Install the skill

<!-- claude-ui:en -->

