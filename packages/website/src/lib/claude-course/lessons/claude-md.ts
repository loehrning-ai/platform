// Ported from claude/lessons/04-claude-md.html.
// Widget manifest: ClaudeMdBuilder x1 (builder), Quiz x2 (q1, q2),
// SocraticTutor x1 (tutor). Wired incrementally.
import type { ClaudeLesson } from "../types";
import { CLAUDE_QUIZ_COPY, CLAUDE_QUIZ_TITLE } from "../widget-copy";

const lesson: ClaudeLesson = {
  id: "claude-md",
  number: 4,
  title: "The CLAUDE.md File",
  subtitle: "Persistent instructions that travel with your project.",
  durationMinutes: 9,
  trackId: "workflows",
  hook: "Project instructions in a file the team reviews like code.",
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
        "A new session knows nothing about your repo. `CLAUDE.md` is the plain Markdown file Claude Code reads to fix that. A project file lives at `./CLAUDE.md` or `./.claude/CLAUDE.md`; user, managed, local, and nested files have different scopes.\n\nClaude Code loads applicable instructions into the conversation context. They steer model behavior. They enforce nothing. Use permissions, hooks, sandboxing, and CI for the controls that must hold.\n\n> Keep shared project guidance specific, reviewable, and version-controlled.",
    },
    {
      id: "hierarchy",
      title: "How the hierarchy actually loads",
      readTimeMinutes: 2,
      content:
        "Claude Code discovers instruction files by scope and directory. Here is a simplified project view.\n\n```\n~/.claude/CLAUDE.md              # User instructions across projects\n<repo>/CLAUDE.md                 # Team-shared project instructions\n<repo>/.claude/CLAUDE.md         # Alternative project location\n<repo>/CLAUDE.local.md           # Personal project instructions; gitignore\n\n# Discovered on demand when files in these folders are read:\n<repo>/frontend/CLAUDE.md\n<repo>/services/auth/CLAUDE.md\n```\n\nApplicable files combine in context. The more local file is read later, but do not lean on precedence; remove contradictions instead of stacking them. Use `/memory` to see which files loaded. For path-specific rules, prefer `.claude/rules/` with `paths` frontmatter.",
    },
    {
      id: "keep-in-leave-out",
      title: "What goes in it",
      readTimeMinutes: 2,
      content:
        '**Include:**\n\n- A one-sentence project description\n- Stack and supported versions\n- Commands for build, test, and lint\n- Verifiable coding conventions\n- Important paths and project terminology\n- Links to maintained architecture or deployment documentation\n\n**Exclude:**\n\n- Secrets, tokens, credentials, and personal data\n- Vague instructions such as "write good code"\n- Stale history that does not affect current work\n- Long procedures that belong in a skill or maintained document\n\nCLAUDE.md spends context, and a long file gets followed less. Anthropic\'s current guidance recommends concise, structured instructions and suggests targeting fewer than 200 lines per file. Imports tidy the layout and still enter context at launch. Use permission rules, not prose, to block access to sensitive paths.',
    },
    {
      id: "template",
      title: "A practical template",
      readTimeMinutes: 1,
      content:
        '```\n# <Project name>\n\n## What this is\nOne or two sentences. Who uses it, what it does. Link to the README for more.\n\n## Stack\n- Language / framework / versions\n- Build + test tools\n- Notable libs Claude should know about\n\n## Conventions\n- File layout rules (e.g. "colocate tests as `*.test.ts`")\n- Style rules the team enforces\n- Naming conventions\n- Error-handling pattern\n\n## Commands\n- `yarn build`: production build\n- `yarn test`: unit tests (run before committing)\n- `yarn test:e2e`: e2e suite (slow, only on CI)\n- `arc lint`: linter + formatter\n\n## Don\'t\n- Add new npm deps without asking\n- Use `any` in TypeScript\n- Edit files in `generated/`\n- Ship code without a matching test\n\n## Terminology\n- "Workspace" (not "project"): our product uses this term consistently\n- "Member" (not "user") in customer-facing copy\n\n## Where things live\n- Source: `src/`\n- Tests: colocated (`*.test.ts`)\n- Architecture notes: `@docs/architecture.md`\n- Deployment: `@docs/deploy.md`\n```',
    },
    {
      id: "auto-memory",
      title: "Auto memory and project instructions",
      readTimeMinutes: 2,
      content:
        "Claude Code versions that support auto memory can write project-specific notes to local Markdown files. Auto memory is configurable, does not write in every session, and deserves inspection rather than blind trust.\n\nOwnership differs.\n\n- **CLAUDE.md:** instructions maintained by people, suitable for shared and reviewed project rules.\n- **Auto memory:** machine-local notes selected during use, shared across worktrees of the same repository on that machine.\n\nUse `/memory` to inspect, edit, disable, or delete stored notes. Keep secrets out of both.",
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
          "A short, specific list of conventions, commands, and anti-patterns the team enforces.",
          "A changelog of what your team shipped last quarter.",
        ],
        correct: 2,
        explanation:
          "Claude Code loads applicable CLAUDE.md instructions into the conversation context. Keep them short and specific, keep secrets out, and use technical controls wherever policy has to hold.",
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
          "In a monorepo with CLAUDE.md files in frontend/ and services/auth/, when do those sub-folder files get loaded?",
        options: [
          "At session start, regardless of the files being read.",
          "Only when Claude reads files inside that sub-folder, they're lazy-loaded.",
          "They are ignored because only the root CLAUDE.md loads.",
          "Randomly, based on file size.",
        ],
        correct: 1,
        explanation:
          "Descendant CLAUDE.md files are discovered when Claude Code reads files in that directory. Use `/memory` to confirm actual loading.",
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
