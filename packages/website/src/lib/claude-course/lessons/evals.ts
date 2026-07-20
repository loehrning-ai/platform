// Ported from claude/lessons/11-evals.html.
// Widget manifest: FailureTagger x1 (tagger), PromptGrader x1 (grader), Quiz
// x2 (q1, q2). Wired incrementally (plan 008 stages 3, 4).
import type { ClaudeLesson } from "../types";

const lesson: ClaudeLesson = {
  id: "evals",
  number: 11,
  title: "Prompt Debugging and Evals",
  subtitle: "How to know a prompt is actually better.",
  durationMinutes: 12,
  trackId: "team",
  hook: "Vibes are not a measurement.",
  keyConcepts: [
    "Minimum viable eval",
    "Binary search a prompt",
    "LLM as judge",
  ],
  quiz: [],
  sections: [
    {
      id: "why-evals",
      title: "Why evals",
      readTimeMinutes: 1,
      content:
        "You tweak a prompt. The next response \"feels better.\" Is it? You don't know. That's the problem.\n\nAnthropic's prompt engineers say it plainly: approach prompting like a scientist, test and iterate. Evals are the test suite. They don't need to be fancy; they need to exist. Five realistic examples beat a thousand gut checks.\n\n> No eval, no improvement, just drift.",
    },
    {
      id: "mvp-eval",
      title: "The minimum viable eval",
      readTimeMinutes: 2,
      content:
        "You don't need a platform. You need five examples.\n\n```\neval_v1:\n  - input:    <realistic example 1>\n    expects:  <what a good output looks like>\n  - input:    <realistic example 2, including a hard edge case>\n    expects:  <…>\n  - input:    <example 3, a known failure mode>\n    expects:  <…>\n  - input:    <example 4>\n    expects:  <…>\n  - input:    <example 5, adversarial — empty input, ambiguous input>\n    expects:  <…>\n```\n\nBefore you change the prompt, run all five. Save the outputs. After you change the prompt, run all five again. Diff.",
    },
    {
      id: "debugging",
      title: "Debugging a broken prompt",
      readTimeMinutes: 2,
      content:
        "When a prompt misbehaves, resist the urge to add instructions. First, remove. Prompts rot when people pile on. Start with the minimum that should work. If it works, reintroduce constraints one at a time until it breaks. That's your culprit.\n\n> **Binary search your prompt.** Delete half. Works? The problem was in the deleted half. Doesn't work? The problem's in the kept half. Repeat.",
    },
    {
      id: "llm-as-judge",
      title: "Judging quality with a second model",
      readTimeMinutes: 2,
      content:
        "For harder-to-grade outputs (\"is this a good review?\"), use Claude itself as a judge. Give it a clear rubric, the output to judge, and ask for a score plus justification. It's noisy but cheap, and it scales.",
    },
  ],
  widgets: [],
};

export default lesson;
