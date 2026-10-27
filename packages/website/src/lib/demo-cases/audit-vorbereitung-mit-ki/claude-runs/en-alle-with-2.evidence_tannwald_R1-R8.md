# Tannwald supplier audit: evidence for R1 to R8
Prepared 9 November 2026 for internal review. Not for sending as is. A person decides and signs.

**Basis (from request_tannwald.md):** audit date Thursday 10 December 2026; documents due Wednesday 25 November 2026; window: "current if it is dated on or after 10 December 2025" (policies: last approval or review); training threshold "at least 95% of your staff"; incidents "within 48 hours of detection". Every date, count and share below was computed in code.

## Step 1: evidence index

| File | Type | Date (kind) | Approved / owned by | Scope | Other versions |
|---|---|---|---|---|---|
| system-list_2026-09.csv | REGISTER | 2026-09-02 (approved) | Owner IT lead; approved Managing Director | Servicepult, Sprechband, Nordlager file share, Claude Team | none |
| subprocessors_2026-09.csv | REGISTER | 2026-09-05 (last updated) | Owner IT lead | Servicepult GmbH, Sprechband GmbH, Nordlager GmbH, Anthropic | none |
| access-review_2026-08-14.csv | RECORD | 2026-08-14 (done), 2026-08-17 (approved) | Done by IT lead; approved Managing Director | Servicepult admin accounts only (5) | none |
| incident-log_2026.csv | RECORD | last entry 2026-10-12 | Owner IT lead | 2026, 3 incidents | none |
| training-records_2026.csv | RECORD | 2026-11-02 (HR export) | Exported by HR lead | 26 rows, 1 course; staff 120 on 2026-11-01 | none |
| backup-report_2026-10.txt | RECORD | 2026-11-01 (generated) | Owner IT lead | Servicepult export, file share; Oct 2026 | none |
| ai-use-rule_v1.md | POLICY | 2026-10-01 (approved; valid from) | Approved Managing Director; owner IT lead | All staff | none |
| infosec-policy_v3_FINAL.md | POLICY | 2024-03-12 (approved); review due March 2025 | Approved Managing Director | Systems with customer data | v4 DRAFT |
| infosec-policy_v4_DRAFT.md | POLICY (draft) | 2026-09-18 (last edited) | Edited by IT lead; "Approved by: (open)" | Rules 1 to 5 of v3 + AI rule | v3 FINAL |
| vendor-page_claude_2026-06-15.md | STATEMENT | 2026-06-15 (page date); printed 2026-10-06 | Publisher Anthropic (Privacy Center); printed by IT lead | Claude storage location | none |
| it-notes_2026-10-06.md | STATEMENT | 2026-10-06 (written) | IT lead; "Not reviewed by anyone" | Personal notes | none |

## Steps 2 and 3: tests and status

| Req | File | Quote | QUOTE | PERIOD | SCOPE | APPROVAL | Status | What closes the gap | Owner |
|---|---|---|---|---|---|---|---|---|---|
| R1 | system-list_2026-09.csv | "Servicepult,ticket system for service requests,…,Germany (Frankfurt)"; "Sprechband,call recording,…,Germany (Frankfurt)"; "Nordlager file share,…,Germany (Frankfurt)"; "Claude Team …,United States (see vendor-page_claude_2026-06-15.md)" | yes | yes (2026-09-02) | **no**: it-notes says "Until September some agents on the Tannwald desk used a free chatbot on their phones to word replies." Not on the list; tool and storage country unknown | yes (MD 2026-09-02) | **GAP** | System list updated with the free chatbot(s) used until Sept 2026 (tool, data, country), or a written finding that no Tannwald data went into them | IT lead, MD approves |
| R1 (Claude country) | vendor-page_claude_2026-06-15.md | "Note that data is stored in the US." | yes | yes (page 2026-06-15) | Claude only | publisher + page date yes | supports R1 | Re-read the live page before sending (file says "Vendor pages change") | IT lead |
| R2 | subprocessors_2026-09.csv | "Servicepult GmbH,ticket system,Germany,2024-02-01,2026-01-20,not needed (EU)"; "Sprechband GmbH,…,2025-05-12,2026-05-12,not needed (EU)"; "Nordlager GmbH,…,2023-11-15,2026-02-03,not needed (EU)" | yes | yes (reviews 2026-01-20, 2026-05-12, 2026-02-03) | EU vendors yes | owner IT lead | covered for 3 of 4 | — | — |
| R2 (Anthropic) | subprocessors_2026-09.csv | "Anthropic,Claude Team,United States,accepted online 2026-09-01,," | contract date only | — | **no last review, no transfer basis** for the one transfer outside the EU/EEA | owner IT lead | **GAP** | Last review date and the documented legal basis for the US transfer (e.g. the vendor's data processing terms); add the free chatbot vendor if it processed Tannwald data | IT lead (DPO/legal for basis) |
| R3 | ai-use-rule_v1.md; system-list; vendor page | "The only AI tool for customer data is our Claude Team workspace (25 seats, in use since 2026-09-01). Its data is stored in the US"; "Valid from 2026-10-01." | yes for Claude | **no** for 2026-09-01 to 2026-09-30 (30 days of Claude use before the rule was valid) | **no**: free chatbot "Until September" has no tool name, data, country or rule | yes (MD 2026-10-01) | **GAP** | List of every AI tool used with Tannwald data since 10 Dec 2025, incl. the free chatbot; record of what rule applied before 1 Oct | IT lead, team lead Tannwald desk |
| R4 | access-review_2026-08-14.csv | "Review of administrator accounts in Servicepult (ticket system)"; "adm-03,left 2026-07-31,team lead,yes,removed 2026-08-14"; "adm-04,employee,reporting,no,MFA switched on 2026-08-14" | yes | yes (2026-08-14) | **no**: Sprechband, Nordlager file share, Claude Team not reviewed | yes (MD 2026-08-17) | **GAP** | Admin review records for Sprechband, Nordlager file share and Claude Team (leavers, MFA) | IT lead; team lead Tannwald desk (Sprechband) |
| R5 | training-records_2026.csv | "Claude Team intro: data rules"; "Staff on 2026-11-01: 120." | AI use only; **no data protection course in the file** | yes (Sept 2026) | 25 unique staff IDs of 120 = 20.8% (needs 114) | exported by HR lead | **GAP** (threshold not met; data protection part missing) | Data protection training records for the last 12 months; AI training for at least 114 of 120 staff | HR lead |
| R6 | incident-log_2026.csv | "INC-02,2026-05-07 09:40,Tannwald,…,2026-05-08 16:10,mail auto-complete chose the wrong address,\"auto-complete off for external mail; …\"" | yes (detected, told, cause, fix) | yes (2026) | Tannwald told after 30.5 h (within 48 h) | owner IT lead | **COVERED**, see flag | Flag: a person must decide whether the free-chatbot use (it-notes) is an incident. If yes, it is not in the log and Tannwald was not told, and R6 becomes GAP | MD (with DPO) |
| R7 | backup-report_2026-10.txt | "Restore test: not done in 2026. Planned for Q4 2026 (owner: IT lead)." | answers, shows no test | report in window | — | owner IT lead | **GAP** (evidence shows no restore test) | A restore test record with result, done before 25 Nov | IT lead |
| R8 | infosec-policy_v3_FINAL.md | "Approved 2024-03-12 by Dragan Ilievski, Managing Director. Next review: March 2025." | yes | **no** (before 2025-12-10, review overdue) | yes | yes | **WEAK** (PERIOD) | MD approves v4 (or records a review of v3) before 25 Nov | MD |
| R8 | infosec-policy_v4_DRAFT.md | "Approved by: (open)" | yes | edited 2026-09-18 | yes | **no** | WEAK (APPROVAL) | as above | MD |

### Count (computed)
- Requests: 8. COVERED 1 (R6), WEAK 1 (R8), GAP 6 (R1, R2, R3, R4, R5, R7).
- Training: 26 rows, 1 repeated staff ID (E014, trained 2026-09-03 and 2026-09-10), 25 unique staff, 25/120 = 20.8%; 95% needs 114. Only course: "Claude Team intro: data rules".
- INC-02: detected 2026-05-07 09:40, told 2026-05-08 16:10 = 30 h 30 min.
- Access review: leaver adm-03 removed 14 days after leaving; 5 accounts, all MFA on after the review.

## Escalate before anything goes out (decision for the Managing Director)
Clause 7 of the service contract (quoted in the request): "AI tools are used with Customer Data only after written notice to the Customer. Customer Data is stored in the EU or EEA unless the Customer agrees in writing."
- Claude Team stores data in the US (system list, vendor page). it-notes: "Did we ever tell Tannwald in writing that we use Claude (clause 7)? I found nothing." No written notice or written agreement is in the folder.
- it-notes: "A vendor rep told Dragan \"data stays in Europe\". Nothing in writing." The vendor page says "Note that data is stored in the US." Do not repeat the "Europe" claim.
- Free chatbot on phones with Tannwald data until September: no record of tool, data or storage country.
These go beyond missing paperwork. How and when to tell Tannwald is a management and legal decision, not an evidence-pack edit.

## Step 4: requests to owners (reply by Friday 20 November 2026, so the pack can go out on 25 November)

**IT lead (R1, R2, R3, R4, R7)**
Tannwald asks for: R1 "Every system that stores or processes our data, with the country where it is stored"; R2 "contract date, last review, and the legal basis for any transfer outside the EU/EEA"; R3 "The AI tools your staff used with our data in the last 12 months: tool, data, storage country, and your approved rule"; R4 "Your last review of administrator accounts on every system in R1"; R7 "A restore test of your backups from the last 12 months, with its result".
What we have: system list (no free chatbot), sub-processor list (Anthropic: review and transfer basis blank), AI rule valid only from 1 Oct, admin review for Servicepult only, backup report saying the restore test was not done.
What closes it: names of the free chatbot(s) and what data went in; Anthropic review date and transfer basis; admin reviews for Sprechband, Nordlager, Claude Team; a restore test record with result. "Does not exist" is a good answer; we would rather say so than guess.

**HR lead (R5)**
Tannwald asks for "Training records for data protection and AI use, last 12 months, with the share of staff trained" and at least 95%. The export shows 25 of 120 staff, AI course only. Please send any data protection training records since 10 Dec 2025, or confirm there are none.

**Managing Director (R8, clause 7, R6 flag)**
R8 asks for a policy "approved or reviewed in the last 12 months". v3 was approved 2024-03-12 with review due March 2025; v4 is "Approved by: (open)". Approve v4 or record a review. Also decide on the clause 7 points and on whether the free-chatbot use is an incident.

Not in files: data protection training content, written notice to Tannwald, any restore test, admin reviews outside Servicepult, a DPA with Anthropic.
