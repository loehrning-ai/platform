// Ported from claude/lessons/09-grounding.html.
// Widget manifest: PromptSandbox x1 (sb), Quiz x1 (q1), RewriteArena x1
// (arena). Wired incrementally (plan 008 stages 4, 5).
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "grounding",
  number: 9,
  title: "Avoiding Hallucinations",
  subtitle: "Ground the model in your data, or prepare for fiction.",
  durationMinutes: 10,
  trackId: "advanced",
  hook: "If it isn't in context, it isn't knowledge.",
  keyConcepts: ["Paste it, cite it, refuse mode", "Green flags vs. red flags"],
  quiz: [],
  sections: [
    {
      id: "not-a-bug",
      title: "Not a bug",
      readTimeMinutes: 1,
      content:
        "Hallucination is not a bug. It's Claude doing its job, completing plausibly, with no ground truth to complete against. The fix isn't asking nicely. The fix is structural: give it the data, require citations, and allow an honest \"I don't know.\"\n\n> If a fact isn't in context, treat it as fiction until proven otherwise.",
    },
    {
      id: "three-grounding-moves",
      title: "The three grounding moves",
      readTimeMinutes: 2,
      content:
        "- **01 · Paste it.** Direct grounding. Paste the doc, the log, the PR description. Then ask about that. \"According to the attached…\"\n- **02 · Cite it.** Tell Claude: \"Cite the exact line or quote for every claim. If you can't cite, say so.\" You get citations, and honest gaps.\n- **03 · Refuse mode.** \"If the answer isn't in the provided context, respond exactly: NOT_IN_CONTEXT.\" Gives you a clean signal instead of a guess.",
    },
    {
      id: "smell-test",
      title: "Smell test: how to spot a hallucination",
      readTimeMinutes: 2,
      content:
        "**Green flags:** quotes from context with line numbers. \"I can't find this in the attached docs.\" Acknowledgements of uncertainty.\n\n**Red flags:** oddly specific numbers with no source. Named people/projects that don't appear in context. Confident plural claims (\"studies show…\").",
    },
  ],
  widgets: [
    {
      kind: "prompt-sandbox",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "grounding",
        cpId: "try",
        title: "Force citations",
        hint: 'Paste a short doc. Then add: "Answer only from the doc. Quote line numbers. If not present, say NOT_IN_CONTEXT."',
        placeholder:
          "DOC:\n<paste short doc>\n\nQUESTION:\n<ask>\n\nRULES:\n- Answer only from the doc.\n- Quote the exact line for every claim.\n- If not in the doc, respond exactly: NOT_IN_CONTEXT",
      },
    },
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "grounding",
        cpId: "q1",
        question:
          "What's the most reliable way to stop Claude from inventing facts?",
        options: [
          'Add "do not hallucinate" to every prompt.',
          "Use a smarter model.",
          'Provide the source data and require citations or an explicit "not in context" signal.',
          "Ask twice and compare answers.",
        ],
        correct: 2,
        explanation:
          'Structural grounding beats pleading. Give the data, require citations, and allow a clean "I don\'t know" signal.',
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "rewrite-arena",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "grounding",
        cpId: "arena",
        task: "Write a prompt for answering questions about an attached policy doc with zero hallucination tolerance.",
        original: "answer questions about this doc and dont make stuff up",
        criteria:
          "requires citations, provides an explicit out-of-context signal, restricts answers to attached context",
      },
    },
  ],
};

export default lesson;
