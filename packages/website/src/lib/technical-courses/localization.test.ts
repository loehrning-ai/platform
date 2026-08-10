import { describe, expect, it } from "vitest";
import { CODEX_CONFIG } from "@/lib/codex/config";
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

const canonicalIds = TECHNICAL_COURSE_CANONICAL_IDS.codex;
const enConfig = technicalCourseConfigForBundle("codex", "en", CODEX_CONFIG);
const deConfig = createLocalizedTechnicalCourseConfig(enConfig, "de", {
  title: "Codex-Kurs",
  certificateTitle: "Teilnahmebestätigung: Codex-Kurs",
  certificateSubtitle: "Lokal erstellt und nicht akkreditiert.",
  certificateModules: [
    "Grundlagen",
    "Aufgaben beschreiben",
    "Ergebnisse prüfen",
    "Arbeitsabläufe skalieren",
  ],
  certificateReferenceLabel: "Persönliche Teilnahmebestätigung: Codex",
  quizPassMessage: "Der Codex-Kurs ist abgeschlossen.",
  certificateFileStem: "Codex-Kurs",
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
});

function identity(
  checkpointKeys: readonly string[] = ["L01::task-contract"],
): TechnicalCourseContentIdentity<"codex"> {
  return defineTechnicalCourseContentIdentity("codex", {
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
  bundleIdentity: TechnicalCourseContentIdentity<"codex"> = identity(),
) {
  return defineTechnicalCourseLocaleBundle<"codex", "en", TestContent>({
    courseSlug: "codex",
    locale: "en",
    config: enConfig,
    identity: bundleIdentity,
    content: { marker: "english" },
  });
}

function germanBundle(
  bundleIdentity: TechnicalCourseContentIdentity<"codex"> = identity(),
  config = deConfig,
) {
  return defineTechnicalCourseLocaleBundle<"codex", "de", TestContent>({
    courseSlug: "codex",
    locale: "de",
    config,
    identity: bundleIdentity,
    content: { marker: "german" },
  });
}

describe("technical course locale bundles", () => {
  it("builds localized visible config without changing structural fields", () => {
    expect(deConfig).toMatchObject({
      slug: "codex",
      language: "de",
      basePath: CODEX_CONFIG.basePath,
      coursePath: CODEX_CONFIG.coursePath,
      workshopQuizQuestionCount: CODEX_CONFIG.workshopQuizQuestionCount,
      workshopQuizTimeLimitMinutes: CODEX_CONFIG.workshopQuizTimeLimitMinutes,
      workshopQuizPassThreshold: CODEX_CONFIG.workshopQuizPassThreshold,
    });
    expect(deConfig.title).toBe("Codex-Kurs");
  });

  it("resolves only explicitly registered locales", () => {
    const en = englishBundle();
    const registry = createTechnicalCourseLocaleRegistry({
      courseSlug: "codex",
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
      courseSlug: "codex",
      sourceLocale: "en",
      bundles: { en: englishBundle(), de: germanBundle() },
    });

    expect(registry.availableLocales).toEqual(["de", "en"]);
    expect(registry.get("de").config.title).toBe("Codex-Kurs");
    expect(registry.get("en").config.title).toBe("Codex Course");
  });

  it("rejects renamed checkpoint, section, question, or option identity", () => {
    expect(() =>
      createTechnicalCourseLocaleRegistry({
        courseSlug: "codex",
        sourceLocale: "en",
        bundles: {
          en: englishBundle(),
          de: germanBundle(identity(["L01::renamed-checkpoint"])),
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
        courseSlug: "codex",
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
      defineTechnicalCourseContentIdentity("codex", {
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
        courseSlug: "codex",
        sourceLocale: "en",
        bundles: { de: germanBundle() },
      }),
    ).toThrow(/no canonical "en" source bundle/);

    expect(() =>
      defineTechnicalCourseLocaleBundle({
        courseSlug: "codex",
        locale: "de",
        config: enConfig as never,
        identity: identity(),
        content: { marker: "wrong" },
      }),
    ).toThrow(/config language "en" under "de"/);
  });
});
