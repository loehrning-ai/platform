// Ported from codex/lessons/06-acceptance.html + codex/js/lessons/L06.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_TASK_SPEC_TIER_LABELS,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L06",
  number: 6,
  title: "Acceptance Criteria",
  subtitle:
    "Define observable behavior, executable checks, and review evidence before implementation begins.",
  durationMinutes: 10,
  trackId: "task-craft",
  hook: "Define the evidence required for acceptance.",
  keyConcepts: [
    "Acceptance criteria",
    "Tests-first",
    "Test overfitting",
    "Negative constraints",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "A stopping condition",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "How will you know it is done? Answer before implementation, with observable examples, commands, tests, structural constraints. Cannot name a single relevant check? Then the behavior is still ambiguous or the verification path is missing.\n\nAcceptance criteria steer implementation and review. Codex runs the available checks and revises from their output. Green is not self-validating. Someone still has to confirm that the checks cover the requirement, ran in the intended environment, and were not weakened to earn the pass.",
        },
        {
          kind: "pull-quote",
          text: "Acceptance criteria define required evidence. They do not transfer the acceptance decision to the tool that produced the change.",
        },
      ],
    },
    {
      id: "s2",
      title: "The three flavors",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "01 · executable",
              title: "Tests that must pass",
              body: '"pytest tests/api/test_users.py::test_pagination must pass." This is directly executable and produces an unambiguous pass/fail result.',
            },
            {
              eyebrow: "02 · observable",
              title: "Commands with known outputs",
              body: '"curl /health returns {"ok": true} with status 200." Not a test file, but a verifiable signal the agent can check.',
            },
            {
              eyebrow: "03 · structural",
              title: "Shape of the patch",
              body: '"New files live in src/auth/. No changes outside that directory." The final diff can be compared with this boundary by both Codex and the reviewer.',
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Tests-first workflow",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            'Tests make acceptance criteria executable. Three patterns worth knowing.\n\n**Write the tests yourself.** Commit failing tests that describe the required behavior, then ask Codex to make that file pass without weakening the assertions.\n\n**Separate test design from implementation.** Task A: "Given these requirements, write failing tests in tests/api/test_users.py. Do not implement." Review whether the tests capture the intent. Task B: "Make the reviewed tests pass."\n\n**Request both in one change.** Ask Codex to write tests for the new behavior, compare them with the goal, then implement. Review the tests apart from the production code. Generated tests can encode the same misunderstanding as the implementation.',
        },
        {
          kind: "callout",
          title: "What tests contribute:",
          body: "Tests make selected examples executable and repeatable. They pin inputs, outputs and edge cases. They cover nothing their assertions and environment do not exercise. Review test design separately from implementation.",
        },
      ],
    },
    {
      id: "s4",
      title: "Accept or reject?",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The checks pass. Now verify that the criteria represent the intended behavior. A green suite lives happily alongside an incomplete requirement, an invalid test double or an untested integration path. Four failure shapes to review before merge.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "pattern 01",
              title: "Test overfitting",
              body: "The implementation satisfies the named examples but not the general rule. Add representative boundaries and inspect whether production code special-cases fixture values or test-only paths.",
            },
            {
              eyebrow: "pattern 02",
              title: "Adjacent problem solving",
              body: "The checks are executable but omit a required interface or constraint. Compare passing output with the original user and system behavior, not only with the new assertions.",
            },
            {
              eyebrow: "pattern 03",
              title: "Hidden regression",
              body: "New and existing tests pass, but an uncovered behavior changed. Inspect deletions and call sites, then use integration, end-to-end, or manual checks appropriate to the affected risk.",
            },
            {
              eyebrow: "pattern 04",
              title: "Plausible but wrong library usage",
              body: "A library call can be valid in isolation but incompatible with repository configuration, concurrency, lifecycle, or deployment assumptions. Verify the integration contract and current library documentation.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "When a foreseeable wrong implementation could still pass the positive examples, add a *negative constraint*. It names a real performance, security, compatibility or scope boundary. It does not dictate an arbitrary internal detail. Example:\n\n```\n# incomplete: only names a command\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n\n# explicit evidence and boundaries\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n- pytest tests/api passes; attach the command result\n- Query-count evidence shows pagination does not fetch every row\n- Changes outside api/users.py and its tests require prior explanation\n```",
        },
        {
          kind: "callout",
          title: "The evaluation heuristic:",
          body: "Ask which incorrect implementations could still pass these checks. Add the highest-risk missing example or constraint. Keep human review for the behavior the automated checks do not cover.",
        },
      ],
    },
    {
      id: "s5",
      title: "Build one",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Judge each criterion on executability, relevance and coverage. Keep the ones that give real evidence for this rate-limit change.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Two questions on acceptance criteria." },
      ],
    },
  ]),
  widgets: [
    {
      kind: "task-spec",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        lessonId: "L06",
        cpId: "spec-1",
        threshold: 3,
        title: "Build acceptance evidence for a rate-limit feature",
        desc: "Each row is a potential acceptance criterion. Toggle on the ones that are actually useful.",
        goal: "Limit /login to 5 attempts per IP per minute.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        items: [
          {
            section: "Executable: test_login_rate_limit.py passes",
            hint: "Real test. Covers the limit boundary and reset window.",
            body: [
              "tests/api/test_login.py::test_rate_limit_blocks_at_6",
              "tests/api/test_login.py::test_rate_limit_resets_after_60s",
            ],
          },
          {
            section: "Executable: full suite still passes",
            hint: "Regression evidence. Inspect the command result and any skipped tests.",
            body: [
              "make test   # attach the result; review failures and skips",
            ],
          },
          {
            section: "Observable: manual curl returns 429",
            hint: "A direct behavior check when run against an isolated test instance.",
            body: ["$ for i in 1..6; do curl /login; done → last one is 429"],
          },
          {
            section: "Structural: new code lives in api/limits/",
            hint: "Defines the expected file boundary of the patch.",
            body: ["Only api/auth.py and new files in api/limits/ change."],
          },
          {
            section: '"It should feel right."',
            hint: "Not checkable. Drop it.",
            body: ["Unverifiable acceptance."],
          },
          {
            section: "Document the limit in API docs",
            hint: "Reasonable, but belongs in a separate task.",
            body: ["docs/api/auth.md updated."],
          },
        ],
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L06",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'Why is "make test passes" more useful than "the code should work" as one acceptance criterion?',
        options: [
          '"Make test" is shorter, so the agent reads it faster.',
          '"Make test" names an executable check with inspectable output. "Should work" defines neither behavior nor evidence.',
          "There is no meaningful difference.",
          '"Should work" implies higher quality.',
        ],
        correct: 1,
        explanation:
          "An executable command produces repeatable evidence and can guide revision. The reviewer must still confirm that the command ran successfully and that its tests cover the requested behavior.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L06",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'For a difficult new feature, you are not sure how to define "done." Which step makes the acceptance boundary testable first?',
        options: [
          "Ship the task with vague criteria and iterate.",
          'Spec a preliminary task: "write failing tests that capture the requirements, don\'t implement." Review the tests. Then spec the real task: "make those tests pass."',
          "Skip acceptance criteria entirely.",
          "Write a long prose description and hope.",
        ],
        correct: 1,
        explanation:
          "Separate test design from implementation when the behavior needs clarification. Review the proposed tests against the requirement and confirm they fail for the intended reason before authorizing implementation. Passing those tests later remains one part of the final review.",
      },
    },
  ],
};

export default lesson;
