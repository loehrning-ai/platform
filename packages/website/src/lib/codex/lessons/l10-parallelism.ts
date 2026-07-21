// Ported from codex/lessons/10-parallelism.html + codex/js/lessons/L10.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_COMPARE_KIND_LABEL } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L10",
  number: 10,
  title: "Parallel Tasks, One Repo",
  subtitle:
    "Git worktrees, task decomposition, and coordination patterns. How to run multiple agents in parallel without merge hell.",
  durationMinutes: 12,
  trackId: "advanced",
  hook: "Multiplayer mode.",
  keyConcepts: ["Git worktrees", "Task decomposition", "Independent vs dependent", "Review queue"],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Ten tasks at once",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The sneaky power of agentic coding isn't that one task goes faster than a human can type. It's that you can have ten of them going at once. Each in its own branch, each oblivious to the others. If you've structured the work right, you come back after lunch to ten PRs, review them in a batch, merge the clean ones.\n\nThat workflow only holds up if the tasks are *independent*. The moment two parallel runs touch the same file, you're in conflict-resolution land, which undoes all the speedup. The skill is learning to carve work into independent slabs.",
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
            "When running multiple local AI agents simultaneously (Claude Code, Cursor, Aider), the usual pattern is to open multiple terminal tabs, each on a different branch. The problem: each agent's edits bleed into the others because they all share the same working directory.\n\n**Git worktrees** solve this. A worktree is a second (or third, or tenth) checkout of your repo, each pointing to a different branch, each with its own working directory on disk. The same git repository, multiple isolated workspaces.\n\n```\n# Set up three parallel worktrees\ngit worktree add ../myrepo-feat-auth feat/auth\ngit worktree add ../myrepo-feat-export feat/export\ngit worktree add ../myrepo-feat-api feat/api\n\n# Now start an agent in each one\n# (using Claude Code as an example)\ncd ../myrepo-feat-auth  &&  claude -n \"auth-refactor\"\ncd ../myrepo-feat-export &&  claude -n \"csv-export\"\ncd ../myrepo-feat-api   &&  claude -n \"api-v2\"\n\n# Each agent operates in its own directory — no shared file state\n# Clean up when done:\ngit worktree remove ../myrepo-feat-auth\n```\n\nWorktrees are especially useful for overnight runs: start three or four agent sessions before you leave, each in its own worktree on its own branch. Come back in the morning to review the PRs. No merge conflicts to untangle, the branches never touched each other.",
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
            "Not all work is naturally parallel. The skill is decomposing a large task into pieces that can be parallelized. Three structural moves that work reliably:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "pattern 01",
              title: "Entity fan-out",
              body: 'One task per entity. "Add audit logging to Users." "…to Projects." "…to Teams." Same shape, different files. Zero conflict by construction.',
            },
            {
              eyebrow: "pattern 02",
              title: "Directory fan-out",
              body: '"Migrate module X to the new pattern." "…module Y." "…module Z." Each task owns one subtree. Independent because the subtrees don\'t overlap.',
            },
            {
              eyebrow: "pattern 03",
              title: "Test-coverage fan-out",
              body: '"Write tests for file A." "…file B." "…file C." Test files only; doesn\'t touch production code. Almost always safe to run in parallel.',
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "The question to ask for every proposed parallel task: *which files does this touch?* List them. If any file appears in two tasks, those tasks are not independent. Either serialize them, or restructure so each task owns its own slice.",
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
            'The move to avoid: parallel tasks that each "do X, and refactor shared helpers as needed." Each one will refactor the helpers in its own direction. You\'ll get three PRs with conflicting rewrites of utils.py. Pick one, resolve the others by hand, lose the day.',
        },
        {
          kind: "callout",
          title: "The fix:",
          body: "if tasks share infrastructure, land the infrastructure change first as its own task. Then fan out the follow-ups. Serial-then-parallel beats parallel-then-merge-hell every time.",
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
            "Before launching a batch of parallel tasks, classify each one:\n\n- **Independent:** touches files no other task touches. Safe to parallelize immediately.\n- **Sequentially dependent:** task B requires task A's output. Run A first, then fan out B, C, D in parallel once A is merged.\n- **Conflict-prone:** two tasks that both need to touch a shared file. Restructure or serialize. Do not parallelize hoping for the best.\n\nA useful heuristic: tasks are independent if their *diff sets are disjoint*. Before launching, mentally walk through what each task will change. If the sets don't intersect, run them in parallel.",
        },
        {
          kind: "callout",
          title: "Scheduling pattern:",
          body: "1) Identify shared infrastructure changes, run these first, alone. 2) After those merge, identify all independent leaf tasks, run these in parallel. 3) Review in a batch. Merge the clean ones. Revise the others.",
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
            "The team shape that makes parallel AI workflows sing:\n\n- **One human \"scout\" per feature area**, writes specs, reviews PRs, owns the agent instructions for that area.\n- **Agents run the specs in parallel;** the scout triages the resulting PRs.\n- **The rest of the team** does the work that *shouldn't* be automated, design calls, customer conversations, architectural decisions, anything that requires judgment calls about what to build.\n\nThe bottleneck shifts from \"who has time to type this out\" to \"who has time to review.\" That's a fundamentally different bottleneck, and the solutions are different: better acceptance criteria, tests-first specs, cleaner scope. Most of this course.\n\nOne practical tip: keep your review queue bounded. It's tempting to launch ten parallel tasks, but reviewing ten PRs at once is cognitively taxing and you'll miss things. Four or five in parallel is a sweet spot for one reviewer. Batch in waves.",
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on parallelizing agent work." }],
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
        bad:
          'Three tasks running concurrently:\n\n· "Add validation to signup, refactor shared validators as needed."\n· "Add validation to checkout, refactor shared validators as needed."\n· "Add validation to profile update, refactor shared validators as needed."\n\nAll three touch validators.py. All three will rewrite it differently.',
        good:
          'Task A (runs first, alone):\n"Restructure validators.py: one validator per field, composable, typed."\n\nTasks B, C, D (run after A merges, in parallel):\n"Use the new validators for signup."\n"...for checkout."\n"...for profile update."\n\nShared work lands once. Feature work parallelizes cleanly.',
        note: "This is the single highest-leverage scheduling move in agentic workflows. Serialize the shared stuff. Parallelize the leaves.",
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
          "Five parallel tasks — one per service. Each also writes the middleware itself.",
          "One task to write the middleware and land it in a shared library. Then five parallel tasks — one per service — to adopt it.",
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
          "Use git worktrees — check out each branch into a separate directory so each agent has its own isolated working tree.",
          "Create a full clone of the repository for each agent.",
          "Use a single session and alternate between tasks manually.",
        ],
        correct: 1,
        explanation:
          "Git worktrees give each agent its own working directory on disk, all backed by the same repository object database. No file-state conflicts between sessions. A full clone works but wastes disk and makes sharing history harder. Worktrees are the precise tool for this problem.",
      },
    },
  ],
};

export default lesson;
