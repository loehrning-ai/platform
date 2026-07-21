// Ported from codex/lessons/02-sandbox.html + codex/js/lessons/L02.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_COMPARE_KIND_LABEL } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L02",
  number: 2,
  title: "The Sandbox Contract",
  subtitle:
    "Ephemeral filesystem, no network by default, a patch at the end. Every safety rail shapes how you prompt.",
  durationMinutes: 9,
  trackId: "fundamentals",
  hook: "The walls you forgot you built.",
  keyConcepts: ["Ephemeral sandbox", "Network allow-list", "Branching strategy", "Pre-flight checklist"],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "The four properties",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Codex doesn't run on your laptop. It doesn't run in production. It runs in a **sandbox**, an isolated virtual environment, freshly spun up for each task, destroyed when the task finishes. Knowing the shape of that box is not an implementation detail. It's the thing that determines what tasks will work.\n\nThe sandbox contract has four properties worth memorizing:\n\n- **Ephemeral.** The filesystem exists only for the duration of the run. Nothing the agent writes survives unless it makes it into the output patch.\n- **Isolated.** No access to your other repos, no access to your secrets, no access to production. A fresh universe each time.\n- **Offline by default.** No network. No `pip install` from PyPI mid-run, no API calls to external services, no `curl` to a webhook. You grant network access explicitly, per-task.\n- **Transparent.** Every command the agent runs, every file it touches, every test output, all logged. The PR isn't a black box; you can see exactly what happened.",
        },
        {
          kind: "pull-quote",
          text: "The sandbox is a safety rail. It's also a design constraint. Every task you write is implicitly scoped by what the box can do.",
        },
      ],
    },
    {
      id: "s2",
      title: "How it shapes prompts",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three practical consequences. Each of these is a tripwire that new users hit at least once.\n\n**Dependencies must be pre-installed.** If your project needs `postgres`, `redis`, a headless Chrome, or a weird system library, the sandbox needs them baked in. Codex can't just go install things on the fly (unless you've granted network + a setup script). Your task will fail at the \"run the tests\" step and the agent will flail trying to work around it.\n\n**External APIs are off-limits by default.** Asking Codex to \"fetch the latest OpenAPI spec from our docs site\" will fail, the sandbox can't reach the internet. Workaround: paste the spec into the task, or commit it into the repo.\n\n**The agent can't test against prod.** \"Run this against our staging database\" isn't happening. If the task requires real external state, either stub it (give the agent a fixture) or break the task down so the external part is your job.",
        },
      ],
    },
    {
      id: "s3",
      title: "What's in the box",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Before you give the agent a task, it's worth having a rough inventory of the sandbox's contents. When you configure a Codex environment, you typically provide:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "provided by you",
              title: "Setup script",
              body: "Bash that runs once to install your language runtime, dependencies, dev tools, and fixtures. Think of it as Dockerfile-lite. Runs before Codex ever sees your code.",
            },
            {
              eyebrow: "provided by you",
              title: "Environment variables",
              body: "Fake API keys, test DB URLs, feature flags. Anything the agent needs to run your test suite without hitting real services.",
            },
            {
              eyebrow: "provided by you",
              title: "Network allow-list",
              body: "Domains Codex may reach (npm, PyPI, a specific internal registry). Empty by default. Opt-in, per domain.",
            },
            {
              eyebrow: "provided by Codex",
              title: "The runtime",
              body: "A Linux container with common languages, compilers, git, and shell tools. Your setup script layers on top.",
            },
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "Live replay",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            'You ask the agent to "call our stripe test endpoint and check subscription status." Watch it hit the wall, gracefully, in this case, because its training says "if the network\'s off, say so."',
        },
      ],
    },
    {
      id: "s5",
      title: "Branching strategy",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Because each agent run produces a diff or PR on its own branch, your branching strategy matters more than it did before. A few patterns that work well:\n\n- **One branch per task.** Never give two concurrent agent runs the same base branch. They'll conflict. Let each run own its branch, then review and merge sequentially.\n- **Short-lived branches.** Agent PRs should be small enough to review and merge in under 30 minutes. If the PR is 500+ lines, the task was too broad. Reject it, re-scope, re-run.\n- **Keep main green.** The agent runs tests inside its sandbox, but your main branch CI is the final gate. Never merge an agent PR that CI hasn't signed off on, hallucinated test results do occur.\n- **Branch from the latest commit.** Stale base branches cause the agent to produce changes that conflict with work your team already merged. Pull before you kick off a run.",
        },
        {
          kind: "callout",
          title: "Evaluating agent output.",
          body: 'When a PR arrives, the review question isn\'t "does this look reasonable?", it\'s "do the tests pass, does the diff match the spec, and does nothing outside the stated scope change?" Start with the diff stat. If +0 tests, ask why. If files outside the spec changed, read them carefully or ask for a re-run scoped tighter.',
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
            "Before you send a task to an agent, run through this checklist. These are the most common reasons a run fails silently.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "sandbox readiness",
              title: "Sandbox readiness",
              body: "Does make test (or equivalent) pass locally right now? Are all dependencies committed or baked into the setup script? Do any tests hit external services? Are fake secrets / test env vars documented in AGENTS.md?",
            },
            {
              eyebrow: "task readiness",
              title: "Task readiness",
              body: "Is the goal one sentence and unambiguous? Are the acceptance criteria checkable by the agent (runnable as tests)? Is the scope narrow enough for a single PR? Is there an explicit \"don't touch X\" list for anything adjacent?",
            },
          ],
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on the sandbox contract." }],
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
        note: "Same goal. Version on the left fails the moment the sandbox tries to fetch. Version on the right is deterministic, repeatable, and works offline.",
      },
    },
    {
      kind: "terminal-replay",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L02",
        cpId: "term-1",
        title: "Session replay: the network wall",
        windowTitle: "codex@sandbox · task-8d11",
        frames: [
          { segments: [{ text: "codex> planning…", tone: "prompt" }], delayMs: 500 },
          {
            segments: [{ text: "  plan: 1) hit stripe test api  2) parse response  3) update doc", tone: "comment" }],
            delayMs: 700,
          },
          {
            segments: [{ text: "$ curl -s https://api.stripe.com/v1/subscriptions", tone: "prompt" }],
            delayMs: 500,
          },
          {
            segments: [{ text: "→ curl: (6) Could not resolve host: api.stripe.com", tone: "error" }],
            delayMs: 700,
          },
          {
            segments: [{ text: "codex> network appears blocked. checking AGENTS.md for fixtures…", tone: "prompt" }],
            delayMs: 700,
          },
          { segments: [{ text: "$ ls tests/fixtures/", tone: "prompt" }], delayMs: 400 },
          {
            segments: [
              { text: "→ stripe_subscription_active.json · stripe_subscription_canceled.json", tone: "comment" },
            ],
            delayMs: 600,
          },
          {
            segments: [{ text: "codex> using fixtures instead. proceeding…", tone: "prompt" }],
            delayMs: 600,
          },
          { segments: [{ text: "→ plan adapted: sandbox-compatible", tone: "output" }], delayMs: 500 },
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
          'Your task is "run our e2e tests and fix any failing ones." The e2e suite hits a live staging API. What happens?',
        options: [
          "Codex runs the tests and fixes them normally.",
          "Codex hits the network wall, can't reach staging, and either fails or hallucinates results.",
          "Codex is smart enough to proxy through your laptop.",
          "The tests run faster because the sandbox is closer to staging.",
        ],
        correct: 1,
        explanation:
          "Default sandbox = no network. You either (a) point tests at fixtures for the Codex run, (b) grant network access + the staging domain in the allow-list, or (c) break the task into two, Codex identifies the bug, you run the e2e verification locally.",
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
          'Which of these is a design choice that follows directly from "the sandbox is ephemeral"?',
        options: [
          "Codex works faster than a human because it doesn't get tired.",
          "The only durable artifact of a run is the patch. Files the agent writes but doesn't include in the patch are lost.",
          "Your git history gets rewritten each run.",
          "The sandbox automatically deploys to production on success.",
        ],
        correct: 1,
        explanation:
          'Ephemeral means "only the diff survives." Great for safety, a botched run leaves no trace. Mildly annoying when you want the agent to explore before patching. Pattern for that: ask it to do the exploration and put the notes into a file like docs/exploration.md, then include that file in the patch.',
      },
    },
  ],
};

export default lesson;
