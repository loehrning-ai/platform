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
  title: "Choosing a Coding-Agent Workflow",
  subtitle:
    "Compare interaction model, execution boundary, provider constraints, and review path before selecting a tool.",
  durationMinutes: 11,
  trackId: "in-the-loop",
  hook: "Choose by operating requirements.",
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
            "Coding tools combine several interaction models: inline completion, editor chat, terminal agents, IDE agents, and background tasks that return a diff or pull request. Product capabilities change, and several tools now span more than one category.\n\nChoose from operational requirements rather than a static vendor ranking. Check what repository context the tool can read, where commands execute, which writes require approval, whether network access is enabled, how model and data policies are configured, and how the result reaches review.\n\nThe relevant unit is the workflow and its controls, not the product label alone.",
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
              body: "Offers inline completion, chat, and agent workflows across supported editors and GitHub surfaces. Confirm repository access, execution location, and review controls for the mode you use.",
            },
            {
              eyebrow: "Cursor",
              title: "AI-focused editor",
              body: "Combines editor context, chat, and agent execution in an IDE. It can support interactive repository exploration and multi-file work, subject to the selected model and permission settings.",
            },
            {
              eyebrow: "Claude Code",
              title: "Terminal-oriented agent",
              body: "Runs from a terminal and can use repository files and shell tools within configured permissions. Hooks and scripts can connect it to an existing development workflow.",
            },
            {
              eyebrow: "Aider",
              title: "Open-source CLI interface",
              body: "Supports multiple model providers through a command-line workflow. Offline or isolated operation depends on the chosen model endpoint and local infrastructure, not on the CLI alone.",
            },
            {
              eyebrow: "Cline (formerly Claude Dev)",
              title: "Agent as an editor extension",
              body: "Adds multi-provider agent workflows and MCP integrations to VS Code. Review its command approvals, provider configuration, and data path before enabling write access.",
            },
            {
              eyebrow: "Codex (OpenAI)",
              title: "Local and cloud Codex surfaces",
              body: "Codex supports interactive local CLI and IDE work plus background cloud tasks in dedicated environments. Select the surface according to environment, permission, and review requirements.",
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
            "Match the workflow to the task and control boundary:\n\n- **Small, local edit with a known implementation** → use direct editing or inline completion when delegation overhead adds no value.\n- **Unfamiliar codebase** → begin with a read-oriented interactive workflow that can cite files and call paths before allowing edits.\n- **Well-specified background task** → use a dedicated environment, explicit checks, and a diff or pull-request review gate.\n- **Terminal-centered workflow** → use a CLI agent that can run the repository's existing commands inside the required sandbox and approval policy.\n- **Provider, residency, or offline constraint** → evaluate the complete model endpoint, telemetry, credential, and network path. A local client does not by itself make a workflow offline.\n\nRecheck product documentation when the decision affects security or procurement; these capabilities change.",
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
            "MCP stands for Model Context Protocol. It standardizes how a client discovers and calls tools, resources, and prompts exposed by an MCP server.\n\nMCP does not itself grant access. The server, transport, credentials, client policy, and user approvals determine what a tool can read or change. A database or GitHub integration should expose the narrowest useful operations and separate read actions from consequential writes.\n\nConceptually:\n\n```\n# 1. Configure a reviewed MCP server in the client.\n# 2. The server advertises named capabilities with input schemas.\n# 3. The client may call an allowed capability when the task requires it.\n# 4. Authentication, authorization, logging, and approval still apply.\n```\n\nMCP can replace manual copy-and-paste steps with structured calls, but it also expands the agent's trust boundary. Treat every configured server as an integration that requires ownership, least privilege, and auditability.",
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
            "Editor and terminal workflows can share the same repository controls:\n\n- **Review the diff:** inspect changed files, tests, deletions, and generated artifacts in the normal Git review surface.\n- **Run repository checks:** use the documented lint, type, test, and build commands rather than tool-specific claims of success.\n- **Limit context deliberately:** provide the files and logs required for the task; do not broaden repository or secret access for convenience.\n- **Isolate concurrent work:** separate branches or worktrees reduce file conflicts, but shared dependencies and generated state can still conflict.\n\nIntegration should preserve the project's review and security gates instead of bypassing them.",
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Two questions on tool selection and MCP." },
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
        bad: "Task: add a missing JSDoc comment to one function.\n\nApproach: create a background environment and a separate pull request for an edit that can be reviewed directly in place.\n\nCost: additional environment and review state without a corresponding reduction in risk.",
        good: "Task: add a missing JSDoc comment to one function.\n\nApproach: edit or generate the comment beside the function, inspect it against the implementation, and include it in the existing change.\n\nCost: no separate execution environment or review object.",
        note: "Delegated tasks add environment, context, and review overhead. Use that separation when it improves isolation, verification, or parallelism; otherwise keep the change in the current workflow.",
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
          "You need to understand authentication in an unfamiliar codebase before making changes. Which workflow is the safest first step?",
        options: [
          "Grant write and network access immediately so exploration is unrestricted.",
          "Start read-oriented, require file and call-path evidence, then define a separate bounded change after reviewing the trace.",
          "Choose whichever product has the shortest setup flow.",
          "Ask for an architecture summary without repository access.",
        ],
        correct: 1,
        explanation:
          "Read-oriented exploration limits accidental changes and produces evidence you can verify. Once the authentication path and trust boundaries are known, create a separate task with explicit scope and checks.",
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
          "Write code faster.",
          "A standard interface for discovering and calling capabilities exposed by configured servers, subject to authentication and policy.",
          "Run inside a sandboxed environment.",
          "Understand more programming languages.",
        ],
        correct: 1,
        explanation:
          "MCP standardizes capability discovery and invocation. It does not replace authentication, authorization, approval, logging, or least-privilege design.",
      },
    },
  ],
};

export default lesson;
