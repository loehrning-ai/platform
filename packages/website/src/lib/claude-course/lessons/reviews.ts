// Ported from claude/lessons/08-reviews.html.
// Widget manifest: PromptSandbox x1 (sb), Quiz x1 (q1), RewriteArena x1
// (arena). Wired incrementally (plan 008 stages 4, 5).
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "reviews",
  number: 8,
  title: "Claude for Code Review and PRs",
  subtitle: "Your tireless, slightly-pedantic reviewer.",
  durationMinutes: 9,
  trackId: "advanced",
  hook: "Claude reads diffs. It reads subtext, too.",
  keyConcepts: ["Review prompt template", "Severity tagging", "Focus filters"],
  quiz: [],
  sections: [
    {
      id: "why-it-works",
      title: "Why it works",
      readTimeMinutes: 2,
      content:
        "Claude reads diffs. It notices naming inconsistencies, missing null checks, tests that don't actually test the thing. It also notices subtext, the \"this PR claims to be a refactor but changes behavior\" kind of notice.\n\nThe trick is prompting it like a teammate, not a linter. That means: give it the author's stated goal, the team's conventions, and a clear bar for what counts as a finding.\n\n> **Heads up on newer Claudes.** If your review prompt says \"only report high-severity issues\" or \"don't nitpick,\" recent Claude models follow that instruction more faithfully than older ones did. They may investigate just as deeply, find the same bugs, and then, by your own rule, not report the ones below your bar. If your review volume drops suddenly after a model upgrade, loosen the filter before assuming a regression.",
    },
    {
      id: "review-template",
      title: "The review prompt template",
      readTimeMinutes: 3,
      content:
        "```\nYou are reviewing a PR as a staff engineer on the team.\n\nCONTEXT\n- Repo: <what the project does, one line>\n- Conventions: <link CLAUDE.md or paste summary>\n- Author's stated goal of this PR: <paste their description>\n\nDIFF\n<paste the diff>\n\nTASK\nReview the diff. For each issue, emit:\n- severity (blocker | nit | question)\n- file:line\n- what you'd change and why, in one sentence\n\nFocus on:\n1. Does the code do what the description claims?\n2. Correctness, especially edge cases and error paths.\n3. Tests: are they exercising the change or just present?\n4. Consistency with existing conventions in the repo.\n\nDo NOT:\n- Rewrite the code.\n- Comment on style unless it breaks a convention.\n- Pad the review with praise.\n```",
    },
    {
      id: "when-it-earns-its-keep",
      title: "Three times it earns its keep",
      readTimeMinutes: 2,
      content:
        "- **Before you push.** Paste your own diff, ask for a staff-level review. Catches things you'll be embarrassed by later.\n- **On a big diff.** Before reading 2,000 lines yourself, ask Claude for a call-graph summary and a list of behavioral changes.\n- **Across the repo.** \"Are there other callers of this function I missed?\", paste the call sites, let Claude reason about ripple.",
    },
  ],
  widgets: [
    {
      kind: "prompt-sandbox",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "reviews",
        cpId: "review",
        title: "Review a diff",
        hint: "Paste a small diff. Ask for a staff-level review using the template above.",
        placeholder: "You are reviewing a PR as a staff engineer…\n\nDIFF:\n<paste diff>",
      },
    },
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "reviews",
        cpId: "q1",
        question:
          "Your review prompt produces 40 style nits and misses a real correctness bug. What's the fix?",
        options: [
          "Use a larger model.",
          "Tell Claude explicitly to ignore style and focus on correctness and behavior changes.",
          "Shorten the diff randomly.",
          "Ask twice in different wording.",
        ],
        correct: 1,
        explanation:
          "Prompts control focus. Tell the reviewer what to prioritize and what to ignore.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
