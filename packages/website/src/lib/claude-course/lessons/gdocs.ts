// Ported from claude/lessons/06-gdocs.html.
// Widget manifest: PromptCompare x1 (cmp), FillBlank x1 (drill), Quiz x1
// (q1). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "gdocs",
  number: 6,
  title: "Drafting structured documents",
  subtitle:
    "Turn source notes into a reviewable document without losing evidence.",
  durationMinutes: 8,
  trackId: "workflows",
  hook: "The prompt sets the document's structure.",
  keyConcepts: ["Skeleton", "Voice transfer", "Critique before rewrite"],
  quiz: [],
  sections: [
    {
      id: "why-gdocs",
      title: "Shared documents",
      readTimeMinutes: 1,
      content:
        "Decisions, specs, incident reviews and launch plans live in shared documents. A useful draft keeps the supplied facts, marks gaps and follows a structure reviewers know.",
    },
    {
      id: "move-1-skeleton",
      title: "Give it the skeleton",
      readTimeMinutes: 2,
      content:
        "Document types carry conventions, such as the TL;DR in a design doc or the timeline in a post-mortem. Give the required sections:\n\n```\nOutput structure:\n# Title\n## TL;DR (3 bullets, each <15 words)\n## Context\n## Proposal\n## Risks & mitigations\n## Success metrics\n## Open questions\n```\n\nName the evidence each section needs and have gaps marked instead of guessed.",
    },
    {
      id: "move-2-voice",
      title: "Give it the voice",
      readTimeMinutes: 1,
      content:
        "When terminology and style matter, supply a short approved passage and name the traits to match. Strip confidential details, forbid reusing its facts and check whether the output hits the style.",
    },
    {
      id: "move-3-critique",
      title: "Critique before rewrite",
      readTimeMinutes: 1,
      content:
        "Review the draft against written criteria: unsupported claims, missing decisions, audience mismatch, structural defects. Ask for findings with quoted evidence, then request only the changes you approve.",
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
          "Paste 2-3 reference paragraphs and ask for a rewrite in that voice.",
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
