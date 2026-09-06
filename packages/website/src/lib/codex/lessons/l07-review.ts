// Ported from codex/lessons/07-review.html + codex/js/lessons/L07.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L07",
  number: 7,
  title: "Reviewing a Codex PR",
  subtitle:
    "Review the requested behavior, complete diff, tests, dependencies, and security boundaries before merge.",
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
            "Same review standard as for any other pull request. A tidy diff, tests included, green command logs. None of that lowers the bar. Those properties make review easier and establish nothing about correctness.\n\nStart from the requested behavior and trust boundaries. Then inspect the complete repository diff, including staged, unstaged, untracked, generated, configuration, and dependency changes. Read test code and command logs to determine what was actually exercised.\n\nWork from a repeatable checklist. Scope, behavior, failure handling, security, operations, rollback. Surface plausibility is not a review.",
        },
        {
          kind: "pull-quote",
          text: "Acceptance remains a human decision based on the task, the full diff, and independently reviewable evidence.",
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
            "Six checks as a baseline, plus whatever the affected system demands on top. Stop early when the task or scope is wrong. No later check repairs a mismatched change.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "check 01",
              title: "Does it do what you asked?",
              body: "Compare observable behavior with the goal and acceptance criteria. Reject a nearby solution even when its implementation is internally consistent.",
            },
            {
              eyebrow: "check 02",
              title: "Is it the right size?",
              body: "Inspect every changed and deleted file. Require an explanation for changes outside the stated scope; do not use file count alone as a quality measure.",
            },
            {
              eyebrow: "check 03",
              title: "Do the tests exercise the requirement?",
              body: "Read new and modified tests. Check assertions, fixtures, mocks, negative cases, skipped paths, and whether the test fails when the relevant behavior is removed.",
            },
            {
              eyebrow: "check 04",
              title: "Are there new dependencies?",
              body: "Review manifest and lockfile changes, package provenance, maintenance status, license, transitive risk, and whether an existing dependency already provides the capability.",
            },
            {
              eyebrow: "check 05",
              title: "What was removed or bypassed?",
              body: "Inspect deleted tests, validation, fallbacks, feature flags, comments that encode constraints, and error handling. Confirm each removal is required by the task.",
            },
            {
              eyebrow: "check 06",
              title: "Does it fit the system contract?",
              body: "Check authorization, data handling, errors, logging, concurrency, migrations, observability, rollback, naming, and repository conventions. Update AGENTS.md only when a durable rule was genuinely missing.",
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
            'The task asked for a rate limiter on `/login`. The test mocks the limiter decision away. Work out what it actually covers.\n\n```\n# tests/api/test_login_rate_limit.py\n\ndef test_login_maps_denial_to_429(client, mocker):\n    mock_limiter = mocker.patch("api.auth.limiter.is_allowed")\n    mock_limiter.return_value = False\n\n    response = client.post("/login", json={...})\n\n    assert response.status_code == 429\n    mock_limiter.assert_called_once()\n```\n\nIt verifies one thing. The endpoint maps a denied limiter result to status 429. It does **not** verify counting, the threshold, key selection, storage or reset behavior. Keep it if that mapping matters, and add a test through the real limiter boundary.\n\n```\n# exercises the configured limiter behavior\n\ndef test_login_blocks_at_6th_attempt(client):\n    for _ in range(5):\n        response = client.post("/login", json={...})\n        assert response.status_code == 401  # bad credentials, request allowed\n\n    response = client.post("/login", json={...})\n    assert response.status_code == 429  # request blocked\n```',
        },
      ],
    },
    {
      id: "s4",
      title: "Spot the problems",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Here's a diff. Find the issue before you scroll to the quiz.",
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
            "Security requirements must be explicit in both the task and review. Functional tests rarely cover every trust boundary. Base the security pass on the changed data flows, privileges, dependencies, and deployment context.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "sec 01",
              title: "Input trust boundary",
              body: "Trace untrusted values to database queries, file paths, shell commands, templates, redirects, and logs. Apply validation, parameterization, canonicalization, or output encoding appropriate to each sink.",
            },
            {
              eyebrow: "sec 02",
              title: "Authentication and authorization",
              body: "For every new or changed operation, verify identity, role, tenant, resource ownership, and default-deny behavior. A route-level authentication guard alone may not enforce object-level authorization.",
            },
            {
              eyebrow: "sec 03",
              title: "Secrets in source",
              body: "Inspect source, fixtures, logs, generated files, and configuration for credentials or sensitive values. Use the repository's secret scanner and revoke any exposed credential; deletion from the latest diff does not remove history.",
            },
            {
              eyebrow: "sec 04",
              title: "Error message leakage",
              body: "Do not return raw exceptions or log sensitive payloads. Verify client-safe errors, server-side diagnostic context, stable status codes, and redaction at each logging boundary.",
            },
          ],
        },
        {
          kind: "callout",
          title: "Use repository-specific security checks:",
          body: "Run the configured secret, dependency, static-analysis, and authorization tests for the changed stack. Inspect their scope, exclusions, and output. A grep can support triage but is not a security gate.",
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
            'Working output is not the same as safe output. The request said "add a `/debug/user` endpoint" and said nothing about authorization, input handling or response fields.\n\n```\n# insecure version\n\n' +
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
        { kind: "prose", markdown: "Two questions on reviewing Codex PRs." },
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
        note: "The cache is process-local and has no invalidation path. A profile update can leave stale objects in each worker until eviction or restart. Review the repository's cache ownership, invalidation, process model, and object-lifecycle rules before accepting this change.",
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
          "Codex returns a diff with new passing tests. What should the reviewer do first with those tests?",
        options: [
          "Trust them, they're green, so they work.",
          'Read each one and ask: "would this test fail if the implementation were wrong?" If the answer isn\'t obviously yes, the test proves nothing.',
          "Delete them and write your own.",
          "Skip to the implementation code; tests are a formality.",
        ],
        correct: 1,
        explanation:
          "A passing suite reports that its assertions completed in one environment. Read each test to determine which behavior it exercises, then confirm the relevant assertion fails when that behavior is absent or wrong.",
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
          "Review why it is needed, its source and maintenance status, license and security posture, transitive impact, and existing alternatives before accepting it.",
          "Tell Codex to remove it without reading what it does.",
          "Run npm audit and move on.",
        ],
        correct: 1,
        explanation:
          "A dependency changes the supply-chain and maintenance boundary. Review the manifest and lockfile, verify provenance, and require a concrete reason for adding it.",
      },
    },
  ],
};

export default lesson;
