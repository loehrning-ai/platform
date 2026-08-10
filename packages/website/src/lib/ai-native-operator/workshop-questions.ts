import type { QuizQuestion } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { getAllLessons } from "./data";

const QUESTION_DIFFICULTIES = [
  "easy",
  "easy",
  "medium",
  "medium",
  "medium",
  "medium",
  "medium",
  "easy",
  "medium",
  "easy",
  "medium",
  "medium",
  "medium",
  "easy",
  "medium",
  "hard",
  "medium",
  "hard",
  "medium",
  "medium",
  "medium",
  "easy",
] as const;

/** Build the final quiz from the reviewed module checks without duplicating copy. */
export async function getAiNativeOperatorWorkshopQuestions(
  locale: Locale,
): Promise<readonly QuizQuestion[]> {
  const sourceQuestions = (await getAllLessons(locale)).flatMap(
    (lesson) => lesson.quiz,
  );
  if (sourceQuestions.length !== QUESTION_DIFFICULTIES.length) {
    throw new Error(
      `AI-Native Operator ${locale} bundle has ${sourceQuestions.length} workshop questions; expected ${QUESTION_DIFFICULTIES.length}.`,
    );
  }
  return sourceQuestions.map((question, index) => ({
    id: `ano-q${String(index + 1).padStart(2, "0")}`,
    questionType: "single_choice",
    difficulty: QUESTION_DIFFICULTIES[index],
    questionText: question.questionText,
    answerOptions: question.answerOptions,
    explanation: question.explanation,
    version: 1,
    active: true,
  }));
}
