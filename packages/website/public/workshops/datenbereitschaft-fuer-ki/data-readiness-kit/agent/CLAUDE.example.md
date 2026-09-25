# Analytics routing guidance (example)

> **Guidance only. This file enforces nothing.** Instructions guide, grants enforce. An AI can
> ignore or misread an instruction. Only database permissions (grants) make a forbidden read fail.

## What this file is

- An example of instructions for Claude Code. To use it, copy it into your project's root folder
  and rename it to `CLAUDE.md`. Claude Code reads that file when it works in the project.
- Other AI tools and API integrations do not read it automatically.
- It assumes the definition files from `semantic-template/`: `metric.yml`, `model.yml` and
  `policy.yml`. Adapt the names to your own files.
- It does not connect Claude to a database. Use a read-only database login (in the example:
  `ai_analytics_reader`) that has only the grants listed in `policy.yml`. The builder notes in
  `builder/README.md` describe the setup steps.

## Approved route

- Use only the views and metrics defined in `metric.yml`, `model.yml` and `policy.yml`.
- Use the smallest approved view that answers the question.
- Always write view names with their schema, for example `analytics.mrr_summary_monthly`.
- Never query `raw`, `core`, or `staging` assets directly.
- Never request or return direct customer or contact identifiers (names, emails, phone numbers,
  addresses).
- Never add month-end balances across months. A snapshot metric such as ending MRR is a balance at
  one moment; summing three balances gives a meaningless number.

## Decision rules

- Ask back about "MRR" when the period, or the choice between month-end balance and monthly change,
  is missing.
- Refuse a metric when its definition or required inputs are missing.
- Refuse profit questions when cost data and an approved profit definition are missing.
- Refuse direct-identifier requests before writing any SQL.
- When the data is older than the metric's `freshness_sla_hours`, answer and say how old the data
  is. No hard expiry is declared, so do not block on age alone.
- Stop before querying when the requested period is not complete or the quality check is failing.
- Never replace a missing metric with a similar one (a proxy) unless the user explicitly asks for a
  labeled proxy and the policy permits it.

## Show with every answer

1. The answer, the question back, or the refusal.
2. Metric name and version (for example `ending_mrr@1`).
3. Exact period and unit.
4. The approved view used.
5. Data load time, data age, and whether it is past the warning threshold.
6. Where the data comes from (lineage), quality status, and owner.
7. Limitations.

## Test runs only

When running the fixed cases in `semantic-template/verified-questions.yml`, also record:

- case ID and expected behavior;
- the test's fixed "now" (evaluation clock);
- the semantic checksum: a fingerprint (hash) of the definition files used.

Do not add these test fields to answers for real users.

## What actually enforces the rules

- The application that sends the AI's SQL must check it against `policy.yml` before it runs.
- The database grants for `ai_analytics_reader` must deny every forbidden schema and column.
  A forced read of `core.accounts.contact_email` must fail with SQLSTATE `42501` (permission denied).
