import type { CourseSlug } from "@/lib/course/types";

import {
  COURSE_PROJECT_STAGE_IDS,
  getCourseProjectExecutionReceipt,
  type CourseProjectArtifactState,
} from "./types";

/** Verified engine output used only by regression fixtures. */
export function verifiedCourseProjectArtifact(
  courseSlug: CourseSlug,
): CourseProjectArtifactState {
  if (
    courseSlug === "ai-native" ||
    courseSlug === "claude" ||
    courseSlug === "ai-native-operator"
  ) {
    return {
      version: 1,
      engineKind: "prompt",
      fields: {
        stages: [...COURSE_PROJECT_STAGE_IDS],
        executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
        privacyConfirmed: true,
        goalReady: true,
        contextReady: true,
        constraintsReady: true,
        variant: courseSlug,
        approvalGate: true,
        stopCondition: true,
        handoffDefined: true,
        ...(courseSlug === "claude"
          ? {
              twoOutputEvidence: true,
              comparisonDecision: "b-stronger",
              claimReviewCode: 423153,
              rubricScores: 22133344,
            }
          : {
              secondaryReady: true,
              evaluation:
                courseSlug === "ai-native-operator" ? "intervene" : "workflow",
            }),
        providerEvidence: "success",
        completionMode: "provider-success",
        providerModel: "anthropic/claude-haiku-4.5",
        ...(courseSlug === "ai-native-operator" ? { budget: 4 } : {}),
      },
    };
  }

  if (courseSlug === "codex") {
    return {
      version: 1,
      engineKind: "repo",
      fields: {
        stages: [...COURSE_PROJECT_STAGE_IDS],
        executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
        specReady: true,
        sandboxAttested: true,
        attestationContract: "pipeline-quality-v1",
        workspace: "pipeline-quality",
        commandSequence: "canonical",
        baselineFailed: true,
        postfixPassed: true,
        checksPassed: true,
        diffScoped: true,
      },
    };
  }

  if (
    courseSlug === "data-science" ||
    courseSlug === "data-engineering-fundamentals" ||
    courseSlug === "data-infrastructure"
  ) {
    return {
      version: 1,
      engineKind: "data",
      fields: {
        stages: [...COURSE_PROJECT_STAGE_IDS],
        variant:
          courseSlug === "data-science"
            ? "experiment"
            : courseSlug === "data-engineering-fundamentals"
              ? "pipeline"
              : "control-room",
        planValid: true,
        failureInjected: true,
        executionVerified: true,
        executionReceipt:
          courseSlug === "data-science"
            ? "ds-leakage-v1:node24"
            : courseSlug === "data-engineering-fundamentals"
              ? "de-events-v1:node24"
              : "di-partition-v1:node24",
        testsPassed: true,
        failureObserved: true,
        decision:
          courseSlug === "data-science"
            ? "publish-safe-with-limits"
            : courseSlug === "data-engineering-fundamentals"
              ? "isolate-backfill-reconcile"
              : "isolate-replay-verify-slo",
        noteReady: true,
        ...(courseSlug === "data-science"
          ? {
              safeMetricCompared: true,
              leakageDetected: true,
              peekingDetected: true,
            }
          : courseSlug === "data-engineering-fundamentals"
            ? {
                reconciled: true,
                idempotent: true,
                lateBackfilled: true,
              }
            : { sloBreached: true, recovered: true, zeroLoss: true }),
      },
    };
  }

  if (courseSlug === "ki-fuehrerschein") {
    return {
      version: 1,
      engineKind: "case",
      fields: {
        stages: [...COURSE_PROJECT_STAGE_IDS],
        executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
        responses: [
          "private-segment:remove",
          "unsupported-claim:uncertain",
          "review-step:review",
        ],
        sources: ["product-note", "review-policy"],
        review: [
          "boundary:supported-only",
          "uncertainty:no-measurement",
          "escalation:human-approval",
          "next-evidence:approved-measurement",
        ],
      },
    };
  }

  if (courseSlug === "ki-und-gesellschaft") {
    return {
      version: 1,
      engineKind: "case",
      fields: {
        stages: [...COURSE_PROJECT_STAGE_IDS],
        executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
        responses: ["claim:claim", "observation:signal", "stakeholders:hold"],
        sources: ["origin", "city"],
        review: [
          "boundary:claim-not-fact",
          "uncertainty:cause-unknown",
          "escalation:hold-correct",
          "next-evidence:independent-source",
        ],
      },
    };
  }

  return {
    version: 1,
    engineKind: "case",
    fields: {
      stages: [...COURSE_PROJECT_STAGE_IDS],
      executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
      responses: ["system-boundary:impact", "roles:map", "legal-evidence:open"],
      sources: ["system-card", "primary-law"],
      review: [
        "boundary:provisional-role-risk",
        "uncertainty:open-facts-law",
        "escalation:legal-owner-review",
        "next-evidence:dated-primary-source",
      ],
    },
  };
}
