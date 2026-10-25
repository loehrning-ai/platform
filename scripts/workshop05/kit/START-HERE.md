# Audit preparation with Claude: the Vardar Works folder

Fictional training material. Every company, person and document is invented, except the two lines quoted from Anthropic's public privacy page.

Exercise date: Monday 9 November 2026. Read every date in the folder as of that day.

Vardar Works DOOEL in Skopje (120 staff) runs customer service for Tannwald Haustechnik GmbH in Hamburg. That makes Vardar Tannwald's processor. On 9 November 2026 Tannwald sent a document request for a remote supplier audit on 10 December 2026. You hold the folder: 11 files, and every request item has a file whose name fits.

What you practise: turning a folder into evidence. A file is evidence only when four tests hold. You give Claude the tests as rules and get a gap list you can defend.

| Test | Holds when |
|---|---|
| DATE | A record is dated on or after 10 December 2025. A policy was approved or reviewed on or after that date. |
| APPROVAL | A policy names who approved it, with a date, inside the file. A register, log or export names its owner. A vendor page names the vendor and the page date. DRAFT, "(open)" or "FINAL" in a file name is no approval. |
| SCOPE | It covers the systems, people and period the request names. |
| QUOTE | Words copied exactly from the file answer the request. A policy or a note says what should happen; only a record shows it happened. |

COVERED: all four hold for every part. WEAK: a quote answers, but a test fails or a part is missing. GAP: nothing answers, or the record shows the requirement is not met.

## What you need
- Claude (claude.ai or the desktop app), any plan, with code execution on: Settings > Capabilities > "Code execution and file creation". On Team or Enterprise your owner may need to allow it.
- About 60 minutes. ANSWERS.md is the key. Open it after each mission, not before.
- Optional: the demo at loehrning.ai/demos/audit-vorbereitung-mit-ki walks through this folder in three minutes.

## Setup (5 minutes)
1. In Claude open Projects and create "Vardar audit".
2. Paste all of project-instructions.md into the Project instructions.
3. Upload request_tannwald.md and the 11 files in folder/. If a .md or .csv file will not upload, rename it to .txt.
4. No Projects? Start one chat, attach the 12 files and paste project-instructions.md above your first prompt.

Start every mission in a new chat inside the Project.

## Mission 1: the evidence index (15 minutes)
On paper first: how many of the 11 files pass DATE and APPROVAL?

    Build the evidence index of the folder: one row per file, 11 rows.
    Columns: File | Type (POLICY, REGISTER, RECORD, STATEMENT) | Date and its kind (approved, reviewed, done, generated, exported, printed, edited) | Approved or owned by | Covers (systems, people, period) | DATE | APPROVAL.
    Copy dates and names from the file text. If the text does not say it, write NOT IN FILE.

Check against ANSWERS.md, Mission 1. Look at the two policy files: what did Claude write as approver?

## Mission 2: the eight requests (20 minutes)
On paper first: give R1 to R8 a status.

    Map R1 to R8 from request_tannwald.md to our files.
    One row per request: Item | File | Quote (exact words, in quotation marks) | DATE | APPROVAL | SCOPE | QUOTE | Status | What is missing.
    Compute the training share and the incident hours in code.
    Then find every quote in its file again. Delete any status whose quote you cannot find word for word, and say so.

Then send:

    Does "Backups are restore-tested twice a year" make R7 COVERED?

Open the code box and check two numbers: staff trained, and hours until Tannwald was told. Then check ANSWERS.md, Mission 2.

Optional: paste Claude's table into the Zitat-Probe (quote check) on the demo page. It checks every quote against the files, in your browser.

## Mission 3: gap list and reply (20 minutes)
Attach templates/gap-request.md and draft-reply.md, then send:

    1. Gap list for every WEAK and GAP item: Item | What is missing | Document that closes it | Owner | Needed by 2 December 2026.
    2. For each gap, a request email to the owner from the attached template.
    3. Check each sentence of the draft reply: KEEP (quote the COVERED evidence), REWRITE (a sentence our files prove today) or DELETE (quote the file that says otherwise).
    4. A reply to Lena Keller, at most 150 words, with only sentences our files prove. For each item we cannot cover, say what follows and by when. Mention clause 7.

Edit one sentence of the reply by hand. You sign it, not Claude.

Check against ANSWERS.md, Mission 3.

## Your own audit
- Install the skill audit-nachweise: download audit-nachweise.zip from loehrning.ai/skills/audit-nachweise.zip or from the demo page. The steps follow below.
- Or copy project-instructions.md into a new Project and change the customer, the dates and the thresholds.
- Every GAP is a task with an owner. A person checks every quote and signs every answer. Claude prepares; it certifies nothing.
- Upload company documents only into the company account your firm approved. Replace staff names in access and training lists with IDs first. Contracts under NDA and penetration test reports stay out unless the contract allows it.

## Install the skill

<!-- claude-ui:en -->

## Skill installieren (Deutsch)

<!-- claude-ui:de -->
