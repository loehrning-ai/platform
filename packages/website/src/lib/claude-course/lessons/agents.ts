// Ported from claude/lessons/07-agents.html.
// Widget manifest: SocraticTutor x1 (tutor), AgentLoop x1 (loop), Quiz x2
// (q1, q2). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "agents",
  number: 7,
  title: "Agentic Workflows and Tool Use",
  subtitle:
    "Design tool loops with explicit authority, limits, and verification.",
  durationMinutes: 11,
  trackId: "advanced",
  hook: "Agents are loops. Loops need guardrails.",
  keyConcepts: [
    "Gather context, act, verify, repeat",
    "Scope, budget, confirmation, verification",
  ],
  quiz: [],
  sections: [
    {
      id: "agents-vs-chat",
      title: "Agents vs. chat",
      readTimeMinutes: 2,
      content:
        "An agent is not a smarter chat. Anthropic distinguishes workflows from agents. A workflow follows code-defined paths; an agent lets a model pick actions and tools from intermediate results. Both use model calls, retrieval, and tools.\n\nA basic agent loop sends the current goal and state to a model, validates a requested tool call, runs it within policy, returns the result, and checks a stopping condition. Production systems add parallel work, queues, approvals, retries, and state persistence.\n\n> Tool access creates authority. Bound that authority in code and infrastructure.",
    },
    {
      id: "the-loop-explicit",
      title: "The loop, explicitly",
      readTimeMinutes: 2,
      content:
        "```\n// one agent turn\nrequest   ← model receives goal + allowed state\npropose   ← model returns a response or tool request\nvalidate  ← harness checks schema, permission, and policy\nexecute   ← approved tool runs\nrecord    ← result and side effects are logged\ndecide    ← continue, stop, or request human input\n\n// until\n  acceptance checks pass | a limit is reached | a person intervenes\n```\n\nDefine termination, retries, idempotency, and recovery before granting write access. A prompt-level request to stop is not an enforcement boundary.",
    },
    {
      id: "four-guardrails",
      title: "The four guardrails",
      readTimeMinutes: 3,
      content:
        "- **01 · Scope.** Expose only required tools, resources, and network destinations. Separate read and write permissions.\n- **02 · Limits.** Bound steps, tokens, time, cost, retries, and concurrency. Which limits bite depends on the system.\n- **03 · Approval and policy.** Require approval for consequential actions such as deletion, deployment, payment, or external messaging. Product defaults and permission modes vary, so inspect the active configuration.\n- **04 · Verification.** Check outcomes with deterministic tools wherever you can, using schemas, linters, type checks, tests, screenshots, and read-after-write confirmation.\n\nVerification does not make an agent correct. It makes defined failures visible. Add negative tests, and check the verifier measures the outcome you care about, not a proxy.",
    },
    {
      id: "when-to-use",
      title: "When to reach for an agent",
      readTimeMinutes: 2,
      content:
        "**Agent fit:** a multi-step task where later actions depend on tool results, the environment gives verifiable feedback, and the latency and cost are justified.\n\n**Prefer a workflow or single call:** a fixed sequence, a one-shot transformation, or a task without a defensible stopping condition. Start with the least complex architecture that clears the evaluated requirement.",
    },
  ],
  widgets: [
    {
      kind: "agent-loop",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "agents",
        cpId: "loop",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "agents",
        cpId: "q1",
        question:
          "An agent has no max-step budget. What's the most likely failure mode?",
        options: [
          "The agent refuses to start.",
          "The agent runs until tokens/budget are exhausted, often without converging.",
          "The agent produces zero output.",
          "Nothing, budgets are optional.",
        ],
        correct: 1,
        explanation:
          "Without an enforced stopping limit, the harness can continue issuing model and tool calls until another resource or external limit stops it.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "agents",
        cpId: "q2",
        question: "Which task is an agent overkill?",
        options: [
          "Summarize a meeting transcript into 5 bullets.",
          "Investigate a flaky test across 4 files.",
          "Gather data from 3 dashboards and draft a weekly update.",
          "Repeatedly fix lint errors across a monorepo until clean.",
        ],
        correct: 0,
        explanation:
          "A single prompt plus the transcript is enough. Agents earn their complexity when the task needs multiple tool calls.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "socratic-tutor",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "agents",
        cpId: "tutor",
        topic: "designing agentic workflows safely",
        persona: 'Push on guardrails, budgets, and what "done" looks like.',
      },
    },
  ],
};

export default lesson;
