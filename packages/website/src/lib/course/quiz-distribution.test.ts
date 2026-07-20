/**
 * Quiz answer-position distribution test (accessibility hardening).
 *
 * GATE: Hard CI FAIL for all four course quiz files.
 *
 * Tests:
 * 1. Each question has exactly one correct answer (schema correctness).
 * 2. Each quiz has at least 3 options per question.
 * 3. shuffle distribution: simulate shuffling each question 100 times with seeded
 *    random; assert no answer position (index 0-3) appears as the correct answer
 *    more than 40% of the time across the 100 renders.
 *
 * NOTE: Tests 3 will be RED until KI-Fuehrerschein course review, 028, 029, 039 rebalance the quiz
 * JSON AND AI-native course implementation ships the per-question shuffleArray in the renderer. That
 * is intentional — this test IS the gate; the content plans are the fix.
 *
 * Courses covered:
 *   - ki-fuehrerschein (KI-Fuehrerschein course review)
 *   - eu-ai-act-kurs   (EU AI Act course review)
 *   - ai-native        (AI-native course implementation)
 *   - ki-und-gesellschaft (KI und Gesellschaft course review)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { shuffleArray } from "@/components/course/kurs/workshop-quiz-page";

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

function loadQuiz(relativePath: string): QuizQuestion[] {
  const absPath = resolve(process.cwd(), relativePath);
  const raw = readFileSync(absPath, "utf-8");
  const data = JSON.parse(raw) as QuizQuestion[] | { questions: QuizQuestion[] };
  return Array.isArray(data) ? data : data.questions;
}

/** Simulate shuffling one question's options 100 times with different seeds.
 *  Returns position-count array: counts[i] = how many times correct was at index i. */
function simulateShuffleDistribution(
  question: QuizQuestion,
  renders = 100,
): number[] {
  const optionCount = question.answerOptions.length;
  const counts = new Array(optionCount).fill(0);
  for (let seed = 1; seed <= renders; seed++) {
    const shuffled = shuffleArray(question.answerOptions, seed);
    const correctIndex = shuffled.findIndex((o) => o.isCorrect);
    if (correctIndex >= 0 && correctIndex < optionCount) {
      counts[correctIndex]++;
    }
  }
  return counts;
}

/** Maximum fraction (0–1) that any single position holds across 100 renders. */
function maxPositionFraction(question: QuizQuestion, renders = 100): number {
  const counts = simulateShuffleDistribution(question, renders);
  return Math.max(...counts) / renders;
}

// ---------------------------------------------------------------------------
// Helper: validate single-correct-answer and option count for all questions
// ---------------------------------------------------------------------------

function validateQuizStructure(questions: QuizQuestion[], courseLabel: string): void {
  describe(`${courseLabel}: schema validation`, () => {
    it("each question has exactly one correct answer", () => {
      for (const q of questions) {
        const correctCount = q.answerOptions.filter((o) => o.isCorrect).length;
        expect(
          correctCount,
          `Question "${q.id}" has ${correctCount} correct answers (expected exactly 1)`,
        ).toBe(1);
      }
    });

    it("each question has at least 3 answer options", () => {
      for (const q of questions) {
        expect(
          q.answerOptions.length,
          `Question "${q.id}" has only ${q.answerOptions.length} options`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it("question text is non-empty for all questions", () => {
      for (const q of questions) {
        expect(
          q.questionText?.trim().length,
          `Question "${q.id}" has empty questionText`,
        ).toBeGreaterThan(0);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Helper: distribution gate (hard CI FAIL if >40% concentration)
// ---------------------------------------------------------------------------

function validateShuffleDistribution(
  questions: QuizQuestion[],
  courseLabel: string,
  renders = 100,
  maxFraction = 0.4,
): void {
  describe(`${courseLabel}: shuffle distribution (≤${maxFraction * 100}% at any position, ${renders} renders)`, () => {
    for (const q of questions) {
      it(`question "${q.id}" has no position > ${maxFraction * 100}%`, () => {
        const fraction = maxPositionFraction(q, renders);
        expect(
          fraction,
          `Question "${q.id}": correct answer concentrated at ${Math.round(fraction * 100)}% in one position (max allowed: ${maxFraction * 100}%). Rebalance the quiz JSON (KI-Fuehrerschein course review/028/029/039) and ensure shuffleArray is applied in the renderer.`,
        ).toBeLessThanOrEqual(maxFraction);
      });
    }
  });
}

// ---------------------------------------------------------------------------
// KI-Führerschein (KI-Fuehrerschein course review)
// ---------------------------------------------------------------------------

describe("KI-Führerschein quiz", () => {
  const questions = loadQuiz("content/ki-fuehrerschein/quiz/questions.json");

  validateQuizStructure(questions, "KI-Führerschein");
  validateShuffleDistribution(questions, "KI-Führerschein");
});

// ---------------------------------------------------------------------------
// EU AI Act Kurs (EU AI Act course review)
// ---------------------------------------------------------------------------

describe("EU AI Act Kurs quiz", () => {
  const questions = loadQuiz("content/eu-ai-act-kurs/quiz/questions.json");

  validateQuizStructure(questions, "EU AI Act Kurs");
  validateShuffleDistribution(questions, "EU AI Act Kurs");
});

// ---------------------------------------------------------------------------
// AI-Native (AI-native course implementation — already rebalanced)
// ---------------------------------------------------------------------------

describe("AI-Native quiz", () => {
  const questions = loadQuiz("content/ai-native/quiz/questions.json");

  validateQuizStructure(questions, "AI-Native");
  validateShuffleDistribution(questions, "AI-Native");
});

// ---------------------------------------------------------------------------
// KI und Gesellschaft (KI und Gesellschaft course review)
// ---------------------------------------------------------------------------

describe("KI und Gesellschaft quiz", () => {
  const questions = loadQuiz("content/ki-und-gesellschaft/quiz/questions.json");

  validateQuizStructure(questions, "KI und Gesellschaft");
  validateShuffleDistribution(questions, "KI und Gesellschaft");
});
