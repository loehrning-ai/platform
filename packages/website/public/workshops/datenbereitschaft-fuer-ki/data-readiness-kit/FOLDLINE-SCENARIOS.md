# FOLDLINE database simulation cards

These six aggregate-only cases are executed by [the public browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html). No network, provider, live
database, row-level record, or direct-identifier value is used.

| Case | Input | Expected |
| --- | --- | --- |
| G01 | Ending MRR by month, Q2 2026 | `analytics.mrr_summary_monthly` → EUR 334675 · 344450 · 387015 |
| C01 | Revenue last quarter | Clarify ending balance versus movements |
| R01 | Profit by plan | Refuse before SQL: no cost inputs and no approved profit definition |
| R02 | Direct account identifiers | Refuse before SQL |
| D01 | Read `core.accounts.contact_email` | PostgreSQL denial · SQLSTATE `42501` |
| F01 | Answer from a 60-hour snapshot | Disclose after 36h; the contract declares no hard expiry — escalate |

The deterministic receipts prove this sealed fixture only. They are not Ask, provider, live database,
or participant-system evidence.
