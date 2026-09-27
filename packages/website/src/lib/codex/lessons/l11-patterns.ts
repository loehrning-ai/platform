// Ported from codex/lessons/11-patterns.html + codex/js/lessons/L11.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L11",
  number: 11,
  title: "Reusable task patterns",
  subtitle:
    "Reviewed tests, repository exploration, bounded transformations and reproducible debugging reduce ambiguity.",
  durationMinutes: 13,
  trackId: "advanced",
  hook: "Choose a task shape that exposes evidence.",
  keyConcepts: [
    "Tests-first",
    "Brownfield exploration",
    "Bounded refactoring",
    "Reproducible debugging",
    "Restart criteria",
  ],
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
            "A task's shape decides what you can inspect afterwards. These patterns make requirements, repository evidence and verification boundaries visible; each still needs a suitable environment and a human reading the diff. When a result is wrong, check request, repository context, environment, diff and checks one at a time.",
        },
      ],
    },
    {
      id: "s2",
      title: "Pattern 01: TDD with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "When the requirement fits in tests, write them before implementation. A reviewed failing test is an executable example and shows that the test detects the missing behavior; passing it later is evidence for that behavior only, not for untested security, performance or integration needs.\n\n1. *Test design:* tests without production changes. Review assertions, fixtures, boundaries and failure reason.\n2. *Implementation:* the bounded change, plus the reviewed tests and relevant regression checks.\n\nBoth can come from one task if the scope is clear. Review them separately anyway, because generated tests can share the code's misunderstanding.",
        },
        {
          kind: "callout",
          title: "Name the boundary a test covers.",
          body: "A test that mocks a collaborator can cover mapping or error handling but leaves the collaborator itself untested. Add a test through the real boundary when that behavior is required.",
        },
      ],
    },
    {
      id: "s3",
      title: "Pattern 02: Brownfield onboarding",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Start unfamiliar repository work read-only, with file paths, call paths, existing utilities, configuration and tests as evidence. Answer before edits:\n\n- Which code and external systems does the behavior depend on?\n- Which existing utility already covers part of it?\n- Which repository instructions and conventions apply?\n- Which tests exercise the current behavior?\n- Which security and operational boundaries can the change affect?\n\nReview the exploration before granting wider write or network access. Editing from an incomplete model duplicates infrastructure, bypasses conventions and breaks callers. If claims lack support, ask for repository evidence instead of an architecture summary. Read the final diff either way.",
        },
      ],
    },
    {
      id: "s4",
      title: "Pattern 03: Refactoring with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Define a behavior-preserving transformation. Specify:\n\n- old and new pattern, with code examples;\n- an authoritative repository example, if one exists;\n- included files and exclusions;\n- public interfaces and behavior that must stay unchanged;\n- regression checks for callers, generated output, types and migrations where relevant.\n\n**Risk:** \"clean up the codebase\" hands over architecture and naming decisions nobody specified. A bounded transformation is easier to review, but repeating it across the codebase also spreads any flaw in the target pattern.",
        },
      ],
    },
    {
      id: "s5",
      title: "Pattern 04: Debugging with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Give symptom, environment, exact error output, reproduction steps and known exclusions, and ask for a hypothesis tied to a file and call path before you authorize a fix. Useful inputs:\n\n- exact error text and stack trace, secrets removed;\n- a minimal reproduction or failing test;\n- relevant versions, configuration and runtime conditions;\n- hypotheses already ruled out, with evidence.\n\nWhere possible, first add a regression test that fails for the reported defect and confirm why. Without a reproducible symptom, a plausible diff changes adjacent behavior and never establishes the cause.",
        },
      ],
    },
    {
      id: "s6",
      title: "Pattern 05: Restart criteria",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Restart from a corrected specification when revision keeps a false premise or grows the diff. Signals: the same requirement is reimplemented without addressing review evidence, comments redefine goal or architecture, the diff spreads into unrelated files, accepted behavior keeps disappearing, or the session holds conflicting instructions.\n\nCarry over verified findings, rejected approaches with reasons and relevant command output.",
        },
      ],
    },
    {
      id: "s7",
      title: "Three high-risk task shapes",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "fail 01",
              title: "The wishlist task",
              body: "\"Improve the codebase\" names no target or evidence. Replace it with a measured problem, bounded scope and acceptance checks.",
            },
            {
              eyebrow: "fail 02",
              title: "The no-test task",
              body: "A behavior change without an executable check is hard to verify. Without automated tests, define another reproducible check and note the risk.",
            },
            {
              eyebrow: "fail 03",
              title: "The grand refactor",
              body: "\"Refactor the entire architecture\" mixes design, migration, implementation and rollout. Split out target architecture, compatibility steps and bounded transformations.",
            },
          ],
        },
      ],
    },
    {
      id: "s8",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "Questions at the end of the lesson.",
        },
      ],
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
        bad: "Task: \"Add rate limiting to the API.\"\n\nThe request names no existing middleware, error contract, configuration owner, keying rules or verification. The diff adds a second limiter and a separate configuration path.\n\nReview result: scope and architecture are unsupported.",
        good: "Task: \"Before editing, cite the files that define existing rate limiting, API error responses, configuration, and tests. Trace the relevant call path and propose a bounded change. Do not write until the evidence is reviewed.\"\n\nThe exploration finds the existing throttle decorator, error formatter, configuration owner and current tests, which the implementation task can now name.",
        note: "Read-only exploration shows assumptions before they reach a diff. Still check every cited file and call path; the summary can be incomplete.",
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
          "Tests and implementation were generated in one task and the tests pass. What review risk requires attention?",
        options: [
          "The implementation must be wrong because the work was combined.",
          "The tests may share the implementation's misunderstanding.",
          "Nothing, green tests mean the feature is correct.",
          "The test runner must have used the wrong language.",
        ],
        correct: 1,
        explanation:
          "Generated tests are not independent evidence by default. Check how assertions, fixtures and mocks map to the requirement and that the tests fail without the behavior. A separate tests-first phase helps and is optional.",
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
          "A revised diff keeps expanding and review comments now redefine the original goal. What is the right move?",
        options: [
          "Continue commenting without changing the task contract.",
          "Stop, keep verified findings, restart from a corrected specification.",
          "Accept the PR; you have spent enough time on it.",
          "Switch to a different AI tool.",
        ],
        correct: 1,
        explanation:
          "Comments that change the premise and a diverging diff mean local revision no longer fits. Restart from one consistent contract; convergence decides, whatever the retry count.",
      },
    },
  ],
};

export default lesson;
