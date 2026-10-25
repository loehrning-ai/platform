/**
 * What each v3 demo hands the visitor in its "Für deinen Claude" block: the
 * kit zip, the one bilingual skill, the project instructions and the
 * templates. Keyed by demo slug; a builder adds or changes only the entry of
 * their own workshop. A demo without an entry renders no block.
 *
 * Nothing here repeats a file's content. The block reads sizes from the zip
 * on disk and the project instructions from inside the zip at build time, so
 * the page cannot drift from the download. Tests: demo-takehome.test.ts.
 */

import type { DemoSlug } from "@/lib/demos";

/** One kit edition (a workshop may ship a German and an English zip). */
export interface TakeHomeKit {
  /** Public path of the zip, "/workshops/<slug>/<kit>.zip". */
  readonly href: string;
  /** Paths inside the zip the stage shows as file chips; each must exist in the zip. */
  readonly shown: readonly string[];
  /** Path inside the zip of the project instructions; the block shows this file verbatim. */
  readonly instructions: string;
  /** Path inside the zip of the file that embeds claudeUiMarkdown(locale, skill) verbatim. */
  readonly installDoc: string;
}

export interface TakeHome {
  /** The kit per locale; both may point at the same edition. */
  readonly kit: Readonly<Record<"de" | "en", TakeHomeKit>>;
  /** content/skills/<name>/SKILL.md, served as /skills/<name>.zip. One bilingual skill per workshop. */
  readonly skill: { readonly name: string };
  /** Slugs in the VORLAGEN registry with kind "template". */
  readonly templates: readonly { readonly vorlage: string }[];
}

const AUDIT_KIT_EDITION: TakeHomeKit = {
    href: "/workshops/audit-vorbereitung-mit-ki/vardar-audit-kit.zip",
    shown: ["vardar-audit-kit/request_tannwald.md", "vardar-audit-kit/project-instructions.md", "vardar-audit-kit/templates/gap-request.md"],
    instructions: "vardar-audit-kit/project-instructions.md",
    installDoc: "vardar-audit-kit/START-HERE.md",
  };

export const DEMO_TAKEHOME: Readonly<Partial<Record<DemoSlug, TakeHome>>> = {
  "audit-vorbereitung-mit-ki": {
    kit: { de: AUDIT_KIT_EDITION, en: AUDIT_KIT_EDITION },
    skill: { name: "audit-nachweise" },
    templates: [{ vorlage: "luecken-anfrage" }],
  },
};

export function takeHomeFor(slug: DemoSlug): TakeHome | undefined {
  return DEMO_TAKEHOME[slug];
}

/** The chips a hub tile shows, in the take-home block's order and words. */
export type TakeHomeArtifact = "kit" | "skill" | "vorlage";

export function takeHomeArtifacts(slug: DemoSlug): readonly TakeHomeArtifact[] {
  const entry = DEMO_TAKEHOME[slug];
  if (!entry) return [];
  return [
    "kit",
    "skill",
    ...(entry.templates.length > 0 ? (["vorlage"] as const) : []),
  ];
}
