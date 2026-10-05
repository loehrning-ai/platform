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

// KI und Gesellschaft runs on the lesson engine: three module files, eight
// lessons, German source with an English mirror of identical shape.

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const MODULE_FILES = [
  "block-1-arbeit-lessons.json",
  "block-2-fakes-lessons.json",
  "block-3-fairness-lessons.json",
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
  "proceedings.mlr.press",
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
  de: load(`content/ki-und-gesellschaft/${filename}`),
  en: load(`content/ki-und-gesellschaft/en/${filename}`),
}));

describe("KI und Gesellschaft lesson-engine content", () => {
  it("authors exactly the canonical lessons, in order, in both locales", () => {
    for (const locale of ["de", "en"] as const) {
      expect(
        pairs.flatMap((pair) => pair[locale].lessons.map((lesson) => lesson.id)),
      ).toEqual(CANONICAL_LESSON_IDS["ki-und-gesellschaft"]);
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

  it("keeps the course at about 40 minutes", () => {
    const minutes = pairs
      .flatMap((pair) => pair.de.lessons)
      .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    expect(minutes).toBe(40);
  });

  it("cites only primary sources over https", () => {
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

  it("starts every lesson with evidence: each concept names at least one source", () => {
    for (const { de, en } of pairs) {
      for (const lesson of [...de.lessons, ...en.lessons]) {
        expect(lesson.concept?.sources?.length ?? 0, lesson.id).toBeGreaterThan(0);
      }
    }
  });

  it("uses a different exercise mechanic in every module and no read buttons", () => {
    const kinds = pairs.flatMap((pair) =>
      pair.de.lessons.map((lesson) => lesson.exercise?.kind),
    );
    expect(kinds).toEqual([
      "bucket-sort",
      "calculator",
      "claim-checker",
      "calculator",
      "decision-wizard",
      "calculator",
      "threshold-lab",
      "bucket-sort",
    ]);
    for (const { de } of pairs) {
      for (const lesson of de.lessons) {
        const raw = lesson as unknown as Record<string, unknown>;
        expect(raw.sections, lesson.id).toBeUndefined();
        expect(raw.quiz, lesson.id).toBeUndefined();
        expect(raw.widgets, lesson.id).toBeUndefined();
      }
    }
  });

  it("keeps the published Gender Shades figures and labels the synthetic lab data", () => {
    const [, , fairness] = pairs;
    const genderShades = { de: fairness.de.lessons[0], en: fairness.en.lessons[0] };
    expect(genderShades.de.concept?.body).toContain("0,8 %");
    expect(genderShades.de.concept?.body).toContain("34,7 %");
    expect(genderShades.en.concept?.body).toContain("0.8%");
    expect(genderShades.en.concept?.body).toContain("34.7%");
    const props = genderShades.de.exercise?.props as {
      outputs: Array<{ formula: string }>;
    };
    expect(props.outputs[0].formula).toBe("share * 0.347 + (1 - share) * 0.008");

    const threshold = fairness.de.lessons[1].exercise?.props as { note?: string };
    expect(threshold.note).toMatch(/Synthetische Daten/);
    const thresholdEn = fairness.en.lessons[1].exercise?.props as { note?: string };
    expect(thresholdEn.note).toMatch(/Synthetic data/);
  });

  it("dates the high-risk application statement and links Art. 50 to the EU AI Act course", () => {
    const [, fakes, fairness] = pairs;
    for (const lesson of [fairness.de.lessons[2], fairness.en.lessons[2]]) {
      expect(lesson.concept?.body).toMatch(/2\. Dezember 2027|2 December 2027/);
      expect(lesson.concept?.body).toContain("2026/1744");
    }
    expect(fakes.de.lessons[2].concept?.body).toContain("Art. 50 KI-Verordnung");
    expect(fakes.de.lessons[2].concept?.body).toContain("Kurs EU AI Act");
    expect(fakes.en.lessons[2].concept?.body).toContain("EU AI Act course");
    // Art. 50 and the role details are linked, not re-taught.
    for (const lesson of [fakes.de.lessons[2], fairness.de.lessons[2]]) {
      expect(lesson.concept?.body).toContain("](/eu-ai-act-kurs)");
    }
    for (const lesson of [fakes.en.lessons[2], fairness.en.lessons[2]]) {
      expect(lesson.concept?.body).toContain("](/en/eu-ai-act-kurs)");
    }
  });
});
