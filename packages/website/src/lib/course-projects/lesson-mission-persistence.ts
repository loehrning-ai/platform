import type { LessonMissionProfile } from "./lesson-missions";
import {
  hasExactRetrievalSchedule,
  type RetrievalSuccessLevel,
} from "./retrieval-schedule";
import {
  getCourseProjectExecutionReceipt,
  getCourseProjectLocalLearningReceipt,
  type CourseProjectLearningReceipt,
  type CourseProjectExecutionReceipt,
} from "./types";
export {
  getLessonMissionStorageKey,
  LESSON_MISSION_STORAGE_PREFIX,
} from "./storage-keys";

const MAX_SERIALIZED_STATE_LENGTH = 1_024;

const LEGACY_V2_KEYS = new Set([
  "version",
  "resetAt",
  "predictionId",
  "revealed",
  "workspaceOpened",
  "manipulated",
  "evidenceId",
  "retrievalId",
  "revisionId",
  "transferId",
  "collapsed",
]);
const LEGACY_V3_KEYS = new Set([
  ...LEGACY_V2_KEYS,
  "retrievalMastered",
  "retrievalFirstChoiceId",
  "retrievalAttemptCount",
  "retrievalSuccessLevel",
  "retrievalLastAttemptAt",
  "retrievalNextDueAt",
  "retrievalMisconceptionId",
]);
const CURRENT_V4_KEYS = new Set([...LEGACY_V3_KEYS, "executionReceipt"]);

export interface LessonMissionState {
  readonly version: 1;
  readonly predictionId: string | null;
  readonly revealed: boolean;
  readonly workspaceOpened: boolean;
  readonly manipulated: boolean;
  readonly executionReceipt: CourseProjectLearningReceipt | null;
  readonly evidenceId: string | null;
  /** Most recent locked choice. Null while a fresh written recall is pending. */
  readonly retrievalId: string | null;
  /** Remains true after the first successful retrieval or repair. */
  readonly retrievalMastered: boolean;
  /** Immutable choice from the learner's first retrieval attempt. */
  readonly retrievalFirstChoiceId: string | null;
  readonly retrievalAttemptCount: number;
  readonly retrievalSuccessLevel: RetrievalSuccessLevel;
  readonly retrievalLastAttemptAt: string | null;
  readonly retrievalNextDueAt: string | null;
  /** Fixed incorrect-choice ID used to select bounded repair feedback. */
  readonly retrievalMisconceptionId: string | null;
  readonly revisionId: string | null;
  readonly transferId: string | null;
  readonly collapsed: boolean;
}

export function createEmptyLessonMissionState(): LessonMissionState {
  return {
    version: 1,
    predictionId: null,
    revealed: false,
    workspaceOpened: false,
    manipulated: false,
    executionReceipt: null,
    evidenceId: null,
    retrievalId: null,
    retrievalMastered: false,
    retrievalFirstChoiceId: null,
    retrievalAttemptCount: 0,
    retrievalSuccessLevel: 0,
    retrievalLastAttemptAt: null,
    retrievalNextDueAt: null,
    retrievalMisconceptionId: null,
    revisionId: null,
    transferId: null,
    collapsed: false,
  };
}

/**
 * Returns true only for a parsed mission envelope that independently proves
 * every bounded step. Draft receipts must never substitute for this durable
 * mission evidence after a reload.
 */
export function hasCompletedLessonMission(
  state: LessonMissionState,
  profile: LessonMissionProfile,
): boolean {
  return (
    state.predictionId !== null &&
    state.revealed &&
    state.workspaceOpened &&
    state.manipulated &&
    state.executionReceipt !== null &&
    state.evidenceId === profile.evidence.correctId &&
    state.revisionId === profile.revision.correctId &&
    state.retrievalMastered &&
    state.transferId === profile.transfer.correctId
  );
}

/** Prevents a passive lesson visit from creating a durable browser key. */
export function hasLessonMissionInteraction(
  state: LessonMissionState,
): boolean {
  return (
    state.predictionId !== null ||
    state.revealed ||
    state.workspaceOpened ||
    state.manipulated ||
    state.executionReceipt !== null ||
    state.evidenceId !== null ||
    state.retrievalId !== null ||
    state.retrievalMastered ||
    state.retrievalFirstChoiceId !== null ||
    state.retrievalAttemptCount > 0 ||
    state.retrievalNextDueAt !== null ||
    state.retrievalMisconceptionId !== null ||
    state.revisionId !== null ||
    state.transferId !== null ||
    state.collapsed
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
}

function retrievalSuccessLevel(
  value: unknown,
): RetrievalSuccessLevel | undefined {
  const parsed = boundedInteger(value, 0, 3);
  return parsed === undefined ? undefined : (parsed as RetrievalSuccessLevel);
}

function boundedIsoTimestamp(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 32) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp).toISOString() === value ? value : undefined;
}

function allowedChoice(
  value: unknown,
  allowedIds: ReadonlySet<string>,
): string | null | undefined {
  if (value === null) return null;
  if (typeof value === "string" && allowedIds.has(value)) return value;
  return undefined;
}

function allowedExecutionReceipt(
  value: unknown,
  expected: CourseProjectExecutionReceipt,
  localLearningReceipt: CourseProjectLearningReceipt | null,
): CourseProjectLearningReceipt | null | undefined {
  if (value === null) return null;
  if (value === expected) return expected;
  return value === localLearningReceipt ? localLearningReceipt : undefined;
}

function choiceIds(
  choices: LessonMissionProfile["predictionChoices"],
): ReadonlySet<string> {
  return new Set(choices.map((entry) => entry.id));
}

function hasFixedEnvelopeKeys(
  candidate: unknown,
  allowedKeys: ReadonlySet<string>,
): candidate is Record<string, unknown> {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    !Array.isArray(candidate) &&
    Object.keys(candidate).every((key) => allowedKeys.has(key))
  );
}

/**
 * Parses the deliberately small browser-only state envelope. Unknown choice
 * IDs and impossible step ordering fail closed rather than unlocking a later
 * cognitive step. No free-form learner text is accepted by this schema. The
 * v2/v3 branches migrate prior fixed-choice envelopes. They cannot prove the
 * new explicit Run step, so all later evidence is deliberately discarded.
 * New writes use v4.
 */
export function parseLessonMissionState(
  raw: string | null,
  profile: LessonMissionProfile,
  expectedResetAt: string | null,
): LessonMissionState | null {
  if (!raw || raw.length > MAX_SERIALIZED_STATE_LENGTH) return null;

  try {
    const parsedCandidate: unknown = JSON.parse(raw);
    if (
      !hasFixedEnvelopeKeys(
        parsedCandidate,
        (parsedCandidate as { version?: unknown })?.version === 2
          ? LEGACY_V2_KEYS
          : (parsedCandidate as { version?: unknown })?.version === 3
            ? LEGACY_V3_KEYS
            : CURRENT_V4_KEYS,
      )
    ) {
      return null;
    }
    const candidate = parsedCandidate as {
      version?: unknown;
      resetAt?: unknown;
      predictionId?: unknown;
      revealed?: unknown;
      workspaceOpened?: unknown;
      manipulated?: unknown;
      executionReceipt?: unknown;
      evidenceId?: unknown;
      retrievalId?: unknown;
      retrievalMastered?: unknown;
      retrievalFirstChoiceId?: unknown;
      retrievalAttemptCount?: unknown;
      retrievalSuccessLevel?: unknown;
      retrievalLastAttemptAt?: unknown;
      retrievalNextDueAt?: unknown;
      retrievalMisconceptionId?: unknown;
      revisionId?: unknown;
      transferId?: unknown;
      collapsed?: unknown;
    };
    const predictionId = allowedChoice(
      candidate.predictionId,
      choiceIds(profile.predictionChoices),
    );
    const evidenceId = allowedChoice(
      candidate.evidenceId,
      choiceIds(profile.evidence.choices),
    );
    const retrievalId = allowedChoice(
      candidate.retrievalId,
      choiceIds(profile.retrieval.choices),
    );
    const isLegacyV2 = candidate.version === 2;
    const isLegacyV3 = candidate.version === 3;
    const isCurrentV4 = candidate.version === 4;
    const expectedExecutionReceipt = getCourseProjectExecutionReceipt(
      profile.courseSlug,
    );
    const localLearningReceipt =
      profile.courseSlug === "ai-native" ||
      profile.courseSlug === "claude" ||
      profile.courseSlug === "ai-native-operator"
        ? getCourseProjectLocalLearningReceipt(profile.courseSlug)
        : null;
    const executionReceipt =
      isLegacyV2 || isLegacyV3
        ? null
        : allowedExecutionReceipt(
            candidate.executionReceipt,
            expectedExecutionReceipt,
            localLearningReceipt,
          );
    const retrievalFirstChoiceId = isLegacyV2
      ? retrievalId
      : allowedChoice(
          candidate.retrievalFirstChoiceId,
          choiceIds(profile.retrieval.choices),
        );
    const retrievalMisconceptionId = isLegacyV2
      ? retrievalId !== null && retrievalId !== profile.retrieval.correctId
        ? retrievalId
        : null
      : allowedChoice(
          candidate.retrievalMisconceptionId,
          choiceIds(profile.retrieval.choices),
        );
    const retrievalAttemptCount = isLegacyV2
      ? retrievalId === null
        ? 0
        : 1
      : boundedInteger(candidate.retrievalAttemptCount, 0, 99);
    const parsedRetrievalSuccessLevel = isLegacyV2
      ? retrievalId === profile.retrieval.correctId
        ? 1
        : 0
      : retrievalSuccessLevel(candidate.retrievalSuccessLevel);
    const retrievalLastAttemptAt = isLegacyV2
      ? null
      : boundedIsoTimestamp(candidate.retrievalLastAttemptAt);
    const retrievalNextDueAt = isLegacyV2
      ? null
      : boundedIsoTimestamp(candidate.retrievalNextDueAt);
    const retrievalMastered = isLegacyV2
      ? retrievalId === profile.retrieval.correctId
      : candidate.retrievalMastered;
    const revisionId = allowedChoice(
      candidate.revisionId,
      choiceIds(profile.revision.choices),
    );
    const transferId = allowedChoice(
      candidate.transferId,
      choiceIds(profile.transfer.choices),
    );

    if (
      (!isLegacyV2 && !isLegacyV3 && !isCurrentV4) ||
      (candidate.resetAt !== null &&
        (typeof candidate.resetAt !== "string" ||
          candidate.resetAt.length === 0 ||
          candidate.resetAt.length > 64)) ||
      candidate.resetAt !== expectedResetAt ||
      predictionId === undefined ||
      executionReceipt === undefined ||
      evidenceId === undefined ||
      retrievalId === undefined ||
      retrievalFirstChoiceId === undefined ||
      retrievalAttemptCount === undefined ||
      parsedRetrievalSuccessLevel === undefined ||
      retrievalLastAttemptAt === undefined ||
      retrievalNextDueAt === undefined ||
      retrievalMisconceptionId === undefined ||
      revisionId === undefined ||
      transferId === undefined ||
      !isBoolean(candidate.revealed) ||
      !isBoolean(candidate.workspaceOpened) ||
      !isBoolean(candidate.manipulated) ||
      !isBoolean(retrievalMastered) ||
      !isBoolean(candidate.collapsed)
    ) {
      return null;
    }

    const revealed = predictionId !== null && candidate.revealed;
    const workspaceOpened = revealed && candidate.workspaceOpened;
    const manipulated = workspaceOpened && candidate.manipulated;
    const boundedExecutionReceipt = manipulated ? executionReceipt : null;
    const evidenceCorrect =
      boundedExecutionReceipt !== null &&
      evidenceId === profile.evidence.correctId;
    const legacyEvidenceCorrect =
      (isLegacyV2 || isLegacyV3) &&
      manipulated &&
      evidenceId === profile.evidence.correctId;
    const boundedRevisionId = evidenceCorrect ? revisionId : null;
    const revisionCorrect = boundedRevisionId === profile.revision.correctId;
    const retrievalHistoryEligible = revisionCorrect || legacyEvidenceCorrect;
    const hasAttempt = retrievalAttemptCount > 0;
    const attemptedScheduleValid = isLegacyV2
      ? retrievalLastAttemptAt === null && retrievalNextDueAt === null
      : retrievalLastAttemptAt !== null &&
        retrievalNextDueAt !== null &&
        hasExactRetrievalSchedule({
          successLevel: parsedRetrievalSuccessLevel,
          lastAttemptAt: retrievalLastAttemptAt,
          nextDueAt: retrievalNextDueAt,
        });
    const retrievalRecordValid =
      !retrievalHistoryEligible ||
      (!hasAttempt &&
        retrievalId === null &&
        retrievalFirstChoiceId === null &&
        retrievalMisconceptionId === null &&
        !retrievalMastered &&
        parsedRetrievalSuccessLevel === 0 &&
        retrievalLastAttemptAt === null &&
        retrievalNextDueAt === null) ||
      (hasAttempt &&
        retrievalFirstChoiceId !== null &&
        attemptedScheduleValid &&
        (parsedRetrievalSuccessLevel === 0 || retrievalMastered) &&
        (retrievalId !== profile.retrieval.correctId ||
          (retrievalMastered && parsedRetrievalSuccessLevel > 0)) &&
        (retrievalId === null ||
          retrievalId === profile.retrieval.correctId ||
          (retrievalMisconceptionId === retrievalId &&
            parsedRetrievalSuccessLevel === 0)) &&
        retrievalMisconceptionId !== profile.retrieval.correctId);

    if (!retrievalRecordValid) return null;

    const boundedRetrievalMastered =
      retrievalHistoryEligible && retrievalMastered;
    const boundedRetrievalId = retrievalHistoryEligible
      ? isLegacyV2
        ? null
        : retrievalId
      : null;
    const boundedRetrievalFirstChoiceId = retrievalHistoryEligible
      ? retrievalFirstChoiceId
      : null;
    const boundedRetrievalAttemptCount = retrievalHistoryEligible
      ? retrievalAttemptCount
      : 0;
    const boundedRetrievalSuccessLevel = retrievalHistoryEligible
      ? parsedRetrievalSuccessLevel
      : 0;
    const boundedRetrievalLastAttemptAt = retrievalHistoryEligible
      ? retrievalLastAttemptAt
      : null;
    const boundedRetrievalNextDueAt = retrievalHistoryEligible
      ? retrievalNextDueAt
      : null;
    const boundedRetrievalMisconceptionId = retrievalHistoryEligible
      ? retrievalMisconceptionId
      : null;
    return {
      version: 1,
      predictionId,
      revealed,
      workspaceOpened,
      manipulated,
      executionReceipt: boundedExecutionReceipt,
      evidenceId: boundedExecutionReceipt !== null ? evidenceId : null,
      retrievalId: boundedRetrievalId,
      retrievalMastered: boundedRetrievalMastered,
      retrievalFirstChoiceId: boundedRetrievalFirstChoiceId,
      retrievalAttemptCount: boundedRetrievalAttemptCount,
      retrievalSuccessLevel: boundedRetrievalSuccessLevel,
      retrievalLastAttemptAt: boundedRetrievalLastAttemptAt,
      retrievalNextDueAt: boundedRetrievalNextDueAt,
      retrievalMisconceptionId: boundedRetrievalMisconceptionId,
      revisionId: boundedRevisionId,
      transferId:
        revisionCorrect && boundedRetrievalMastered ? transferId : null,
      collapsed: candidate.collapsed,
    };
  } catch {
    return null;
  }
}

export function serializeLessonMissionState(
  state: LessonMissionState,
  resetAt: string | null,
): string {
  return JSON.stringify({
    version: 4,
    resetAt,
    predictionId: state.predictionId,
    revealed: state.revealed,
    workspaceOpened: state.workspaceOpened,
    manipulated: state.manipulated,
    executionReceipt: state.executionReceipt,
    evidenceId: state.evidenceId,
    retrievalId: state.retrievalId,
    retrievalMastered: state.retrievalMastered,
    retrievalFirstChoiceId: state.retrievalFirstChoiceId,
    retrievalAttemptCount: state.retrievalAttemptCount,
    retrievalSuccessLevel: state.retrievalSuccessLevel,
    retrievalLastAttemptAt: state.retrievalLastAttemptAt,
    retrievalNextDueAt: state.retrievalNextDueAt,
    retrievalMisconceptionId: state.retrievalMisconceptionId,
    revisionId: state.revisionId,
    transferId: state.transferId,
    collapsed: state.collapsed,
  });
}
