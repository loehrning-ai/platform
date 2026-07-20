// Ported from claude/lessons/09-grounding.html.
// Widget manifest: PromptSandbox x1 (sb), Quiz x1 (q1), RewriteArena x1
// (arena). Wired incrementally (plan 008 stages 4, 5).
import type { ClaudeLesson } from "../types";

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
  widgets: [],
};

export default lesson;
