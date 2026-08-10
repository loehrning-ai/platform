import { describe, it, expect } from "vitest";
import { assertValidQuizQuestions } from "@/lib/course/quiz-validation";
import { loadWorkshopQuestions } from "@/lib/course/questions";
import { getAllLessons, __resetAiNativeOperatorCacheForTests } from "./data";
import { getAiNativeOperatorWorkshopQuestions } from "./workshop-questions";

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

  it("builds reviewed English and German pools with identical machine identity", async () => {
    const [english, german] = await Promise.all([
      getAiNativeOperatorWorkshopQuestions("en"),
      getAiNativeOperatorWorkshopQuestions("de"),
    ]);
    expect(english).toHaveLength(22);
    expect(german).toHaveLength(22);
    assertValidQuizQuestions(english);
    assertValidQuizQuestions(german);
    const identity = (questions: typeof english) =>
      questions.map((question) => ({
        id: question.id,
        questionType: question.questionType,
        difficulty: question.difficulty,
        version: question.version,
        active: question.active,
        options: question.answerOptions.map((option) => ({
          id: option.id,
          isCorrect: option.isCorrect,
        })),
      }));
    expect(identity(german)).toEqual(identity(english));
    expect(new Set(english.map((question) => question.id)).size).toBe(22);
    expect(
      german.map((question) => question.questionText).join("\n"),
    ).not.toMatch(
      /\b(?:the|your|which|what|when|with|without|should|question)\b/i,
    );
  });

  it("loadWorkshopQuestions('ai-native-operator') resolves the same 22-question pool via dynamic import", async () => {
    const loaded = await loadWorkshopQuestions("ai-native-operator", "en");
    expect(loaded).toHaveLength(22);
    expect(loaded[0].id).toBe("ano-q01");
  });

  it("bank size equals served count, matching the codebase convention (ki-fuehrerschein 20/20, eu-ai-act-kurs 27/27, claude 19/19)", async () => {
    const loaded = await loadWorkshopQuestions("ai-native-operator", "en");
    expect(loaded.length).toBe(22);
  });

  it("loads the German workshop pool through the shared async loader", async () => {
    const loaded = await loadWorkshopQuestions("ai-native-operator", "de");
    expect(loaded).toHaveLength(22);
    expect(loaded[0].questionText).toContain("Modellunterstützung");
  });
});
