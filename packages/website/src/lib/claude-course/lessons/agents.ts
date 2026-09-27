// Ported from claude/lessons/07-agents.html.
// Widget manifest: SocraticTutor x1 (tutor), AgentLoop x1 (loop), Quiz x2
// (q1, q2). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "agents",
  number: 7,
  title: "Agentic workflows and tool use",
  subtitle:
    "Design tool loops with bounded authority, limits, and verification.",
  durationMinutes: 11,
  trackId: "advanced",
  hook: "An agent works in loops and needs enforced limits.",
  keyConcepts: [
    "Gather context, act, verify, repeat",
    "Scope, budget, confirmation, verification",
  ],
  quiz: [],
  sections: [
    {
      id: "agents-vs-chat",
      title: "Agents and workflows",
      readTimeMinutes: 1,
      content:
        "Anthropic distinguishes workflows, which follow code-defined paths, from agents, where a model picks actions and tools from intermediate results.\n\nA basic loop sends goal and state to the model, validates the requested tool call, runs it within policy, returns the result and checks a stopping condition. Production adds parallelism, queues, approvals, retries and persisted state. Tool access is authority, so bound it in code and infrastructure.",
    },
    {
      id: "the-loop-explicit",
      title: "The loop",
      readTimeMinutes: 2,
      content:
        "```\n// one agent turn\nrequest   ← model receives goal + allowed state\npropose   ← model returns a response or tool request\nvalidate  ← harness checks schema, permission, and policy\nexecute   ← approved tool runs\nrecord    ← result and side effects are logged\ndecide    ← continue, stop, or request human input\n\n// until\n  acceptance checks pass | a limit is reached | a person intervenes\n```\n\nDefine termination, retries, idempotency and recovery before granting write access; a stop request in the prompt enforces nothing.",
    },
    {
      id: "four-guardrails",
      title: "Guardrails",
      readTimeMinutes: 1,
      content:
        "- **01 · Scope.** Grant only the tools, resources and destinations the task needs; separate read from write.\n- **02 · Limits.** Cap steps, tokens, time, cost, retries and concurrency.\n- **03 · Approval.** Enforce approval for deletion, deployment, payment or external messages, and inspect the active permission mode.\n- **04 · Verification.** Deterministic checks where possible: schemas, linters, type checks, tests, screenshots, read-after-write.\n\nVerification exposes defined failures but does not make an agent correct. Add negative tests and check that the verifier measures the outcome, not a proxy.",
    },
    {
      id: "when-to-use",
      title: "When an agent fits",
      readTimeMinutes: 1,
      content:
        "**Agent fit:** multi-step work where later actions depend on tool results, the environment gives checkable feedback, and latency and cost are justified.\n\n**Workflow or single call:** fixed sequences, one-shot transformations or tasks without a defensible stopping condition. Start with the simplest architecture that meets the requirement.",
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
          "It keeps running until another limit stops it, often without converging.",
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
