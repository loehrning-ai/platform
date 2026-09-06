// Ported from claude/lessons/02-anatomy.html.
// Widget manifest: PromptCompare x1 (cmp), DragReorder x1 (reorder),
// FillBlank x1 (drill), RewriteArena x1 (arena), PromptGrader x1 (grader).
// Wired incrementally as each widget kind lands.
import type { ClaudeLesson } from "../types";
import { CLAUDE_DRAG_REORDER_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "anatomy",
  number: 2,
  title: "Anatomy of a Great Prompt",
  subtitle:
    "A practical checklist: context, task, constraints, examples, and output format.",
  durationMinutes: 12,
  trackId: "foundations",
  hook: "Useful prompts make the task and acceptance criteria explicit.",
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
      title: "Prompts are contracts, not incantations",
      readTimeMinutes: 2,
      content:
        "You type one line into the box and get back a wall of hedging. The prompt was not wrong, it was underspecified. A prompt is a specification: state the task, supply the context, define constraints, describe an output that can be checked. Add a role or an example only when it carries information the task needs.\n\nThe six parts below are a checklist, not a syntax and not a required order. Short tasks need one direct instruction. Repeated tasks earn explicit sections and acceptance criteria.\n\n> Write requirements a reviewer or test can verify.",
    },
    {
      id: "six-parts",
      title: "The six parts",
      readTimeMinutes: 4,
      content:
        "- **01 · Role: whose perspective?** A role sets domain, audience, or review standard. It is not evidence of expertise.\n  ```\n  Review this as a technical editor for internal documentation.\n  ```\n- **02 · Context: which facts does the task depend on?** Name the audience and the authorized source material. Strip secrets and unrelated data.\n  ```\n  Audience: SREs. Release cadence: weekly. Planned auth-library migration: Q2.\n  ```\n- **03 · Task: what action is required?** One direct verb. Split several deliverables into numbered items.\n  ```\n  Draft a rollout document with an overview, risks, and an on-call runbook.\n  ```\n- **04 · Constraints: what must the output satisfy?** State length, exclusions, and required facts as testable rules.\n  ```\n  At most 600 words. No marketing language. Include the kill-switch procedure.\n  ```\n- **05 · Examples: what does an accepted result look like?** A reviewed input-output pair fixes tone or structure. Check that it is representative and shareable.\n  ```\n  <example>\n  Input: …\n  Output: …\n  </example>\n  ```\n- **06 · Format: how will the result be consumed?** Ask for Markdown, JSON, a table, or a schema when downstream use depends on it. Validate machine-readable output.\n  ```\n  Output Markdown with H2 sections and bullet lists.\n  ```\n\nThis is one readable arrangement. Move documents or instructions when the guidance for your tested model and use case calls for it.",
    },
    {
      id: "xml-tags",
      title: "XML tags for clear boundaries",
      readTimeMinutes: 2,
      content:
        "Anthropic documents XML tags as one way to separate instructions, context, examples, and variable input. They help most when a prompt mixes several content types. They replace neither clear requirements nor evaluation.\n\nThe pattern:\n\n```\n<context>\nWe're migrating the auth service from cookies to OAuth 2.1 over Q2.\nAudience for this doc: SREs on the infra team.\n</context>\n\n<task>\nDraft a rollout doc with four sections: overview, risks, on-call runbook, rollback plan.\n</task>\n\n<constraints>\n- Under 600 words.\n- No marketing language.\n- Must mention the kill-switch procedure.\n</constraints>\n\n<example>\n[paste a prior rollout doc here that matches the voice you want]\n</example>\n\n<format>\nMarkdown. H2 for each section. Code blocks for shell commands.\n</format>\n```\n\nUse consistent, descriptive tag names. Nest them only where the content has a real hierarchy, then test the prompt on representative inputs.",
    },
    {
      id: "pro-moves",
      title: "Three current controls",
      readTimeMinutes: 2,
      content:
        "- **Use supported reasoning controls.** Where a model and API support extended thinking, configure it through the documented API. Ask for conclusions and evidence. Do not depend on exposing private chain-of-thought text.\n- **Use supported output controls.** Prefer structured outputs or an explicit schema where available. Claude 4.6 and later do not support assistant-response prefilling. Check the selected model's API documentation before reaching for that pattern.\n- **Define insufficient evidence.** State the exact response expected when required information is missing. That lowers the pressure to guess. It guarantees nothing about accuracy; evaluate and verify the result.",
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
        title: "Put them in order",
        prompt:
          "Arrange the sections into the example order used in this lesson.",
        hint: "Drag a card or use the up/down buttons. One readable order, not a universal rule.",
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
            hint: "bullets? sections? markdown? specific structure?",
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
          "presence of role, context, task, constraints, and format; specificity; use of XML tags; few-shot example; absence of filler",
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
