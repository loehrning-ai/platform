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
  title: "Execution environments and permissions",
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
            "- **Local CLI and IDE sessions** run commands on your machine in the configured OS-enforced sandbox. The common workspace-write setting allows writes only in the active workspace and keeps the network off until you enable it. A separate approval policy decides when Codex must ask first.\n- **Cloud tasks** run in a dedicated OpenAI-managed container: Codex checks out the chosen commit, runs setup, does the task and returns a summary and diff. Setup may use the network and setup-only secrets. The agent phase loses the secrets, and its network stays off unless you enable it per environment.\n\nRead the active settings before you rely on them.",
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
            "**Make dependencies reproducible.** Locally, Codex has only what the machine has and the sandbox permits; in the cloud, the setup script provides it. Put the exact setup and check commands in the repository.\n\n**Declare network needs.** If the task needs no live data, use a versioned fixture and leave the network off.\n\n**Keep external checks separate.** Staging or production access is a security decision and needs scoped credentials and authorization. Otherwise the check runs through the normal release process.",
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
            "A cloud environment is a base image plus the inputs below.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "provided by you",
              title: "Setup script",
              body: "Installs project dependencies and the task's test fixtures after checkout.",
            },
            {
              eyebrow: "provided by you",
              title: "Environment variables",
              body: "Non-secret values stay available. Setup-only secrets are gone in the agent phase, so the task must not depend on them.",
            },
            {
              eyebrow: "provided by you",
              title: "Network allow-list",
              body: "Internet access is set per environment. If enabled, allow only the destinations and HTTP methods the task needs.",
            },
            {
              eyebrow: "provided by Codex",
              title: "The runtime",
              body: "A dedicated container with the checked-out repository and the base image's tools.",
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
            "The task calls a Stripe test endpoint, and the environment cannot resolve the host. Codex reports the boundary and uses a reviewed fixture if one represents the required behavior.",
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
            "- **Separate working trees or cloud environments for concurrent tasks.** Separate branches avoid shared file state, but overlapping diffs can still conflict.\n- **One reviewable behavior and its tests per change**, whatever the line count.\n- **A deliberate base commit.** Record it and refresh it when upstream changes touch the same area.\n- **Trusted checks re-run outside the task when the risk warrants it.** Agent logs show what ran inside the task; CI and your own runs are independent evidence.",
        },
        {
          kind: "callout",
          title: "Output is evidence for your review.",
          body: "Read the diff against requested behavior and excluded scope, including additions, deletions, dependencies, generated files and test changes.",
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
          markdown: "Write down the environment assumptions before the task starts.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "environment",
              title: "Sandbox readiness",
              body: "Does the documented check command run on this revision with reproducible dependencies? Which checks need services, network, environment variables or setup-only secrets?",
            },
            {
              eyebrow: "task",
              title: "Task readiness",
              body: "Is the observable goal stated, and do the acceptance checks run here? Are excluded files and systems named? Who reviews diff and logs before merge?",
            },
          ],
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions at the end of the lesson." }],
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
        note: "The committed file removes the network dependency and puts the input under version control. If freshness matters, add a separate controlled update step.",
      },
    },
    {
      kind: "terminal-replay",
      placement: "end",
      courseSlug: "codex",
      props: {
        idleHint: '# press "Run replay" to watch this session play out',
        runLabel: "▶ Run replay",
        resetLabel: "↺ Reset",
        speedLabel: "speed",
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
          "A cloud task must run end-to-end tests against a staging API. What must be in place first?",
        options: [
          "Nothing; naming the staging API in the task grants access.",
          "Agent-phase network access to the host, scoped credentials and authorization for the test.",
          "The cloud task automatically uses the developer's local network.",
          "A passing local unit test proves the staging check ran.",
        ],
        correct: 1,
        explanation:
          "Agent-phase network access is off by default and set per environment, and external checks need authorization and scoped credentials. Without them, the coding task uses fixtures and staging verification stays separate.",
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
          "Local runs under sandbox and approvals; cloud in a dedicated container with its own setup and network policy.",
          "Local sessions always have unrestricted network access.",
          "Cloud tasks automatically deploy an accepted diff.",
        ],
        correct: 1,
        explanation:
          "Local work runs in the selected working tree under its sandbox and approval settings; cloud work runs in a dedicated container built from a chosen revision. Both results still need human review.",
      },
    },
  ],
};

export default lesson;
