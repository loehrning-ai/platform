// Ported from codex/lessons/01-mental-model.html + codex/js/lessons/L01.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L01",
  number: 1,
  title: "What Codex Actually Is",
  subtitle:
    "A task-oriented coding agent that inspects a repository, changes files, runs checks and returns work for review.",
  durationMinutes: 10,
  trackId: "fundamentals",
  hook: "Agent, not assistant.",
  keyConcepts: [
    "Autonomous agent",
    "Sandbox",
    "Task contract",
    "Vague spec",
    "AGENTS.md",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "What Codex does",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Codex is a **task-oriented coding agent**. It runs locally in the CLI or IDE or in a cloud environment, and every surface follows the same loop:\n\n1. Take the request plus the session and repository context.\n2. Stay within the configured filesystem, command, approval and network limits.\n3. Read the relevant code and plan the changes.\n4. Edit files, run the available checks, read their output and revise.\n5. Return a summary and a **diff** for review; a cloud task can also open a pull request if configured.\n\nLocal sessions can be interactive, cloud tasks run in the background. You review the result against the task and the repository either way.",
        },
        {
          kind: "prose",
          markdown:
            "The active context is a **workboard**: request, relevant code, instructions, command results and the prior turns the surface exposes. A new session may not inherit it. Put durable guidance in `AGENTS.md`, keep check commands executable and restate task constraints in every request.",
        },
      ],
    },
    {
      id: "s2",
      title: "The three things in the contract",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three inputs decide a Codex run. Every technique in this course sharpens one of them.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "01 · the task",
              title: "What you're asking for",
              body: "Goal, constraints, acceptance criteria and out-of-scope. A requirement that is not written here does not exist for Codex.",
            },
            {
              eyebrow: "02 · the repo",
              title: "What the agent can see",
              body: "Files in the selected repository or working directory, including tests, AGENTS.md and documented check commands.",
            },
            {
              eyebrow: "03 · the sandbox",
              title: "What the agent can do",
              body: "Configured filesystem, command, approval and network permissions. Local and cloud environments can differ.",
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "A real session, replayed",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            'The replay above condenses one run of *"add rate limiting to the /login endpoint"*: plan, inspect, edit, test, revise.',
        },
      ],
    },
    {
      id: "s4",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "Two questions at the end of the lesson.",
        },
      ],
    },
    {
      id: "s5",
      title: "Three failure modes, named",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "mode 01",
              title: "Vague spec",
              body: "Codex picks the most plausible reading of an ambiguous goal and commits to it, so the PR solves the wrong problem. Fix: tighten goal and acceptance criteria.",
            },
            {
              eyebrow: "mode 02",
              title: "No conventions",
              body: "Without repository guidance, Codex infers conventions from code and configuration. Fix: document non-obvious rules and exact check commands.",
            },
            {
              eyebrow: "mode 03",
              title: "Broken feedback loop",
              body: "Required checks are missing or undocumented, so the result comes back without verification evidence. Fix: make the commands reproducible and read their output.",
            },
          ],
        },
      ],
    },
    {
      id: "s6",
      title: "Self-check cards",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The cards are at the end of the lesson. Answer out loud, then flip. Nothing is graded.",
        },
      ],
    },
  ]),
  widgets: [
    {
      kind: "terminal-replay",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        lessonId: "L01",
        cpId: "term-1",
        title: 'Session replay: "add rate limiting to /login"',
        windowTitle: "codex@sandbox · task-4a92",
        frames: [
          {
            segments: [{ text: "$ git clone repo && cd repo", tone: "prompt" }],
            dim: true,
            delayMs: 500,
          },
          {
            segments: [
              {
                text: "→ environment ready · python 3.11 · pytest configured",
                tone: "comment",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [{ text: "codex> planning…", tone: "prompt" }],
            delayMs: 600,
          },
          {
            segments: [
              {
                text: "  plan: 1) read /login handler  2) add limiter  3) test",
                tone: "comment",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [{ text: "$ cat api/auth.py", tone: "prompt" }],
            delayMs: 400,
          },
          {
            segments: [
              {
                text: "→ uses Flask · no rate limiting in this handler",
                tone: "comment",
              },
            ],
            delayMs: 500,
          },
          {
            segments: [{ text: "$ cat AGENTS.md | head", tone: "prompt" }],
            delayMs: 400,
          },
          {
            segments: [
              {
                text: "→ found: uses flask-limiter for rate limits. tests in tests/api/",
                tone: "comment",
              },
            ],
            delayMs: 600,
          },
          {
            segments: [
              { text: "$ cat tests/api/test_auth.py", tone: "prompt" },
            ],
            delayMs: 400,
          },
          {
            segments: [
              {
                text: "→ pattern established: pytest fixtures, fake redis",
                tone: "comment",
              },
            ],
            delayMs: 600,
          },
          {
            segments: [
              { text: "codex> editing api/auth.py …", tone: "prompt" },
            ],
            delayMs: 700,
          },
          {
            segments: [
              {
                text: "codex> editing tests/api/test_auth.py …",
                tone: "prompt",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              { text: "$ pytest tests/api/test_auth.py -v", tone: "prompt" },
            ],
            delayMs: 400,
          },
          {
            segments: [
              {
                text: "→ FAIL: test_login_respects_limit (limit=10, got 11)",
                tone: "error",
              },
            ],
            dim: true,
            delayMs: 800,
          },
          {
            segments: [
              {
                text: "codex> revising: off-by-one in limiter window…",
                tone: "prompt",
              },
            ],
            delayMs: 700,
          },
          {
            segments: [
              { text: "$ pytest tests/api/test_auth.py -v", tone: "prompt" },
            ],
            delayMs: 400,
          },
          {
            segments: [{ text: "→ selected tests passed", tone: "output" }],
            delayMs: 600,
          },
          {
            segments: [{ text: "codex> producing patch…", tone: "prompt" }],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: '→ review artifact created: "rate-limit /login (5 req/min per IP)"',
                tone: "comment",
              },
            ],
            delayMs: 500,
          },
          {
            segments: [
              {
                text: "→ diff and selected-test log ready for review",
                tone: "comment",
              },
            ],
            delayMs: 400,
          },
        ],
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L01",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'Your Codex task says only "refactor our auth module." The PR rewrites your user model and breaks three downstream services. What went wrong?',
        options: [
          "Codex has a bug and shouldn't be used for auth.",
          'The task was ambiguous: "refactor auth" spans a huge scope.',
          "The sandbox lacked the downstream services.",
          "It needed write access to prod.",
        ],
        correct: 1,
        explanation:
          'The request sets no boundary between auth module and user model. Narrower: "Extract token validation from api/auth.py into its own module. Keep the public interface. Do not modify User or Session."',
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L01",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "What context can you assume in a new Codex session?",
        options: [
          "The full history of every earlier session on the repository.",
          "Only what the surface loads or you provide.",
          "Only the most recent pull-request description.",
          "All local terminal output from previous runs.",
        ],
        correct: 1,
        explanation:
          "Session history depends on surface and configuration. Versioned instructions, tests and setup files carry project rules reliably; task constraints go into each request.",
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L01",
        cpId: "flash-1",
        title: "Review cards",
        copy: {
          kindLabel: "Review",
          revealHint: "Click to reveal ↻",
          backLabel: "Answer",
          flipBackHint: "Click to flip back",
          prevLabel: "← Prev",
          nextLabel: "Next →",
          emptyLabel: "No cards available.",
          ariaLabelTemplate:
            "Flashcard {current} of {total}. Press Space or click to flip.",
        },
        cards: [
          {
            term: "Mental model",
            q: "What is Codex, in one sentence?",
            a: "A task-oriented coding agent that changes a repository, runs checks and returns a diff or pull request for review.",
          },
          {
            term: "Contract",
            q: "What are the three inputs to a coding-agent run?",
            a: "The task, the repository context the session sees, and the environment's permissions and tools.",
          },
          {
            term: "Failure modes",
            q: "Name the three classic ways coding-agent runs fail.",
            a: "Vague spec, no conventions and a broken feedback loop. Each maps to one contract input.",
          },
          {
            term: "Persistence",
            q: 'How does an agentic coding tool "remember" things between runs?',
            a: "Not reliably. Keep durable rules in versioned files and restate task constraints in each request.",
          },
          {
            term: "The shift",
            q: "How does a coding agent differ from autocomplete like Copilot?",
            a: "Autocomplete suggests code at the cursor. A coding agent reads multiple files, runs tools and carries a bounded task to a reviewable diff.",
          },
          {
            term: "The blackboard",
            q: "Which mental model explains why context matters so much?",
            a: "A workboard holding only the current request, repository, instructions, tool results and available history.",
          },
        ],
      },
    },
  ],
};

export default lesson;
