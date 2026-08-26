import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COURSE_LAYOUTS = [
  "app/ai-native/kurs/layout.tsx",
  "app/eu-ai-act-kurs/kurs/layout.tsx",
  "app/ki-fuehrerschein/kurs/layout.tsx",
  "app/ki-und-gesellschaft/kurs/layout.tsx",
] as const;

function source(relativePath: string): string {
  return readFileSync(join(__dirname, "..", "..", "..", relativePath), "utf8");
}

describe("foundation course progress-surface contract", () => {
  it.each(COURSE_LAYOUTS)(
    "keeps %s free of a second fixed progress surface",
    (layout) => {
      const contents = source(layout);

      expect(contents).not.toContain("LernbegleiterStrip");
      expect(contents).not.toContain("ReadingProgressBar");
      expect(contents).not.toMatch(/\bfixed\b/);
      expect(contents).toContain('className="pb-12"');
      expect(contents).not.toContain("pb-16");
    },
  );

  it("removes the obsolete fixed Lernbegleiter implementation", () => {
    expect(
      existsSync(
        join(__dirname, "..", "..", "learning", "lernbegleiter-strip.tsx"),
      ),
    ).toBe(false);
  });
});
