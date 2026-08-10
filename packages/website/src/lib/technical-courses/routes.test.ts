import { describe, expect, it } from "vitest";
import {
  TECHNICAL_CERTIFICATE_IDENTITY,
  TECHNICAL_COURSE_CANONICAL_IDS,
  TECHNICAL_COURSE_ROUTES,
  TECHNICAL_COURSE_SLUGS,
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  hasCompleteTechnicalLocaleSet,
  technicalCourseCanonicalHref,
  technicalCourseHref,
} from "./routes";

describe("technical course route contract", () => {
  it("keeps all six existing course roots stable", () => {
    expect(TECHNICAL_COURSE_SLUGS).toEqual([
      "claude",
      "codex",
      "data-infrastructure",
      "data-engineering-fundamentals",
      "data-science",
      "ai-native-operator",
    ]);
    for (const courseSlug of TECHNICAL_COURSE_SLUGS) {
      expect(TECHNICAL_COURSE_ROUTES[courseSlug].basePath).toBe(
        `/kurse/open-source/${courseSlug}`,
      );
    }
  });

  it("keeps German unprefixed and puts English on the equivalent /en route", () => {
    expect(
      technicalCourseHref("claude", "de", {
        kind: "lesson",
        lessonId: "mental-model",
      }),
    ).toBe("/kurse/open-source/claude/kurs/mental-model");
    expect(
      technicalCourseHref("claude", "en", {
        kind: "lesson",
        lessonId: "mental-model",
      }),
    ).toBe("/en/kurse/open-source/claude/kurs/mental-model");
    expect(
      technicalCourseHref("data-science", "en", {
        kind: "chapter",
        chapterId: "home",
      }),
    ).toBe("/en/kurse/open-source/data-science");
    expect(
      technicalCourseHref("ai-native-operator", "de", {
        kind: "lesson",
        moduleId: "governance",
        lessonNumber: 4,
      }),
    ).toBe("/kurse/open-source/ai-native-operator/governance/4");
  });

  it("preserves a bounded base64url certificate fragment exactly", () => {
    const hash = "#test_test-test" as const;
    expect(
      technicalCourseHref("codex", "en", {
        kind: "verification",
        hash,
      }),
    ).toBe(`/en/kurse/open-source/codex/verifizierung${hash}`);
    expect(() =>
      technicalCourseCanonicalHref("codex", {
        kind: "verification",
        hash: "#contains/slash" as `#${string}`,
      }),
    ).toThrow(/base64url/);
  });

  it("rejects unknown runtime identities instead of redirecting to a root", () => {
    expect(() =>
      technicalCourseCanonicalHref(
        "codex",
        { kind: "lesson", lessonId: "L99" } as never,
      ),
    ).toThrow(/Unknown lesson identity/);
    expect(() =>
      technicalCourseCanonicalHref(
        "ai-native-operator",
        { kind: "lesson", moduleId: "mindset", lessonNumber: 99 } as never,
      ),
    ).toThrow(/Unknown lesson identity/);
    expect(() =>
      technicalCourseCanonicalHref("codex", { kind: "quiz" } as never),
    ).toThrow(/no final quiz route/);
  });

  it("derives locale-independent static params from canonical IDs", () => {
    expect(getTechnicalCourseStaticParams("claude")).toHaveLength(12);
    expect(getTechnicalCourseStaticParams("codex")).toHaveLength(12);
    expect(getTechnicalCourseStaticParams("data-infrastructure")).toHaveLength(
      12,
    );
    expect(
      getTechnicalCourseStaticParams("data-engineering-fundamentals"),
    ).toHaveLength(12);
    const dataScienceParams = getTechnicalCourseStaticParams("data-science");
    expect(dataScienceParams).toHaveLength(12);
    expect(dataScienceParams).not.toContainEqual({ chapterSlug: "home" });
    expect(getTechnicalCourseStaticParams("ai-native-operator")).toHaveLength(
      39,
    );
    expect(
      TECHNICAL_COURSE_CANONICAL_IDS["data-science"].progressKeys,
    ).not.toContain("home");
  });

  it("keeps QR course identity and schema version locale-independent", () => {
    for (const courseSlug of TECHNICAL_COURSE_SLUGS) {
      expect(TECHNICAL_CERTIFICATE_IDENTITY[courseSlug]).toMatchObject({
        courseSlug,
        qrVersion: 1,
        verificationPath: `/kurse/open-source/${courseSlug}/verifizierung`,
      });
    }
  });
});

describe("technical course SEO helpers", () => {
  it("noindexes English until reviewed parity is supplied", () => {
    const metadata = buildTechnicalCourseMetadata({
      courseSlug: "codex",
      locale: "en",
      target: { kind: "landing" },
      title: "Codex Course",
      description: "A precise description.",
      availableContentLocales: ["de"],
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toEqual({
      canonical: "/en/kurse/open-source/codex",
    });
  });

  it("keeps readers noindex even after both landing languages are reviewed", () => {
    const metadata = buildTechnicalCourseMetadata({
      courseSlug: "codex",
      locale: "en",
      target: { kind: "lesson", lessonId: "L01" },
      title: "Lesson",
      description: "Lesson description.",
      availableContentLocales: ["de", "en"],
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toMatchObject({
      canonical: "/en/kurse/open-source/codex/kurs/L01",
      languages: {
        de: "/kurse/open-source/codex/kurs/L01",
        en: "/en/kurse/open-source/codex/kurs/L01",
      },
    });
  });

  it("rejects an SEO locale set that omits the German canonical language", () => {
    expect(() =>
      buildTechnicalCourseMetadata({
        courseSlug: "codex",
        locale: "en",
        target: { kind: "landing" },
        title: "Codex Course",
        description: "A precise description.",
        availableContentLocales: ["en"],
      }),
    ).toThrow(/without German canonical content/);
  });

  it("uses one stable course entity with localized URL and language", () => {
    const graph = buildTechnicalCourseJsonLd({
      courseSlug: "data-science",
      locale: "en",
      name: "Data Science Fundamentals",
      description: "A reviewed course description.",
      teaches: ["Evaluate models"],
    });
    expect(graph).toMatchObject({
      "@id":
        "https://loehrning.ai/kurse/open-source/data-science#course",
      identifier: "data-science",
      url: "https://loehrning.ai/en/kurse/open-source/data-science",
      inLanguage: "en-GB",
      teaches: ["Evaluate models"],
    });
  });

  it("requires both supported locale bundles for runtime completeness", () => {
    expect(hasCompleteTechnicalLocaleSet(["en"])).toBe(false);
    expect(hasCompleteTechnicalLocaleSet(["de", "en"])).toBe(true);
  });
});
