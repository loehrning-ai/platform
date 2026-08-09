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

type GlossaryEntry = {
  term: string;
  definition: string;
  english: string;
  category: string;
  relatedTerms?: string[];
  relatedBlocks?: string[];
};

type QuizQuestion = {
  id: string;
  questionType: string;
  difficulty: string;
  questionText: string;
  answerOptions: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  version: number;
  active: boolean;
};

function loadJson<T extends JsonValue>(relativePath: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as T;
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

function collectUrls(value: JsonValue): string[] {
  return collectStrings(value)
    .flatMap((text) => text.match(/https?:\/\/[^\s)\]|]+/g) ?? [])
    .sort();
}

function collectCitationAnchors(value: JsonValue): string[] {
  const anchors = collectStrings(value)
    .flatMap((text) => {
      const anchors: string[] = [];

      for (const match of text.matchAll(
        /\b(?:Art(?:ikel|icle)?\.?)\s+(\d+(?:\(\d+\))?)/gi,
      )) {
        anchors.push(`article:${match[1]}`);
      }
      for (const match of text.matchAll(
        /\b(?:Verordnung|Regulation)\s+\(EU\)\s+(\d{4}\/\d+)\b/gi,
      )) {
        anchors.push(`regulation:${match[1]}`);
      }
      for (const match of text.matchAll(/\b(?:Anhang|Annex)[\s-]+([IVX]+)\b/gi)) {
        anchors.push(`annex:${match[1].toUpperCase()}`);
      }
      for (const match of text.matchAll(/\bLLM\d+:\d{4}\b/g)) {
        anchors.push(`owasp:${match[0]}`);
      }

      return anchors;
    });

  return [...new Set(anchors)].sort();
}

describe("KI-Führerschein English glossary", () => {
  const source = loadJson<GlossaryEntry[]>(
    "content/ki-fuehrerschein/glossary.json",
  );
  const translation = loadJson<GlossaryEntry[]>(
    "content/ki-fuehrerschein/en/glossary.json",
  );

  it("preserves every term identity, relation and array shape", () => {
    expect(structuralShape(translation)).toEqual(structuralShape(source));
    expect(
      translation.map(
        ({ term, english, category, relatedTerms, relatedBlocks }) => ({
          term,
          english,
          category,
          relatedTerms,
          relatedBlocks,
        }),
      ),
    ).toEqual(
      source.map(
        ({ term, english, category, relatedTerms, relatedBlocks }) => ({
          term,
          english,
          category,
          relatedTerms,
          relatedBlocks,
        }),
      ),
    );
  });

  it("translates every definition without changing URLs or citations", () => {
    expect(collectUrls(translation)).toEqual(collectUrls(source));
    expect(collectCitationAnchors(translation)).toEqual(
      collectCitationAnchors(source),
    );

    translation.forEach((entry, index) => {
      expect(entry.definition.trim(), `${entry.term} definition`).not.toBe("");
      expect(entry.definition, `${entry.term} definition`).not.toBe(
        source[index].definition,
      );
    });
  });
});

describe("KI-Führerschein English workshop quiz", () => {
  const source = loadJson<QuizQuestion[]>(
    "content/ki-fuehrerschein/quiz/questions.json",
  );
  const translation = loadJson<QuizQuestion[]>(
    "content/ki-fuehrerschein/en/quiz/questions.json",
  );

  it("preserves question metadata, option IDs, answer truth and array shape", () => {
    expect(structuralShape(translation)).toEqual(structuralShape(source));
    expect(
      translation.map((question) => ({
        id: question.id,
        questionType: question.questionType,
        difficulty: question.difficulty,
        version: question.version,
        active: question.active,
        answers: question.answerOptions.map(({ id, isCorrect }) => ({
          id,
          isCorrect,
        })),
      })),
    ).toEqual(
      source.map((question) => ({
        id: question.id,
        questionType: question.questionType,
        difficulty: question.difficulty,
        version: question.version,
        active: question.active,
        answers: question.answerOptions.map(({ id, isCorrect }) => ({
          id,
          isCorrect,
        })),
      })),
    );
    for (const question of translation) {
      expect(
        question.answerOptions.filter(({ isCorrect }) => isCorrect),
        question.id,
      ).toHaveLength(1);
    }
  });

  it("translates all learner copy without changing URLs or citations", () => {
    expect(collectUrls(translation)).toEqual(collectUrls(source));
    expect(collectCitationAnchors(translation)).toEqual(
      collectCitationAnchors(source),
    );

    translation.forEach((question, questionIndex) => {
      const sourceQuestion = source[questionIndex];
      expect(question.questionText.trim(), `${question.id} question`).not.toBe("");
      expect(question.questionText, `${question.id} question`).not.toBe(
        sourceQuestion.questionText,
      );
      expect(question.explanation.trim(), `${question.id} explanation`).not.toBe(
        "",
      );
      expect(question.explanation, `${question.id} explanation`).not.toBe(
        sourceQuestion.explanation,
      );

      question.answerOptions.forEach((answer, answerIndex) => {
        expect(answer.text.trim(), `${question.id}.${answer.id} answer`).not.toBe(
          "",
        );
        expect(answer.text, `${question.id}.${answer.id} answer`).not.toBe(
          sourceQuestion.answerOptions[answerIndex].text,
        );
      });
    });
  });
});
