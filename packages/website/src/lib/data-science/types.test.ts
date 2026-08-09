import { describe, it, expect } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import { RECORD_LABEL } from "@/lib/courses/tracks";
import {
  DS_CHAPTER_IDS,
  DS_CHAPTERS,
  DS_NUMBERED_CHAPTER_IDS,
  isDsChapterId,
  getDsChapterMeta,
  type DsChapterId,
  type ChapterMeta,
} from "./types";

describe("data-science: prerequisites ( guard)", () => {
  it("CourseSlug already includes this course's slug", () => {
    expect(COURSE_SLUGS).toContain("data-science");
  });

  it("RecordKind already includes 'certificate'", () => {
    expect(Object.keys(RECORD_LABEL)).toContain("certificate");
  });
});

describe("data-science types ", () => {
  it("has exactly 13 chapter ids, matching App.js's real CHAPTERS array order", () => {
    expect(DS_CHAPTER_IDS).toHaveLength(13);
    expect([...DS_CHAPTER_IDS]).toEqual([
      "home",
      "fund",
      "explore",
      "clean",
      "feature",
      "model",
      "eval",
      "interp",
      "exp",
      "causal",
      "peek",
      "deploy",
      "cap",
    ]);
    expect(new Set(DS_CHAPTER_IDS).size).toBe(13);
  });

  it("DS_NUMBERED_CHAPTER_IDS holds the 12 routed chapters, excluding 'home'", () => {
    expect(DS_NUMBERED_CHAPTER_IDS).toHaveLength(12);
    expect(DS_NUMBERED_CHAPTER_IDS).not.toContain("home");
    expect(new Set(DS_NUMBERED_CHAPTER_IDS).size).toBe(12);
    for (const id of DS_NUMBERED_CHAPTER_IDS) {
      expect(DS_CHAPTER_IDS).toContain(id);
    }
  });

  it("isDsChapterId is a real type guard", () => {
    expect(isDsChapterId("home")).toBe(true);
    expect(isDsChapterId("cap")).toBe(true);
    expect(isDsChapterId("does-not-exist")).toBe(false);
    expect(isDsChapterId(42)).toBe(false);
  });

  it("DS_CHAPTERS ports App.js's CHAPTERS array verbatim: one entry per id, in order", () => {
    expect(DS_CHAPTERS).toHaveLength(13);
    expect(DS_CHAPTERS.map((c) => c.id)).toEqual([...DS_CHAPTER_IDS]);
    expect(DS_CHAPTERS.map((c) => c.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(DS_CHAPTERS.map((c) => c.displayNumber)).toEqual([
      "—",
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ]);
  });

  it("carries the real title/subtitle/duration content from source, not placeholders", () => {
    const home = DS_CHAPTERS.find((c) => c.id === "home");
    expect(home?.title).toBe("Overview");
    expect(home?.subtitle).toBe("Twelve chapters and local teaching models");
    expect(home?.estimatedMinutes).toBe(3);

    const fund = DS_CHAPTERS.find((c) => c.id === "fund");
    expect(fund?.title).toBe("Fundamentals");
    expect(fund?.subtitle).toBe("Sample vs population, the loop");
    expect(fund?.estimatedMinutes).toBe(7);

    // Source has a literal middle dot ("\xB7" = "·") in this subtitle — a real fidelity trap.
    const evalCh = DS_CHAPTERS.find((c) => c.id === "eval");
    expect(evalCh?.subtitle).toBe("Confusion · threshold · ROC/PR");

    const peek = DS_CHAPTERS.find((c) => c.id === "peek");
    expect(peek?.title).toBe("Peeking & CUPED");
    expect(peek?.subtitle).toBe(
      "Stopping, multiplicity, and covariate adjustment",
    );
    expect(peek?.estimatedMinutes).toBe(7);

    const cap = DS_CHAPTERS.find((c) => c.id === "cap");
    expect(cap?.title).toBe("Capstone");
    expect(cap?.subtitle).toBe("Data audit through deployment review");
    expect(cap?.estimatedMinutes).toBe(12);
  });

  it("getDsChapterMeta returns the meta for a known id and throws for an unknown one", () => {
    expect(getDsChapterMeta("cap").title).toBe("Capstone");
    // @ts-expect-error — exercising the throw branch with an invalid id
    expect(() => getDsChapterMeta("does-not-exist")).toThrow();
  });

  it("a minimal ChapterMeta shape satisfies the interface", () => {
    const meta: ChapterMeta = {
      id: "home" as DsChapterId,
      number: 0,
      displayNumber: "—",
      title: "Overview",
      subtitle: "The whole DS loop, animated",
      estimatedMinutes: 3,
    };
    expect(meta.id).toBe("home");
  });
});
