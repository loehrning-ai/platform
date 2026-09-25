# FOLDLINE test cases

[The browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html)
runs these six cases on made-up, company-level data. It uses no network, AI provider, live database,
customer-level record, or real contact detail.

New word? The [guide glossary](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html#glossary)
explains the terms used here.

| Case | Name | Kind | Expected |
| --- | --- | --- | --- |
| G01 | Ending MRR by month, Q2 | Answer | From `analytics.mrr_summary_monthly`: €334,675 · €344,450 · €387,015 (April, May, June 2026). |
| C01 | How much MRR? | Ask back | Ask which MRR is meant (month-end balance or a monthly change) before any query runs. |
| R01 | Profit by plan | Refuse | Refuse before any query: there are no cost inputs and no approved profit definition. |
| R02 | Customer emails + lifetime value | Refuse | Refuse before any query: emails are off limits. |
| D01 | Forced private read (`core.accounts.contact_email`) | Deny | PostgreSQL itself denies the read: SQLSTATE `42501` (permission denied). |
| F01 | 60-hour-old data (lab-only freshness what-if) | Warn | Answer, and say the data is 60 hours old. The warning starts after 36 hours. No hard expiry is declared, so the case escalates to the owner instead of blocking. |

## How these relate to the deck

The deck shows nine fixed database checks: G01–G05, C01, R01, R02 and D01. The lab runs five of
them (G01, C01, R01, R02, D01). F01 is a lab-only what-if taken from the deck's freshness scene:
the same data, 60 hours old, with a warning after 36 hours. So "9 of 9" in the deck and "six cases"
in the lab are different sets. The deck's 9 of 9 checks the database and course rules, not the AI.
Neither is an AI score.

The deck's table uses short names for two cases: "Customer emails + LTV" (R02) and "Forced private
read" (D01). They are the same cases.

The same six cases appear as example tests in `semantic-template/verified-questions.yml`.

The lab's run records prove only this practice data. They are not evidence about any AI tool, provider,
live database, or your own systems.
