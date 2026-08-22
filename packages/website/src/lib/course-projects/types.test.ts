import { describe, expect, it } from "vitest";
import {
  COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASSES,
  getCourseProjectExecutionReceipt,
  getCourseProjectLocalLearningReceipt,
  hasCourseProjectLearningEvidence,
  type CourseProjectArtifactState,
} from "./types";

const REQUIRED_LOCAL_LEARNING_FLAGS = [
  "privacyConfirmed",
  "goalReady",
  "contextReady",
  "constraintsReady",
  "approvalGate",
  "stopCondition",
  "handoffDefined",
] as const;

function localLearningArtifact(
  courseSlug: "ai-native" | "claude" | "ai-native-operator" = "ai-native",
): CourseProjectArtifactState {
  const receipt = getCourseProjectLocalLearningReceipt(courseSlug);
  return {
    version: 1,
    engineKind: "prompt",
    fields: {
      variant: courseSlug,
      learningReceipt: receipt,
      executionReceipt: null,
      providerEvidence: "none",
      completionMode: "local-learning",
      providerFailureClass: "auth",
      privacyConfirmed: true,
      goalReady: true,
      contextReady: true,
      constraintsReady: true,
      approvalGate: true,
      stopCondition: true,
      handoffDefined: true,
      ...(courseSlug === "claude" ? { secondaryReady: true } : {}),
    },
  };
}

describe("course project learning evidence", () => {
  it.each(COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASSES)(
    "accepts the bounded %s local-learning failure class",
    (providerFailureClass) => {
      const artifact = localLearningArtifact();
      const receipt = getCourseProjectLocalLearningReceipt("ai-native");

      expect(
        hasCourseProjectLearningEvidence(
          {
            ...artifact,
            fields: { ...artifact.fields, providerFailureClass },
          },
          "ai-native",
          receipt,
        ),
      ).toBe(true);
    },
  );

  it.each([undefined, "validation", "malformed-response"])(
    "rejects the non-local-learning failure class %s",
    (providerFailureClass) => {
      const artifact = localLearningArtifact();
      const receipt = getCourseProjectLocalLearningReceipt("ai-native");
      const fields = { ...artifact.fields };
      if (providerFailureClass === undefined) {
        delete fields.providerFailureClass;
      } else {
        fields.providerFailureClass = providerFailureClass;
      }

      expect(
        hasCourseProjectLearningEvidence(
          { ...artifact, fields },
          "ai-native",
          receipt,
        ),
      ).toBe(false);
    },
  );

  it.each(REQUIRED_LOCAL_LEARNING_FLAGS)(
    "rejects local-learning evidence without %s",
    (field) => {
      const artifact = localLearningArtifact();
      const receipt = getCourseProjectLocalLearningReceipt("ai-native");

      expect(
        hasCourseProjectLearningEvidence(
          {
            ...artifact,
            fields: { ...artifact.fields, [field]: false },
          },
          "ai-native",
          receipt,
        ),
      ).toBe(false);
    },
  );

  it("requires the exact course variant and local receipt", () => {
    const artifact = localLearningArtifact();
    const receipt = getCourseProjectLocalLearningReceipt("ai-native");

    expect(
      hasCourseProjectLearningEvidence(
        {
          ...artifact,
          fields: { ...artifact.fields, variant: "claude" },
        },
        "ai-native",
        receipt,
      ),
    ).toBe(false);
    expect(
      hasCourseProjectLearningEvidence(
        artifact,
        "ai-native",
        getCourseProjectLocalLearningReceipt("claude"),
      ),
    ).toBe(false);
  });

  it.each([
    [
      "artifact receipt",
      { learningReceipt: "prompt:claude:local-learning-v1" },
    ],
    [
      "null execution receipt",
      { executionReceipt: getCourseProjectExecutionReceipt("ai-native") },
    ],
    ["no provider evidence", { providerEvidence: "success" }],
    ["local completion mode", { completionMode: "provider-success" }],
  ])(
    "rejects local-learning evidence without the exact %s",
    (_label, change) => {
      const artifact = localLearningArtifact();
      const receipt = getCourseProjectLocalLearningReceipt("ai-native");

      expect(
        hasCourseProjectLearningEvidence(
          { ...artifact, fields: { ...artifact.fields, ...change } },
          "ai-native",
          receipt,
        ),
      ).toBe(false);
    },
  );

  it("requires Claude's secondary grounding prompt readiness", () => {
    const artifact = localLearningArtifact("claude");
    const receipt = getCourseProjectLocalLearningReceipt("claude");

    expect(hasCourseProjectLearningEvidence(artifact, "claude", receipt)).toBe(
      true,
    );
    expect(
      hasCourseProjectLearningEvidence(
        {
          ...artifact,
          fields: { ...artifact.fields, secondaryReady: false },
        },
        "claude",
        receipt,
      ),
    ).toBe(false);
  });
});
