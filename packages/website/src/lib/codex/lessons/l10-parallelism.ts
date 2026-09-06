// Ported from codex/lessons/10-parallelism.html + codex/js/lessons/L10.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L10",
  number: 10,
  title: "Parallel Tasks, One Repo",
  subtitle:
    "Use worktrees, dependency ordering, and explicit file ownership to isolate concurrent changes and expose merge risk.",
  durationMinutes: 12,
  trackId: "advanced",
  hook: "Parallelize only independent change sets.",
  keyConcepts: [
    "Git worktrees",
    "Task decomposition",
    "Independent vs dependent",
    "Review queue",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Concurrency changes the review problem",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Execution capacity is cheap. Independent work is not. Every task still consumes review capacity, and tasks interact through shared files, schemas, APIs, generated artifacts, dependencies and deployment state.\n\nParallelize only after identifying those dependencies. Separate working trees prevent concurrent processes from editing the same checkout. They do not prevent semantic conflicts when branches are merged.",
        },
        {
          kind: "pull-quote",
          text: "Parallelism is a structure problem, not a speed problem.",
        },
      ],
    },
    {
      id: "s2",
      title: "Git worktrees",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Two local sessions in one working directory share file state. A write from one changes what the other reads and tests.\n\n**Git worktrees** provide separate working directories backed by the same repository object database. Each worktree normally uses its own branch.\n\n```\n# Create worktrees on distinct branches\ngit worktree add ../myrepo-feat-auth feat/auth\ngit worktree add ../myrepo-feat-export feat/export\ngit worktree add ../myrepo-feat-api feat/api\n\n# Start the configured coding tool from each worktree.\n# Verify the path and branch before editing.\n\n# Remove a worktree after its changes are integrated or preserved\ngit worktree remove ../myrepo-feat-auth\n```\n\nWorktrees isolate uncommitted file state. They still share Git metadata and may share dependency caches, databases, ports and generated files outside the worktree. Branches still conflict at merge time when their diffs overlap semantically.",
        },
      ],
    },
    {
      id: "s3",
      title: "Task decomposition",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three patterns that expose independent work, once you have checked the shared contracts and side effects.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "pattern 01",
              title: "Entity fan-out",
              body: "Use one task per entity when each entity owns separate code and data paths. A shared schema, helper, or audit sink creates a dependency that must be handled explicitly.",
            },
            {
              eyebrow: "pattern 02",
              title: "Directory fan-out",
              body: "Assign one subtree to each task. Confirm that shared exports, generated indexes, configuration, and cross-module tests are not modified concurrently.",
            },
            {
              eyebrow: "pattern 03",
              title: "Test-coverage fan-out",
              body: "Separate test additions by behavior and owned fixture set. Shared snapshots, fixtures, test configuration, and production seams can still create conflicts.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "For each proposed task, list expected files, interfaces, generated outputs, services, ports and data stores. Overlap does not always rule out concurrency. It does demand an integration order and a named conflict owner.",
        },
      ],
    },
    {
      id: "s4",
      title: "The anti-pattern",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            'Parallel tasks that each say "refactor shared helpers as needed." Every one of them owns the same dependency, and the merge behavior becomes unpredictable.',
        },
        {
          kind: "callout",
          title: "The fix:",
          body: "If tasks depend on the same infrastructure change, define and review that contract first. Rebase dependent tasks onto the accepted revision, then run only the independent adoption work concurrently.",
        },
      ],
    },
    {
      id: "s5",
      title: "Independent vs. dependent",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Before launching concurrent tasks, classify each one:\n\n- **Independent:** no shared code, contract, generated state, or external side effect is expected. Parallel execution is reasonable, subject to review capacity.\n- **Sequentially dependent:** a task requires another task's accepted output. Run and review the dependency first.\n- **Conflict-prone:** tasks modify a shared file, interface, schema, fixture, or service. Restructure, assign ownership, or serialize them.\n\nDisjoint file lists are evidence, not proof of independence. Integration tests and merge review still have to judge semantic overlap.",
        },
        {
          kind: "callout",
          title: "Scheduling pattern:",
          body: "1) Map dependencies and shared state. 2) Land shared contracts before their consumers. 3) Give each concurrent task an owner, base revision, scope, and checks. 4) Integrate and re-run cross-cutting checks in a controlled order.",
        },
      ],
    },
    {
      id: "s6",
      title: "Team flow",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Parallel execution needs explicit human ownership:\n\n- Assign a reviewer who understands each affected feature area and trust boundary.\n- Record the base revision, dependency order, and integration owner for every task.\n- Limit active tasks to the team's ability to review diffs and verification evidence without delaying security or release checks.\n- Keep product, architecture, and risk decisions with accountable humans; delegate implementation only after those decisions are stated.\n\nNo universal concurrency target exists. Queue age, review complexity, overlap and deployment risk decide when the next task starts.",
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "Two questions on parallelizing agent work.",
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
        title: "Same work, two structures",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Parallel-hostile",
        goodLabel: "Parallel-friendly",
        bad: 'Three tasks running concurrently:\n\n· "Add validation to signup, refactor shared validators as needed."\n· "Add validation to checkout, refactor shared validators as needed."\n· "Add validation to profile update, refactor shared validators as needed."\n\nAll three may modify validators.py, so ownership and merge order are undefined.',
        good: 'Task A (runs first):\n"Define and test the shared validator interface in validators.py."\n\nAfter Task A is reviewed, separate adoption tasks use that accepted interface for signup, checkout, and profile update.\n\nEach adoption task owns its endpoint and tests; the shared validator remains out of scope.',
        note: "Serialize tasks that modify shared foundations. Parallelize independent leaf tasks after their dependencies are stable.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L10",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "You have five services that each need the same new logging middleware added. What's the right parallelization strategy?",
        options: [
          "Five parallel tasks, one per service. Each also writes the middleware itself.",
          "One task to write the middleware and land it in a shared library. Then five parallel tasks, one per service, to adopt it.",
          "One sequential task that adds it to all five services.",
          "Let each team member do their own service by hand.",
        ],
        correct: 1,
        explanation:
          "Write the middleware once, land it, then fan out the adoptions. Each adoption task touches only its own service, no conflicts. You also get one canonical implementation instead of five drift-prone copies.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L10",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "You want to run two local AI agent sessions on the same repository simultaneously without them interfering with each other's edits. What's the right setup?",
        options: [
          "Open two terminal tabs in the same directory. Agents won't conflict if they're careful.",
          "Use git worktrees, check out each branch into a separate directory so each agent has its own isolated working tree.",
          "Create a full clone of the repository for each agent.",
          "Use a single session and alternate between tasks manually.",
        ],
        correct: 1,
        explanation:
          "Git worktrees provide separate working directories backed by the same repository object database. They isolate uncommitted file state, but you must still use distinct branches and manage shared services, generated state, and later merge conflicts.",
      },
    },
  ],
};

export default lesson;
