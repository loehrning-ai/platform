// Ported from claude/lessons/05-iteration.html.
// Widget manifest: PromptSandbox x1 (sb), PromptDiff x1 (diff), mounted here,
// must not be dropped, Quiz x1 (q1), RewriteArena x1 (arena). Wired
// incrementally (plan 008 stages 4, 5).
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "iteration",
  number: 5,
  title: "Iterative Prompting",
  subtitle:
    "Why the second prompt is always better, and how to get there in fewer tries.",
  durationMinutes: 10,
  trackId: "workflows",
  hook: "First drafts are for calibration, not delivery.",
  keyConcepts: [
    "Calibrate, correct, lock",
    "Show, don't tell",
    "Turn-2 vocabulary",
  ],
  quiz: [],
  sections: [
    {
      id: "the-loop",
      title: "The loop",
      readTimeMinutes: 1,
      content:
        "Beginners write one prompt and judge Claude on the output. Experienced users write a prompt, read the output, and use what they learned to refine the prompt. The model doesn't change. Your prompt does.\n\nAnthropic's own engineers say it flatly: prompt engineering is a science, approach it like a scientist. Test, iterate, compare. The best first prompt you'll ever write is the one you wrote yesterday and are improving today.\n\n> Prompting is a loop, not a shot.",
    },
    {
      id: "three-turn-loop",
      title: "The three-turn loop",
      readTimeMinutes: 2,
      content:
        "- **Turn 1 · calibrate.** Write a reasonable prompt. Read the output. Don't judge, diagnose. What did it misunderstand? What did it over-explain? What tone did it default to?\n- **Turn 2 · correct.** Name the specific thing to fix. \"Shorter.\" \"Drop the intro paragraph.\" \"Use the voice from the attached doc.\" Keep the rest of the prompt stable, change one variable at a time.\n- **Turn 3 · lock.** When it's good: capture the full, working prompt somewhere (CLAUDE.md, a snippet file, Notion). That's now a template. Next time, start from there.\n\n> **Pro move Anthropic uses.** After an output you liked, ask Claude: \"Write the prompt you would have given yourself to produce this output.\" You now have a distilled, reusable prompt, often better than the one you started with.",
    },
    {
      id: "show-dont-tell",
      title: "Show, don't tell",
      readTimeMinutes: 2,
      content:
        "The single highest-leverage iteration move: replace descriptions with examples. Saying \"use a professional tone\" gives Claude a fuzzy target. Pasting three sentences in the exact tone you want gives it coordinates.\n\nAnthropic's prompt-improver workflow does this automatically, it takes your prompt and looks for places to inject 2-5 input/output examples. In their experience, examples are the single most reliable way to drive accuracy and consistency, especially for structured outputs. When your turn-2 correction is \"make it feel more like X,\" paste X.",
    },
    {
      id: "turn-2-vocabulary",
      title: "What to say in turn 2",
      readTimeMinutes: 2,
      content:
        "Most failed iterations come from vague corrections. Here's the vocabulary that actually works:\n\n**Do:** \"Cut the first paragraph.\" · \"Use the voice from this example: …\" · \"Make the bullets parallel, each should start with a verb.\" · \"Assume the reader already knows X; skip the intro.\"\n\n**Don't:** \"Make it better.\" · \"Less AI-sounding.\" · \"Sharper.\" · \"You know what I mean.\"",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "iteration",
        cpId: "q1",
        question:
          "Which turn-2 correction is most likely to actually change the output?",
        options: [
          '"Make it better."',
          '"Less AI sounding."',
          '"Cut the opening paragraph and start with the status in one sentence."',
          '"Try again."',
        ],
        correct: 2,
        explanation:
          "Specific, actionable, testable. The others are vibes, Claude can't act on them.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
