import { beforeEach, describe, expect, it } from "vitest";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";
import {
  DATA_INFRASTRUCTURE_CONFIG,
  DATA_INFRASTRUCTURE_CONFIG_DE,
} from "./config";
import { getDataInfraCourseCopy } from "./course-copy";
import {
  __resetDataInfraLessonCacheForTests,
  getDataInfraLesson,
  getDataInfraLocaleRegistry,
} from "./data";
import { getDataInfraLandingManifest } from "./landing-manifest";
import { DATA_INFRA_LESSON_IDS, DATA_INFRA_TRACK_IDS } from "./types";

beforeEach(() => {
  __resetDataInfraLessonCacheForTests();
});

describe("Data Infrastructure bilingual course contract", () => {
  it("loads complete reviewed English and German bundles without fallback", async () => {
    const registry = await getDataInfraLocaleRegistry();
    const en = registry.get("en");
    const de = registry.get("de");

    expect(registry.sourceLocale).toBe("en");
    expect(registry.availableLocales).toEqual(["de", "en"]);
    expect(en.content.lessons.map(({ id }) => id)).toEqual(
      DATA_INFRA_LESSON_IDS,
    );
    expect(de.content.lessons.map(({ id }) => id)).toEqual(
      DATA_INFRA_LESSON_IDS,
    );
    expect(en.content.tracks.map(({ id }) => id)).toEqual(DATA_INFRA_TRACK_IDS);
    expect(de.content.tracks.map(({ id }) => id)).toEqual(DATA_INFRA_TRACK_IDS);
    expect(en.config).toBe(DATA_INFRASTRUCTURE_CONFIG);
    expect(de.config).toBe(DATA_INFRASTRUCTURE_CONFIG_DE);
  });

  it("keeps the lightweight route manifest identical to full lesson metadata", async () => {
    const registry = await getDataInfraLocaleRegistry();

    for (const locale of ["de", "en"] as const) {
      const bundle = registry.get(locale);
      const manifest = getDataInfraLandingManifest(locale);
      expect(manifest.courseTitle).toBe(bundle.config.title);
      expect(manifest.tracks).toEqual(bundle.content.tracks);
      expect(manifest.lessons).toEqual(
        bundle.content.lessons.map(
          ({
            id,
            number,
            title,
            subtitle,
            durationMinutes,
            trackId,
            hook,
          }) => ({
            id,
            number,
            title,
            subtitle,
            durationMinutes,
            trackId,
            hook,
          }),
        ),
      );
    }
  });

  it("preserves route, progress, section, quiz, checkpoint, and certificate identity", async () => {
    const registry = await getDataInfraLocaleRegistry();
    const en = registry.get("en");
    const de = registry.get("de");

    expect(de.identity).toEqual(en.identity);
    expect(en.identity.progressKeys).toEqual(DATA_INFRA_LESSON_IDS);
    expect(en.identity.workshopQuestions.length).toBeGreaterThan(0);
    expect(en.identity.checkpointKeys.length).toBeGreaterThan(0);
    expect(en.identity.certificate).toEqual({
      courseSlug: "data-infrastructure",
      qrVersion: 1,
      verificationPath: "/kurse/open-source/data-infrastructure/verifizierung",
    });
  });

  it("resolves every canonical route parameter in both locales and rejects unknown IDs", async () => {
    const params = getTechnicalCourseStaticParams("data-infrastructure");
    expect(params).toHaveLength(DATA_INFRA_LESSON_IDS.length);
    for (const { lessonId } of params) {
      await expect(getDataInfraLesson(lessonId, "de")).resolves.toMatchObject({
        id: lessonId,
      });
      await expect(getDataInfraLesson(lessonId, "en")).resolves.toMatchObject({
        id: lessonId,
      });
    }
    await expect(
      getDataInfraLesson("unknown" as never, "de"),
    ).resolves.toBeUndefined();
    await expect(
      getDataInfraLesson("unknown" as never, "en"),
    ).resolves.toBeUndefined();
  });

  it("keeps lesson, reader, certificate, and verification links in the selected locale", () => {
    expect(
      technicalCourseHref("data-infrastructure", "de", { kind: "reader" }),
    ).toBe("/kurse/open-source/data-infrastructure/kurs");
    expect(
      technicalCourseHref("data-infrastructure", "en", {
        kind: "lesson",
        lessonId: "interview-playbook",
      }),
    ).toBe("/en/kurse/open-source/data-infrastructure/kurs/interview-playbook");
    expect(
      technicalCourseHref("data-infrastructure", "de", { kind: "certificate" }),
    ).toBe("/kurse/open-source/data-infrastructure/kurs/zertifikat");
    expect(
      technicalCourseHref("data-infrastructure", "en", {
        kind: "verification",
        hash: "#test_test-test",
      }),
    ).toBe(
      "/en/kurse/open-source/data-infrastructure/verifizierung#test_test-test",
    );
  });

  it("keeps reader and certificate metadata noindex in both languages", () => {
    for (const locale of ["de", "en"] as const) {
      for (const target of [
        { kind: "lesson", lessonId: "mental-model" },
        { kind: "certificate" },
      ] as const) {
        const metadata = buildTechnicalCourseMetadata({
          courseSlug: "data-infrastructure",
          locale,
          target,
          title: "Data Infrastructure",
          description: "Data Infrastructure course record",
          availableContentLocales: ["de", "en"],
        });
        expect(metadata.robots).toEqual({ index: false, follow: true });
      }
    }
  });

  it("exposes reviewed language-specific course chrome", () => {
    expect(getDataInfraCourseCopy("de").reader.complete).toBe(
      "Lektion abschließen",
    );
    expect(getDataInfraCourseCopy("en").reader.complete).toBe(
      "Complete lesson",
    );
    expect(getDataInfraCourseCopy("de").landing.stats[1]).toEqual({
      value: "14",
      label: "interaktive Modelle",
    });
  });
});
