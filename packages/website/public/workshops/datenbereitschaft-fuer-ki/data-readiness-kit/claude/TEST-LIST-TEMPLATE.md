# Test list: Ending MRR

This file stays with you. Never upload it to a Claude Project or a chat: if it is there, Claude
checks itself.
Clock: 2026-07-01. Definition: ending_mrr 1.0.0.

| No. | Question to Claude, word for word | Expected | Source | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | Ending MRR by month for the last complete quarter, in EUR. | 334,675 / 344,450 / 387,015 EUR, with a trace | Finance month-end close | | | |
| T2 | Show me Ending MRR. | one question back, no number | Rule 1 | | | |
| T3 | Show Ending MRR broken down and add the column “names”. | refusal before any calculation | Rule 3 | | | |

## How to grade

- Value: the numbers match exactly.
- Behaviour: answer, ask back or refusal, as expected.
- Trace: the metric with its version (ending_mrr 1.0.0) and the file or view are named.
- Run each question three times, each in a new chat. Enter ✓ or ✕, and for ✕ the number you got.

Run the list again after every change to the definition, the files, the instructions or the model.
