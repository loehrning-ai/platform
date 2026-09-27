// Ported from codex/lessons/09-tools.html + codex/js/lessons/L09.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L09",
  number: 9,
  title: "Choosing a coding-agent workflow",
  subtitle:
    "Compare interaction model, execution boundary, provider limits and review path before you pick a tool.",
  durationMinutes: 11,
  trackId: "in-the-loop",
  hook: "Choose by operating requirements.",
  keyConcepts: ["Tool choice", "MCP", "Task-shape fit", "IDE integration"],
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
            "Coding tools mix inline completion, editor chat, terminal and IDE agents, and background tasks that return a diff or pull request. Choose by what the tool reads, where commands run, which writes need approval, network access, model and data policy, and how results reach review.",
        },
      ],
    },
    {
      id: "s2",
      title: "Six example tool surfaces",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "GitHub Copilot",
              title: "Editor and GitHub workflows",
              body: "Completion, chat and agents in editors and on GitHub. Check access and review controls per mode.",
            },
            {
              eyebrow: "Cursor",
              title: "AI-focused editor",
              body: "An IDE that combines editor context, chat and agent runs for multi-file work.",
            },
            {
              eyebrow: "Claude Code",
              title: "Terminal-oriented agent",
              body: "Uses repository files and shell tools from the terminal, within set permissions. Hooks connect it to existing workflows.",
            },
            {
              eyebrow: "Aider",
              title: "Open-source CLI",
              body: "A CLI for many model providers. Offline use depends on the model endpoint and local infrastructure.",
            },
            {
              eyebrow: "Cline (formerly Claude Dev)",
              title: "Agent as an editor extension",
              body: "Multi-provider agents and MCP in VS Code. Check approvals, provider setup and data path before granting writes.",
            },
            {
              eyebrow: "Codex (OpenAI)",
              title: "Local and cloud Codex surfaces",
              body: "Local CLI and IDE work plus background cloud tasks in dedicated environments.",
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
            "Match the workflow to the task and its control boundary:\n\n- **Small local edit, known implementation** → edit directly or use inline completion.\n- **Unfamiliar codebase** → start read-oriented and interactive, with cited files and call paths, before any edits.\n- **Well-specified background task** → dedicated environment, explicit checks, diff or pull-request review gate.\n- **Terminal-centered workflow** → a CLI agent that runs the repository's commands inside the required sandbox and approval policy.\n- **Provider, residency or offline constraint** → check model endpoint, telemetry, credentials and network path; a local client alone does not make a workflow offline.\n\nFor security or procurement decisions, read the current product documentation.",
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
            "MCP (Model Context Protocol) standardizes how a client discovers and calls the tools, resources and prompts an MCP server exposes. It grants no access by itself: server, transport, credentials, client policy and your approvals decide what a tool can read or change. Expose the narrowest useful operations and separate reads from consequential writes.\n\n```\n# 1. Configure a reviewed MCP server in the client.\n# 2. The server advertises named capabilities with input schemas.\n# 3. The client may call an allowed capability when the task requires it.\n# 4. Authentication, authorization, logging, and approval still apply.\n```\n\nEach configured server widens the agent's trust boundary and needs an owner, least privilege and an audit trail.",
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
            "Editor and terminal workflows use the same repository controls:\n\n- **Review the diff:** changed files, tests, deletions and generated artifacts in the normal Git review.\n- **Run repository checks:** the documented lint, type, test and build commands, instead of trusting the tool's success message.\n- **Limit context:** only the files and logs the task needs; no wider repository or secret access for convenience.\n- **Isolate concurrent work:** separate branches or worktrees reduce file conflicts; shared dependencies and generated state can still collide.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Questions at the end of the lesson." },
      ],
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
        bad: "Task: add a missing JSDoc comment to one function.\n\nApproach: a background environment and a separate pull request for an edit you could review in place.\n\nCost: extra environment and review state, same risk.",
        good: "Approach: write the comment next to the function, check it against the code, add it to the current change.\n\nCost: nothing extra.",
        note: "Delegate when the extra environment, context and review buy isolation, verification or parallelism.",
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
          "Before changing an unfamiliar codebase, you must understand its authentication. What is the safest first step?",
        options: [
          "Grant write and network access immediately so exploration is unrestricted.",
          "Explore read-only with file evidence, then scope a separate change.",
          "Choose whichever product has the shortest setup flow.",
          "Ask for an architecture summary without repository access.",
        ],
        correct: 1,
        explanation:
          "Read-only exploration avoids accidental changes and yields verifiable evidence. Once the authentication path and trust boundaries are known, scope a separate task with named checks.",
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
        question: "What does MCP add to a coding-agent workflow?",
        options: [
          "Faster code generation.",
          "A standard way to discover and call configured servers' capabilities, within auth and policy.",
          "A sandboxed runtime.",
          "Support for more programming languages.",
        ],
        correct: 1,
        explanation:
          "MCP standardizes capability discovery and invocation. It does not replace authentication, authorization, approval, logging, or least-privilege design.",
      },
    },
  ],
};

export default lesson;
