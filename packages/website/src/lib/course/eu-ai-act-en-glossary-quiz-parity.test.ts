import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

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
  claimId?: string;
};

const MONTHS: Record<string, string> = {
  august: "08",
  december: "12",
  dezember: "12",
  februar: "02",
  february: "02",
  july: "07",
  juli: "07",
  may: "05",
  mai: "05",
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
      Object.entries(value).map(([key, child]) => [
        key,
        structuralShape(child),
      ]),
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

function uniqueMatches(value: JsonValue, expression: RegExp): string[] {
  return [
    ...new Set(
      collectStrings(value).flatMap((text) =>
        [...text.matchAll(expression)]
          .map((match) => match[1])
          .filter((match): match is string => Boolean(match)),
      ),
    ),
  ].sort();
}

function collectUrls(value: JsonValue): string[] {
  return collectStrings(value)
    .flatMap((text) => text.match(/https?:\/\/[^\s)\]|]+/g) ?? [])
    .sort();
}

function collectCalendarDates(value: JsonValue): string[] {
  const dates = new Set<string>();
  const names = Object.keys(MONTHS).join("|");
  const fullDate = new RegExp(
    `\\b(\\d{1,2})\\.?\\s+(${names})\\s+(\\d{4})\\b`,
    "giu",
  );
  const monthYear = new RegExp(`\\b(${names})\\s+(\\d{4})\\b`, "giu");

  for (const text of collectStrings(value)) {
    for (const match of text.matchAll(fullDate)) {
      const [, day, month, year] = match;
      dates.add(
        `${year}-${MONTHS[month.toLocaleLowerCase("de-DE")]}-${day.padStart(2, "0")}`,
      );
    }
    for (const match of text.matchAll(monthYear)) {
      const [, month, year] = match;
      dates.add(`${year}-${MONTHS[month.toLocaleLowerCase("de-DE")]}`);
    }
  }

  return [...dates].sort();
}

function collectPercentages(value: JsonValue): string[] {
  return uniqueMatches(value, /\b(\d+)\s*(?:%|Prozent|percent)\b/giu);
}

function collectFineAmounts(value: JsonValue): string[] {
  // Decimal amounts ("1,4 Mio. EUR" / "EUR 1.4 million") compare as one value.
  const sourcePattern = /\b(\d+(?:,\d+)?)\s*Mio\.?\s*EUR\b/giu;
  const translationPattern = /\bEUR\s*(\d+(?:\.\d+)?)\s*million\b/giu;

  return [
    ...new Set(
      [
        ...uniqueMatches(value, sourcePattern),
        ...uniqueMatches(value, translationPattern),
      ].map((amount) => amount.replace(",", ".")),
    ),
  ].sort((left, right) => Number(left) - Number(right));
}

function legalInventory(value: JsonValue) {
  return {
    annexes: uniqueMatches(value, /\b(?:Anhang|Annex)\s+([IVX]+)\b/giu),
    articles: uniqueMatches(
      value,
      /\b(?:Art(?:ikel)?\.?|Article)\s*(\d+)\b/giu,
    ).sort((left, right) => Number(left) - Number(right)),
    dates: collectCalendarDates(value),
    fineAmounts: collectFineAmounts(value),
    flopThresholds: uniqueMatches(value, /\b(10\^\d+)\s*FLOPs?\b/giu),
    instruments: uniqueMatches(value, /\b(\d{4}\/\d{4})\b/gu),
    percentages: collectPercentages(value),
  };
}

function isLanguageNeutralAnswer(text: string): boolean {
  return /^(?:\d+|Art\. \d+|10\^\d+ FLOPs?)$/.test(text);
}

describe("EU AI Act English glossary", () => {
  const source = loadJson<GlossaryEntry[]>(
    "content/eu-ai-act-kurs/glossary.json",
  );
  const translation = loadJson<GlossaryEntry[]>(
    "content/eu-ai-act-kurs/en/glossary.json",
  );

  it("preserves term identity, relations, categories and structure", () => {
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

  it("translates every definition and preserves the legal inventory", () => {
    expect(collectUrls(translation)).toEqual(collectUrls(source));
    expect(legalInventory(translation)).toEqual(legalInventory(source));

    translation.forEach((entry, index) => {
      expect(entry.definition.trim(), `${entry.term} definition`).not.toBe("");
      expect(entry.definition, `${entry.term} definition`).not.toBe(
        source[index].definition,
      );
    });
  });
});

describe("EU AI Act English workshop quiz", () => {
  const source = loadJson<QuizQuestion[]>(
    "content/eu-ai-act-kurs/quiz/questions.json",
  );
  const translation = loadJson<QuizQuestion[]>(
    "content/eu-ai-act-kurs/en/quiz/questions.json",
  );

  it("preserves question identity, metadata, answer truth and order", () => {
    expect(structuralShape(translation)).toEqual(structuralShape(source));
    expect(
      translation.map((question) => ({
        id: question.id,
        questionType: question.questionType,
        difficulty: question.difficulty,
        version: question.version,
        active: question.active,
        claimId: question.claimId,
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
        claimId: question.claimId,
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

  it("translates all learner prose while retaining language-neutral answers", () => {
    translation.forEach((question, questionIndex) => {
      const sourceQuestion = source[questionIndex];

      expect(question.questionText.trim(), `${question.id} question`).not.toBe(
        "",
      );
      expect(question.questionText, `${question.id} question`).not.toBe(
        sourceQuestion.questionText,
      );
      expect(
        question.explanation.trim(),
        `${question.id} explanation`,
      ).not.toBe("");
      expect(question.explanation, `${question.id} explanation`).not.toBe(
        sourceQuestion.explanation,
      );

      question.answerOptions.forEach((answer, answerIndex) => {
        const sourceAnswer = sourceQuestion.answerOptions[answerIndex];
        expect(
          answer.text.trim(),
          `${question.id}.${answer.id} answer`,
        ).not.toBe("");
        if (!isLanguageNeutralAnswer(sourceAnswer.text)) {
          expect(answer.text, `${question.id}.${answer.id} answer`).not.toBe(
            sourceAnswer.text,
          );
        }
      });
    });
  });

  it("preserves every legal instrument, article, annex, date and amount", () => {
    expect(collectUrls(translation)).toEqual(collectUrls(source));
    expect(legalInventory(translation)).toEqual(legalInventory(source));
  });

  it("retains the source's legal limitations and exceptions", () => {
    const english = collectStrings(translation).join("\n");

    for (const qualifier of [
      "unless other law provides otherwise",
      "except for medical or safety reasons",
      "SMEs the lower under Art. 99(6)",
      "purely for personal, non-professional purposes",
      "at the latest at the first interaction",
      "is always high-risk if it profiles natural persons",
      "Employment AI under Annex III point 4 is not among the Art. 27 addressees",
      "changed its content, not this date",
      "Consent or works council approval does not cure it",
      "as far as technically feasible",
    ]) {
      expect(english).toContain(qualifier);
    }

    for (const reference of [
      "Art. 2(1)(c)",
      "Art. 2(10)",
      "Art. 3(4)",
      "Art. 5(1)(f)",
      "Art. 6(3)",
      "Annex III point 4(a)",
      "Art. 25(1)",
      "Art. 26(6)",
      "Art. 50(4)",
      "Art. 50(5)",
      "Art. 99(6)",
    ]) {
      expect(english).toContain(reference);
    }
  });
});
