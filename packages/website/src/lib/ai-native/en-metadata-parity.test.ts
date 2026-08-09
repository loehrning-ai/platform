import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const CONTENT_FILES = [
  "course.json",
  "modules.json",
  "glossary.json",
  "challenges.json",
  "quiz/questions.json",
] as const;

const COPY_KEYS: Readonly<Record<(typeof CONTENT_FILES)[number], ReadonlySet<string>>> = {
  "course.json": new Set(["title", "tagline", "includes", "note"]),
  "modules.json": new Set([
    "title",
    "subtitle",
    "description",
    "voiceAnchor",
    "topics",
  ]),
  "glossary.json": new Set(["title", "definition"]),
  "challenges.json": new Set([
    "title",
    "rotationNote",
    "role",
    "scenario",
    "stack",
    "timeBudget",
    "modelSolution",
    "rubric",
  ]),
  "quiz/questions.json": new Set([
    "questionText",
    "text",
    "explanation",
  ]),
};

const ALLOWED_UNCHANGED_COPY = new Set([
  "AI Challenge of the Week",
  "Buffer",
  "Claude",
  "Claude Code",
  "Excel",
  "Federal Reporting Information Act.",
  "Final Review Internal Audit.",
  "Free Risk Insurance Agreement.",
  "LinkedIn Analytics",
  "Managed Cloud Platform.",
  "Manual Copy Protocol.",
  "Obsidian",
  "Obsidian Web Clipper",
  "Outlook",
  "People, Assets, Risks, Audits.",
  "Plan, Act, Review, Adjust.",
  "Print, Archive, Read, Approve.",
  "n8n",
]);

function loadJson(
  locale: "de" | "en",
  filename: (typeof CONTENT_FILES)[number],
): JsonValue {
  const path =
    locale === "de"
      ? `content/ai-native/${filename}`
      : `content/ai-native/en/${filename}`;
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as JsonValue;
}

function structuralShape(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(structuralShape);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, structuralShape(child)]),
    );
  }
  return typeof value;
}

function collectCopy(
  value: JsonValue,
  copyKeys: ReadonlySet<string>,
  path = "$",
  key?: string,
  result: Record<string, string> = {},
): Record<string, string> {
  if (key && copyKeys.has(key)) {
    if (typeof value === "string") result[path] = value;
    if (Array.isArray(value)) {
      value.forEach((child, index) => {
        if (typeof child === "string") result[`${path}[${index}]`] = child;
      });
    }
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      collectCopy(child, copyKeys, `${path}[${index}]`, undefined, result),
    );
  } else if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([entryKey, child]) =>
      collectCopy(child, copyKeys, `${path}.${entryKey}`, entryKey, result),
    );
  }
  return result;
}

function collectStrings(value: JsonValue, result: string[] = []): string[] {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach((child) => collectStrings(child, result));
  else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => collectStrings(child, result));
  }
  return result;
}

function collectMatches(value: JsonValue, expression: RegExp): string[] {
  return collectStrings(value).flatMap((text) => text.match(expression) ?? []);
}

describe("AI-Native English metadata and assessment bundle", () => {
  it.each(CONTENT_FILES)("%s preserves the exact JSON structure", (filename) => {
    expect(structuralShape(loadJson("en", filename))).toEqual(
      structuralShape(loadJson("de", filename)),
    );
  });

  it("preserves course identity, counts, pricing state and prerequisite identity", () => {
    const source = loadJson("de", "course.json") as Record<string, JsonValue>;
    const translation = loadJson("en", "course.json") as Record<string, JsonValue>;

    for (const key of [
      "courseId",
      "createdAt",
      "version",
      "totalLessons",
      "totalModules",
      "targetDurationHours",
    ]) {
      expect(translation[key], key).toEqual(source[key]);
    }
    expect((translation.pricing as Record<string, JsonValue>).free).toBe(
      (source.pricing as Record<string, JsonValue>).free,
    );
    expect((translation.prerequisites as Record<string, JsonValue>).recommended).toBe(
      (source.prerequisites as Record<string, JsonValue>).recommended,
    );
    expect(translation.language).toBe("en");
    expect(translation.supportedLanguages).toEqual(["en"]);
  });

  it("preserves module identity, order, durations, counts and gating", () => {
    type Module = Record<string, JsonValue>;
    const source = (loadJson("de", "modules.json") as { modules: Module[] }).modules;
    const translation = (loadJson("en", "modules.json") as { modules: Module[] })
      .modules;

    expect(
      translation.map(({ id, number, durationMinutes, lessonCount, premiumGated }) => ({
        id,
        number,
        durationMinutes,
        lessonCount,
        premiumGated,
      })),
    ).toEqual(
      source.map(({ id, number, durationMinutes, lessonCount, premiumGated }) => ({
        id,
        number,
        durationMinutes,
        lessonCount,
        premiumGated,
      })),
    );
  });

  it("preserves glossary identity, categories and relation keys", () => {
    type Glossary = {
      _meta: Record<string, JsonValue>;
      categories: Record<string, JsonValue>;
      entries: Array<Record<string, JsonValue>>;
    };
    const source = loadJson("de", "glossary.json") as Glossary;
    const translation = loadJson("en", "glossary.json") as Glossary;

    expect({ version: translation._meta.version, date: translation._meta.last_updated }).toEqual({
      version: source._meta.version,
      date: source._meta.last_updated,
    });
    expect(Object.keys(translation.categories)).toEqual(Object.keys(source.categories));
    expect(
      translation.entries.map(({ term, category, related }) => ({ term, category, related })),
    ).toEqual(
      source.entries.map(({ term, category, related }) => ({ term, category, related })),
    );
  });

  it("preserves challenge rotation, order and array cardinality", () => {
    type ChallengeBundle = {
      _meta: Record<string, JsonValue>;
      challenges: Array<Record<string, JsonValue>>;
    };
    const source = loadJson("de", "challenges.json") as ChallengeBundle;
    const translation = loadJson("en", "challenges.json") as ChallengeBundle;

    expect({
      version: translation._meta.version,
      authored: translation._meta.authored,
      rotationWeeks: translation._meta.rotationWeeks,
    }).toEqual({
      version: source._meta.version,
      authored: source._meta.authored,
      rotationWeeks: source._meta.rotationWeeks,
    });
    expect(translation._meta.language).toBe("en");
    expect(translation.challenges.map(({ weekOffset }) => weekOffset)).toEqual(
      source.challenges.map(({ weekOffset }) => weekOffset),
    );
    expect(translation.challenges.map(({ stack }) => (stack as JsonValue[]).length)).toEqual(
      source.challenges.map(({ stack }) => (stack as JsonValue[]).length),
    );
    expect(translation.challenges.map(({ rubric }) => (rubric as JsonValue[]).length)).toEqual(
      source.challenges.map(({ rubric }) => (rubric as JsonValue[]).length),
    );
  });

  it("preserves quiz IDs, metadata, answer order and exact correctness", () => {
    type Question = Record<string, JsonValue> & {
      answerOptions: Array<Record<string, JsonValue>>;
    };
    const source = loadJson("de", "quiz/questions.json") as Question[];
    const translation = loadJson("en", "quiz/questions.json") as Question[];
    const machineProjection = (questions: Question[]) =>
      questions.map(
        ({ id, questionType, difficulty, version, active, answerOptions }) => ({
          id,
          questionType,
          difficulty,
          version,
          active,
          answers: answerOptions.map(({ id: answerId, isCorrect }) => ({
            id: answerId,
            isCorrect,
          })),
        }),
      );

    expect(machineProjection(translation)).toEqual(machineProjection(source));
    translation.forEach((question) => {
      expect(question.answerOptions.filter(({ isCorrect }) => isCorrect)).toHaveLength(1);
    });
  });

  it.each(CONTENT_FILES)("%s translates every learner-copy field", (filename) => {
    const source = collectCopy(loadJson("de", filename), COPY_KEYS[filename]);
    const translation = collectCopy(loadJson("en", filename), COPY_KEYS[filename]);

    expect(Object.keys(translation)).toEqual(Object.keys(source));
    for (const [path, translatedText] of Object.entries(translation)) {
      expect(translatedText.trim(), `${path} must not be empty`).not.toBe("");
      if (translatedText === source[path]) {
        expect(ALLOWED_UNCHANGED_COPY, `${path} must contain translated prose`).toContain(
          translatedText,
        );
      }
    }
  });

  it("translates every glossary category label", () => {
    type Bundle = { categories: Record<string, string> };
    const source = loadJson("de", "glossary.json") as Bundle;
    const translation = loadJson("en", "glossary.json") as Bundle;
    for (const category of Object.keys(source.categories)) {
      expect(translation.categories[category].trim(), category).not.toBe("");
      expect(translation.categories[category], category).not.toBe(source.categories[category]);
    }
  });

  it.each(CONTENT_FILES)("%s preserves URLs and ISO dates", (filename) => {
    const source = loadJson("de", filename);
    const translation = loadJson("en", filename);
    expect(collectMatches(translation, /https?:\/\/[^\s)\]|]+/g)).toEqual(
      collectMatches(source, /https?:\/\/[^\s)\]|]+/g),
    );
    expect(collectMatches(translation, /\b\d{4}-\d{2}-\d{2}\b/g)).toEqual(
      collectMatches(source, /\b\d{4}-\d{2}-\d{2}\b/g),
    );
  });

  it.each(CONTENT_FILES)("%s contains English prose without forbidden dash punctuation", (filename) => {
    const translation = loadJson("en", filename);
    const learnerCopy = Object.values(collectCopy(translation, COPY_KEYS[filename])).join("\n");
    expect(learnerCopy).not.toMatch(/[–—]/u);
    expect(learnerCopy).not.toMatch(
      /\b(?:Du|Dein(?:e|en|er|em|es)?|Warum|Welche|Was|Wie|Wofür|Der|Die|Das|und|oder|nicht|selbst|wird|werden|kann|mit|für|Stunden|Tage|Woche|Jahre|Aufgabe|Lektion(?:en)?|Teilnahmebestätigung)\b|[äöüß]/u,
    );
  });

  it("removes unbounded speed, replacement and compliance claims", () => {
    const copy = CONTENT_FILES.filter(
      (filename) => filename !== "quiz/questions.json",
    ).flatMap((filename) =>
      Object.values(collectCopy(loadJson("en", filename), COPY_KEYS[filename])),
    ).join("\n");

    expect(copy).not.toMatch(/hidden superpower|replace every employee|always free/i);
    expect(copy).not.toMatch(/GDPR[- ]compliant by default|compliance is guaranteed/i);
    expect(copy).not.toMatch(/draft in 2 minutes|60% starting code|set up in 30 minutes/i);
  });
});
