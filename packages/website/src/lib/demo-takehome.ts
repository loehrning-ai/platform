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

export const DEMO_TAKEHOME: Readonly<Partial<Record<DemoSlug, TakeHome>>> = {
  // Workshop 01 "Die Fehlerliste": built by scripts/workshop01/build-kit.mjs.
  "ki-prognosen-einschaetzen": {
    kit: {
      de: {
        href: "/workshops/ki-prognosen-einschaetzen/prognose-pruefen.zip",
        shown: [
          "prognose-pruefen/daten/linsensuppe-woechentlich.csv",
          "prognose-pruefen/daten/tool-export.txt",
          "prognose-pruefen/daten/kosten.md",
          "prognose-pruefen/pruefregel.md",
          "prognose-pruefen/uebung.md",
        ],
        instructions: "prognose-pruefen/claude/projekt-anweisung.md",
        installDoc: "prognose-pruefen/START-HIER.md",
      },
      en: {
        href: "/workshops/ki-prognosen-einschaetzen/forecast-check.zip",
        shown: [
          "forecast-check/data/lentil-soup-weekly.csv",
          "forecast-check/data/tool-export.txt",
          "forecast-check/data/costs.md",
          "forecast-check/release-rule.md",
          "forecast-check/exercise.md",
        ],
        instructions: "forecast-check/claude/project-instructions.md",
        installDoc: "forecast-check/START-HERE.md",
      },
    },
    skill: { name: "prognose-pruefen" },
    templates: [{ vorlage: "pruefregel" }],
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
