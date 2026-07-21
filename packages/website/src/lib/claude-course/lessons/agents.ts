// Ported from claude/lessons/07-agents.html.
// Widget manifest: SocraticTutor x1 (tutor), AgentLoop x1 (loop), Quiz x2
// (q1, q2). Wired incrementally (plan 008 stages 6).
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "agents",
  number: 7,
  title: "Agentic Workflows and Tool Use",
  subtitle: "When Claude stops answering and starts doing.",
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
        "A chat is one turn in, one turn out. An agent is Claude in a loop: gather context, take action, verify work, repeat. That's the phrase Anthropic's engineering team uses to describe the shape of every agent they build, from Claude Code to research agents to email assistants. The \"action\" step is a tool call: reading a file, running a search, writing code, hitting an API.\n\nUnder the hood, Claude Code itself is this exact pattern, deliberately kept simple: `while(tool_call) → execute → feed results → repeat`. A single-threaded loop. No swarms. When Claude produces a response without a tool call, the loop ends.\n\n> An agent is Claude with hands, and a loop telling it when to put them down.",
    },
    {
      id: "the-loop-explicit",
      title: "The loop, explicitly",
      readTimeMinutes: 2,
      content:
        "```\n// one agent turn\nplan      ← claude reads goal + state, writes next step\nact       ← claude calls a tool (readFile, bash, search, …)\nobserve   ← tool result appended to the window\nupdate    ← claude integrates the observation\ndecide    ← continue the loop, or stop\n\n// until\n  goal met  |  max steps reached  |  human intervenes\n```\n\nEvery part of that loop is a choice you make when designing the agent. Get them wrong and you have an infinite loop with a credit card.",
    },
    {
      id: "four-guardrails",
      title: "The four guardrails",
      readTimeMinutes: 3,
      content:
        "- **01 · Scope.** Give the agent the smallest set of tools it needs. Every tool is a footgun for something.\n- **02 · Budget.** Max steps. Max tokens. Max wall-clock. Always set all three. An agent without a budget is a bug.\n- **03 · Confirmation.** Destructive actions (delete, deploy, send) should require explicit user confirmation. Claude Code's default is to ask before modifying files or running commands, match that for your own agents.\n- **04 · Verification.** Give the agent a way to check its own work. Linters, type checks, tests, screenshots, concrete rules-based feedback. Agents that can evaluate their output are fundamentally more reliable than ones that can't.\n\n> **Why verification matters most.** Anthropic's engineering team is blunt: the best form of feedback is clearly defined rules for an output, then explaining which rules failed and why. This is why generating TypeScript and linting it beats generating plain JavaScript, more layers of automatic feedback. Design the verification step before you design the action step.",
    },
    {
      id: "when-to-use",
      title: "When to reach for an agent",
      readTimeMinutes: 2,
      content:
        "**Agent fits:** multi-step investigation (trace a bug across files). Research and synthesis (gather data, summarize). Repetitive work with clear stopping criteria.\n\n**Agent overkill:** one-shot writing tasks. Anything where a single structured prompt plus a paste of context would work. Tasks without a crisp \"done\" condition.",
    },
  ],
  widgets: [
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
          "Agents loop. Without a step or token budget, they can churn indefinitely. Always cap.",
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
        persona: "Push on guardrails, budgets, and what \"done\" looks like.",
      },
    },
  ],
};

export default lesson;
