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
import { LAB_KINDS } from "@/lib/widgets/types";

// EU AI Act Kurs on the lesson engine: five module files, two lessons each,
// German source ("Sie") with an English mirror of identical shape. Art. 4,
// Art. 50, Annex III and the operator roles are taught here and only here.

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const MODULE_FILES = [
  "block-1-geltung-lessons.json",
  "block-2-risiko-lessons.json",
  "block-3-pflichten-lessons.json",
  "block-4-aufsicht-lessons.json",
  "block-5-umsetzen-lessons.json",
] as const;

/** Machine data: ids, kinds, keys, formulas. Must be identical in DE and EN. */
const IMMUTABLE_STRING_KEYS = new Set([
  "blockId",
  "bucket",
  "date",
  "layout",
  "milestone",
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
  de: load(`content/eu-ai-act-kurs/${filename}`),
  en: load(`content/eu-ai-act-kurs/en/${filename}`),
}));

describe("EU AI Act lesson-engine content", () => {
  it("authors exactly the canonical lessons, in order, in both locales", () => {
    for (const locale of ["de", "en"] as const) {
      expect(
        pairs.flatMap((pair) => pair[locale].lessons.map((lesson) => lesson.id)),
      ).toEqual(CANONICAL_LESSON_IDS["eu-ai-act-kurs"]);
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

  it("keeps the course at about 60 minutes and gives every lesson a hands-on exercise", () => {
    const lessons = pairs.flatMap((pair) => pair.de.lessons);
    const minutes = lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    expect(minutes).toBe(60);
    expect(lessons).toHaveLength(10);
    // Only interactive lab kinds: no passive diagram or read-only widget.
    const kinds = new Set(lessons.map((lesson) => lesson.exercise?.kind));
    for (const kind of kinds) {
      expect(LAB_KINDS as readonly string[]).toContain(kind);
    }
  });

  it("keeps the module order matched to the block ids in data.ts", () => {
    for (const { de, en } of pairs) {
      for (const lesson of [...de.lessons, ...en.lessons]) {
        expect(lesson.blockId).toBe(de.blockId);
        expect(lesson.id.endsWith(`-${de.blockId.replace("block_", "")}-${lesson.id.split("-").at(-1)}`)).toBe(true);
      }
    }
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

  it("dates the Article 4 statement with the amended wording in both locales", () => {
    const duties = pairs[2];
    const [de, en] = [duties.de.lessons[0], duties.en.lessons[0]];
    expect(de.concept?.body).toContain("2. Februar 2025");
    expect(de.concept?.body).toMatch(/Maßnahmen, die die Entwicklung der KI-Kompetenz[^.]*unterstützen/);
    expect(de.concept?.body).toContain("2026/1744");
    expect(en.concept?.body).toContain("2 February 2025");
    expect(en.concept?.body).toMatch(/measures under Art\. 4 that support the development of AI literacy/);
    expect(en.concept?.body).toContain("2026/1744");
  });

  it("dates the high-risk timeline by the amending regulation, never the superseded dates", () => {
    const corpus = pairs
      .flatMap(({ de, en }) => [...strings(de.lessons as unknown as JsonValue), ...strings(en.lessons as unknown as JsonValue)])
      .join("\n");
    expect(corpus).toContain("2. Dezember 2027");
    expect(corpus).toContain("2 December 2027");
    expect(corpus).toContain("2. August 2028");
    expect(corpus).toContain("2 August 2028");
    // Annex III high-risk rules are not dated to the original 2 August 2026
    // or 2 August 2027 application dates.
    for (const line of corpus.split("\n")) {
      expect(line).not.toMatch(/Anhang III[^.|]*2\. August 202[67]|Annex III[^.|]*2 August 202[67]/);
    }
    // Never claims the Act applies in full on one date.
    expect(corpus).not.toMatch(/vollständig (?:anwendbar|in Kraft)|fully appl/i);
  });

  it("feeds the live timeline with ISO dates that match the dated concept", () => {
    const timeline = pairs[0].de.lessons[1];
    expect(timeline.exercise?.kind).toBe("timeline-check");
    const milestones = (timeline.exercise?.props as { milestones: { id: string; date: string }[] }).milestones;
    const byId = Object.fromEntries(milestones.map((entry) => [entry.id, entry.date]));
    expect(byId).toMatchObject({
      force: "2024-08-01",
      literacy: "2025-02-02",
      gpai: "2025-08-02",
      omnibus: "2026-07-27",
      general: "2026-08-02",
      annex3: "2027-12-02",
      annex1: "2028-08-02",
    });
    // The widget computes "today" on the device; content never hard-codes it.
    expect(timeline.exercise?.props).not.toHaveProperty("today");
  });

  it("computes fine caps that match Art. 99 in the calculator", () => {
    const fines = pairs[3].de.lessons[0];
    const props = fines.exercise?.props as { outputs: { id: string; formula: string }[] };
    const formulas = Object.fromEntries(props.outputs.map((output) => [output.id, output.formula]));
    expect(formulas.fixed).toBe("tier == 3 ? 35000000 : (tier == 2 ? 15000000 : 7500000)");
    expect(formulas.rate).toBe("tier == 3 ? 0.07 : (tier == 2 ? 0.03 : 0.01)");
    expect(formulas.cap).toBe("sme ? min(fixed, share) : max(fixed, share)");
  });

  it("uses Sie in German and never du", () => {
    for (const { de } of pairs) {
      const german = strings(de.lessons as unknown as JsonValue).join("\n");
      expect(german).not.toMatch(/\b(?:du|dich|dir|dein|deine|deinen|deiner)\b/);
    }
  });
});
