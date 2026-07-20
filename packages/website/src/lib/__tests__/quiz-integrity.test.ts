/**
 * Quiz integrity regression suite.
 *
 * Loads every quiz question across the eu-ai-act-kurs, ki-und-gesellschaft,
 * and ki-fuehrerschein content directories — both lesson-embedded quizzes
 * (`lesson.quiz[]`) and the standalone `quiz/questions.json` files — and
 * asserts two structural invariants per question:
 *
 * 1. Option texts are unique after trimming (no accidental duplicate options).
 * 2. Exactly one option has `isCorrect: true` (no zero or multiple correct
 *    answers, which would make the question unanswerable or ambiguous).
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CONTENT_ROOT = join(process.cwd(), "content");

const COURSE_DIRS = [
  "eu-ai-act-kurs",
  "ki-und-gesellschaft",
  "ki-fuehrerschein",
];

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  answerOptions: AnswerOption[];
}

interface LessonsFile {
  lessons?: Array<{
    id?: string;
    quiz?: QuizQuestion[];
  }>;
}

interface LocatedQuestion {
  source: string;
  question: QuizQuestion;
}

function readJson(fullPath: string): unknown {
  return JSON.parse(readFileSync(fullPath, "utf-8"));
}

/** Collect every quiz question from a course directory (lesson-embedded + standalone quiz file). */
function collectQuestions(courseDir: string): LocatedQuestion[] {
  const dirPath = join(CONTENT_ROOT, courseDir);
  const found: LocatedQuestion[] = [];

  const entries = readdirSync(dirPath, { withFileTypes: true });

  // Lesson-embedded quizzes: content/<course>/*-lessons.json → lessons[].quiz[]
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith("-lessons.json")) continue;
    const data = readJson(join(dirPath, entry.name)) as LessonsFile;
    for (const lesson of data.lessons ?? []) {
      for (const question of lesson.quiz ?? []) {
        found.push({
          source: `${courseDir}/${entry.name}#${lesson.id ?? "?"}/${question.id}`,
          question,
        });
      }
    }
  }

  // Standalone quiz bank: content/<course>/quiz/questions.json
  const quizFile = join(dirPath, "quiz", "questions.json");
  if (entries.some((e) => e.isDirectory() && e.name === "quiz")) {
    const questions = readJson(quizFile) as QuizQuestion[];
    for (const question of questions) {
      found.push({
        source: `${courseDir}/quiz/questions.json#${question.id}`,
        question,
      });
    }
  }

  return found;
}

describe("quiz integrity", () => {
  for (const courseDir of COURSE_DIRS) {
    const questions = collectQuestions(courseDir);

    it(`${courseDir}: found at least one quiz question`, () => {
      expect(questions.length).toBeGreaterThan(0);
    });

    describe(`${courseDir} questions`, () => {
      for (const { source, question } of questions) {
        it(`${source}: option texts are unique after trimming`, () => {
          const trimmed = question.answerOptions.map((o) => o.text.trim());
          const unique = new Set(trimmed);
          expect(unique.size).toBe(trimmed.length);
        });

        it(`${source}: exactly one option has isCorrect: true`, () => {
          const correctCount = question.answerOptions.filter(
            (o) => o.isCorrect === true,
          ).length;
          expect(correctCount).toBe(1);
        });
      }
    });
  }
});
