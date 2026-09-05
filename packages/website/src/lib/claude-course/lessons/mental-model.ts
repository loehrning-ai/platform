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
  title: "What Claude Actually Is",
  subtitle: "The model that holds up when an answer sounds confident.",
  durationMinutes: 8,
  trackId: "foundations",
  hook: "Claude generates from the context it receives. Retrieval and memory are product features, not traits of the model.",
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
      readTimeMinutes: 3,
      content:
        "Fluency proves nothing. Claude generates from what sits in the window, meaning the request, the conversation, system instructions, and any documents or tool results the product supplied. The output is probabilistic. The same request can land differently tomorrow.\n\nThree boundaries hold every time.\n\n**Generation is not retrieval.** A confident answer is not evidence that anything was looked up. Web search, repository access, and database queries need an enabled tool and a call that returned.\n\n**The model is not storage.** Chat history, project context, and memory files come from the product, when they come at all. Check which controls are active instead of assuming a chat remembers.\n\n**Fluent output is not review.** The model will follow a false premise and produce a detail with nothing behind it. Important output is a draft. Sources, tests, or a reviewer decide what holds.\n\n> Judge a response by its evidence, not by how it reads.",
      keyTakeaway:
        "Claude generates from the supplied context. Retrieval, persistence, and verification are product features, never model guarantees.",
    },
    {
      id: "three-things",
      title: "The three things in every exchange",
      readTimeMinutes: 2,
      content:
        "Three inputs shape a generation:\n\n- **Current context.** System and product instructions, messages, attached material, and tool results that fit in the active context window.\n- **Model training.** General patterns and information learned during training. Coverage and recency vary, so training is not a source for private or current facts.\n- **Generation settings and safeguards.** The selected model, sampling settings, enabled tools, and product policies move the answer.\n\n> **Grounding rule.** When an answer depends on current, private, or high-stakes facts, supply an authoritative source and check that the response follows from it.",
    },
    {
      id: "constitutional-ai",
      title: "Constitutional AI, in 90 seconds",
      readTimeMinutes: 2,
      content:
        "Constitutional AI is one method Anthropic uses during model training. A written set of principles generates critiques, revisions, and preference data. It sits beside other training and safety methods. No response becomes correct, no refusal consistent.\n\nWhat does that change at the keyboard?\n\n1. **A refusal is a model output, not a policy ruling.** For a legitimate task, add the missing purpose and constraints. Do not try to bypass a valid safety boundary.\n2. **Uncertainty language is not calibrated confidence.** A confident answer can be wrong, and a cautious answer can be right. Check the evidence.\n3. **An abstention path helps.** State what the model should return when the supplied sources fall short. Then test that behavior on known and unknown cases.",
    },
    {
      id: "feel-it",
      title: "Feel it: the unknown-knowns test",
      readTimeMinutes: 1,
      content:
        "Ask a question that depends on project data you never supplied. The response may abstain, ask for context, or answer with nothing behind it; behavior varies by model, product, and prompt.\n\nThe criterion is simple: no project-specific claim is trustworthy without project-specific evidence.\n\n> Supply the source, request a citation, and verify the citation.",
    },
    {
      id: "failure-modes",
      title: "The three failure modes, named",
      readTimeMinutes: 1,
      content:
        "Name the failure before you touch the prompt:\n\n- **Unsupported claim.** Nothing in the supplied source backs the statement. Fix: add retrieval or source material, require citations, and check them.\n- **Instruction drift.** The response breaks a stated constraint or format. Fix: make the criterion testable, validate against a schema where one exists, or split the task.\n- **Generic output.** The response lacks the domain detail or style the task needs. Fix: add relevant context and a reviewed example, then compare results on representative inputs.",
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
          "Ask Claude something that depends on context you haven't given it…",
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
          "Any specific service claim is ungrounded; request or supply telemetry before accepting an answer.",
          'Claude returns the string "unknown".',
        ],
        correct: 2,
        explanation:
          "Without telemetry, any named service is a guess. Supply measured data or a read-only metrics tool, then check the answer against it.",
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
          "Across two separate chats, does Claude remember what you told it last week?",
        options: [
          "Yes, it has a personal memory of you.",
          "No, unless the product surface explicitly adds memory, each chat is a blank window.",
          "Yes, but only within the same calendar day.",
          "Only if you paid extra.",
        ],
        correct: 1,
        explanation:
          "Persistence is a product feature. Projects, CLAUDE.md, or auto-memory can supply it; inspect the active product controls instead of assuming cross-chat recall.",
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
          "Which statement most accurately describes a model generation?",
        options: [
          "Retrieve the correct answer from its training data.",
          "Predict the most likely helpful continuation given everything in the window.",
          "Refuse when uncertain.",
          "Reason from first principles independently of input.",
        ],
        correct: 1,
        explanation:
          "The model continues from the current input and context. Whether it is right still depends on evidence and verification.",
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
