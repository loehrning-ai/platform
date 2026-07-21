// Ported from codex/lessons/03-agents-md.html + codex/js/lessons/L03.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_TASK_SPEC_TIER_LABELS } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L03",
  number: 3,
  title: "AGENTS.md — Codex's Memory",
  subtitle:
    'One file, committed to your repo. It\'s the difference between "write a PR" and "write a PR the way we write PRs here."',
  durationMinutes: 11,
  trackId: "fundamentals",
  hook: "Onboard the agent like a new hire.",
  keyConcepts: ["AGENTS.md", "Convention file", "Context management", "CLAUDE.md"],
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
            "Codex has no persistent memory. The sandbox is ephemeral. The agent has never met your team before. Yet, somehow, people get Codex to produce PRs that look like the humans on the team wrote them, same error-handling conventions, same test patterns, same casual profanity in commit messages. How?\n\nAnswer: `AGENTS.md`. A plain-text file, in your repo root, that Codex reads at the start of every task. It's your onboarding doc for the agent. The new-hire manual that the new hire actually reads on day one.\n\nThe concept is the same across tools. Claude Code uses `CLAUDE.md`. GitHub Copilot Workspace uses a repo instructions file. Cursor uses `.cursorrules`. The names differ; the principle is identical: a plain-text file committed to your repo that the agent reads before it touches anything. This lesson uses `AGENTS.md` as the canonical example, apply everything here to whatever convention file your tool expects.\n\nAnything worth knowing about how your team builds software belongs here. Conventions. Folder structure. Test commands. Known quirks. The one library you love and the one you're migrating off. The exact set of things a competent junior engineer would pick up by osmosis over their first six weeks, except you're writing it down, once, and every agent run benefits.",
        },
        {
          kind: "pull-quote",
          text: "Think of AGENTS.md as the onboarding doc you wish your team had written years ago. Now you have a reason to write it.",
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
            "There's no schema. The file is read as context. But a few sections pay off reliably across every repo we've seen.",
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
            "Here's the shape of a production `AGENTS.md`. Not a template, a sample. Your file should look nothing like this structurally. It should look exactly like this in *specificity*.\n\n```\n# AGENTS.md\n\n## What this repo is\nPayments service. Python 3.11, Flask, Postgres, Stripe.\nCritical path: /checkout endpoint. Downtime costs money literally.\n\n## Running locally\n$ make setup       # installs everything\n$ make test         # pytest, must pass before any PR\n$ make lint         # ruff + mypy, also mandatory\n\n## Conventions we actually enforce\n- No bare except: clauses. Catch specific exceptions.\n- Every endpoint gets an integration test in tests/api/.\n- Log with structlog, never print. Log context as kwargs, not f-strings.\n- Migrations go in db/migrations/, numbered, never edited after merge.\n- We use pydantic v2. If you see v1 patterns, flag it, we're mid-migration.\n\n## Known quirks\n- tests/integration/test_webhooks.py is flaky. Re-run once before debugging.\n- user_service.py has 400 lines we've been meaning to split. Don't make it worse.\n- Our Stripe test keys live in .env.test, already in the sandbox.\n\n## Definitely don't\n- Touch legacy/ without explicit permission, it runs in prod, unowned.\n- Add new top-level dependencies without asking.\n- Write code in server_v1.py. It's deprecated.\n```",
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
            'Same task, "add a /health endpoint that checks the database." Same repo. The only variable: whether `AGENTS.md` was present. Look at the resulting patches.',
        },
        {
          kind: "callout",
          title: "Both versions work.",
          body: "But the second one fits. It uses structlog because the repo does. It catches OperationalError specifically because the style guide says so. It writes a test in tests/api/ because that's where tests go. A human reviewer spends 30 seconds on the second PR; they spend 10 minutes on the first asking \"why didn't you…\"",
        },
      ],
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "One question on writing a good AGENTS.md entry." }],
    },
    {
      id: "s6",
      title: "Rollout plan",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three moves to get value out of `AGENTS.md` in a week:\n\n1. **Start with 30 lines.** A half-page is better than a perfect document that never ships. Answer: what does this repo do, how do I run it, what are three things a new hire always gets wrong?\n2. **Grow it from rejections.** Each time you reject an agent PR for a stylistic reason, add a line to AGENTS.md so the next run doesn't repeat the mistake. The file should get measurably smarter every sprint.\n3. **Review it like code.** The file is source. When conventions change, AGENTS.md changes. Stale docs poison the well worse than missing docs.\n\n### Context management: what goes in, what stays out\n\nThe convention file competes for space in the context window with your task spec and the repo contents the agent reads. Keep it focused:\n\n- **In:** things that change how code is written (conventions, patterns, must-avoid). Anything a new engineer would ask on their first week.\n- **Out:** things the agent can infer from the code itself (don't describe your folder structure if it's obvious). Marketing copy, meeting notes, personal preferences.\n- **In:** exact commands. `make test`, not \"run the tests.\" The agent executes commands literally.\n- **Out:** vague principles. \"Write clean code\" adds no signal. \"No bare except: clauses, catch specific exceptions\" does.\n\nA 200-line `AGENTS.md` that is specific and accurate outperforms a 600-line one that's half filler. Prune aggressively. Every line should earn its spot by preventing a real mistake.",
        },
        {
          kind: "callout",
          title: "Tool-specific note.",
          body: "Claude Code reads CLAUDE.md and supports directory-level convention files (e.g., src/CLAUDE.md for frontend-specific rules). If you're using Claude Code on a monorepo, layer your convention files: root-level for universal rules, directory-level for domain-specific ones.",
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
            body: ["Payments service. Python 3.11, Flask, Postgres.", "Critical path: /checkout endpoint."],
          },
          {
            section: "How to run tests & lint",
            hint: "The exact commands. Codex will run them.",
            body: ["make test   # pytest, must pass", "make lint   # ruff + mypy"],
          },
          {
            section: "Conventions we enforce",
            hint: 'Not "be clean." Specific rules.',
            body: ["No bare except:. Catch specific exceptions.", "Log with structlog, not print."],
          },
          {
            section: "Known quirks",
            hint: "The undocumented minefields. Saves wasted runs.",
            body: ["test_webhooks.py is flaky — re-run once.", "user_service.py is 400 lines — don't add to it."],
          },
          {
            section: "Definitely don't",
            hint: "Hard stops. More useful than style preferences.",
            body: ["Never edit legacy/. Runs in prod, unowned.", "No new top-level deps without asking."],
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
        title: "Without AGENTS.md — generic, doesn't match repo",
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
          { type: "add", text: '        log.error(f"health check failed: {e}")' },
          { type: "add", text: '        return jsonify({"ok": False}), 500' },
        ],
      },
    },
    {
      kind: "diff-viewer",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "With AGENTS.md — fits the codebase, tests included",
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
          { type: "add", text: '        log.error("health_check_failed", error=str(e))' },
          { type: "add", text: '        return jsonify({"ok": False}), 503' },
          { type: "context", text: "" },
          { type: "context", text: "# --- tests/api/test_health.py — also added ---" },
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
        question: 'Which is the better AGENTS.md entry for "how we handle errors"?',
        options: [
          '"Handle errors thoughtfully and follow best practices."',
          '"Catch specific exceptions, never bare except. Log with structlog. Return 4xx for client errors, 5xx only for server bugs. Don\'t swallow exceptions in endpoints, let the global handler format them."',
          '"Errors should be handled."',
          '"TODO: document error handling."',
        ],
        correct: 1,
        explanation:
          'The agent\'s output is bounded by the specificity of your instructions. "Best practices" is a non-instruction, the agent has to guess what you mean. Concrete rules give it something to actually apply. This is the single highest-leverage skill in AGENTS.md authoring.',
      },
    },
  ],
};

export default lesson;
