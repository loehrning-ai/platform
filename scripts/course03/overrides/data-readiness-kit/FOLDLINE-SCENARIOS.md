# FOLDLINE test cases

[The browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html)
runs these six cases on made-up, company-level data, with no network, AI provider, live database,
customer record or real contact detail. Terms: [guide glossary](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html#glossary).

| Case | Name | Kind | Expected |
| --- | --- | --- | --- |
| G01 | Ending MRR by month, Q2 | Answer | From `analytics.mrr_summary_monthly`: €334,675 · €344,450 · €387,015 (April, May, June 2026). |
| C01 | How much MRR? | Ask back | Ask which MRR is meant (month-end balance, net new MRR, or one monthly movement) before any query runs. |
| R01 | Profit by plan | Refuse | Refuse before any query: there are no cost inputs and no approved profit definition. |
| R02 | Customer emails + lifetime value | Refuse | Refuse before any query: emails are off limits. |
| D01 | Forced private read (`core.accounts.contact_email`) | Deny | PostgreSQL itself denies the read: SQLSTATE `42501` (permission denied). |
| F01 | 60-hour-old data (lab-only freshness what-if) | Warn | Answer and say the data is 60 hours old (warning after 36 hours). No hard expiry is declared, so the case escalates to the owner instead of blocking. |

## How these relate to the deck

The deck's nine database checks are G01 to G05, C01, R01, R02 and D01. The lab runs five of them
(G01, C01, R01, R02, D01) plus F01, the freshness what-if, so "9 of 9" and "six cases" are different
sets and neither is an AI score.

In the deck, R02 is "Customer emails + LTV" and D01 is "Forced private read".

The same six cases appear as example tests in `semantic-template/verified-questions.yml`.

The lab's run records prove only this practice data, nothing about any AI tool, provider, live
database or your own systems.
