// Ported from codex/lessons/01-mental-model.html + codex/js/lessons/L01.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L01",
  number: 1,
  title: "What Codex Actually Is",
  subtitle:
    "A task-oriented coding agent that can inspect a repository, change files, run checks, and return work for review.",
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
      title: "An agent, not an assistant",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "You write one sentence. Codex reads the repository, edits files, runs the checks it can find, and hands back a diff. That is a **task-oriented coding agent**. It works locally in the CLI or IDE and in dedicated cloud environments. Interface and permission model differ by surface, the loop underneath does not:\n\n1. It receives your request plus the context available in the current session and repository.\n2. It operates within configured filesystem, command, approval, and network boundaries.\n3. It examines the relevant code and determines a sequence of changes.\n4. It edits files, runs available checks, reads their output, and revises when needed.\n5. It returns a summary and a **diff** or patch for review. A cloud task can also open a pull request when that workflow is configured.\n\nDelegation with inspection points. Local sessions can be interactive, cloud tasks can continue in the background. Either way the result still needs review against the task and the repository evidence.",
        },
        {
          kind: "pull-quote",
          text: 'A bounded engineering task with review. Not "autocomplete at the cursor."',
        },
        {
          kind: "prose",
          markdown:
            "Why insist on the framing? It makes failures addressable. An ambiguous request permits several valid interpretations, missing acceptance criteria make done a matter of taste, and unavailable tests leave correctness unverified. The next lessons turn each gap into an explicit task input.\n\nThe active context is a **workboard**: the request, relevant code, instructions, command results, and the prior turns the current surface exposes. Nothing guarantees a new session inherits it. So durable repository guidance goes in `AGENTS.md`, verification commands stay executable, and task-specific constraints get restated in the request. Every time.",
        },
      ],
      keyTakeaway:
        "Codex inspects, edits, and tests inside configured boundaries. The output is a reviewable change, not proof the task is correct.",
    },
    {
      id: "s2",
      title: "The three things in the contract",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three inputs decide a Codex run. Name them and the failures stop being mysterious.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "01 · the task",
              title: "What you're asking for",
              body: "Goal, constraints, acceptance criteria, out-of-scope. The whole brief. A requirement that is not written here does not exist to Codex.",
            },
            {
              eyebrow: "02 · the repo",
              title: "What the agent can see",
              body: "The files available in the selected repository or working directory, including tests, AGENTS.md instructions, and documented check commands.",
            },
            {
              eyebrow: "03 · the sandbox",
              title: "What the agent can do",
              body: "The configured filesystem, command, approval, and network permissions. Local and cloud environments can expose different capabilities.",
            },
          ],
        },
        {
          kind: "callout",
          title: "The contract rule.",
          body: "An ambiguous task permits scope drift. Missing repository guidance leaves local conventions to guesswork. Unavailable checks leave changes unverified. Every technique in this course sharpens one of those three inputs.",
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
            'Words are cheap. Here is a condensed replay of one task, *"add rate limiting to the /login endpoint"*. Plan, probe, try, test, revise. That is the shape of a run.',
        },
      ],
      keyTakeaway:
        "A run can include planning, inspection, edits, checks, revision, and a final diff.",
    },
    {
      id: "s4",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "Two questions on what you just read.",
        },
      ],
    },
    {
      id: "s5",
      title: "Three failure modes, named",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "Three patterns keep coming back. Each one is checkable.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "mode 01",
              title: "Vague spec",
              body: "The agent interprets an ambiguous goal, picks the most plausible interpretation, and commits to it. PR arrives solving the wrong problem. Fix: tighten goal and acceptance criteria.",
            },
            {
              eyebrow: "mode 02",
              title: "No conventions",
              body: "Without repository guidance, Codex must infer conventions from code and configuration. Fix: document non-obvious rules and exact check commands in the repository.",
            },
            {
              eyebrow: "mode 03",
              title: "Broken feedback loop",
              body: "Required checks are unavailable or undocumented, so the returned result lacks verification evidence. Fix: make the relevant commands reproducible and inspect their output.",
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
            "Read the question, say your answer out loud, then flip the card. Self-check, not a grade.",
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
          'You open a Codex task: "refactor our auth module." No other detail. The agent returns a PR that rewrites your user model and breaks three downstream services. What went wrong?',
        options: [
          "Codex has a bug and shouldn't be used for auth.",
          'The task was ambiguous, "refactor auth" spans a huge scope and the agent picked an aggressive interpretation.',
          "The sandbox didn't have the downstream services available.",
          "You needed to give it write access to prod.",
        ],
        correct: 1,
        explanation:
          'The request does not define the intended boundary between the auth module and the user model. Narrow it: "Extract token validation from api/auth.py into a standalone module. Keep the public interface unchanged. Do not modify User or Session."',
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
          "What context should you assume will be available in a new Codex session?",
        options: [
          "The complete history of every earlier session on that repository.",
          "Only context the current surface loads or you provide; keep durable project rules in versioned instructions and configuration.",
          "Only the most recent pull-request description.",
          "All local terminal output from previous runs.",
        ],
        correct: 1,
        explanation:
          "Session history and environment behavior vary by Codex surface and configuration. Versioned instructions, tests, and setup files are the reliable place for project rules; task-specific constraints still belong in the current request.",
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L01",
        cpId: "flash-1",
        title: "One exercise before you move on",
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
            a: "A task-oriented coding agent that can inspect and change a repository, run available checks, and return a diff or pull request for review.",
          },
          {
            term: "Contract",
            q: "What are the three inputs to a coding-agent run?",
            a: "The task, the repository context available to the session, and the environment permissions and tools.",
          },
          {
            term: "Failure modes",
            q: "Name the three classic ways agentic coding runs fail.",
            a: "Vague spec (ambiguous goal), no conventions (no AGENTS.md / CLAUDE.md), and broken feedback loop (tests don't run). Each maps to one part of the contract.",
          },
          {
            term: "Persistence",
            q: 'How does an agentic coding tool "remember" things between runs?',
            a: "Do not assume prior context transfers. Store durable rules in versioned instructions, tests, documentation, and environment configuration; restate task-specific constraints.",
          },
          {
            term: "The shift",
            q: "How is an autonomous coding agent different from autocomplete tools like Copilot?",
            a: "Autocomplete proposes code at the cursor. A coding agent can inspect multiple files, run tools, and carry a bounded task through to a reviewable diff; some agent surfaces are interactive and others run in the background.",
          },
          {
            term: "The blackboard",
            q: "What mental model helps explain why context matters so much in agentic coding?",
            a: "Treat active context as a workboard assembled from the current request, repository, instructions, tool results, and available conversation history. Put durable rules in versioned files.",
          },
        ],
      },
    },
  ],
};

export default lesson;
