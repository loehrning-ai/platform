/**
 * The one place that names Claude's buttons and install paths, in both
 * languages. The "Für deinen Claude" block on every demo, every workshop kit
 * (substituted at build through `claudeUiMarkdown`) and every deck read from
 * here, so the steps never differ between surfaces.
 *
 * Claude's own button labels stay in English, in quotes, also in German copy:
 * the German interface labels are not yet checked on a live account.
 * Sources (read 2026-10-25): support.claude.com 12512180 (upload flow, all
 * plans, code execution, admin policy), 12512198 (limits), 9517075
 * (projects, Free up to five), code.claude.com/docs/en/skills (paths).
 *
 * Import-free on purpose: Node scripts (kit builders) can import this file
 * directly with type stripping.
 */

export type ClaudeUiLocale = "de" | "en";

export interface ClaudeUiCopy {
  /** claude.ai and the desktop app. */
  readonly app: {
    readonly heading: string;
    readonly steps: readonly string[];
    readonly adminNote: string;
  };
  /** Claude Code. `{name}` is replaced by the skill name. */
  readonly code: {
    readonly heading: string;
    readonly allProjectsLabel: string;
    readonly allProjects: string;
    readonly thisRepoLabel: string;
    readonly thisRepo: string;
    readonly result: string;
  };
  /** One line: skills are installed once per place. */
  readonly noSync: string;
  /** Project instructions, on every plan. */
  readonly project: {
    readonly heading: string;
    readonly steps: readonly string[];
    readonly plans: string;
  };
}

export const CLAUDE_UI_DE: ClaudeUiCopy = {
  app: {
    heading: "claude.ai und Desktop-App",
    steps: [
      "Unter „Settings“, „Capabilities“ den Schalter „Code execution and file creation“ einschalten (im neuen Layout „Create and edit files“).",
      "claude.ai/customize/skills öffnen.",
      "„+“, dann „Create skill“, dann „Upload a skill“ und die ZIP-Datei wählen.",
      "Den Skill einschalten.",
    ],
    adminNote: "Auf Team und Enterprise kann dein Admin eigene Skills abschalten.",
  },
  code: {
    heading: "Claude Code",
    allProjectsLabel: "Für alle Projekte:",
    allProjects: "unzip {name}.zip -d ~/.claude/skills/",
    thisRepoLabel: "Nur für dieses Repository:",
    thisRepo: "unzip {name}.zip -d .claude/skills/",
    result: "Danach liegt SKILL.md in skills/{name}/ (global oder im Repository). Tipp /{name} oder frag einfach.",
  },
  noSync:
    "Mit demselben claude.ai-Login lädt Claude Code (ab v2.1.273) deine in claude.ai eingeschalteten Skills selbst; dort nicht ein zweites Mal entpacken. Mit API-Key oder Bedrock: per unzip.",
  project: {
    heading: "Projektanweisungen",
    steps: [
      "claude.ai/projects öffnen, „New Project“ wählen.",
      "Rechts „Set project instructions“ öffnen, den Text einfügen, „Save instructions“.",
      "Die Kit-Dateien über „+“ ins Projektwissen laden.",
    ],
    plans: "Projekte gibt es auf jedem Plan, auf Free bis zu fünf.",
  },
};

export const CLAUDE_UI_EN: ClaudeUiCopy = {
  app: {
    heading: "claude.ai and the desktop app",
    steps: [
      "In “Settings”, “Capabilities”, turn on “Code execution and file creation” (“Create and edit files” in the new layout).",
      "Open claude.ai/customize/skills.",
      "Choose “+”, then “Create skill”, then “Upload a skill”, and pick the zip file.",
      "Turn the skill on.",
    ],
    adminNote: "On Team and Enterprise an admin can turn user skills off.",
  },
  code: {
    heading: "Claude Code",
    allProjectsLabel: "For all projects:",
    allProjects: "unzip {name}.zip -d ~/.claude/skills/",
    thisRepoLabel: "For this repository only:",
    thisRepo: "unzip {name}.zip -d .claude/skills/",
    result: "SKILL.md then sits in skills/{name}/ (global or in the repository). Type /{name} or just ask.",
  },
  noSync:
    "With the same claude.ai login, Claude Code (v2.1.273 or later) loads the skills you turned on in claude.ai by itself; do not unzip them there a second time. With an API key or Bedrock: unzip.",
  project: {
    heading: "Project instructions",
    steps: [
      "Open claude.ai/projects and choose “New Project”.",
      "On the right, open “Set project instructions”, paste the text, choose “Save instructions”.",
      "Add the kit files to the project knowledge with “+”.",
    ],
    plans: "Projects work on every plan, up to five on Free.",
  },
};

export const CLAUDE_UI: Readonly<Record<ClaudeUiLocale, ClaudeUiCopy>> = {
  de: CLAUDE_UI_DE,
  en: CLAUDE_UI_EN,
};

/** Replaces `{name}` with the skill name. */
export function fillSkillName(text: string, name: string): string {
  return text.replaceAll("{name}", name);
}

/**
 * The install steps as Markdown, for kit files. A kit that ships a skill
 * embeds exactly this block; a test asserts it (src/lib/demo-takehome.test.ts).
 */
export function claudeUiMarkdown(locale: ClaudeUiLocale, skillName: string): string {
  const copy = CLAUDE_UI[locale];
  const numbered = (steps: readonly string[]) => steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return [
    `### ${copy.app.heading}`,
    "",
    numbered(copy.app.steps),
    "",
    copy.app.adminNote,
    "",
    `### ${copy.code.heading}`,
    "",
    `${copy.code.allProjectsLabel} \`${fillSkillName(copy.code.allProjects, skillName)}\``,
    "",
    `${copy.code.thisRepoLabel} \`${fillSkillName(copy.code.thisRepo, skillName)}\``,
    "",
    fillSkillName(copy.code.result, skillName),
    "",
    copy.noSync,
    "",
    `### ${copy.project.heading}`,
    "",
    numbered(copy.project.steps),
    "",
    copy.project.plans,
    "",
  ].join("\n");
}
