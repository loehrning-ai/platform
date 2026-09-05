// Ported from codex/lessons/04-task-spec.html + codex/js/lessons/L04.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_TASK_SPEC_TIER_LABELS,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L04",
  number: 4,
  title: "Anatomy of a Task Spec",
  subtitle:
    "Goal, constraints, acceptance criteria, and excluded scope make the requested change reviewable.",
  durationMinutes: 12,
  trackId: "task-craft",
  hook: "Define the result and its boundary.",
  keyConcepts: [
    "Task spec",
    "Goal",
    "Constraints",
    "Acceptance criteria",
    "Out of scope",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Shape, not steps",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            '"Add pagination to the users endpoint." One line, and every part of it hides a decision. Behavior, constraints, verification, adjacent code. Codex infers whichever field you omit. `AGENTS.md` holds the durable project rules. The **task spec** holds this change.\n\n### Describe the end state before the implementation path\n\nState the observable behavior, the interfaces that must stay stable, the checks that must pass, the areas that must not change. Step-by-step instructions earn their place when the sequence is itself the constraint, an ordered migration for instance. Otherwise outcome and boundary beat a guessed edit sequence.\n\n"GET /users supports ?page=N with 20 items per page while retaining the existing response schema" is a reviewable result. Four fields separate the decisions below.',
        },
      ],
    },
    {
      id: "s2",
      title: "The four parts",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "01 · goal",
              title: "What outcome are we after?",
              body: 'One sentence. The user-facing, behavioral change you want, not the implementation steps. "Users should be able to paginate through /users, 20 per page." Not "write a pagination function." Describe the shape, not the steps.',
            },
            {
              eyebrow: "02 · constraints",
              title: "What shape must the solution take?",
              body: 'The non-negotiables. "Don\'t change the response schema." "Must work with existing query params." "No new dependencies." These close off whole branches of bad design.',
            },
            {
              eyebrow: "03 · acceptance",
              title: "How will we know it's done?",
              body: 'The evidence required before acceptance. "A new test covers page 1, page 2, and out-of-range. make test passes. No new deprecation warnings." Name commands and observable results, then inspect their output.',
            },
            {
              eyebrow: "04 · out of scope",
              title: "What are we explicitly not doing?",
              body: 'The negative space. "Do not modify auth." "Do not refactor the query builder." These exclusions give the implementer and reviewer a shared scope boundary.',
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Build one",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            'Select the fields that make "add pagination to /users" reviewable. The assembled version shows which decisions are explicit and which remain open.',
        },
      ],
    },
    {
      id: "s4",
      title: "Three quality tiers",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The same feature at different levels of precision. Count the decisions a reviewer can actually verify in each one.",
        },
        {
          kind: "prose",
          markdown:
            '### Anatomy of the precise version\n\nEach field closes a distinct implementation or review question:\n\n- **"20 per page"** defines the default page size.\n- **"?page=N query parameter"** selects page-based offset pagination instead of a cursor contract.\n- **"Keep the existing response schema; add a pagination field"** defines the compatibility boundary.\n- **"make test must pass"** names an executable check; its log still needs inspection.\n- **"Do not change the filtering logic"** excludes an adjacent refactor.\n\nNo guessed edit sequence anywhere in it. Observable behavior, interface constraints, evidence, excluded scope. Add ordered steps only when the sequence is itself a requirement, a migration or a rollout dependency.',
        },
      ],
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Two questions on writing task specs." },
      ],
    },
  ]),
  widgets: [
    {
      kind: "task-spec",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        lessonId: "L04",
        cpId: "spec-1",
        threshold: 4,
        title: 'Assemble a task spec for "/users pagination"',
        desc: "Select each field that contributes an explicit implementation or review decision.",
        goal: "Users can page through /users, 20 per page, via ?page=N.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        items: [
          {
            section: "Goal",
            hint: "The behavior. One sentence. Not the code.",
            body: [
              "Users can page through /users results.",
              "20 items per page, via ?page=N.",
            ],
          },
          {
            section: "Constraints",
            hint: "Non-negotiable interface and implementation boundaries.",
            body: [
              "Keep the existing response schema.",
              "No new dependencies.",
              "Offset-based, not cursor.",
            ],
          },
          {
            section: "Acceptance criteria",
            hint: "Commands and observable results required for review.",
            body: [
              "New test: page 1, page 2, out-of-range.",
              "make test passes.",
              "make lint passes.",
            ],
          },
          {
            section: "Out of scope",
            hint: "Adjacent work explicitly excluded from this change.",
            body: [
              "Don't change filtering logic.",
              "Don't touch /users/:id.",
              "Don't add caching.",
            ],
          },
          {
            section: "Nice-to-haves",
            hint: "Optional work still needs a clear decision and review boundary.",
            body: [
              "A total-count field, only if explicitly accepted into scope.",
            ],
          },
          {
            section: "Unverifiable preference",
            hint: "This does not define behavior or evidence.",
            body: ["Make the endpoint feel polished."],
          },
        ],
      },
    },
    {
      kind: "compare",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "Three shapes of the same task",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Weak, one line",
        goodLabel: "Strong, four parts",
        bad: "task:\nadd pagination to /users",
        good: "Goal\nUsers can page through GET /users results via ?page=N, 20 items per page.\n\nConstraints\n- Keep existing response schema; add a top-level \"pagination\" object.\n- Offset-based (?page=N), not cursor.\n- No new dependencies.\n\nAcceptance\n- Tests cover page 1, page 2, out-of-range (page=999 → empty).\n- make test && make lint pass.\n- Existing filters (?role, ?status) still work.\n\nOut of scope\n- Don't touch the single-user detail endpoint.\n- Don't refactor the filter builder.",
        note: "A goal and tests without constraints can still permit a response-schema change or an unrelated filter refactor. The four-part version gives review an explicit contract.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L04",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "A task has a clear goal and acceptance criteria but no excluded scope. What review risk remains?",
        options: [
          "The diff must be small regardless of the feature.",
          "Adjacent cleanup can be treated as part of the task, leaving the reviewer without a stated boundary for rejecting it.",
          "Codex will refuse to work without explicit scope.",
          "Nothing, out-of-scope sections are decorative.",
        ],
        correct: 1,
        explanation:
          "Without an explicit boundary, adjacent cleanup can be interpreted as necessary work. An out-of-scope section lets both Codex and the reviewer compare the diff with a stated limit.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L04",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question: "Which is the better acceptance criterion?",
        options: [
          '"Make sure it works well."',
          '"make test passes, including three new integration cases: page 1 returns 20 items, page 2 returns the next 20, and page=999 returns an empty array."',
          '"It should be production-ready."',
          '"Don\'t break anything."',
        ],
        correct: 1,
        explanation:
          "The concrete criterion defines inputs, outputs, and a command the implementer and reviewer can run. A passing log is evidence for those cases, not proof of every relevant behavior. The next lesson shows how to strengthen that evidence with reviewed tests.",
      },
    },
  ],
};

export default lesson;
