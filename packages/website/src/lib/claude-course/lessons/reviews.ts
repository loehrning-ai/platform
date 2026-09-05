// Ported from claude/lessons/08-reviews.html.
// Widget manifest: PromptSandbox x1 (sb), Quiz x1 (q1), RewriteArena x1
// (arena). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "reviews",
  number: 8,
  title: "Claude for Code Review and PRs",
  subtitle: "A structured review pass that still requires human verification.",
  durationMinutes: 9,
  trackId: "advanced",
  hook: "Define the change intent, repository rules, and evidence required for a finding.",
  keyConcepts: ["Review prompt template", "Severity tagging", "Focus filters"],
  quiz: [],
  sections: [
    {
      id: "why-it-works",
      title: "Why it works",
      readTimeMinutes: 2,
      content:
        "What can a human reviewer see that a pasted diff cannot? Everything around it. A model analyzes the supplied diff for candidate defects, convention violations, and missing tests. It cannot inspect files, callers, runtime behavior, or repository rules it never received.\n\nGive the author's stated goal, surrounding code, project conventions, and a severity definition. Require every finding to cite file and line, explain the failure path, and separate evidence from guesswork.\n\nModel behavior shifts across versions. Keep a review eval set and rerun it when model, prompt, or tool access changes.",
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
        "- **Before review.** Run a focused pass over your diff, verify each finding, run the checks.\n- **For a large change.** Generate a candidate map of changed behavior and affected call paths; compare it with code search and tests.\n- **Across the repository.** Enumerate callers with repository tools first, then analyze the concrete results for compatibility risks.",
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
        placeholder:
          "You are reviewing a PR as a staff engineer…\n\nDIFF:\n<paste diff>",
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
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "rewrite-arena",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "reviews",
        cpId: "arena",
        task: "Write a review prompt for a PR that claims to be a refactor.",
        original: "review this PR and tell me if its good",
        criteria:
          "names reviewer role, sets focus, excludes style, asks for severity tagging, prevents praise padding",
      },
    },
  ],
};

export default lesson;
