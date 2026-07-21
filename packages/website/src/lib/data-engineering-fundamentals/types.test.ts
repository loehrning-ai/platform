import { describe, it, expect } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import { RECORD_LABEL } from "@/lib/courses/tracks";
import {
  DEF_CHAPTER_IDS,
  DEF_CHAPTERS,
  isDefChapterId,
  type DefChapterId,
  type ChapterMeta,
} from "./types";

describe("data-engineering-fundamentals: plan 007 prerequisites (plan 011 stage 1 guard)", () => {
  it("CourseSlug already includes this course's slug", () => {
    expect(COURSE_SLUGS).toContain("data-engineering-fundamentals");
  });

  it("RecordKind already includes 'certificate'", () => {
    expect(Object.keys(RECORD_LABEL)).toContain("certificate");
  });
});

describe("data-engineering-fundamentals types (plan 011 stage 1)", () => {
  it("has exactly 12 chapter ids, matching App.js's real CHAPTERS array order", () => {
    expect(DEF_CHAPTER_IDS).toHaveLength(12);
    expect([...DEF_CHAPTER_IDS]).toEqual([
      "home",
      "fund",
      "ingest",
      "stream",
      "store",
      "comp",
      "orch",
      "qual",
      "disc",
      "serve",
      "gov",
      "cap",
    ]);
    expect(new Set(DEF_CHAPTER_IDS).size).toBe(12);
  });

  it("isDefChapterId is a real type guard", () => {
    expect(isDefChapterId("home")).toBe(true);
    expect(isDefChapterId("cap")).toBe(true);
    expect(isDefChapterId("does-not-exist")).toBe(false);
    expect(isDefChapterId(42)).toBe(false);
  });

  it("DEF_CHAPTERS ports App.js's CHAPTERS array verbatim: one entry per id, in order", () => {
    expect(DEF_CHAPTERS).toHaveLength(12);
    expect(DEF_CHAPTERS.map((c) => c.id)).toEqual([...DEF_CHAPTER_IDS]);
    expect(DEF_CHAPTERS.map((c) => c.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(DEF_CHAPTERS.map((c) => c.displayNumber)).toEqual([
      "-", "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    ]);
  });

  it("carries the real title/subtitle/duration/color content from source, not placeholders", () => {
    const home = DEF_CHAPTERS.find((c) => c.id === "home");
    expect(home?.title).toBe("Overview");
    expect(home?.subtitle).toBe("The pipeline, end to end");
    expect(home?.estimatedMinutes).toBe(3);
    expect(home?.accentHex).toBe("#6B7787");
    expect(home?.inkHex).toBe("#646F7E");

    const fund = DEF_CHAPTERS.find((c) => c.id === "fund");
    expect(fund?.title).toBe("Core Fundamentals");
    expect(fund?.subtitle).toBe("Storage, formats, engines");
    expect(fund?.estimatedMinutes).toBe(8);

    const qual = DEF_CHAPTERS.find((c) => c.id === "qual");
    // Source has a literal ≠ ("≠") in this subtitle — a real fidelity trap.
    expect(qual?.subtitle).toBe("Pipeline ran ≠ number is right");

    const cap = DEF_CHAPTERS.find((c) => c.id === "cap");
    expect(cap?.title).toBe("Capstone");
    expect(cap?.subtitle).toBe("Build dim_users E2E");
    expect(cap?.estimatedMinutes).toBe(15);
  });

  it("a minimal ChapterMeta shape satisfies the interface", () => {
    const meta: ChapterMeta = {
      id: "home" as DefChapterId,
      number: 0,
      displayNumber: "-",
      title: "Overview",
      subtitle: "The pipeline, end to end",
      estimatedMinutes: 3,
      accentHex: "#6B7787",
      inkHex: "#646F7E",
    };
    expect(meta.id).toBe("home");
  });
});
