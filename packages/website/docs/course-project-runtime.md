# Course project runtime contract

Every canonical course has one applied project. The project produces bounded, client-validated
learning evidence and records a separate milestone without retroactively invalidating existing
course records. The milestone is not server-signed evidence and is not a certificate alternative.

## Runtime matrix

| Course                        | Engine           | Recorded project evidence                                  |
| ----------------------------- | ---------------- | ---------------------------------------------------------- |
| KI-Führerschein               | Case/redline lab | Safe prompt brief and claim redline                        |
| EU AI Act                     | Case lab         | Dated role, risk, obligation, and evidence file            |
| AI-Native                     | Prompt lab       | One provider completion plus local control and handoff plan |
| KI und Gesellschaft           | Case lab         | Provenance and stakeholder decision file                   |
| Claude                        | Prompt lab       | Prompt comparison, output inspection, and evaluation       |
| Codex                         | Repository lab   | Fixed server-seeded patch pipeline and inspected session diff |
| Data Infrastructure           | Data lab         | Fixed-program incident metrics and recovery decision       |
| Data Engineering Fundamentals | Data lab         | Fixed-program pipeline metrics and backfill decision       |
| Data Science                  | Data lab         | Fixed-program experiment metrics and model-card decision   |
| AI-Native Operator            | Prompt lab       | One provider completion plus local delegation controls     |

Each project follows the same stable learning loop: `GROUND → BUILD → RUN → VERIFY → TRANSFER`.
Course-specific copy, scenario, evidence, and criteria live in `src/lib/course-projects/`.

## Honest execution boundary

- Case labs operate on resettable synthetic fixtures in the browser. They never claim to execute an
  operating-system shell, production database, or remote service.
- The repository lab has two explicitly separate modes. Its default browser simulation changes only
  in-browser exercise state, does not claim operating-system execution, and cannot verify or complete
  the applied project. Its optional "isolated real run" calls `/api/course-workspace/terminal` with
  one exact ten-step command-ID sequence. The route creates a fresh Vercel Sandbox Node 24 microVM
  from the explicitly configured immutable `COURSE_TERMINAL_SANDBOX_IMAGE` digest, with
  `networkPolicy: "deny-all"`, `persistent: false`, a 60-second lifetime, 10-second per-command
  timeouts, and four server-seeded synthetic
  files. It accepts no learner command text, arguments, repository, files, credentials, or network
  destination. The request schema rejects subsets, reordered steps, and repetitions. The response
  contains the real stdout, stderr, exit codes, and Git diff. Current-session project acceptance
  unlocks only when the server
  observes the expected baseline, failing pre-fix test, bounded fix, passing post-fix test, source
  syntax check, clean `git diff --check`, one-file scoped diff, and untruncated canonical results.
  The browser revalidates that session response before enabling local acceptance. Learning progress
  stores only bounded fixed flags, never stdout, stderr, or diff. Those persisted flags are
  client-validated learning evidence, not a durable server attestation. The VM is stopped in
  `finally`.
- The three data workbenches use the isolated route with separate, exact two-command contracts. Each
  fresh Node 24 workspace receives one generated fixture program and two invariant tests. Data
  Science executes a 249-row leakage/peeking experiment and compares the registered +5 pp metric to
  the invalid +22 pp leaked estimate. Data Engineering executes 117 events through validation,
  deduplication, watermarking, eight-event backfill, reconciliation, and a 102→102 replay. Data
  Infrastructure executes a 684 ms SLO breach followed by a 210 ms, zero-loss recovery. The server
  accepts a session response only when the program's exact JSON output matches the fixture contract
  and the independent test process exits zero with two passing tests and no failures. The browser then
  revalidates the exact workspace, commands, runtime, egress policy, results, and response shape.
  The editable query-shaped text is a browser-only preregistration contract; it is not executable SQL
  and is not sent to the route. No learner query, note, dataset, command, argument, credential, or
  endpoint is sent to the route. Learners do not author the executed Node programs.
- The prompt lab separates local structure diagnostics from provider output. A failed or disabled
  provider request never produces fabricated model text. AI-Native and AI-Native Operator each send
  one bounded prompt request and receive one model completion. Their approval, stop, budget, handoff,
  and evaluation controls are local planning controls; no agent graph, tool call, or workflow is
  executed.
- Live model execution uses `/api/ai-native/practice`. That route remains authenticated,
  rate-limited, no-store, bounded, server-keyed, and fail-closed behind an exact public model-ID
  allowlist, per-provider DPA/retention gates, and daily caller/global token quotas reserved
  together through a service-role-only database transaction. Authenticated practice and grading
  share one account namespace; anonymous grading remains pseudonymous-IP-bound. Supported reviewed
  IDs are `anthropic/claude-haiku-4.5` and
  `google/gemini-2.5-flash-lite`; each maps server-side to one pinned upstream model. The browser
  receives and sends no credential.

## Progress and assessment

Local project acceptance writes two pieces of learning evidence:

1. an exact lesson exercise result with a bounded summary; this is the applied-project milestone,
   keyed by the course's stable project ID and canonical progress lesson;
2. an idempotent project checkpoint for the shared achievement ledger.

Existing certificate rules remain backward-compatible: canonical lessons are required, and courses
with a final assessment still require that assessment. AI-Native retains only its historical
capstone self-review as the legacy alternative to its workshop quiz. The new applied-project exercise
does not replace the quiz. All courses record the applied project as additional evidence; it is not a
requirement for ordinary lesson completion, final-assessment access, or certificate eligibility.
The persisted `capstoneSubmitted` property remains only as the historical AI-Native capstone
self-review signal. It never proves completion of the new applied-project exercise and is ignored for
other courses.

## Model-provider release gate

Provider choice is a release decision, not a client-side setting. Provider keys never enter the
browser. Before another provider is admitted, all of the following must exist:

- an explicit model allowlist and server-only credential;
- approved data-processing, residency, retention, and prompt-training terms;
- per-account or pseudonymous-IP call and token quotas enforced by this application;
- a global provider-token quota and a separate global Sandbox-run quota;
- timeouts plus explicit handling for payment, rate-limit, and provider-unavailable responses;
- usage-only audit records by default, with raw prompts and responses excluded;
- live authenticated proof in the target environment.

These counters reserve estimated tokens or run counts. They do not measure price, currency, billed
usage, provider account balance, or total spend; billing controls must be configured and verified at
the provider separately.

Gemini free-tier traffic is not admitted for learner free text because its data-use terms differ
from paid service. `GEMINI_PAID_TIER_CONFIRMED_AT` is a deployer-supplied review marker only: the
application does not query or prove the Google billing tier. Low-cost Chinese-hosted models remain
synthetic-data-only until provider contract
and international-transfer review are complete. Listed prices and promotional token grants are not
durable entitlements and must not be encoded as course guarantees.

Primary references:

- Gemini API pricing and data-use tiers: <https://ai.google.dev/gemini-api/docs/pricing>
- Gemini API key security: <https://ai.google.dev/gemini-api/docs/api-key>
- Vercel AI Gateway budgets: <https://vercel.com/docs/ai-gateway/observability-and-spend/budgets>
- Vercel prompt-training control limits: <https://vercel.com/docs/ai-gateway/security-and-compliance/disallow-prompt-training>
- Gemini REST text generation: <https://ai.google.dev/gemini-api/docs/generate-content/text-generation>
- Gemini models: <https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite>
- Anthropic model IDs: <https://platform.claude.com/docs/en/about-claude/models/overview>

## Exact live-proof boundary

This implementation has local type, unit, route, SDK-shape, and environment-contract proof only.
The tests inject fake provider clients, fake REST responses, and a fake Sandbox factory. They do not
call Anthropic, Google, Vercel Sandbox, Supabase, or a deployed route.

A live claim requires all of the following evidence from the target deployment, separately:

1. `20260813000000_add_usage_budget_counter.sql` is applied and its service-role-only
   `usage_budget_consume_pair` and `rate_limit_consume_multi` RPCs atomically reserve model-token
   ledgers and every applicable request/run-limit scope;
2. provider and terminal environment groups pass `validate-env` with real reviewed dates and
   token/run quotas, without printing or copying any credential;
3. an authenticated learner request proves the selected provider response, no-store headers,
   pseudonymous quotas, and failure mapping;
4. authenticated terminal requests prove deny-all networking, the repository's actual
   failing/passing test exits and scoped diff, each data workspace's actual metric/test attestation,
   immutable reviewed image resolution, bounded timeouts, quota exhaustion, and Sandbox termination;
5. deployment logs and telemetry prove that prompts, responses, commands, stdout, stderr, diffs,
   account IDs, raw IP addresses, and credentials are absent.

Until those checks occur, provider execution and the real terminal remain operationally unproven and
must stay disabled. Local green tests are not preview or production proof.

## Full browser runtimes

WebContainers can provide real Node processes but require HTTPS, cross-origin isolation, browser
compatibility work, and commercial-license review. Monaco provides editing, not execution, and has
no mobile-browser support. JupyterLite/Pyodide and DuckDB-Wasm can provide genuine local Python and
SQL execution but add large worker/runtime payloads and package constraints.

These runtimes are valid follow-on adapters behind the existing engine contract. They are not loaded
globally into every lesson. Any adapter must retain the synthetic-data default, mobile fallback,
reset behavior, accessibility contract, and deterministic assessment path.

Primary references:

- WebContainers quickstart: <https://webcontainers.io/guides/quickstart>
- WebContainers licensing: <https://webcontainers.io/enterprise>
- Monaco FAQ: <https://github.com/microsoft/monaco-editor/blob/main/docs/FAQ.md>
- JupyterLite: <https://jupyterlite.readthedocs.io/en/stable/>
- Pyodide: <https://pyodide.org/en/stable/usage/quickstart.html>
- DuckDB-Wasm: <https://duckdb.org/docs/stable/clients/wasm/overview>

## LMS boundary

LTI 1.3/LTI Advantage is the integration target after project identifiers and scoring schemas are
stable. Deep Linking selects a project, Names and Role Provisioning maps roles, and Assignment and
Grade Services receives coarse completion/rubric results. Raw prompts, outputs, and artifact content
do not flow to the LMS. LTI does not replace sandboxing, model-token quotas, or provider policy.

Reference: <https://www.1edtech.org/standards/lti>
