// Ported from claude/lessons/11-evals.html.
// Widget manifest: FailureTagger x1 (tagger), PromptGrader x1 (grader), Quiz
// x2 (q1, q2). Wired incrementally (plan 008 stages 3, 4).
import type { ClaudeLesson } from "../types";
import { CLAUDE_FAILURE_TAGGER_COPY, CLAUDE_QUIZ_COPY } from "../widget-copy";

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
        "You don't need a platform. You need five examples.\n\n```\neval_v1:\n  - input:    <realistic example 1>\n    expects:  <what a good output looks like>\n  - input:    <realistic example 2, including a hard edge case>\n    expects:  <…>\n  - input:    <example 3, a known failure mode>\n    expects:  <…>\n  - input:    <example 4>\n    expects:  <…>\n  - input:    <example 5, adversarial: empty input, ambiguous input>\n    expects:  <…>\n```\n\nBefore you change the prompt, run all five. Save the outputs. After you change the prompt, run all five again. Diff.",
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
  widgets: [
    {
      kind: "failure-tagger",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "evals",
        cpId: "tagger",
        title: "Name the failure mode",
        scenario:
          "Five real-looking Claude outputs. Each is broken differently. Tag each with how it went wrong. This is the core move of eval work, you can't fix a class of failure until you can name it.",
        modes: [
          { id: "halluzination", label: "Hallucination", desc: "Confidently invented a fact." },
          { id: "verweigerung", label: "Over-refusal", desc: "Refused something it should have done." },
          { id: "formatdrift", label: "Format drift", desc: "Ignored the requested shape." },
          { id: "themaverfehlung", label: "Off-topic", desc: "Wandered away from the ask." },
        ],
        cases: [
          {
            id: "c1",
            prompt: "List the three files in our repo largest-by-bytes.",
            output:
              "The three largest files in your repo are src/bundle.js (4.2MB), dist/vendor.js (3.8MB), and assets/hero-video.mp4 (2.1MB).",
            correct: "halluzination",
            why: "Claude had no repo access. It fabricated plausible-sounding file names and exact byte counts.",
          },
          {
            id: "c2",
            prompt:
              "Write a short JSON object describing a generic user: {name, role, email}.",
            output:
              "I can't generate sample data with emails as that could be confused with a real person. Could you clarify your use case?",
            correct: "verweigerung",
            why: "The request is entirely benign, sample and synthetic data. This is a classic over-cautious refusal.",
          },
          {
            id: "c3",
            prompt:
              'Return a JSON array of 3 objects, each with keys "term" and "definition". No prose.',
            output:
              'Sure! Here are three important terms:\n\n1. Context window: the range of text the model can consider at once.\n2. Token: a unit of text the model processes.\n3. Temperature: sampling randomness parameter.',
            correct: "formatdrift",
            why: "Explicitly asked for a JSON array, no prose. Got prose with numbered bullets.",
          },
          {
            id: "c4",
            prompt: "Summarize the attached incident report in one sentence.",
            output:
              "Incidents are common in fast-moving teams. Here are seven best practices for post-mortems: 1. Blameless culture 2. Clear timeline 3. Root cause analysis...",
            correct: "themaverfehlung",
            why: "Didn't summarize the specific report, pivoted to generic advice about post-mortems.",
          },
          {
            id: "c5",
            prompt: "What's the current version of our internal AuthKit library?",
            output:
              "AuthKit is currently at version 3.7.2, released on October 14, 2024, with bug fixes for the OAuth flow and a new MFA module.",
            correct: "halluzination",
            why: "There is no way the model knows your internal library version. Fabricated version, date, and release notes.",
          },
        ],
        passThreshold: 4,
        copy: CLAUDE_FAILURE_TAGGER_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "evals",
        cpId: "q1",
        question:
          'You change a prompt. The new output "feels better." The right next step?',
        options: [
          "Ship it.",
          "Run both prompts against 5 realistic examples and compare.",
          "Ask a colleague if they like it.",
          "Ask Claude to grade itself.",
        ],
        correct: 1,
        explanation: "Vibes lie. Even 5 examples beat gut feel.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "evals",
        cpId: "q2",
        question:
          "A working prompt starts producing weird output after weeks of edits. The best debugging move?",
        options: [
          "Add more instructions to counteract the weirdness.",
          "Delete half the prompt and see if the problem goes with it.",
          "Switch to a different model.",
          "Ask Claude to rewrite the prompt from scratch.",
        ],
        correct: 1,
        explanation:
          "Binary search. Prompts rot when people only add. Subtract to isolate.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
