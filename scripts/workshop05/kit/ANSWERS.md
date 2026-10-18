# Answer key: the Termin Health kit

**Open this only after you've run a step.** Claude's wording will differ, so compare the statuses and the numbers.

Fictional training data. Every company, person and document is invented. This key is what the files prove, not a Claude recording, legal advice or an audit opinion.

- Don't scroll past a stop line before you've run the next step.
- Files are in `project-files/` unless named `inbox/`. Rows are named by their first value (INC-03, adm-06, T-2286), text by quoted words.
- Dates that count: a policy's last review (its approval if none), a contract's last supplier review. Cutoff: 2025-12-03.
- "Also fine" lists other accepted answers, and what the reason must say.
- COVERED = every requested field is filled in, even when the answer is bad news. WEAK = a requested field is empty, "not recorded" or contradicted. A topic status (A10 GAP) and a request status (D5 COVERED) may differ.

---

## Warm-up A: the trap hunt

1. **US exports bucket.** `data_inventory.csv` row termin-support-exports holds patient excerpts in us-central1, but `company_profile.md` says "We keep all production data in the EU". (Claim 1, D1)
2. **Host without contract.** `supplier_register.csv` row Nordgrid Cloud AB gets health data, but its DPA is "pending", with no transfer mechanism and no review. (D2)
3. **Patient names in Claude.** The policy says "Never paste patient data into the Claude workspace". Five Claude tickets carry a patient's name: T-2285, T-2286, T-2291, T-2293, T-2298. (D3)
4. **Old, narrow pen test.** `pentest_summary_2025.txt`: "Report date: 2025-02-28", before the cutoff, and "Out of scope" holds the back office, the exports and every AI component. (D4)
5. **Training below 95%.** `training_records_2026.csv`: 26 of 31 finished security training, 19 of 31 AI training. E27 to E31 have neither. (Claim 5, D5)
6. **Late incident notice.** `incident_log_2026.csv` row INC-03: 212 patient records, customer told after 7 days (168 hours) instead of 48, corrective action empty. (D6)
7. **Leavers with admin access.** `access_review_2026.csv`: adm-04 and adm-07 left but kept their accounts and logged in afterwards. adm-06 has no MFA. (Claim 6, D7)

(Brackets: where the same trap appears in a request. Finding it there counts.)

**The clean file** is `backup_restore_test_2026.txt`. The first restore failed, but the cause was fixed ("CH-0412"), the second took 3 h 10 min against 4 h, and 2026-08-18 is inside the 12 months.

Score: 2 per trap, plus 1 for the clean file, minus 1 if you called it a trap (maximum 15). Bonus, 1 each: hosting note "licence: not recorded", logs "never rotated or deleted", DPIA "not done"; AI policy "Next review: 2026-06-18" (148 days overdue); Mailrelay Oy review 2025-03-01; the erasure policy lists only three places; INC-04 open 91 days at the export; "We have no certificate yet".

*Stop here until you've run Warm-up B and Step 1.*















































---

## Warm-up B: Data, Place, Paper

1. `audit_topics_reference.md`: **GO.** Public texts.
2. `data_inventory.csv`: **GO.** System names and countries.
3. `training_records_2026.csv` from a real HR system: **CLEAN FIRST.** A real export has names and emails. Use IDs.
4. `support_tickets_sample.csv`: **CLEAN FIRST.** The excerpts carry names and health details. Drop that column.
5. A real patient's lab PDF: **STAY OUT.** Health data that proves no control.
6. A cloud console screenshot: **CLEAN FIRST.** Bucket names and regions are the evidence. Blur the project ID and emails.

1 point per right lane. "The vendor has a DPA, so everything may go in" is wrong: a DPA answers Paper only, and your own policy still counts.

*Stop here until you've run Step 1.*















































---

## Step 1: the document request

In code: 26 of 31 (83.9%) have security training, 19 of 31 (61.3%) AI training. Everyone with AI training also has security training. 95% of 31 is 29.45, so 30 people are needed, and all 31 staff count.

- **D1 WEAK.** The inventory is current and gives a region or EU label per system (europe-west3 counts as a location; Deskwise, Claude Team and the triage server name no country), but the exports bucket (us-central1) disagrees with the profile. The triage server's "EU" is a sales page quoted in the hosting note.
- **D2 GAP.** Nordgrid Cloud AB gets health data, but its DPA is "pending", transfer mechanism "none". Missing: the signed DPA. Google (signed 2025-01-20, reviewed 2026-01-15) and Deskwise are current. Anthropic "accepted online" counts as signed for the date but names no signer: note it. Mailrelay holds contact data only, so it is not in D2. No file shows the controller authorising sub-processors (Art. 28(2)): a supporting point, not the status driver.
- **D3 WEAK.** Policy and hosting note describe both tools, but five tickets break the policy, the model's name, version and licence are "not recorded", its country rests on a sales page, and the policy review is overdue (approved 2025-06-18). The DPIA is A12 evidence, not part of D3.
- **D4 WEAK.** Report date 2025-02-28, before the cutoff. The scope leaves out the back office, exports and AI.
- **D5 COVERED, plus an action.** 83.9% and 61.3%, both below 95%. 4 more people in security and 11 more in AI use reach 30.
- **D6 WEAK.** A blank cell or "not investigated" makes a row WEAK, not GAP: the log is current and dated. INC-03 reached the customer after 7 days (168 hours) against 48, with an empty corrective action. INC-04 has no root cause, no corrective action, no decision on telling the customer.
- **D7 COVERED, plus an action.** The review of 2026-08-14, "performed by the Head of Operations", shows 8 of 9 admin accounts with MFA (not adm-06). adm-04 and adm-07 logged in 33 days and 1 day after leaving. Disable both, enable MFA on adm-06.
- **D8 COVERED.** The 2026-08-18 restore took 3 h 10 min against 4 h.

**Total: 3 COVERED, 4 WEAK, 1 GAP.** **Prediction check:** D1 to D7 are bad news; only D8 is clean.

Also fine: D4 as GAP, if the reason names 2025-02-28 and the excluded scope. D3 as GAP, if the reason names the DPIA not done and the unrecorded licence. D6 as GAP, if it names INC-04. Not fine: D7 as WEAK "unsigned" (a named owner counts as signed).

*Stop here until you've run Step 2.*















































---

## Step 2: the Trust page claims

Red first:

- **Claim 1 RED.** The exports bucket with patient excerpts is in us-central1. The exports bucket is the basis, not the Claude region (not recorded). Rewrite: name Frankfurt, database and lab-PDF bucket only.
- **Claim 2 RED.** "We have no certificate yet"; Stage 1 is booked for February 2027. Rewrite: "We are preparing for ISO/IEC 27001."
- **Claim 5 RED.** 26 of 31 and 19 of 31. "All" fails on any exception. Bonus: no file records data protection training, only "security". Rewrite: the real shares.
- **Claim 6 RED.** 8 of 9 admin accounts have MFA (adm-06 has none). Rewrite: "8 of 9".
- **Claim 3 AMBER.** Only a sales page, quoted in the hosting note, says "EU". No contract or invoice proves it. RED needs a file that states the opposite; a missing or pending item is AMBER. Rewrite: NONE.
- **Claim 4 AMBER.** The hosting note says "Not fine-tuned" for one model, written 2026-04-09. Nothing covers the Claude workspace's training terms ("accepted online" DPA), and patient data went in.
- **Claim 7 AMBER.** A claim with no scope means all systems with health data. Tests cover the database and lab-PDF bucket only (17 Feb, 18 Aug); the exports bucket and triage log have no backup file. Rewrite: name the scope, database and lab-PDF bucket.

**Total: 4 RED, 3 AMBER, 0 GREEN.** **Prediction check:** most people rate claim 3 GREEN, because the inventory and policy say "EU". It all traces to one sales page.

Also fine: claim 7 as GREEN, only with a rewrite that names the scope. Not fine: claim 4 as RED (patient data in Claude is trap 3). A valid rewrite is a sentence the files prove today, with no future wording, or NONE.

*Stop here until you've run Step 3.*















































---

## Step 3: trace one record

Status question: do the files prove this place was cleaned? A policy names the place but no record shows this patient's data gone: partial, WEAK. No policy cover and no record: GAP.

- **Production database** (europe-west3): the policy lists it ("production database, the lab-PDF bucket and the helpdesk"). No deletion log. **WEAK.**
- **Lab-PDF bucket** (europe-west3): same. **WEAK.**
- **Deskwise helpdesk** ("EU (vendor)", ticket T-2286): the policy lists it. No deletion log. **WEAK.**
- **Support exports bucket** (us-central1): weekly exports, may hold T-2286. Not in the policy. Missing: a deletion record and a check for T-2286. **GAP.**
- **Claude workspace** (region "not recorded"): the prompt of T-2286 holds name, date of birth and a health question. Not in the policy, no retention terms. **GAP.**
- **Triage model log** ("EU" claimed, not proven): every prompt and answer, "never rotated or deleted". The sample has no triage ticket for P-48213. Missing: a retention rule and a log search. **GAP.**
- **Backups** (europe-west3): they "expire after 35 days" (policy), "kept for 35 days" (restore test). No file shows the expiry happened. **WEAK.**

**Total: 0 COVERED, 4 WEAK, 3 GAP.** Surest place: the Claude workspace (T-2286); backups are the alternative. Extra places (Mailrelay, the clinic's own systems, finance) must be GAP or "not recorded"; "not relevant" rows are ignored.

In code: 19 days from request to confirmation, inside the 30-day rule. 2026-09-21 plus 35 days is 2026-10-26, the last backup expiry.

**Was the confirmation true?** No. The deadline was met, but "All data of patient P-48213 has been deleted" was not true on 21 September: backups kept a copy until 2026-10-26 (if production was deleted on 21 Sep), the Claude workspace holds T-2286, and the exports bucket and triage log have no deletion proof.

**Prediction check:** few people name the AI tools. An AI tool is a place where data lives.

Also fine: GAP for database, PDFs and Deskwise, if the reason says no deletion log is in the folder. COVERED for backups, only if the reason states the 26 Oct date. WEAK for the triage log, if nothing proves the patient is absent. Extra places (Google Cloud logs, Mailrelay): GAP.

*Stop here until you've run Step 4.*















































---

## Step 4: the Audit Readiness Passport

- **A1 Inventory WEAK.** Current, but it disagrees with the profile and takes the triage country from a sales page.
- **A2 Data classes WEAK.** The AI policy sets the rule, but its review is overdue and five tickets break it.
- **A3 Processors GAP.** Google Cloud and Deskwise are signed and reviewed; Mailrelay's review (2025-03-01) is stale. Missing: the signed DPA with Nordgrid ("pending").
- **A4 Location and transfers GAP.** The US bucket and Claude name SCCs. But Nordgrid's transfer mechanism is "none", the triage country is unproven and the Claude region is "not recorded".
- **A5 Access and MFA COVERED, plus an action.** 8 of 9 with MFA, two leavers still active. A file answers the question, so bad news is COVERED; the missing-part rule is for missing or old evidence.
- **A6 Logging GAP.** No file describes logging or who reads logs. Missing: a logging procedure and a review record.
- **A7 Encryption WEAK.** Backups ("encrypted at rest") and a laptop disk are encrypted. Nothing on the database, buckets or key holders.
- **A8 Backup COVERED.** A restore test from August, with a result.
- **A9 Incidents WEAK.** 7 days against 48 hours, an empty corrective action, INC-04 open.
- **A10 People GAP.** Training records are complete (83.9% and 61.3%). Missing: signed confidentiality terms.
- **A11 Testing WEAK.** A pen test from February 2025, narrow scope. Updates "installed by hand".
- **A12 AI tools GAP.** Missing: a DPIA ("not done"), the model's name, version and licence, a DPA with the host.

**Total: 2 COVERED, 5 WEAK, 5 GAP.** The weakest part decides: A3 is GAP like D2 (same Nordgrid DPA), and A12 is GAP for the missing DPIA while D3, which doesn't ask for one, is WEAK. **Prediction check:** 2 of 12. A 2/6/4 split is also fine.

Also fine: WEAK for A3, A4, A10 or A12; GAP for A2; WEAK for A8 (scope omits exports and triage logs); GAP for A9 (if it names INC-04). The reason must name the missing document. WEAK for A6, if it says the triage log has no retention rule and nobody reads it. GAP for A7, if no file names who holds the keys. Request-level statuses are not checked.

Bonus check: a tile per topic; a bar chart with security 83.9%, AI 61.3% and a line at 95%, or counts with the target 30 of 31; no patient names, never "compliant" or "certified".

*Stop here until you've run Step 5.*















































---

## Step 5: the Nordgrid invoice

The invoice shows, by field: Nordgrid Cloud AB; billing period 2026-10-01 to 2026-10-31; server llm-triage-01, total EUR 414.00; **Data centre: US-East (Ashburn, Virginia, USA)**; Server created: 2026-03-27; "No separate data processing agreement is signed with this account."

It proves October 2026 only. In code: the server has existed for 231 days (2026-03-27 to 2026-11-13). The question is the server's age, so 231, not the 12 days since the invoice date. The policy sentence "The model runs in our EU environment" is false for October 2026 and, if the server never moved, for all 231 days since it was created, per the invoice.

- **Claim 3 AMBER to RED.** The invoice contradicts the sales page.
- **Stay the same:** claim 1 RED; D1 WEAK or GAP; D2 GAP; D3 WEAK (GAP also fine, if the reason names the unrecorded model and the US host); the triage log in the erasure trace GAP (a row with no new status is fine if it says the log search is missing); A1 WEAK; A4 GAP (a proven US transfer with mechanism "none"); A12 GAP (the host is outside the EU).

The nine rows: D1 to D3, claims 1 and 3, triage log, A1, A4, A12. The count depends on your Step 4 statuses. What must hold: claim 3 turns RED and nothing improves. A4 may go WEAK to GAP, because the mechanism is now proven to be none. Claim lights: 5 red, 2 amber, 0 green.

Bonus: the hosting note (2026-04-09) came 13 days after the server existed and still repeated the sales page; the policy (2025-06-18) predates the server by 282 days.

**Prediction check:** one status changes, the rest only get a worse reason.

Next: move the server to an EU region, or sign a mechanism and a DPA, and stop sending patient data to it until then. Whether this is a personal data breach is for your data protection contact.

---

## Your Monday

Your first GAP is nearly always a contract never signed, an AI tool nobody wrote down, or a document older than 12 months. All are cheap to fix before an audit.
