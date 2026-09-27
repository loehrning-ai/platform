// Ported from claude/lessons/03-context.html.
// Widget manifest: SemanticSpace x1 (sem), Tokenizer x1 (tok), Quiz x3 (q1,
// q2, q3), PromptSandbox x1 (sb). Wired incrementally.
import type { ClaudeLesson } from "../types";
import {
  CLAUDE_QUIZ_COPY,
  CLAUDE_QUIZ_TITLE,
  CLAUDE_SEMANTIC_SPACE_SEED,
  CLAUDE_SEMANTIC_SPACE_KEYWORDS,
  CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS,
  CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS,
  CLAUDE_SEMANTIC_SPACE_COPY,
} from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "context",
  number: 3,
  title: "Context windows, tokens, and retrieval",
  subtitle: "Token counts and what to check in the context.",
  durationMinutes: 10,
  trackId: "foundations",
  hook: "The context window is limited, so choose relevant sources.",
  keyConcepts: [
    "Context engineering",
    "Tokens",
    "Source labels",
  ],
  quiz: [],
  sections: [
    {
      id: "context-is-the-product",
      title: "Context is the product",
      readTimeMinutes: 1,
      content:
        "Context engineering means choosing and arranging what a model sees: instructions, documents, examples, prior messages and tool results. Clear wording cannot supply a missing fact or fix an unreliable source.\n\nModels hold tokens as high-dimensional states where related terms land close together; the map below only illustrates this.\n\nEvery model has a documented context limit. Long inputs still fail when the key passage is buried, sources conflict or the output eats the budget, so test with your real model and inputs.",
    },
    {
      id: "meaning-in-space",
      title: "Make vague words precise",
      readTimeMinutes: 1,
      content:
        "The map shows which terms sit close together. Words like \"concise\" or \"exhaustive\" still leave the target open, so turn them into testable limits such as \"at most 150 words\".",
    },
    {
      id: "window-as-budget",
      title: "The window is a budget",
      readTimeMinutes: 1,
      content:
        "Instructions, messages, documents, prior turns and tool results share the window with the response.\n\n1. **Documents before the question.** Anthropic's long-context guidance puts source documents before the query for multi-document tasks. Confirm it with your evals.\n2. **Label each source.** Tags such as `<document index=\"1\" source=\"…\">` keep boundaries visible and simplify citations.\n3. **State the evidence rule.** Say which sources count and what to return without support.\n\nWithout retrieval, a large document set adds conflicts and buries the passage you need.",
    },
    {
      id: "long-context-template",
      title: "The long-context template",
      readTimeMinutes: 2,
      content:
        "When an answer must come from supplied documents:\n\n```\n<documents>\n  <document index=\"1\" source=\"rollout-plan.md\">\n  [full text of doc 1]\n  </document>\n  <document index=\"2\" source=\"oncall-guide.md\">\n  [full text of doc 2]\n  </document>\n</documents>\n\n<instructions>\nAnswer using ONLY the documents above. If the answer isn't there, say so.\nCite sources as [doc-1] or [doc-2] inline.\n</instructions>\n\n<question>\nWhat's our rollback procedure if the forced cutover fails?\n</question>\n```\n\nCitations make claims checkable; someone still reads the cited passage.",
    },
    {
      id: "tokens-briefly",
      title: "Tokens, briefly",
      readTimeMinutes: 1,
      content:
        "Claude API inputs are tokenized before inference. Counts depend on model, language, punctuation and content type, so word-to-token formulas are estimates. For fit or cost, use Anthropic's token-counting endpoint or your product's tooling.",
    },
    {
      id: "too-big-docs",
      title: "When your docs are too big",
      readTimeMinutes: 1,
      content:
        "When sources outgrow the budget, keep them traceable:\n\n1. **Retrieve, then answer.** Select passages with source IDs and measure recall on known questions.\n2. **Stage the task.** Split extraction, classification, drafting and review when each stage has a checkable output.\n3. **Use tools for changing sources.** File, database or web search fetch current evidence; restrict permissions and log the sources.\n\nA summary drops detail, so verify critical claims in the original passage.",
    },
  ],
  widgets: [
    {
      kind: "semantic-space",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "context",
        cpId: "drop",
        title: "Words in meaning space",
        scenario:
          "Sorts words into fixed topic groups, without Claude or embeddings.",
        seed: CLAUDE_SEMANTIC_SPACE_SEED,
        clusterKeywords: CLAUDE_SEMANTIC_SPACE_KEYWORDS,
        clusterLabels: CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS,
        quadrantLabels: CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS,
        copy: CLAUDE_SEMANTIC_SPACE_COPY,
      },
    },
    {
      kind: "tokenizer",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "context",
        cpId: "tok",
      },
    },
    {
      kind: "prompt-sandbox",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "context",
        cpId: "feel",
        title: "Context in, context out",
        hint: "Paste a thread or a PR description, then ask something that depends on it.",
        placeholder:
          '<documents>\n<document index="1">\n[paste a short doc here]\n</document>\n</documents>\n\n<question>\nAsk something only answerable from the doc\n</question>',
      },
    },
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "context",
        cpId: "q1",
        question:
          "A critical fact sits in a long document set. Which workflow gives the strongest evidence?",
        options: [
          "Submit every document without labels and trust the summary.",
          "Retrieve the passage, request a citation and verify it.",
          "Convert every file to PDF before asking.",
          "Repeat the same request until two answers match.",
        ],
        correct: 1,
        explanation:
          "Retrieval narrows the evidence set. Source identifiers and citation checks make the resulting claim auditable.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "context",
        cpId: "q2",
        question:
          "How do you check whether a long document set fits the model's context budget?",
        options: [
          "Assume one token per ten words.",
          "Use the file size in kilobytes.",
          "Use the model's token-counting tool or endpoint.",
          "Count only the visible headings.",
        ],
        correct: 2,
        explanation:
          "Tokenization varies by model, language, punctuation, and content type. Use the supported counter when fit or cost matters.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "context",
        cpId: "q3",
        question:
          "You have three source docs and a question. Where does Anthropic recommend putting the question?",
        options: [
          "At the very top, Claude reads top to bottom.",
          "After the docs, near the end of the prompt.",
          "Interleaved with the docs.",
          "Order doesn't matter.",
        ],
        correct: 1,
        explanation:
          "Anthropic's long-context guidance places documents before the query for multi-document tasks. Confirm this with evaluations on your own model and inputs.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
