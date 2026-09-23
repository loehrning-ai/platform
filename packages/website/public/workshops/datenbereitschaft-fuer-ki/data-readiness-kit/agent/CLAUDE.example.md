# Analytics routing guidance

This file guides Claude Code when it works inside this project. It is not read automatically by an
arbitrary API integration. It does not enforce policy or database access.

## Approved route

- Use only models and metrics in the compiled semantic catalog.
- Prefer the lowest-grain approved serving model needed for the question.
- Never query `raw`, `core`, or `staging` assets directly.
- Never request or return direct customer or contact identifiers.
- For every answer, state the metric version, exact period, unit, data snapshot, and source model.
- Treat snapshot metrics as non-additive across time unless the metric contract says otherwise.

## Decision rules

- Clarify “MRR” when the period or snapshot-versus-movement meaning is missing.
- Refuse a metric when its definition or required inputs are absent.
- Refuse profit questions when cost data and an approved profit definition are absent.
- Refuse direct-identifier requests before generating SQL.
- Warn when source age exceeds the model's freshness threshold. Stop before querying when the
  requested period is incomplete or the required quality gate is failing.
- Never replace a missing metric with a proxy unless the user explicitly requests a labeled proxy and
  policy permits it.

## Required trace

Return:

1. case ID, expected behavior, and answer, clarification, or refusal;
2. metric name and version;
3. exact period and unit;
4. approved source model;
5. data snapshot, freshness state, and evaluation clock;
6. lineage, quality state, and owner;
7. semantic checksum;
8. limitations.

The application must separately validate generated SQL against policy. PostgreSQL grants must
separately deny forbidden assets.
