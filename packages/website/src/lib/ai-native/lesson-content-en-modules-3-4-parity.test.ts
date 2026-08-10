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

const LESSON_FILES = [
  "modul-3-lessons.json",
  "modul-4-lessons.json",
] as const;

const LEARNER_COPY_KEYS = new Set([
  "content",
  "constraints",
  "context",
  "criteria",
  "critique",
  "description",
  "explanation",
  "format",
  "hint",
  "keyConcepts",
  "keyTakeaway",
  "label",
  "prompt",
  "question",
  "questionText",
  "role",
  "scenario",
  "solution",
  "subtitle",
  "task",
  "text",
  "title",
  "voiceAnchor",
]);

const TECHNICAL_GERMAN_TOKENS = [
  "#archivieren",
  "#entscheidung",
  "#idee",
  "#warten-auf",
  "ansprechpartner",
  "Branche",
  "datum",
  "dringlichkeit",
  "entscheidungen",
  "faelligkeit",
  "fälligkeit",
  "Finanzen",
  "firma",
  "hoch",
  "INTERN",
  "Kalenderwoche",
  "kontext",
  "KUNDE",
  "Kunde-Alpha-Fiktivfall",
  "Kunde-Beta-Mengenrabatt",
  "Kunde-Gamma-Verhandlung",
  "mein-vault",
  "mittel",
  "nein",
  "niedrig",
  "offene_fragen",
  "prioritaet",
  "Projekt-Angebot-Mueller",
  "Projekt-Kunde-Alpha",
  "projekt",
  "status: aktiv",
  "Strategie",
  "teilnehmer",
  "thema",
  "verantwortlich",
  "Vertrieb",
  "Vorlagen",
  "wer_antwortet",
] as const;

const GERMAN_LEAK_PATTERN =
  /[äöüß]|\b(?:aber|alle|alles|als|auch|anhang|anbieter|aus|bei|beantwortbar|bestätigt|betreiber|brauchst|das|datum|dein|deine|dem|den|der|des|dieses|diese|dann|dringlichkeit|dsfa|dsgvo|du|durch|eine|einen|einer|erfasst|erst|faelligkeit|firma|fragen|für|gegen|gehört|gib|hier|hoch|im|ist|jede|kein|keine|kontext|kunde|kunden|markiere|mehr|mir|mit|mittel|nach|nicht|niedrig|noch|nur|oder|preis|prioritaet|prüfen|quelle|schritt|seit|sind|soll|sollte|sondern|teilnehmer|thema|über|und|unter|verordnung|von|vor|wenn|wird|zu|zum|zur|zwischen)\b/i;

function loadJson(locale: "de" | "en", filename: string): JsonValue {
  const relativePath =
    locale === "de"
      ? `content/ai-native/${filename}`
      : `content/ai-native/en/${filename}`;

  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as JsonValue;
}

function maskLearnerValue(value: JsonValue): JsonValue {
  if (typeof value === "string") return "<learner-copy>";
  if (Array.isArray(value)) return value.map(maskLearnerValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        maskLearnerValue(child),
      ]),
    );
  }
  return value;
}

function maskLearnerCopy(value: JsonValue, key?: string): JsonValue {
  if (key && LEARNER_COPY_KEYS.has(key)) return maskLearnerValue(value);

  if (Array.isArray(value)) return value.map((child) => maskLearnerCopy(child));

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, child]) => [
        entryKey,
        maskLearnerCopy(child, entryKey),
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
    collectStringLeaves(value, path, result);
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

function collectStringLeaves(
  value: JsonValue,
  path: string,
  result: Record<string, string>,
): void {
  if (typeof value === "string") {
    result[path] = value;
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectStringLeaves(child, `${path}[${index}]`, result);
    });
    return;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectStringLeaves(child, `${path}.${key}`, result);
    }
  }
}

function collectMatches(value: JsonValue, pattern: RegExp): string[] {
  const matches: string[] = [];

  function visit(child: JsonValue): void {
    if (typeof child === "string") {
      matches.push(...(child.match(pattern) ?? []));
      return;
    }
    if (Array.isArray(child)) {
      child.forEach(visit);
      return;
    }
    if (child !== null && typeof child === "object") {
      Object.values(child).forEach(visit);
    }
  }

  visit(value);
  return matches.sort();
}

function stripTechnicalGermanTokens(value: string): string {
  return TECHNICAL_GERMAN_TOKENS.reduce(
    (result, token) => result.replaceAll(token, ""),
    value,
  );
}

describe("AI-Native English lesson modules 3 and 4", () => {
  for (const filename of LESSON_FILES) {
    it(`${filename} preserves exact structure and machine values`, () => {
      const german = loadJson("de", filename);
      const english = loadJson("en", filename);

      expect(maskLearnerCopy(english)).toEqual(maskLearnerCopy(german));
      expect(english).not.toEqual(german);
    });

    it(`${filename} preserves URLs, placeholders, dates and numeric facts`, () => {
      const german = loadJson("de", filename);
      const english = loadJson("en", filename);

      const invariantPatterns = [
        /https?:\/\/[^\s)\]|`]+/g,
        /\{\{[^}]+\}\}/g,
        /20\d{2}(?:-\d{2}(?:-\d{2})?)?/g,
        /\(EU\)\s*\d{4}\/\d+/g,
      ];

      for (const pattern of invariantPatterns) {
        expect(collectMatches(english, pattern)).toEqual(
          collectMatches(german, pattern),
        );
      }
    });

    it(`${filename} contains complete English learner copy`, () => {
      const german = collectLearnerCopy(loadJson("de", filename));
      const english = collectLearnerCopy(loadJson("en", filename));

      expect(Object.keys(english)).toEqual(Object.keys(german));
      for (const [path, translatedText] of Object.entries(english)) {
        expect(translatedText.trim(), `${path} must not be empty`).not.toBe("");
        expect(
          stripTechnicalGermanTokens(translatedText),
          `${path} contains untranslated German learner copy`,
        ).not.toMatch(GERMAN_LEAK_PATTERN);
      }
    });
  }
});
