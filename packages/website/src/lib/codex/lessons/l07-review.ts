// Ported from codex/lessons/07-review.html + codex/js/lessons/L07.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L07",
  number: 7,
  title: "Reviewing a Codex PR",
  subtitle: "It wrote 400 lines. Three are subtly wrong. Here's the review checklist that catches them, every time.",
  durationMinutes: 14,
  trackId: "in-the-loop",
  hook: "Trust, but diff.",
  keyConcepts: ["Review checklist", "Circular tests", "Security pass", "Auth bypass"],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Different failure modes",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Reviewing a Codex PR is not the same as reviewing a human PR. The failure modes are different. The biases are different. The things you'd gloss over on a teammate's patch are the exact things worth scrutinizing on an agent's.\n\nHumans make *interesting* mistakes, typos, off-by-ones, missed edge cases. Codex makes *plausible* mistakes. Code that looks right, has the right shape, passes the tests it wrote, and is subtly wrong in a way that only shows up at 3am on a Sunday.\n\nThe fix is not to trust less. It's to have a specific checklist, run it every time, and stop relying on the \"I'll know it when I see it\" reflex. Because you won't.",
        },
        {
          kind: "pull-quote",
          text: "Trust, but diff. Every line. Every time. It takes fifteen minutes and it's worth every one.",
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
            "Six checks, in order. Each one catches a class of Codex-specific failure. Don't skip. Don't reorder, the early ones save you time on the late ones.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "check 01",
              title: "Does it do what you asked?",
              body: "Read the PR title and description against your task spec. Codex sometimes solves a nearby problem instead of the one you posed. Catch this first, it's the most expensive failure to miss.",
            },
            {
              eyebrow: "check 02",
              title: "Is it the right size?",
              body: "Skim the file list. If it touches more files than you expected, the agent did extra work. Sometimes that's fine; sometimes it's scope creep. Compare to what a careful human would touch.",
            },
            {
              eyebrow: "check 03",
              title: "Do the new tests actually test?",
              body: 'The #1 subtle failure. Tests that mock the thing they\'re supposed to verify. Tests that assert the code ran (not that it worked). Read every new test and ask: "would this fail if the implementation were broken?"',
            },
            {
              eyebrow: "check 04",
              title: "Are there new dependencies?",
              body: "Search the diff for imports you don't recognize, or changes to requirements.txt/package.json. Codex is happy to pull in a new library. You should be less happy.",
            },
            {
              eyebrow: "check 05",
              title: "What did it delete?",
              body: 'The red lines are where bugs hide. Codex occasionally deletes things it thinks are redundant, a comment that was load-bearing, a test it reads as "outdated," a fallback that\'s actually the fallback.',
            },
            {
              eyebrow: "check 06",
              title: "Does it match the house style?",
              body: "Error handling, logging, naming, test structure. If it feels like someone else's code, that's usually a sign AGENTS.md was thin, and a signal to strengthen it for next time.",
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
            'Here\'s a real pattern we see all the time. The spec asked for "a rate limiter on /login." The test file looks fine. Find the problem before scrolling.\n\n```\n# tests/api/test_login_rate_limit.py\n\ndef test_login_rate_limit_blocks_after_5(client, mocker):\n    mock_limiter = mocker.patch("api.auth.limiter.is_allowed")\n    mock_limiter.return_value = False\n\n    response = client.post("/login", json={...})\n\n    assert response.status_code == 429\n    mock_limiter.assert_called_once()\n```\n\nThe test passes. The test proves nothing. It mocks `is_allowed` to return `False`, then asserts that /login returns 429, which is what the *mock* made happen. The actual rate limiter could be completely broken. The test would still go green.\n\nCompare with the version that actually verifies behavior:\n\n```\n# the one that actually tests something\n\ndef test_login_blocks_at_6th_attempt(client):\n    for _ in range(5):\n        r = client.post("/login", json={...})\n        assert r.status_code == 401  # bad creds, allowed\n\n    r = client.post("/login", json={...})\n    assert r.status_code == 429  # blocked\n```',
        },
      ],
    },
    {
      id: "s4",
      title: "Spot the problems",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Here's a diff. Find the issue before you scroll to the quiz." }],
    },
    {
      id: "s5",
      title: "The security pass",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "AI-generated code has a characteristic security failure mode: it solves the stated problem correctly while ignoring the implied security constraint you assumed was obvious. The agent wasn't careless, it just wasn't told. A five-minute targeted pass after the functional review catches the most common class.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "sec 01",
              title: "Input trust boundary",
              body: "Trace every user-controlled value. Does it flow into a query, a file path, a shell command, or an HTML response without sanitization? Codex frequently omits validation when the spec doesn't mention it.",
            },
            {
              eyebrow: "sec 02",
              title: "Authentication bypass",
              body: "New endpoints need auth guards. Codex often adds the endpoint correctly but forgets to apply the decorator, middleware, or policy that gates it. Grep every new route for your auth annotation.",
            },
            {
              eyebrow: "sec 03",
              title: "Secrets in source",
              body: "Hardcoded API keys, tokens, or connection strings appear when the agent copies an example from its training context. Grep the diff for anything that looks like a credential before merging.",
            },
            {
              eyebrow: "sec 04",
              title: "Error message leakage",
              body: "Agents tend to return raw exception text in API responses, easy to add, looks fine in tests. An except e: return str(e) leaks stack traces, schema details, and sometimes credentials to callers.",
            },
          ],
        },
        {
          kind: "callout",
          title: "Concrete grep pattern:",
          body: 'after every Codex PR, run git diff main...HEAD | grep -E "(password|secret|token|api_key)\\s*=" and grep -rn "except.*:" --include="*.py" on changed files. Two commands, thirty seconds, catches the two most common AI-specific security misses.',
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
            'Here\'s a before/after that shows the pattern. Spec was: "add a /debug/user endpoint." The agent completed the task correctly, but:\n\n```\n# what Codex produced — functional, insecure\n\n' +
            '@app.route("/debug/user")           # no auth guard\ndef debug_user():\n    user_id = request.args.get("id")  # no validation\n    try:\n        u = db.session.query(User).get(user_id)\n        return jsonify(u.__dict__)       # exposes all columns\n    except Exception as e:\n        return str(e), 500              # leaks stack trace\n\n# corrected version — same feature, secure\n\n' +
            '@app.route("/debug/user")\n' +
            '@require_admin                         # auth guard restored\ndef debug_user():\n    user_id = int(request.args.get("id", 0))  # validated\n    try:\n        u = db.session.query(User).get(user_id)\n        if not u: return jsonify({"error": "not found"}), 404\n        return jsonify(u.to_safe_dict())  # explicit field allowlist\n    except ValueError:\n        return jsonify({"error": "invalid id"}), 400  # safe message\n```',
        },
      ],
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Two questions on reviewing Codex PRs." }],
    },
  ]),
  widgets: [
    {
      kind: "diff-viewer",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: 'PR: "add caching to /users/:id" — what\'s wrong?',
        file: "api/users.py · +18 / −3",
        lines: [
          { type: "context", text: "from flask import Blueprint, jsonify" },
          { type: "add", text: "from functools import lru_cache" },
          { type: "context", text: "" },
          { type: "context", text: 'users_bp = Blueprint("users", __name__)' },
          { type: "context", text: "" },
          { type: "add", text: "@lru_cache(maxsize=1000)" },
          { type: "add", text: "def _get_user_cached(user_id: int):" },
          { type: "add", text: "    return db.session.query(User).filter(User.id == user_id).first()" },
          { type: "add", text: "" },
          { type: "context", text: '@users_bp.route("/users/<int:user_id>")' },
          { type: "context", text: "def get_user(user_id):" },
          { type: "remove", text: "    user = db.session.query(User).filter(User.id == user_id).first()" },
          { type: "add", text: "    user = _get_user_cached(user_id)" },
          { type: "context", text: "    if not user:" },
          { type: "context", text: '        return jsonify({"error": "not found"}), 404' },
          { type: "context", text: "    return jsonify(user.to_dict())" },
        ],
        note: "The bug: lru_cache is process-local and never invalidated. When a user updates their profile, the next GET serves stale data until the server restarts. The test probably passed (\"data is returned\") but the feature is broken. This is why check 06 (match house style) matters: your repo probably uses Redis for caching, with a TTL and invalidation hooks. Codex reached for the simplest Python-standard answer. Reviewable in 30 seconds if you're looking for it.",
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
          "Codex opens a PR with 18 new passing tests. You're reviewing. What do you do FIRST with those tests?",
        options: [
          "Trust them — they're green, so they work.",
          'Read each one and ask: "would this test fail if the implementation were wrong?" If the answer isn\'t obviously yes, the test proves nothing.',
          "Delete them and write your own.",
          "Skip to the implementation code; tests are a formality.",
        ],
        correct: 1,
        explanation:
          "The #1 subtle Codex failure is tests that verify mocks, not behavior. A green suite tells you something ran; it doesn't tell you it worked. For each test: remove the implementation mentally, ask \"would this fail?\" If no, the test is a placebo.",
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
        question: "The PR adds \"from some-new-lib import magic\" at the top. Your reaction?",
        options: [
          "Cool, new dep.",
          "Flag it. Codex will happily pull in a library. You want to know what it is, whether it's maintained, and whether there's an in-house alternative before you ship it.",
          "Tell Codex to remove it without reading what it does.",
          "Run npm audit and move on.",
        ],
        correct: 1,
        explanation:
          "New dependencies are the slowest-moving security and maintenance cost in your repo. Codex doesn't feel that weight. You do. Check 04 exists specifically for this, every unfamiliar import gets a 30-second \"is this the right call\" review.",
      },
    },
  ],
};

export default lesson;
