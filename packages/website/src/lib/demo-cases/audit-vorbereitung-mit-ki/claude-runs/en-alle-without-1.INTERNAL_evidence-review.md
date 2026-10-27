# Tannwald supplier audit 2026: evidence review (INTERNAL, do not send)
Fictional training material. Prepared 2026-11-09 from the eleven files in our folder.
Documents due to Tannwald: Wed 25 Nov 2026. Remote audit: Thu 10 Dec 2026.
Tannwald's tests: the document is dated on or after 2025-12-10; it names an approver or owner; it is a record, not a description; training reaches at least 95%; incidents are reported within 48 h.

Nothing has been sent. `draft-pack/` holds copies of the documents that could go out for each R. Management has to decide on the open points below first.

## Summary

| # | Evidence in draft-pack | Current / owner? | Meets the request? | Main gap |
|---|---|---|---|---|
| R1 | system-list_2026-09.csv (+ vendor page) | Yes: approved 2026-09-02, MD | Partly | Claude Team stores data in the **US**. Clause 7 requires EU/EEA storage unless Tannwald agrees in writing, and we found no such agreement. Free chatbots used until Sept are not listed. |
| R2 | subprocessors_2026-09.csv | Yes: owner IT lead, 2026-09-05 | Partly | Anthropic row has **no last review and no transfer basis** for the US transfer. |
| R3 | ai-use-rule_v1.md, vendor page | Yes: approved 2026-10-01, MD | **No** | Free chatbot use on phones until Sept is not documented. No written notice to Tannwald (clause 7). Claude was used for one month before the rule was approved. |
| R4 | access-review_2026-08-14.csv | Yes: approved 2026-08-17, MD | Partly | Covers **Servicepult only**. Sprechband, Nordlager and Claude Team have no review. Leaver removed 14 days late. One admin had no MFA until the review. |
| R5 | training-records_2026.csv | Yes: HR lead, 2026-11-02 | **No** | 25 of 120 staff trained = **20.8%** (95% needed). AI course only. **No data protection training records at all.** |
| R6 | incident-log_2026.csv | Yes: owner IT lead, last entry 2026-10-12 | Yes for INC-02 | INC-02 was reported in 30 h 30 min, within 48 h. The free chatbot use may be an unlogged incident. |
| R7 | backup-report_2026-10.txt | Yes: IT lead, 2026-11-01 | **No** | It says "Restore test: not done in 2026". No restore test is on record. |
| R8 | none | No | **No** | v3 was approved 2024-03-12 and was due for review in March 2025, so it is not current. v4 is a DRAFT with no approval. |

Of the eight requests, only R6 can be met as things stand. R1, R2 and R4 are partly met. R3, R5, R7 and R8 fail.

## Most urgent: clause 7 and the free chatbots (R1, R2, R3, R6)
Clause 7: "AI tools are used with Customer Data only after written notice to the Customer. Customer Data is stored in the EU or EEA unless the Customer agrees in writing."

1. **Claude Team since 2026-09-01.** The system list says agents paste "request text" for Tannwald. The vendor page says "data is stored in the US". The IT notes (2026-10-06) say: "Did we ever tell Tannwald in writing that we use Claude (clause 7)? I found nothing." On the files we have, both parts of clause 7 look breached. Tannwald will see this in R1, R2 and R3, because our own documents say "United States".
   - A vendor rep told the MD "data stays in Europe". Nothing is in writing, and the vendor page says the opposite. **Do not use this claim.**
   - The vendor page printout is dated 15 June 2026 and itself says to re-check it. My attempt to open the page today was denied by the sandbox network filter, so I could not verify it. IT lead to re-read it and print it again before sending.
2. **Free chatbots on personal phones, until September 2026.** The only source is Goran's unreviewed notes. That use broke the current AI rule (point 2) and clause 7. If Tannwald customer data went into those chats, this is probably also a personal data breach. A processor must report a breach to the controller without undue delay (GDPR Art. 33(2)), and our DPA section 6.2 sets 48 hours. We have known since at least 2026-10-06. This needs a decision now, not on 25 Nov.

**Decisions needed (MD, with legal/DPO):**
- Stop putting Tannwald data into Claude Team until Tannwald has written notice and has agreed in writing to US storage. Or ask Tannwald for that agreement now.
- Investigate the chatbot use and write up the facts: which agents, which apps, which period, what data, and whether any customer names, addresses or phones were included. Then decide whether to log it as INC-04 and notify Tannwald.
- Tell Tannwald before they find this in the pack. Do not leave Claude out of R1, R2 or R3. Leaving it out would make the pack false.

## R1 – Systems and storage country
- Send: `system-list_2026-09.csv`, plus the re-checked vendor page.
- Gaps: the free chatbots are not listed. Either add a historic-use note or cover them in R3. The Claude row's "request text pasted by agents" may still identify people even after the [NAME]/[ADDRESS]/[PHONE] rule (for example appliance serial numbers).

## R2 – Sub-processors
- Send: `subprocessors_2026-09.csv`.
- EU vendors: contracts and reviews are complete. Last reviews were 2026-01-20, 2026-05-12 and 2026-02-03, all within 12 months.
- Gap: the Anthropic row is empty for `last_review` and `transfer_basis`. Before sending, the IT lead should complete it from Anthropic's actual DPA or commercial terms, for example SCCs or another documented basis. **Do not fill in a basis we cannot show.** Then the MD reviews and dates the register again. Also check whether DPA 4.3 required prior notice to Tannwald for a new sub-processor.

## R3 – AI tools with Tannwald data, last 12 months (since 2025-11-09)
- Send: `ai-use-rule_v1.md` (approved 2026-10-01) and the vendor page.
- Missing: a record listing **both** tools.
  - Claude Team: from 2026-09-01; request text; US.
  - Free chatbots: until Sept 2026; data, tool and storage country unknown; no rule in place at the time.
  - We need to create this record from the investigation above, approved by the MD.
- Note: Claude was in use 2026-09-01 to 2026-09-30 before the rule was approved. Training on "data rules" ran on 3 and 10 Sept, also before approval.

## R4 – Admin access review
- Send: `access-review_2026-08-14.csv` (Servicepult).
- Gaps:
  - No review exists for Sprechband (admin owner: team lead Tannwald desk), Nordlager or Claude Team.
  - adm-03 left 2026-07-31 and was removed 2026-08-14, 14 days later.
  - adm-04 had no MFA until 2026-08-14.
  - Policy rule 2 says quarterly, but there is no earlier review on file. "Checked every quarter" in the IT notes is a description, not a record.
- Action: run and record a review of all four systems before 25 Nov, covering leavers and MFA, approved by the MD. The next quarterly Servicepult review is due about mid-November anyway.

## R5 – Training
- Send: `training-records_2026.csv`.
- Facts: there are 26 rows, but E014 appears twice (2026-09-03 and 2026-09-10). That makes **25 unique staff of 120 = 20.8%**. At least 114 staff are needed for 95%. The only course is "Claude Team intro: data rules".
- Gaps:
  - No data protection training is recorded in the last 12 months. Policy rule 4 requires it every year.
  - The AI training reached only the 25 seat holders. But the AI rule applies to all staff, and the chatbot use happened on the Tannwald desk.
- Action: run data protection and AI-rule training for all staff before 25 Nov (or at least before 10 Dec), and get a new HR export.

## R6 – Incidents with Tannwald data in 2026
- Send: `incident-log_2026.csv`. INC-01 and INC-03 say no customer data, so the full log can go out as it is.
- INC-02:
  - Detected 2026-05-07 09:40.
  - Tannwald told 2026-05-08 16:10, which is **30 h 30 min, within 48 h**.
  - Cause: mail auto-complete.
  - Fix: auto-complete turned off; recipient confirmed deletion.
  - Closed 2026-05-11.
- Check: INC-03 (phishing click). Confirm the affected account had no access to Servicepult or other Tannwald data before we send "none".
- Open: the free chatbot use (see the urgent section above).

## R7 – Restore test
- `backup-report_2026-10.txt` shows that backups run: 31 of 31 jobs in October. It also states that no restore test was done in 2026, against policy rule 3 (twice a year). Sending it alone answers R7 with "no".
- Action: the IT lead runs a restore test now. That means restoring a Servicepult export and a file-share sample from Nordlager, then recording the date, what was restored, the time taken, the result and the approver. Send that record together with the backup report.

## R8 – Information security policy
- `infosec-policy_v3_FINAL.md`: approved 2024-03-12, review due March 2025, so it is **not current**.
- `infosec-policy_v4_DRAFT.md`: not approved. It also says only "Rules 1 to 5 as in version 3", so it is not a complete document.
- Action: write v4 out in full, then have the MD approve and date it before 25 Nov.
- Note: our records show we are not meeting rules 2, 3 and 4 today (quarterly review, restore tests, annual training). Fix the practice; do not weaken the policy wording to pass the audit.

## Not for sending
- `it-notes_2026-10-06.md`: personal, unreviewed notes. Its facts must go into proper records instead (see R3 and R6).
- `infosec-policy_v3_FINAL.md` and `infosec-policy_v4_DRAFT.md`: not current and not approved.

## Action list (by 25 Nov 2026 unless marked)
| # | Action | Owner | When |
|---|---|---|---|
| 1 | Decide on Claude use with Tannwald data, clause 7 notice and agreement, and proactive disclosure | MD + legal/DPO | Now |
| 2 | Investigate the chatbot use; decide on INC-04 and notification to Tannwald | IT lead, MD | Now |
| 3 | Complete the Anthropic row (review date, transfer basis) and re-approve the register | IT lead, MD | |
| 4 | Write the AI tool record for R3 (both tools) | IT lead, MD | |
| 5 | Run an admin access review on all four systems | IT lead, MD | |
| 6 | Train all staff on data protection and the AI rule; new HR export | HR lead | |
| 7 | Run and record a restore test | IT lead | |
| 8 | Complete and approve infosec policy v4 | IT lead, MD | |
| 9 | Re-read the Anthropic vendor page and print it again | IT lead | Before sending |
| 10 | Confirm the INC-03 account had no Tannwald data access | IT lead | |
