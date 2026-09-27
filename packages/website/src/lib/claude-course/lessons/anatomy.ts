// Ported from claude/lessons/02-anatomy.html.
// Widget manifest: PromptCompare x1 (cmp), DragReorder x1 (reorder),
// FillBlank x1 (drill), RewriteArena x1 (arena), PromptGrader x1 (grader).
// Wired incrementally as each widget kind lands.
import type { ClaudeLesson } from "../types";
import { CLAUDE_DRAG_REORDER_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "anatomy",
  number: 2,
  title: "Anatomy of a great prompt",
  subtitle:
    "A checklist: context, task, constraints, examples and output format.",
  durationMinutes: 12,
  trackId: "foundations",
  hook: "A useful prompt states the task and acceptance criteria.",
  keyConcepts: [
    "Role, context, task, constraints, examples, format",
    "XML tags",
    "Reasoning controls",
    "Structured outputs",
    "Insufficient-evidence handling",
  ],
  quiz: [],
  sections: [
    {
      id: "contracts-not-incantations",
      title: "A prompt is a specification",
      readTimeMinutes: 1,
      content:
        "State the task, supply the context, set constraints and describe a checkable output. Add a role or an example only when it carries information the task needs.\n\nA short task needs one direct instruction. For repeated tasks, work through the six parts below and write criteria a reviewer or test can verify.",
    },
    {
      id: "six-parts",
      title: "The six parts",
      readTimeMinutes: 1,
      content:
        "- **01 · Role: whose perspective?** A role sets domain, audience or review standard and is no evidence of expertise. Example: `Review this as a technical editor for internal documentation.`\n- **02 · Context: which facts does the task depend on?** Name the audience and authorized sources; strip secrets and unrelated data.\n- **03 · Task: what action is required?** One direct verb. Number several deliverables.\n- **04 · Constraints: what must the output satisfy?** Length, exclusions and required facts as testable rules.\n- **05 · Examples: what does an accepted result look like?** A reviewed, representative and shareable input-output pair fixes tone or structure.\n- **06 · Format: how will the result be consumed?** Markdown, JSON, a table or a schema. Validate machine-readable output.\n\nThis order is one readable arrangement. Change it when your model's documentation or your evals call for it.",
    },
    {
      id: "xml-tags",
      title: "XML tags for clear boundaries",
      readTimeMinutes: 2,
      content:
        "Anthropic documents XML tags as one way to separate instructions, context, examples and variable input. They help most when a prompt mixes content types and replace neither clear requirements nor evaluation.\n\n```\n<context>\nWe're migrating the auth service from cookies to OAuth 2.1 over Q2.\nAudience for this doc: SREs on the infra team.\n</context>\n\n<task>\nDraft a rollout doc with four sections: overview, risks, on-call runbook, rollback plan.\n</task>\n\n<constraints>\n- Under 600 words.\n- No marketing language.\n- Must mention the kill-switch procedure.\n</constraints>\n\n<example>\n[paste a prior rollout doc here that matches the voice you want]\n</example>\n\n<format>\nMarkdown. H2 for each section. Code blocks for shell commands.\n</format>\n```\n\nUse consistent, descriptive tag names, nest only for real hierarchy and test on representative inputs.",
    },
    {
      id: "pro-moves",
      title: "Three current controls",
      readTimeMinutes: 1,
      content:
        "- **Reasoning controls.** Where model and API support extended thinking, configure it through the documented API. Ask for conclusions and evidence instead of private chain-of-thought.\n- **Output controls.** Prefer structured outputs or an explicit schema. Claude 4.6 and later do not support assistant-response prefilling, so check your model's API documentation first.\n- **Insufficient evidence.** State the exact response for missing information. That lowers the pressure to guess but guarantees no accuracy, so verify the result.",
    },
  ],
  widgets: [
    {
      kind: "prompt-compare",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "anatomy",
        cpId: "compare",
        weak: "write a launch email for our new SSO rollout",
        strong:
          'You are a senior comms writer, writing for an engineering audience.\n\n<context>\nWe are rolling out OAuth 2.1 SSO to replace legacy cookie auth on internal tools.\nMigration window: 6 weeks, opt-in first, then forced cutover.\nThe on-call rotation is @auth-oncall.\nAudience: ~3000 engineers across the organization, mixed seniority.\n</context>\n\n<task>\nDraft a launch email announcing the rollout to engineering.\n</task>\n\n<constraints>\n- Under 250 words.\n- No marketing language. Crisp, factual.\n- Must include: the migration window, the opt-in date, the forced-cutover date, and how to get help.\n- Tone: internal voice, direct, respectful of readers\' time.\n- Give readers a clear single next action.\n</constraints>\n\n<format>\nMarkdown. Subject line first, then body. Sign-off from "The Identity Platform team."\n</format>',
      },
    },
    {
      kind: "drag-reorder",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "anatomy",
        cpId: "reorder",
        title: "Order the six parts",
        prompt:
          "Put the sections in this lesson's example order.",
        hint: "Drag a card or use the up and down buttons.",
        blocks: [
          {
            id: "role",
            label: "Role",
            sample: '"You are a senior technical editor."',
          },
          {
            id: "context",
            label: "Context",
            sample: '"We are migrating to OAuth 2.1; audience is SRE."',
          },
          { id: "task", label: "Task", sample: '"Draft a rollout doc."' },
          {
            id: "constraints",
            label: "Constraints",
            sample: '"Under 600 words. No marketing language."',
          },
          {
            id: "examples",
            label: "Examples",
            sample: '"<example>…prior rollout doc…</example>"',
          },
          {
            id: "format",
            label: "Format",
            sample: '"Markdown with H2 sections and bullet lists."',
          },
        ],
        correctOrder: [
          "role",
          "context",
          "task",
          "constraints",
          "examples",
          "format",
        ],
        copy: CLAUDE_DRAG_REORDER_COPY,
      },
    },
    {
      kind: "fill-blank",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "anatomy",
        cpId: "drill",
        goal: "Summarize a 30-page PRD into an executive brief.",
        template:
          "You are {{0}}.\n\n<context>\n{{1}}\n</context>\n\n<task>\n{{2}}\n</task>\n\n<constraints>\n{{3}}\n</constraints>\n\n<format>\n{{4}}\n</format>",
        blanks: [
          { label: "Role", hint: "e.g. a senior PM who writes exec summaries" },
          {
            label: "Context",
            hint: "what's the PRD about? who reads this brief? what decisions hang on it?",
          },
          { label: "Task", hint: 'one verb, "summarize", "extract", "draft"' },
          {
            label: "Constraints",
            hint: "length, tone, must-includes, must-avoids",
          },
          {
            label: "Format",
            hint: "bullets, sections, Markdown or a fixed structure",
          },
        ],
      },
    },
    {
      kind: "rewrite-arena",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "anatomy",
        cpId: "arena",
        task: "Produce release notes for an internal tooling update.",
        original:
          "write release notes for our new changes this week plz, make it good",
        criteria:
          "Task, context, constraints and format present; specific; role, example or XML tags only where they help; no filler.",
      },
    },
    {
      kind: "prompt-grader",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "anatomy",
        cpId: "grade",
        task: "Rewrite a rambling Slack message into a crisp update with tl;dr, status, blockers, and next step.",
        rubric:
          "Must state the task, relevant context, testable constraints, and output format. Add a role, example, rubric, or XML boundaries only where they clarify the work.",
      },
    },
  ],
};

export default lesson;
