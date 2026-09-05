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
  title: "Reusable Task Patterns",
  subtitle:
    "Use reviewed tests, repository exploration, bounded transformations, and reproducible debugging to reduce ambiguity.",
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
            "The shape of a task decides what you can inspect afterwards. The patterns here make requirements, repository evidence and verification boundaries explicit. None of them guarantees success. Each still needs a suitable environment and a human reading the diff.\n\nUse the catalog to decide which evidence should exist before edits begin, which transformations can be bounded mechanically, and when an attempt should be restarted from a corrected specification.",
        },
        {
          kind: "pull-quote",
          text: "Diagnose the request, repository context, environment, diff and checks separately. Any one of them can invalidate the result.",
        },
      ],
    },
    {
      id: "s2",
      title: "Pattern 01, TDD with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**Pattern:** define behavior in tests before implementation when the requirement can be expressed that way.\n\n**Value:** a reviewed failing test gives you an executable example and proves the test detects the missing behavior. Passing it later is evidence. It is not proof about untested security, performance or integration requirements.\n\n**Two-phase form:**\n\n1. *Test design:* request tests without production changes. Review their assertions, fixtures, boundaries, and failure reason.\n2. *Implementation:* request the bounded change and require the reviewed tests plus relevant regression checks.\n\nTests and implementation can share one task when the scope is clear. Review them independently anyway. The risk is circular evidence, where generated tests encode the same misunderstanding as generated code.",
        },
        {
          kind: "callout",
          title: "Name the boundary a test covers:",
          body: "A test that mocks a collaborator may validly cover mapping or error handling, but it does not cover the collaborator's behavior. Add a test through the real boundary when that behavior is part of the requirement.",
        },
      ],
    },
    {
      id: "s3",
      title: "Pattern 02, Brownfield onboarding",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**Pattern:** begin an unfamiliar repository task with read-only exploration. Require file paths, call paths, existing utilities, configuration, and relevant tests as evidence.\n\n**Questions to answer before edits:**\n\n- Which code and external systems does the behavior depend on?\n- Which existing utility or abstraction already covers part of it?\n- Which repository instructions and conventions apply?\n- Which tests exercise the current behavior?\n- Which security and operational boundaries can the change affect?\n\nReview the exploration before granting a broader write or network boundary. If important claims are unsupported, request direct repository evidence rather than an architectural summary.\n\n**Risk:** editing from an incomplete model duplicates infrastructure, bypasses conventions and breaks callers. Exploration lowers that risk. It never removes the need to read the final diff.",
        },
      ],
    },
    {
      id: "s4",
      title: "Pattern 03, Refactoring with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            '**Pattern:** define a behavior-preserving transformation with an old example, an accepted new example, an explicit file set, and regression checks.\n\n**Specification fields:**\n\n- Name the old and new pattern with code examples.\n- Cite an existing repository example when it is authoritative.\n- Define included files and explicit exclusions.\n- State which public interfaces and behavior must remain unchanged.\n- Name checks for callers, generated output, types, and migrations where relevant.\n\n**Risk:** an open request such as "clean up the codebase" hands over architectural and naming decisions nobody specified. A bounded mechanical transformation reviews more easily, and broad repetition still propagates a flawed target pattern.',
        },
      ],
    },
    {
      id: "s5",
      title: "Pattern 04, Debugging with AI",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**Pattern:** provide the observed symptom, environment, exact error output, reproduction steps, and known exclusions. Ask for a hypothesis tied to a file and call path before authorizing a fix.\n\n**Useful inputs:**\n\n- exact error text and stack trace with secrets removed;\n- minimal reproduction or a failing test;\n- relevant versions, configuration, and runtime conditions;\n- prior hypotheses already ruled out and the evidence for doing so.\n\nWhen appropriate, add a regression test that fails for the reported defect before changing production code. Confirm its failure reason, then review the fix and broader checks.\n\n**Risk:** with no reproducible symptom, a plausible diff changes adjacent behavior and never establishes the cause.",
        },
      ],
    },
    {
      id: "s6",
      title: "Pattern 05, Restart criteria",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**Pattern:** restart from a corrected specification when revision is preserving a false premise or expanding the diff.\n\n**Signals:**\n\n- the same requirement is implemented differently without addressing the review evidence;\n- review comments are redefining the goal or architecture rather than correcting a local defect;\n- the diff grows across unrelated files or concerns;\n- accepted behavior is repeatedly removed; or\n- the current session contains conflicting instructions.\n\nBefore restarting, keep the verified repository findings, the rejected approaches with reasons, the relevant command output. Leave the speculation and the transcript behind. A fixed revision count is not a threshold. Convergence and task validity are.",
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
              body: '"Improve the codebase" and "make it faster" define neither target behavior nor evidence. Replace them with a measured problem, bounded scope, and acceptance checks.',
            },
            {
              eyebrow: "fail 02",
              title: "The no-test task",
              body: "A behavior change with no executable check leaves the reported result difficult to verify. If automated tests are infeasible, define another reproducible validation path and document the remaining risk.",
            },
            {
              eyebrow: "fail 03",
              title: "The grand refactor",
              body: '"Refactor the entire architecture" combines design, migration, implementation, and rollout decisions. Separate the accepted target architecture, compatibility steps, and bounded transformations.',
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
          markdown: "Two questions on usable and high-risk task patterns.",
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
        bad: 'Task: "Add rate limiting to the API."\n\nThe request does not identify existing middleware, the error contract, configuration ownership, keying rules, or verification. A resulting diff introduces a second limiter and a separate configuration path.\n\nReview result: scope and architecture are unsupported.',
        good: 'Task: "Before editing, cite the files that define existing rate limiting, API error responses, configuration, and tests. Trace the relevant call path and propose a bounded change. Do not write until the evidence is reviewed."\n\nThe exploration identifies the existing throttle decorator, error formatter, configuration owner, and current tests. The implementation task can now reference those artifacts explicitly.',
        note: "Read-only exploration makes assumptions visible before they enter a diff. Review every cited file and call path; an exploration summary can still be incomplete.",
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
          "The tests may encode the same misunderstanding as the implementation; review their assertions and confirm they fail when the required behavior is absent.",
          "Nothing, green tests mean the feature is correct.",
          "The test runner must have used the wrong language.",
        ],
        correct: 1,
        explanation:
          "Generated tests are not independent evidence by default. Review the requirement-to-assertion mapping, fixtures, mocks, and failure behavior. A separate tests-first phase can make that review easier but is not mandatory for every task.",
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
          "Stop the current iteration, preserve verified findings, and start from a corrected specification and scope.",
          "Accept the PR as-is since you have spent enough time on it.",
          "Switch to a different AI tool.",
        ],
        correct: 1,
        explanation:
          "When comments are changing the premise and the diff is diverging, local revision is no longer the right operation. Restart from one internally consistent contract. Use convergence, not a fixed retry count, as the decision signal.",
      },
    },
  ],
};

export default lesson;
