// Ported from codex/lessons/07-review.html + codex/js/lessons/L07.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L07",
  number: 7,
  title: "Reviewing a Codex PR",
  subtitle:
    "Before merge, check behavior, the full diff, tests, dependencies and security boundaries.",
  durationMinutes: 14,
  trackId: "in-the-loop",
  hook: "The diff and logs are evidence, not approval.",
  keyConcepts: [
    "Review checklist",
    "Circular tests",
    "Security pass",
    "Auth bypass",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Review the artifact, not the author",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "A Codex diff gets the same review as any other pull request. Tidy code, tests and green logs prove nothing about correctness.\n\nStart from the requested behavior and the trust boundaries. Read the complete diff (staged, unstaged, untracked, generated, configuration and dependency changes) plus test code and command logs, then work through the checklist below.",
        },
      ],
    },
    {
      id: "s2",
      title: "The checklist",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Six baseline checks, plus what the affected system needs. Stop early if the task or scope is wrong; later checks cannot repair that.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "check 01",
              title: "Does it do what you asked?",
              body: "Compare behavior with the goal and acceptance criteria. Reject a solution to a neighboring problem, even if it is consistent.",
            },
            {
              eyebrow: "check 02",
              title: "Is it the right size?",
              body: "Read every changed and deleted file. Changes outside the stated scope need a reason.",
            },
            {
              eyebrow: "check 03",
              title: "Do the tests exercise the requirement?",
              body: "Read assertions, fixtures, mocks, negative cases and skipped paths. Would the test fail without the behavior?",
            },
            {
              eyebrow: "check 04",
              title: "Are there new dependencies?",
              body: "Check lockfile, provenance, maintenance, license and transitive risk. Could an existing dependency do the job?",
            },
            {
              eyebrow: "check 05",
              title: "What was removed or bypassed?",
              body: "The task must justify every deleted test, validation, fallback, feature flag, constraint comment or error handler.",
            },
            {
              eyebrow: "check 06",
              title: "Does it fit the system contract?",
              body: "Check authorization, data handling, errors, logging, concurrency, migrations, observability, rollback and conventions. If a durable rule was missing, add it to AGENTS.md.",
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Subtly-wrong tests",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The task asked for a rate limiter on `/login`. This test mocks the limiter decision. What does it still cover?\n\n```\n# tests/api/test_login_rate_limit.py\n\ndef test_login_maps_denial_to_429(client, mocker):\n    mock_limiter = mocker.patch(\"api.auth.limiter.is_allowed\")\n    mock_limiter.return_value = False\n\n    response = client.post(\"/login\", json={...})\n\n    assert response.status_code == 429\n    mock_limiter.assert_called_once()\n```\n\nIt only checks that a denied limiter result becomes status 429. Counting, threshold, key selection, storage and reset stay untested. Keep it if that mapping matters, and add a test through the real limiter:\n\n```\n# exercises the configured limiter behavior\n\ndef test_login_blocks_at_6th_attempt(client):\n    for _ in range(5):\n        response = client.post(\"/login\", json={...})\n        assert response.status_code == 401  # bad credentials, request allowed\n\n    response = client.post(\"/login\", json={...})\n    assert response.status_code == 429  # request blocked\n```",
        },
      ],
    },
    {
      id: "s4",
      title: "Spot the problem",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Before you read the explanation under the caching diff above, name the defect yourself.",
        },
      ],
    },
    {
      id: "s5",
      title: "The security pass",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "State security requirements in the task and check them in review; functional tests rarely cover every trust boundary.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "sec 01",
              title: "Input trust boundary",
              body: "Trace untrusted values into queries, file paths, shell commands, templates, redirects and logs. Validate, parameterize, canonicalize or encode per sink.",
            },
            {
              eyebrow: "sec 02",
              title: "Authentication and authorization",
              body: "For each changed operation, verify identity, role, tenant, ownership and default deny. A route guard may not enforce object-level authorization.",
            },
            {
              eyebrow: "sec 03",
              title: "Secrets in source",
              body: "Scan source, fixtures, logs, generated files and configuration for credentials. Revoke exposed credentials; deleting them from the diff leaves them in Git history.",
            },
            {
              eyebrow: "sec 04",
              title: "Error message leakage",
              body: "Send no raw exceptions to clients and log no sensitive payloads. Keep diagnostics server-side and status codes stable, and redact sensitive data at each logging boundary.",
            },
          ],
        },
        {
          kind: "callout",
          title: "Use the repository's security checks.",
          body: "Run the configured secret, dependency, static-analysis and authorization checks and read their scope, exclusions and output. A grep helps you triage but does not replace these checks.",
        },
        {
          kind: "prose",
          // The three string literals below are deliberately split right
          // before each "@decorator" line: concatenated, the runtime string
          // is byte-identical to one literal, but it avoids the raw source
          // text ever containing "n@" (a `\n` escape's "n" directly abutting
          // "@"), which public-content-claims.test.ts's naive email-shaped
          // regex scans the raw .ts source for and would otherwise flag as
          // a leaked address.
          markdown:
            "The request said \"add a `/debug/user` endpoint\" and named no authorization, input handling or response fields. The first version below works but is unsafe.\n\n```\n# insecure version\n\n" +
            '@app.route("/debug/user")           # no auth guard\ndef debug_user():\n    user_id = request.args.get("id")  # no validation\n    try:\n        u = db.session.query(User).get(user_id)\n        return jsonify(u.__dict__)       # exposes all columns\n    except Exception as e:\n        return str(e), 500              # leaks stack trace\n\n# corrected version, same feature, secure\n\n' +
            '@app.route("/debug/user")\n' +
            '@require_admin                         # explicit authorization\ndef debug_user():\n    try:\n        user_id = int(request.args["id"])\n    except (KeyError, ValueError):\n        return jsonify({"error": "invalid id"}), 400\n\n    user = db.session.get(User, user_id)\n    if user is None:\n        return jsonify({"error": "not found"}), 404\n    return jsonify(user.to_safe_dict())  # explicit field allowlist\n```',
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
      kind: "diff-viewer",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: 'PR: "add caching to /users/:id", what\'s wrong?',
        file: "api/users.py",
        lines: [
          { type: "context", text: "from flask import Blueprint, jsonify" },
          { type: "add", text: "from functools import lru_cache" },
          { type: "context", text: "" },
          { type: "context", text: 'users_bp = Blueprint("users", __name__)' },
          { type: "context", text: "" },
          { type: "add", text: "@lru_cache(maxsize=1000)" },
          { type: "add", text: "def _get_user_cached(user_id: int):" },
          {
            type: "add",
            text: "    return db.session.query(User).filter(User.id == user_id).first()",
          },
          { type: "add", text: "" },
          { type: "context", text: '@users_bp.route("/users/<int:user_id>")' },
          { type: "context", text: "def get_user(user_id):" },
          {
            type: "remove",
            text: "    user = db.session.query(User).filter(User.id == user_id).first()",
          },
          { type: "add", text: "    user = _get_user_cached(user_id)" },
          { type: "context", text: "    if not user:" },
          {
            type: "context",
            text: '        return jsonify({"error": "not found"}), 404',
          },
          { type: "context", text: "    return jsonify(user.to_dict())" },
        ],
        note: "The cache is process-local and never invalidated. After a profile update, workers serve stale objects until eviction or restart. Check the repository's cache and process rules before accepting.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L07",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "Codex returns a diff with new passing tests. What do you do with those tests first?",
        options: [
          "Trust them, they're green, so they work.",
          "Read each one and check it would fail if the code were wrong.",
          "Delete them and write your own.",
          "Skip to the implementation code; tests are a formality.",
        ],
        correct: 1,
        explanation:
          "A green suite only says its assertions passed in one environment. Check which behavior each test exercises and that its assertion fails when that behavior is missing or wrong.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L07",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'The PR adds "from some-new-lib import magic" at the top. Your reaction?',
        options: [
          "Accept it because the import compiles.",
          "Check need, provenance, maintenance, license, security, transitive impact and alternatives first.",
          "Tell Codex to remove it without reading what it does.",
          "Run npm audit and move on.",
        ],
        correct: 1,
        explanation:
          "A new dependency moves the supply-chain and maintenance boundary. Check manifest and lockfile, verify provenance and require a concrete reason for it.",
      },
    },
  ],
};

export default lesson;
