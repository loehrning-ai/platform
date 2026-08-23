import { describe, expect, it } from "vitest";
import { MAX_EXERCISE_SUMMARY_BYTES } from "@/lib/progress/types";
import {
  hasValidCourseProjectArtifact,
  parseCourseProjectProgress,
  serializeCourseProjectProgress,
} from "./persistence";
import { verifiedCourseProjectArtifact } from "./test-artifact";
import { getCourseProjectLocalLearningReceipt } from "./types";

describe("course project persistence envelope", () => {
  it("round-trips only bounded structured engine evidence", () => {
    const stored = serializeCourseProjectProgress("Prompt verified", {
      version: 1,
      engineKind: "prompt",
      fields: {
        privacyConfirmed: true,
        goalReady: true,
        providerEvidence: "success",
      },
    });

    expect(parseCourseProjectProgress(stored, "prompt")).toEqual({
      summary: "Prompt verified",
      artifact: {
        version: 1,
        engineKind: "prompt",
        fields: {
          privacyConfirmed: true,
          goalReady: true,
          providerEvidence: "success",
        },
      },
    });
  });

  it("round-trips a fixed local-learning receipt without accepting it as final evidence", () => {
    const learningReceipt = getCourseProjectLocalLearningReceipt("ai-native");
    const stored = serializeCourseProjectProgress(null, {
      version: 1,
      engineKind: "prompt",
      fields: {
        stages: ["ground"],
        executionReceipt: null,
        learningReceipt,
        providerEvidence: "none",
        completionMode: "local-learning",
        providerFailureClass: "auth",
      },
    });

    expect(
      parseCourseProjectProgress(stored, "prompt").artifact?.fields,
    ).toMatchObject({
      learningReceipt,
      executionReceipt: null,
      providerEvidence: "none",
      completionMode: "local-learning",
    });
    expect(hasValidCourseProjectArtifact(stored, "prompt", "ai-native")).toBe(
      false,
    );

    const forged = serializeCourseProjectProgress(null, {
      version: 1,
      engineKind: "prompt",
      fields: {
        goalReady: true,
        learningReceipt: "private-free-form-learner-text",
      },
    });
    expect(forged).not.toContain("private-free-form-learner-text");
    expect(
      parseCourseProjectProgress(forged, "prompt").artifact?.fields,
    ).toEqual({ goalReady: true });
  });

  it("drops and rejects unknown fields instead of persisting learner text", () => {
    const sentinel = "private-free-form-learner-text";
    const stored = serializeCourseProjectProgress(null, {
      version: 1,
      engineKind: "repo",
      fields: {
        context: sentinel,
        specReady: true,
      },
    });
    expect(stored).not.toContain(sentinel);
    expect(parseCourseProjectProgress(stored, "repo").artifact?.fields).toEqual(
      {
        specReady: true,
      },
    );
    expect(
      parseCourseProjectProgress(
        `@cp1:${JSON.stringify({
          k: "repo",
          f: { specReady: true, context: sentinel },
        })}`,
        "repo",
      ).artifact,
    ).toBeNull();
  });

  it("always stays inside the existing UTF-8 exercise-summary boundary", () => {
    const stored = serializeCourseProjectProgress("ä".repeat(400), {
      version: 1,
      engineKind: "repo",
      fields: {
        workspace: `pipeline-quality-${"ß".repeat(300)}`,
        commandSequence: `canonical-${"ß".repeat(300)}`,
        attestationContract: `pipeline-quality-v1-${"ß".repeat(300)}`,
        specReady: true,
        sandboxAttested: true,
      },
    });

    expect(new TextEncoder().encode(stored).length).toBeLessThanOrEqual(
      MAX_EXERCISE_SUMMARY_BYTES,
    );
    expect(parseCourseProjectProgress(stored, "repo").artifact).not.toBeNull();
  });

  it("cannot produce a truncated JSON envelope from escape-heavy input", () => {
    const hostile = '\u0000"\\'.repeat(200);
    const stored = serializeCourseProjectProgress(hostile, {
      version: 1,
      engineKind: "case",
      fields: {
        responses: Array.from({ length: 20 }, () => hostile),
        sources: Array.from({ length: 20 }, () => hostile),
        review: Array.from({ length: 20 }, () => hostile),
      },
    });

    expect(new TextEncoder().encode(stored).length).toBeLessThanOrEqual(
      MAX_EXERCISE_SUMMARY_BYTES,
    );
    expect(parseCourseProjectProgress(stored, "case").artifact).not.toBeNull();
    expect(
      hasValidCourseProjectArtifact(stored, "case", "ki-fuehrerschein"),
    ).toBe(false);
  });

  it("reads legacy plain summaries and rejects a mismatched engine", () => {
    expect(parseCourseProjectProgress("Legacy verified note", "data")).toEqual({
      summary: "Legacy verified note",
      artifact: null,
    });

    const stored = serializeCourseProjectProgress(null, {
      version: 1,
      engineKind: "case",
      fields: { choice: "escalate" },
    });
    expect(parseCourseProjectProgress(stored, "prompt")).toEqual({
      summary: null,
      artifact: null,
    });
  });

  it.each([
    ["missing", undefined],
    ["plain text", "Legacy verified note"],
    ["malformed JSON", '@cp1:{"k":"prompt","f":'],
    ["empty fields", '@cp1:{"k":"prompt","f":{}}'],
    ["unexpected envelope field", '@cp1:{"k":"prompt","f":{"ok":true},"x":1}'],
    [
      "too many fields",
      `@cp1:${JSON.stringify({
        k: "prompt",
        f: Object.fromEntries(
          Array.from({ length: 9 }, (_, index) => [`f${index}`, true]),
        ),
      })}`,
    ],
    [
      "oversized field key",
      `@cp1:${JSON.stringify({ k: "prompt", f: { ["k".repeat(33)]: true } })}`,
    ],
    [
      "oversized string value",
      `@cp1:${JSON.stringify({ k: "prompt", f: { value: "x".repeat(161) } })}`,
    ],
    [
      "oversized array",
      `@cp1:${JSON.stringify({
        k: "prompt",
        f: { values: Array.from({ length: 7 }, () => "x") },
      })}`,
    ],
  ] as const)(
    "does not trust a %s envelope as artifact evidence",
    (_label, stored) => {
      expect(hasValidCourseProjectArtifact(stored, "prompt", "ai-native")).toBe(
        false,
      );
    },
  );

  it("requires the expected engine at the completion boundary", () => {
    const stored = serializeCourseProjectProgress(
      "Verified",
      verifiedCourseProjectArtifact("codex"),
    );

    expect(hasValidCourseProjectArtifact(stored, "repo", "codex")).toBe(true);
    expect(hasValidCourseProjectArtifact(stored, "prompt", "ai-native")).toBe(
      false,
    );
  });

  it.each([
    ["prompt", "ai-native"],
    ["prompt", "claude"],
    ["prompt", "ai-native-operator"],
    ["repo", "codex"],
    ["data", "data-science"],
    ["data", "data-engineering-fundamentals"],
    ["data", "data-infrastructure"],
    ["case", "ki-fuehrerschein"],
    ["case", "ki-und-gesellschaft"],
    ["case", "eu-ai-act-kurs"],
  ] as const)(
    "accepts verified %s evidence for %s",
    (engineKind, courseSlug) => {
      const stored = serializeCourseProjectProgress(
        "Verified",
        verifiedCourseProjectArtifact(courseSlug),
      );

      expect(new TextEncoder().encode(stored).length).toBeLessThanOrEqual(
        MAX_EXERCISE_SUMMARY_BYTES,
      );
      expect(
        hasValidCourseProjectArtifact(stored, engineKind, courseSlug),
      ).toBe(true);
    },
  );

  it.each([
    ["trim marker", "prompt", "ai-native", { artifactTrimmed: true }],
    [
      "artifact with reversed project stages",
      "prompt",
      "ai-native",
      {
        ...verifiedCourseProjectArtifact("ai-native").fields,
        stages: ["transfer", "verify", "run", "build", "ground"],
      },
    ],
    [
      "prompt without handoff",
      "prompt",
      "ai-native",
      {
        ...verifiedCourseProjectArtifact("ai-native").fields,
        handoffDefined: false,
      },
    ],
    [
      "prompt with invented provider evidence",
      "prompt",
      "ai-native",
      {
        ...verifiedCourseProjectArtifact("ai-native").fields,
        providerEvidence: "none",
      },
    ],
    [
      "Claude prompt with only one provider output",
      "prompt",
      "claude",
      {
        ...verifiedCourseProjectArtifact("claude").fields,
        twoOutputEvidence: false,
      },
    ],
    [
      "Claude prompt with an arbitrary comparison verdict",
      "prompt",
      "claude",
      {
        ...verifiedCourseProjectArtifact("claude").fields,
        comparisonDecision: "looks-good",
      },
    ],
    [
      "Claude prompt with a forged claim redline",
      "prompt",
      "claude",
      {
        ...verifiedCourseProjectArtifact("claude").fields,
        claimReviewCode: 113153,
      },
    ],
    [
      "Claude prompt without four valid rubric dimensions",
      "prompt",
      "claude",
      {
        ...verifiedCourseProjectArtifact("claude").fields,
        rubricScores: 5555,
      },
    ],
    [
      "Claude prompt with a comparison verdict contradicted by its rubric",
      "prompt",
      "claude",
      {
        ...verifiedCourseProjectArtifact("claude").fields,
        comparisonDecision: "a-stronger",
        rubricScores: 22133344,
      },
    ],
    [
      "prompt with an unapproved model identity",
      "prompt",
      "ai-native",
      {
        ...verifiedCourseProjectArtifact("ai-native").fields,
        providerModel: "unknown/model",
      },
    ],
    [
      "repo without a passing post-fix test",
      "repo",
      "codex",
      {
        ...verifiedCourseProjectArtifact("codex").fields,
        postfixPassed: false,
      },
    ],
    [
      "data with the wrong decision",
      "data",
      "data-science",
      {
        ...verifiedCourseProjectArtifact("data-science").fields,
        decision: "continue",
      },
    ],
    [
      "data with a mismatched course variant",
      "data",
      "data-science",
      {
        ...verifiedCourseProjectArtifact("data-science").fields,
        variant: "pipeline",
      },
    ],
    [
      "data without an execution receipt",
      "data",
      "data-science",
      {
        ...verifiedCourseProjectArtifact("data-science").fields,
        executionVerified: false,
      },
    ],
    [
      "data with a forged fixture version",
      "data",
      "data-engineering-fundamentals",
      {
        ...verifiedCourseProjectArtifact("data-engineering-fundamentals")
          .fields,
        executionReceipt: "de-events-v2:node24",
      },
    ],
    [
      "data missing its course-specific executed invariant",
      "data",
      "data-infrastructure",
      {
        ...verifiedCourseProjectArtifact("data-infrastructure").fields,
        zeroLoss: false,
      },
    ],
    [
      "legacy fixed-arithmetic data evidence",
      "data",
      "data-science",
      {
        stages: ["ground", "build", "run", "verify", "transfer"],
        variant: "experiment",
        planValid: true,
        parameter: 100,
        failureInjected: true,
        calculated: true,
        failureObserved: true,
        decision: "quarantine",
        noteReady: true,
      },
    ],
    [
      "case with arbitrary answers",
      "case",
      "ki-fuehrerschein",
      {
        ...verifiedCourseProjectArtifact("ki-fuehrerschein").fields,
        responses: ["a:x", "b:y", "c:z"],
      },
    ],
    [
      "case missing one evidence source",
      "case",
      "ki-fuehrerschein",
      {
        ...verifiedCourseProjectArtifact("ki-fuehrerschein").fields,
        sources: ["product-note"],
      },
    ],
    [
      "case with filler standing in for structured review evidence",
      "case",
      "ki-fuehrerschein",
      {
        ...verifiedCourseProjectArtifact("ki-fuehrerschein").fields,
        review: ["note:any sufficiently long filler"],
      },
    ],
  ] as const)("rejects forged %s", (_label, engineKind, courseSlug, fields) => {
    const stored = serializeCourseProjectProgress("Forged", {
      version: 1,
      engineKind,
      fields,
    });

    expect(hasValidCourseProjectArtifact(stored, engineKind, courseSlug)).toBe(
      false,
    );
  });

  it("keeps every degraded prompt result outside provider-backed completion", () => {
    const valid = verifiedCourseProjectArtifact("claude");
    const degraded = serializeCourseProjectProgress("Policy stop", {
      ...valid,
      fields: {
        ...valid.fields,
        evaluation: "stop",
        providerEvidence: "none",
        completionMode: "degraded-policy",
        providerFailureClass: "policy-not-ready",
      },
    });
    const quotaFailure = serializeCourseProjectProgress("Quota stop", {
      ...valid,
      fields: {
        ...valid.fields,
        evaluation: "stop",
        providerEvidence: "none",
        completionMode: "degraded-policy",
        providerFailureClass: "quota",
      },
    });

    expect(hasValidCourseProjectArtifact(degraded, "prompt", "claude")).toBe(
      false,
    );
    expect(
      hasValidCourseProjectArtifact(quotaFailure, "prompt", "claude"),
    ).toBe(false);
  });
});
