// Ported from codex/lessons/03-agents-md.html + codex/js/lessons/L03.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_TASK_SPEC_TIER_LABELS,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L03",
  number: 3,
  title: "AGENTS.md: Repository Instructions",
  subtitle:
    "Versioned instructions give Codex explicit project rules, commands, and boundaries.",
  durationMinutes: 11,
  trackId: "fundamentals",
  hook: "Make repository rules explicit.",
  keyConcepts: [
    "AGENTS.md",
    "Convention file",
    "Context management",
    "CLAUDE.md",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Onboarding the agent",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Codex reads `AGENTS.md` instructions before it starts work. The file is not memory; it is versioned project context. Use it for rules that should apply consistently across tasks.\n\nInstruction discovery is layered. Codex can load global guidance from the Codex home directory, then project guidance from the project root down to the current working directory. In each directory, `AGENTS.override.md` takes precedence over `AGENTS.md`. Instructions closer to the working directory appear later and can override broader guidance.\n\nA repository-level file should contain information that changes the work: exact setup and verification commands, architectural boundaries, test expectations, known constraints, and actions that require approval. Task-specific goals and acceptance criteria still belong in the task request.",
        },
        {
          kind: "pull-quote",
          text: "Use AGENTS.md for durable project rules. Use the task request for the current change.",
        },
      ],
    },
    {
      id: "s2",
      title: "What to put in it",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "AGENTS.md is Markdown without a required content schema. Organize it around rules the agent can apply and checks it can execute.",
        },
      ],
    },
    {
      id: "s3",
      title: "A real example",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "This is an illustrative `AGENTS.md`, not a universal template. Its useful property is specificity.\n\n```\n# AGENTS.md\n\n## What this repo is\nPayments service. Python 3.11, Flask, Postgres, Stripe.\nCritical path: /checkout endpoint.\n\n## Running locally\n$ make setup       # installs dependencies\n$ make test         # pytest; required before review\n$ make lint         # ruff + mypy; also required\n\n## Conventions we enforce\n- No bare except: clauses. Catch specific exceptions.\n- Every endpoint gets an integration test in tests/api/.\n- Log with structlog, never print. Log context as kwargs, not f-strings.\n- Migrations go in db/migrations/, numbered, never edited after merge.\n- We use pydantic v2. Flag v1 patterns; migration is in progress.\n\n## Known constraints\n- tests/integration/test_webhooks.py is flaky. Re-run once before debugging.\n- user_service.py is already oversized. Do not add responsibilities to it.\n- Tests use non-production fixtures; never request or print live credentials.\n\n## Requires explicit approval\n- Changes under legacy/.\n- New top-level dependencies.\n- Any edit to deprecated server_v1.py.\n```",
        },
      ],
    },
    {
      id: "s4",
      title: "Before & after",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            'The following comparison is illustrative. Both patches answer "add a /health endpoint that checks the database"; the second also follows the repository rules stated in `AGENTS.md`.',
        },
        {
          kind: "callout",
          title: "Both versions work.",
          body: "The second version also follows the stated project rules: structlog, a specific OperationalError branch, and an integration test under tests/api/. The review can check those choices against explicit instructions instead of inferred preferences.",
        },
      ],
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown: "One question on writing a good AGENTS.md entry.",
        },
      ],
    },
    {
      id: "s6",
      title: "Rollout plan",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            'Build the file from observed project needs:\n\n1. **Start with executable basics.** State the repository purpose, setup command, required checks, and boundaries that are not obvious from code.\n2. **Update it from reviews.** When a recurring project rule causes a rejected change, add the precise rule and its safe path.\n3. **Review it with code.** When commands or conventions change, update the instruction file in the same change.\n\n### Context management: what goes in, what stays out\n\nInstruction files consume context alongside the task and code. Keep them specific:\n\n- **Include:** rules that affect implementation, review, or safety.\n- **Exclude:** marketing copy, meeting notes, and preferences with no testable effect.\n- **Include:** exact commands such as `make test`, with prerequisites when needed.\n- **Exclude:** vague goals such as "write clean code." Replace them with observable rules.\n\nLength is not a quality measure. Retain instructions that prevent a known error, define a boundary, or enable verification.',
        },
        {
          kind: "callout",
          title: "Directory-specific rules.",
          body: "Codex discovers one instruction file per directory from the project root to the current working directory. Put repository-wide rules at the root and narrower rules near the code they govern. An AGENTS.override.md file takes precedence within its directory.",
        },
      ],
    },
  ]),
  widgets: [
    {
      kind: "task-spec",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        lessonId: "L03",
        cpId: "spec-1",
        threshold: 4,
        title: "Assemble a useful AGENTS.md",
        desc: "Toggle each section on if you'd include it in your team's first draft. Aim for at least four.",
        goal: "Onboard Codex to a Python payments service in one file.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        items: [
          {
            section: "What this repo is",
            hint: "One paragraph. Business purpose, not architecture.",
            body: [
              "Payments service. Python 3.11, Flask, Postgres.",
              "Critical path: /checkout endpoint.",
            ],
          },
          {
            section: "How to run tests & lint",
            hint: "Exact commands Codex can run when the environment supports them.",
            body: [
              "make test   # pytest, must pass",
              "make lint   # ruff + mypy",
            ],
          },
          {
            section: "Conventions we enforce",
            hint: 'Not "be clean." Specific rules.',
            body: [
              "No bare except:. Catch specific exceptions.",
              "Log with structlog, not print.",
            ],
          },
          {
            section: "Known quirks",
            hint: "The undocumented minefields. Saves wasted runs.",
            body: [
              "test_webhooks.py has a documented intermittent failure; preserve the first log before retrying.",
              "Do not add responsibilities to user_service.py; a separate extraction is planned.",
            ],
          },
          {
            section: "Definitely don't",
            hint: "Hard stops. More useful than style preferences.",
            body: [
              "Never edit legacy/. Runs in prod, unowned.",
              "No new top-level deps without asking.",
            ],
          },
          {
            section: "Our favorite color",
            hint: "Not useful. Not even a joke, don't add noise.",
            body: ["#3B82F6"],
          },
        ],
      },
    },
    {
      kind: "diff-viewer",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "Without AGENTS.md, generic, doesn't match repo",
        file: "api/health.py · +15 / −0",
        lines: [
          { type: "add", text: "from flask import Blueprint, jsonify" },
          { type: "add", text: "import logging" },
          { type: "add", text: "" },
          { type: "add", text: 'health_bp = Blueprint("health", __name__)' },
          { type: "add", text: "log = logging.getLogger(__name__)" },
          { type: "add", text: "" },
          { type: "add", text: '@health_bp.route("/health")' },
          { type: "add", text: "def health():" },
          { type: "add", text: "    try:" },
          { type: "add", text: '        db.session.execute("SELECT 1")' },
          { type: "add", text: '        return jsonify({"ok": True})' },
          { type: "add", text: "    except Exception as e:" },
          {
            type: "add",
            text: '        log.error(f"health check failed: {e}")',
          },
          { type: "add", text: '        return jsonify({"ok": False}), 500' },
        ],
      },
    },
    {
      kind: "diff-viewer",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "With AGENTS.md, fits the codebase, tests included",
        file: "api/health.py · +12 / −0",
        lines: [
          { type: "add", text: "from flask import Blueprint, jsonify" },
          { type: "add", text: "from sqlalchemy.exc import OperationalError" },
          { type: "add", text: "import structlog" },
          { type: "add", text: "" },
          { type: "add", text: 'health_bp = Blueprint("health", __name__)' },
          { type: "add", text: "log = structlog.get_logger()" },
          { type: "add", text: "" },
          { type: "add", text: '@health_bp.route("/health")' },
          { type: "add", text: "def health():" },
          { type: "add", text: "    try:" },
          { type: "add", text: '        db.session.execute("SELECT 1")' },
          { type: "add", text: '        return jsonify({"ok": True})' },
          { type: "add", text: "    except OperationalError as e:" },
          {
            type: "add",
            text: '        log.error("health_check_failed", error=str(e))',
          },
          { type: "add", text: '        return jsonify({"ok": False}), 503' },
          { type: "context", text: "" },
          {
            type: "context",
            text: "# --- tests/api/test_health.py, also added ---",
          },
        ],
        note: "Notice the specifics: OperationalError (not generic Exception), structlog with kwargs (not f-strings), 503 not 500, and a test file in tests/api/. None of this was in the task. All of it was in AGENTS.md.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L03",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'Which is the better AGENTS.md entry for "how we handle errors"?',
        options: [
          '"Handle errors thoughtfully and follow best practices."',
          '"Catch specific exceptions, never bare except. Log with structlog. Return 4xx for client errors, 5xx only for server bugs. Don\'t swallow exceptions in endpoints, let the global handler format them."',
          '"Errors should be handled."',
          '"TODO: document error handling."',
        ],
        correct: 1,
        explanation:
          '"Best practices" does not define observable behavior. Concrete rules name the required exception type, logging API, status-code boundary, and error-formatting path, so both the agent and reviewer can check them.',
      },
    },
  ],
};

export default lesson;
