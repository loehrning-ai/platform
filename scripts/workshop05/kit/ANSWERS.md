# Answers
Fictional training material. Compare facts and statuses, not wording. Where you and Claude differ, the file decides.

## Mission 1: the index
8 of 11 files pass DATE and APPROVAL.

| File | Type | Date (kind) | Approved or owned by | DATE | APPROVAL |
|---|---|---|---|---|---|
| system-list_2026-09.csv | REGISTER | 2026-09-02 approved | D. Ilievski; owner G. Petrovski | pass | pass |
| subprocessors_2026-09.csv | REGISTER | 2026-09-05 updated | G. Petrovski | pass | pass |
| ai-use-rule_v1.md | POLICY | 2026-10-01 approved | D. Ilievski | pass | pass |
| vendor-page_claude_2026-06-15.md | STATEMENT | page 2026-06-15, printed 2026-10-06 | Anthropic (issuer) | pass | pass |
| access-review_2026-08-14.csv | RECORD | 2026-08-14 done, 2026-08-17 approved | D. Ilievski | pass | pass |
| training-records_2026.csv | RECORD | 2026-11-02 exported | M. Trajkovska | pass | pass |
| incident-log_2026.csv | RECORD | last entry 2026-10-12 | G. Petrovski | pass | pass |
| backup-report_2026-10.txt | RECORD | 2026-11-01 generated | G. Petrovski | pass | pass |
| it-notes_2026-10-06.md | STATEMENT | 2026-10-06 written | "Not reviewed by anyone" | pass | FAIL |
| infosec-policy_v3_FINAL.md | POLICY | 2024-03-12 approved, review due March 2025 | D. Ilievski | FAIL | pass |
| infosec-policy_v4_DRAFT.md | POLICY | 2026-09-18 edited | "Approved by: (open)" | pass | FAIL |

Watch for: an approver given to v4; "FINAL" read as current; a date taken from a file name; the vendor page marked unapproved (vendor plus page date count).

## Mission 2: the eight requests
| Item | File | Quote | Failing test | Status |
|---|---|---|---|---|
| R1 | system-list | "United States (see vendor-page_claude_2026-06-15.md)" | none | COVERED |
| R2 | subprocessors | "Anthropic,Claude Team,United States,accepted online 2026-09-01,," | QUOTE for part: last review and transfer basis empty | WEAK |
| R3 | ai-use-rule | "Valid from 2026-10-01." | SCOPE: 10 Dec 2025 to 30 Sep 2026 (295 days) has no rule; it-notes report a free chatbot until September | WEAK |
| R4 | access-review | "Review of administrator accounts in Servicepult" | SCOPE: 1 of 4 systems | WEAK |
| R5 | training-records | "Staff on 2026-11-01: 120." | not met: 26 rows, E014 twice, 25 of 120 = 20.8%; 95% needs 114 | GAP |
| R6 | incident-log | "INC-02,2026-05-07 09:40,Tannwald" and "2026-05-08 16:10" | none: told after 30.5 hours | COVERED |
| R7 | backup-report | "Restore test: not done in 2026." | not met | GAP |
| R8 | infosec-policy_v3_FINAL | "Approved 2024-03-12"; v4: "Approved by: (open)" | DATE (v3), APPROVAL (v4) | WEAK |

Count: 2 COVERED, 4 WEAK, 2 GAP.

R1 is COVERED and still bad news: the system list proves that Claude Team stores Tannwald request text in the US, and clause 7 requires written notice and EU/EEA storage unless Tannwald agrees in writing. COVERED means proven, not good.

The R7 question: no. A policy says what should happen. Only a record shows that it happened, and this record says it did not. The same holds for R4 and "Administrator access is reviewed every quarter".

Where Claude goes wrong on this folder, and the rule that stops it:
- R7 or R4 COVERED from the policy: rule 7.
- R8 COVERED from v4 because it is the newest: rule 5.
- R5 "26 staff" or a share without code: rule 11.
- R1 marked WEAK because the answer is unwelcome: rule 9.
- "ISO 27001 A.x.x" or a GDPR article that is in no file: rule 12.
- A quote that is not in the file: rule 10.

Where your status differs, find the rule number in project-instructions.md that decides it.

## Mission 3: gaps and reply
Gap list: R2, R3, R4, R8 (WEAK), R5, R7 (GAP). Owners: IT lead for R2, R3, R4, R7; HR lead for R5; Managing Director for R8. Needed by 2 December 2026.

Example email (R7), filled from templates/gap-request.md:

```
Subject: Tannwald audit on 10 December 2026, R7: restore test record needed by 2 December 2026

Hello Goran,

for the Tannwald audit on 10 December 2026, item R7 asks for:
"A restore test of your backups from the last 12 months, with its result"

What we have: backup-report_2026-10.txt, dated 1 November 2026.
It fails QUOTE: the record says "Restore test: not done in 2026." and no other file shows one.

What closes it: a restore test record (date, data restored, result, who), dated on or after 10 December 2025, made by the IT lead, covering the Servicepult export and the file share.

Please send it by 2 December 2026. If it does not exist, write "does not exist". That answer helps too: we then report the item as open, plan it, and give Tannwald a date.

Thank you,
[name]
```

Draft reply check:
| # | Sentence | Verdict | Evidence |
|---|---|---|---|
| 1 | All staff trained in data protection and AI | DELETE | training-records: 25 of 120 |
| 2 | Admin access reviewed every quarter | DELETE | one review, 2026-08-14, Servicepult only |
| 3 | Backups tested regularly | DELETE | "Restore test: not done in 2026." |
| 4 | Your data stays in the EU | DELETE | system-list: Claude Team, United States |

Sample reply (your wording will differ):
```
Dear Ms Keller,
today we send R1, our system list approved on 2 September 2026, and R6, our incident log for 2026. It shows one incident with your data (INC-02); we told you 30.5 hours after we detected it.
Four documents are incomplete. R2: the transfer basis for Anthropic (USA) is missing from our register. R3: our AI rule applies from 1 October 2026; we add a record of AI use before that date. R4: we are reviewing the administrator accounts of the three other systems. R8: version 4 of our security policy awaits approval.
Two we cannot send. R5: 25 of 120 staff are trained. R7: we have not run a restore test in 2026. You receive dates for both by 2 December.
Under clause 7 we owe you written notice of our use of Claude Team, which stores data in the USA. It is attached.
Dragan Ilievski
```
The reply must not say "all staff", "every quarter", "tested regularly", "stays in the EU" or "compliant". Anything that admits a contract point (clause 7) is the managing director's decision, with legal advice if you have it.
