import type { CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";

export type LocalizedProjectText = Readonly<Record<Locale, string>>;

export type CourseProjectEngineKind = "prompt" | "repo" | "data" | "case";

export const COURSE_PROJECT_EXECUTION_RECEIPTS = {
  "ki-fuehrerschein": "case:ki-fuehrerschein:local-evaluation-v1",
  "eu-ai-act-kurs": "case:eu-ai-act-kurs:local-evaluation-v1",
  "ai-native": "prompt:ai-native:provider-v1",
  "ki-und-gesellschaft": "case:ki-und-gesellschaft:local-evaluation-v1",
  "data-engineering-fundamentals": "de-events-v1:node24",
  "data-science": "ds-leakage-v1:node24",
  "data-infrastructure": "di-partition-v1:node24",
  codex: "repo:codex:pipeline-quality-v1",
  claude: "prompt:claude:grounded-provider-pair-v1",
  "ai-native-operator": "prompt:ai-native-operator:provider-v1",
} as const satisfies Readonly<Record<CourseSlug, string>>;

export type CourseProjectExecutionReceipt =
  (typeof COURSE_PROJECT_EXECUTION_RECEIPTS)[CourseSlug];

export const COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS = {
  "ai-native": "prompt:ai-native:local-learning-v1",
  claude: "prompt:claude:local-learning-v1",
  "ai-native-operator": "prompt:ai-native-operator:local-learning-v1",
} as const;

export const COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASSES = [
  "policy-disabled",
  "policy-not-ready",
  "auth",
  "quota",
  "provider",
  "network",
] as const;

export type CourseProjectLocalLearningFailureClass =
  (typeof COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASSES)[number];

const COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASS_SET = new Set<string>(
  COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASSES,
);

export type CourseProjectLocalLearningReceipt =
  (typeof COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS)[keyof typeof COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS];

export type CourseProjectLearningReceipt =
  CourseProjectExecutionReceipt | CourseProjectLocalLearningReceipt;

export function getCourseProjectLocalLearningReceipt(
  courseSlug: "ai-native" | "claude" | "ai-native-operator",
): CourseProjectLocalLearningReceipt {
  return COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS[courseSlug];
}

export function isCourseProjectLocalLearningFailureClass(
  value: unknown,
): value is CourseProjectLocalLearningFailureClass {
  return (
    typeof value === "string" &&
    COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASS_SET.has(value)
  );
}

const COURSE_PROJECT_EXECUTION_RECEIPT_SET = new Set<string>(
  Object.values(COURSE_PROJECT_EXECUTION_RECEIPTS),
);

export function getCourseProjectExecutionReceipt(
  courseSlug: CourseSlug,
): CourseProjectExecutionReceipt {
  return COURSE_PROJECT_EXECUTION_RECEIPTS[courseSlug];
}

export function isCourseProjectExecutionReceipt(
  value: unknown,
): value is CourseProjectExecutionReceipt {
  return (
    typeof value === "string" && COURSE_PROJECT_EXECUTION_RECEIPT_SET.has(value)
  );
}

/**
 * Confirms that a fixed receipt is backed by the engine-specific execution
 * evidence retained in the bounded artifact. Ordinary control changes cannot
 * satisfy this predicate.
 */
export function hasCourseProjectExecutionEvidence(
  artifact: CourseProjectArtifactState | null,
  courseSlug: CourseSlug,
  receipt: CourseProjectLearningReceipt | null,
): boolean {
  const expectedReceipt = getCourseProjectExecutionReceipt(courseSlug);
  if (
    !artifact ||
    receipt !== expectedReceipt ||
    artifact.fields.executionReceipt !== expectedReceipt
  ) {
    return false;
  }

  if (artifact.engineKind === "prompt") {
    return (
      (courseSlug === "ai-native" ||
        courseSlug === "claude" ||
        courseSlug === "ai-native-operator") &&
      artifact.fields.variant === courseSlug &&
      artifact.fields.providerEvidence === "success" &&
      artifact.fields.completionMode === "provider-success" &&
      (courseSlug !== "claude" || artifact.fields.twoOutputEvidence === true)
    );
  }

  if (artifact.engineKind === "repo") {
    return (
      courseSlug === "codex" &&
      artifact.fields.sandboxAttested === true &&
      artifact.fields.attestationContract === "pipeline-quality-v1" &&
      artifact.fields.workspace === "pipeline-quality" &&
      artifact.fields.commandSequence === "canonical"
    );
  }

  if (artifact.engineKind === "data") {
    return (
      (courseSlug === "data-science" ||
        courseSlug === "data-engineering-fundamentals" ||
        courseSlug === "data-infrastructure") &&
      artifact.fields.executionVerified === true &&
      artifact.fields.testsPassed === true
    );
  }

  return (
    artifact.engineKind === "case" &&
    (courseSlug === "ki-fuehrerschein" ||
      courseSlug === "eu-ai-act-kurs" ||
      courseSlug === "ki-und-gesellschaft")
  );
}

/**
 * Accepts either final provider/execution evidence or the prompt lab's
 * explicitly local, synthetic learning run. The latter is lesson-loop
 * evidence only and is intentionally rejected by final artifact validation.
 */
export function hasCourseProjectLearningEvidence(
  artifact: CourseProjectArtifactState | null,
  courseSlug: CourseSlug,
  receipt: CourseProjectLearningReceipt | null,
): boolean {
  if (hasCourseProjectExecutionEvidence(artifact, courseSlug, receipt)) {
    return true;
  }
  if (
    !artifact ||
    artifact.engineKind !== "prompt" ||
    (courseSlug !== "ai-native" &&
      courseSlug !== "claude" &&
      courseSlug !== "ai-native-operator")
  ) {
    return false;
  }
  const expected = getCourseProjectLocalLearningReceipt(courseSlug);
  return (
    receipt === expected &&
    artifact.fields.learningReceipt === expected &&
    artifact.fields.executionReceipt === null &&
    artifact.fields.providerEvidence === "none" &&
    artifact.fields.completionMode === "local-learning" &&
    artifact.fields.variant === courseSlug &&
    isCourseProjectLocalLearningFailureClass(
      artifact.fields.providerFailureClass,
    ) &&
    artifact.fields.privacyConfirmed === true &&
    artifact.fields.goalReady === true &&
    artifact.fields.contextReady === true &&
    artifact.fields.constraintsReady === true &&
    artifact.fields.approvalGate === true &&
    artifact.fields.stopCondition === true &&
    artifact.fields.handoffDefined === true &&
    (courseSlug !== "claude" || artifact.fields.secondaryReady === true)
  );
}

export const COURSE_PROJECT_STAGE_IDS = [
  "ground",
  "build",
  "run",
  "verify",
  "transfer",
] as const;

export type CourseProjectStageId = (typeof COURSE_PROJECT_STAGE_IDS)[number];

export interface CourseProjectStage {
  readonly id: CourseProjectStageId;
  readonly objective: LocalizedProjectText;
  readonly evidence: LocalizedProjectText;
}

/**
 * The tuple encodes the instructional contract: every studio follows the same
 * five-stage learning loop and cannot silently omit or reorder a stage.
 */
export type CourseProjectStages = readonly [
  CourseProjectStage & { readonly id: "ground" },
  CourseProjectStage & { readonly id: "build" },
  CourseProjectStage & { readonly id: "run" },
  CourseProjectStage & { readonly id: "verify" },
  CourseProjectStage & { readonly id: "transfer" },
];

export interface CourseProjectConfig {
  readonly id: string;
  readonly courseSlug: CourseSlug;
  /**
   * Stable canonical lesson that owns this course-wide project's progress.
   * The studio may be mounted from several lessons, but it must never create
   * a separate exercise record for each entry point.
   */
  readonly progressLessonId: string;
  readonly engineKind: CourseProjectEngineKind;
  readonly title: LocalizedProjectText;
  readonly mission: LocalizedProjectText;
  readonly artifact: LocalizedProjectText;
  readonly scenario: LocalizedProjectText;
  readonly safety: LocalizedProjectText;
  readonly completionCriteria: readonly LocalizedProjectText[];
  readonly stages: CourseProjectStages;
}

export type CourseProjectArtifactValue =
  string | number | boolean | null | readonly string[];

/**
 * Compact, JSON-safe engine state. This is intentionally data-only so it can
 * be persisted inside the existing exercise-result boundary and rehydrated
 * without executing learner-controlled content.
 */
export interface CourseProjectArtifactState {
  readonly version: 1;
  readonly engineKind: CourseProjectEngineKind;
  readonly fields: Readonly<Record<string, CourseProjectArtifactValue>>;
}

/** Shared boundary between the studio shell and every lazily loaded engine. */
export interface CourseProjectEngineProps {
  readonly config: CourseProjectConfig;
  readonly lessonId: string;
  readonly locale: Locale;
  readonly initialArtifact: CourseProjectArtifactState | null;
  /** Final acceptance remains disabled until all five ordered project stages exist. */
  readonly verificationEnabled?: boolean;
  /**
   * Synchronous learner-intent signal for a bounded exercise control. Engines
   * must not call this for consent, provider readiness, or model selection.
   */
  onMeaningfulInteraction?(): void;
  /** Emitted only after the engine's explicit bounded run succeeds. */
  onExecutionReceipt?(receipt: CourseProjectLearningReceipt): void;
  onArtifactChange(artifact: CourseProjectArtifactState): void;
  onVerified(summary: string, artifact: CourseProjectArtifactState): void;
}

export const COURSE_PROJECT_STAGE_LABELS: Readonly<
  Record<CourseProjectStageId, LocalizedProjectText>
> = {
  ground: { de: "Einordnen", en: "Ground" },
  build: { de: "Bauen", en: "Build" },
  run: { de: "Ausführen", en: "Run" },
  verify: { de: "Prüfen", en: "Verify" },
  transfer: { de: "Übertragen", en: "Transfer" },
};
