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

/** Workshop 05 ships an English and a German kit; both hold the same English case files. */
const AUDIT_KIT = "vardar-audit-kit";
const AUDIT_KIT_DE = "vardar-audit-kit-de";

const AUDIT_KIT_EN: TakeHomeKit = {
  href: `/workshops/audit-vorbereitung-mit-ki/${AUDIT_KIT}.zip`,
  shown: [
    `${AUDIT_KIT}/folder/backup-report_2026-10.txt`,
    `${AUDIT_KIT}/folder/training-records_2026.csv`,
    `${AUDIT_KIT}/folder/infosec-policy_v4_DRAFT.md`,
    `${AUDIT_KIT}/project-instructions.md`,
  ],
  instructions: `${AUDIT_KIT}/project-instructions.md`,
  installDoc: `${AUDIT_KIT}/START-HERE.md`,
};

const AUDIT_KIT_DE_EDITION: TakeHomeKit = {
  href: `/workshops/audit-vorbereitung-mit-ki/${AUDIT_KIT_DE}.zip`,
  shown: [
    `${AUDIT_KIT_DE}/ordner/backup-report_2026-10.txt`,
    `${AUDIT_KIT_DE}/ordner/training-records_2026.csv`,
    `${AUDIT_KIT_DE}/ordner/infosec-policy_v4_DRAFT.md`,
    `${AUDIT_KIT_DE}/projektanweisungen.md`,
  ],
  instructions: `${AUDIT_KIT_DE}/projektanweisungen.md`,
  installDoc: `${AUDIT_KIT_DE}/START-HIER.md`,
};

/** Workshop 06 ships one German kit; the English page hands out the same zip. */
const OFFERS = "angebote-vergleichen-kit";
const OFFERS_KIT: TakeHomeKit = {
  href: `/workshops/angebote-mit-ki-vergleichen/${OFFERS}.zip`,
  shown: [
    `${OFFERS}/kostenzeilen.csv`,
    `${OFFERS}/ANSWERS.md`,
    `${OFFERS}/karten/feldkarte.md`,
    `${OFFERS}/fall/angebot-c-brno.md`,
    `${OFFERS}/fall/zweiter-fall.csv`,
    `${OFFERS}/vorlagen/vergleichsbasis.md`,
  ],
  instructions: `${OFFERS}/take-home/projekt-anweisungen.md`,
  installDoc: `${OFFERS}/take-home/INSTALL.md`,
};

export const DEMO_TAKEHOME: Readonly<Partial<Record<DemoSlug, TakeHome>>> = {
  // Workshop 01 "Die Fehlerliste": built by scripts/workshop01/build-kit.mjs.
  "ki-prognosen-einschaetzen": {
    kit: {
      de: {
        href: "/workshops/ki-prognosen-einschaetzen/prognose-pruefen-kit.zip",
        shown: [
          "prognose-pruefen-kit/daten/linsensuppe-woechentlich.csv",
          "prognose-pruefen-kit/daten/tool-export.txt",
          "prognose-pruefen-kit/daten/kosten.md",
          "prognose-pruefen-kit/pruefregel.md",
          "prognose-pruefen-kit/uebung.md",
        ],
        instructions: "prognose-pruefen-kit/claude/projekt-anweisung.md",
        installDoc: "prognose-pruefen-kit/START-HIER.md",
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
  "geschaeftsberichte-mit-ki-lesen": {
    kit: {
      de: {
        href: "/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit-de.zip",
        shown: [
          "northwind-analyst-kit/reports/2023-09-monthly-report.md",
          "northwind-analyst-kit/data/ncr_records.csv",
          "northwind-analyst-kit/metric-cards.md",
          "northwind-analyst-kit/data/demand_actuals.csv",
          "northwind-analyst-kit/data/product_lines.csv",
          "northwind-analyst-kit/dashboard/index.html",
          "northwind-analyst-kit/.claude/skills/northwind-metrics/SKILL.md",
          "northwind-analyst-kit/claude/kennzahlen-steckbrief/SKILL.md",
        ],
        instructions: "northwind-analyst-kit/project-instructions.md",
        installDoc: "northwind-analyst-kit/START-HERE.md",
      },
      en: {
        href: "/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit.zip",
        shown: [
          "northwind-analyst-kit/reports/2023-09-monthly-report.md",
          "northwind-analyst-kit/data/ncr_records.csv",
          "northwind-analyst-kit/metric-cards.md",
          "northwind-analyst-kit/data/demand_actuals.csv",
          "northwind-analyst-kit/data/product_lines.csv",
          "northwind-analyst-kit/dashboard/index.html",
          "northwind-analyst-kit/.claude/skills/northwind-metrics/SKILL.md",
          "northwind-analyst-kit/claude/kennzahlen-steckbrief/SKILL.md",
        ],
        instructions: "northwind-analyst-kit/project-instructions.md",
        installDoc: "northwind-analyst-kit/START-HERE.md",
      },
    },
    skill: { name: "kennzahlen-steckbrief" },
    templates: [{ vorlage: "kennzahlen-steckbrief-vorlage" }],
  },
  "datenbereitschaft-fuer-ki": {
    kit: {
      de: {
        href: "/workshops/datenbereitschaft-fuer-ki/data-readiness-kit.zip",
        // The files the stage moved, beat by beat (BEATS kitFile), then the card.
        shown: [
          "data-readiness-kit/builder/claude-demo/A-export-tables/monthly_revenue.csv",
          "data-readiness-kit/builder/claude/project/mrr_summary_monthly.csv",
          "data-readiness-kit/builder/claude-demo/A-export-tables/customer_master.csv",
          "data-readiness-kit/builder/claude/project/PROJECT-INSTRUCTIONS.txt",
          "data-readiness-kit/builder/claude-demo/CHECK-YOUR-RESULT.md",
          "data-readiness-kit/FRAGEKARTE.md",
        ],
        instructions: "data-readiness-kit/claude/PROJEKT-ANWEISUNG-VORLAGE.txt",
        installDoc: "data-readiness-kit/claude/README.md",
      },
      en: {
        href: "/workshops/datenbereitschaft-fuer-ki/data-readiness-kit.zip",
        shown: [
          "data-readiness-kit/builder/claude-demo/A-export-tables/monthly_revenue.csv",
          "data-readiness-kit/builder/claude/project/mrr_summary_monthly.csv",
          "data-readiness-kit/builder/claude-demo/A-export-tables/customer_master.csv",
          "data-readiness-kit/builder/claude/project/PROJECT-INSTRUCTIONS.txt",
          "data-readiness-kit/builder/claude-demo/CHECK-YOUR-RESULT.md",
          "data-readiness-kit/QUESTION-CARD.md",
        ],
        instructions: "data-readiness-kit/claude/PROJECT-INSTRUCTIONS-TEMPLATE.txt",
        installDoc: "data-readiness-kit/claude/README.md",
      },
    },
    skill: { name: "kennzahl-fragekarte" },
    templates: [{ vorlage: "fragekarte" }],
  },
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
  "audit-vorbereitung-mit-ki": {
    kit: { de: AUDIT_KIT_DE_EDITION, en: AUDIT_KIT_EN },
    skill: { name: "audit-nachweise" },
    templates: [{ vorlage: "luecken-anfrage" }],
  },
  // Workshop 06 "Die Vergleichsbasis": built by scripts/workshop06/build-kit.mjs from the rotfaden example.
  // One German kit for both locales: the case is German paperwork.
  "angebote-mit-ki-vergleichen": {
    kit: { de: OFFERS_KIT, en: OFFERS_KIT },
    skill: { name: "angebote-vergleichen" },
    templates: [{ vorlage: "vergleichsbasis" }, { vorlage: "verhandlungsmail" }],
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
