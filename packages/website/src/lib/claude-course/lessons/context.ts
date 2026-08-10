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
  title: "Context Windows, Tokens, and Retrieval",
  subtitle: "What enters a request, how it is tokenized, and what to verify.",
  durationMinutes: 10,
  trackId: "foundations",
  hook: "Context is finite. Relevance, source quality, and placement all matter.",
  keyConcepts: [
    "Context engineering",
    "Semantic space",
    "Positional attention",
    "Tokens",
    "Document delimiting",
  ],
  quiz: [],
  sections: [
    {
      id: "context-is-the-product",
      title: "Context is the product",
      readTimeMinutes: 3,
      content:
        "Context engineering means selecting and organizing the information available to a model for a task: instructions, source documents, examples, prior messages, and tool results. Clear wording still matters, but wording cannot supply a missing private fact or repair an unreliable source.\n\nTwo technical ideas help:\n\n**Semantic representations.** Models represent tokens through high-dimensional numerical states. Related terms can have related representations, but a two-dimensional map is only an illustration, not a view into a Claude request.\n\n**Finite context.** Each model and product has a documented context limit. Long inputs can still fail because relevant material is hard to locate, sources conflict, or output consumes part of the available budget. Test with the model and input distribution you will use.",
    },
    {
      id: "meaning-in-space",
      title: "Meaning lives in space",
      readTimeMinutes: 1,
      content:
        'The exercise below is a local, rule-based illustration. It assigns words to predefined topic groups; it does not call Claude or calculate model embeddings.\n\n> **Why it matters.** Terms such as "concise" and "exhaustive" imply different output requirements. Convert those terms into testable limits when consistency matters.',
    },
    {
      id: "window-as-budget",
      title: "The window is a budget: spend it well",
      readTimeMinutes: 2,
      content:
        'A request\'s context can include system and product instructions, user messages, documents, prior turns, and tool results. The response also uses tokens, so input and output share the model\'s available budget.\n\nThree practical controls:\n\n1. **Separate documents from the question.** Anthropic\'s long-context guidance places source documents before the query for multi-document tasks. Validate that arrangement with your own evaluations.\n2. **Label each source.** Tags such as `<document index="1" source="…">` preserve source boundaries and make citation formats easier to specify.\n3. **State the evidence rule beside the task.** Define whether the model may use general knowledge, which sources are authoritative, and what to return when support is missing.\n\nDo not submit a large document set without a retrieval or relevance strategy. More text can add conflicts and distract from the material needed for the question.',
    },
    {
      id: "long-context-template",
      title: "The long-context template",
      readTimeMinutes: 2,
      content:
        'Use a structure like this when an answer must be based on supplied documents.\n\n```\n<documents>\n  <document index="1" source="rollout-plan.md">\n  [full text of doc 1]\n  </document>\n  <document index="2" source="oncall-guide.md">\n  [full text of doc 2]\n  </document>\n</documents>\n\n<instructions>\nAnswer using ONLY the documents above. If the answer isn\'t there, say so.\nCite sources as [doc-1] or [doc-2] inline.\n</instructions>\n\n<question>\nWhat\'s our rollback procedure if the forced cutover fails?\n</question>\n```\n\nThe structure distinguishes sources, rules, and the question. Citations make claims inspectable, but they still need verification against the cited passage.',
    },
    {
      id: "tokens-briefly",
      title: "Tokens, briefly",
      readTimeMinutes: 1,
      content:
        "Claude API inputs are tokenized before inference. Token counts depend on the selected model, language, punctuation, and content type, so word-to-token formulas are planning estimates rather than guarantees.\n\nUse Anthropic's token-counting endpoint or the tooling for the selected product when context fit or cost matters.",
    },
    {
      id: "too-big-docs",
      title: "When your docs are too big",
      readTimeMinutes: 1,
      content:
        "When the source set is larger than the useful context budget, choose a workflow that preserves traceability:\n\n1. **Retrieve, then answer.** Select relevant passages and retain source identifiers. Measure retrieval recall on known questions.\n2. **Stage the task.** Separate extraction, classification, drafting, and review when each stage has a checkable output.\n3. **Use tools for changing sources.** File search, database queries, or web retrieval can fetch current evidence. Restrict permissions and record which sources were used.\n\nA summary is a derived source and can omit details. Keep links to the original passages and verify critical claims there.",
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
        title: "Meaning lives in space",
        scenario:
          "This local illustration maps words to predefined topic groups. It does not call Claude or calculate embeddings.",
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
        hint: "Paste something, a thread, a PR description, then ask something that depends on it.",
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
          "A critical fact sits inside a long document set. Which workflow gives you the strongest evidence for the answer?",
        options: [
          "Submit every document without labels and trust the summary.",
          "Retrieve the relevant passage, request a source citation, and verify the cited text.",
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
          "How should you determine whether a long document set fits the selected model's context budget?",
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
          "Anthropic's long-context guidance places documents before the query for multi-document tasks. Confirm the arrangement with evaluations for your own model and inputs.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
