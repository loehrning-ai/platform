import { describe, expect, it } from "vitest";
import {
  containsExactHiveDemoUrl,
  hasAllowedDemoContext,
  isFreshnessExcluded,
} from "../../scripts/content-lint.mjs";

describe("content-lint third-party demo URL exemption", () => {
  it.each([
    "Hive Moderation unter hivemoderation.com/demo ausprobieren.",
    "Hive Moderation unter https://hivemoderation.com/demo ausprobieren.",
    "Link: (https://hivemoderation.com/demo).",
  ])("accepts the exact Hive demo URL in %s", (line) => {
    expect(containsExactHiveDemoUrl(line)).toBe(true);
    expect(hasAllowedDemoContext(line)).toBe(true);
  });

  it.each([
    "https://evil.example/hivemoderation.com/demo",
    "https://evil.hivemoderation.com/demo",
    "https://hivemoderation.com.evil.example/demo",
    "https://hivemoderation.com/demo/extra",
    "https://hivemoderation.com/demo?redirect=evil",
    "https://hivemoderation.com/demo#spoof",
    "https://attacker@hivemoderation.com/demo",
    "https://hivemoderation.com:444/demo",
    "http://hivemoderation.com/demo",
    "prefixhivemoderation.com/demo",
  ])("rejects Hive demo URL lookalike %s", (line) => {
    expect(containsExactHiveDemoUrl(line)).toBe(false);
  });

  it("retains explicit non-URL educational Demo contexts", () => {
    expect(hasAllowedDemoContext("Geplante Live-Demo im Kurs")).toBe(true);
    expect(hasAllowedDemoContext("Die Praxis-Demo gehört uns")).toBe(false);
  });
});

describe("content-lint freshness exclusions", () => {
  it.each([
    "/repo/content/ki-fuehrerschein/glossary.json",
    "/repo/content/ki-fuehrerschein/quiz/questions.json",
    "/repo/content/ai-native/challenges.json",
    "/repo/content/eu-ai-act-kurs/course.json",
    "/repo/content/ai-native/modules.json",
    String.raw`C:\repo\content\ki-fuehrerschein\glossary.json`,
    String.raw`C:\repo\content\ki-fuehrerschein\quiz\questions.json`,
    String.raw`C:\repo\content\ai-native\challenges.json`,
    String.raw`C:\repo\content\eu-ai-act-kurs\course.json`,
    String.raw`C:\repo\content\ai-native\modules.json`,
  ])("matches the exact structural path on POSIX and Windows: %s", (path) => {
    expect(isFreshnessExcluded(path)).toBe(true);
  });

  it.each([
    "/repo/content/ki-fuehrerschein/my-glossary.json",
    "/repo/content/ki-fuehrerschein/glossary.json.backup",
    "/repo/content/ki-fuehrerschein/not-quiz/questions.json",
    "/repo/content/ki-fuehrerschein/quiz/questions.json.backup",
    "/repo/content/ai-native/extra-challenges.json",
    "/repo/content/eu-ai-act-kurs/not-course.json",
    "/repo/content/ai-native/submodules.json",
    String.raw`C:\repo\content\ki-fuehrerschein\my-glossary.json`,
    String.raw`C:\repo\content\ki-fuehrerschein\not-quiz\questions.json`,
    String.raw`C:\repo\content\eu-ai-act-kurs\not-course.json`,
  ])("does not match suffix lookalike %s", (path) => {
    expect(isFreshnessExcluded(path)).toBe(false);
  });
});
