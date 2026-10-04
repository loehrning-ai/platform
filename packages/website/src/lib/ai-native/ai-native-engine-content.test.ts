import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { BaseLesson } from "@/lib/course/types";
import {
  countWords,
  validateEngineLesson,
} from "@/lib/lesson-engine/lesson";
import {
  LESSON_ENGINE_FORMAT,
  LESSON_ENGINE_LIMITS,
} from "@/lib/lesson-engine/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";

// "Mit KI arbeiten" / "Working with AI" (slug ai-native) runs on the lesson
// engine: four module files, nine lessons, tool-neutral, German source with an
// English mirror of identical shape.

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const MODULE_FILES = [
  "modul-1-lessons.json",
  "modul-2-lessons.json",
  "modul-3-lessons.json",
  "modul-4-lessons.json",
] as const;

/** Machine data: ids, kinds, keys, formulas. Must be identical in DE and EN. */
const IMMUTABLE_STRING_KEYS = new Set([
  "blockId",
  "bucket",
  "claimId",
  "expected",
  "filename",
  "format",
  "formula",
  "goal",
  "id",
  "kind",
  "lastReviewed",
  "moduleId",
  "next",
  "nextReview",
  "owner",
  "pass",
  "result",
  "reviewCadence",
  "riskClass",
  "sourceId",
  "score",
  "start",
  "tone",
  "type",
  "url",
  "verdict",
  "when",
]);

// Primary sources only: peer-reviewed papers (DOI or arXiv), OWASP, EUR-Lex.
const ALLOWED_SOURCE_HOSTS = new Set([
  "arxiv.org",
  "doi.org",
  "eur-lex.europa.eu",
  "genai.owasp.org",
]);

interface ModuleFile {
  readonly moduleId: string;
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
  de: load(`content/ai-native/${filename}`),
  en: load(`content/ai-native/en/${filename}`),
}));

describe("AI-Native (Mit KI arbeiten) lesson-engine content", () => {
  it("authors exactly the canonical lessons, in order, in both locales", () => {
    for (const locale of ["de", "en"] as const) {
      expect(
        pairs.flatMap((pair) => pair[locale].lessons.map((lesson) => lesson.id)),
      ).toEqual(CANONICAL_LESSON_IDS["ai-native"]);
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

  it.each(pairs)("$filename explains every wrong check option", ({ de, en }) => {
    for (const lesson of [...de.lessons, ...en.lessons]) {
      for (const check of lesson.checks ?? []) {
        for (const option of check.options.filter((entry) => !entry.correct)) {
          expect(
            option.feedback?.trim(),
            `${lesson.id} ${check.id} ${option.id}`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("keeps the course at about 70 minutes", () => {
    const minutes = pairs
      .flatMap((pair) => pair.de.lessons)
      .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    expect(minutes).toBe(68);
  });

  it("cites only primary sources over https, and every lesson cites one", () => {
    for (const { de, en } of pairs) {
      for (const lesson of [...de.lessons, ...en.lessons]) {
        expect(lesson.concept?.sources?.length, lesson.id).toBeGreaterThan(0);
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

  it("stays tool-neutral: no product tutorials", () => {
    const copy = pairs
      .flatMap(({ de, en }) => [
        ...strings(de.lessons as unknown as JsonValue),
        ...strings(en.lessons as unknown as JsonValue),
      ])
      .join("\n");
    expect(copy).not.toMatch(/\b(?:Claude|Obsidian|n8n|ChatGPT|Copilot|Gemini|LM Studio|CLAUDE\.md)\b/);
  });

  it("states the study figures the way the cited sources report them", () => {
    const body = (index: number, locale: "de" | "en") =>
      pairs[index][locale].lessons.map((lesson) => lesson.concept?.body ?? "").join("\n");
    for (const locale of ["de", "en"] as const) {
      // Noy and Zhang 2023 (Science): 453 participants, -40% time, +18% quality.
      // METR 2025: 16 developers, 19% slower, expected 24%, believed 20%.
      expect(body(0, locale)).toMatch(/453/);
      expect(body(0, locale)).toMatch(/40 ?%/);
      expect(body(0, locale)).toMatch(/18 ?%/);
      expect(body(0, locale)).toMatch(/19 ?%/);
      expect(body(0, locale)).toMatch(/24 ?%/);
      // Dell'Acqua et al. 2023: 758 consultants, 12.2% / 25.1% / 40%, 19 points.
      expect(body(0, locale)).toMatch(/758/);
      expect(body(0, locale)).toMatch(/12[.,]2 ?%/);
      expect(body(0, locale)).toMatch(/25[.,]1 ?%/);
      // Magesh et al. 2025: 17 to 33% of queries.
      expect(body(2, locale)).toMatch(/17 (?:bis|to) 33 ?%/);
    }
  });

  it("cites GDPR articles with the same article numbers in both locales", () => {
    const [de, en] = (["de", "en"] as const).map((locale) =>
      JSON.stringify(pairs[3][locale].lessons[1].concept),
    );
    expect(de).toContain("Art. 28 DSGVO");
    expect(en).toContain("GDPR Art. 28");
    expect(de).toContain("Art. 44");
    expect(en).toContain("Art. 44");
  });
});
