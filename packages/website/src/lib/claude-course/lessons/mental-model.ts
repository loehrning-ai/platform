// Ported from claude/lessons/01-mental-model.html.
// Widget manifest (verified via grep of mountWidget calls): Quiz x3 (q1, q2,
// q3), PromptSandbox x1 (sb1), SocraticTutor x1 (tutor). Wired incrementally
// as each widget kind lands; see the code comment on
// `widgets` below for current status.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "mental-model",
  number: 1,
  title: "What Claude is",
  subtitle: "A mental model for answers that sound confident.",
  durationMinutes: 8,
  trackId: "foundations",
  hook: "Claude generates from the context it receives. Retrieval and memory are product features.",
  keyConcepts: [
    "Grounding",
    "Hallucination",
    "Constitutional AI",
  ],
  quiz: [],
  sections: [
    {
      id: "what-it-is",
      title: "What it is (and isn't)",
      readTimeMinutes: 1,
      content:
        "Claude generates text from what sits in the window: request, conversation, system instructions and any documents or tool results the product added. Output is probabilistic; the same request can differ tomorrow.\n\n**Generation is not retrieval.** A lookup needs an enabled tool that actually ran, such as web search or a database query.\n\n**The model is not storage.** History and memory come from the product, if at all.\n\n**Fluent output is not review.** The model can follow a false premise and invent details. Important output stays a draft until sources, tests or a reviewer confirm it.",
    },
    {
      id: "three-things",
      title: "What shapes an answer",
      readTimeMinutes: 1,
      content:
        "Three inputs shape a generation:\n\n- **Context:** instructions, messages, attachments and tool results in the window.\n- **Training:** general patterns of uneven coverage and age, never a source for private or current facts.\n- **Settings:** model, sampling, enabled tools and product policies.\n\n> **Grounding rule.** For current, private or high-stakes facts, supply an authoritative source and check that the answer follows from it.",
    },
    {
      id: "constitutional-ai",
      title: "Constitutional AI",
      readTimeMinutes: 1,
      content:
        "Constitutional AI is one Anthropic training method: written principles generate critiques, revisions and preference data. It works beside other safety methods and makes no answer automatically correct.\n\nA refusal is model output, not a policy ruling. For a legitimate task, add the missing purpose and constraints without bypassing a valid safety boundary.\n\nHedged wording is not calibrated confidence. Define what the model returns when sources fall short, and test known and unknown cases.",
    },
    {
      id: "feel-it",
      title: "Ask what it cannot know",
      readTimeMinutes: 1,
      content:
        "Ask about project data you never supplied. Depending on setup, the model abstains, asks for context or answers with nothing behind it. A project claim needs project evidence: supply the source, ask for a citation and verify it.",
    },
    {
      id: "failure-modes",
      title: "Name the failure",
      readTimeMinutes: 1,
      content:
        "Name the failure before you edit the prompt:\n\n- **Unsupported claim:** no supplied source backs it. Add sources and require citations you check.\n- **Instruction drift:** a stated constraint or format breaks. Make the criterion testable, validate against a schema or split the task.\n- **Generic output:** domain detail or style is missing. Add context and a reviewed example, then compare on representative inputs.",
    },
  ],
  widgets: [
    {
      kind: "prompt-sandbox",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "mental-model",
        cpId: "feel-it",
        title: "Ask about something it can't know",
        hint: "Try: \"Which oncall rotation owns the auth service in my team?\"",
        placeholder:
          "Ask about context you haven't given Claude…",
      },
    },
    {
      kind: "quiz",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "mental-model",
        cpId: "q1",
        question:
          'You ask Claude, "which of our microservices has the highest p99 latency?" and you\'ve pasted no data. What happens?',
        options: [
          "Claude queries your observability stack and answers accurately.",
          "Claude refuses to answer without data.",
          "Any named service is a guess until you supply telemetry.",
          'Claude returns the string "unknown".',
        ],
        correct: 2,
        explanation:
          "Claude sees your telemetry only if a tool supplies it. Supply measured data or a read-only metrics tool, then check the answer against it.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "mental-model",
        cpId: "q2",
        question:
          "Does Claude remember across two separate chats what you told it last week?",
        options: [
          "Yes, it has a personal memory of you.",
          "No, each chat starts empty unless the product adds memory.",
          "Yes, but only within the same calendar day.",
          "Only if you paid extra.",
        ],
        correct: 1,
        explanation:
          "Persistence is a product feature. Projects, CLAUDE.md or auto-memory can supply it; check the active product controls.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "mental-model",
        cpId: "q3",
        question:
          "Which statement best describes a model generation?",
        options: [
          "Retrieve the correct answer from its training data.",
          "Predict a likely continuation from everything in the window.",
          "Refuse when uncertain.",
          "Reason from first principles independently of input.",
        ],
        correct: 1,
        explanation:
          "The model continues from the current input and context. Evidence and review decide whether that is right.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "socratic-tutor",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "mental-model",
        cpId: "tutor",
        topic: "the mental model for what Claude is",
        persona:
          "Keep the learner honest. If they gesture vaguely, press them. Use concrete, real-world examples.",
      },
    },
  ],
};

export default lesson;
