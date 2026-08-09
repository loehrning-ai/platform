import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type AnswerOption = { id: string; isCorrect: boolean };
type Question = { id: string; answerOptions: AnswerOption[] };
type Lesson = {
  id: string;
  sections: Array<{ id: string }>;
  quiz: Question[];
};
type Block = { blockId: string; lessons: Lesson[] };

const BLOCK_FILES = [
  "block-1-arbeit-lessons.json",
  "block-2-deepfakes-lessons.json",
  "block-3-ethik-lessons.json",
] as const;

const EXPECTED_LESSONS = [
  ["arbeit-1-1", "arbeit-1-2", "arbeit-1-3"],
  ["deepfake-2-1", "deepfake-2-2", "deepfake-2-3"],
  ["ethik-3-1", "ethik-3-2", "ethik-3-3"],
] as const;

const EXPECTED_LESSON_CORRECT = [
  ["bcd", "bdd", "cbd"],
  ["dbb", "cdc", "bdc"],
  ["cbd", "bdd", "ddd"],
] as const;

const EXPECTED_WORKSHOP_CORRECT = "bbcb bbcc bdbbbdc".replaceAll(" ", "");

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

function assertQuestionShape(question: Question, expectedId: string): void {
  expect(question.id).toBe(expectedId);
  expect(question.answerOptions.map((option) => option.id)).toEqual([
    "a",
    "b",
    "c",
    "d",
  ]);
}

describe("KI und Gesellschaft claim hygiene", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale} preserves stable lesson, section, question and answer semantics`, () => {
      BLOCK_FILES.forEach((filename, blockIndex) => {
        const block = loadJson<Block>(locale, filename);
        expect(block.blockId).toBe(`block_${blockIndex + 1}`);
        expect(block.lessons.map((lesson) => lesson.id)).toEqual(
          EXPECTED_LESSONS[blockIndex],
        );

        block.lessons.forEach((lesson, lessonIndex) => {
          expect(lesson.sections.map((section) => section.id)).toEqual([
            `${lesson.id}-s1`,
            `${lesson.id}-s2`,
            `${lesson.id}-s3`,
          ]);
          lesson.quiz.forEach((question, questionIndex) => {
            assertQuestionShape(question, `${lesson.id}-q${questionIndex + 1}`);
          });
          expect(lesson.quiz.map(correctAnswer).join("")).toBe(
            EXPECTED_LESSON_CORRECT[blockIndex][lessonIndex],
          );
        });
      });

      const workshop = loadJson<Question[]>(locale, "quiz/questions.json");
      workshop.forEach((question, index) => {
        assertQuestionShape(
          question,
          `kug-q${String(index + 1).padStart(2, "0")}`,
        );
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
      "Aufgabenexposition",
      "Art. 3 Nr. 60",
      "Geschlechtsklassifikation",
      "Art. 16 des Digital Services Act",
      "Art. 22 Abs. 1 DSGVO",
      "2. Dezember 2026",
    ]) {
      expect(german).toContain(required);
    }

    for (const required of [
      "Task exposure",
      "Article 3(60)",
      "gender classification",
      "Article 16 of the Digital Services Act",
      "Article 22(1) GDPR",
      "2 December 2026",
    ]) {
      expect(english).toContain(required);
    }
  });
});
