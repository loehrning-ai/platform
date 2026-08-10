import { beforeEach, describe, expect, it } from "vitest";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";
import { CODEX_CONFIG, CODEX_CONFIG_DE } from "./config";
import { getCodexCourseCopy } from "./course-copy";
import {
  __resetCodexLessonCacheForTests,
  getCodexLesson,
  getCodexLocaleRegistry,
} from "./data";
import { CODEX_LESSON_IDS, CODEX_TRACK_IDS } from "./types";

const MACHINE_PROP_KEYS = [
  "id",
  "trackId",
  "kind",
  "placement",
  "courseSlug",
  "lessonId",
  "cpId",
  "tone",
  "type",
  "windowTitle",
  "file",
] as const;

const REVIEWED_SHARED_TECHNICAL_TERMS = new Set([
  "AGENTS.md",
  "Aider",
  "CLAUDE.md",
  "Claude Code",
  "Codex (OpenAI)",
  "Cursor",
  "Debugging",
  "GitHub Copilot",
  "MCP",
  "Refactoring",
  "Sandbox",
]);

interface SharedVisibleString {
  readonly path: string;
  readonly value: string;
}

function sharedVisibleStrings(
  canonical: unknown,
  localized: unknown,
  path: string,
  key = "",
): readonly SharedVisibleString[] {
  if (
    typeof canonical === "string" &&
    typeof localized === "string" &&
    canonical === localized &&
    canonical.trim().length > 0
  ) {
    return MACHINE_PROP_KEYS.includes(key as (typeof MACHINE_PROP_KEYS)[number])
      ? []
      : [{ path, value: canonical }];
  }
  if (Array.isArray(canonical) && Array.isArray(localized)) {
    return canonical.flatMap((value, index) =>
      sharedVisibleStrings(value, localized[index], `${path}[${index}]`),
    );
  }
  if (
    canonical !== null &&
    localized !== null &&
    typeof canonical === "object" &&
    typeof localized === "object"
  ) {
    const localizedRecord = localized as Readonly<Record<string, unknown>>;
    return Object.entries(canonical).flatMap(([entryKey, value]) =>
      sharedVisibleStrings(
        value,
        localizedRecord[entryKey],
        `${path}.${entryKey}`,
        entryKey,
      ),
    );
  }
  return [];
}

function isReviewedCodeFixture({ value }: SharedVisibleString): boolean {
  return (
    /^(?:\$|→|#|@|from\s|import\s|def\s|return\s|yield\s|assert\s|make\s)/.test(
      value.trimStart(),
    ) ||
    /(?:::|\/[\w.-]+|\b(?:Blueprint|jsonify|pytest|mocker|StringIO)\b)/.test(
      value,
    ) ||
    /^[\w.]+\s*=/.test(value.trimStart()) ||
    /^\s{2,}\S/.test(value)
  );
}

beforeEach(() => {
  __resetCodexLessonCacheForTests();
});

describe("Codex bilingual course contract", () => {
  it("loads complete reviewed English and German bundles without fallback", async () => {
    const registry = await getCodexLocaleRegistry();
    const en = registry.get("en");
    const de = registry.get("de");

    expect(registry.sourceLocale).toBe("en");
    expect(registry.availableLocales).toEqual(["de", "en"]);
    expect(en.content.lessons.map(({ id }) => id)).toEqual(CODEX_LESSON_IDS);
    expect(de.content.lessons.map(({ id }) => id)).toEqual(CODEX_LESSON_IDS);
    expect(en.content.tracks.map(({ id }) => id)).toEqual(CODEX_TRACK_IDS);
    expect(de.content.tracks.map(({ id }) => id)).toEqual(CODEX_TRACK_IDS);
    expect(en.config).toBe(CODEX_CONFIG);
    expect(de.config).toBe(CODEX_CONFIG_DE);
  });

  it("derives identical route, progress, section, quiz, checkpoint, and certificate identity", async () => {
    const registry = await getCodexLocaleRegistry();
    const en = registry.get("en");
    const de = registry.get("de");

    expect(de.identity).toEqual(en.identity);
    expect(en.identity.progressKeys).toEqual(CODEX_LESSON_IDS);
    expect(en.identity.workshopQuestions.length).toBeGreaterThan(0);
    expect(en.identity.checkpointKeys.length).toBeGreaterThan(0);
    expect(en.identity.certificate).toEqual({
      courseSlug: "codex",
      qrVersion: 1,
      verificationPath: "/kurse/open-source/codex/verifizierung",
    });
  });

  it("keeps every machine field, ordering rule, and provenance value unchanged", async () => {
    const registry = await getCodexLocaleRegistry();
    const enLessons = registry.get("en").content.lessons;
    const deLessons = registry.get("de").content.lessons;

    for (const [index, enLesson] of enLessons.entries()) {
      const deLesson = deLessons[index];
      expect(deLesson).toBeDefined();
      expect(deLesson.id).toBe(enLesson.id);
      expect(deLesson.number).toBe(enLesson.number);
      expect(deLesson.durationMinutes).toBe(enLesson.durationMinutes);
      expect(deLesson.trackId).toBe(enLesson.trackId);
      expect(deLesson.quiz).toEqual(enLesson.quiz);
      expect(deLesson.sections).toHaveLength(enLesson.sections.length);
      expect(deLesson.widgets).toHaveLength(enLesson.widgets?.length ?? 0);

      for (const [sectionIndex, enSection] of enLesson.sections.entries()) {
        const deSection = deLesson.sections[sectionIndex];
        expect(deSection.id).toBe(enSection.id);
        expect(deSection.readTimeMinutes).toBe(enSection.readTimeMinutes);
        expect(deSection.sources).toEqual(enSection.sources);
        expect(deSection.blocks.map(({ kind }) => kind)).toEqual(
          enSection.blocks.map(({ kind }) => kind),
        );
      }

      for (const [widgetIndex, enWidget] of (
        enLesson.widgets ?? []
      ).entries()) {
        const deWidget = deLesson.widgets?.[widgetIndex];
        expect(deWidget).toBeDefined();
        expect(deWidget?.kind).toBe(enWidget.kind);
        expect(deWidget?.placement).toBe(enWidget.placement);
        for (const key of MACHINE_PROP_KEYS) {
          expect(deWidget?.props?.[key]).toEqual(enWidget.props?.[key]);
        }
      }
    }
  });

  it("contains reviewed German lesson and chrome copy while retaining the English source", async () => {
    const registry = await getCodexLocaleRegistry();
    const enLessons = registry.get("en").content.lessons;
    const deLessons = registry.get("de").content.lessons;

    expect(enLessons[0].title).toBe("What Codex Actually Is");
    expect(deLessons[0].title).toBe("Was Codex tatsächlich ist");
    expect(enLessons[11].title).toBe("A Reviewable Development Workflow");
    expect(deLessons[11].title).toBe("Ein prüfbarer Entwicklungsablauf");
    for (const [index, enLesson] of enLessons.entries()) {
      const deLesson = deLessons[index];
      expect(deLesson.title).not.toBe(enLesson.title);
      expect(deLesson.subtitle).not.toBe(enLesson.subtitle);
      expect(deLesson.hook).not.toBe(enLesson.hook);
      for (const [sectionIndex, enSection] of enLesson.sections.entries()) {
        expect(deLesson.sections[sectionIndex].title).not.toBe(enSection.title);
      }
    }

    expect(getCodexCourseCopy("de").reader.complete).toBe(
      "Lektion abschließen",
    );
    expect(getCodexCourseCopy("en").reader.complete).toBe("Complete lesson");
  });

  it("leaves no English source string in resolved German prose or interface copy", async () => {
    const registry = await getCodexLocaleRegistry();
    const enLessons = registry.get("en").content.lessons;
    const deLessons = registry.get("de").content.lessons;
    const unresolved = enLessons.flatMap((lesson, index) =>
      sharedVisibleStrings(lesson, deLessons[index], lesson.id),
    );

    expect(
      unresolved.filter(
        (entry) =>
          !REVIEWED_SHARED_TECHNICAL_TERMS.has(entry.value) &&
          !isReviewedCodeFixture(entry),
      ),
    ).toEqual([]);
  });

  it("uses scoped technical language instead of hype or universal product claims", async () => {
    const registry = await getCodexLocaleRegistry();
    const resolvedCopy = JSON.stringify({
      en: registry.get("en").content,
      de: registry.get("de").content,
      chrome: {
        en: getCodexCourseCopy("en"),
        de: getCodexCourseCopy("de"),
      },
    });

    expect(resolvedCopy).not.toMatch(
      /highest[- ]leverage|gold standard|world-class|single most important|single highest|success rate roughly doubles|every run gets a fresh sandbox|nothing in between is interactive|Copilot autocomplete is fastest|five major categories|as of 2025|as of 2026|a morning'?s work|twice the size is four times|doesn'?t run on your laptop|only the diff survives|two revisions|two retries|first try|first run|minutes elapsed|lines changed|senior engineer|junior engineer|doesn'?t get tired|zero conflicts?|always safe|autonomously until all tests pass|four or five parallel|ten parallel|two failed revision|two review rounds|about ten minutes|about two minutes|zwei (?:korrektur|revision|überarbeitung)|minuten später|geänderte zeilen|schneller als ein mensch|erste[nm]? (?:versuch|lauf)|vier oder fünf parallele|zehn parallele|zwei erfolglose|zwei review-runden|etwa zehn minuten|etwa zwei minuten|vierzig dateien|47 minuten|600 zeilen|400 zeilen/i,
    );
  });

  it("resolves every canonical route parameter in both locales and rejects unknown IDs", async () => {
    const params = getTechnicalCourseStaticParams("codex");
    expect(params).toHaveLength(12);
    for (const { lessonId } of params) {
      await expect(getCodexLesson(lessonId, "de")).resolves.toMatchObject({
        id: lessonId,
      });
      await expect(getCodexLesson(lessonId, "en")).resolves.toMatchObject({
        id: lessonId,
      });
    }
    await expect(getCodexLesson("L99" as never, "de")).resolves.toBeUndefined();
    await expect(getCodexLesson("L99" as never, "en")).resolves.toBeUndefined();
  });

  it("keeps lesson, reader, record, and verification links in the selected locale", () => {
    expect(technicalCourseHref("codex", "de", { kind: "reader" })).toBe(
      "/kurse/open-source/codex/kurs",
    );
    expect(
      technicalCourseHref("codex", "en", {
        kind: "lesson",
        lessonId: "L12",
      }),
    ).toBe("/en/kurse/open-source/codex/kurs/L12");
    expect(technicalCourseHref("codex", "de", { kind: "certificate" })).toBe(
      "/kurse/open-source/codex/kurs/zertifikat",
    );
    const hash = "#test_test-test" as const;
    expect(
      technicalCourseHref("codex", "en", { kind: "verification", hash }),
    ).toBe(`/en/kurse/open-source/codex/verifizierung${hash}`);
  });

  it("keeps reader and record metadata noindex in both languages", () => {
    for (const locale of ["de", "en"] as const) {
      const metadata = buildTechnicalCourseMetadata({
        courseSlug: "codex",
        locale,
        target: { kind: "lesson", lessonId: "L01" },
        title: "Codex",
        description: "Codex lesson",
        availableContentLocales: ["de", "en"],
      });
      expect(metadata.robots).toEqual({ index: false, follow: true });
    }
  });
});
