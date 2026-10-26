# Tannwald supplier audit 2026: evidence index R1 to R8 (INTERNAL, do not send as is)
Fictional training material. Prepared 2026-11-09 from the eleven files in our folder.
Deadline to send: Wednesday 25 November 2026. Remote audit: Thursday 10 December 2026.
"Current" = dated on or after 2025-12-10. "Last 12 months" taken as 2025-12-10 to 2026-12-10, measured back from the audit date. (If Tannwald measures back from 9 Nov 2026 instead, none of the results below change.)

## Summary
| # | Document to send | Status | Main gap |
|---|---|---|---|
| R1 | system-list_2026-09.csv (+ vendor page printout) | Partial | Leaves out the free chatbot used until September. Claude data stored in US with no written agreement from Tannwald (clause 7) |
| R2 | subprocessors_2026-09.csv | Partial | Anthropic has no review and no transfer basis. Online acceptance only |
| R3 | ai-use-rule_v1.md (+ vendor page printout) | Gap | Free chatbot not documented. No written notice to Tannwald (clause 7). Rule approved 1 month after Claude went live |
| R4 | access-review_2026-08-14.csv | Gap | Covers Servicepult only. Missing for Sprechband, Nordlager, Claude Team |
| R5 | training-records_2026.csv | Gap | 25 of 120 staff = 20.8% (needs 95%). No data protection course at all |
| R6 | incident-log_2026.csv | Partial | INC-02 is fine (told within 30 h 30 min). The free chatbot use is not logged and Tannwald was not told |
| R7 | backup-report_2026-10.txt | Missing | No restore test in 2026. The report shows backups ran, but no restore was tested |
| R8 | none qualifies | Missing | v3 approved 2024-03-12, review overdue since March 2025. v4 is an unapproved draft |

Do not send: it-notes_2026-10-06.md (personal, not reviewed, a description and not a record), infosec-policy_v3_FINAL.md as R8 evidence (not current), infosec-policy_v4_DRAFT.md (not approved).
Do not claim: "data stays in Europe" (verbal from a vendor rep, nothing in writing, and the vendor page says the opposite).

---

## R1: Systems with Tannwald data and storage country (DPA 4.1)
Send: `R1/system-list_2026-09.csv`. Approved 2026-09-02 by Dragan Ilievski (MD), owner Goran Petrovski (IT lead). It is current and names its approver and owner.
| System | Stored in |
|---|---|
| Servicepult | Germany (Frankfurt) |
| Sprechband | Germany (Frankfurt) |
| Nordlager file share | Germany (Frankfurt) |
| Claude Team | United States (vendor page: "data is stored in the US") |

Gaps:
1. The free chatbot that Tannwald desk agents used on their phones "until September" (it-notes) processed Tannwald data in the last 12 months. It is not in the list. Tool, account type and storage country are unknown.
2. Claude Team stores Tannwald data in the US. Clause 7 requires Tannwald's written agreement for storage outside the EU/EEA. We found none.
3. The vendor page printout is dated 2026-06-15. I tried to re-check the live page today, but the sandbox blocked the request. Someone must re-read https://privacy.claude.com/en/articles/7996890 and print it again with today's date before we send it.

## R2: Sub-processors (DPA 4.3)
Send: `R2/subprocessors_2026-09.csv`. Owner Goran Petrovski, last updated 2026-09-05.
| Vendor | Contract | Last review | Transfer basis | OK? |
|---|---|---|---|---|
| Servicepult GmbH | 2024-02-01 | 2026-01-20 | not needed (EU) | yes |
| Sprechband GmbH | 2025-05-12 | 2026-05-12 | not needed (EU) | yes |
| Nordlager GmbH | 2023-11-15 | 2026-02-03 | not needed (EU) | yes |
| Anthropic | accepted online 2026-09-01 | **blank** | **blank** | no |

Gaps:
1. Anthropic: no review is recorded and no legal basis is given for the US transfer. Get Anthropic's DPA and the transfer mechanism it relies on (e.g. SCCs or the EU-US Data Privacy Framework), record a review, and fill in both columns. Do not enter a basis until we have the document in hand.
2. Check DPA 4.3 (we don't have its text here) to see whether Tannwald had to authorise a new sub-processor in advance. If so, adding Anthropic on 2026-09-01 without notice is a second breach, on top of clause 7.
3. If the free chatbot was a vendor service, it was in effect an undocumented sub-processor.

## R3: AI tools used with Tannwald data, last 12 months (DPA 4.4)
Send: `R3/ai-use-rule_v1.md`. Approved 2026-10-01 by Dragan Ilievski, owner Goran Petrovski, next review 2027-10-01. Also send the re-checked vendor page.
| Tool | Period | Data | Storage | Approved rule |
|---|---|---|---|---|
| Claude Team (25 seats) | since 2026-09-01 | request text pasted by agents | US | AI use rule v1, from 2026-10-01 only |
| Free chatbot on personal phones (name unknown) | unknown start, until Sept 2026 | Tannwald request text used to word replies, amount unknown | unknown | none; forbidden by rule v1 point 2 |

Gaps:
1. **Clause 7: AI tools may be used with Customer Data only after written notice to Tannwald.** No notice was found for either tool (it-notes). R3 asks for every tool used, so the free chatbot has to be disclosed. Leaving it out would be a false statement in an audit.
2. From 2026-09-01 to 2026-09-30, Claude was in use before any approved rule existed.
3. Our only evidence about the chatbot is Goran's unreviewed note. Before 25 Nov we need a short written investigation: which agents, which tool, period, what data (names, addresses, phone numbers?), and whether the data can be deleted.
4. The rule requires pseudonymisation (point 3), but we have no record that it is checked.

## R4: Admin account review, every system in R1 (DPA 5.2)
Send: `R4/access-review_2026-08-14.csv`. Servicepult only. Done 2026-08-14 by Goran Petrovski, approved 2026-08-17 by Dragan Ilievski.
- Leaver adm-03 (left 2026-07-31) removed 2026-08-14. That is 14 days after leaving.
- adm-04 had no MFA. MFA switched on 2026-08-14. All 5 accounts now have MFA.

Gaps: no recorded review for Sprechband, Nordlager or Claude Team. The policy says reviews are quarterly, but there is only one record for 2026. The it-notes line "checked every quarter" is not evidence. Fix: run and record the reviews for the three missing systems in the same format (account, status, role, MFA, decision, reviewer, approver) before 25 Nov.

## R5: Training, data protection and AI use, last 12 months (DPA 5.4)
Send: `R5/training-records_2026.csv`. HR export 2026-11-02 by Marija Trajkovska (HR lead). Staff on 2026-11-01: 120.
- 26 rows, but only 25 distinct staff (E014 appears twice: 2026-09-03 and 2026-09-10).
- **AI use: 25 / 120 = 20.8%.** Target is 95%, which means at least 114 staff.
- **Data protection: 0 records.** The policy requires it every year.
- The only course ("Claude Team intro", Sept 3 and 10) took place before AI use rule v1 was approved on 2026-10-01, so no one has been trained on the approved rule.

Fix: run data protection training and training on AI use rule v1 for all staff, and get a new HR export before 25 Nov. If we can't reach 95% by then, send the true figure with a dated completion plan.

## R6: Incidents with Tannwald data, 2026 (DPA 6.2)
Send: `R6/incident-log_2026.csv`. Owner Goran Petrovski, last entry 2026-10-12. (Decide whether to send the full log or a Tannwald extract. INC-01 and INC-03 involve no customer data.)
- INC-02: detected 2026-05-07 09:40, Tannwald told 2026-05-08 16:10, so **30 h 30 min, within 48 h**. Cause: mail auto-complete. Fix: auto-complete off for external mail, and the recipient confirmed deletion. Closed 2026-05-11. This entry is complete.

Gap: the free chatbot use is not in the log. Unapproved processing of Tannwald data on personal phones with a free service may be a personal data breach. It was known by 2026-10-06 at the latest, and Tannwald has not been told, so the 48-hour window from that date has already passed. Management (and legal counsel, if you use one) must decide **now**, not at the 25 Nov deadline, whether to notify Tannwald. Either way, log the decision and the reasons.

## R7: Restore test, last 12 months (DPA 5.6)
`R7/backup-report_2026-10.txt` shows 31 of 31 nightly jobs completed in October 2026, kept for 35 days. The same report says: "Restore test: not done in 2026. Planned for Q4 2026."
- **No restore test record exists.** Policy v3 requires one twice a year. The it-notes line "backups are tested" is wrong.

Fix: do the planned restore test before 25 Nov. Record date, who did it, what was restored (e.g. a Servicepult export and files from the share), from which backup date, time taken, result and sign-off. Send that record. The backup report is only supporting material.

## R8: Information security policy, approved or reviewed in the last 12 months (DPA 5.1)
- v3 FINAL: approved 2024-03-12, next review March 2025. **Not current.**
- v4 DRAFT: last edited 2026-09-18, approver "(open)". **Not approved.**

Fix: Dragan Ilievski approves v4 with a date before 25 Nov. Before approval, write rules 1 to 5 out in full, not "as in version 3", so v4 can stand alone. Also make sure the policy matches practice: quarterly admin reviews and twice-yearly restore tests are not happening. Either do them or change the rule.

---

## Actions before 25 November 2026
| # | Action | Owner (suggested) | Urgency |
|---|---|---|---|
| A1 | Decide on telling Tannwald about the free chatbot use and the Claude use without notice (clause 7, 6.2) | Dragan Ilievski | **Now** |
| A2 | Written investigation of the free chatbot use. Add it to the incident log | Goran Petrovski | Now |
| A3 | Written notice to Tannwald about Claude Team, and a request for written agreement to US storage (clause 7) | Dragan Ilievski | Now |
| A4 | Anthropic DPA: record transfer basis and review in the register | Goran Petrovski | before 25 Nov |
| A5 | Admin reviews for Sprechband, Nordlager, Claude Team | Goran Petrovski | before 25 Nov |
| A6 | Data protection and AI rule training for all staff. New HR export | Marija Trajkovska | before 25 Nov |
| A7 | Restore test with signed record | Goran Petrovski | before 25 Nov |
| A8 | Approve policy v4 (full text) | Dragan Ilievski | before 25 Nov |
| A9 | Re-check the vendor page, print again with date. Update system list (R1) | Goran Petrovski | before 25 Nov |

Anything not fixed by 25 Nov: send what we have and name the gap with a date for the fix. Do not send the it-notes and do not describe practices that the records do not show.
