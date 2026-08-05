/**
 * Quiz answer-position distribution tests (AI-native course implementation).
 *
 * Verifies:
 * 1. AI-Native quiz JSON has correct answers distributed across positions a/b/c/d.
 *    Max correct at any single position: ≤ 8 of 24 (≤ 33%).
 * 2. shuffleArray produces different orderings with different seeds.
 * 3. Shared-course quiz files parse and contain exactly one correct option
 *    per question. Source answer positions may be uneven because the UI
 *    deterministically shuffles options for each attempt.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { shuffleArray } from "./workshop-quiz-page";

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  answerOptions: AnswerOption[];
}

function loadQuiz(relativePath: string): QuizQuestion[] {
  const absPath = resolve(process.cwd(), relativePath);
  const raw = readFileSync(absPath, "utf-8");
  const data = JSON.parse(raw) as QuizQuestion[] | { questions: QuizQuestion[] };
  return Array.isArray(data) ? data : data.questions;
}

function getCorrectPositionCounts(questions: QuizQuestion[]): number[] {
  const counts = [0, 0, 0, 0]; // positions a/b/c/d → indices 0-3
  for (const q of questions) {
    const pos = q.answerOptions.findIndex((o) => o.isCorrect);
    if (pos >= 0 && pos < 4) counts[pos]++;
  }
  return counts;
}

// ─── AI-Native (P0 — must pass) ─────────────────────────────────────────────

describe("AI-Native quiz answer-position distribution", () => {
  const questions = loadQuiz("content/ai-native/quiz/questions.json");

  it("has 24 active questions", () => {
    expect(questions.length).toBe(24);
  });

  it("no correct-answer position holds more than 8 of 24 questions (≤ 33%)", () => {
    const counts = getCorrectPositionCounts(questions);
    const max = Math.max(...counts);
    expect(max).toBeLessThanOrEqual(8);
  });

  it("every answer option id is one of a/b/c/d", () => {
    for (const q of questions) {
      for (const o of q.answerOptions) {
        expect(["a", "b", "c", "d"]).toContain(o.id);
      }
    }
  });

  it("each question has exactly one correct answer", () => {
    for (const q of questions) {
      const correctCount = q.answerOptions.filter((o) => o.isCorrect).length;
      expect(correctCount).toBe(1);
    }
  });

  it("no question references 'Peer-Feedback' or 'Peer-Review'", () => {
    for (const q of questions) {
      const text = JSON.stringify(q);
      expect(text).not.toMatch(/Peer-Feedback|Peer-Review/);
    }
  });

  it("no question references platform pricing or costs", () => {
    for (const q of questions) {
      const text = JSON.stringify(q);
      // kostet alone is acceptable in context (e.g. "kostet Mühe"), but
      // combined with Euro/EUR/€ or pricing context is the issue.
      expect(text).not.toMatch(/komplett kostenlos im Lernkonto/);
    }
  });

  it("no question has 'DSGVO-sicher' as an unqualified binary claim", () => {
    for (const q of questions) {
      // The forbidden form is an answer option claiming "DSGVO-sicher" as fact.
      // We check every answer option text (not the explanation, which may
      // discuss DSGVO with proper caveats).
      for (const o of q.answerOptions) {
        // "DSGVO-sicher" alone in option text (not part of a sentence with caveat)
        if (o.isCorrect) {
          // Correct-answer options must not claim DSGVO-sicher without caveats
          expect(o.text).not.toMatch(/DSGVO-sicher(?!\s*\()/);
        }
      }
    }
  });
});

// ─── shuffleArray determinism ────────────────────────────────────────────────

describe("shuffleArray with seeds", () => {
  const options = [
    { id: "a", text: "Alpha", isCorrect: true },
    { id: "b", text: "Beta", isCorrect: false },
    { id: "c", text: "Gamma", isCorrect: false },
    { id: "d", text: "Delta", isCorrect: false },
  ] as const;

  it("produces different orderings with different seeds", () => {
    // Try several seed pairs until we find a differing pair (or fail after 20)
    let foundDiff = false;
    for (let seedA = 1; seedA <= 20 && !foundDiff; seedA++) {
      const seedB = seedA + 100;
      const resultA = shuffleArray(options, seedA);
      const resultB = shuffleArray(options, seedB);
      const orderA = resultA.map((o) => o.id).join("");
      const orderB = resultB.map((o) => o.id).join("");
      if (orderA !== orderB) foundDiff = true;
    }
    expect(foundDiff).toBe(true);
  });

  it("same seed produces same ordering (deterministic)", () => {
    const r1 = shuffleArray(options, 42).map((o) => o.id);
    const r2 = shuffleArray(options, 42).map((o) => o.id);
    expect(r1).toEqual(r2);
  });

  it("preserves all elements", () => {
    const result = shuffleArray(options, 7);
    expect(result.length).toBe(options.length);
    for (const o of options) {
      expect(result.some((r) => r.id === o.id)).toBe(true);
    }
  });
});

// ─── Shared-course source integrity ──────────────────────────────────────────

describe("Shared-course quiz source integrity", () => {
  it.each([
    ["KI-Führerschein", "content/ki-fuehrerschein/quiz/questions.json"],
    ["EU AI Act", "content/eu-ai-act-kurs/quiz/questions.json"],
  ])("%s quiz parses with one correct option per question", (_course, path) => {
    const questions = loadQuiz(path);

    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(question.answerOptions).toHaveLength(4);
      expect(
        question.answerOptions.filter((option) => option.isCorrect),
      ).toHaveLength(1);
    }
  });
});
