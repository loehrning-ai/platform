import { describe, expect, it } from "vitest";
import { DATA_INFRASTRUCTURE_CONFIG } from "@/lib/data-infrastructure/config";
import {
  TECHNICAL_COURSE_CANONICAL_IDS,
  createLocalizedTechnicalCourseConfig,
} from "./routes";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  technicalCourseConfigForBundle,
  type TechnicalCourseContentIdentity,
} from "./localization";

const canonicalIds = TECHNICAL_COURSE_CANONICAL_IDS["data-infrastructure"];
const enConfig = technicalCourseConfigForBundle("data-infrastructure", "en", DATA_INFRASTRUCTURE_CONFIG);
const deConfig = createLocalizedTechnicalCourseConfig(enConfig, "de", {
  title: "Infrastruktur-Kurs",
  certificateTitle: "Teilnahmebestätigung: Infrastruktur-Kurs",
  certificateSubtitle: "Lokal erstellt und nicht akkreditiert.",
  certificateModules: [
    "Grundlagen",
    "Aufgaben beschreiben",
    "Ergebnisse prüfen",
    "Arbeitsabläufe skalieren",
  ],
  certificateReferenceLabel: "Persönliche Teilnahmebestätigung: Infrastruktur",
  quizPassMessage: "Der Infrastruktur-Kurs ist abgeschlossen.",
  certificateFileStem: "Infrastruktur-Kurs",
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
});

function identity(
  checkpointKeys: readonly string[] = ["mental-model::task-contract"],
): TechnicalCourseContentIdentity<"data-infrastructure"> {
  return defineTechnicalCourseContentIdentity("data-infrastructure", {
    unitIds: canonicalIds.unitIds,
    contentItemIds: canonicalIds.contentItemIds,
    progressKeys: canonicalIds.progressKeys,
    sectionIdsByProgressKey: Object.fromEntries(
      canonicalIds.progressKeys.map((progressKey) => [
        progressKey,
        [`${progressKey}-section-1`],
      ]),
    ),
    workshopQuestions: [],
    checkpointKeys,
  });
}

type TestContent = { readonly marker: string };

function englishBundle(
  bundleIdentity: TechnicalCourseContentIdentity<"data-infrastructure"> = identity(),
) {
  return defineTechnicalCourseLocaleBundle<"data-infrastructure", "en", TestContent>({
    courseSlug: "data-infrastructure",
    locale: "en",
    config: enConfig,
    identity: bundleIdentity,
    content: { marker: "english" },
  });
}

function germanBundle(
  bundleIdentity: TechnicalCourseContentIdentity<"data-infrastructure"> = identity(),
  config = deConfig,
) {
  return defineTechnicalCourseLocaleBundle<"data-infrastructure", "de", TestContent>({
    courseSlug: "data-infrastructure",
    locale: "de",
    config,
    identity: bundleIdentity,
    content: { marker: "german" },
  });
}

describe("technical course locale bundles", () => {
  it("builds localized visible config without changing structural fields", () => {
    expect(deConfig).toMatchObject({
      slug: "data-infrastructure",
      language: "de",
      basePath: DATA_INFRASTRUCTURE_CONFIG.basePath,
      coursePath: DATA_INFRASTRUCTURE_CONFIG.coursePath,
      workshopQuizQuestionCount: DATA_INFRASTRUCTURE_CONFIG.workshopQuizQuestionCount,
      workshopQuizTimeLimitMinutes: DATA_INFRASTRUCTURE_CONFIG.workshopQuizTimeLimitMinutes,
      workshopQuizPassThreshold: DATA_INFRASTRUCTURE_CONFIG.workshopQuizPassThreshold,
    });
    expect(deConfig.title).toBe("Infrastruktur-Kurs");
  });

  it("resolves only explicitly registered locales", () => {
    const en = englishBundle();
    const registry = createTechnicalCourseLocaleRegistry({
      courseSlug: "data-infrastructure",
      sourceLocale: "en",
      bundles: { en },
    });

    expect(registry.availableLocales).toEqual(["en"]);
    expect(registry.has("de")).toBe(false);
    expect(registry.get("en").content.marker).toBe("english");
    expect(() => registry.get("de")).toThrow(/no audited "de" locale bundle/);
  });

  it("registers a complete bilingual pair only when identity matches", () => {
    const registry = createTechnicalCourseLocaleRegistry({
      courseSlug: "data-infrastructure",
      sourceLocale: "en",
      bundles: { en: englishBundle(), de: germanBundle() },
    });

    expect(registry.availableLocales).toEqual(["de", "en"]);
    expect(registry.get("de").config.title).toBe("Infrastruktur-Kurs");
    expect(registry.get("en").config.title).toBe("Data Infrastructure");
  });

  it("rejects renamed checkpoint, section, question, or option identity", () => {
    expect(() =>
      createTechnicalCourseLocaleRegistry({
        courseSlug: "data-infrastructure",
        sourceLocale: "en",
        bundles: {
          en: englishBundle(),
          de: germanBundle(identity(["mental-model::renamed-checkpoint"])),
        },
      }),
    ).toThrow(/changed machine identity/);
  });

  it("rejects route or assessment drift in a localized config", () => {
    const driftedConfig = {
      ...deConfig,
      workshopQuizPassThreshold: 0.9,
    };
    expect(() =>
      createTechnicalCourseLocaleRegistry({
        courseSlug: "data-infrastructure",
        sourceLocale: "en",
        bundles: {
          en: englishBundle(),
          de: germanBundle(identity(), driftedConfig),
        },
      }),
    ).toThrow(/changed route or assessment identity/);
  });

  it("rejects missing, renamed, or reordered canonical progress keys", () => {
    expect(() =>
      defineTechnicalCourseContentIdentity("data-infrastructure", {
        unitIds: canonicalIds.unitIds,
        contentItemIds: canonicalIds.contentItemIds,
        progressKeys: canonicalIds.progressKeys.slice(1),
        sectionIdsByProgressKey: {},
        workshopQuestions: [],
        checkpointKeys: [],
      }),
    ).toThrow(/changed canonical progress keys/);
  });

  it("requires a canonical source bundle and matching locale labels", () => {
    expect(() =>
      createTechnicalCourseLocaleRegistry({
        courseSlug: "data-infrastructure",
        sourceLocale: "en",
        bundles: { de: germanBundle() },
      }),
    ).toThrow(/no canonical "en" source bundle/);

    expect(() =>
      defineTechnicalCourseLocaleBundle({
        courseSlug: "data-infrastructure",
        locale: "de",
        config: enConfig as never,
        identity: identity(),
        content: { marker: "wrong" },
      }),
    ).toThrow(/config language "en" under "de"/);
  });
});
