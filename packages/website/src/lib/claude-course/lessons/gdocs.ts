// Ported from claude/lessons/06-gdocs.html.
// Widget manifest: PromptCompare x1 (cmp), FillBlank x1 (drill), Quiz x1
// (q1). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "gdocs",
  number: 6,
  title: "Claude for Perfect Google Docs",
  subtitle: "From bullet dump to crisp doc in under five minutes.",
  durationMinutes: 8,
  trackId: "workflows",
  hook: "The doc is the artifact. The prompt is the mold.",
  keyConcepts: ["Skeleton", "Voice transfer", "Critique before rewrite"],
  quiz: [],
  sections: [
    {
      id: "why-gdocs",
      title: "Why Gdocs matter",
      readTimeMinutes: 1,
      content:
        "The shared doc is a team's native thinking surface. Design reviews, PRDs, post-mortems, launch briefs, they all live there. A doc Claude writes well is one you can paste and polish, not one you have to rewrite.\n\nThree moves do most of the work: give it the skeleton, show it the voice, ask for a critique before a rewrite.",
    },
    {
      id: "move-1-skeleton",
      title: "Move 1: give it the skeleton",
      readTimeMinutes: 2,
      content:
        "Gdocs have conventions. Design docs have TL;DRs. PRDs have success metrics. Post-mortems have timelines. If you don't hand Claude the skeleton, you'll get a generic \"article.\"\n\n```\nOutput structure:\n# Title\n## TL;DR (3 bullets, each <15 words)\n## Context\n## Proposal\n## Risks & mitigations\n## Success metrics\n## Open questions\n```",
    },
    {
      id: "move-2-voice",
      title: "Move 2: give it the voice",
      readTimeMinutes: 2,
      content:
        "Good internal docs have a voice: short sentences, active verbs, no marketing language, numbers before adjectives. If you want that voice, paste two paragraphs of an existing doc that has it, and say \"match this voice.\"\n\n> **Voice transfer works.** Pasting 100-300 words of well-written reference text is worth more than 10 adjectives describing the voice you want.",
    },
    {
      id: "move-3-critique",
      title: "Move 3: ask for the critique before the rewrite",
      readTimeMinutes: 2,
      content:
        "After the first draft, resist the urge to immediately ask for a better version. Instead ask: \"What are the three weakest parts of this doc, and why?\" You'll get a better doc by fixing specific weaknesses than by asking for a \"better version\", vague corrections produce vague outputs.\n\nThis is chain-of-thought applied to your own writing. You're forcing Claude to diagnose before it prescribes.",
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
          { label: "Style rules", hint: "e.g. <15 words each, numbers before adjectives" },
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
          "Voice transfer via example is far more effective than describing the voice. Show, don't tell.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
