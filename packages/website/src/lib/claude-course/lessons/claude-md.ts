// Ported from claude/lessons/04-claude-md.html.
// Widget manifest: ClaudeMdBuilder x1 (builder), Quiz x2 (q1, q2),
// SocraticTutor x1 (tutor). Wired incrementally (plan 008 stage 6).
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "claude-md",
  number: 4,
  title: "The CLAUDE.md File",
  subtitle: "Persistent instructions that travel with your project.",
  durationMinutes: 9,
  trackId: "workflows",
  hook: "Write it once. Never re-explain your stack again.",
  keyConcepts: [
    "CLAUDE.md hierarchy",
    "Lazy-loaded sub-folder files",
    "Auto memory",
    "Standing brief",
  ],
  quiz: [],
  sections: [
    {
      id: "what-it-is",
      title: "What it is",
      readTimeMinutes: 2,
      content:
        "A `CLAUDE.md` is a plain markdown file at the root of your project. Claude Code reads it automatically at the start of every session and injects it into context before it sees your first message. Think of it as a standing brief, the stuff you'd otherwise retype into every prompt.\n\nAnthropic's own engineering team treats CLAUDE.md as the single most impactful lever for improving Claude's output in a repo. The reason is simple: if Claude is a brilliant new hire, CLAUDE.md is the onboarding doc they re-read every morning.\n\n> Stop teaching Claude your project once per conversation. Teach it once, in a file, forever.",
    },
    {
      id: "hierarchy",
      title: "How the hierarchy actually loads",
      readTimeMinutes: 2,
      content:
        "CLAUDE.md files cascade. Understanding the cascade saves you hours of confusion.\n\n```\n# Loaded into every session, in this order:\n~/.claude/CLAUDE.md              # Your global preferences\n<repo>/CLAUDE.md                 # Team-shared project rules (commit this)\n<repo>/CLAUDE.local.md           # Your personal overrides (gitignore this)\n\n# Loaded lazily, only when Claude touches files in that folder:\n<repo>/frontend/CLAUDE.md\n<repo>/services/auth/CLAUDE.md\n```\n\nRules combine, they don't replace. All levels apply at once; more-specific levels win on conflicts. Descendant CLAUDE.md files are lazy-loaded, Claude only pulls them into context when it actually reads files in that directory. This is a big deal in monorepos: you can document each service's conventions next to its code without paying the token cost on every session.",
    },
    {
      id: "keep-in-leave-out",
      title: "What goes in it",
      readTimeMinutes: 2,
      content:
        "**Keep in:**\n\n- What the project is, in one sentence\n- Stack, tooling, notable libs\n- Coding conventions the team enforces\n- Commands (`build`, `test`, `lint`)\n- Things never to do (anti-patterns)\n- Where the important docs live (`docs/architecture.md`, etc.)\n- Terminology that has project-specific meaning\n\n**Leave out:**\n\n- Secrets, tokens, keys, ever\n- Full files, link or reference with `@path/to/file.md`\n- Historical context nobody needs\n- Vibes (\"write good code\"). Be specific or delete.\n- Ad-hoc knowledge that belongs in `docs/` and gets pulled in on demand\n\n> **The size rule.** Every byte of CLAUDE.md burns tokens on every session. Keep it lean. If something is only needed sometimes, put it in `docs/` and reference it (`@docs/architecture.md`) when relevant.",
    },
    {
      id: "template",
      title: "A battle-tested template",
      readTimeMinutes: 1,
      content:
        "```\n# <Project name>\n\n## What this is\nOne or two sentences. Who uses it, what it does. Link to the README for more.\n\n## Stack\n- Language / framework / versions\n- Build + test tools\n- Notable libs Claude should know about\n\n## Conventions\n- File layout rules (e.g. \"colocate tests as `*.test.ts`\")\n- Style rules the team enforces\n- Naming conventions\n- Error-handling pattern\n\n## Commands\n- `yarn build`: production build\n- `yarn test`: unit tests (run before committing)\n- `yarn test:e2e`: e2e suite (slow, only on CI)\n- `arc lint`: linter + formatter\n\n## Don't\n- Add new npm deps without asking\n- Use `any` in TypeScript\n- Edit files in `generated/`\n- Ship code without a matching test\n\n## Terminology\n- \"Workspace\" (not \"project\"): our product uses this term consistently\n- \"Member\" (not \"user\") in customer-facing copy\n\n## Where things live\n- Source: `src/`\n- Tests: colocated (`*.test.ts`)\n- Architecture notes: `@docs/architecture.md`\n- Deployment: `@docs/deploy.md`\n```",
    },
    {
      id: "auto-memory",
      title: "Auto memory: the new half of the system",
      readTimeMinutes: 2,
      content:
        "Recent Claude Code versions add auto memory, Claude writes its own notes to a separate memory file as it learns your preferences, without you typing anything. Correct it once (\"we prefix debug logs with `[DEBUG]`\"), and it'll remember next session.\n\nTwo things carry knowledge across sessions now:\n\n- **CLAUDE.md**: instructions you write, to steer behavior deliberately.\n- **Auto memory**: notes Claude writes, accumulating from your corrections.\n\nUse CLAUDE.md for things you want a team to share and version-control. Let auto memory pick up personal habits. Don't try to hand-maintain both.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "claude-md",
        cpId: "q1",
        question: "Which belongs in your root CLAUDE.md?",
        options: [
          "A list of API keys so Claude can help you test.",
          "A paste of your whole monorepo for reference.",
          "A short, specific list of conventions, commands, and anti-patterns the team enforces.",
          "A changelog of what your team shipped last quarter.",
        ],
        correct: 2,
        explanation:
          "CLAUDE.md is standing context. Keep it crisp and specific, conventions, commands, anti-patterns. Never secrets.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "quiz",
      placement: "before-quiz",
      courseSlug: "claude",
      props: {
        lessonId: "claude-md",
        cpId: "q2",
        question:
          "In a monorepo with CLAUDE.md files in frontend/ and services/auth/, when do those sub-folder files get loaded?",
        options: [
          "At every session start, always.",
          "Only when Claude reads files inside that sub-folder, they're lazy-loaded.",
          "Never, only the root CLAUDE.md loads.",
          "Randomly, based on file size.",
        ],
        correct: 1,
        explanation:
          "Descendant CLAUDE.md files are lazy-loaded only when Claude touches files in that directory. This is how you scale CLAUDE.md across a big repo without blowing your context budget.",
        copy: CLAUDE_QUIZ_COPY,
      },
    },
  ],
};

export default lesson;
