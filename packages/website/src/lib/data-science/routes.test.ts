import { describe, it, expect } from "vitest";
import { DS_CHAPTERS } from "./types";
import { DS_COURSE_BASE_PATH, dsChapterHref } from "./routes";

describe("data-science routes (plan 012 stage 5)", () => {
  it("points 'home' at the bare course root, not a [chapterSlug] segment", () => {
    expect(dsChapterHref("home")).toBe(DS_COURSE_BASE_PATH);
    expect(dsChapterHref("home")).toBe("/kurse/open-source/data-science");
  });

  it("points every numbered chapter at its own slug under the course root", () => {
    expect(dsChapterHref("fund")).toBe("/kurse/open-source/data-science/fund");
    expect(dsChapterHref("cap")).toBe("/kurse/open-source/data-science/cap");
  });

  it("produces a unique href for every chapter", () => {
    const hrefs = DS_CHAPTERS.map((c) => dsChapterHref(c.id));
    expect(new Set(hrefs).size).toBe(DS_CHAPTERS.length);
  });
});
