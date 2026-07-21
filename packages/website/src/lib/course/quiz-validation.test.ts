import { describe, expect, it } from "vitest";
import { assertValidQuizQuestions } from "./quiz-validation";

/**
 * Shared quiz-content-validation helper, exported for
 * every course plan's own content guard test to call instead of each
 * re-deriving the same "exactly one isCorrect, non-empty explanation"
 * check (previously duplicated across data.test.ts, questions.test.ts,
 * quiz-distribution.test.ts, workshop-quiz-distribution.test.ts, and
 * schema-validation.test.ts).
 */

function question(
  over: Partial<{
    id: string;
    answerOptions: readonly { readonly isCorrect: boolean }[];
    explanation: string;
  }> = {},
) {
  return {
    id: "q1",
    answerOptions: [{ isCorrect: true }, { isCorrect: false }],
    explanation: "Weil A korrekt ist.",
    ...over,
  };
}

describe("assertValidQuizQuestions", () => {
  it("does not throw for a well-formed question list", () => {
    expect(() =>
      assertValidQuizQuestions([question(), question({ id: "q2" })]),
    ).not.toThrow();
  });

  it("does not throw for an empty list", () => {
    expect(() => assertValidQuizQuestions([])).not.toThrow();
  });

  it("throws when a question has zero correct answers", () => {
    expect(() =>
      assertValidQuizQuestions([
        question({ answerOptions: [{ isCorrect: false }, { isCorrect: false }] }),
      ]),
    ).toThrow(/exactly one correct/i);
  });

  it("throws when a question has more than one correct answer", () => {
    expect(() =>
      assertValidQuizQuestions([
        question({ answerOptions: [{ isCorrect: true }, { isCorrect: true }] }),
      ]),
    ).toThrow(/exactly one correct/i);
  });

  it("throws when a question has an empty explanation", () => {
    expect(() =>
      assertValidQuizQuestions([question({ explanation: "" })]),
    ).toThrow(/explanation/i);
  });

  it("throws when a question's explanation is only whitespace", () => {
    expect(() =>
      assertValidQuizQuestions([question({ explanation: "   " })]),
    ).toThrow(/explanation/i);
  });

  it("includes the question id in the error message for fast debugging", () => {
    expect(() =>
      assertValidQuizQuestions([
        question({ id: "block_4_lesson_2_q3", explanation: "" }),
      ]),
    ).toThrow(/block_4_lesson_2_q3/);
  });
});
