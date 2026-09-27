# Question card

## The five boxes from the lesson

Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.

Terms: [guide glossary](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html#glossary).

During the lesson, fill only these five boxes (on paper works too). The prompts further down are
optional follow-up.

| Box | Your answer | Worked FOLDLINE example |
| --- | --- | --- |
| 1. Question |  | Show ending MRR by month for the last complete quarter (April to June 2026). |
| 2. Approved view |  | The approved monthly MRR summary (a view is a saved selection of data). |
| 3. Four blanks + who counts |  | Kind: month-end balance. Rows: one per month. Months: Apr to Jun. Table: MRR summary. Who counts: subscriptions still active at month end; cancelled ones are out. |
| 4. Boundary |  | The AI cannot read customer contact details. Database permissions enforce this. |
| 5. Test |  | April must equal €334,675 (true value from the finance-approved month-end report). A request for customer emails must be refused. |

**Box 3 adds one line: who counts?** After the four blanks, write who is in and who is out. Most
real questions hide their trap here: "active members" may or may not include paused or trial members.

**Box 5 needs a source for the true value**, for example last month's board report or a
finance-approved figure.

MRR is monthly recurring revenue: ten subscriptions at €20 per month give €200 MRR. One more €20
subscription is a monthly change of €20, to €220.

## Optional detail for a future implementation

### Decision boundary

- Decision this answer changes:
- Person or process making the decision:
- Latest useful answer time:

### Exact question

> Replace this line with the exact user question.

### Four blanks and who counts (box 3)

These map to `semantic-template/metric.yml`.

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
