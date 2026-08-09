// Ported from claude/lessons/05-iteration.html.
// Widget manifest: PromptSandbox x1 (sb), PromptDiff x1 (diff), mounted here,
// must not be dropped, Quiz x1 (q1), RewriteArena x1 (arena). Wired
// incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "iteration",
  number: 5,
  title: "Iterative Prompting",
  subtitle: "Change one variable, compare results, and keep the evidence.",
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
        "A single output cannot show whether a prompt is reliable. Run the prompt on representative inputs, label the failures, change one relevant variable, and compare the results against the same criteria.\n\nModel updates and sampling can also change outputs. Record the model, settings, prompt version, and test inputs when reproducibility matters.\n\n> Iterate against evidence, not one preferred response.",
    },
    {
      id: "three-turn-loop",
      title: "The three-turn loop",
      readTimeMinutes: 2,
      content:
        '- **Turn 1 · establish a baseline.** Run a reasonable prompt on a small test set. Record which requirements pass or fail.\n- **Turn 2 · correct one failure.** Name a testable change: "Remove the first paragraph" or "Start with one status sentence." Keep unrelated variables stable.\n- **Turn 3 · retain the tested version.** Store the complete prompt with its use case, model assumptions, and evaluation cases. Re-run the set after later edits or model changes.\n\nA model can draft a reusable prompt from an accepted output, but that reverse-engineered prompt is only a candidate. Review it and test it on inputs other than the example it came from.',
    },
    {
      id: "show-dont-tell",
      title: "Show, don't tell",
      readTimeMinutes: 2,
      content:
        'Examples can make an ambiguous requirement observable. Instead of "use a professional tone," provide a short, approved reference and identify the properties to preserve. For structured work, include representative input-output pairs and edge cases.\n\nExamples can also cause overfitting or copy unwanted details. Remove confidential information, vary the examples, and evaluate on held-out cases.',
    },
    {
      id: "turn-2-vocabulary",
      title: "What to say in turn 2",
      readTimeMinutes: 2,
      content:
        'Corrections work best when a reviewer can determine whether the output followed them.\n\n**Testable:** "Remove the first paragraph." · "Use the sentence length and terminology from this approved example." · "Start each bullet with a verb." · "Assume the reader knows X; omit its definition."\n\n**Not testable:** "Make it better." · "Less AI-sounding." · "Sharper." · "You know what I mean."',
    },
  ],
  widgets: [
    {
      kind: "prompt-diff",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        weak: "make it better and shorter please",
        strong:
          "Cut the opening paragraph. Start with the status in one sentence, then three bullets in the voice of the attached example. No closing pleasantries.",
        takeaway:
          "The stronger correction names an actionable, testable change and cites a concrete reference. Its result can be checked against the source facts and attached example.",
      },
    },
    {
      kind: "prompt-sandbox",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "iteration",
        cpId: "loop",
        title: "Run a turn-1, then iterate",
        hint: "Ask for a quick draft. Then paste the output back with a specific correction and ask again.",
        placeholder:
          "Turn 1 prompt goes here. Then update this box and re-run for turn 2.",
      },
    },
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
          "The instruction identifies an exact edit that can be checked. The other options do not define acceptance criteria.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "rewrite-arena",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "iteration",
        cpId: "arena",
        task: "Correct a first-draft status update that opened with too much throat-clearing.",
        original: "make it sound better and shorter",
        criteria:
          "specificity, testability, actionable instruction, avoids vibes",
      },
    },
  ],
};

export default lesson;
