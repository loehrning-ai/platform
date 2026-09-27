// Ported from claude/lessons/04-claude-md.html.
// Widget manifest: ClaudeMdBuilder x1 (builder), Quiz x2 (q1, q2),
// SocraticTutor x1 (tutor). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "claude-md",
  number: 4,
  title: "The CLAUDE.md file",
  subtitle: "Persistent instructions that travel with your project.",
  durationMinutes: 9,
  trackId: "workflows",
  hook: "Rules you keep explaining belong in a file.",
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
      readTimeMinutes: 1,
      content:
        "`CLAUDE.md` is a Markdown instruction file that Claude Code loads so a session knows your repo. The project file lives at `./CLAUDE.md` or `./.claude/CLAUDE.md`; user, managed, local and nested files have their own scopes.\n\nThe instructions enter the conversation context. They steer behavior and enforce nothing, so controls that must hold belong in permissions, hooks, sandboxing and CI.",
    },
    {
      id: "hierarchy",
      title: "How the hierarchy loads",
      readTimeMinutes: 2,
      content:
        "Claude Code finds instruction files by scope and directory. A simplified project view:\n\n```\n~/.claude/CLAUDE.md              # User instructions across projects\n<repo>/CLAUDE.md                 # Team-shared project instructions\n<repo>/.claude/CLAUDE.md         # Alternative project location\n<repo>/CLAUDE.local.md           # Personal project instructions; gitignore\n\n# Discovered on demand when files in these folders are read:\n<repo>/frontend/CLAUDE.md\n<repo>/services/auth/CLAUDE.md\n```\n\nApplicable files combine in context, the more local ones later. No reliable precedence rule exists, so remove contradictions. `/memory` shows what loaded; path-specific rules go in `.claude/rules/` with `paths` frontmatter.",
    },
    {
      id: "keep-in-leave-out",
      title: "What goes in it",
      readTimeMinutes: 1,
      content:
        "**Include:**\n\n- A one-sentence project description\n- Stack and supported versions\n- Build, test and lint commands\n- Verifiable conventions\n- Important paths and project terms\n- Links to maintained architecture or deployment docs\n\n**Exclude:**\n\n- Secrets, tokens, credentials and personal data\n- Vague instructions such as \"write good code\"\n- Stale history\n- Long procedures that belong in a skill or maintained document\n- Path blocks (block sensitive paths with permission rules)\n\nEvery line spends context, and a long file gets followed less. Anthropic recommends concise, structured instructions and suggests fewer than 200 lines per file. Imports tidy the layout but still load at launch.",
    },
    {
      id: "template",
      title: "A practical template",
      readTimeMinutes: 2,
      content:
        "```\n# <Project name>\n\n## What this is\nOne or two sentences: who uses it, what it does. Link to the README.\n\n## Stack\n- Language, framework, versions\n- Build and test tools\n\n## Conventions\n- Colocate tests as `*.test.ts`\n- Style and naming rules the team enforces\n\n## Commands\n- `yarn build`: production build\n- `yarn test`: unit tests (run before committing)\n- `yarn test:e2e`: e2e suite (slow, CI only)\n- `arc lint`: linter and formatter\n\n## Don't\n- Add npm deps without asking\n- Use `any` in TypeScript\n- Edit files in `generated/`\n\n## Terminology\n- \"Workspace\", not \"project\"\n- \"Member\", not \"user\", in customer-facing copy\n\n## Where things live\n- Architecture notes: `@docs/architecture.md`\n- Deployment: `@docs/deploy.md`\n```",
    },
    {
      id: "auto-memory",
      title: "Auto memory and project instructions",
      readTimeMinutes: 1,
      content:
        "Claude Code versions with auto memory can write project notes to local Markdown files. Auto memory is configurable, does not write in every session and needs inspection before you trust it.\n\n- **CLAUDE.md:** maintained by people, for shared, reviewed project rules.\n- **Auto memory:** machine-local notes picked during use, shared across worktrees of the same repository on that machine.\n\n`/memory` inspects, edits, disables or deletes stored notes. Keep secrets out of both.",
    },
  ],
  widgets: [
    {
      kind: "claude-md-builder",
      placement: "after-intro",
      courseSlug: "claude",
      props: {
        lessonId: "claude-md",
        cpId: "built",
      },
    },
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
          "Short conventions, commands and anti-patterns the team enforces.",
          "A changelog of what your team shipped last quarter.",
        ],
        correct: 2,
        explanation:
          "CLAUDE.md instructions enter the conversation context, so keep them short and specific. Keep secrets out and use technical controls wherever policy has to hold.",
        title: CLAUDE_QUIZ_TITLE,
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
          "When do CLAUDE.md files in frontend/ and services/auth/ of a monorepo load?",
        options: [
          "At session start, regardless of the files being read.",
          "When Claude reads files in that sub-folder.",
          "They are ignored because only the root CLAUDE.md loads.",
          "Randomly, based on file size.",
        ],
        correct: 1,
        explanation:
          "Nested CLAUDE.md files are discovered when Claude Code reads files in that directory. `/memory` confirms what actually loaded.",
        title: CLAUDE_QUIZ_TITLE,
        copy: CLAUDE_QUIZ_COPY,
      },
    },
    {
      kind: "socratic-tutor",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "claude-md",
        cpId: "tutor",
        topic: "using CLAUDE.md effectively in a team",
        persona:
          "Push the learner to think about staleness, review cadence, what belongs at root vs. sub-folder, and where CLAUDE.md ends and docs/ begins.",
      },
    },
  ],
};

export default lesson;
