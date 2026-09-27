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
  title: "Acceptance criteria",
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
            "Answer \"how will you know it is done?\" before implementation, with observable examples, commands, tests or structural constraints. If you cannot name one relevant check, the behavior is still ambiguous or the verification path is missing.\n\nCodex runs the available checks and revises from their output. A green run still needs someone to confirm that the checks cover the requirement, ran in the intended environment and were not weakened to pass.",
        },
      ],
    },
    {
      id: "s2",
      title: "Three kinds of criteria",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "01 · executable",
              title: "Tests that must pass",
              body: "\"pytest tests/api/test_users.py::test_pagination must pass.\" Runs directly and gives a clear pass or fail.",
            },
            {
              eyebrow: "02 · observable",
              title: "Commands with known outputs",
              body: "\"curl /health returns {\"ok\": true} with status 200.\" A signal the agent can verify without a test file.",
            },
            {
              eyebrow: "03 · structural",
              title: "Shape of the patch",
              body: "\"New files live in src/auth/. No changes outside that directory.\" Codex and the reviewer can compare the final diff with this boundary.",
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
            "Three patterns:\n\n**Write the tests yourself.** Commit failing tests that describe the required behavior, then ask Codex to make them pass without weakening the assertions.\n\n**Separate test design from implementation.** Task A: \"Given these requirements, write failing tests in tests/api/test_users.py. Do not implement.\" Review whether the tests capture the intent. Task B: \"Make the reviewed tests pass.\"\n\n**Request both in one change.** Codex writes tests for the new behavior, compares them with the goal, then implements. Review the tests on their own, because generated tests can encode the same misunderstanding as the implementation.",
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
            "A green suite can still hide an incomplete requirement, an invalid test double or an untested integration path. Check four failure shapes before merge.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "pattern 01",
              title: "Test overfitting",
              body: "The code satisfies the named examples but misses the general rule. Add representative boundaries and look for special cases for fixture values or test-only paths.",
            },
            {
              eyebrow: "pattern 02",
              title: "Adjacent problem solving",
              body: "The checks run but omit a required interface or constraint. Compare the output with the original user and system behavior as well as the new assertions.",
            },
            {
              eyebrow: "pattern 03",
              title: "Hidden regression",
              body: "All tests pass, but an uncovered behavior changed. Inspect deletions and call sites, then run integration, end-to-end or manual checks that fit the risk.",
            },
            {
              eyebrow: "pattern 04",
              title: "Plausible but wrong library usage",
              body: "A library call that is valid in isolation can clash with the repository's configuration, concurrency, lifecycle or deployment. Check the integration contract and current library docs.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "Ask which wrong implementation could still pass. If a foreseeable one passes the positive examples, add a *negative constraint*: a real performance, security, compatibility or scope boundary that leaves internal details open. Example:\n\n```\n# incomplete: only names a command\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n\n# explicit evidence and boundaries\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n- pytest tests/api passes; attach the command result\n- Query-count evidence shows pagination does not fetch every row\n- Changes outside api/users.py and its tests require prior explanation\n```",
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
            "In the exercise above, keep only criteria that give real evidence for this rate-limit change.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Two questions at the end of the lesson." },
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
        desc: "Each row is a possible acceptance criterion. Switch on the useful ones.",
        goal: "Limit /login to 5 attempts per IP per minute.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        fileName: "task.md",
        goalHeading: "Goal",
        signalsLabel: "signals",
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
          "\"Make test\" is a runnable check with output; \"should work\" names no evidence.",
          "There is no meaningful difference.",
          '"Should work" implies higher quality.',
        ],
        correct: 1,
        explanation:
          "An executable command gives repeatable evidence and guides revision. The reviewer still confirms that it ran successfully and that its tests cover the requested behavior.",
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
          "You are unsure how to define \"done\" for a difficult new feature. Which step makes the acceptance boundary testable first?",
        options: [
          "Ship the task with vague criteria and iterate.",
          "A first task that only writes failing tests for the requirements; review them, then \"make them pass\".",
          "Skip acceptance criteria entirely.",
          "Write a long prose description and hope.",
        ],
        correct: 1,
        explanation:
          "Separate test design from implementation. Check the proposed tests against the requirement and confirm they fail for the intended reason before implementation starts. Passing them later is only part of the final review.",
      },
    },
  ],
};

export default lesson;
