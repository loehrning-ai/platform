/**
 * Shared quiz-content-validation helper. Every course
 * plan's own content guard test (data.test.ts-equivalents in )
 * calls this instead of re-deriving the same "exactly one correct answer,
 * non-empty explanation" check per quiz question.
 */

export interface QuizQuestionLike {
  readonly id?: string;
  readonly answerOptions: readonly { readonly isCorrect: boolean }[];
  readonly explanation: string;
}

/**
 * Throws with a message naming the offending question's id (falls back to
 * its index) the first time a question fails either check:
 *   - exactly one `answerOptions` entry has `isCorrect: true`
 *   - `explanation` is non-empty after trimming whitespace
 */
export function assertValidQuizQuestions(
  questions: readonly QuizQuestionLike[],
): void {
  questions.forEach((question, index) => {
    const label = question.id ?? `#${index}`;
    const correctCount = question.answerOptions.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(
        `Quiz question "${label}" must have exactly one correct answer option, found ${correctCount}.`,
      );
    }
    if (question.explanation.trim().length === 0) {
      throw new Error(`Quiz question "${label}" must have a non-empty explanation.`);
    }
  });
}
