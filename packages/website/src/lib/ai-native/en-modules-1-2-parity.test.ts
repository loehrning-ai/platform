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
  "modul-1-lessons.json",
  "modul-2-lessons.json",
] as const;

const LEARNER_COPY_KEYS = new Set([
  "content",
  "critique",
  "description",
  "explanation",
  "hint",
  "keyConcepts",
  "keyTakeaway",
  "label",
  "pattern",
  "prompt",
  "question",
  "questionText",
  "scenario",
  "startingPrompt",
  "subtitle",
  "text",
  "title",
  "voiceAnchor",
]);

const UNCHANGED_PRODUCT_AND_TECHNICAL_NAMES = new Set([
  "AI-native",
  "Artifact",
  "Automation",
  "CLAUDE.md",
  "Claude Code",
  "Claude Project",
  "Claude.ai",
  "Connector",
  "Delegation",
  "Design Skill",
  "Drafting",
  "Fluency",
  "Governance",
  "Knowledge",
  "MCP",
  "Memory",
  "OAuth",
  "Orchestrator",
  "Plugin",
  "PROMPT.md",
  "RCTFC",
  "SKILL.md",
  "SQL",
  "Skill",
  "\\{\\{",
  "destatis-mcp",
  "frontend-design",
  "handelsregister-mcp",
]);

function loadJson(locale: "de" | "en", filename: string): JsonValue {
  const relativePath =
    locale === "de"
      ? `content/ai-native/${filename}`
      : `content/ai-native/en/${filename}`;

  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as JsonValue;
}

function structuralShape(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(structuralShape);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, structuralShape(child)]),
    );
  }

  return typeof value;
}

function replaceLearnerCopy(value: JsonValue, key?: string): JsonValue {
  if (key && LEARNER_COPY_KEYS.has(key)) {
    if (Array.isArray(value)) {
      return value.map(() => "<learner-copy>");
    }
    return "<learner-copy>";
  }

  if (Array.isArray(value)) {
    return value.map((child) => replaceLearnerCopy(child));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, child]) => [
        entryKey,
        replaceLearnerCopy(child, entryKey),
      ]),
    );
  }

  return value;
}

function collectLearnerCopy(
  value: JsonValue,
  path = "$",
  key?: string,
  result: Record<string, string> = {},
): Record<string, string> {
  if (key && LEARNER_COPY_KEYS.has(key)) {
    if (typeof value === "string") {
      result[path] = value;
    } else if (Array.isArray(value)) {
      value.forEach((child, index) => {
        if (typeof child === "string") {
          result[`${path}[${index}]`] = child;
        }
      });
    }
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectLearnerCopy(child, `${path}[${index}]`, undefined, result);
    });
    return result;
  }

  if (value !== null && typeof value === "object") {
    for (const [entryKey, child] of Object.entries(value)) {
      collectLearnerCopy(child, `${path}.${entryKey}`, entryKey, result);
    }
  }

  return result;
}

function collectStrings(value: JsonValue, result: string[] = []): string[] {
  if (typeof value === "string") {
    result.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectStrings(child, result));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => collectStrings(child, result));
  }

  return result;
}

function collectAddresses(value: JsonValue): string[] {
  return [
    ...new Set(
      collectStrings(value).flatMap(
        (text) =>
          text.match(
            /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[a-z0-9._~:/?#[\]@!$&'()*+=%-]*)?/gi,
          ) ?? [],
      ),
    ),
  ].sort();
}

function collectCalendarYears(value: JsonValue): string[] {
  return [
    ...new Set(
      collectStrings(value).flatMap(
        (text) => text.match(/\b(?:19|20)\d{2}\b/g) ?? [],
      ),
    ),
  ].sort();
}

describe("AI-Native English lesson bundles for modules 1 and 2", () => {
  for (const filename of CONTENT_FILES) {
    it(`${filename} preserves structure, machine fields, dates and addresses`, () => {
      const source = loadJson("de", filename);
      const translation = loadJson("en", filename);

      expect(structuralShape(translation)).toEqual(structuralShape(source));
      expect(replaceLearnerCopy(translation)).toEqual(
        replaceLearnerCopy(source),
      );
      expect(collectAddresses(translation)).toEqual(collectAddresses(source));
      expect(collectCalendarYears(translation)).toEqual(
        collectCalendarYears(source),
      );
    });

    it(`${filename} has complete English learner copy`, () => {
      const sourceCopy = collectLearnerCopy(loadJson("de", filename));
      const translatedCopy = collectLearnerCopy(loadJson("en", filename));

      expect(Object.keys(translatedCopy)).toEqual(Object.keys(sourceCopy));

      for (const [path, translatedText] of Object.entries(translatedCopy)) {
        expect(translatedText.trim(), `${path} must not be empty`).not.toBe("");
        if (translatedText === sourceCopy[path]) {
          expect(
            UNCHANGED_PRODUCT_AND_TECHNICAL_NAMES,
            `${path} must be translated unless it is a product or technical name`,
          ).toContain(translatedText);
        }
      }
    });
  }
});
