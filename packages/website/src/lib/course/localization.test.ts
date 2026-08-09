import { describe, expect, it } from "vitest";
import { KI_FUEHRERSCHEIN_CONFIG } from "./config";
import {
  createLocalizedCourseConfig,
  getAuditedCourseContentLocales,
  resolveFoundationCourseContentLocale,
} from "./localization";
import { getBlocks } from "./data";

describe("foundation-course locale contract", () => {
  it("resolves the reviewed KI und Gesellschaft bundle in both locales", () => {
    expect(getAuditedCourseContentLocales("ki-und-gesellschaft")).toEqual([
      "de",
      "en",
    ]);
    expect(
      resolveFoundationCourseContentLocale("ki-und-gesellschaft", "en"),
    ).toBe("en");
    expect(
      resolveFoundationCourseContentLocale("ki-und-gesellschaft", "de"),
    ).toBe("de");
  });

  it("inherits all route, assessment, and progress identity fields", () => {
    const localized = createLocalizedCourseConfig(
      KI_FUEHRERSCHEIN_CONFIG,
      "en",
      {
        title: "AI fundamentals",
        certificateTitle: "Course completion record",
        certificateSubtitle: "Generated locally from browser progress.",
        certificateModules: ["Recognising AI"],
        certificateReferenceLabel: "Course content reference",
        quizPassMessage: "You passed the workshop quiz.",
        certificateFileStem: "AI-fundamentals",
        recordNoun: {
          label: "Completion record",
          possessive: "Your completion record",
          demonstrative: "This completion record",
        },
      },
    );

    expect(localized.language).toBe("en");
    expect(localized.slug).toBe(KI_FUEHRERSCHEIN_CONFIG.slug);
    expect(localized.basePath).toBe(KI_FUEHRERSCHEIN_CONFIG.basePath);
    expect(localized.coursePath).toBe(KI_FUEHRERSCHEIN_CONFIG.coursePath);
    expect(localized.blockIds).toBe(KI_FUEHRERSCHEIN_CONFIG.blockIds);
    expect(localized.workshopQuizQuestionCount).toBe(
      KI_FUEHRERSCHEIN_CONFIG.workshopQuizQuestionCount,
    );
    expect(localized.workshopQuizPassThreshold).toBe(
      KI_FUEHRERSCHEIN_CONFIG.workshopQuizPassThreshold,
    );
  });

  it("serves the distinct English lesson bundle after it is audited", () => {
    const german = getBlocks("ki-und-gesellschaft", "de");
    const english = getBlocks("ki-und-gesellschaft", "en");

    expect(english[0]?.title).toBe("AI and work");
    expect(english[0]?.title).not.toBe(german[0]?.title);
    expect(english.flatMap((block) => block.lessons).map((lesson) => lesson.id)).toEqual(
      german.flatMap((block) => block.lessons).map((lesson) => lesson.id),
    );
  });
});
