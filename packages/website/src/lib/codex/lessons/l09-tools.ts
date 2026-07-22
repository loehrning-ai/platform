// Ported from codex/lessons/09-tools.html + codex/js/lessons/L09.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_COMPARE_KIND_LABEL } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L09",
  number: 9,
  title: "The AI Tools Ecosystem",
  subtitle:
    "Claude Code, Copilot, Cursor, Aider, Cline, each solves a different slice of the problem. Picking the wrong one for a job is expensive. Picking the right one is a force multiplier.",
  durationMinutes: 11,
  trackId: "in-the-loop",
  hook: "Know the landscape.",
  keyConcepts: ["Tool landscape", "MCP", "Task-shape fit", "IDE integration"],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "The landscape",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The AI coding landscape fragmented fast. In 2023 there was essentially one tool. In 2025 there are five major categories, each with a different philosophy: inline completions, chat-driven editing, CLI agents, IDE-native agents, and autonomous PR generators. They are not interchangeable.\n\nThe mistake most developers make is treating their first tool as a permanent tool, defaulting to Copilot autocomplete for tasks that need a full agent, or spinning up an autonomous agent for a one-liner fix that would take seconds in an IDE. The cost is compounded daily.\n\nThis lesson is a map. Know the landscape, and you spend your time in flow rather than fighting your toolchain.",
        },
      ],
    },
    {
      id: "s2",
      title: "The five major tools",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "GitHub Copilot",
              title: "The inline completer",
              body: "Lives in your editor. Autocompletes at the cursor. Best for: boilerplate, repetitive patterns, filling out function bodies you already know the shape of. Worst for: architectural decisions, multi-file refactors.",
            },
            {
              eyebrow: "Cursor",
              title: "The IDE-native agent",
              body: "A VSCode fork with AI deeply woven in. Chat with the whole codebase as context. Agent mode can run terminal commands, edit multiple files, and iterate. Best for: interactive brownfield exploration.",
            },
            {
              eyebrow: "Claude Code",
              title: "The terminal-first agent",
              body: "Runs in your existing terminal. Full repo access, shell execution, no dedicated IDE. Best for: developers who live in the terminal. Integrates naturally with git, CI, and custom scripts via hooks.",
            },
            {
              eyebrow: "Aider",
              title: "The open-source CLI agent",
              body: "Open-source, model-agnostic CLI. You pick the model (GPT-4, Claude, Gemini). Best for: teams that want to bring their own API keys, want full auditability, or need to run air-gapped.",
            },
            {
              eyebrow: "Cline (formerly Claude Dev)",
              title: "The VSCode extension agent",
              body: "VSCode extension that gives you an agentic AI inside your existing editor, not a fork. Supports multiple models. Best for: teams already on VSCode. MCP support makes it highly extensible.",
            },
            {
              eyebrow: "Codex (OpenAI)",
              title: "The cloud PR agent",
              body: "The subject of this course. Runs in an isolated cloud sandbox. Async, you submit a task, come back to a PR. Best for: high-volume parallel work, tasks you can fully specify upfront.",
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Choosing by task shape",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The right tool depends on the task shape, not on loyalty to a vendor. A rough decision tree:\n\n- **You know what you want and it's one file** → Copilot autocomplete is fastest. Don't spawn an agent.\n- **You want to explore a codebase you don't know** → Cursor or Cline. Chat with context, ask questions, steer in real time.\n- **You have a well-specified task and want your hands free** → Codex (cloud) or Aider (local). Write the spec, let it run, review the PR.\n- **You live in the terminal and want a capable REPL-style agent** → Claude Code. Fast, composable, hooks into your existing workflow.\n- **You need model flexibility or air-gapped operation** → Aider. Bring your own model.",
        },
      ],
    },
    {
      id: "s4",
      title: "MCP servers",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "MCP stands for Model Context Protocol, a standard for connecting AI agents to external tools, data sources, and services. Think of it as a plugin system for your agent.\n\nWithout MCP, an agent can only see your local filesystem and run shell commands. With MCP, it can query a database, search the web, create GitHub issues, read Slack threads, or call any API, all through a standard interface the agent already knows how to use.\n\nThe architecture is simple:\n\n```\n# How MCP works (conceptually)\n\n# 1. You configure MCP servers in your agent's config\n#    (e.g. ~/.claude/settings.json for Claude Code)\n\n# 2. Each server exposes \"tools\", named functions the agent can call\n#    e.g. mcp__github__create_issue({ title, body, labels })\n#         mcp__postgres__query({ sql })\n#         mcp__slack__send_message({ channel, text })\n\n# 3. The agent decides when to call them, just like any other tool\n#    You don't have to orchestrate the calls manually\n\n# Example: Claude Code with GitHub and Postgres MCP servers\n# Agent can now: read the DB schema, open a GitHub issue,\n# and commit a migration, all in one session\n```\n\nSupported by: Claude Code, Cline, Cursor (via extensions), and a growing list of other agents. MCP servers exist for GitHub, GitLab, Postgres, Supabase, Stripe, Slack, Google Drive, Jira, Linear, and dozens more. You can also write custom MCP servers for your internal tools.\n\nThe practical upside: your agent can participate in your full toolchain, not just your local filesystem. A task that previously required manual steps (\"run the query, paste the result into the prompt\") becomes a single agent-handled loop.",
        },
      ],
    },
    {
      id: "s5",
      title: "IDE integration",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Even non-IDE tools (Codex, Aider, Claude Code) integrate with your editor workflow. The common patterns:\n\n- **Diff review in your editor:** Codex and Aider both produce git diffs. Open the PR in your editor's git UI to review, same flow as any human PR.\n- **Running agents on save:** Some teams configure Claude Code or Aider to run a quick check (lint, type check, failing tests only) on every file save. Tight feedback loop without context-switching.\n- **Editor context for the CLI:** Claude Code can read your currently-open files from many editors via filesystem watching. You don't have to paste files, just reference them by name.\n- **Parallel sessions:** Use git worktrees (next lesson) to run an agent on a feature branch while you keep working in main. No context conflicts between the sessions.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on tool selection and MCP." }],
    },
  ]),
  widgets: [
    {
      kind: "compare",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: "Same task, two tool choices",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Over-engineered",
        goodLabel: "Right-sized",
        bad:
          "Task: add a missing JSDoc comment to one function.\n\nApproach: spin up a Codex cloud task, write a spec, wait 4 minutes for the sandbox, get a PR, open a review.\n\nCost: ~5 minutes, 2 API calls, a PR to manage.",
        good:
          "Task: add a missing JSDoc comment to one function.\n\nApproach: cursor on the function, trigger Copilot inline, tab-complete the comment.\n\nCost: ~8 seconds. Done.\n\nSave the agent for tasks the autocompleter can't do.",
        note: "Agents have overhead: sandbox spin-up, context loading, PR creation. That overhead is worth paying for a 200-line feature. It is not worth paying for a docstring. Match the tool to the task scope.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L09",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "You need to explore an unfamiliar 80k-line codebase and understand how the authentication flow works before making any changes. Which tool fits best?",
        options: [
          "GitHub Copilot, it's always on and knows your code.",
          "Cursor or Cline, IDE-native agents with whole-codebase chat let you ask questions and explore interactively before touching anything.",
          'Codex, submit a task: "explain the auth flow."',
          "Aider, open-source and model-agnostic.",
        ],
        correct: 1,
        explanation:
          "Exploration is interactive and open-ended, you don't know what you're looking for yet. IDE-native agents (Cursor, Cline) excel here because you can ask follow-up questions, jump to definitions, and steer the conversation as understanding develops. Codex is optimized for well-specified tasks, not open-ended exploration.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L09",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question: "What does an MCP server enable that an agent without MCP cannot do?",
        options: [
          "Write code faster.",
          "Connect to external tools, databases, and APIs (GitHub, Postgres, Slack, etc.) through a standard interface the agent can call directly.",
          "Run inside a sandboxed environment.",
          "Understand more programming languages.",
        ],
        correct: 1,
        explanation:
          "MCP (Model Context Protocol) is a plugin standard. It lets agents call named tools that talk to external systems, a Postgres MCP server lets the agent run SQL queries; a GitHub MCP server lets it open issues. Without MCP, the agent is limited to the local filesystem and shell. With it, the agent can participate in your full toolchain.",
      },
    },
  ],
};

export default lesson;
