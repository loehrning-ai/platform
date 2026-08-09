// Ported from claude/lessons/06-gdocs.html.
// Widget manifest: PromptCompare x1 (cmp), FillBlank x1 (drill), Quiz x1
// (q1). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "gdocs",
  number: 6,
  title: "Drafting Structured Documents",
  subtitle:
    "Turn source notes into a reviewable document without losing evidence.",
  durationMinutes: 8,
  trackId: "workflows",
  hook: "Define the document structure, source boundary, and review standard.",
  keyConcepts: ["Skeleton", "Voice transfer", "Critique before rewrite"],
  quiz: [],
  sections: [
    {
      id: "why-gdocs",
      title: "Why shared documents matter",
      readTimeMinutes: 1,
      content:
        "Teams use shared documents for decisions, specifications, incident reviews, and launch plans. A useful generated draft preserves the supplied facts, exposes missing information, and follows a structure reviewers recognize.\n\nThree controls help: provide the section outline, supply an approved style example, and review claims before rewriting prose.",
    },
    {
      id: "move-1-skeleton",
      title: "Move 1: give it the skeleton",
      readTimeMinutes: 2,
      content:
        "Document types have organization-specific conventions. Provide the required sections instead of relying on a generic default. For example:\n\n```\nOutput structure:\n# Title\n## TL;DR (3 bullets, each <15 words)\n## Context\n## Proposal\n## Risks & mitigations\n## Success metrics\n## Open questions\n```\n\nName required evidence for each section and mark missing source material rather than filling gaps with assumptions.",
    },
    {
      id: "move-2-voice",
      title: "Move 2: give it the voice",
      readTimeMinutes: 2,
      content:
        "If terminology and sentence style matter, provide a short, approved reference passage and state which traits to match. Remove confidential details and tell the model not to reuse facts from the style sample.\n\n> A style example demonstrates the target; an evaluation shows whether the result matches it.",
    },
    {
      id: "move-3-critique",
      title: "Move 3: ask for the critique before the rewrite",
      readTimeMinutes: 2,
      content:
        "After the first draft, evaluate it against explicit criteria: unsupported claims, missing decisions, audience mismatch, and structural defects. Ask for a concise list of findings with quoted evidence, then request only the approved changes.\n\nThis produces an inspectable review step. It does not require or expose private chain-of-thought.",
    },
  ],
  widgets: [
    {
      kind: "prompt-compare",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "gdocs",
        cpId: "cmp",
        weak: "turn these bullets into a design doc: auth migration, 4 weeks, oauth 2.1, replace legacy cookie, sre audience, kill switch exists, on-call rotation exists",
        strong:
          "You are a senior engineer drafting a design doc for an SRE audience.\n\nSource material (bullet dump):\n- auth migration project, 4-week window\n- moving to OAuth 2.1, replacing legacy cookie auth\n- on-call: @auth-oncall\n- kill switch exists and tested\n\nProduce a design doc with this exact structure:\n# Title\n## TL;DR (3 bullets, <15 words each)\n## Context\n## Proposal\n## Rollout plan\n## Risks & mitigations\n## Success metrics\n## Open questions\n\nVoice rules:\n- Short sentences. Active verbs.\n- No marketing language.\n- Numbers before adjectives.\n- SRE-native vocabulary is fine; don't define p99 etc.\n\nOutput as clean markdown.",
      },
    },
    {
      kind: "fill-blank",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "gdocs",
        cpId: "drill",
        goal: "Turn a bullet dump into a crisp 3-bullet TL;DR.",
        template:
          "Turn these bullets into a TL;DR for a {{0}} audience.\n\nBULLETS\n{{1}}\n\nSTYLE\n- Exactly 3 bullets\n- {{2}}\n\nFORMAT\nMarkdown, no preamble.",
        blanks: [
          { label: "Audience", hint: "e.g. SRE, exec, design-review" },
          { label: "Bullets", hint: "paste your raw notes" },
          {
            label: "Style rules",
            hint: "e.g. <15 words each, numbers before adjectives",
          },
        ],
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "gdocs",
        cpId: "q1",
        question:
          "Your first-draft Gdoc is close, but the voice is off. What's the strongest next move?",
        options: [
          'Ask for "a more professional tone."',
          "Start over with a new prompt.",
          'Paste 2-3 paragraphs of a reference doc with the voice you want and say "rewrite matching this voice."',
          'Ask Claude to "be less AI."',
        ],
        correct: 2,
        explanation:
          "An approved example makes style requirements observable. Check that the rewrite preserves source facts and does not copy facts from the style sample.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
