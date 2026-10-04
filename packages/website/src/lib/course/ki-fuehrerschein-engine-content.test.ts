import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { BaseLesson } from "./types";
import {
  countWords,
  validateEngineLesson,
} from "@/lib/lesson-engine/lesson";
import {
  LESSON_ENGINE_FORMAT,
  LESSON_ENGINE_LIMITS,
} from "@/lib/lesson-engine/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";

// KI-Führerschein is the lesson-engine pilot: four module files, two
// lessons each, German source with an English mirror of identical shape.

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const MODULE_FILES = [
  "block-1-daten-lessons.json",
  "block-2-briefen-lessons.json",
  "block-3-pruefen-lessons.json",
  "block-4-regeln-lessons.json",
] as const;

/** Machine data: ids, kinds, keys, formulas. Must be identical in DE and EN. */
const IMMUTABLE_STRING_KEYS = new Set([
  "blockId",
  "bucket",
  "claimId",
  "expected",
  "format",
  "formula",
  "id",
  "kind",
  "lastReviewed",
  "next",
  "nextReview",
  "owner",
  "result",
  "reviewCadence",
  "riskClass",
  "sourceId",
  "start",
  "tone",
  "type",
  "url",
  "verdict",
  "when",
]);

const ALLOWED_SOURCE_HOSTS = new Set([
  "eur-lex.europa.eu",
  "www.gesetze-im-internet.de",
]);

interface ModuleFile {
  readonly blockId: string;
  readonly format: string;
  readonly lessons: BaseLesson[];
}

function load(relativePath: string): ModuleFile {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as ModuleFile;
}

function shape(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(shape);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shape(child)]),
    );
  }
  return typeof value;
}

function machineData(
  value: JsonValue,
  path = "$",
  result: Record<string, JsonValue> = {},
): Record<string, JsonValue> {
  if (Array.isArray(value)) {
    value.forEach((child, index) => machineData(child, `${path}[${index}]`, result));
    return result;
  }
  if (value === null || typeof value !== "object") {
    if (typeof value !== "string") result[path] = value;
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (IMMUTABLE_STRING_KEYS.has(key) && typeof child === "string") {
      result[childPath] = child;
    }
    machineData(child, childPath, result);
  }
  return result;
}

function strings(value: JsonValue, result: string[] = []): string[] {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach((child) => strings(child, result));
  else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => strings(child, result));
  }
  return result;
}

const pairs = MODULE_FILES.map((filename) => ({
  filename,
  de: load(`content/ki-fuehrerschein/${filename}`),
  en: load(`content/ki-fuehrerschein/en/${filename}`),
}));

describe("KI-Führerschein lesson-engine content", () => {
  it("authors exactly the canonical lessons, in order, in both locales", () => {
    for (const locale of ["de", "en"] as const) {
      expect(
        pairs.flatMap((pair) => pair[locale].lessons.map((lesson) => lesson.id)),
      ).toEqual(CANONICAL_LESSON_IDS["ki-fuehrerschein"]);
    }
  });

  it.each(pairs)("$filename is a lesson-engine file with DE/EN parity", ({ de, en }) => {
    expect(de.format).toBe(LESSON_ENGINE_FORMAT);
    expect(shape(en as unknown as JsonValue)).toEqual(shape(de as unknown as JsonValue));
    expect(machineData(en as unknown as JsonValue)).toEqual(
      machineData(de as unknown as JsonValue),
    );
    for (const [index, lesson] of de.lessons.entries()) {
      const translated = en.lessons[index];
      expect(translated.title).not.toBe(lesson.title);
      expect(translated.concept?.body).not.toBe(lesson.concept?.body);
      expect(translated.exercise?.instructions).not.toBe(
        lesson.exercise?.instructions,
      );
      translated.checks?.forEach((check, checkIndex) => {
        expect(check.prompt).not.toBe(lesson.checks?.[checkIndex]?.prompt);
      });
    }
  });

  it.each(pairs)("$filename satisfies the authoring contract", ({ de, en }) => {
    for (const lesson of [...de.lessons, ...en.lessons]) {
      expect(validateEngineLesson(lesson), lesson.id).toEqual([]);
      expect(countWords(lesson.concept?.body ?? "")).toBeLessThanOrEqual(
        LESSON_ENGINE_LIMITS.conceptMaxWords,
      );
      expect(lesson.checks).toHaveLength(LESSON_ENGINE_LIMITS.checkCount);
      expect(lesson.durationMinutes).toBeGreaterThanOrEqual(4);
      expect(lesson.durationMinutes).toBeLessThanOrEqual(8);
    }
  });

  it("keeps the course at about 45 minutes", () => {
    const minutes = pairs
      .flatMap((pair) => pair.de.lessons)
      .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    expect(minutes).toBe(45);
  });

  it("cites only primary legal sources over https", () => {
    for (const { de, en } of pairs) {
      for (const lesson of [...de.lessons, ...en.lessons]) {
        for (const source of lesson.concept?.sources ?? []) {
          if (!source.url) continue;
          const url = new URL(source.url);
          expect(url.protocol, source.url).toBe("https:");
          expect(ALLOWED_SOURCE_HOSTS.has(url.host), source.url).toBe(true);
        }
      }
    }
  });

  it("uses synthetic contact and payment data only", () => {
    // Learner copy only (the file metadata names the content owner).
    const copy = pairs.flatMap(({ de, en }) => [
      ...strings(de.lessons as unknown as JsonValue),
      ...strings(en.lessons as unknown as JsonValue),
    ]);
    const joined = copy.join("\n");
    for (const email of joined.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? []) {
      expect(email, "only reserved example domains").toMatch(/@example\.(?:com|org|net)$/);
    }
    for (const iban of joined.match(/\b[A-Z]{2}\d{2}(?:\s?\d{4}){4}\s?\d{2}\b/g) ?? []) {
      expect(iban, "IBANs use the invalid 00 check digits").toMatch(/^[A-Z]{2}00/);
    }
    expect(joined).not.toMatch(/[—–]/);
  });

  it("dates the Article 4 statement and names its amendment", () => {
    const regeln = pairs[3];
    for (const lesson of [regeln.de.lessons[0], regeln.en.lessons[0]]) {
      expect(lesson.concept?.body).toMatch(/2\. Februar 2025|2 February 2025/);
      expect(lesson.concept?.body).toContain("2026/1744");
    }
  });
});
