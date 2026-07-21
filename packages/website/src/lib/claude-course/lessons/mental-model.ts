// Ported from claude/lessons/01-mental-model.html.
// Widget manifest (verified via grep of mountWidget calls): Quiz x3 (q1, q2,
// q3), PromptSandbox x1 (sb1), SocraticTutor x1 (tutor). Wired incrementally
// as each widget kind lands (plan 008 stages 3-6); see the code comment on
// `widgets` below for current status.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "mental-model",
  number: 1,
  title: "What Claude Actually Is",
  subtitle: "A useful mental model before you type a single prompt.",
  durationMinutes: 8,
  trackId: "foundations",
  hook: "Claude is not a search engine. It is not a database. It is something stranger and more useful.",
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
        "The fastest way to get better at prompting is to stop thinking of Claude as a thing that *knows*, and start thinking of it as a thing that *continues*. Given everything in front of it (system prompt, your message, pasted docs, prior turns) it produces the most likely helpful continuation. That's the whole job. Everything else downstream (why some prompts sing, why others flop, why CLAUDE.md matters, why grounding matters) is a consequence of that one fact.\n\nSo before we get to techniques, three things Claude **isn't**:\n\n**Claude is not a search engine.** It doesn't retrieve from an index. It doesn't look anything up unless you wire a tool to it. Ask \"which of our services has the worst p99?\" with nothing attached and it won't say \"I don't have data.\" It will give you a plausible answer. Confidently. That's not a bug, it's Claude doing exactly what it's trained to do.\n\n**Claude is not a database.** It has no standing memory of your team, your codebase, your last conversation, or you. Some surfaces (Projects, Claude Code's CLAUDE.md, auto-memory in newer versions) graft persistence on top. But the base model is stateless. Default assumption: every new chat is a blank window.\n\n**Claude is not a colleague.** It has no stake in being right, no pride in being wrong, no long-run model of what you care about. It won't push back on a bad framing unless you invite it to. Great news if you want a tireless collaborator, a real risk if you want a second opinion.\n\n> It is a very, very good completion of the most likely next few thousand tokens, given everything you put in the window.\n\nAnthropic's own guidance puts it more usefully: treat Claude like a brilliant new hire on their first day. They have world-class general skills. They have zero context on your project, your team, or what \"good\" looks like at your company. Every great prompting technique in this course is, at heart, a way to onboard that new hire faster.",
      keyTakeaway:
        "Claude is a very, very good completion of the most likely next few thousand tokens, given everything you put in the window.",
    },
    {
      id: "three-things",
      title: "The three things in every exchange",
      readTimeMinutes: 2,
      content:
        "Every time you hit send, three things are in play. Keep this map in your head.\n\n- **The window.** System prompt + your message + pasted docs + prior turns + tool results. This is the *only* situational information Claude has. If it's not here, it doesn't exist.\n- **The priors.** What it was trained on: broad world knowledge, code idioms, writing conventions, reasoning patterns. Zero company-internal anything. Frozen at training time, no live web, no live data.\n- **The objective.** What it's trying to do: produce a response that's helpful, harmless, and honest (the HHH frame from Constitutional AI). Not \"be right.\" \"Be the likely-best helpful continuation.\"\n\n> **The grounding rule.** If a fact isn't in the window, it isn't knowledge, it's a guess. Good prompting is the discipline of putting real facts in the window before asking for answers that depend on them. The rest of this course is a toolkit for doing that well.",
    },
    {
      id: "constitutional-ai",
      title: "Constitutional AI, in 90 seconds",
      readTimeMinutes: 2,
      content:
        "Claude is trained with a technique Anthropic calls Constitutional AI (CAI). In plain English: instead of humans rating every response for safety, Anthropic writes down a \"constitution\", a set of principles, and trains Claude to critique and revise its own outputs against those principles. The model learns to be helpful, harmless, and honest from the principles themselves.\n\nThree practical consequences you'll feel in your prompts:\n\n1. **Claude will push back on clearly harmful asks**, but it's calibrated to be helpful first. If it refuses something reasonable, the refusal is usually a misread of intent. Re-frame the ask with context and it often works.\n2. **Claude will caveat and hedge when uncertain**, unless you tell it not to. \"Just answer, no hedging\" is a legitimate instruction in many cases.\n3. **Claude has a bias toward honest uncertainty.** If you give it room to say \"I don't know,\" it will take that room. Most hallucinations happen when the prompt doesn't leave that door open.\n\nNone of this is mystical. It's a training choice, and you can steer against it or with it depending on the job.",
    },
    {
      id: "feel-it",
      title: "Feel it: the unknown-knowns test",
      readTimeMinutes: 1,
      content:
        "Ask Claude something *specific* about your team, your project, or a file you didn't paste. Watch what happens. (Spoiler: it will answer. Confidently. Probably wrong.)\n\nThis isn't Claude being broken. It's Claude doing exactly what it's designed to do, completing the most likely helpful next tokens, with nothing real to complete from. The fix is always the same.\n\n> Put. The facts. In the window.",
    },
    {
      id: "failure-modes",
      title: "The three failure modes, named",
      readTimeMinutes: 1,
      content:
        "Most bad Claude outputs trace back to one of three failures. Once you can name them, you can fix them.\n\n- **Hallucination.** Claude invents a plausible fact. Almost always a grounding failure, the fact wasn't in the window, so the model generated a shaped-right guess. Fix: paste the real source, or give it a tool to look it up.\n- **Drift.** Output starts strong, slowly wanders off-spec. Usually a constraint failure, the format or rules weren't strong enough to hold across a long generation. Fix: tighten constraints, ask for structured output, or break the task into steps.\n- **Generic slop.** Output is technically on-topic but reads like a LinkedIn post. A specificity failure, not enough context, not enough role, not enough concrete examples. Fix: add a few-shot example of what \"good\" looks like.",
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
        placeholder: "Ask Claude something that depends on context you haven't given it…",
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
          "Claude invents a plausible answer that sounds right but isn't grounded.",
          'Claude returns the string "unknown".',
        ],
        correct: 2,
        explanation:
          "Claude doesn't refuse by default and doesn't know your systems. Without data in the window, it generates a plausible-sounding completion. That's a grounding failure, the textbook hallucination pattern.",
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
          "The base model is stateless. Some surfaces (Projects, CLAUDE.md, auto-memory) graft persistence on top, but the safe default assumption is \"no memory.\"",
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
          "Which is the single best summary of Claude's job during a generation?",
        options: [
          "Retrieve the correct answer from its training data.",
          "Predict the most likely helpful continuation given everything in the window.",
          "Refuse when uncertain.",
          "Reason from first principles independently of input.",
        ],
        correct: 1,
        explanation:
          "It's a completion engine, trained to be helpful, harmless, and honest. That framing explains both its strengths (creative drafting, structured transformation) and its failure modes (confident wrongness without grounding).",
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
        persona: "Keep the learner honest. If they gesture vaguely, press them. Use concrete, real-world examples.",
      },
    },
  ],
};

export default lesson;
