// Ported from claude/lessons/09-grounding.html.
// Widget manifest: PromptSandbox x1 (sb), Quiz x1 (q1), RewriteArena x1
// (arena). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "grounding",
  number: 9,
  title: "Grounding and Unsupported Claims",
  subtitle:
    "Connect claims to sources, define abstention, and verify citations.",
  durationMinutes: 10,
  trackId: "advanced",
  hook: "A fluent claim still needs evidence.",
  keyConcepts: ["Paste it, cite it, refuse mode", "Green flags vs. red flags"],
  quiz: [],
  sections: [
    {
      id: "not-a-bug",
      title: "Define the failure precisely",
      readTimeMinutes: 1,
      content:
        "The number looks right. Nobody can trace it. An unsupported claim is a statement the allowed sources cannot justify, and it appears even when relevant context is present. Causes include missing retrieval, conflicting documents, ambiguous instructions, model error, or a citation that does not support the sentence.\n\nStructure reduces the risk. Supply authoritative data, define the allowed source boundary, require inspectable citations, allow abstention, verify the result.\n\n> A citation is a pointer to check, not proof.",
    },
    {
      id: "three-grounding-moves",
      title: "The three grounding moves",
      readTimeMinutes: 2,
      content:
        '- **01 · Supply or retrieve the source.** Use the current policy, log, or code. Model training is not a source for private or changing facts.\n- **02 · Require traceability.** Ask for a source identifier and quoted passage per material claim. Check that the passage supports the claim.\n- **03 · Define abstention.** For example, "If the allowed sources do not support an answer, return `NOT_IN_CONTEXT` and list the missing information." Test answerable and unanswerable cases.',
    },
    {
      id: "smell-test",
      title: "Smell test: how to spot a hallucination",
      readTimeMinutes: 2,
      content:
        '**Useful signals:** source identifiers, short supporting quotations, explicit gaps, separation of source facts from inference.\n\n**Review triggers:** precise numbers without a source, entities absent from the allowed material, citations that point to irrelevant text, and broad claims such as "studies show" without named evidence. These signals guide review; they do not replace it.',
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
          "Which workflow most directly reduces unsupported factual claims?",
        options: [
          'Add "do not hallucinate" to every prompt.',
          "Select a different model without changing the evidence workflow.",
          'Provide the source data and require citations or an explicit "not in context" signal.',
          "Ask twice and compare answers.",
        ],
        correct: 2,
        explanation:
          "Provide authoritative data, require traceable support, define abstention, and verify the cited passages.",
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
        task: "Write a prompt that answers from an attached policy document and abstains when the document does not support an answer.",
        original: "answer questions about this doc and dont make stuff up",
        criteria:
          "requires citations, provides an explicit out-of-context signal, restricts answers to attached context",
      },
    },
  ],
};

export default lesson;
