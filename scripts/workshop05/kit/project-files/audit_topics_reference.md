# The 12 audit topics: what an auditor looks for
Fictional training data. Every company, person and document is invented. Only the laws and standards named here are real. Summary written 13 November 2026 from the public texts listed at the end; it is not legal advice and not the standard itself.

Customers such as Rheinland Praxisverbund AG build their audits on three sources: the controls of ISO/IEC 27001:2022 Annex A (93 controls in four themes), the processor duties in the GDPR, and, for AI tools, the EU AI Act. An auditor does not read everything. They sample a few records and follow each one from the request to the proof.

| # | Topic | Evidence an auditor asks for | Anchor |
|---|---|---|---|
| A1 | Inventory: what data sits where | A current list of systems, data types, owners and countries | Annex A 5.9; GDPR Art. 30 |
| A2 | Data classes and PII handling | A rule for health and other personal data, and proof that staff follow it | Annex A 5.12, 5.34; GDPR Art. 5, 9 |
| A3 | Processors and suppliers | A signed contract (DPA) with every supplier that touches personal data, and a review date | Annex A 5.19 to 5.23; GDPR Art. 28 |
| A4 | Data location and transfers | Each country where data is stored or processed, and the legal mechanism for any transfer outside the EU/EEA | GDPR Art. 44 to 46 |
| A5 | Access control and MFA | A review of privileged accounts, leavers removed, multi-factor login | Annex A 5.15 to 5.18, 8.2, 8.5 |
| A6 | Logging and monitoring | Logs that show who did what, with a retention rule, and a person who reads them | Annex A 8.15, 8.16 |
| A7 | Encryption and keys | Which data is encrypted, where, and who holds the keys | Annex A 8.24 |
| A8 | Backup and recovery | A restore test from the last 12 months with a result | Annex A 8.13, 5.30 |
| A9 | Incidents and breach duties | An incident log with detection date, notice date, cause and fix | Annex A 5.24 to 5.28; GDPR Art. 33 |
| A10 | People: training and confidentiality | Training records for all staff and signed confidentiality terms | Annex A 6.3, 6.6; AI Act Art. 4 |
| A11 | Vulnerabilities and testing | A security test from the last 12 months that covers the systems in use, and a patch routine | Annex A 8.8, 8.29 |
| A12 | AI tools and their hosting | Approved tools, what data each may receive, model name, version and licence, host and country, logs, a data protection impact assessment where health data is involved | Annex A 5.10, 5.23; GDPR Art. 35; AI Act Art. 4 |

## Rules that matter this week

- GDPR Art. 28: a processor works under a written contract with the controller (a DPA). Sub-processors need the controller's prior written authorisation, either for a named sub-processor or as a general authorisation (the processor must then announce changes so the controller can object). Art. 28(2).
- GDPR Art. 33(2): a processor tells the controller without undue delay after becoming aware of a breach. Customer contracts often name a number of hours.
- GDPR Art. 35: a data protection impact assessment (DPIA) is required before processing that is likely to be high risk, for example health data at scale with a new technology.
- GDPR Art. 44 to 46: personal data may leave the EU/EEA only on a named basis: an adequacy decision, or safeguards such as standard contractual clauses. North Macedonia is not on the European Commission's list of adequacy decisions (checked October 2026). Narrow exceptions in Art. 49 exist but do not carry routine transfers.
- North Macedonia's Law on Personal Data Protection (Official Gazette 42/2020) follows the GDPR. The supervisory authority is the Agency for Personal Data Protection.
- EU AI Act Art. 4: providers and deployers take measures to support the AI literacy of their staff. This has applied since 2 February 2025.
- Opening an AI model's weights does not decide where your data goes. Where the server runs, what its logs keep and who can log in decide that.

## Sources

ISO/IEC 27001:2022 (Annex A control titles); Regulation (EU) 2016/679 (GDPR); Regulation (EU) 2024/1689 (AI Act); Law on Personal Data Protection of North Macedonia, Official Gazette 42/2020; European Commission, adequacy decisions. Check the current text before you rely on a date or a number.

## Statuses used in this kit

A file is current if dated on or after 3 December 2025.

- COVERED: a current file answers the request in full, even when the answer is bad news; then add an action.
- WEAK: a file answers, but it is old, has an empty or "not recorded" cell, or disagrees with another file; say which.
- GAP: no file answers it, or the file only says "pending", "none" or "not done"; name the document that would close it.
- Several parts: the part that is missing or old sets the status; name it. Example: Nordgrid's DPA is pending, so D2 is GAP though four suppliers are fine.
- Claims: RED (a file says the opposite), AMBER (missing, pending or not fully proven), GREEN (a file proves every word, for all systems with health data); "all" or "every" fails on one exception.
- A named owner or approver counts as signed; "accepted online" counts as signed.
