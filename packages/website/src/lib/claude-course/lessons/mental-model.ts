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
  subtitle: "A useful mental model before you type a single prompt.",
  durationMinutes: 8,
  trackId: "foundations",
  hook: "A language model generates responses from the context it receives. Retrieval and persistence come from the product and tools around it.",
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
        "Claude generates a response conditioned on the request, the conversation, system instructions, and any tool results or documents supplied by the product. The output is probabilistic: the same request can produce different wording or conclusions.\n\nThree boundaries matter:\n\n**Generation is not retrieval.** A model response is not evidence that a source was searched. Web search, repository access, or database lookup requires an enabled tool and a successful tool call.\n\n**The model does not provide durable storage.** A product can add chat history, project context, or memory files. Check the product's controls instead of assuming that information carries between conversations.\n\n**Fluent output is not independent review.** The model can follow an incorrect premise or produce an unsupported detail. Treat important output as a draft that needs source checks, tests, or human review.\n\n> Judge a response by its evidence and verification, not by fluency.",
      keyTakeaway:
        "Claude generates responses from the supplied context; retrieval, persistence, and verification require explicit product features or tools.",
    },
    {
      id: "three-things",
      title: "The three things in every exchange",
      readTimeMinutes: 2,
      content:
        "Three inputs shape a generation:\n\n- **Current context.** System and product instructions, messages, attached material, and tool results that fit in the active context window.\n- **Model training.** General patterns and information learned during training. Coverage and recency vary, so training is not a source for private or current facts.\n- **Generation settings and safeguards.** The selected model, sampling settings, enabled tools, and product policies affect the response.\n\n> **Grounding rule.** When an answer depends on current, private, or high-stakes facts, provide an authoritative source and verify that the response is supported by it.",
    },
    {
      id: "constitutional-ai",
      title: "Constitutional AI, in 90 seconds",
      readTimeMinutes: 2,
      content:
        "Constitutional AI is one method Anthropic uses during model training. A written set of principles is used to generate critiques, revisions, and preference data. It complements other training and safety methods; it does not make every response correct or every refusal consistent.\n\nPractical implications:\n\n1. **A refusal is a model output, not a policy ruling.** For a legitimate task, add the missing purpose and constraints. Do not try to bypass a valid safety boundary.\n2. **Uncertainty language is not calibrated confidence.** A confident answer can be wrong, and a cautious answer can be correct. Check evidence.\n3. **An abstention path helps.** State what the model should return when the supplied sources are insufficient. Then test that behavior with known and unknown cases.",
    },
    {
      id: "feel-it",
      title: "Feel it: the unknown-knowns test",
      readTimeMinutes: 1,
      content:
        "Ask a question that depends on private project data you have not supplied. The response may abstain, request context, or produce an unsupported answer; behavior varies by model, product, and prompt.\n\nThe evaluation criterion is simple: no project-specific claim is trustworthy without project-specific evidence.\n\n> Supply the source, request a citation, and verify the citation.",
    },
    {
      id: "failure-modes",
      title: "The three failure modes, named",
      readTimeMinutes: 1,
      content:
        "Use these labels to diagnose output before changing a prompt:\n\n- **Unsupported claim.** A statement has no support in the supplied source. Fix: add retrieval or source material, require citations, and verify them.\n- **Instruction drift.** The response violates a stated constraint or format. Fix: make the criterion testable, use schema validation where available, or split the task.\n- **Generic output.** The response lacks the domain details or style the task requires. Fix: add relevant context and a reviewed example, then compare results on representative inputs.",
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
        hint: 'Try: "Which oncall rotation owns the auth service in my team?", then watch it answer.',
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
          "Any named service would be unsupported without telemetry. Supply measured data or a read-only metrics tool, then verify the answer against that source.",
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
          "Persistence is a product feature. Surfaces can supply Projects, CLAUDE.md, or auto-memory; inspect the current product controls instead of assuming cross-chat recall.",
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
          "The model generates a response conditioned on the current input and context. Correctness still depends on evidence and verification.",
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
