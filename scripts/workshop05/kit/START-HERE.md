# Audit preparation with AI: the Termin Health kit

Fictional training data. Every company, person and document is invented.

Today is Friday 13 November 2026. Termin Health DOOEL is a small software company in Skopje, North Macedonia. Its portal lets private clinics book appointments and send lab results, so it holds health data. It uses a Claude workspace for support and runs its own open-weights AI model on a rented server. Its security lead left, and you took over the folder. On Thursday 3 December its biggest customer, Rheinland Praxisverbund AG in Germany, audits it.

You prepare the audit with Claude and 13 files. One rule: **don't claim anything the files can't prove.** At the end you hold one table: which audit topics your files prove, and which they don't.

- **Monday:** Rheinland's document request, eight items.
- **Tuesday:** seven security claims for the website.
- **Wednesday:** one erasure request, followed through every system.
- **Thursday:** one Audit Readiness Passport.
- **Friday:** a surprise.

## What you need

- Claude (claude.ai or the desktop app), any plan, Free too, with code execution on (Settings > Capabilities) so Claude can count in code.
- About 2 hours. You can stop after any step.
- `ANSWERS.md` is the answer key. Open it only after each step, and stop at each stop line.

## Warm-up A: the trap hunt (10 minutes, without Claude)

Open the 13 files in `project-files/` and requests 1 to 3 in `inbox/` in a text editor, not Excel. Keep file 4 closed. Seven traps are hidden: a fact the auditor would find wrong, such as an old date, a missing signature or two files that disagree. One file looks suspicious but is clean. Check every date.

Set a timer. Write each trap (file and one line) and the file you think is clean. Then score yourself in `ANSWERS.md`: 2 points per trap, plus 1 for the clean file, minus 1 if you called it a trap.

## Warm-up B: Data, Place, Paper (optional, 3 minutes, on paper)

Before you upload a file to an AI tool, ask: **Data:** what is in it? **Place:** where does the tool run, and what do its logs keep? **Paper:** which contract and company rule allow it?

Sort these into **GO** (upload as it is), **CLEAN FIRST** (remove personal data) or **STAY OUT** (no AI tool): `audit_topics_reference.md`; `data_inventory.csv`; `training_records_2026.csv` as a real HR system exports it; `support_tickets_sample.csv`; a real patient's lab-result PDF; a cloud console screenshot with bucket names and the project ID.

## Words you will meet

- **DPA:** data processing agreement, the contract that lets a supplier handle personal data.
- **SCCs:** standard contractual clauses, a legal way to send personal data outside the EU.
- **DPIA:** data protection impact assessment, a written risk check.
- **MFA:** multi-factor login: a password plus a second proof.
- **Triage model:** our own AI model on the rented server. It sorts support tickets and keeps logs.

## The statuses

The same words as rule 3 in `project-instructions.md`. A file is current if dated on or after 3 December 2025.

- **COVERED:** a current file answers the request in full, even when the answer is bad news; then add an action.
- **WEAK:** a file answers, but it is old, has an empty or "not recorded" cell, or disagrees with another file; say which.
- **GAP:** no file answers it, or the file only says "pending", "none" or "not done"; name the document that would close it.
- **Several parts:** the part that is missing or old sets the status; name it. Example: Nordgrid's DPA is pending, so D2 is GAP though four suppliers are fine.
- **Claims:** RED (a file says the opposite), AMBER (missing, pending or not fully proven), GREEN (a file proves every word, for all systems with health data); "all" or "every" fails on one exception.
- A named owner or approver counts as signed; "accepted online" counts as signed.

## Setup (once, 15 minutes)

1. In Claude open **Projects** and create `Termin Health audit`.
2. Paste all of `project-instructions.md` into the Project's **Instructions**. **Keep these dates even if you run this later.**
3. Upload the 13 files from `project-files/` under **Files**, not the inbox files. A .md file won't upload? Rename it to .txt.
4. No Projects? Use a normal chat, attach the files and paste `project-instructions.md` above every prompt.

**Steps 1 to 4 each start a new chat from the Project page.** A chat from the home page can't see the files, and every answer comes back GAP. For real company files, first turn off "Help improve Claude" in Settings > Privacy. Never upload real patient data.

## Step 1 (Monday, 15 minutes): the document request

**Predict first** (a guess on paper makes the answer stick): which items are bad news for the company? New chat in the Project. Attach `inbox/1-rheinland-document-request.md`, then send:

```
Answer the audit document request in the attached file.
Return one table with exactly one row per item, D1 to D8: # | Request | Answer | Source | Status (COVERED, WEAK or GAP).
Count in code before you give any share or total. Give the security share and the AI share separately.
After the table, at most 3 short lines: the counts and one caution.
```

Open the code box: how many staff did Claude count? **Check:** `ANSWERS.md`, Step 1.

## Step 2 (Tuesday, 15 minutes): the Trust page claims

**Predict first:** mark each of the seven claims RED, AMBER or GREEN. New chat in the Project. Attach `inbox/2-trust-page-claims.md`, then send:

```
Check the seven claims in the attached file against our files and audit_topics_reference.md.
Return a table, red claims first, then by claim number: Claim | RED, AMBER or GREEN | Reason | Source | Safe rewrite (a sentence the files prove today, no future wording, or NONE). One sentence per cell.
```

**Check:** `ANSWERS.md`, Step 2.

## Step 3 (Wednesday, 15 minutes): trace one record

An erasure request means every copy must go: database, backups, AI tools and logs. **Predict first:** list every place where patient P-48213's data could still be, and the surest one. New chat in the Project. Attach `inbox/3-erasure-request.md`, then send:

```
Trace patient P-48213 through our files for the attached erasure request.
Start with Yes or No, then one sentence why: was the confirmation of 21 September true?
Then one table, at most 10 rows, only places that hold or could hold P-48213's data (from the inventory, supplier list and retention policy): Place | What data | Country or region as written | Proof of deletion | Source | Status (COVERED, WEAK or GAP). Mark the surest place.
Status answers: do our files prove this place was cleaned? A policy names the place but no deletion record: WEAK. No policy and no record: GAP, "not recorded". Write "could hold" unless a file row shows it holds data.
Calculate in code: the days from the request to the confirmation, and the date the last backup copy expires (deletion date + 35 days; assume production was deleted on 21 September).
```

**Check:** `ANSWERS.md`, Step 3.

## Step 4 (Thursday, 20 minutes): the Audit Readiness Passport

One table answers all three requests and names every gap. **Predict first:** how many of the 12 audit topics come back COVERED? New chat in the Project. Attach inbox files 1, 2 and 3 again. Send:

```
The three attached files are this week's requests.
Build our Audit Readiness Passport as one table in the chat, one row per audit topic A1 to A12 from audit_topics_reference.md: # | Topic | What we have | Source | Status | Weak or missing part, and the document that would close it | Answers (IDs: D1 to D8, C1 to C7, E).
After the table, count the statuses in code.
```

**Check:** `ANSWERS.md`, Step 4.

**Bonus (optional):** Same chat:

```
Turn this table into a one-page dashboard and a Word file audit-passport.docx for the auditor, with no patient names.
```

## Step 5 (Friday, 15 minutes): the Nordgrid invoice

Finance found a phone photo of an invoice from the company that rents the AI server. **Predict first:** how many answers change status? (a number) Best in the Step 4 chat, so Claude has your table. Attach `inbox/4-nordgrid-invoice.png`, then send:

```
I attached an invoice from Nordgrid Cloud AB. Read it first. Cite the file name and the field label for each value; for the data centre use the data-centre field, not the company address.
Then recheck every answer from this week that depends on where the triage model runs.
Also say how many days the triage server has existed (from the creation date on the invoice to today, 13 November 2026), and what that means for the AI policy sentence that the model runs in our EU environment.
Return a table with these rows only: D1 to D3, claims 1 and 3, the triage log in the erasure trace, A1, A4, A12: Where | Before (value and status) | Now (value and status) | Why.
```

New chat instead? Attach the invoice and inbox files 1, 2 and 3, and paste your Step 4 table under the prompt. **Check:** `ANSWERS.md`, Step 5.

## Your Monday

- **A person checks and signs every answer** before it leaves the company. Claude can be wrong, so Claude prepares and you decide. Neither Claude nor this kit certifies anything.
- Collect a folder like this one: profile, data inventory, supplier list, policies, AI tools, training records, security test, access review, incident log, restore test. Replace names with IDs.
- Use a new Project. Copy `project-instructions.md`, change the dates, company and country.
- Every GAP is a to-do: it names the document to collect next.

For each new request, start a new chat in your Project, attach the request and send:

```
Answer the audit request from [customer or auditor name] in the attached file.
Return one table with exactly one row per item: # | Request | Answer | Source | Status (COVERED, WEAK or GAP).
Count in code before you give any share or total.
Then list every GAP and WEAK with the document that would close it.
```
