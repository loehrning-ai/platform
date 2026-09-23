# Bounded evidence canvas

This is the optional technical follow-up. During the lesson, use the five-box table in
`QUESTION-CARD.md`. This canvas checks whether those design choices have evidence behind them.

Score one question and one AI-facing data surface. Attach evidence; do not grade intentions.

Lock four decisions: metric meaning, result grain, period behavior and approved surface.

| Gate | Required proof | Current evidence | Owner | Next test |
| --- | --- | --- | --- | --- |
| Restricted surface | Named read-only identity can access only approved serving assets; a forbidden read fails at the database |  |  |  |
| Explicit structure | Every exposed model declares grain, key, time semantics, types, and valid relationships |  |  |  |
| Agreed meaning | Metric formula, population, period, status, currency, dimensions, owner, and limits are versioned and consumed |  |  |  |
| Dependable data | Freshness, quality, lineage, ownership, and stale/broken behavior are observable |  |  |  |
| Yardstick | Gold answers, clarification cases, refusals, permission denials, and required traces re-run after change |  |  |  |

## Ship rule

- **Not ready:** at least one control is unproven.
- **Pilot only:** every control is documented; at least one lacks executable proof.
- **Bounded ready:** all ten controls are proven for the declared question and surface.

An average score never overrides a weak control. This is a question-scoped evidence gate, not a
maturity model or platform certification.

Simulation receipts prove only the sealed synthetic FOLDLINE fixture. Replace them with equivalent
runtime and database evidence before grading another system.
