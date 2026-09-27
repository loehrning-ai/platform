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
  title: "What Claude actually is",
  subtitle: "The model that holds up when an answer sounds confident.",
  durationMinutes: 8,
  trackId: "foundations",
  hook: "Claude generates from the context it receives. Retrieval and memory are product features.",
  keyConcepts: [
    "Completion engine",
    "Constitutional AI",
    "Grounding",
    "Hallucination",
    "Helpful, harmless, honest",
  ],
  quiz: [],
  sections: [
    {
      id: "what-it-is",
      title: "What it is (and isn't)",
      readTimeMinutes: 1,
      content:
        "Claude generates text from what sits in the window: the request, the conversation, system instructions, and documents or tool results the product supplied. Output is probabilistic; the same request can land differently tomorrow.\n\n**Generation is not retrieval.** Looking something up takes an enabled tool and a call that returned, such as web search, repository access or a database query.\n\n**The model is not storage.** History, project context and memory files come from the product, if at all. Check which controls are active.\n\n**Fluent output is not review.** The model can follow a false premise and invent details. Important output stays a draft until sources, tests or a reviewer confirm it.",
    },
    {
      id: "three-things",
      title: "The three things in every exchange",
      readTimeMinutes: 1,
      content:
        "Three inputs shape a generation:\n\n- **Current context:** instructions, messages, attachments and tool results in the active window.\n- **Training:** general patterns of varying coverage and recency, no source for private or current facts.\n- **Settings and safeguards:** model, sampling, enabled tools and product policies.\n\n> **Grounding rule.** When an answer depends on current, private or high-stakes facts, supply an authoritative source and check that the response follows from it.",
    },
    {
      id: "constitutional-ai",
      title: "Constitutional AI, in 90 seconds",
      readTimeMinutes: 1,
      content:
        "Constitutional AI is one Anthropic training method: written principles generate critiques, revisions and preference data. It works beside other safety methods and makes no response automatically correct or refusal consistent.\n\nA refusal is a model output, not a policy ruling. For a legitimate task, add the missing purpose and constraints without bypassing a valid safety boundary.\n\nUncertainty language is not calibrated confidence, so check the evidence. Define what the model returns when sources fall short, and test known and unknown cases.",
    },
    {
      id: "feel-it",
      title: "Feel it: the unknown-knowns test",
      readTimeMinutes: 1,
      content:
        "Ask about project data you never supplied. Depending on model, product and prompt, the response abstains, asks for context or answers with nothing behind it. A project-specific claim needs project-specific evidence, so supply the source, ask for a citation and verify it.",
    },
    {
      id: "failure-modes",
      title: "The three failure modes, named",
      readTimeMinutes: 1,
      content:
        "Name the failure before you edit the prompt:\n\n- **Unsupported claim:** no supplied source backs it. Add sources or retrieval and require citations you check.\n- **Instruction drift:** a stated constraint or format is broken. Make the criterion testable, validate against a schema or split the task.\n- **Generic output:** domain detail or style is missing. Add context and a reviewed example, then compare on representative inputs.",
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
        hint: 'Try: "Which oncall rotation owns the auth service in my team?", then read the answer.',
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
          "The model continues from the current input and context. Whether that is right depends on evidence and verification.",
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
