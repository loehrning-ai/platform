// Ported from codex/lessons/01-mental-model.html + codex/js/lessons/L01.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L01",
  number: 1,
  title: "What Codex Actually Is",
  subtitle:
    "An autonomous agent, not an autocomplete. Get this wrong and every task spec after is working against the model's actual shape.",
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
            "Your starting mental model matters more than any prompting trick you'll ever learn. Codex is not Copilot with a bigger context window. It's not a chat assistant that can read your repo. Those comparisons feel intuitive and are wrong, they lead people to write tasks that are shaped for the wrong thing.\n\nThe same is true of Claude Code, GitHub Copilot Workspace, and other modern agentic coding tools: all of them follow the same pattern. They are **autonomous software engineering agents**. When you give one a task, the following happens, every time, in this order:\n\n1. It receives your task description and any context you have given it (repo contents, convention file, prior examples).\n2. It spins up a fresh, isolated sandbox with your repo cloned into it.\n3. It plans a series of steps to complete your task.\n4. It executes those steps, reading files, editing code, running tests, reading the output, revising.\n5. When it thinks it's done, it produces a **patch**, a diff of the changes it wants to make.\n6. That patch lands as a pull request (or a diff, depending on the tool) for you to review and merge.\n\nNone of this is magic, and none of it is interactive. You hand over a task. Some minutes later, a PR shows up. In between, the agent was alone in a box.",
        },
        {
          kind: "pull-quote",
          text: "Think \"junior engineer you handed a Jira ticket,\" not \"assistant you're pair-programming with.\"",
        },
        {
          kind: "prose",
          markdown:
            "This framing fixes most failure modes. A junior engineer with a vague ticket flails and delivers the wrong thing. A junior engineer with no acceptance criteria ships something that kind of works. A junior engineer with no access to your test suite guesses at correctness. The fixes for all three are obvious when you name them, and we'll spend the next eleven lessons doing exactly that.\n\nOne more mental model worth pinning: think of the agent's context window as a **blackboard**. Everything the agent knows about your task, your codebase, and your conventions must be written on that blackboard before the run starts. Nothing persists between runs. When the session ends, the blackboard is erased. Your `AGENTS.md`, your task spec, and your test suite are how you write on that blackboard, reliably, every time.",
        },
      ],
      keyTakeaway:
        "Codex is an autonomous software engineering agent that plans, edits, tests, and hands back a patch — with nothing interactive in between.",
    },
    {
      id: "s2",
      title: "The three things in the contract",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Every Codex run is a small contract between you and the agent. Three things are always in play. If you can name them, you can reason about why runs succeed or fail.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "01 · the task",
              title: "What you're asking for",
              body: "Goal, constraints, acceptance criteria, out-of-scope. This is the entire situational brief. If a requirement isn't here, it doesn't exist to Codex.",
            },
            {
              eyebrow: "02 · the repo",
              title: "What the agent can see",
              body: "The full codebase, the tests, the AGENTS.md conventions, configured lint and CI commands. Whatever the sandbox has installed.",
            },
            {
              eyebrow: "03 · the sandbox",
              title: "What the agent can do",
              body: "Run commands, read files, write files, execute tests, install dependencies. No network unless you grant it. Ephemeral, every run starts clean.",
            },
          ],
        },
        {
          kind: "callout",
          title: "The contract rule.",
          body: "A Codex run's quality is bounded by these three things. Vague task leads to a flaky run. Missing repo context (no AGENTS.md) leads to a generic PR. Broken sandbox (tests don't run) leads to unverifiable changes. Every technique in this course tightens one of these three.",
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
            "Words are cheap. Here's a condensed replay of what Codex does when you give it the task *\"add rate limiting to the /login endpoint\"*. This is the real shape of a run: plan, probe, try, test, revise.",
        },
      ],
      keyTakeaway:
        "A run is plan, probe, try, test, revise, patch — never a straight line from task to code.",
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
          markdown:
            "Most bad Codex runs trace to one of these three. Learn to name them and the fix is usually obvious.",
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
              body: "Without AGENTS.md, Codex writes reasonable generic code. It won't match your style, your error-handling pattern, your test layout. Fix: commit conventions to the repo.",
            },
            {
              eyebrow: "mode 03",
              title: "Broken feedback loop",
              body: "Tests don't run in the sandbox, or the command isn't documented. Agent can't verify its own work. Ships hopeful code. Fix: make tests runnable with one command.",
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
            "Here are three questions about Codex. Your answer doesn't matter, this is a self-check. Read each, say the answer out loud, then flip the card.",
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
              { text: "→ sandbox ready · 47 files · python 3.11 · pytest configured", tone: "comment" },
            ],
            delayMs: 700,
          },
          { segments: [{ text: "codex> planning…", tone: "prompt" }], delayMs: 600 },
          {
            segments: [{ text: "  plan: 1) read /login handler  2) add limiter  3) test", tone: "comment" }],
            delayMs: 700,
          },
          { segments: [{ text: "$ cat api/auth.py", tone: "prompt" }], delayMs: 400 },
          {
            segments: [{ text: "→ 128 lines · uses flask · no rate limiting", tone: "comment" }],
            delayMs: 500,
          },
          { segments: [{ text: "$ cat AGENTS.md | head", tone: "prompt" }], delayMs: 400 },
          {
            segments: [
              { text: "→ found: uses flask-limiter for rate limits. tests in tests/api/", tone: "comment" },
            ],
            delayMs: 600,
          },
          { segments: [{ text: "$ cat tests/api/test_auth.py", tone: "prompt" }], delayMs: 400 },
          {
            segments: [{ text: "→ pattern established: pytest fixtures, fake redis", tone: "comment" }],
            delayMs: 600,
          },
          { segments: [{ text: "codex> editing api/auth.py …", tone: "prompt" }], delayMs: 700 },
          {
            segments: [{ text: "codex> editing tests/api/test_auth.py …", tone: "prompt" }],
            delayMs: 700,
          },
          {
            segments: [{ text: "$ pytest tests/api/test_auth.py -v", tone: "prompt" }],
            delayMs: 400,
          },
          {
            segments: [
              { text: "→ FAIL: test_login_respects_limit (limit=10, got 11)", tone: "error" },
            ],
            dim: true,
            delayMs: 800,
          },
          {
            segments: [{ text: "codex> revising: off-by-one in limiter window…", tone: "prompt" }],
            delayMs: 700,
          },
          {
            segments: [{ text: "$ pytest tests/api/test_auth.py -v", tone: "prompt" }],
            delayMs: 400,
          },
          { segments: [{ text: "→ 6 passed in 0.4s", tone: "output" }], delayMs: 600 },
          { segments: [{ text: "codex> producing patch…", tone: "prompt" }], delayMs: 500 },
          {
            segments: [
              { text: '→ PR #482 opened: "rate-limit /login (5 req/min per IP)"', tone: "comment" },
            ],
            delayMs: 500,
          },
          {
            segments: [
              { text: "→ +34 / −2 lines across 2 files · tests: 6 new, all passing", tone: "comment" },
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
          "The task was ambiguous — \"refactor auth\" spans a huge scope and the agent picked an aggressive interpretation.",
          "The sandbox didn't have the downstream services available.",
          "You needed to give it write access to prod.",
        ],
        correct: 1,
        explanation:
          'Classic vague spec. Codex doesn\'t know where your auth module ends and your user model begins. Given only "refactor auth," it picks the most plausible interpretation, usually the biggest one, and goes. Fix: scope down. "Extract the token-validation logic from api/auth.py into a standalone module, keeping the public interface identical. Do not touch User or Session."',
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
          "Between two Codex runs on the same repo, does the agent remember what you discussed last time?",
        options: [
          "Yes — Codex has persistent memory across sessions.",
          "No — every run gets a fresh sandbox. The only persistence is what's committed to your repo (AGENTS.md, tests, docs).",
          "Only within the same conversation thread.",
          "Only if you're on the team plan.",
        ],
        correct: 1,
        explanation:
          "Every run is ephemeral. The sandbox is destroyed after the PR is produced. The persistence mechanism isn't memory, it's your convention file (AGENTS.md for Codex, CLAUDE.md for Claude Code, or equivalent) and your test suite. That's why those are the two biggest leverage points in this course.",
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
          ariaLabelTemplate: "Flashcard {current} of {total}. Press Space or click to flip.",
        },
        cards: [
          {
            term: "Mental model",
            q: "What is Codex, in one sentence?",
            a: "An autonomous software engineering agent that runs in an isolated sandbox, works alone on your task, and hands back a pull request.",
          },
          {
            term: "Contract",
            q: "What are the three parts of every agent run?",
            a: "The task (what you asked for), the repo (what the agent can see, including AGENTS.md or CLAUDE.md), and the sandbox (what the agent can do, run tests, install deps, etc).",
          },
          {
            term: "Failure modes",
            q: "Name the three classic ways agentic coding runs fail.",
            a: "Vague spec (ambiguous goal), no conventions (no AGENTS.md / CLAUDE.md), and broken feedback loop (tests don't run). Each maps to one part of the contract.",
          },
          {
            term: "Persistence",
            q: 'How does an agentic coding tool "remember" things between runs?',
            a: "It doesn't. Memory is whatever you commit to the repo: AGENTS.md (or CLAUDE.md) for conventions, the test suite for correctness, docs for context. Every run starts from a fresh sandbox.",
          },
          {
            term: "The shift",
            q: "How is an autonomous coding agent different from autocomplete tools like Copilot?",
            a: "Copilot is synchronous pair-programming, it responds inline as you type. Agentic tools (Codex, Claude Code, Copilot Workspace) are asynchronous task delegation, you hand over a full task and get a diff or PR back. Nothing in between is interactive.",
          },
          {
            term: "The blackboard",
            q: "What mental model helps explain why context matters so much in agentic coding?",
            a: "Think of the context window as a blackboard. Everything the agent knows, your task, conventions, test commands, codebase shape, must be written there before the run starts. Nothing persists between runs. The blackboard is erased when the session ends.",
          },
        ],
      },
    },
  ],
};

export default lesson;
