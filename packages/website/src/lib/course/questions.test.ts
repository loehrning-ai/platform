import { describe, it, expect } from "vitest";
import type { CourseSlug } from "./types";
import { loadWorkshopQuestions } from "./questions";
import { assertValidQuizQuestions } from "./quiz-validation";

// loadWorkshopQuestions dynamically imports the real per-course quiz JSON that
// ships in `content/<slug>/quiz/questions.json`, memoizing the result. These
// tests exercise the live JSON (no mocking) so they assert real question data.

const UNREGISTERED = "no-such-course" as unknown as CourseSlug;

describe("loadWorkshopQuestions", () => {
  it("loads the KI-Führerschein questions from the real content JSON", async () => {
    const questions = await loadWorkshopQuestions("ki-fuehrerschein");
    expect(questions).toHaveLength(20);
    for (const q of questions) {
      expect(typeof q.id).toBe("string");
      expect(q.questionText.length).toBeGreaterThan(0);
      // exactly one correct answer per question
      expect(q.answerOptions.filter((o) => o.isCorrect)).toHaveLength(1);
    }
  });

  it("loads the EU AI Act questions (distinct loader, 27 questions)", async () => {
    const questions = await loadWorkshopQuestions("eu-ai-act-kurs");
    expect(questions).toHaveLength(27);
    expect(questions.every((q) => q.answerOptions.length >= 3)).toBe(true);
  });

  it("memoizes: a repeat call returns the very same array reference", async () => {
    const first = await loadWorkshopQuestions("ki-und-gesellschaft");
    const second = await loadWorkshopQuestions("ki-und-gesellschaft");
    expect(second).toBe(first);
    expect(first).toHaveLength(15);
  });

  it("rejects with a descriptive error for a course with no registered loader", async () => {
    await expect(loadWorkshopQuestions(UNREGISTERED)).rejects.toThrow(
      'Course "no-such-course" has no workshop quiz questions registered.',
    );
  });

  it("loads the claude questions (19 questions, reusing the inline lesson Quiz content, )", async () => {
    const questions = await loadWorkshopQuestions("claude");
    expect(questions).toHaveLength(19);
    assertValidQuizQuestions(questions);
    for (const q of questions) {
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.answerOptions.length).toBeGreaterThanOrEqual(3);
    }
    // English content: no German quiz chrome/explanations leaked in.
    const allText = questions.map((q) => q.questionText + q.explanation).join(" ");
    expect(allText).not.toMatch(/\b(nicht|und|oder|der|die|das)\b/i);
  });
});
