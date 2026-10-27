# Tannwald supplier audit: evidence check R1 to R8
Prepared 9 November 2026 from the 11 files in the folder. Working paper for internal use. A person decides what goes to Tannwald and signs it.

- Audit date: Thursday 10 December 2026. Documents due: Wednesday 25 November 2026 (16 days from today).
- Evidence window: on or after 10 December 2025 (taken from the request: "A document is current if it is dated on or after 10 December 2025"). "Last 12 months" in R3, R5 and R7 is read as the same window.
- Thresholds, word for word: "Training must reach at least 95% of your staff." / "Incidents with our data must reach us within 48 hours of detection (section 6.2)."
- Contract clause 7, word for word: "AI tools are used with Customer Data only after written notice to the Customer. Customer Data is stored in the EU or EEA unless the Customer agrees in writing."

## Step 1: Evidence index

| File | Type | Date (kind) | Approved / owned by | Scope | Other versions |
|---|---|---|---|---|---|
| system-list_2026-09.csv | REGISTER | 2026-09-02 (approval) | Owner IT lead; approved by Managing Director | 4 systems: Servicepult, Sprechband, Nordlager file share, Claude Team | none |
| subprocessors_2026-09.csv | REGISTER | 2026-09-05 (last updated) | Owner IT lead | 4 vendors for Tannwald data | none |
| ai-use-rule_v1.md | POLICY | 2026-10-01 (approval; valid from same day) | Approved by Managing Director; owner IT lead | All staff of Vardar Works | none |
| vendor-page_claude_2026-06-15.md | STATEMENT (vendor page) | 15 June 2026 (page date); printed 2026-10-06 | Publisher: Anthropic Privacy Center | Claude storage location | none |
| access-review_2026-08-14.csv | RECORD | 2026-08-14 (done); 2026-08-17 (approval) | Done by IT lead; approved by Managing Director | Servicepult only, 5 admin accounts | none |
| training-records_2026.csv | RECORD (HR export) | 2026-11-02 (export) | HR lead | 26 rows, 1 course; staff on 2026-11-01: 120 | none |
| incident-log_2026.csv | REGISTER (log) | last entry 2026-10-12 | Owner IT lead | 3 incidents in 2026 | none |
| backup-report_2026-10.txt | RECORD | 2026-11-01 (generated) | Owner IT lead | Servicepult export, file share; October 2026 | none |
| infosec-policy_v3_FINAL.md | POLICY | 2024-03-12 (approval) | Approved by Managing Director | 5 rules | v4 DRAFT |
| infosec-policy_v4_DRAFT.md | POLICY (draft) | 2026-09-18 (last edit, not approval) | Approved by: (open) | rules 1-5 + rule 6 on AI | v3 FINAL |
| it-notes_2026-10-06.md | STATEMENT (personal notes) | 2026-10-06 (written) | IT lead; "Not reviewed by anyone." | admin checks, backups, AI use, clause 7 | none |

"FINAL" in the v3 file name proves nothing; its approval date is 2024-03-12, before the window.

## Step 2 and 3: Tests and status

| Req | File | Quote (verbatim) | QUOTE | PERIOD | SCOPE | APPROVAL | Status | What closes the gap | Owner |
|---|---|---|---|---|---|---|---|---|---|
| R1 | system-list_2026-09.csv | "Systems that hold Tannwald data." / "Claude Team (browser and desktop app; 25 seats since 2026-09-01),drafting replies to service requests,request text pasted by agents,United States (see vendor-page_claude_2026-06-15.md),IT lead" | yes: 4 systems with storage country (3 × "Germany (Frankfurt)", Claude Team "United States") | yes: approved 2026-09-02 | yes for the 4 current systems; matches the 4 vendors in subprocessors | yes: owner IT lead, approved by Managing Director 2026-09-02 | **COVERED** | (see flags A and B) | IT lead |
| R1 support | vendor-page_claude_2026-06-15.md | "Note that data is stored in the US." | yes | page date 15 June 2026 | Claude only | publisher + page date | supports R1 | Re-read the live page before sending | IT lead |
| R2 | subprocessors_2026-09.csv | "Servicepult GmbH,ticket system,Germany,2024-02-01,2026-01-20,not needed (EU)" / "Anthropic,Claude Team,United States,accepted online 2026-09-01,," | yes for 3 EU vendors; Anthropic: last_review and transfer_basis blank | yes: updated 2026-09-05; reviews 2026-01-20, 2026-05-12, 2026-02-03 all in window | Anthropic row missing 2 of the 3 asked fields | owner IT lead | **GAP** | Anthropic: the signed terms with their date, a review record, and the legal basis for the US transfer | IT lead + Managing Director |
| R3 | ai-use-rule_v1.md | "The only AI tool for customer data is our Claude Team workspace (25 seats, in use since 2026-09-01). Its data is stored in the US" | yes for Claude Team: tool, storage country, rule | rule "Valid from 2026-10-01"; Claude in use since 2026-09-01, so 30 days without a rule | free chatbot use (it-notes) has no record: tool, data, country unknown | approved by Managing Director 2026-10-01 | **GAP** | (1) Record of the free chatbot use until September: which tool, which Tannwald data, how many agents, when it ended. (2) Rule or instruction that covered Claude use 1-30 Sept 2026, or say none existed. (3) The written notice to Tannwald under clause 7, or say none was sent | IT lead + Managing Director |
| R3 support | it-notes_2026-10-06.md | "Until September some agents on the Tannwald desk used a free chatbot on their phones to word replies. Stopped with the AI rule on 1 October." / "Did we ever tell Tannwald in writing that we use Claude (clause 7)? I found nothing." | statement, not a record | 2026-10-06 | — | "Not reviewed by anyone." | not evidence; shows a part with no record | — | — |
| R4 | access-review_2026-08-14.csv | "Review of administrator accounts in Servicepult (ticket system). Done 2026-08-14" / "adm-03,left 2026-07-31,team lead,yes,removed 2026-08-14" / "adm-04,employee,reporting,no,MFA switched on 2026-08-14" | yes for Servicepult: leaver removed (14 days after leaving), MFA switched on | yes: 2026-08-14 | Servicepult only. Missing: Sprechband, Nordlager file share, Claude Team (3 of 4 R1 systems) | done by IT lead, approved by Managing Director 2026-08-17 | **GAP** | Admin-account reviews for Sprechband, Nordlager file share and Claude Team, each with leavers and MFA, dated and approved | IT lead (Sprechband: team lead Tannwald desk is admin owner) |
| R4 note | it-notes_2026-10-06.md | "Admin access is checked every quarter." | statement only | — | — | "Not reviewed by anyone." | not evidence | — | — |
| R5 | training-records_2026.csv | "Staff on 2026-11-01: 120." / "E002,Claude Team intro: data rules,2026-09-03,30,completed" | AI-use part: yes. Data protection part: no data protection course in the export | yes: 2026-09-03 and 2026-09-10 | 25 of 120 staff = 20.8%; threshold 95% = 114 staff | export by HR lead 2026-11-02 | **GAP** | Data protection training records in the window; AI training for the other 95 staff (at least 89 more to reach 114) | HR lead |
| R6 | incident-log_2026.csv | "INC-02,2026-05-07 09:40,Tannwald,\"service list with 14 Tannwald customers e-mailed to a wrong external address\",2026-05-08 16:10,mail auto-complete chose the wrong address,\"auto-complete off for external mail; recipient confirmed deletion on 2026-05-07\",2026-05-11" | yes: detected, told, cause, fix | 2026 log; last entry 2026-10-12 | 1 Tannwald incident; told after 30.5 hours (within 48) | owner IT lead | **COVERED** (see flag C) | — | IT lead |
| R7 | backup-report_2026-10.txt | "Restore test: not done in 2026. Planned for Q4 2026 (owner: IT lead)." | the record shows no restore test | Oct 2026 | — | owner IT lead | **GAP** (evidence shows requirement not met) | A restore-test record with date, what was restored, result, who did it | IT lead |
| R7 note | it-notes_2026-10-06.md | "Backups are tested, the jobs run every night." | statement; contradicted by the backup report | — | — | not reviewed | not evidence | — | — |
| R8 | infosec-policy_v3_FINAL.md | "Approved 2024-03-12 by Dragan Ilievski, Managing Director. Next review: March 2025." | yes, it is the policy | no: approved 2024-03-12, 638 days before the window opens; review due March 2025 not recorded | — | yes, but stale | **WEAK** (PERIOD) | Approval of v4 by the Managing Director, dated, before 25 Nov; or a dated review record of v3 | Managing Director |
| R8 alt | infosec-policy_v4_DRAFT.md | "Approved by: (open)" | yes | last edit 2026-09-18 (not an approval) | — | no: draft, approval open | WEAK (APPROVAL) | as above | Managing Director |

(The R8 quote names the approver because it is copied word for word. Elsewhere this paper uses roles.)

### Count
```
COVERED 2  (R1, R6)
WEAK    1  (R8)
GAP     5  (R2, R3, R4, R5, R7)
Total   8
Training: 26 rows, 0 exact duplicate rows, 1 repeat person (E014, on 2026-09-03 and 2026-09-10) -> 25 staff / 120 = 20.8%
INC-02: 2026-05-07 09:40 -> 2026-05-08 16:10 = 30.5 hours
```

### Flags for a person to decide (not a status)
- **A. Clause 7, storage.** The system list and the vendor page show Tannwald request text stored in the United States. The folder has no written agreement from Tannwald. The notes say "A vendor rep told Dragan \"data stays in Europe\". Nothing in writing." The vendor page says data is stored in the US.
- **B. Clause 7, notice.** The folder has no written notice to Tannwald about Claude. The IT lead's note: "I found nothing."
- **C. Free chatbot use as a possible incident.** The notes describe Tannwald-desk agents using a free chatbot on personal phones until September. The incident log has no entry for it, so Tannwald was not told. If management treats this as an incident with Tannwald data, R6 is no longer COVERED, and the 48-hour rule applies from when it was detected.
- **D. Ahead of R4 and R7.** Policy v3 says "Administrator access is reviewed every quarter" and "Backups are restore-tested twice a year". The folder holds 1 access review (one system) and no restore test.

## Step 4: Gap requests (reply needed by Friday 20 November 2026, so there is time before 25 November)

**To the IT lead, R2:** Tannwald asks for "Your sub-processors for our data: contract date, last review, and the legal basis for any transfer outside the EU/EEA". The register has all three for Servicepult, Sprechband and Nordlager. For Anthropic it says "accepted online 2026-09-01", and the review and transfer-basis fields are blank. Please send the accepted terms with their date, any review record, and the document that gives the legal basis for the US transfer. "Does not exist" is a good answer.

**To the IT lead and Managing Director, R3:** Tannwald asks for "The AI tools your staff used with our data in the last 12 months: tool, data, storage country, and your approved rule". We have this for Claude Team, with the rule valid from 2026-10-01. Two things are missing: anything that covered Claude use from 1 to 30 September, and any record of the free chatbot that agents used on their phones until September (only your notes mention it). Please send which tool it was, which Tannwald data went in, how many agents used it, and when it stopped. Also send any written notice to Tannwald under clause 7. "Does not exist" is a good answer.

**To the IT lead, R4:** Tannwald asks for "Your last review of administrator accounts on every system in R1: leavers removed, multi-factor login on". We have the Servicepult review of 2026-08-14, approved 2026-08-17. We have nothing for Sprechband, the Nordlager file share or Claude Team. Please send those reviews, dated and approved. If they have not been done, do them and record them. "Does not exist" is a good answer.

**To the HR lead, R5:** Tannwald asks for "Training records for data protection and AI use, last 12 months, with the share of staff trained" and needs at least 95%. Your export has 25 of 120 staff on the Claude intro, which is 20.8%, and no data protection course. Please send any data protection training records since 10 Dec 2025, plus any AI training not in the export. "Does not exist" is a good answer.

**To the IT lead, R7:** Tannwald asks for "A restore test of your backups from the last 12 months, with its result". The October backup report says "Restore test: not done in 2026." If a test is done before 25 November, please send its record: date, what was restored, result, and who did it. "Does not exist" is a good answer.

**To the Managing Director, R8:** Tannwald asks for "Your information security policy, approved or reviewed in the last 12 months". Version 3 was approved 2024-03-12 and was due for review in March 2025. Version 4 is a draft, and its approval says "(open)". A dated approval of v4, or a dated review record of v3, closes this. "Does not exist" is a good answer.

## Step 5
No draft reply to Tannwald is in the folder, so there was nothing to check sentence by sentence.
