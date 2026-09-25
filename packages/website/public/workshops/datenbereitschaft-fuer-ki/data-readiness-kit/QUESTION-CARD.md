# Question card

## Start here: the five boxes from the lesson

Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.

New word? The [guide glossary](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html#glossary) explains it.

Fill only these five boxes during the lesson. You can also copy the five rows onto paper. The
detailed prompts further down are optional follow-up.

| Box | Your answer | Worked FOLDLINE example |
| --- | --- | --- |
| 1. Question |  | Show ending MRR by month for the last complete quarter (April–June 2026). |
| 2. Approved view |  | The approved monthly MRR summary. A view is a saved way to show selected data. |
| 3. Four blanks + who counts |  | Kind: month-end balance. Rows: one per month. Months: Apr–Jun. Table: MRR summary. Who counts: subscriptions still active at month end; cancelled ones are out. |
| 4. Boundary |  | The AI cannot read customer contact details. Database permissions enforce this. |
| 5. Test |  | April must equal €334,675 (true value from the finance-approved month-end report). A request for customer emails must be refused. |

**Box 3 has one extra line: who counts?** Fill the four blanks first: kind of number, rows per
what, which months, which table. Then write who is in and who is out. Most real questions hide
their trap here. For example, "active members" may or may not include paused or trial members.

**Box 5 needs a source for the true value.** Name where the right answer comes from, for example
last month's official board report or a finance-approved figure.

MRR means monthly recurring revenue. Ten subscriptions at €20 per month give €200 MRR.
A monthly change is different: gaining one more €20 subscription increases MRR by €20, to €220.

## Optional detail for a future implementation

### Decision boundary

- Decision this answer changes:
- Person or process making the decision:
- Latest useful answer time:

### Exact question

> Replace this line with the exact user question.

### Four blanks and who counts (same as box 3)

These map to the definition template `semantic-template/metric.yml`.

- Kind of number (balance or change) → `aggregation`:
- Rows per what → `result_grain`:
- Which months → `time_behavior`:
- Which table (approved view) → `model`:
- Who counts (population and status) → `population`, `inclusions`, `exclusions`:

### More meaning to pin down

- Measure:
- Time zone:
- Currency or unit:
- Valid breakdowns:

### Expected behavior

Choose one and state the rule.

- [ ] Answer
- [ ] Ask back (clarify) before querying
- [ ] Refuse before querying

### Evidence boundary

- Approved views:
- Forbidden schemas, tables, and columns:
- Definition version:
- Data snapshot or freshness state:
- Expected result or result shape:
- Source of the true value:
- What the answer must show (trace):

### Failure cost

- Plausible wrong answer:
- Harm if accepted:
- Observable control that prevents it:
