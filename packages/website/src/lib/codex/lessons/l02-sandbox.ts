// Ported from codex/lessons/02-sandbox.html + codex/js/lessons/L02.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L02",
  number: 2,
  title: "Execution Environments and Permissions",
  subtitle:
    "Local Codex follows the configured workspace sandbox and approval policy. Cloud tasks run in dedicated environments with separate network controls.",
  durationMinutes: 9,
  trackId: "fundamentals",
  hook: "Know where commands run and what they can reach.",
  keyConcepts: [
    "Local sandbox",
    "Cloud environment",
    "Approval policy",
    "Network configuration",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Local and cloud are different",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Codex has two execution models that must not be conflated.\n\n- **Local CLI and IDE sessions** run commands on your machine inside the configured OS-enforced sandbox. The common workspace-write configuration limits writes to the active workspace and keeps network access off unless enabled. The approval policy is a separate control that determines when Codex must ask before an action crosses the configured boundary.\n- **Cloud tasks** run in a dedicated OpenAI-managed container. Codex checks out the selected repository and commit, runs the environment setup, performs the task, and returns a summary and diff. Setup can use network access and setup-only secrets; those secrets are removed before the agent phase. Agent-phase network access is disabled by default and can be enabled per environment.\n\nFilesystem access, network access, and approvals are configuration choices. Inspect the active settings instead of inferring them from the Codex product name.",
        },
        {
          kind: "pull-quote",
          text: "A task is executable only when its required files, commands, dependencies, credentials, and network destinations fit the active environment policy.",
        },
      ],
    },
    {
      id: "s2",
      title: "Plan for the active boundary",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three checks prevent most environment-related ambiguity.\n\n**Make dependencies reproducible.** A cloud setup script can install project runtimes, packages, and fixtures before the agent phase. A local session uses the tools available on the machine and permitted by its sandbox. Document the exact setup and verification commands in the repository.\n\n**Declare network requirements.** A cloud agent phase cannot reach an external API unless network access is enabled for that environment and the destination is allowed. Local network access also depends on sandbox configuration. Prefer a versioned fixture when live data is not required.\n\n**Separate code changes from external-state verification.** Access to staging or production is a security decision, not a convenience. Use scoped credentials and explicit authorization when external validation is required; otherwise keep the coding task isolated and perform the external check through the normal release process.",
        },
      ],
    },
    {
      id: "s3",
      title: "Cloud environment inputs",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "A cloud environment combines a base image with repository-specific setup and policy. Review these inputs before assigning a task:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "provided by you",
              title: "Setup script",
              body: "A reproducible command sequence that runs after checkout during setup. Use it to install project dependencies and prepare test fixtures required by the task.",
            },
            {
              eyebrow: "provided by you",
              title: "Environment variables",
              body: "Non-secret configuration can remain available for the task. Setup-only secrets are available during setup and removed before the agent phase; do not design the task around reading them later.",
            },
            {
              eyebrow: "provided by you",
              title: "Network allow-list",
              body: "Agent-phase internet access is configured per environment. When enabled, restrict destinations and HTTP methods to what the task requires.",
            },
            {
              eyebrow: "provided by Codex",
              title: "The runtime",
              body: "A dedicated container with a checked-out repository and the tools supplied by the base image. The setup script adds project-specific requirements.",
            },
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "Illustrative network failure",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The task asks for a call to a Stripe test endpoint, but the configured environment cannot resolve the destination. The useful response is to report that boundary and use a reviewed fixture when it represents the required behavior.",
        },
      ],
    },
    {
      id: "s5",
      title: "Keep changes reviewable",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "A cloud task returns changes from its dedicated checkout. A local session changes the selected working tree or worktree. In either case, Git structure determines how easily the result can be inspected and integrated.\n\n- **Give concurrent tasks separate working trees or cloud environments.** Separate branches prevent shared file state, but overlapping diffs can still conflict when merged.\n- **Keep each change coherent.** Scope by one reviewable behavior and its tests, not by an arbitrary line or file limit.\n- **Start from an intentional base commit.** Record which revision the task uses and refresh it when upstream changes affect the same area.\n- **Re-run trusted checks outside the task when risk warrants it.** Agent-produced logs show what ran in that environment; CI and reviewer-run checks provide independent evidence.",
        },
        {
          kind: "callout",
          title: "Treat output as evidence, not approval.",
          body: "Read the diff against the requested behavior and excluded scope. Inspect additions, deletions, dependencies, generated files, and test changes. Review command logs for what actually ran, then repeat security- or release-critical checks in the repository's trusted pipeline.",
        },
      ],
    },
    {
      id: "s6",
      title: "Pre-flight checklist",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Before starting a task, record the environment assumptions that affect execution and review.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "sandbox readiness",
              title: "Sandbox readiness",
              body: "Does the documented check command run from the selected revision? Are dependencies reproducible? Which checks require services, network, environment variables, or setup-only secrets?",
            },
            {
              eyebrow: "task readiness",
              title: "Task readiness",
              body: "Is the observable goal explicit? Are acceptance checks runnable in this environment? Are excluded files and systems named? Who reviews the diff and verification logs before merge?",
            },
          ],
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Two questions on the sandbox contract." },
      ],
    },
  ]),
  widgets: [
    {
      kind: "compare",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: "Adjust the task for the sandbox",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        bad: "Fetch our OpenAPI spec from https://docs.acme.com/v3/openapi.json and generate TypeScript types.",
        good: "Using the spec at ./schemas/openapi.json (committed to the repo), generate TypeScript types in src/types/api.ts. Regenerate on CI.",
        note: "The repository fixture removes a network dependency and makes the input version-reviewable. If freshness is required, define a separate controlled update step.",
      },
    },
    {
      kind: "terminal-replay",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L02",
        cpId: "term-1",
        title: "Illustrative session: unavailable network",
        windowTitle: "codex@environment · task-network",
        frames: [
          {
            segments: [{ text: "codex> planning…", tone: "prompt" }],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: "  plan: 1) hit stripe test api  2) parse response  3) update doc",
                tone: "comment",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              {
                text: "$ curl -s https://api.stripe.com/v1/subscriptions",
                tone: "prompt",
              },
            ],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: "→ curl: (6) Could not resolve host: api.stripe.com",
                tone: "error",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              {
                text: "codex> network appears blocked. checking AGENTS.md for fixtures…",
                tone: "prompt",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [{ text: "$ ls tests/fixtures/", tone: "prompt" }],
            delayMs: 400,
          },
          {
            segments: [
              {
                text: "→ stripe_subscription_active.json · stripe_subscription_canceled.json",
                tone: "comment",
              },
            ],
            delayMs: 600,
          },
          {
            segments: [
              {
                text: "codex> using fixtures instead. proceeding…",
                tone: "prompt",
              },
            ],
            delayMs: 600,
          },
          {
            segments: [
              { text: "→ plan adapted: sandbox-compatible", tone: "output" },
            ],
            delayMs: 500,
          },
        ],
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L02",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "A cloud task must run end-to-end tests against a staging API. What must be established before the run?",
        options: [
          "Nothing; naming the staging API in the task grants access.",
          "The environment permits agent-phase network access to the destination, scoped credentials are available through an approved path, and the external test is authorized.",
          "The cloud task automatically uses the developer's local network.",
          "A passing local unit test proves the staging check ran.",
        ],
        correct: 1,
        explanation:
          "Cloud agent-phase network access is disabled by default and configured per environment. External verification also requires explicit authorization and appropriately scoped credentials. When those controls are unavailable, use fixtures for the coding task and keep staging verification separate.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L02",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "Which statement correctly distinguishes local and cloud Codex execution?",
        options: [
          "Both surfaces always run in a newly created cloud container.",
          "Local commands follow the configured workspace sandbox and approvals; a cloud task uses a dedicated checked-out environment with its own setup and network policy.",
          "Local sessions always have unrestricted network access.",
          "Cloud tasks automatically deploy an accepted diff.",
        ],
        correct: 1,
        explanation:
          "The execution surface determines the boundary. Local work happens in the selected working tree under its sandbox and approval configuration. Cloud work happens in a dedicated container created from a selected repository revision; its final answer and diff still require human review.",
      },
    },
  ],
};

export default lesson;
