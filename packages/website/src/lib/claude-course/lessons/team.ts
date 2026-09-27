// Ported from claude/lessons/10-team.html.
// Widget manifest: PromptLibraryShaper x1 (shaper), SocraticTutor x1
// (tutor), Quiz x1 (q1). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "team",
  number: 10,
  title: "Team workflows",
  subtitle:
    "Prompts, CLAUDE.md and evals as shared, maintained tools.",
  durationMinutes: 10,
  trackId: "team",
  hook: "A team prompt needs an owner, a use case and tests.",
  keyConcepts: [
    "Prompt library",
    "Shared CLAUDE.md",
    "Eval set",
  ],
  quiz: [],
  sections: [
    {
      id: "why-share",
      title: "Why share",
      readTimeMinutes: 1,
      content:
        "A one-person prompt carries hidden context: local paths, team names, unstated source access, an output format only its author reads. Treat recurring prompts as maintained artifacts with task, inputs, model and tool assumptions, expected output, owner and eval cases.",
    },
    {
      id: "three-artifacts",
      title: "Shared team artifacts",
      readTimeMinutes: 1,
      content:
        "- **01 · Prompt library.** A repo or Gdoc of named, tested prompts for recurring tasks such as PR review, standup summary or release notes.\n- **02 · CLAUDE.md.** Lives in the repo, is reviewed like code and changes with the conventions.\n- **03 · Eval set.** A few realistic inputs with the expected kind of output, rerun after each prompt change.",
    },
    {
      id: "sharing-well",
      title: "Sharing a prompt",
      readTimeMinutes: 1,
      content:
        "Before you publish:\n\n- **Replace local details** such as project names and paths with placeholders like `<PROJECT>`.\n- **State scope and prerequisites:** when to use it, which sources it needs, which actions it may take.\n- **Add a reviewed example,** marked illustrative and stripped of sensitive data.\n- **Document known failures** and tie each material one to an eval case or control.",
    },
    {
      id: "rituals",
      title: "Short recurring reviews",
      readTimeMinutes: 1,
      content:
        "In a short recurring slot, review one workflow, its evidence and one failure case. A prompt joins the shared library only after a teammate reproduces its result from the documentation alone.",
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
          "Shareable prompts are parameterized and documented. Replace fixed names with placeholders, say when to use it and include a sample output.",
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
        persona:
          'Push on ownership, staleness, and how to avoid "one person owns all the prompts."',
      },
    },
  ],
};

export default lesson;
