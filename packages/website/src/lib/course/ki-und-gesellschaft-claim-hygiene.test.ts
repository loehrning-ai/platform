import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Claim hygiene for the lesson-engine version of KI und Gesellschaft:
// stable answer semantics across locales, no superseded claims, and the
// legal and methodological boundaries the course must keep stating.

type AnswerOption = { id: string; isCorrect: boolean };
type Question = { id: string; answerOptions: AnswerOption[] };
type CheckOption = { id: string; correct: boolean; feedback?: string };
type Lesson = {
  id: string;
  checks: Array<{ id: string; options: CheckOption[] }>;
  exercise: { kind: string };
};
type Block = { blockId: string; lessons: Lesson[] };

const BLOCK_FILES = [
  "block-1-arbeit-lessons.json",
  "block-2-fakes-lessons.json",
  "block-3-fairness-lessons.json",
] as const;

const EXPECTED_LESSONS = [
  ["zahlen-1-1", "zahlen-1-2"],
  ["fakes-2-1", "fakes-2-2", "fakes-2-3"],
  ["fair-3-1", "fair-3-2", "fair-3-3"],
] as const;

const EXPECTED_WORKSHOP_CORRECT = "bcad bcad bcad bca".replaceAll(" ", "");

function contentPath(locale: "de" | "en", filename: string): string {
  return resolve(
    process.cwd(),
    "content/ki-und-gesellschaft",
    locale === "en" ? `en/${filename}` : filename,
  );
}

function loadJson<T>(locale: "de" | "en", filename: string): T {
  return JSON.parse(readFileSync(contentPath(locale, filename), "utf8")) as T;
}

function correctAnswer(question: Question): string {
  const correct = question.answerOptions.filter((option) => option.isCorrect);
  expect(correct).toHaveLength(1);
  return correct[0].id;
}

describe("KI und Gesellschaft claim hygiene", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale} preserves stable lesson, check, question and answer semantics`, () => {
      BLOCK_FILES.forEach((filename, blockIndex) => {
        const block = loadJson<Block>(locale, filename);
        expect(block.blockId).toBe(`block_${blockIndex + 1}`);
        expect(block.lessons.map((lesson) => lesson.id)).toEqual(
          EXPECTED_LESSONS[blockIndex],
        );
        for (const lesson of block.lessons) {
          expect(lesson.checks.map((check) => check.id)).toEqual([
            `${lesson.id}-c1`,
            `${lesson.id}-c2`,
          ]);
          for (const check of lesson.checks) {
            expect(check.options.filter((option) => option.correct)).toHaveLength(1);
          }
        }
      });

      const workshop = loadJson<Question[]>(locale, "quiz/questions.json");
      expect(workshop).toHaveLength(15);
      workshop.forEach((question, index) => {
        expect(question.id).toBe(`kug-q${String(index + 1).padStart(2, "0")}`);
        expect(question.answerOptions.map((option) => option.id)).toEqual([
          "a",
          "b",
          "c",
          "d",
        ]);
      });
      expect(workshop.map(correctAnswer).join("")).toBe(
        EXPECTED_WORKSHOP_CORRECT,
      );
    });
  }

  it("excludes superseded claims from both language bundles", () => {
    const combined = ["de", "en"]
      .flatMap((locale) =>
        [...BLOCK_FILES, "quiz/questions.json"].map((filename) =>
          readFileSync(contentPath(locale as "de" | "en", filename), "utf8"),
        ),
      )
      .join("\n");

    const supersededClaims = [
      /rund 9 Prozent der Berufe/i,
      /about 9 percent of occupations/i,
      /19 von 20/i,
      /19 out of 20/i,
      /Hive Moderation/i,
      /Chrome und Firefox/i,
      /Chrome and Firefox/i,
      /Trainingsdaten sind nie neutral/i,
      /training data are never neutral/i,
      /Art\. 28[^\n]*(?:Bevollmächtigte|Bevollmächtigten)/i,
      /Article 28[^\n]*authorised representative/i,
      /Die Ursache: Überrepräsentation/i,
      /The cause was the overrepresentation/i,
      /Plattformen sind nach EU Digital Services Act verpflichtet, gemeldete Inhalte zu überprüfen/i,
      /platforms must review reported content/i,
      // Looks are not a test: no artefact checklists.
      /typische Fälschungsmuster/i,
      /typical forgery patterns/i,
      // Detector percentages are not calibrated probabilities.
      /Detektor (?:beweist|belegt)/i,
      /detector (?:proves|establishes)/i,
    ];

    for (const pattern of supersededClaims) {
      expect(combined, `superseded claim matched ${pattern}`).not.toMatch(
        pattern,
      );
    }
  });

  it("retains the required legal and methodological boundaries in both languages", () => {
    const german = BLOCK_FILES.map((filename) =>
      readFileSync(contentPath("de", filename), "utf8"),
    ).join("\n");
    const english = BLOCK_FILES.map((filename) =>
      readFileSync(contentPath("en", filename), "utf8"),
    ).join("\n");

    for (const required of [
      "Exposition",
      "Substituierbarkeit heißt nicht, dass automatisiert wird",
      "§ 87 Abs. 1 Nr. 6 BetrVG",
      "Fehlen sie, beweist das keine Manipulation",
      "nicht automatisch eine kalibrierte",
      "Art. 16 DSA",
      "Deine Stimme allein schützt § 22 KUG nicht",
      "Geschlechtsklassifikation",
      "Synthetische Daten",
      "ausschließlich automatisierten Entscheidungen",
      "2. Dezember 2027",
    ]) {
      expect(german).toContain(required);
    }

    for (const required of [
      "Exposure",
      "substitutability does not mean automation happens",
      "Section 87(1) no. 6 BetrVG",
      "Their absence does not prove manipulation",
      "not automatically a calibrated",
      "Article 16 DSA",
      "Your voice alone is not protected by Section 22 KUG",
      "gender classification",
      "Synthetic data",
      "solely automated decisions",
      "2 December 2027",
    ]) {
      expect(english).toContain(required);
    }
  });
});
