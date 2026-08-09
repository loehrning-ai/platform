import { describe, it, expect } from "vitest";
import {
  AI_NATIVE_OPERATOR_BASE_PATH,
  courseHref,
  lessonHref,
  moduleHref,
} from "./routes";

describe("ai-native-operator route helpers ", () => {
  it("courseHref points at the course root under /kurse/open-source", () => {
    expect(AI_NATIVE_OPERATOR_BASE_PATH).toBe(
      "/kurse/open-source/ai-native-operator",
    );
    expect(courseHref()).toBe("/kurse/open-source/ai-native-operator");
  });

  it("moduleHref nests the module id directly under the course root, no /kurs segment", () => {
    expect(moduleHref("mindset")).toBe(
      "/kurse/open-source/ai-native-operator/mindset",
    );
    expect(moduleHref("measurement")).toBe(
      "/kurse/open-source/ai-native-operator/measurement",
    );
  });

  it("lessonHref nests moduleId/lessonNumber under the course root", () => {
    expect(lessonHref("mindset", 1)).toBe(
      "/kurse/open-source/ai-native-operator/mindset/1",
    );
    expect(lessonHref("measurement", 4)).toBe(
      "/kurse/open-source/ai-native-operator/measurement/4",
    );
  });

  it("preserves canonical German paths and prefixes English paths", () => {
    expect(courseHref("de")).toBe("/kurse/open-source/ai-native-operator");
    expect(courseHref("en")).toBe("/en/kurse/open-source/ai-native-operator");
    expect(moduleHref("data", "en")).toBe(
      "/en/kurse/open-source/ai-native-operator/data",
    );
    expect(lessonHref("governance", 3, "en")).toBe(
      "/en/kurse/open-source/ai-native-operator/governance/3",
    );
  });

  it("never renders a bare 'ai-native' path segment", () => {
    expect(moduleHref("mindset")).not.toMatch(/\/ai-native\//);
    expect(lessonHref("mindset", 1)).not.toMatch(/\/ai-native\//);
  });
});
