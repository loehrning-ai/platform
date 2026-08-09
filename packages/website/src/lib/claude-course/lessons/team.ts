// Ported from claude/lessons/10-team.html.
// Widget manifest: PromptLibraryShaper x1 (shaper), SocraticTutor x1
// (tutor), Quiz x1 (q1). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "team",
  number: 10,
  title: "Team Workflows",
  subtitle:
    "Version prompts, document their scope, and test changes as a team.",
  durationMinutes: 10,
  trackId: "team",
  hook: "A reusable prompt needs an owner, a use case, and regression tests.",
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
        "A prompt used by one person often contains hidden context: local paths, team names, unstated source access, or an output format understood only by its author. Sharing the text alone does not make the workflow reusable.\n\nTreat recurring prompts as maintained artifacts. Record the task, required inputs, supported model or tool assumptions, expected output, owner, and evaluation cases.",
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
        "Before publishing a prompt:\n\n- **Parameterize local details.** Replace hardcoded project names and paths with named inputs such as `<PROJECT>`.\n- **State scope and prerequisites.** Explain when to use it, which sources it needs, and which actions it may take.\n- **Provide a reviewed example.** Mark it as illustrative and remove sensitive data.\n- **Document known failures.** Link each material failure to an evaluation case or operational control.",
    },
    {
      id: "rituals",
      title: "Rituals that compound",
      readTimeMinutes: 1,
      content:
        "Use a short, recurring review to examine one workflow, its evidence, and one failure case. Promote it to the shared library only after another teammate can run it from the documentation and reproduce the intended result.",
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
          "Shareable prompts are parameterized and documented. Strip specifics, state when to use, and show a sample output.",
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
