import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const BLOCK_FILES = [
  "block-1-daten-lessons.json",
  "block-2-briefen-lessons.json",
  "block-3-pruefen-lessons.json",
  "block-4-regeln-lessons.json",
] as const;

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  answerOptions: AnswerOption[];
  explanation: string;
}

interface LessonCheck {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string; correct: boolean; feedback?: string }>;
  explanation: string;
}

interface LessonFile {
  lessons: Array<{
    id: string;
    title: string;
    subtitle: string;
    keyConcepts: string[];
    concept: { body: string; takeaway?: string };
    exercise: { kind: string; title: string; instructions: string; props: unknown };
    checks: LessonCheck[];
  }>;
}

interface GlossaryEntry {
  term: string;
  definition: string;
}

const BANNED_CLAIMS = [
  /alles erlaubt/i,
  /any tool (?:is )?permitted/i,
  /4 statt 12/i,
  /from 12 minutes to (?:four|4)/i,
  /60 sekunden/i,
  /60 seconds/i,
  /innerhalb von (?:4|24) stunden/i,
  /within (?:4|24) hours/i,
  /chatgpt business ist für daten/i,
  /chatgpt business is approved for data/i,
  /jede(?:s|r)? zukünftige(?:s|r)? modell/i,
  /every future model/i,
  /fast immer erforderlich/i,
  /almost always required/i,
  /1[,.]7 billionen/i,
  /1[,.]7 trillion/i,
  /68\s?%/i,
  /end-to-end exactly once/i,
  /ende-zu-ende genau-einmal/i,
  /maßnahmen zur entwicklung der ki-kompetenz/i,
  /measures to develop the ai literacy/i,
  /requires appropriate ai literacy measures/i,
] as const;

function loadJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as T;
}

function collectWidgetCopy(value: unknown, result: string[] = []): string[] {
  if (typeof value === "string") {
    result.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectWidgetCopy(entry, result));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((entry) => collectWidgetCopy(entry, result));
  }

  return result;
}

function collectQuestionCopy(question: Question): string[] {
  const correctOptions = question.answerOptions.filter(
    (option) => option.isCorrect,
  );
  expect(
    correctOptions,
    `${question.id} must have one correct answer`,
  ).toHaveLength(1);

  return [question.questionText, question.explanation, correctOptions[0].text];
}

function collectCheckCopy(check: LessonCheck): string[] {
  const correct = check.options.filter((option) => option.correct);
  expect(correct, `${check.id} must have one correct answer`).toHaveLength(1);
  return [
    check.prompt,
    check.explanation,
    correct[0].text,
    ...check.options.flatMap((option) => (option.feedback ? [option.feedback] : [])),
  ];
}

function collectLessonCopy(file: LessonFile): string[] {
  return file.lessons.flatMap((lesson) => [
    lesson.title,
    lesson.subtitle,
    ...lesson.keyConcepts,
    lesson.concept.body,
    lesson.concept.takeaway ?? "",
    lesson.exercise.title,
    lesson.exercise.instructions,
    ...collectWidgetCopy(lesson.exercise.props),
    ...lesson.checks.flatMap(collectCheckCopy),
  ]);
}

describe("KI-Führerschein claim hygiene", () => {
  it("keeps German and English lesson IDs and quiz answer keys aligned", () => {
    for (const filename of BLOCK_FILES) {
      const german = loadJson<LessonFile>(
        `content/ki-fuehrerschein/${filename}`,
      );
      const english = loadJson<LessonFile>(
        `content/ki-fuehrerschein/en/${filename}`,
      );

      expect(english.lessons.map((lesson) => lesson.id)).toEqual(
        german.lessons.map((lesson) => lesson.id),
      );

      for (const [lessonIndex, lesson] of german.lessons.entries()) {
        const translation = english.lessons[lessonIndex];
        expect(translation.exercise.kind).toBe(lesson.exercise.kind);
        expect(translation.checks.map((check) => check.id)).toEqual(
          lesson.checks.map((check) => check.id),
        );

        for (const [checkIndex, check] of lesson.checks.entries()) {
          expect(
            translation.checks[checkIndex].options.map((option) => ({
              id: option.id,
              correct: option.correct,
            })),
          ).toEqual(
            check.options.map((option) => ({
              id: option.id,
              correct: option.correct,
            })),
          );
        }
      }
    }
  });

  it("rejects removed fabricated metrics, deadlines, and product guarantees", () => {
    const learnerCopy = BLOCK_FILES.flatMap((filename) => [
      ...collectLessonCopy(
        loadJson<LessonFile>(`content/ki-fuehrerschein/${filename}`),
      ),
      ...collectLessonCopy(
        loadJson<LessonFile>(`content/ki-fuehrerschein/en/${filename}`),
      ),
    ]);

    for (const localePath of ["", "en/"]) {
      learnerCopy.push(
        ...loadJson<Question[]>(
          `content/ki-fuehrerschein/${localePath}quiz/questions.json`,
        ).flatMap(collectQuestionCopy),
        ...loadJson<GlossaryEntry[]>(
          `content/ki-fuehrerschein/${localePath}glossary.json`,
        ).flatMap((entry) => [entry.term, entry.definition]),
      );
    }

    const combinedCopy = learnerCopy.join("\n");

    for (const claim of BANNED_CLAIMS) {
      expect(combinedCopy, `removed claim reintroduced: ${claim}`).not.toMatch(
        claim,
      );
    }
  });
});
