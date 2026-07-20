// Ported from claude/lessons/03-context.html.
// Widget manifest: SemanticSpace x1 (sem), Tokenizer x1 (tok), Quiz x3 (q1,
// q2, q3), PromptSandbox x1 (sb). Wired incrementally (plan 008 stages 4, 7).
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "context",
  number: 3,
  title: "Context Windows and Semantic Models",
  subtitle:
    "How Claude \"sees\" your text, and why token order matters.",
  durationMinutes: 10,
  trackId: "foundations",
  hook: "Meaning is geometry. Let's look at the map.",
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
        "Here's a reframe that will make you better almost immediately: stop calling it prompt engineering. Call it context engineering. The phrase comes out of Anthropic's own engineering team, and it captures something real, on almost every prompt you'll ever write, the words you labor over matter less than the stuff you put around them: the system prompt, the pasted docs, the examples, the prior turns, the tool results. Get the context right and mediocre wording still works. Get the context wrong and no amount of wordsmithing will save you.\n\nTwo ideas power this. Both are worth internalizing.\n\n**First:** to Claude, words aren't just symbols, they're positions in space. \"Espresso\" and \"latte\" live next door. \"Espresso\" and \"kubernetes\" live on different continents. This is what \"semantic model\" means, and it's the reason prompt words behave like coordinates, not incantations.\n\n**Second:** Claude can only think about what fits in its current window. That window is large, hundreds of thousands of tokens on modern Claudes, but it's finite, and attention across it is not uniform. What you put near the start and near the end matters more than what's buried in the middle.",
    },
    {
      id: "meaning-in-space",
      title: "Meaning lives in space",
      readTimeMinutes: 1,
      content:
        "Try it below. The canvas is a 2D projection of semantic space. The real thing has thousands of dimensions, but two is enough to see the shape. Drop a word; Claude places it near its neighbors.\n\n> **Why you care.** When you write \"summarize this like a concise executive brief,\" every word pulls the output toward a region of space. Swap \"concise\" for \"exhaustive\" and the whole galaxy shifts. This is why specificity beats vagueness, specific words have sharper coordinates.",
    },
    {
      id: "window-as-budget",
      title: "The window is a budget: spend it well",
      readTimeMinutes: 2,
      content:
        "The context window is everything Claude can see at once: system prompt, user message, pasted docs, prior turns, tool results, the response being generated. Every token you spend on one thing is a token you can't spend on another. Treat it like a budget.\n\nThree principles Anthropic's team uses internally:\n\n1. **Place long documents at the top.** Their docs recommend putting big docs above your instructions and question. Queries placed at the end of a long context can improve response quality by up to 30%.\n2. **Delimit ruthlessly.** Wrap each doc in `<document index=\"1\" source=\"…\">` tags. This lets Claude cite cleanly and avoids confusion about which source is which.\n3. **Restate the key constraint near the question.** If the critical rule is \"don't invent facts,\" say it again right before the ask. Positional attention is real, use it.\n\n**Do: structure the window.** System prompt up top. Docs in the middle with delimiters. Examples near the end. Question last. Critical rules restated right before the ask.\n\n**Don't: dump and hope.** Pasting 40 PDFs and asking \"what's important?\" with no guidance leaves Claude to guess which slice you care about, and guess it will.",
    },
    {
      id: "long-context-template",
      title: "The long-context template",
      readTimeMinutes: 2,
      content:
        "Here's the shape Anthropic recommends when you have real documents to ground on. Memorize this structure.\n\n```\n<documents>\n  <document index=\"1\" source=\"rollout-plan.md\">\n  [full text of doc 1]\n  </document>\n  <document index=\"2\" source=\"oncall-runbook.md\">\n  [full text of doc 2]\n  </document>\n</documents>\n\n<instructions>\nAnswer using ONLY the documents above. If the answer isn't there, say so.\nCite sources as [doc-1] or [doc-2] inline.\n</instructions>\n\n<question>\nWhat's our rollback procedure if the forced cutover fails?\n</question>\n```\n\nThree things this does: grounds the answer in real sources, gives Claude permission to say \"not in the docs\" (which drops hallucinations), and makes the output auditable.",
    },
    {
      id: "tokens-briefly",
      title: "Tokens, briefly",
      readTimeMinutes: 1,
      content:
        "Claude doesn't read characters or words, it reads tokens. Rough rule: 1 token ≈ 4 English characters ≈ ¾ of a word. \"Kubernetes\" is one token. \"Antidisestablishmentarianism\" is several.\n\nWhy it matters: context limits and pricing are in tokens, and the difference between a prompt that fits and one that doesn't is often tokenization, not words.",
    },
    {
      id: "too-big-docs",
      title: "When your docs are too big",
      readTimeMinutes: 1,
      content:
        "Sooner or later you'll have more context than the window holds. Three patterns Anthropic's teams use:\n\n1. **Summarize first, ground second.** Use a first pass to extract the relevant slice. Feed only the slice to the second pass with the real question.\n2. **Chain, don't cram.** Break one giant prompt into several: extract, classify, draft, review. Each stage has a cleaner, smaller window.\n3. **Retrieval, if you have it.** If you're in an agentic surface (Claude Code, a custom app), give Claude tools to grep or search, let it pull only what it needs. Anthropic's own Claude Code uses regex + grep for this rather than vector search, because the model is good at crafting queries.",
    },
  ],
  widgets: [
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
          "<documents>\n<document index=\"1\">\n[paste a short doc here]\n</document>\n</documents>\n\n<question>\nAsk something only answerable from the doc\n</question>",
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
          "You paste a 200-page doc and ask a question. Why might Claude miss a fact buried on page 103?",
        options: [
          "It ran out of memory.",
          "Positional bias, content in the middle of a long window gets less attention than content near the ends.",
          "Claude can only read PDFs.",
          "Large windows trigger safety blocks.",
        ],
        correct: 1,
        explanation:
          "Place critical facts near the start or end. For very long docs, summarize key points and restate them close to your question.",
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
        question: "Roughly how many tokens is a 10,000-word document?",
        options: ["~1,000", "~5,000", "~13,000", "~100,000"],
        correct: 2,
        explanation:
          "1 word ≈ 1.3 tokens. So 10,000 words is ~13,000 tokens. Useful when estimating whether a set of docs will fit.",
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
          "Long documents go at the top, question near the end. Queries placed at the end of a long context can improve response quality by up to 30%.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
