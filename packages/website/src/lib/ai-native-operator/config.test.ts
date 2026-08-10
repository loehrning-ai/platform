import { describe, expect, it } from "vitest";
import { assertTechnicalCourseConfigParity } from "@/lib/technical-courses/routes";
import {
  AI_NATIVE_OPERATOR_CONFIG,
  AI_NATIVE_OPERATOR_CONFIG_DE,
} from "./config";

describe("AI-Native Operator localized configuration", () => {
  it("translates visible record copy without changing route or assessment identity", () => {
    expect(() =>
      assertTechnicalCourseConfigParity(
        AI_NATIVE_OPERATOR_CONFIG,
        AI_NATIVE_OPERATOR_CONFIG_DE,
      ),
    ).not.toThrow();
    expect(AI_NATIVE_OPERATOR_CONFIG.language).toBe("en");
    expect(AI_NATIVE_OPERATOR_CONFIG_DE.language).toBe("de");
    expect(AI_NATIVE_OPERATOR_CONFIG_DE.slug).toBe(
      AI_NATIVE_OPERATOR_CONFIG.slug,
    );
    expect(AI_NATIVE_OPERATOR_CONFIG_DE.basePath).toBe(
      AI_NATIVE_OPERATOR_CONFIG.basePath,
    );
    expect(AI_NATIVE_OPERATOR_CONFIG_DE.coursePath).toBe(
      AI_NATIVE_OPERATOR_CONFIG.coursePath,
    );
    expect(AI_NATIVE_OPERATOR_CONFIG_DE.workshopQuizQuestionCount).toBe(22);
    expect(AI_NATIVE_OPERATOR_CONFIG_DE.recordNoun.label).toBe(
      "Teilnahmebestätigung",
    );
  });
});
