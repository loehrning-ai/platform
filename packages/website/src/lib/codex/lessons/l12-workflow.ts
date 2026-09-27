// Ported from codex/lessons/12-workflow.html + codex/js/lessons/L12.js.
// Lesson 12 IS the capstone — confirmed against codex/js/lessons.js (12
// lessons total, no separate 13th capstone entry) and this lesson's own
// "final capstone" badge / "+80 XP · course complete" meta line.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L12",
  number: 12,
  title: "A Reviewable Development Workflow",
  subtitle:
    "Take one change from request to release with explicit decisions, bounded tasks, independent review and verified deployment.",
  durationMinutes: 15,
  trackId: "advanced",
  hook: "Keep intent, evidence, and accountability connected.",
  keyConcepts: [
    "Discuss-plan-implement-review-ship-learn",
    "Workflow chain",
    "Capstone",
    "Circular tests",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "The capstone",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "One change, from a chat message to a deployed endpoint. At each stage, name the decision owner, the repository evidence, the execution boundary and the review gate. Judge each tempting shortcut by the risk it leaves unowned.",
        },
      ],
    },
    {
      id: "s2",
      title: "The workflow chain",
      readTimeMinutes: 3,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Adapt the six phases to the change; ownership stays explicit from request to post-deployment checks.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "phase 01",
              title: "Discuss",
              body: "Capture problem, affected systems, success conditions, constraints, data sensitivity and open decisions. Settle product and security choices first.",
            },
            {
              eyebrow: "phase 02",
              title: "Plan",
              body: "Map dependencies and valid intermediate states. Split tasks, assign acceptance evidence, record the base revision, mark approval steps.",
            },
            {
              eyebrow: "phase 03",
              title: "Implement",
              body: "Run each bounded task in its configured environment. Serialize dependencies and record commands and environment assumptions.",
            },
            {
              eyebrow: "phase 04",
              title: "Review",
              body: "Compare the full diff with task and excluded scope, read tests and logs, rerun trusted checks. Comment on local defects; restart on a wrong premise.",
            },
            {
              eyebrow: "phase 05",
              title: "Ship",
              body: "Use the normal merge, deployment and rollback process. Only the deployed artifact in the target environment proves the release.",
            },
            {
              eyebrow: "phase 06",
              title: "Learn",
              body: "Record a durable, non-obvious repository rule only for a real gap. Task findings go in the issue or pull request.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "Ceremony follows risk and reversibility. A small local change needs a brief task and one check; authentication, data, payment or migration changes need security and rollout evidence, however short the code.",
        },
      ],
    },
    {
      id: "s3",
      title: "Scene 01 · The request",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Incoming request:" },
        {
          kind: "callout",
          title: "#payments-team · priya",
          body: "\"hey, finance is asking for a CSV export of all active subscriptions, updated nightly. need it live by friday. can you handle this? what's the first thing you'd do?\"",
        },
      ],
    },
    {
      id: "s4",
      title: "Scene 02 · Writing the spec",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "First task after decomposition: *add a /admin/exports/subscriptions.csv endpoint that streams active subscriptions as CSV*. Nightly scheduling and delivery follow as separate tasks. Which spec opener is strongest?",
        },
      ],
    },
    {
      id: "s5",
      title: "Scene 03 · Review the diff",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The diff arrives with passing checks. Read what actually changed.",
        },
      ],
    },
    {
      id: "s6",
      title: "Scene 04 · Targeted correction",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The test replaces active_subscriptions() and checks how the returned fixture is serialized, so selecting active subscriptions stays untested. Which comment names the missing evidence precisely?",
        },
      ],
    },
    {
      id: "s7",
      title: "Scene 05 · After merge",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The revised tests cover selection and serialization, the full diff is reviewed and trusted checks pass. Before the scheduler task, record any durable decision it depends on.",
        },
      ],
    },
    {
      id: "s8",
      title: "Course complete",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Three operating rules:\n\n1. **Separate facts from hypotheses.** Keep file references, exact command results and verified constraints; drop unsupported explanations.\n2. **Restart on a false premise.** Correct local defects in place; write a new task when goal, architecture or scope must change.\n3. **Bound work by review capacity.** Launch no more concurrent tasks than the team can inspect, integrate and verify at the required risk level.\n\nA coding agent's output is a proposed change. The accountable human owns acceptance, merge, deployment and incident response.",
        },
      ],
    },
  ]),
  widgets: [
    {
      kind: "quiz",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        lessonId: "L12",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          'The ask is "CSV export, nightly, live by Friday." What do you do first?',
        options: [
          "Open the agent, paste Priya's message verbatim, hit run.",
          "Clarify columns, access, volume, destination, retention and deadline, then split by real dependencies.",
          "Ask Priya for the exact CSV columns and ship it as one big task.",
          "Tell Priya it is not feasible this week.",
        ],
        correct: 1,
        explanation:
          "The request mixes data contract, authorization, export, scheduling and delivery. Settle the open product and security decisions, then split only where each intermediate state is valid and reviewable.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L12",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question: "Best opening for the spec of task (a), the export endpoint?",
        options: [
          '"Add a CSV export of subscriptions."',
          '"Goal: GET /admin/exports/subscriptions.csv returns all active subscriptions as CSV, streamed (not loaded into memory). Columns: id, customer_email, plan, status, current_period_end."',
          '"Do the finance CSV thing."',
          '"Build a reporting system."',
        ],
        correct: 1,
        explanation:
          "It names route, fields, selection rule and memory constraint. Authorization and CSV-safety criteria are still missing, yet it defines far more reviewable behavior than the other options.",
      },
    },
    {
      kind: "diff-viewer",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "PR · api/admin/exports.py",
        file: "api/admin/exports.py",
        lines: [
          {
            type: "add",
            text: "from flask import Blueprint, Response, stream_with_context",
          },
          { type: "add", text: "from auth import admin_required" },
          {
            type: "add",
            text: "from repositories.subscriptions import active_subscriptions",
          },
          { type: "add", text: "import csv, io" },
          { type: "add", text: "" },
          { type: "add", text: 'exports_bp = Blueprint("exports", __name__)' },
          { type: "add", text: "" },
          {
            type: "add",
            text: '@exports_bp.route("/admin/exports/subscriptions.csv")',
          },
          { type: "add", text: "@admin_required" },
          { type: "add", text: "def export_subscriptions():" },
          { type: "add", text: "    def generate():" },
          { type: "add", text: "        buf = io.StringIO()" },
          { type: "add", text: "        w = csv.writer(buf)" },
          {
            type: "add",
            text: '        w.writerow(["id","email","plan","status","current_period_end"])',
          },
          { type: "add", text: "        yield buf.getvalue()" },
          { type: "add", text: "        buf.seek(0); buf.truncate(0)" },
          {
            type: "add",
            text: "        for sub in active_subscriptions(stream=True):",
          },
          {
            type: "add",
            text: "            w.writerow([sub.id, sub.customer_email, sub.plan,",
          },
          {
            type: "add",
            text: "                        sub.status, sub.current_period_end.isoformat()])",
          },
          { type: "add", text: "            yield buf.getvalue()" },
          { type: "add", text: "            buf.seek(0); buf.truncate(0)" },
          {
            type: "add",
            text: "    return Response(stream_with_context(generate()),",
          },
          { type: "add", text: '                    mimetype="text/csv")' },
          { type: "context", text: "" },
          {
            type: "context",
            text: "# --- tests/api/admin/test_exports.py ---",
          },
          {
            type: "add",
            text: "def test_export_subscriptions(client, mocker):",
          },
          {
            type: "add",
            text: '    mocker.patch("api.admin.exports.active_subscriptions",',
          },
          {
            type: "add",
            text: '        return_value=[FakeSub(1, "a@example.com", "pro", "active", ...)])',
          },
          {
            type: "add",
            text: '    r = client.get("/admin/exports/subscriptions.csv")',
          },
          { type: "add", text: "    assert r.status_code == 200" },
          { type: "add", text: '    assert b"a@example.com" in r.data' },
        ],
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L12",
        cpId: "q3",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question: "First scan of the PR. What is the biggest concern?",
        options: [
          "The endpoint does not use streaming.",
          "The test never proves that only active subscriptions are selected.",
          "The imports are in the wrong order.",
          "Nothing, tests pass.",
        ],
        correct: 1,
        explanation:
          "The test supplies the repository output, so it exercises serialization but never the active-status filter. Add evidence through the real selection boundary and keep focused serialization tests where useful.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L12",
        cpId: "q4",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question: "Which comment states the missing test evidence precisely?",
        options: [
          '"test is weak, please improve"',
          '"make it test the real thing"',
          "\"tests/api/admin/test_exports.py::test_export_subscriptions checks serialization only. Add an integration test through the real repository that seeds active and canceled rows and asserts that only active rows appear.\"",
          '"add more tests"',
        ],
        correct: 2,
        explanation:
          "It names existing coverage, missing behavior, test location and required boundary, so the revision can be checked against it. \"Weak\" or \"more\" leave the intent to guesswork.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L12",
        cpId: "q5",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "Before you move to task 02, which habit preserves the evidence and decisions from task 01?",
        options: [
          "Close the PR tab and move on.",
          "Add \"tests that mock their own subject fail here\" to the agent instructions.",
          "Rewrite the PR description yourself.",
          "Archive the PR in a private document.",
        ],
        correct: 1,
        explanation:
          "A rule belongs in AGENTS.md only when it is durable, repository-specific and not already enforced by tests or tooling. Task-specific decisions and evidence stay in the issue or pull request, with their context.",
      },
    },
  ],
};

export default lesson;
