// Ported from claude/lessons/10-team.html.
// Widget manifest: PromptLibraryShaper x1 (shaper), SocraticTutor x1
// (tutor), Quiz x1 (q1). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "team",
  number: 10,
  title: "Team Workflows",
  subtitle: "Shared prompts, shared CLAUDE.md, shared gains.",
  durationMinutes: 10,
  trackId: "team",
  hook: "One person's breakthrough is everybody's baseline.",
  keyConcepts: [
    "Prompt library",
    "Shared CLAUDE.md",
    "Eval set",
    "Shareability checklist",
  ],
  quiz: [],
  sections: [
    {
      id: "why-share",
      title: "Why share",
      readTimeMinutes: 1,
      content:
        "The biggest team-wide Claude wins don't come from finding a better model. They come from circulating prompts that work. If one person figured out the perfect PR-review prompt, the other 40 on the team shouldn't have to rediscover it.\n\nAt Anthropic itself, where much of the codebase is now written with Claude Code, the pattern is the same: engineers focus on architecture, product thinking, and orchestrating multiple agents. The compounding advantage isn't the model, it's the shared scaffolding around it.",
    },
    {
      id: "three-artifacts",
      title: "Three team artifacts worth maintaining",
      readTimeMinutes: 2,
      content:
        "- **01 · Prompt library.** A repo or Gdoc with named, tested prompts for recurring tasks: PR review, standup summary, post-mortem draft, release notes.\n- **02 · CLAUDE.md.** Checked into the repo. Reviewed like code. Updated when conventions drift.\n- **03 · Eval set.** A handful of realistic examples, input plus expected flavor of output. Use it to check a prompt change didn't regress.",
    },
    {
      id: "sharing-well",
      title: "How to share a prompt well",
      readTimeMinutes: 2,
      content:
        "A prompt that works on your laptop is not the same as a prompt your team can use. Before you send it:\n\n- **Strip your specifics.** Replace hardcoded project names with placeholders like `<PROJECT>`.\n- **Add a one-line \"when to use.\"** Future-you will forget.\n- **Show a sample output.** Sets expectations in a way words can't.\n- **Note failure modes.** \"Tends to over-explain; add 'no preamble'.\"",
    },
    {
      id: "rituals",
      title: "Rituals that compound",
      readTimeMinutes: 1,
      content:
        "> **15 minutes on Fridays.** One teammate demos a prompt they found useful this week. Over a quarter, that's 12 new team-level capabilities.",
    },
  ],
  widgets: [
    {
      kind: "prompt-library-shaper",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "team",
        cpId: "shaper",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "team",
        cpId: "q1",
        question:
          "Your team-shared prompt works for you but falls flat for others. The most common cause?",
        options: [
          "Different Claude models.",
          'Hardcoded specifics (project names, paths) and missing "when to use" notes.',
          "Time of day.",
          "Not enough adjectives.",
        ],
        correct: 1,
        explanation:
          'Shareable prompts are parameterized and documented. Strip specifics, state when to use, and show a sample output.',
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "socratic-tutor",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "team",
        cpId: "tutor",
        topic: "building a team-wide Claude practice",
        persona: "Push on ownership, staleness, and how to avoid \"one person owns all the prompts.\"",
      },
    },
  ],
};

export default lesson;
