import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LESSON_FILES = [
  "block-3-anwendung-lessons.json",
  "block-4-verifikation-lessons.json",
  "block-5-richtlinie-lessons.json",
] as const;

const LEARNER_COPY_KEYS = new Set([
  "title",
  "subtitle",
  "keyConcepts",
  "content",
  "keyTakeaway",
  "questionText",
  "text",
  "explanation",
  "scenario",
  "badLabel",
  "goodLabel",
  "bad",
  "good",
  "note",
]);

interface LessonFile {
  lessons: Array<{
    id: string;
    title: string;
    sections: Array<{ id: string; title: string; content: string }>;
    quiz: Array<{
      id: string;
      questionText: string;
      answerOptions: Array<{ id: string; text: string; isCorrect: boolean }>;
    }>;
  }>;
}

function loadLessonFile(locale: "de" | "en", filename: string): LessonFile {
  const relativePath =
    locale === "de"
      ? `content/ki-fuehrerschein/${filename}`
      : `content/ki-fuehrerschein/en/${filename}`;

  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as LessonFile;
}

function replaceLearnerCopy(value: unknown, key?: string): unknown {
  if (key && LEARNER_COPY_KEYS.has(key)) {
    if (Array.isArray(value)) {
      return value.map(() => "<learner-copy>");
    }
    return "<learner-copy>";
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceLearnerCopy(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        replaceLearnerCopy(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

describe("KI-Führerschein English blocks 3–5", () => {
  for (const filename of LESSON_FILES) {
    it(`${filename} is valid JSON with exact structural and machine-data parity`, () => {
      const german = loadLessonFile("de", filename);
      const english = loadLessonFile("en", filename);

      expect(replaceLearnerCopy(english)).toEqual(replaceLearnerCopy(german));
    });

    it(`${filename} translates every lesson, section, question and answer`, () => {
      const german = loadLessonFile("de", filename);
      const english = loadLessonFile("en", filename);

      for (const [lessonIndex, lesson] of english.lessons.entries()) {
        const germanLesson = german.lessons[lessonIndex];
        expect(lesson.title).not.toBe(germanLesson.title);

        for (const [sectionIndex, section] of lesson.sections.entries()) {
          const germanSection = germanLesson.sections[sectionIndex];
          expect(section.title).not.toBe(germanSection.title);
          expect(section.content).not.toBe(germanSection.content);
        }

        for (const [questionIndex, question] of lesson.quiz.entries()) {
          const germanQuestion = germanLesson.quiz[questionIndex];
          expect(question.questionText).not.toBe(germanQuestion.questionText);

          for (const option of question.answerOptions) {
            expect(option.text.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });
  }
});
