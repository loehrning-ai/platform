// Ported from claude/lessons/11-evals.html.
// Widget manifest: FailureTagger x1 (tagger), PromptGrader x1 (grader), Quiz
// x2 (q1, q2). Wired incrementally.
import type { ClaudeLesson } from "../types";
import {
  CLAUDE_FAILURE_TAGGER_COPY,
  CLAUDE_QUIZ_COPY,
  CLAUDE_QUIZ_TITLE,
} from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "evals",
  number: 11,
  title: "Prompt Debugging and Evals",
  subtitle: "How to know a prompt is actually better.",
  durationMinutes: 12,
  trackId: "team",
  hook: "A preferred sample is not evidence of a reliable prompt.",
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
        "Two prompts, same task. Which one ships? A prompt change can improve one example and regress another. An evaluation defines inputs, success criteria, and grading logic so versions compare under the same conditions.\n\nStart with a small representative set: common cases, edge cases, known failures. Grow it from production evidence. Model output varies, so use repeated trials when the decision rests on pass rates rather than deterministic checks.\n\n> Record the model, settings, prompt version, inputs, outputs, and grades.",
    },
    {
      id: "mvp-eval",
      title: "A small evaluation set",
      readTimeMinutes: 2,
      content:
        "A spreadsheet, JSON file, or test module is enough to start. Each case needs a realistic input and explicit acceptance criteria.\n\n```\neval_v1:\n  - input:    <common case>\n    expects:  <checkable requirements>\n  - input:    <hard edge case>\n    expects:  <…>\n  - input:    <known failure mode>\n    expects:  <…>\n  - input:    <missing or ambiguous data>\n    expects:  <abstention or clarification behavior>\n```\n\nRun the same cases before and after a change. Save raw outputs and grader results so a reviewer can inspect disagreements.",
    },
    {
      id: "debugging",
      title: "Debugging a broken prompt",
      readTimeMinutes: 2,
      content:
        "When a prompt regresses, reproduce the failure first with a fixed input, model, settings, and tool state. Then simplify or disable prompt sections until the conflict shows. Reintroduce one section at a time and rerun the same cases.\n\nThis is delta debugging with a caveat. Model variance means one pass proves nothing about cause. Repeat trials and read the transcripts before naming a cause.",
    },
    {
      id: "llm-as-judge",
      title: "Judging quality with a second model",
      readTimeMinutes: 2,
      content:
        "A model-based grader applies a rubric to open-ended output and brings its own errors and preferences. Calibrate it against human-reviewed examples, randomize presentation order for pairwise comparisons, keep the grader justification, and track disagreement.\n\nUse deterministic graders for properties such as schema, required fields, citations, and executable tests. Combine graders only when each measures a defined requirement.",
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
          "Five simulated outputs contain different failure modes. Tag each one. The examples are fixed course data, not live Claude responses.",
        modes: [
          {
            id: "halluzination",
            label: "Hallucination",
            desc: "Confidently invented a fact.",
          },
          {
            id: "verweigerung",
            label: "Over-refusal",
            desc: "Refused something it should have done.",
          },
          {
            id: "formatdrift",
            label: "Format drift",
            desc: "Ignored the requested shape.",
          },
          {
            id: "themaverfehlung",
            label: "Off-topic",
            desc: "Wandered away from the ask.",
          },
        ],
        cases: [
          {
            id: "c1",
            prompt: "List the three files in our repo largest-by-bytes.",
            output:
              "The three largest files in your repo are src/bundle.js (4.2MB), dist/vendor.js (3.8MB), and assets/hero-video.mp4 (2.1MB).",
            correct: "halluzination",
            why: "The simulated answer has no repository evidence and invents file names and byte counts.",
          },
          {
            id: "c2",
            prompt:
              "Write a short JSON object describing a generic user: {name, role, email}.",
            output:
              "I can't generate sample data with emails as that could be confused with a real person. Could you clarify your use case?",
            correct: "verweigerung",
            why: "The request is benign, sample and synthetic data. A classic over-cautious refusal.",
          },
          {
            id: "c3",
            prompt:
              'Return a JSON array of 3 objects, each with keys "term" and "definition". No prose.',
            output:
              "Sure! Here are three important terms:\n\n1. Context window: the range of text the model can consider at once.\n2. Token: a unit of text the model processes.\n3. Temperature: sampling randomness parameter.",
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
            prompt:
              "What's the current version of our internal AuthKit library?",
            output:
              "AuthKit is currently at version 3.7.2, released on October 14, 2024, with bug fixes for the OAuth flow and a new MFA module.",
            correct: "halluzination",
            why: "The simulated answer has no internal source for the version, date, or release notes.",
          },
        ],
        passThreshold: 4,
        copy: CLAUDE_FAILURE_TAGGER_COPY,
      },
    },
    {
      kind: "prompt-grader",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "evals",
        cpId: "grader",
        task: "Write a prompt for generating weekly status updates that a judge model can score.",
        rubric:
          "Task and required context are explicit, constraints are testable, output format is defined, and missing data has a specified result.",
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
          "Run both prompt versions against the same representative evaluation cases and compare.",
          "Ask a colleague if they like it.",
          "Ask Claude to grade itself.",
        ],
        correct: 1,
        explanation:
          "A controlled comparison shows which requirements improved or regressed. One preferred output does not.",
        title: CLAUDE_QUIZ_TITLE,
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
          "A prompt regresses after several edits. Which step best isolates conflicting instructions?",
        options: [
          "Add more instructions to counteract the weirdness.",
          "Disable prompt sections, rerun the same evaluation trials, and reintroduce sections one at a time.",
          "Switch to a different model.",
          "Ask Claude to rewrite the prompt from scratch.",
        ],
        correct: 1,
        explanation:
          "Remove or disable sections to isolate conflicts, then repeat the same evaluation trials before assigning a cause.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
