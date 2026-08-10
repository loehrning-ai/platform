import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const CONTENT_FILES = [
  "block-1-arbeit-lessons.json",
  "block-2-deepfakes-lessons.json",
  "block-3-ethik-lessons.json",
  "quiz/questions.json",
] as const;

const LEARNER_COPY_KEYS = new Set([
  "content",
  "explanation",
  "keyConcepts",
  "keyTakeaway",
  "questionText",
  "subtitle",
  "text",
  "title",
]);

const UNTRANSLATED_PROPER_NAMES = new Set([
  "Algorithmic Justice League (ajl.org)",
  "AlgorithmWatch",
  "BetrVG",
  "Bias",
  "COMPAS",
  "Data & Society Research Institute",
  "Deepfake",
  "Google Reverse Image Search",
  "Google Lens",
  "Governance",
  "Hive Moderation",
  "Hive Moderation (hivemoderation.com/demo)",
  "InVID WeVerify",
  "InVID/WeVerify (weverify.eu)",
  "Joy Buolamwini",
  "KUG",
  "netzpolitik.org",
  "TinEye (tineye.com)",
]);

const CITATION_IDENTIFIERS = [
  "OECD Employment Outlook 2023",
  "Frey/Osborne, 2013",
  "BERUFENET",
  "(EU) 2024/1689",
  "(EU) 2026/1744",
  "KI-MIG",
  "(EU) 2019/1937",
  "Angwin et al., ProPublica, 2016",
  "Chouldechova, A. (2017). Fair prediction with disparate impact. Big Data, 5(2)",
  "Dastin, J., Reuters",
  "Buolamwini, J. & Gebru, T. (2018). Gender Shades. Proceedings of Machine Learning Research, 81",
] as const;

function loadJson(locale: "de" | "en", filename: string): JsonValue {
  const relativePath =
    locale === "de"
      ? `content/ki-und-gesellschaft/${filename}`
      : `content/ki-und-gesellschaft/en/${filename}`;

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
      Object.entries(value).map(([key, child]) => [
        key,
        structuralShape(child),
      ]),
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

function collectAddresses(value: JsonValue, result: string[] = []): string[] {
  if (typeof value === "string") {
    result.push(
      ...(value.match(
        /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[a-z0-9._~:/?#[\]@!$&'()*+=%-]*)?/gi,
      ) ?? []),
    );
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectAddresses(child, result));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => collectAddresses(child, result));
  }

  return result;
}

describe("KI und Gesellschaft English content bundle", () => {
  for (const filename of CONTENT_FILES) {
    it(`${filename} preserves structure, machine data, addresses and citations`, () => {
      const source = loadJson("de", filename);
      const translation = loadJson("en", filename);

      expect(structuralShape(translation)).toEqual(structuralShape(source));
      expect(replaceLearnerCopy(translation)).toEqual(
        replaceLearnerCopy(source),
      );
      expect(collectAddresses(translation).sort()).toEqual(
        collectAddresses(source).sort(),
      );

      const sourceText = JSON.stringify(source);
      const translatedText = JSON.stringify(translation);
      for (const identifier of CITATION_IDENTIFIERS) {
        if (sourceText.includes(identifier)) {
          expect(
            translatedText,
            `${filename} must preserve citation identifier ${identifier}`,
          ).toContain(identifier);
        }
      }
    });

    it(`${filename} contains complete non-empty English learner copy`, () => {
      const sourceCopy = collectLearnerCopy(loadJson("de", filename));
      const translatedCopy = collectLearnerCopy(loadJson("en", filename));

      expect(Object.keys(translatedCopy)).toEqual(Object.keys(sourceCopy));

      for (const [path, translatedText] of Object.entries(translatedCopy)) {
        expect(translatedText.trim(), `${path} must not be empty`).not.toBe("");
        if (translatedText === sourceCopy[path]) {
          expect(
            UNTRANSLATED_PROPER_NAMES,
            `${path} must be translated unless it is a proper name`,
          ).toContain(translatedText);
        }
      }
    });
  }
});
