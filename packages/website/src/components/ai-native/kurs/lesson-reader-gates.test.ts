import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  areLessonSectionsReady,
  canPersistAiNativeLessonCompletion,
  resolveAiNativeProjectStatus,
} from "./lesson-reader";

describe("AI-Native lesson reader gates", () => {
  it("keeps keyboard navigation independent from section review state", () => {
    const source = readFileSync(join(__dirname, "lesson-reader.tsx"), "utf8");

    expect(source).not.toContain('data-state={isLocked ? "locked"');
    expect(source).not.toContain("aria-hidden={isLocked");
    expect(source).not.toContain('visibility: "hidden"');
    expect(source.match(/<LessonSectionCheckpoint\b/g)).toHaveLength(1);
  });

  it("does not finalize a lesson until every canonical section is persisted", () => {
    const sectionIds = ["section-1", "section-2", "section-3"];

    expect(
      areLessonSectionsReady(sectionIds, new Set(["section-1", "section-3"])),
    ).toBe(false);
    expect(areLessonSectionsReady(sectionIds, new Set(sectionIds))).toBe(true);
  });

  it("requires section review plus the lesson's actual evidence mode", () => {
    const sections = ["section-1", "section-2"];
    const reviewed = new Set(sections);

    expect(
      canPersistAiNativeLessonCompletion(
        sections,
        new Set(["section-1"]),
        true,
        true,
        false,
      ),
    ).toBe(false);
    expect(
      canPersistAiNativeLessonCompletion(sections, reviewed, true, false, true),
    ).toBe(false);
    expect(
      canPersistAiNativeLessonCompletion(sections, reviewed, true, true, false),
    ).toBe(true);
    expect(
      canPersistAiNativeLessonCompletion(
        sections,
        reviewed,
        false,
        false,
        false,
      ),
    ).toBe(false);
    expect(
      canPersistAiNativeLessonCompletion(
        sections,
        reviewed,
        false,
        false,
        true,
      ),
    ).toBe(true);
  });

  it("keeps every lesson-local link at the 44px interaction floor", () => {
    const source = readFileSync(join(__dirname, "lesson-reader.tsx"), "utf8");
    const links = source.match(/<(?:Link|a)\b[\s\S]*?>/g) ?? [];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toContain("min-h-11");
  });

  it("gives previous and next lesson navigation a localized landmark name", () => {
    const source = readFileSync(join(__dirname, "lesson-reader.tsx"), "utf8");

    expect(source).toContain('lessonNavigationLabel: "Lesson navigation"');
    expect(source).toContain('lessonNavigationLabel: "Lektionsnavigation"');
    expect(source).toContain("aria-label={copy.lessonNavigationLabel}");
  });
});

describe("AI-Native applied-project migration status", () => {
  it("keeps historical capstone state distinct from verified project evidence", () => {
    expect(resolveAiNativeProjectStatus(false, true)).toBe("legacy-capstone");
    expect(resolveAiNativeProjectStatus(false, false)).toBe("pending");
  });

  it("gives exact project evidence precedence when both signals exist", () => {
    expect(resolveAiNativeProjectStatus(true, true)).toBe("verified-project");
    expect(resolveAiNativeProjectStatus(true, false)).toBe("verified-project");
  });
});
