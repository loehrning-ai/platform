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
    "Isolate concurrent changes with worktrees, dependency order and file ownership.",
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
            "Running tasks is cheap; independent work is not. Each task still needs review, and tasks interact through shared files, schemas, APIs, generated artifacts, dependencies and deployment state.\n\nFind those dependencies before you parallelize. Separate working trees stop two processes from editing one checkout; semantic conflicts still surface at merge.",
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
            "Two local sessions in one working directory share file state: what one writes changes what the other reads and tests.\n\n**Git worktrees** give you separate working directories on the same repository object database, normally one branch each.\n\n```\n# Create worktrees on distinct branches\ngit worktree add ../myrepo-feat-auth feat/auth\ngit worktree add ../myrepo-feat-export feat/export\ngit worktree add ../myrepo-feat-api feat/api\n\n# Start the configured coding tool from each worktree.\n# Verify the path and branch before editing.\n\n# Remove a worktree after its changes are integrated or preserved\ngit worktree remove ../myrepo-feat-auth\n```\n\nWorktrees isolate uncommitted file state. They share Git metadata and can share dependency caches, databases, ports and generated files outside the worktree.",
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
            "Three ways to split work, after you have checked shared contracts and side effects:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "pattern 01",
              title: "Entity fan-out",
              body: "One task per entity with its own code and data paths. A shared schema, helper or audit sink is an explicit dependency.",
            },
            {
              eyebrow: "pattern 02",
              title: "Directory fan-out",
              body: "One subtree per task. Shared exports, generated indexes, configuration and cross-module tests must not change concurrently.",
            },
            {
              eyebrow: "pattern 03",
              title: "Test-coverage fan-out",
              body: "Split test additions by behavior and owned fixtures. Shared snapshots, fixtures, test configuration and production seams can still conflict.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "List each task's files, interfaces, generated outputs, services, ports and data stores. Overlapping tasks need an integration order and a named conflict owner.",
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
            "Tasks that each say \"refactor shared helpers as needed\", like the validator example above, all own the same dependency, so the merge becomes unpredictable.",
        },
        {
          kind: "callout",
          title: "The fix",
          body: "Define and review the shared contract first, rebase dependent tasks onto it, then run only the independent adoptions in parallel.",
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
            "Classify each task before launch:\n\n- **Independent:** no shared code, contract, generated state or external side effect expected. Run it in parallel if review keeps up.\n- **Sequentially dependent:** needs another task's accepted output. Run and review the dependency first.\n- **Conflict-prone:** touches a shared file, interface, schema, fixture or service. Restructure, assign ownership or serialize.\n\nDisjoint file lists suggest independence without proving it; integration tests and merge review still judge semantic overlap.",
        },
        {
          kind: "callout",
          title: "Scheduling order",
          body: "1) Map dependencies and shared state. 2) Land shared contracts before their consumers. 3) Give each concurrent task an owner, base revision, scope and checks. 4) Integrate in a controlled order and rerun cross-cutting checks.",
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
            "Parallel work needs named owners: a reviewer for each affected area and trust boundary, and for every task a recorded base revision, dependency order and integration owner. Run no more tasks than the team can review without delaying security or release checks. Product, architecture and risk decisions stay with accountable people; delegate implementation once they are written down.\n\nThere is no universal concurrency target. Queue age, review complexity, overlap and deployment risk decide when the next task starts.",
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
        note: "Serialize shared foundations, then parallelize the leaves.",
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
          "Five services each need the same new logging middleware. How do you parallelize?",
        options: [
          "Five parallel tasks, each writing its own middleware copy.",
          "Land the middleware in a shared library, then five parallel adoptions.",
          "One sequential task that adds it to all five services.",
          "Let each team member do their own service by hand.",
        ],
        correct: 1,
        explanation:
          "Built and reviewed once, the middleware has one canonical version. Each adoption task then touches only its own service, so nothing conflicts.",
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
          "Two local agent sessions should work on one repository at once without touching each other's files. What setup fits?",
        options: [
          "Two terminal tabs in one directory; careful agents won't conflict.",
          "Use git worktrees, one branch per directory.",
          "Create a full clone of the repository for each agent.",
          "Use a single session and alternate between tasks manually.",
        ],
        correct: 1,
        explanation:
          "Worktrees give each session its own working directory on the same object database and isolate uncommitted changes. You still need distinct branches and must manage shared services, generated state and merge conflicts.",
      },
    },
  ],
};

export default lesson;
