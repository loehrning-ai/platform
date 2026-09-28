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
  title: "Anatomy of a task spec",
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
      title: "Describe the result",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "\"Add pagination to the users endpoint.\" Every part of that line hides a decision about behavior, constraints, verification or adjacent code, and Codex infers whatever you omit. `AGENTS.md` holds the durable project rules; the **task spec** holds this change.\n\nState the observable behavior, the interfaces that must stay stable, the checks that must pass and the areas that must not change. Add step-by-step instructions only when the sequence is itself the constraint, as in an ordered migration.\n\n\"GET /users supports ?page=N with 20 items per page and keeps the existing response schema\" is a reviewable result.",
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
              body: "The observable behavior you want, in one sentence and without implementation steps.",
            },
            {
              eyebrow: "02 · constraints",
              title: "What shape must the solution take?",
              body: "The non-negotiables, such as a stable response schema, working query params or no new dependencies.",
            },
            {
              eyebrow: "03 · acceptance",
              title: "How will we know it's done?",
              body: "The tests, commands and observable results required before acceptance, such as a passing make test and no new deprecation warnings. Read the output.",
            },
            {
              eyebrow: "04 · out of scope",
              title: "What are we not doing?",
              body: "Adjacent work that stays out, such as auth or the query builder, so implementer and reviewer share one boundary.",
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
            "Use the exercise above: select the fields that make \"add pagination to /users\" reviewable.",
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
            "The comparison at the end shows the same feature with more and less precision. Count the decisions a reviewer can verify in each.",
        },
        {
          kind: "prose",
          markdown:
            "### Anatomy of the precise version\n\n- **\"20 per page\"** sets the default page size.\n- **\"?page=N query parameter\"** selects offset pagination over a cursor contract.\n- **\"Keep the existing response schema; add a pagination field\"** sets the compatibility boundary.\n- **\"make test must pass\"** names an executable check whose log you still read.\n- **\"Do not change the filtering logic\"** excludes an adjacent refactor.",
        },
      ],
    },
    {
      id: "s5",
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
        lessonId: "L04",
        cpId: "spec-1",
        threshold: 4,
        title: 'Assemble a task spec for "/users pagination"',
        desc: "Select each field that fixes an implementation or review decision.",
        goal: "Users can page through /users, 20 per page, via ?page=N.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        fileName: "task.md",
        goalHeading: "Goal",
        signalsLabel: "signals",
        items: [
          {
            section: "Goal",
            hint: "The observable behavior in one sentence.",
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
            hint: "Adjacent work excluded from this change.",
            body: [
              "Don't change filtering logic.",
              "Don't touch /users/:id.",
              "Don't add caching.",
            ],
          },
          {
            section: "Nice-to-haves",
            hint: "Optional work needs a scope decision too.",
            body: [
              "A total-count field, only if accepted into scope.",
            ],
          },
          {
            section: "Unverifiable preference",
            hint: "Defines neither behavior nor evidence.",
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
        note: "Without constraints, a goal and tests still allow a schema change or an unrelated filter refactor. The four parts give review a contract.",
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
          "Adjacent cleanup slips in, and the reviewer has no stated boundary to reject it.",
          "Codex will refuse to work without explicit scope.",
          "Nothing; out-of-scope sections are decorative.",
        ],
        correct: 1,
        explanation:
          "Without a boundary, adjacent cleanup can pass as necessary work. An out-of-scope section lets Codex and the reviewer compare the diff with a stated limit.",
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
          "\"make test passes, with new cases: page 1 returns 20 items, page 2 the next 20, page=999 an empty array.\"",
          '"It should be production-ready."',
          '"Don\'t break anything."',
        ],
        correct: 1,
        explanation:
          "It names inputs, outputs and a command both sides can run. A passing log is evidence for those cases only; the next lesson strengthens it with reviewed tests.",
      },
    },
  ],
};

export default lesson;
