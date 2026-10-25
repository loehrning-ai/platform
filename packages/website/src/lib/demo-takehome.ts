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
  "esg-berichte-mit-ki": {
    kit: {
      de: {
        href: "/workshops/esg-berichte-mit-ki/crvena-zemja-nachweisprobe.zip",
        shown: [
          "crvena-zemja-nachweisprobe/nachweisprobe.md",
          "crvena-zemja-nachweisprobe/ordner/bio_zertifikat_weinberg.txt",
          "crvena-zemja-nachweisprobe/ordner/strom_2025.csv",
          "crvena-zemja-nachweisprobe/loesungen/LOESUNGEN.md",
        ],
        instructions: "crvena-zemja-nachweisprobe/mitnehmen/projektanweisungen-vorlage.md",
        installDoc: "crvena-zemja-nachweisprobe/START-HIER.md",
      },
      en: {
        href: "/workshops/esg-berichte-mit-ki/crvena-zemja-esg-kit.zip",
        shown: [
          "crvena-zemja-esg-kit/evidence-check.md",
          "crvena-zemja-esg-kit/files/organic_certificate_vineyard.txt",
          "crvena-zemja-esg-kit/files/electricity_2025.csv",
          "crvena-zemja-esg-kit/answers/ANSWERS.md",
        ],
        instructions: "crvena-zemja-esg-kit/take-home/project-instructions-template.md",
        installDoc: "crvena-zemja-esg-kit/START-HERE.md",
      },
    },
    skill: { name: "esg-nachweise" },
    templates: [
      { vorlage: "esg-nachweisprobe" },
      { vorlage: "esg-projektanweisungen" },
      { vorlage: "esg-ordner-checkliste" },
      { vorlage: "esg-mail-fehlendes-dokument" },
      { vorlage: "esg-nachweisregister" },
    ],
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
