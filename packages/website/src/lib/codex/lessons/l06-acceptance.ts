// Ported from codex/lessons/06-acceptance.html + codex/js/lessons/L06.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_TASK_SPEC_TIER_LABELS } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L06",
  number: 6,
  title: "Acceptance Criteria",
  subtitle: "Ambiguous done = ambiguous PR. Write the tests before you write the task. Or have Codex write them first.",
  durationMinutes: 10,
  trackId: "task-craft",
  hook: "Done is a checklist, not a feeling.",
  keyConcepts: ["Acceptance criteria", "Tests-first", "Criteria gaming", "Negative constraints"],
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
            "Here's a small move with outsized impact. Before you write the task, write down how you'd know it's done. Not in prose, in *checks*. Commands you could run, or tests you could read. If you can't name the checks, the task isn't well-defined yet, and Codex will suffer the same ambiguity you just avoided.\n\nThe trick is to stop thinking of acceptance criteria as documentation and start thinking of them as **Codex's stopping condition**. The agent will, pretty literally, keep iterating until the checks pass. Give it bad checks and it'll stop at bad code. Give it good checks and it'll go further than you would.",
        },
        {
          kind: "pull-quote",
          text: '"Acceptance criteria" is just "what the agent runs before it says done."',
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
              body: '"pytest tests/api/test_users.py::test_pagination must pass." The gold standard. Codex runs it, sees green, knows it\'s done.',
            },
            {
              eyebrow: "02 · observable",
              title: "Commands with known outputs",
              body: '"curl /health returns {"ok": true} with status 200." Not a test file, but a verifiable signal the agent can check.',
            },
            {
              eyebrow: "03 · structural",
              title: "Shape of the patch",
              body: '"New files live in src/auth/. No changes outside that directory." Codex can self-check this after generating the patch.',
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
            "The highest-leverage habit in Codex work is *tests-first*. Three shapes it can take:\n\n**Write the tests yourself.** Sketch the test file. Commit it with the failing tests in place. Then spec: \"make tests/api/test_users.py pass.\" The entire job is now \"turn red into green.\" Codex is excellent at this.\n\n**Have Codex write the tests first.** Two-task flow. Task A: \"Given these requirements, write failing tests in tests/api/test_users.py. Do not implement.\" You review the tests. They capture intent? Good. Task B: \"Make tests/api/test_users.py pass.\"\n\n**Co-write.** In the task: \"Start by writing failing tests for the new behavior. Review them against the goal. Then implement.\" Codex produces both in one PR, the tests are your acceptance spec, the implementation is the work.",
        },
        {
          kind: "callout",
          title: "Why this works so well:",
          body: 'tests compress a lot of spec into a small, checkable artifact. "Page 1 returns 20 items, page 2 returns the next 20, empty page returns 200 with an empty array" is four sentences. The equivalent test is fifteen lines. But both you and Codex know exactly when it\'s done. No ambiguity, no negotiation.',
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
            'Once the AI returns something that passes your acceptance criteria, you face a second, subtler question: do the criteria themselves capture what you actually wanted? This is the "green but wrong" problem, the agent satisfied the letter of your spec while missing the spirit.\n\nThere are four common shapes this failure takes. Train yourself to check for them before hitting merge:',
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "pattern 01",
              title: "Criteria gaming",
              body: "The agent wrote code that satisfies your acceptance test by special-casing it, rather than implementing the general behavior. If your criterion was \"the test at line 42 passes,\" check that the implementation isn't literally hard-coded to match only that test input.",
            },
            {
              eyebrow: "pattern 02",
              title: "Adjacent problem solving",
              body: "The code solves a problem close to the one you posed, but not exactly it. This happens when acceptance criteria are checkable but underspecified, the agent found a valid path to green that doesn't match the intended design.",
            },
            {
              eyebrow: "pattern 03",
              title: "Hidden regression",
              body: 'The new tests pass. The existing suite still passes. But the implementation subtly changed behavior that no test covers. The structural acceptance criterion ("only touches these files") catches some of this; a quick manual smoke test catches more.',
            },
            {
              eyebrow: "pattern 04",
              title: "Plausible but wrong library usage",
              body: "The code uses a library correctly in isolation but incorrectly in your context, wrong config, wrong threading model, wrong assumptions about call order. Tests often don't cover these because they test unit behavior, not integration behavior.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            'The right response to any of these isn\'t to add more acceptance criteria retroactively, it\'s to add a *negative* acceptance criterion. "It must not do X" is often more powerful than "it must do Y" because it forecloses the unintended-but-passing paths. Example:\n\n```\n# weak: only specifies the happy path\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n\n# strong: closes the "adjacent solution" doors\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n- pytest tests/api/ still fully passes (regression guard)\n- Pagination is implemented via the DB query (LIMIT/OFFSET),\n  not by fetching all rows and slicing in Python\n- api/users.py is the only file that changes\n```',
        },
        {
          kind: "callout",
          title: "The evaluation heuristic:",
          body: 'before accepting any AI output, ask "could a broken implementation still pass all my criteria?" If yes, your criteria are under-specified. Adding one "must not" constraint per likely failure mode closes most of the gap.',
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
          markdown: "Three tasks, three acceptance criteria. Which is strongest? Toggle them on and watch the assembled spec evolve.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on acceptance criteria." }],
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
        title: "Build strong acceptance for a rate-limit feature",
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
            hint: "Regression guard. Cheap to add, expensive to skip.",
            body: ["make test   # all green"],
          },
          {
            section: "Observable: manual curl returns 429",
            hint: "Nice as a check for the reviewer, minor for the agent.",
            body: ["$ for i in 1..6; do curl /login; done → last one is 429"],
          },
          {
            section: "Structural: new code lives in api/limits/",
            hint: "Scopes the blast radius of the patch.",
            body: ["Only api/auth.py and new files in api/limits/ change."],
          },
          {
            section: '"It should feel right."',
            hint: "Not checkable. Drop it.",
            body: ["Vibes-based acceptance."],
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
        question: 'Why is "make test passes" a stronger acceptance criterion than "the code should work"?',
        options: [
          '"Make test" is shorter, so the agent reads it faster.',
          '"Make test" is a command Codex can literally run and check. "Should work" is an interpretation the agent has to guess at.',
          "There is no meaningful difference.",
          '"Should work" implies higher quality.',
        ],
        correct: 1,
        explanation:
          "Codex's loop is: execute → check → revise. Executable criteria plug directly into that loop. Prose criteria force the agent to judge its own work, which is exactly the thing it's not reliable at.",
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
          'For a tricky new feature, you\'re not sure how to spec "done." What\'s the highest-leverage move?',
        options: [
          "Ship the task with vague criteria and iterate.",
          'Spec a preliminary task: "write failing tests that capture the requirements, don\'t implement." Review the tests. Then spec the real task: "make those tests pass."',
          "Skip acceptance criteria entirely.",
          "Write a long prose description and hope.",
        ],
        correct: 1,
        explanation:
          'Tests-first as a two-step. You offload the "what does done look like" question to the agent, then review a test file, much cheaper than reviewing a 400-line PR. Once the tests capture intent, the implementation is a smaller, better-defined task.',
      },
    },
  ],
};

export default lesson;
