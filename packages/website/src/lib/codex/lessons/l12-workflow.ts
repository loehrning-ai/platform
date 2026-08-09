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
    "Move from request to release through explicit decisions, bounded implementation, independent review, and verified deployment.",
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
            "This capstone follows one change from request through deployment. At each stage, identify the decision owner, required repository evidence, execution boundary, and review gate.\n\nThe alternatives are plausible shortcuts. Evaluate them by the risks they leave unowned rather than memorizing one tool sequence.",
        },
        {
          kind: "pull-quote",
          text: "A defensible workflow makes each decision, assumption, diff, and verification result inspectable by the accountable reviewer.",
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
            "A repeatable workflow reduces hidden assumptions. Adapt the phases to the change, but retain explicit ownership from request through post-deployment verification:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "phase 01",
              title: "Discuss",
              body: "Capture the user problem, affected systems, success conditions, constraints, data sensitivity, and unresolved decisions. Do not begin implementation while a material product or security choice remains implicit.",
            },
            {
              eyebrow: "phase 02",
              title: "Plan",
              body: "Map dependencies and valid intermediate states. Split coherent tasks, assign acceptance evidence, record the base revision, and state which steps require approval. A task may produce a local diff or pull request depending on the workflow.",
            },
            {
              eyebrow: "phase 03",
              title: "Implement",
              body: "Use the configured local or cloud environment for each bounded task. Serialize dependencies, isolate genuinely independent work, and record the commands and environment assumptions used.",
            },
            {
              eyebrow: "phase 04",
              title: "Review",
              body: "Compare the complete diff with the task and excluded scope. Read tests and logs, inspect security and operational effects, and re-run trusted checks. Restart when the premise is wrong or revisions diverge; use targeted comments for local defects.",
            },
            {
              eyebrow: "phase 05",
              title: "Ship",
              body: "Use the repository's normal merge, deployment, rollback, and change-approval process. Verify the deployed artifact and relevant behavior in the target environment; local or task-environment success is not deployment proof.",
            },
            {
              eyebrow: "phase 06",
              title: "Learn",
              body: "Record durable, non-obvious repository rules only when the task exposed a real gap. Keep task-specific findings in the issue or pull request, and preserve incident or deployment evidence in the system that owns it.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            "The amount of ceremony should follow risk and reversibility. A small local change may need a brief task and one check; an authentication, data, payment, or migration change needs explicit security and rollout evidence. Do not omit a gate merely because the implementation is short.",
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
            "You have decomposed it. The first task is: *add a /admin/exports/subscriptions.csv endpoint that streams active subscriptions as CSV*. Nightly scheduling and delivery are separate follow-on tasks.\n\nYou are about to write the spec. Which of these is the strongest opener?",
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
            "The implementation returns a diff and reports passing checks. Review the actual changes:",
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
            "The test replaces active_subscriptions() and then checks serialization of the returned fixture. That covers endpoint formatting but not active-subscription selection. Which review comment states the missing evidence precisely?",
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
            "The revised tests cover selection and serialization, the full diff has been reviewed, and trusted checks pass. Before moving to the scheduler task, preserve any durable decision that the next task depends on.",
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
            "Use three operating rules after the course:\n\n1. **Separate facts from hypotheses.** Keep file references, exact command results, and verified constraints. Discard unsupported explanations.\n2. **Restart on a false premise.** Use targeted revision for local defects; write a new task when the goal, architecture, or scope must change.\n3. **Bound work by review capacity.** Do not launch more concurrent tasks than the team can inspect, integrate, and verify at the required risk level.\n\nThe output of a coding agent remains a proposed change. The accountable human owns acceptance, merge, deployment, and incident response.",
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
          "Clarify columns, authorization, data volume, delivery destination, retention, and deadline; then separate the endpoint, schedule, and delivery work along real dependency boundaries.",
          "Ask Priya for the exact CSV columns and ship it as one big task.",
          "Tell Priya it is not feasible this week.",
        ],
        correct: 1,
        explanation:
          "The request combines data contract, authorization, export generation, scheduling, and delivery. Resolve the missing product and security decisions, then split only where the intermediate state is valid and independently reviewable.",
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
          "The specification names the route, fields, selection rule, and memory constraint. It still needs authorization and CSV-safety criteria, but it defines substantially more reviewable behavior than the other options.",
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
          "The test covers CSV serialization of a supplied record but does not prove that only active subscriptions are selected.",
          "The imports are in the wrong order.",
          "Nothing, tests pass.",
        ],
        correct: 1,
        explanation:
          "The test supplies the repository output, so it can exercise endpoint serialization but not the repository's active-status filter. Add evidence through the real selection boundary and retain focused serialization tests where useful.",
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
          '"tests/api/admin/test_exports.py::test_export_subscriptions verifies serialization but not active-status selection. Add an integration test that seeds active and canceled rows, calls the endpoint through the real repository, and asserts that only active rows appear. Keep a focused serialization test if it covers separate behavior."',
          '"add more tests"',
        ],
        correct: 2,
        explanation:
          'The precise comment identifies the existing coverage, the missing behavior, the test location, and the required boundary. The reviewer can evaluate the revision against those statements without inferring intent from words such as "weak" or "more."',
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
          '"Note the lesson learned, \\"tests that mock their own subject are a failure mode here\\", and add a line to your agent instructions file so the next run does not repeat it."',
          "Rewrite the PR description yourself.",
          "Archive the PR in a private document.",
        ],
        correct: 1,
        explanation:
          "Record a rule in AGENTS.md only when it is durable, repository-specific, and not already enforced by tests or tooling. Preserve task-specific decisions and evidence in the issue or pull request so future work can trace their context.",
      },
    },
  ],
};

export default lesson;
