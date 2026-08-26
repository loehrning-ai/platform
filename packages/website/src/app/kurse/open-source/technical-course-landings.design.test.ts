import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LANDINGS = [
  "codex",
  "claude",
  "data-infrastructure",
  "data-engineering-fundamentals",
  "ai-native-operator",
] as const;

function sourceFor(course: (typeof LANDINGS)[number]): string {
  return readFileSync(join(__dirname, course, "page.tsx"), "utf8");
}

describe("technical course landing design contract", () => {
  it.each(LANDINGS)(
    "%s uses the compact shared action-first frame",
    (course) => {
      const source = sourceFor(course);

      expect(source).toContain("<TechnicalCourseFrame");
      expect(source).toContain("<TechnicalCourseHeader");
      expect(source).toContain("<TechnicalCourseSectionHeading");
      expect(
        source.match(/className=\{TECHNICAL_COURSE_PRIMARY_ACTION_CLASS\}/g),
      ).toHaveLength(1);
      expect(
        source.match(/className=\{TECHNICAL_COURSE_SECONDARY_ACTION_CLASS\}/g),
      ).toHaveLength(1);
      expect(source).toContain("generateMetadata");
      expect(source).toContain("buildTechnicalCourseJsonLd");
      expect(source).toContain("<JsonLd");
    },
  );

  it.each(LANDINGS)(
    "%s excludes brochure chrome, undersized labels, and oversized gaps",
    (course) => {
      const source = sourceFor(course);

      expect(source).not.toMatch(/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/);
      expect(source).not.toMatch(/shadow-(?!none)/);
      expect(source).not.toMatch(
        /hover:-translate|transition-all|transition-transform/,
      );
      expect(source).not.toMatch(/\brounded(?:-|\b)/);
      expect(source).not.toMatch(/(?<!scroll-)mt-(?:14|16|20|24|28|32)\b/);
      expect(source).not.toMatch(/\b(?:pt|pb)-(?:14|16|20|24|28|32)\b/);
    },
  );

  it("retains course-specific instruments and compact progress boundaries", () => {
    expect(sourceFor("claude")).toMatch(/<HeroOrrery[\s\S]*<HeroTransform/);
    expect(sourceFor("data-infrastructure")).not.toContain("copy.stackRows");
    expect(sourceFor("data-infrastructure")).toMatch(
      /tracks\.map[\s\S]*trackLessons\.map[\s\S]*<TechnicalCourseTrackProgress/,
    );
    expect(sourceFor("ai-native-operator")).toMatch(
      /<TechnicalCourseProgressBar[\s\S]*moduleHref\(module\.id[\s\S]*<CourseAssessmentCta/,
    );
  });

  it("keeps every authored lesson, chapter, and module map wired to its canonical route helper", () => {
    expect(sourceFor("codex")).toMatch(
      /trackLessons\.map[\s\S]*technicalCourseHref\("codex"[\s\S]*lessonId: lesson\.id/,
    );
    expect(sourceFor("claude")).toMatch(
      /trackLessons\.map[\s\S]*technicalCourseHref\("claude"[\s\S]*lessonId: lesson\.id/,
    );
    expect(sourceFor("data-infrastructure")).toMatch(
      /trackLessons\.map[\s\S]*"data-infrastructure"[\s\S]*lessonId: lesson\.id/,
    );
    expect(sourceFor("data-engineering-fundamentals")).toMatch(
      /chapters\.map[\s\S]*"data-engineering-fundamentals"[\s\S]*chapterId: chapter\.id/,
    );
    expect(sourceFor("ai-native-operator")).toMatch(
      /modules\.map[\s\S]*moduleHref\(module\.id, locale\)/,
    );
  });
});
