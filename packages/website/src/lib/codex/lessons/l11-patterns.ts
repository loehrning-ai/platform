// Ported from codex/lessons/11-patterns.html + codex/js/lessons/L11.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_COMPARE_KIND_LABEL } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L11",
  number: 11,
  title: "Patterns That Work",
  subtitle:
    "TDD with AI, brownfield onboarding, refactoring, debugging, the task shapes that consistently succeed, and three that reliably fail.",
  durationMinutes: 13,
  trackId: "advanced",
  hook: "A library of proven shapes.",
  keyConcepts: ["TDD with AI", "Brownfield onboarding", "Refactoring", "Debugging", "Two-revision rule"],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "The library",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Some tasks run smoothly with an AI agent every time. Others fail reliably, not because of a bad prompt, but because the task shape is wrong for the tool. Over time, the patterns become clear.\n\nThis lesson is a catalog of the recurring patterns: what works, why it works, and what the failure mode looks like when you get it wrong. Use it as a reference when you are planning a new task and something feels off.",
        },
        {
          kind: "pull-quote",
          text: "The failure is almost never the AI. It is the task shape.",
        },
      ],
    },
    {
      id: "s2",
      title: "Pattern 01 — TDD with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**The idea:** write tests first (or have the agent write them first), then implement. The test suite becomes the acceptance criterion, and the agent can iterate autonomously until all tests pass.\n\n**Why it works:** the agent has a concrete, unambiguous signal for \"done.\" Without tests, it is guessing. With tests, it can iterate, run, fail, patch, run again, without any human in the loop. The result is a PR with verified behavior, not just plausible code.\n\n**The two-phase approach:**\n\n1. *Phase 1 — tests only:* \"Write the test suite for this feature. Do not implement the feature yet. Tests should fail.\" Review the tests; they are your acceptance criteria made concrete.\n2. *Phase 2 — implementation:* \"Implement the feature until all tests from phase 1 pass.\" The agent now has an objective to optimize against.\n\n**The failure mode:** asking for tests and implementation in a single task. The agent writes the implementation first and then writes tests that pass against what it just built, which proves nothing. The tests are circular. Always split the phases.",
        },
        {
          kind: "callout",
          title: "Watch for the circular test:",
          body: "if a test mocks the very function it is testing and then asserts what the mock returned, it is not a test, it is theater. A good test exercises real behavior: seed data, call the real function, assert real output.",
        },
      ],
    },
    {
      id: "s3",
      title: "Pattern 02 — Brownfield onboarding",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            '**The idea:** before making any changes to an existing codebase, give the agent an exploration phase. Explicitly tell it: "do not write any code yet. Read the relevant files and tell me what you find."\n\n**Why it works:** AI agents are optimistic, given any task, they will make assumptions to fill gaps and start writing. On a greenfield project that is fine. On an existing codebase, those assumptions are often wrong: they will duplicate existing utilities, miss caching layers, violate naming conventions, and break callers. A mandatory exploration phase forces the agent to build a mental model before touching anything.\n\n**The exploration checklist before any brownfield task:**\n\n- What existing code does this feature touch or depend on?\n- Are there existing utilities, helpers, or abstractions that already solve part of the problem?\n- What conventions does the existing code follow (naming, error handling, test patterns)?\n- What tests currently cover the area being changed?\n\nOnly after the agent can answer these questions should it start writing code.\n\n**The failure mode:** skipping exploration and treating a large existing codebase like a greenfield. The agent rewrites existing functionality, ignores established patterns, and produces a PR that looks right in isolation but breaks things a human reviewer has to catch.',
        },
      ],
    },
    {
      id: "s4",
      title: "Pattern 03 — Refactoring with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            '**The idea:** use the agent to apply a refactoring pattern consistently across a codebase, extracting a utility, renaming, converting to a new pattern, updating all call sites.\n\n**Why it works:** agents excel at mechanical consistency. Applying the same transformation to 40 files is tedious and error-prone for a human; it is straightforward for an agent. The spec is precise ("convert all X to Y"), the change is verifiable (tests still pass), and there is no ambiguity about what "done" looks like.\n\n**How to spec a refactoring task:**\n\n- Name the old pattern and the new pattern explicitly, with a code example of each.\n- Reference an existing example of the new pattern: "see src/models/project.py for the pattern to follow."\n- Specify scope: "apply to all files in src/repositories/." Do not say "refactor the codebase," that is a wish, not a task.\n- Specify what not to change: "do not touch legacy/ or any file that has a TODO: migrate comment."\n\n**The failure mode:** open-ended refactoring ("clean up the code"). The agent will make judgment calls about what "clean" means, often adding abstractions, renaming things by preference, or restructuring in ways you did not want. Narrow refactoring tasks with explicit patterns win every time.',
        },
      ],
    },
    {
      id: "s5",
      title: "Pattern 04 — Debugging with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**The idea:** give the agent the symptom, the reproduction case, and permission to read and run, then let it hypothesize and verify in the feedback loop.\n\n**Why it works:** agents are effective at the mechanical part of debugging: reading stack traces, searching for the relevant code path, writing a minimal reproduction, and testing a hypothesis. The bottleneck in human debugging is context-switching and search; agents do not get tired of reading files.\n\n**What to give the agent:**\n\n- The error message and full stack trace, verbatim.\n- The steps to reproduce (or a failing test if you have one).\n- What you have already ruled out (prevents the agent from retreading ground you have covered).\n- Permission to write a test that reproduces the bug before fixing it. This prevents regressions.\n\n**The failure mode:** asking the agent to \"fix the bug\" without a reproduction case. The agent will guess, often plausibly, and you will get a diff that looks like it might help. Sometimes it does. Often it fixes the symptom while leaving the root cause. Always reproduce first, fix second.",
        },
      ],
    },
    {
      id: "s6",
      title: "Pattern 05 — The two-revision rule",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**The idea:** if a PR is stuck, if you have sent two rounds of comments and the agent still has not landed the fix cleanly, stop commenting and re-spec from scratch.\n\n**Why it works:** when a PR needs more than two revision rounds, the problem is almost never the agent's execution. It is the spec. Something in the original task description was ambiguous, missing, or wrong, and the agent has been compensating by guessing. No amount of comment nudging will fix a fundamentally underspecified task.\n\nRe-speccing from scratch takes ten minutes and typically produces a clean PR on the first pass. Two more rounds of comments will take longer and may not get there at all.\n\n**Signals that it is time to restart:**\n\n- The agent keeps making the same mistake in different forms.\n- Your comments are getting longer and more detailed, you are essentially writing the implementation in the comments.\n- The PR diff is growing with each revision instead of converging.\n\nWhen you see these signals: close the PR, read the original spec, find what was underspecified, rewrite. The discipline to restart is what separates teams that scale with AI assistance from teams that fight it.",
        },
      ],
    },
    {
      id: "s7",
      title: "Three patterns that consistently fail",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "fail 01",
              title: "The wishlist task",
              body: '"Improve the codebase." "Make it more performant." "Clean things up." Zero actionable signal. The agent will make plausible-looking changes that may or may not be what you wanted. Specific tasks only.',
            },
            {
              eyebrow: "fail 02",
              title: "The no-test task",
              body: "Any non-trivial task without a test suite. The agent ships code it believes is correct. Without a feedback loop it has no way to verify, so it does not. The PR looks good. The bug shows up in production three weeks later.",
            },
            {
              eyebrow: "fail 03",
              title: "The grand refactor",
              body: '"Refactor the entire architecture." Large-scope, high-ambiguity tasks produce massive diffs that are impossible to review. The agent touches everything, tests break in complex ways, and you spend more time fixing than you saved.',
            },
          ],
        },
      ],
    },
    {
      id: "s8",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on the proven and failing patterns." }],
    },
  ]),
  widgets: [
    {
      kind: "compare",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: "Brownfield task: with vs. without exploration",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Skip exploration",
        goodLabel: "Explore first",
        bad:
          'Task: "Add rate limiting to the API."\n\nAgent starts writing immediately. Adds a new RateLimiter class. Does not notice there is already a throttle decorator in middleware/. Does not match the error-response format used by the rest of the API. Creates a new config key instead of extending the existing one.\n\nResult: duplicate infrastructure, inconsistent behavior, PR rejected.',
        good:
          'Task: "Before writing any code: read the relevant files and tell me (1) what rate limiting infrastructure already exists, (2) how errors are currently returned by the API, (3) where rate-limit config lives. Then propose an approach."\n\nAgent finds the throttle decorator, understands the error format, locates the config. Proposes extending what is already there.\n\nResult: minimal, consistent change. PR approved.',
        note: "The exploration step costs 2 minutes. Reviewing a PR built on wrong assumptions costs 30. Always spend the 2 minutes on brownfield tasks.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L11",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "You ask an agent to write tests for a new feature and implement it in a single task. The tests all pass. What is the likely problem?",
        options: [
          "The implementation is probably wrong.",
          "The tests probably do not verify real behavior — the agent likely wrote the implementation first and then wrote tests that pass against what it built, making them circular.",
          "Nothing — green tests mean the feature is correct.",
          "The tests are probably too slow.",
        ],
        correct: 1,
        explanation:
          "When tests and implementation are written together, agents almost always write the implementation first (or simultaneously) and then write tests to match. The tests pass, but they test the agent's own assumptions about what the code should do, not whether it does what you wanted. Split the phases: tests first (and verify they fail), then implementation.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L11",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "A PR has gone through three rounds of comments and the agent still has not landed the fix correctly. What is the right move?",
        options: [
          "Add more detail to the next comment and try a fourth round.",
          "Re-spec the task from scratch. Three revision rounds signals the original spec was underspecified — no amount of nudging will fix that. Rewrite, rerun.",
          "Accept the PR as-is since you have spent enough time on it.",
          "Switch to a different AI tool.",
        ],
        correct: 1,
        explanation:
          "Two revision rounds is the ceiling. If you are at three, the problem is the spec, not the agent. Re-speccing takes 10 minutes and almost always produces a clean PR on the first pass. Continuing to add comments compounds the original specification error.",
      },
    },
  ],
};

export default lesson;
