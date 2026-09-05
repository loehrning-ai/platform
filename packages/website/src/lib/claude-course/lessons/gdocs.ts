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
        "A reviewer opens the draft and hunts for the decision. Teams keep decisions, specifications, incident reviews, and launch plans in shared documents. A useful draft preserves the supplied facts, exposes what is missing, and follows a structure reviewers recognize.\n\nThree controls help: provide the section outline, supply an approved style example, and review claims before rewriting prose.",
    },
    {
      id: "move-1-skeleton",
      title: "Move 1: give it the skeleton",
      readTimeMinutes: 2,
      content:
        "Document types carry organization-specific conventions. Give the required sections instead of a generic default.\n\n```\nOutput structure:\n# Title\n## TL;DR (3 bullets, each <15 words)\n## Context\n## Proposal\n## Risks & mitigations\n## Success metrics\n## Open questions\n```\n\nName the evidence each section needs and mark missing material instead of guessing.",
    },
    {
      id: "move-2-voice",
      title: "Move 2: give it the voice",
      readTimeMinutes: 2,
      content:
        "When terminology and sentence style matter, supply a short approved passage and name the traits to match. Strip confidential details and tell the model not to reuse facts from the style sample.\n\n> A style example shows the target. An evaluation shows whether you hit it.",
    },
    {
      id: "move-3-critique",
      title: "Move 3: ask for the critique before the rewrite",
      readTimeMinutes: 2,
      content:
        "Judge the first draft against explicit criteria: unsupported claims, missing decisions, audience mismatch, structural defects. Ask for a short list of findings with quoted evidence, then request only the changes you approve.\n\nThat gives you an inspectable review step. It neither requires nor exposes private chain-of-thought.",
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
