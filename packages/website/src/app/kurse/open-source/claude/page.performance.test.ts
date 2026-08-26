import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Claude landing performance", () => {
  it("does not prefetch every lesson when the course map enters view", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const linkOpenings = [...source.matchAll(/<Link\b[\s\S]*?>/g)].map(
      (match) => match[0],
    );
    const lessonLinks = linkOpenings.filter((link) => {
      const normalized = link.replace(/\s+/g, " ");
      return (
        normalized.includes("href={firstLessonHref}") ||
        /technicalCourseHref\(\s*"claude"[\s\S]*kind:\s*"lesson"/.test(
          normalized,
        )
      );
    });

    expect(lessonLinks).toHaveLength(2);
    for (const link of lessonLinks) {
      expect(link).toContain("prefetch={false}");
    }
  });
});
