// Ported from codex/lessons/05-scope.html + codex/js/lessons/L05.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L05",
  number: 5,
  title: "Scoping Coherent Changes",
  subtitle:
    "Separate work by behavior, dependency, and review boundary instead of relying on arbitrary time, file, or line limits.",
  durationMinutes: 12,
  trackId: "task-craft",
  hook: "Keep each change to one reviewable purpose.",
  keyConcepts: [
    "Task sizing",
    "Slicing moves",
    "Bounded changes",
    "Scope creep",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "A reviewable unit of work",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "A reviewable task usually:\n\n- changes one observable behavior or one enabling structure;\n- has dependencies you can name before implementation;\n- has a diff a reviewer can understand as one decision;\n- includes checks that exercise the changed behavior;\n- can be reverted without removing unrelated work.\n\nSplit a task when its parts can be implemented, verified, deployed or rolled back independently. Keep coupled changes together when splitting them would create an invalid intermediate state.",
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
          markdown:
            "Pick the pattern that keeps intermediate states valid and ownership clear.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "move 01 · horizontal",
              title: "Split by layer",
              body: "Separate schema, API and interface changes when each layer can land compatibly. State the order and the temporary contract between layers.",
            },
            {
              eyebrow: "move 02 · vertical",
              title: "Split by entity",
              body: "Apply the same behavior to Users, Projects and Teams as separate tasks when their code and rollout are independent. Shared infrastructure lands first.",
            },
            {
              eyebrow: "move 03 · prep/do",
              title: "Do the plumbing first",
              body: "First land a behavior-preserving structural change with its own checks, then build the feature on top. Keep both in one task if the first has no standalone value or safe state.",
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Bounded changes",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "**Change only what the current task requires.** Record independent defects and cleanup ideas for a separate diff.\n\n*Scope creep* mixes the requested behavior with unrelated refactoring, dependency changes and test rewrites, and a revert removes all of them together. Catch it by comparing changed files and behaviors with the task's goal, constraints and exclusions, however useful the extra code looks.",
        },
        {
          kind: "prose",
          markdown:
            "Name the boundary in the task: *\"Change only files required for this task. Record unrelated issues in the pull-request description without fixing them.\"* Extra work then shows up in review, but the sentence does not replace a concrete scope. Compare:\n\n```\n# Too open\n## Goal\nAdd pagination to the users list endpoint. The current implementation\nreturns all users; we need page-based results.\n\n# Explicit behavior and scope\n## Goal\nAdd page and page_size query params to GET /users in api/users.py.\nDefault: page=1, page_size=20. Max page_size=100 (return 400 if exceeded).\nReturn {\"items\": [...], \"total\": N, \"page\": N, \"pages\": N}.\n\n## Scope\nChange api/users.py and tests/api/test_users.py. If another file is required,\nexplain why before changing it.\n```",
        },
      ],
    },
    {
      id: "s4",
      title: "Scope warning signs",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The words \"also\", \"while there\" and \"as needed\" hide a second decision. Name it and decide whether it belongs in this change.",
        },
      ],
    },
    {
      id: "s5",
      title: "Illustrative broad task",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The replay at the end puts schema, query, endpoint, audit and migration work into one task. Failures become hard to attribute.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "One question at the end of the lesson." },
      ],
    },
  ]),
  widgets: [
    {
      kind: "compare",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: "Same goal, before and after slicing",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Too big, one task",
        goodLabel: "Sliced, three tasks",
        bad: 'Goal\nAdd soft-delete to Users, Projects, and Teams.\nInclude a "restore" endpoint for each.\nAlso add an audit log of who deleted what.\nMigrate existing hard-deletes we\'ve been stashing in cold storage.',
        good: "Task A: schema\nAdd deleted_at and deleted_by to users, projects, teams.\nAdd migration. Don't touch queries yet.\n\nTask B: API\nUpdate list/get endpoints to filter deleted_at IS NULL.\nAdd DELETE → sets deleted_at. Add POST /restore.\n\nTask C: audit\nLog soft-deletes to the audit_events table.\nMigrate cold-storage rows in a separate PR.",
        note: "The broad version couples schema, API, audit and data migration. The sliced version states dependencies and gives each concern its own review and rollback boundary.",
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
          {
            segments: [
              { text: "codex> planning the four-part task…", tone: "prompt" },
            ],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: "  plan: schema → queries → endpoints → audit log → migration",
                tone: "comment",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              {
                text: "codex> editing models and schema tests",
                tone: "prompt",
              },
            ],
            delayMs: 600,
          },
          {
            segments: [
              { text: "codex> editing query functions", tone: "prompt" },
            ],
            delayMs: 700,
          },
          { segments: [{ text: "$ pytest", tone: "prompt" }], delayMs: 400 },
          {
            segments: [
              {
                text: "→ failures span schema, query, and existing hard-delete behavior",
                tone: "error",
              },
            ],
            delayMs: 800,
          },
          {
            segments: [
              {
                text: "codex> investigating unrelated failures…",
                tone: "prompt",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              {
                text: "  found: two existing tests depend on hard-delete behavior",
                tone: "comment",
              },
            ],
            delayMs: 800,
          },
          {
            segments: [
              {
                text: "codex> revising test expectations (risky)",
                tone: "prompt",
              },
            ],
            dim: true,
            delayMs: 700,
          },
          { segments: [{ text: "$ pytest", tone: "prompt" }], delayMs: 400 },
          {
            segments: [
              {
                text: "→ remaining failure: audit-log ordering is nondeterministic",
                tone: "error",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              {
                text: "codex> diff spans several independently reviewable concerns",
                tone: "comment",
              },
            ],
            dim: true,
            delayMs: 700,
          },
          {
            segments: [{ text: "codex> producing patch…", tone: "prompt" }],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: '→ result contains schema, API, audit, and migration changes · "needs review"',
                tone: "comment",
              },
            ],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: '→ reviewer (you): "can we split this"',
                tone: "comment",
              },
            ],
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
          "You write: \"Add feature X, and while we're in there, fix the pagination bug and refactor the error handler.\" What should you do?",
        options: [
          "Keep it as one task because the changes share a ticket.",
          "Split it into three tasks, ordered by dependency, each reviewable alone.",
          'Add "please be careful" to the spec.',
          "Remove the acceptance criteria to shorten the task.",
        ],
        correct: 1,
        explanation:
          "The sentence holds a feature, an independent bug fix and a refactor. Each needs its own behavior, evidence and review boundary, ordered only where a real dependency exists.",
      },
    },
  ],
};

export default lesson;
