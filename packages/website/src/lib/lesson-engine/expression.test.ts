import { describe, expect, it } from "vitest";
import {
  compileExpression,
  evaluateCondition,
  evaluateExpression,
  evaluateNumber,
  ExpressionError,
} from "./expression";

describe("lesson-engine formula language", () => {
  it("follows arithmetic precedence and right-associative powers", () => {
    expect(evaluateNumber("1 + 2 * 3", {})).toBe(7);
    expect(evaluateNumber("(1 + 2) * 3", {})).toBe(9);
    expect(evaluateNumber("2 ^ 3 ^ 2", {})).toBe(512);
    expect(evaluateNumber("-2 ^ 2", {})).toBe(4);
    expect(evaluateNumber("10 % 4", {})).toBe(2);
    expect(evaluateNumber("1.5e3 / 3", {})).toBe(500);
  });

  it("reads variables and the whitelisted functions", () => {
    const scope = { turnover: 50_000_000, cap: 35_000_000 };
    expect(evaluateNumber("max(turnover * 0.07, cap)", scope)).toBe(35_000_000);
    expect(evaluateNumber("min(turnover * 0.07, cap)", scope)).toBeCloseTo(3_500_000);
    expect(evaluateNumber("round(2 / 3, 2)", {})).toBe(0.67);
    expect(evaluateNumber("clamp(12, 0, 10)", {})).toBe(10);
    expect(evaluateNumber("abs(-3) + floor(2.7) + ceil(0.2)", {})).toBe(6);
    expect(evaluateNumber("sqrt(16) + pow(2, 3) + log10(100)", {})).toBe(14);
  });

  it("supports comparisons, logic and ternaries for goals and verdicts", () => {
    const scope = { impact: 3, points: 6 };
    expect(evaluateCondition("impact == 3 || points >= 7", scope)).toBe(true);
    expect(evaluateCondition("impact < 3 && points >= 7", scope)).toBe(false);
    expect(evaluateCondition("!(points > 6)", scope)).toBe(true);
    expect(evaluateNumber("impact == 3 ? 3 : (points >= 5 ? 2 : 1)", scope)).toBe(3);
    expect(evaluateExpression("points > 5 ? 'high' : 'low'", scope)).toBe("high");
  });

  it("compares strings by value and concatenates with +", () => {
    expect(evaluateCondition("'a' == 'a'", {})).toBe(true);
    expect(evaluateExpression("'Stufe ' + 2", {})).toBe("Stufe 2");
  });

  it("lists the free variables a formula reads", () => {
    expect([...compileExpression("a + max(b, c) * (d ? e : 1)").variables].sort()).toEqual(
      ["a", "b", "c", "d", "e"],
    );
  });

  it("rejects unknown functions, bad syntax and code-like input at compile time", () => {
    expect(() => compileExpression("alert(1)")).toThrow(ExpressionError);
    expect(() => compileExpression("1 +")).toThrow(ExpressionError);
    expect(() => compileExpression("a.b")).toThrow(ExpressionError);
    expect(() => compileExpression("a = 1")).toThrow(ExpressionError);
    expect(() => compileExpression("x".repeat(600))).toThrow(ExpressionError);
  });

  it("never throws from the safe evaluators", () => {
    expect(evaluateNumber("unknown + 1", {})).toBeNaN();
    expect(evaluateCondition("unknown > 1", {})).toBe(false);
    expect(evaluateNumber("'abc' * 2", {})).toBeNaN();
    expect(evaluateExpression("((", {}, "fallback")).toBe("fallback");
  });

  it("does not resolve prototype properties as variables", () => {
    expect(evaluateNumber("constructor", {})).toBeNaN();
    expect(evaluateNumber("toString", {})).toBeNaN();
  });
});
