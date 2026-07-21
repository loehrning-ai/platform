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
  subtitle: "The Boris template: role, context, task, constraints, format.",
  durationMinutes: 12,
  trackId: "foundations",
  hook: "Great prompts are not clever. They are structured.",
  keyConcepts: [
    "Role, context, task, constraints, examples, format",
    "XML tags",
    "Extended thinking",
    "Prefilling",
    "Giving Claude an out",
  ],
  quiz: [],
  sections: [
    {
      id: "contracts-not-incantations",
      title: "Prompts are contracts, not incantations",
      readTimeMinutes: 2,
      content:
        "Here's the single highest-leverage idea in this course: the best prompters don't write cleverer English. They write more structured English. A good prompt is a contract, not an incantation, it specifies the job precisely enough that Claude has nothing left to guess about.\n\nAnthropic's own internal playbook (the one they publish in their docs and teach their customers) converges on a simple template. Role, context, task, constraints, examples, format, in that order. Miss a piece and you're asking Claude to improvise it. Include all of them and most \"prompt engineering\" disappears into just writing a clear brief.\n\n> Prompts are contracts, not incantations.",
    },
    {
      id: "six-parts",
      title: "The six parts",
      readTimeMinutes: 4,
      content:
        "- **01 · Role: who is Claude right now?** Sets tone, vocabulary, depth. \"Senior staff engineer\" and \"executive coach\" produce completely different outputs for the same task.\n  ```\n  You are a senior technical editor for internal docs.\n  ```\n- **02 · Context: what do they need to know?** Background, source docs, audience, constraints you live with. The onboarding you'd give a new hire. Paste generously, context is the product.\n  ```\n  Audience: SREs. We ship weekly. Migrating from v1 to v2 of the auth library in Q2.\n  ```\n- **03 · Task: what, exactly, do you want?** One verb. One clear ask. If you find yourself writing \"and also\", split into a second prompt or number the asks.\n  ```\n  Draft a rollout doc with sections: overview, risks, on-call runbook.\n  ```\n- **04 · Constraints: what must be true?** Length, tone, things to avoid, must-include facts. State them as rules, Claude respects rules better than vibes.\n  ```\n  <600 words. No marketing language. Must mention the kill-switch.\n  ```\n- **05 · Examples: show, don't just tell.** One or two concrete examples of what \"good\" looks like. Few-shot examples beat abstract instructions, this is the single biggest quality lever most people skip.\n  ```\n  <example>\n  Input: …\n  Output: …\n  </example>\n  ```\n- **06 · Format: how should the answer look?** Markdown? JSON? A table? Paste-ready Gdoc? Be explicit. The difference between \"I'll reformat this later\" and \"paste, done\" is one sentence.\n  ```\n  Output as markdown with H2 sections. Bullet lists, not prose paragraphs.\n  ```\n\n> **Why this order?** Claude reads top to bottom. Role first sets the voice before the task arrives. Context grounds it. Task states the ask. Constraints and examples shape the output. Format last so it's freshest in the model's working memory when generation starts. Anthropic's research on positional attention backs this up: what you put near the start and near the end gets weighted more than what's in the middle.",
    },
    {
      id: "xml-tags",
      title: "XML tags: the reliability multiplier",
      readTimeMinutes: 2,
      content:
        "Here's a detail Anthropic's docs emphasize and most people miss: Claude was trained with XML-style tags as structural markers. Wrapping your sections in tags like `<context>`, `<task>`, `<example>` isn't decorative, it measurably improves how reliably Claude respects your structure. Especially on long prompts.\n\nThe pattern:\n\n```\n<context>\nWe're migrating the auth service from cookies to OAuth 2.1 over Q2.\nAudience for this doc: SREs on the infra team.\n</context>\n\n<task>\nDraft a rollout doc with four sections: overview, risks, on-call runbook, rollback plan.\n</task>\n\n<constraints>\n- Under 600 words.\n- No marketing language.\n- Must mention the kill-switch procedure.\n</constraints>\n\n<example>\n[paste a prior rollout doc here that matches the voice you want]\n</example>\n\n<format>\nMarkdown. H2 for each section. Code blocks for shell commands.\n</format>\n```\n\nTag names aren't reserved, invent ones that match your job (`<persona>`, `<data>`, `<rubric>`). Just be consistent. This one move upgrades almost every long prompt you'll ever write.",
    },
    {
      id: "pro-moves",
      title: "Three pro moves the docs emphasize",
      readTimeMinutes: 2,
      content:
        "- **Tell it to think.** Adding \"think step by step in `<thinking>` tags before answering\" visibly improves output on anything requiring reasoning: planning, debugging, analysis. On newer Claudes, extended thinking is a first-class mode you can turn on.\n- **Prefill the response.** When using the API, starting the assistant turn with `{` or `<doc>` forces the shape you want without Claude narrating first (\"Sure, I'd be happy to…\"). In chat surfaces, use \"Start your response with…\" for the same effect.\n- **Give it an out.** Add \"If you don't have enough information, say so and ask for what you need.\" This single sentence drops hallucination rates dramatically. Claude wants to be honest, give it permission.",
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
          "You are a senior comms writer, writing for an engineering audience.\n\n<context>\nWe are rolling out OAuth 2.1 SSO to replace legacy cookie auth on internal tools.\nMigration window: 6 weeks, opt-in first, then forced cutover.\nThe on-call rotation is @auth-oncall.\nAudience: ~3000 engineers across the organization, mixed seniority.\n</context>\n\n<task>\nDraft a launch email announcing the rollout to engineering.\n</task>\n\n<constraints>\n- Under 250 words.\n- No marketing language. Crisp, factual.\n- Must include: the migration window, the opt-in date, the forced-cutover date, and how to get help.\n- Tone: internal voice, direct, respectful of readers' time.\n- Give readers a clear single next action.\n</constraints>\n\n<format>\nMarkdown. Subject line first, then body. Sign-off from \"The Identity Platform team.\"\n</format>",
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
        prompt: "Drag to put the six-part template in order.",
        hint: "Drag a card, or use the up/down buttons. A strong prompt reads top-to-bottom: role, context, task, constraints, examples, format.",
        blocks: [
          { id: "role", label: "Role", sample: '"You are a senior technical editor."' },
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
          { label: "Constraints", hint: "length, tone, must-includes, must-avoids" },
          { label: "Format", hint: "bullets? sections? markdown? specific structure?" },
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
        original: "write release notes for our new changes this week plz, make it good",
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
          "Must include all six parts (role, context, task, constraints, examples or rubric, format). Bonus for XML tags. Penalize vagueness, reward specificity.",
      },
    },
  ],
};

export default lesson;
