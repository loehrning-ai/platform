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
  subtitle: "Goal, constraints, acceptance criteria, out-of-scope. Four lines, and your success rate doubles.",
  durationMinutes: 12,
  trackId: "task-craft",
  hook: "Specs aren't docs. Specs are guardrails.",
  keyConcepts: ["Task spec", "Goal", "Constraints", "Acceptance criteria", "Out of scope"],
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
            "If `AGENTS.md` is the agent's onboarding doc, the **task spec** is the single Jira ticket it works from. It's what gets pasted into the task field when you kick off a run. Everything else, the repo context, the conventions, the tests, is already there. The spec is where you describe the work.\n\nMost people write the spec as a one-line request: \"add pagination to the users endpoint.\" Sometimes that works. Usually it produces a plausible-but-not-quite-right PR that needs two rounds of revision. The problem isn't that Codex is dumb. The problem is that the one-line spec is *four specs collapsed together*, goal, constraints, acceptance, scope, and the agent gets to pick one interpretation for each.\n\n### The core principle: describe the shape, not the steps\n\nThe single most important rule in task-spec writing: **describe what the end state should look like, not how to get there.** Don't instruct the agent step-by-step (\"first, open the file, then add a function…\"). Instead, describe the outcome: what behavior should exist, what tests should pass, what should not change.\n\nWhy? Because the agent is better than you at finding implementation paths inside a codebase it just read. What it cannot do is read your mind. When you describe the shape, \"users can page through /users, 20 per page, via ?page=N, keeping the existing response schema\", the agent picks the right implementation. When you describe steps, you're fighting the model's own judgment, and often losing.\n\nUnpack the four parts and the success rate roughly doubles. Here's the anatomy:",
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
              body: 'The checklist the PR must pass. "A new test covers page 1, page 2, and out-of-range. make test passes. No deprecation warnings." Concrete, checkable. Codex will literally run these.',
            },
            {
              eyebrow: "04 · out of scope",
              title: "What are we explicitly not doing?",
              body: 'The negative space. "Don\'t touch auth." "Don\'t refactor the query builder even if it\'s tempting." Prevents the agent from "helpfully" enlarging the PR and breaking unrelated things.',
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
            'Toggle the parts of a strong spec for the task "add pagination to /users." Watch the assembled spec on the right strengthen as you add each piece.',
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
            "Three specs. All three ask for the same thing. Only one of them gets the PR right on the first try.",
        },
        {
          kind: "prose",
          markdown:
            "### Anatomy of the strong version\n\nThe strong spec isn't longer because the author is fussy. It's longer because it closes the ambiguities that would each, individually, cost you a round of revisions:\n\n- **\"20 per page\"**, Codex won't have to guess the default page size.\n- **\"?page=N query param\"**, closes off cursor-based pagination, offset hacks, and response-envelope redesigns.\n- **\"Keep the existing response schema; add a pagination field\"**, tells the agent exactly where the new data goes.\n- **\"make test must pass\"**, concrete, checkable.\n- **\"Don't change the filtering logic\"**, guards against the refactor urge.\n\nThe strong spec is roughly 80 words. Writing it takes sixty seconds. The alternative is a PR-review round-trip that costs you twenty minutes.\n\nNotice what the strong version doesn't do: it never says \"first open api/users.py, then find the list function, then add an offset parameter.\" It describes the end state. The agent reads the codebase and finds the right place. That's the whole point of delegating.",
        },
      ],
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on writing task specs." }],
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
        desc: "Toggle each section on if you'd include it. Aim for at least four.",
        goal: "Users can page through /users, 20 per page, via ?page=N.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        items: [
          {
            section: "Goal",
            hint: "The behavior. One sentence. Not the code.",
            body: ["Users can page through /users results.", "20 items per page, via ?page=N."],
          },
          {
            section: "Constraints",
            hint: 'The rails. "Do this within these limits."',
            body: ["Keep the existing response schema.", "No new dependencies.", "Offset-based, not cursor."],
          },
          {
            section: "Acceptance criteria",
            hint: "The checklist the PR must pass.",
            body: ["New test: page 1, page 2, out-of-range.", "make test passes.", "make lint passes."],
          },
          {
            section: "Out of scope",
            hint: 'The "don\'t help me" list.',
            body: ["Don't change filtering logic.", "Don't touch /users/:id.", "Don't add caching."],
          },
          {
            section: "Nice-to-haves",
            hint: "Optional. Gives the agent room to go beyond if cheap.",
            body: ["A total-count field, if trivial."],
          },
          {
            section: "My emotional state",
            hint: "Not useful. Really, don't.",
            body: ["I am tired and need this to just work."],
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
        good:
          "Goal\nUsers can page through GET /users results via ?page=N, 20 items per page.\n\nConstraints\n- Keep existing response schema; add a top-level \"pagination\" object.\n- Offset-based (?page=N), not cursor.\n- No new dependencies.\n\nAcceptance\n- Tests cover page 1, page 2, out-of-range (page=999 → empty).\n- make test && make lint pass.\n- Existing filters (?role, ?status) still work.\n\nOut of scope\n- Don't touch the single-user detail endpoint.\n- Don't refactor the filter builder.",
        note: "Middle tier, omitted for space: goal + acceptance, no constraints or scope. Gets pagination working but \"helpfully\" rewrites the filter builder. Ninety percent of the code is right. The other ten costs you an afternoon.",
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
          'You spec a task with a clear goal and three acceptance criteria, but no "out of scope" section. What\'s the likely failure mode?',
        options: [
          "The PR will be too small and miss edge cases.",
          'The agent will "helpfully" expand the PR into nearby code, refactoring things you didn\'t ask about, making it hard to review.',
          "Codex will refuse to work without explicit scope.",
          "Nothing, out-of-scope sections are decorative.",
        ],
        correct: 1,
        explanation:
          'Codex leans toward being helpful. Without a "do not touch" list, it treats the whole area around your goal as fair game. Out-of-scope sections are the cheapest, highest-leverage part of the spec for keeping PRs reviewable.',
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
          '"The existing /users integration tests pass, plus three new tests: page 1 returns 20 items, page 2 returns the next 20, page=999 returns an empty array."',
          '"It should be production-ready."',
          '"Don\'t break anything."',
        ],
        correct: 1,
        explanation:
          'Codex will literally run your acceptance criteria when they\'re executable. "Works well" isn\'t runnable, the agent has to interpret it. The concrete version is a checklist the agent uses as its own stopping condition. Write acceptance like tests. Ideally, write them as tests (next lesson).',
      },
    },
  ],
};

export default lesson;
