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
  title: "Prompt debugging and evals",
  subtitle: "How to know a prompt is actually better.",
  durationMinutes: 12,
  trackId: "team",
  hook: "Compare prompt versions on fixed cases.",
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
        "A prompt change can fix one example and break another. An evaluation fixes inputs, success criteria and grading logic so versions compare under the same conditions.\n\nStart small with common cases, edge cases and known failures, and add cases from production. Output varies, so use repeated trials when a decision rests on pass rates. Record model, settings, prompt version, inputs, outputs and grades.",
    },
    {
      id: "mvp-eval",
      title: "A small evaluation set",
      readTimeMinutes: 2,
      content:
        "A spreadsheet, JSON file or test module is enough; each case needs a realistic input and explicit acceptance criteria.\n\n```\neval_v1:\n  - input:    <common case>\n    expects:  <checkable requirements>\n  - input:    <hard edge case>\n    expects:  <…>\n  - input:    <known failure mode>\n    expects:  <…>\n  - input:    <missing or ambiguous data>\n    expects:  <abstention or clarification behavior>\n```\n\nRun the same cases before and after a change, and save raw outputs and grades for review.",
    },
    {
      id: "debugging",
      title: "Debugging a broken prompt",
      readTimeMinutes: 1,
      content:
        "Reproduce the failure with fixed input, model, settings and tool state. Disable or simplify prompt sections until the conflict shows, then reintroduce them one at a time on the same cases.\n\nThis is delta debugging, but model variance means one pass proves no cause. Repeat trials and read the transcripts first.",
    },
    {
      id: "llm-as-judge",
      title: "Judging quality with a second model",
      readTimeMinutes: 1,
      content:
        "A model grader applies a rubric to open-ended output and brings its own errors and preferences. Calibrate it on human-reviewed examples, randomize pairwise order, keep its justification and track disagreement.\n\nDeterministic graders check schema, required fields, citations and executable tests. Combine graders only when each measures a defined requirement.",
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
          "Tag the failure mode in each of five simulated outputs. The examples are fixed course data.",
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
            why: "Synthetic sample data is a benign request, so refusing it is over-cautious.",
          },
          {
            id: "c3",
            prompt:
              'Return a JSON array of 3 objects, each with keys "term" and "definition". No prose.',
            output:
              "Sure! Here are three important terms:\n\n1. Context window: the range of text the model can consider at once.\n2. Token: a unit of text the model processes.\n3. Temperature: sampling randomness parameter.",
            correct: "formatdrift",
            why: "It asked for a JSON array without prose and got prose with numbered bullets.",
          },
          {
            id: "c4",
            prompt: "Summarize the attached incident report in one sentence.",
            output:
              "Incidents are common in fast-moving teams. Here are seven best practices for post-mortems, starting with a blameless culture, a clear timeline and root cause analysis...",
            correct: "themaverfehlung",
            why: "It never summarized the report and pivoted to generic post-mortem advice.",
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
          "You change a prompt and the new output \"feels better.\" What next?",
        options: [
          "Ship it.",
          "Compare both versions on the same evaluation cases.",
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
          "Add more instructions to fix the odd behavior.",
          "Disable sections, rerun the same trials, reintroduce them one at a time.",
          "Switch to a different model.",
          "Ask Claude to rewrite the prompt from scratch.",
        ],
        correct: 1,
        explanation:
          "Disabling sections isolates the conflict. Repeated trials on the same cases keep model variance from posing as the cause.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
