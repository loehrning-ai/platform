import { describe, it, expect } from "vitest";
import { assertValidQuizQuestions } from "@/lib/course/quiz-validation";
import { loadWorkshopQuestions } from "@/lib/course/questions";
import { getAllLessons, __resetAiNativeOperatorCacheForTests } from "./data";
import questionsJson from "../../../content/ai-native-operator/quiz/questions.json";

/**
 * Workshop quiz question pool. The 9 module knowledge-check
 * lessons' ~22 questions have zero `explanation` text in the source — every
 * explanation below is net-new content authored for this port, validated via
 * shared `assertValidQuizQuestions` (exactly one correct answer +
 * non-empty explanation per question).
 */
describe("ai-native-operator workshop quiz pool ", () => {
  it("every quiz-kind lesson's questions pass the shared quiz validator", async () => {
    __resetAiNativeOperatorCacheForTests();
    const all = await getAllLessons();
    const quizLessons = all.filter((l) => l.kind === "quiz");
    expect(quizLessons).toHaveLength(9);
    let total = 0;
    for (const lesson of quizLessons) {
      expect(lesson.quiz.length).toBeGreaterThan(0);
      assertValidQuizQuestions(lesson.quiz);
      total += lesson.quiz.length;
    }
    expect(total).toBe(22);
  });

  it("content/ai-native-operator/quiz/questions.json has exactly 22 valid, unique-id questions", () => {
    expect(questionsJson).toHaveLength(22);
    assertValidQuizQuestions(questionsJson);
    const ids = new Set(questionsJson.map((q) => q.id));
    expect(ids.size).toBe(22);
  });

  it("loadWorkshopQuestions('ai-native-operator') resolves the same 22-question pool via dynamic import", async () => {
    const loaded = await loadWorkshopQuestions("ai-native-operator");
    expect(loaded).toHaveLength(22);
    expect(loaded[0].id).toBe("ano-q01");
  });

  it("bank size equals served count, matching the codebase convention (ki-fuehrerschein 20/20, eu-ai-act-kurs 27/27, claude 19/19)", async () => {
    const loaded = await loadWorkshopQuestions("ai-native-operator");
    expect(loaded.length).toBe(22);
  });
});
