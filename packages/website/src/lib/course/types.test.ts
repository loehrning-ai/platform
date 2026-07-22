import { describe, it, expect } from "vitest";
import { COURSE_SLUGS } from "./types";

describe("COURSE_SLUGS ", () => {
  it("widens to exactly the 10 confirmed course slugs", () => {
    expect([...COURSE_SLUGS].sort()).toEqual(
      [
        "ki-fuehrerschein",
        "eu-ai-act-kurs",
        "ai-native",
        "ki-und-gesellschaft",
        "data-engineering-fundamentals",
        "data-science",
        "data-infrastructure",
        "codex",
        "claude",
        "ai-native-operator",
      ].sort(),
    );
  });

  it("never lets ai-native-operator collide with the native ai-native slug", () => {
    expect(COURSE_SLUGS).toContain("ai-native");
    expect(COURSE_SLUGS).toContain("ai-native-operator");
    expect(
      COURSE_SLUGS.filter((slug) => slug === "ai-native").length,
    ).toBe(1);
  });
});
