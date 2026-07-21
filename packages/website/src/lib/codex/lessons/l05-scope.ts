// Ported from codex/lessons/05-scope.html + codex/js/lessons/L05.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L05",
  number: 5,
  title: "Scoping: Small Tasks Win",
  subtitle: "Codex is great at a morning's work, not a quarter's. Learn the shape of a task it can land cleanly.",
  durationMinutes: 12,
  trackId: "task-craft",
  hook: "Slice the elephant.",
  keyConcepts: ["Task sizing", "Slicing moves", "Surgical changes", "Scope creep"],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "The size of a morning",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "There is a size of task that Codex lands cleanly. There is a size of task where it thrashes, produces a sprawling PR, and requires you to untangle three entwined changes on review. The boundary is sharper than you'd think, and once you can see it, you'll start reflexively decomposing work before you hand it over.\n\nThe rule of thumb: **a task Codex can land in one run is the size of a morning for a mid-level engineer**. Roughly:\n\n- Touches 1–5 files.\n- Involves one concept, not three parallel threads.\n- Has a testable outcome that can be checked in under a minute.\n- Lives entirely inside your existing architecture, no \"and also introduce a new service layer.\"\n\nBigger than that, quality drops off a cliff. Not linearly, exponentially. A task twice the size is four times as flaky. And because Codex runs are asynchronous, a flaky run costs you the whole round-trip time.",
        },
        {
          kind: "pull-quote",
          text: "Size the task for the agent, not for the ticket.",
        },
      ],
    },
    {
      id: "s2",
      title: "Three slicing moves",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown: "When a task feels too big, there are three reliable ways to split it. In rough order of ease:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "move 01 · horizontal",
              title: "Split by layer",
              body: "Big task = schema change + API change + UI change. Three Codex tasks. The schema PR lands, you merge, the API PR builds on it, and so on. Each one reviewable in isolation.",
            },
            {
              eyebrow: "move 02 · vertical",
              title: "Split by entity",
              body: '"Add soft-delete" to three entities → three tasks, one per entity. Identical shape, smaller blast radius each. Also: if one of them is tricky, it doesn\'t block the other two.',
            },
            {
              eyebrow: "move 03 · prep/do",
              title: "Do the plumbing first",
              body: "Task 1: refactor the messy part so the next change is obvious. Task 2: make the change. Cleaner than one PR doing both at once, and the prep PR often catches bugs you didn't know about.",
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Surgical changes",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "There's a discipline that separates effective AI-assisted development from sloppy AI-assisted development: **only change what the current task requires.** Not what looks messy. Not what you notice along the way. Not the thing three files over that's probably wrong. The task.\n\nThis matters more with an AI agent than with a human engineer because the agent has no natural reluctance to touch things. A human gets tired and stops. The agent will cheerfully refactor your entire error-handling layer if the task spec gives it any opening to do so. It means well. But you now have a 600-line PR where 200 lines are the feature and 400 lines are \"improvements\" you never asked for, never reviewed, and can't easily separate.\n\nThe technical term for this is *scope creep* and it's worse in AI sessions than in human ones because it happens in a single run, invisibly, before you see the output.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "cost 01",
              title: "Review burden multiplies",
              body: "A 200-line PR takes 20 minutes to review. A 600-line PR, where 400 lines are untasked refactoring, takes 90 minutes. The ratio isn't linear; interleaved changes are harder to reason about than isolated ones.",
            },
            {
              eyebrow: "cost 02",
              title: "Rollback becomes entangled",
              body: "If something breaks in production, \"revert the PR\" reverts everything, the feature, the refactoring, the cleaned-up tests. You can't cleanly separate. A narrowly scoped task is always safe to revert.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            'The antidote is a single sentence you can add to any task spec: *"Only change files directly required for this task. If you notice other issues, note them in the PR description but do not fix them."* That one instruction cuts the "bonus work" problem by roughly half.\n\nThe other half is fixed by scoping the spec to be so specific that there\'s no room for interpretation. Compare:\n\n```\n# Too open — invites bonus work\n## Goal\nAdd pagination to the users list endpoint. The current implementation\nreturns all users; we need page-based results.\n\n# Surgical — leaves no room for wandering\n## Goal\nAdd page and page_size query params to GET /users in api/users.py.\nDefault: page=1, page_size=20. Max page_size=100 (raise 400 if exceeded).\nReturn {"items": [...], "total": N, "page": N, "pages": N}.\n\n## Scope\nTouch only api/users.py and tests/api/test_users.py. Nothing else.\n```',
        },
      ],
    },
    {
      id: "s4",
      title: "Smells to recognise",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "When you catch yourself writing a spec with any of these phrases, stop. Split first.",
        },
      ],
    },
    {
      id: "s5",
      title: "Live replay: the exponential blow-up",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "A too-big task. Watch Codex make it work, kind of, while quietly accumulating regret.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "One question on scoping and scope creep." }],
    },
  ]),
  widgets: [
    {
      kind: "compare",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: "Same goal — before and after slicing",
        badLabel: "Too big — one task",
        goodLabel: "Sliced — three tasks",
        bad: 'Goal\nAdd soft-delete to Users, Projects, and Teams.\nInclude a "restore" endpoint for each.\nAlso add an audit log of who deleted what.\nMigrate existing hard-deletes we\'ve been stashing in cold storage.',
        good:
          "Task A: schema\nAdd deleted_at and deleted_by to users, projects, teams.\nAdd migration. Don't touch queries yet.\n\nTask B: API\nUpdate list/get endpoints to filter deleted_at IS NULL.\nAdd DELETE → sets deleted_at. Add POST /restore.\n\nTask C: audit\nLog soft-deletes to the audit_events table.\nMigrate cold-storage rows in a separate PR.",
        note: 'The "too big" version isn\'t wrong, it\'s just one run doing four people\'s jobs. Sliced, each task is a morning\'s work, reviewable, and the failure of one doesn\'t block the others.',
      },
    },
    {
      kind: "terminal-replay",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L05",
        cpId: "term-1",
        title: "Session replay: when a task is too big",
        windowTitle: "codex@sandbox · task-too-big",
        frames: [
          { segments: [{ text: "codex> planning the four-part task…", tone: "prompt" }], delayMs: 500 },
          {
            segments: [{ text: "  plan: schema → queries → endpoints → audit log → migration", tone: "comment" }],
            delayMs: 700,
          },
          { segments: [{ text: "codex> editing 3 models + 6 tests (schema)", tone: "prompt" }], delayMs: 600 },
          { segments: [{ text: "codex> editing 12 query functions (queries)", tone: "prompt" }], delayMs: 700 },
          { segments: [{ text: "$ pytest", tone: "prompt" }], delayMs: 400 },
          {
            segments: [{ text: "→ 14 failures · some unrelated to this change?", tone: "error" }],
            delayMs: 800,
          },
          { segments: [{ text: "codex> investigating unrelated failures…", tone: "prompt" }], delayMs: 700 },
          {
            segments: [{ text: "  found: two existing tests depend on hard-delete behavior", tone: "comment" }],
            delayMs: 800,
          },
          {
            segments: [{ text: "codex> revising test expectations (risky)", tone: "prompt" }],
            dim: true,
            delayMs: 700,
          },
          { segments: [{ text: "$ pytest", tone: "prompt" }], delayMs: 400 },
          {
            segments: [{ text: "→ 3 failures · audit log ordering nondeterministic", tone: "error" }],
            delayMs: 700,
          },
          {
            segments: [
              { text: "codex> 47 minutes elapsed · 600 lines changed · 6 concepts tangled", tone: "comment" },
            ],
            dim: true,
            delayMs: 700,
          },
          { segments: [{ text: "codex> producing patch…", tone: "prompt" }], delayMs: 500 },
          {
            segments: [{ text: '→ PR #512 opened · +612 / −89 · 18 files · "needs review"', tone: "comment" }],
            delayMs: 500,
          },
          {
            segments: [{ text: '→ reviewer (you): "can we split this"', tone: "comment" }],
            delayMs: 500,
          },
        ],
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L05",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'You catch yourself writing: "Add feature X, and while we\'re in there, fix the existing pagination bug, and refactor the error handler." What should you do?',
        options: [
          "Ship it as one task — Codex can handle it.",
          "Split into three tasks. Sequence them so each builds on the last, and each can be reviewed in isolation.",
          'Add "please be careful" to the spec.',
          "Take the weekend off.",
        ],
        correct: 1,
        explanation:
          '"While we\'re in there" is the single most reliable scope-creep signal. Three concepts = three tasks. The pagination fix might even benefit from landing first, so the feature is built on clean foundations.',
      },
    },
  ],
};

export default lesson;
