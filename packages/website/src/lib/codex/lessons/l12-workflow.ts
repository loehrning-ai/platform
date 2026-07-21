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
  title: "Your AI Dev Workflow",
  subtitle:
    "End-to-end workflow: discuss → plan → implement → review → ship → learn. The capstone task you choose every move.",
  durationMinutes: 15,
  trackId: "advanced",
  hook: "From knowledge to habit.",
  keyConcepts: ["Discuss-plan-implement-review-ship-learn", "Workflow chain", "Capstone", "Circular tests"],
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
            'Everything in this course comes together here. Before the capstone walkthrough, we lay out the full workflow chain, the sequence of phases that takes a raw idea from "someone asked for this" to "shipped and monitored." Then you walk through one realistic task, choosing the right move at each decision point.\n\nThe wrong answers in the capstone are not absurd, they are the things you would genuinely reach for if you had not been through the previous eleven lessons. Notice *why* the correct path is correct, not just what it is.',
        },
        {
          kind: "pull-quote",
          text: "The goal is not to memorize the right moves. It is to feel the shape of the problem space so the right move feels obvious.",
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
            'Consistent output from AI-assisted development comes from a consistent workflow. Ad hoc "just ask the agent" approaches produce inconsistent results, sometimes great, sometimes a mess. The teams that scale reliably follow a repeatable chain:',
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "phase 01",
              title: "Discuss",
              body: "Before any code, capture intent. What is the actual problem? What does done look like? What are the constraints? Keep it conversational. A good discussion surfaces assumptions and ambiguities before they become expensive bugs.",
            },
            {
              eyebrow: "phase 02",
              title: "Plan",
              body: "Turn the discussion into a concrete implementation plan. Break work into discrete, independently-reviewable tasks. Identify dependencies. Assign acceptance criteria to each task. The plan is a checklist, each item will become a PR.",
            },
            {
              eyebrow: "phase 03",
              title: "Implement",
              body: "Run the agent on each task in the plan. One task at a time for dependent work; in parallel for independent tasks (lesson 10). Each task produces one PR. Keep scope tight.",
            },
            {
              eyebrow: "phase 04",
              title: "Review",
              body: "Review each PR as you would any human-authored one. Check the diff, look for the failure modes from lesson 07 (circular tests, missing error handling, wrong scope). Two revision rounds max, then re-spec if still stuck (lesson 11).",
            },
            {
              eyebrow: "phase 05",
              title: "Ship",
              body: "Merge, deploy, and verify. AI-written code ships through the same pipeline as human-written code, CI, deployment gates, monitoring. No special treatment needed. If something breaks post-deploy, treat it like any regression.",
            },
            {
              eyebrow: "phase 06",
              title: "Learn",
              body: "After each task: did the agent make a mistake that a better spec would have prevented? Update your agent instructions file with the lesson. 60 seconds of reflection per task compounds into a dramatically better agent over months.",
            },
          ],
        },
        {
          kind: "prose",
          markdown:
            'The chain does not have to be heavyweight. For a small task, "discuss" might be two sentences in a comment. "Plan" might be three bullet points. "Implement" is one agent run. The phases exist as thinking checkpoints, not bureaucratic steps. The habit is the thing.',
        },
      ],
    },
    {
      id: "s3",
      title: "Scene 01 · The request",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "09:14 Monday. Slack:" },
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
      title: "Scene 03 · The PR comes back",
      readTimeMinutes: 2,
      blocks: [{ kind: "prose", markdown: "41 minutes later. PR opened. You look at the diff:" }],
    },
    {
      id: "s6",
      title: "Scene 04 · The nudge",
      readTimeMinutes: 1,
      blocks: [
        {
          kind: "prose",
          markdown:
            "You have noticed: the test mocks active_subscriptions() and asserts the response contains what the mock returned. It is testing the mock, not the endpoint (lesson 11, the circular test pattern). Time to nudge. Which comment will land the fix on the first try?",
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
            "The PR is solid. Tests verify real behavior. Review is clean. You are about to merge and move to task 02 (the nightly scheduler). One last habit pays off over time. What is it?",
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
            "You have got it. The mental model, the craft, the loop, the safety net. The thing left is practice, and that is the easy part, because the tools are cheap to run and fast to learn from.\n\nThree parting habits that pay off forever:\n\n1. **Every failed run is signal.** Read the transcript. Ask: \"what part of my spec was ambiguous?\" Update your agent instructions file. One line learned per run compounds fast.\n2. **Two revisions, then rewrite.** If a PR is stuck after two rounds of comments, re-spec from scratch. Faster every time.\n3. **Keep the review queue short.** Your bottleneck shifts from \"who has time to build this\" to \"who has time to review.\" Four or five parallel PRs in review at once is a sweet spot, more than that and review quality drops.\n\nThat is the whole thing. Go build.",
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
        question: 'The ask is "CSV export, nightly, live by Friday." What do you do first?',
        options: [
          "Open the agent, paste Priya's message verbatim, hit run.",
          "Decompose: (a) write the export endpoint, (b) add the nightly schedule, (c) wire up the delivery destination. Three smaller tasks — the first one is a morning's work.",
          "Ask Priya for the exact CSV columns and ship it as one big task.",
          "Tell Priya it is not feasible this week.",
        ],
        correct: 1,
        explanation:
          '"CSV export + schedule + delivery" is three separate concerns. Ship it as one task and you get a tangled PR that is hard to review and hard to revise. Decompose and each piece lands clean. Ask Priya for columns while decomposing, you need that information for task (a).',
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
        question: "Best opening for the spec of task (a) — the export endpoint?",
        options: [
          '"Add a CSV export of subscriptions."',
          '"Goal: GET /admin/exports/subscriptions.csv returns all active subscriptions as CSV, streamed (not loaded into memory). Columns: id, customer_email, plan, status, current_period_end."',
          '"Do the finance CSV thing."',
          '"Build a reporting system."',
        ],
        correct: 1,
        explanation:
          'One sentence of goal. Explicit route. Explicit columns (removes guessing). "Streamed" is a non-obvious constraint, many subscription tables are large, and a naive implementation loads them all into memory and fails in production. Closing that ambiguity upfront saves a revision.',
      },
    },
    {
      kind: "diff-viewer",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "PR · api/admin/exports.py",
        file: "api/admin/exports.py · +38 / −0",
        lines: [
          { type: "add", text: "from flask import Blueprint, Response, stream_with_context" },
          { type: "add", text: "from auth import admin_required" },
          { type: "add", text: "from repositories.subscriptions import active_subscriptions" },
          { type: "add", text: "import csv, io" },
          { type: "add", text: "" },
          { type: "add", text: 'exports_bp = Blueprint("exports", __name__)' },
          { type: "add", text: "" },
          { type: "add", text: '@exports_bp.route("/admin/exports/subscriptions.csv")' },
          { type: "add", text: "@admin_required" },
          { type: "add", text: "def export_subscriptions():" },
          { type: "add", text: "    def generate():" },
          { type: "add", text: "        buf = io.StringIO()" },
          { type: "add", text: "        w = csv.writer(buf)" },
          { type: "add", text: '        w.writerow(["id","email","plan","status","current_period_end"])' },
          { type: "add", text: "        yield buf.getvalue()" },
          { type: "add", text: "        buf.seek(0); buf.truncate(0)" },
          { type: "add", text: "        for sub in active_subscriptions(stream=True):" },
          { type: "add", text: "            w.writerow([sub.id, sub.customer_email, sub.plan," },
          { type: "add", text: "                        sub.status, sub.current_period_end.isoformat()])" },
          { type: "add", text: "            yield buf.getvalue()" },
          { type: "add", text: "            buf.seek(0); buf.truncate(0)" },
          { type: "add", text: "    return Response(stream_with_context(generate())," },
          { type: "add", text: '                    mimetype="text/csv")' },
          { type: "context", text: "" },
          { type: "context", text: "# --- tests/api/admin/test_exports.py ---" },
          { type: "add", text: "def test_export_subscriptions(client, mocker):" },
          {
            type: "add",
            text: '    mocker.patch("api.admin.exports.active_subscriptions",',
          },
          { type: "add", text: '        return_value=[FakeSub(1, "a@example.com", "pro", "active", ...)])' },
          { type: "add", text: '    r = client.get("/admin/exports/subscriptions.csv")' },
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
          "The test mocks active_subscriptions() and then asserts the response contains what the mock returned — it is testing the mock, not the behavior.",
          "The imports are in the wrong order.",
          "Nothing — tests pass.",
        ],
        correct: 1,
        explanation:
          "The endpoint implementation is fine, it does stream. The test is the classic circular pattern from lesson 11: it replaces the thing it claims to verify. Green suite, zero behavior proof. The endpoint could return anything and the test would still pass.",
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
        question: "The comment that lands the fix first try:",
        options: [
          '"test is weak, please improve"',
          '"make it test the real thing"',
          '"tests/api/admin/test_exports.py::test_export_subscriptions mocks active_subscriptions and then asserts the response contains the mock data — which proves nothing. Rewrite to: seed 3 real subscription rows in the test db (2 active, 1 canceled), hit the endpoint, assert the CSV has 2 data rows with the right emails, and the canceled one is absent."',
          '"add more tests"',
        ],
        correct: 2,
        explanation:
          "Good nudges have three parts: what is wrong, where it is, and what right looks like. The winning comment has all three and a concrete fixture plan. The agent can implement it in one pass. Vague feedback (\"weak\", \"improve\", \"more\") forces the agent to guess what you mean, which is how you end up at revision three.",
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
        question: "Before you move to task 02, what is the highest-leverage habit?",
        options: [
          "Close the PR tab and move on.",
          '"Note the lesson learned — \\"tests that mock their own subject are a failure mode here\\" — and add a line to your agent instructions file so the next run does not repeat it."',
          "Rewrite the PR description yourself.",
          "Archive the PR in a private document.",
        ],
        correct: 1,
        explanation:
          'Your agent instructions file gets smarter from rejections. The 30 seconds you spend adding one line ("tests must exercise real behavior, not mocked subjects") pays back on every future run in this repo. This is the habit separating teams that level up with AI assistance from teams that coexist with it.',
      },
    },
  ],
};

export default lesson;
