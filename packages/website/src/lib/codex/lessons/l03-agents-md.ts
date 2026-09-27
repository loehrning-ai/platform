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
            "`AGENTS.md` is versioned project context that Codex reads before it starts work. Put rules there that hold across every task.\n\nDiscovery is layered: global guidance from the Codex home directory, then project guidance from the project root down to the current working directory. In each directory, `AGENTS.override.md` takes precedence over `AGENTS.md`, and files closer to the working directory can override broader ones.\n\nThe repository file holds what changes the work: exact setup and check commands with their prerequisites, architectural boundaries, test expectations, known constraints and actions that need approval. Task goals and acceptance criteria stay in the task request.",
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
            "AGENTS.md is plain Markdown without a required schema. Instruction files take up context space, just like the task and code. Leave out marketing copy, meeting notes, preferences with no testable effect and vague goals like \"write clean code\". Keep an instruction if it prevents a known error, sets a boundary or makes verification possible.",
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
            "An illustrative `AGENTS.md`. Each line is specific enough to check.\n\n```\n# AGENTS.md\n\n## What this repo is\nPayments service. Python 3.11, Flask, Postgres, Stripe.\nCritical path: /checkout endpoint.\n\n## Running locally\n$ make setup       # installs dependencies\n$ make test         # pytest; required before review\n$ make lint         # ruff + mypy; also required\n\n## Conventions we enforce\n- No bare except: clauses. Catch specific exceptions.\n- Every endpoint gets an integration test in tests/api/.\n- Log with structlog, never print. Log context as kwargs, not f-strings.\n- Migrations go in db/migrations/, numbered, never edited after merge.\n- We use pydantic v2. Flag v1 patterns; migration is in progress.\n\n## Known constraints\n- tests/integration/test_webhooks.py is flaky. Re-run once before debugging.\n- user_service.py is already oversized. Do not add responsibilities to it.\n- Tests use non-production fixtures; never request or print live credentials.\n\n## Requires explicit approval\n- Changes under legacy/.\n- New top-level dependencies.\n- Any edit to deprecated server_v1.py.\n```",
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
            "Both patches below answer \"add a /health endpoint that checks the database\" and both work. Only the second follows the rules in `AGENTS.md`.",
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
          markdown: "One question at the end of the lesson.",
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
            "1. **Start with executable basics:** repository purpose, setup command, required checks and boundaries the code does not show.\n2. **Update it from reviews.** When a recurring project rule causes a rejected change, add the precise rule and its safe path.\n3. **Change it with the code.** When commands or conventions change, update the file in the same change.",
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
        desc: "Switch on each section you'd put in a first draft. Aim for at least four.",
        goal: "Onboard Codex to a Python payments service in one file.",
        tierLabels: CODEX_TASK_SPEC_TIER_LABELS,
        items: [
          {
            section: "What this repo is",
            hint: "One paragraph on the business purpose.",
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
            hint: 'Specific rules instead of "be clean".',
            body: [
              "No bare except:. Catch specific exceptions.",
              "Log with structlog, not print.",
            ],
          },
          {
            section: "Known quirks",
            hint: "Undocumented traps that waste runs.",
            body: [
              "test_webhooks.py has a documented intermittent failure; preserve the first log before retrying.",
              "Do not add responsibilities to user_service.py; a separate extraction is planned.",
            ],
          },
          {
            section: "Definitely don't",
            hint: "Hard stops the agent must respect.",
            body: [
              "Never edit legacy/. Runs in prod, unowned.",
              "No new top-level deps without asking.",
            ],
          },
          {
            section: "Our favorite color",
            hint: "Noise. Leave it out.",
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
        title: "Without AGENTS.md: generic code",
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
        title: "With AGENTS.md: repo conventions and a test",
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
        note: "OperationalError instead of Exception, structlog with kwargs, 503 instead of 500 and a test in tests/api/ all come from AGENTS.md. The task named none of them.",
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
          "\"Catch specific exceptions. Log with structlog. 4xx for client errors, 5xx for server bugs. Let the global handler format errors.\"",
          '"Errors should be handled."',
          '"TODO: document error handling."',
        ],
        correct: 1,
        explanation:
          "\"Best practices\" defines no observable behavior. The specific entry names exception type, logging API, status-code boundary and formatting path, so agent and reviewer can check each.",
      },
    },
  ],
};

export default lesson;
