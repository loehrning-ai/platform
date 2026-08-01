"use client";

import {
  beginAccountLearningCutoverRecovery,
  clearAllAccountLearningStorage,
  completeAccountLearningCutoverRecovery,
  getReadyAccountLearningCutoverEpoch,
  isAccountLearningCutoverEpochCurrent,
  rotateAccountLearningCutoverForDeletion,
} from "./browser-learning-storage";
import {
  type AccountDeletionLockLease,
  withAccountDeletionOriginLock,
} from "./account-deletion-lock";

/**
 * Coordinates account deletion with progress synchronization in every open
 * tab. A pending deletion pauses network reads and writes without touching
 * local learning data. A confirmed deletion tells every tab to clear that
 * data. Monotonic generations and phase ordering make confirmation dominate a
 * concurrent failure response; a suspended tab cannot undo confirmed deletion.
 */

export const ACCOUNT_DELETION_CONTROL_KEY =
  "loehrning-account-deletion-control-v1";
export const ACCOUNT_DELETION_CLEANUP_KEY_PREFIX =
  "loehrning-account-deletion-cleanup-v1:";
export const ACCOUNT_DELETION_RECOVERY_KEY =
  "loehrning-account-deletion-recovery-v1";
export const ACCOUNT_DELETION_TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
/**
 * Persisted markers may appear slightly ahead of Date.now() after an operating
 * system clock correction. This tolerance is validation-only: expiry still
 * uses the original persisted deadline without adding or rewriting any time.
 */
export const ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS = 5 * 60 * 1_000;

const ACCOUNT_DELETION_EVENT = "loehrning:account-deletion-control";
const ACCOUNT_DELETION_CHANNEL = "loehrning-account-deletion-control-v1";

export type AccountDeletionControlState =
  | {
      readonly phase: "idle";
      readonly epoch: null;
      readonly accountId: null;
    }
  | {
      readonly phase: "pending" | "confirmed";
      readonly epoch: string;
      /** null exists only for malformed pending/confirmed markers. */
      readonly accountId: string | null;
    }
  | {
      readonly phase: "cleanup";
      readonly epoch: string;
      readonly accountId: string;
    }
  | {
      readonly phase: "cleanup-all";
      readonly epoch: string;
      readonly accountId: null;
    };

type PersistedAccountDeletionState = {
  readonly version: 2;
  readonly generation: number;
  readonly phase: "pending" | "cancelled" | "confirmed" | "released";
  readonly epoch: string;
  readonly accountId: string | null;
  readonly createdAt: number;
  /**
   * Pending and confirmed states deliberately have no expiry: an ambiguous
   * server outcome must keep synchronization paused. Only terminal
   * cancellation/cleanup tombstones have a finite retention period.
   */
  readonly expiresAt: number | null;
};

type PersistedAccountDeletionCleanup = {
  readonly version: 2;
  readonly epoch: string;
  readonly accountId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
};

type LegacyPersistedAccountDeletionState = {
  readonly version: 1;
  readonly generation: number;
  readonly phase: PersistedAccountDeletionState["phase"];
  readonly epoch: string;
  readonly accountId: string;
};

type LegacyPersistedAccountDeletionCleanup = {
  readonly version: 1;
  readonly epoch: string;
  readonly accountId: string;
};

type PersistedAccountDeletionRecovery = {
  readonly epoch: string;
  readonly createdAt: number;
  readonly expiresAt: number;
} & (
  | {
      /**
       * Version 1 predates durable linkage to the cutover it announced. Such
       * notices are safe to release only when storage already has a ready
       * cutover; an interrupted legacy recovery cannot be completed exactly.
       */
      readonly version: 1;
    }
  | {
      readonly version: 2;
      /** Exact recovery-in-progress cutover that must become ready. */
      readonly cutoverEpoch: string;
    }
);

type ParsedPersisted<T> = {
  readonly value: T;
  readonly migrated: boolean;
};

const IDLE_STATE: AccountDeletionControlState = {
  phase: "idle",
  epoch: null,
  accountId: null,
};
const PHASE_RANK: Readonly<
  Record<PersistedAccountDeletionState["phase"], number>
> = {
  pending: 0,
  cancelled: 1,
  confirmed: 2,
  released: 3,
};

let currentWireState: PersistedAccountDeletionState | null | undefined;
const listeners = new Set<(state: AccountDeletionControlState) => void>();
let browserListenersInstalled = false;
let broadcastChannel: BroadcastChannel | null = null;
const notificationQueue: AccountDeletionControlState[] = [];
let notificationInProgress = false;
let lastNotifiedSignature: string | null = null;
type ObservableAnnouncement = {
  readonly wireState?: PersistedAccountDeletionState;
  readonly publicState?: AccountDeletionControlState;
};
const announcementQueue: ObservableAnnouncement[] = [];
let announcementInProgress = false;
const MAX_TIMER_DELAY_MS = 2_147_483_647;
const MIN_EXPIRY_RETRY_MS = 1_000;
const MAX_EXPIRY_RETRY_MS = 60_000;
let expiryTimer: number | null = null;
let expiryRetryMs = MIN_EXPIRY_RETRY_MS;

function isValidCreatedAt(value: unknown, now: number): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= now + ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS
  );
}

function hasValidTombstoneWindow(
  createdAt: unknown,
  expiresAt: unknown,
  now: number,
): createdAt is number {
  return (
    isValidCreatedAt(createdAt, now) &&
    typeof expiresAt === "number" &&
    Number.isSafeInteger(expiresAt) &&
    expiresAt > createdAt &&
    expiresAt - createdAt <= ACCOUNT_DELETION_TOMBSTONE_TTL_MS &&
    expiresAt <=
      now +
        ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS +
        ACCOUNT_DELETION_TOMBSTONE_TTL_MS
  );
}

function isPersistedState(
  value: unknown,
): value is PersistedAccountDeletionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const now = Date.now();
  const createdAt = candidate.createdAt;
  const expiresAt = candidate.expiresAt;
  const phaseIsValid =
    candidate.phase === "pending" ||
    candidate.phase === "cancelled" ||
    candidate.phase === "confirmed" ||
    candidate.phase === "released";
  const createdAtIsValid = isValidCreatedAt(createdAt, now);
  const terminalPhase =
    candidate.phase === "cancelled" || candidate.phase === "released";
  const expiryIsValid = terminalPhase
    ? hasValidTombstoneWindow(createdAt, expiresAt, now)
    : expiresAt === null;
  return (
    candidate.version === 2 &&
    typeof candidate.generation === "number" &&
    Number.isSafeInteger(candidate.generation) &&
    candidate.generation >= 1 &&
    phaseIsValid &&
    typeof candidate.epoch === "string" &&
    candidate.epoch.length >= 8 &&
    candidate.epoch.length <= 200 &&
    typeof candidate.accountId === "string" &&
    candidate.accountId.length >= 1 &&
    candidate.accountId.length <= 256 &&
    createdAtIsValid &&
    expiryIsValid
  );
}

function isLegacyPersistedState(
  value: unknown,
): value is LegacyPersistedAccountDeletionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    typeof candidate.generation === "number" &&
    Number.isSafeInteger(candidate.generation) &&
    candidate.generation >= 1 &&
    (candidate.phase === "pending" ||
      candidate.phase === "cancelled" ||
      candidate.phase === "confirmed" ||
      candidate.phase === "released") &&
    typeof candidate.epoch === "string" &&
    candidate.epoch.length >= 8 &&
    candidate.epoch.length <= 200 &&
    typeof candidate.accountId === "string" &&
    candidate.accountId.length >= 1 &&
    candidate.accountId.length <= 256
  );
}

function tombstoneExpiry(createdAt: number): number {
  return createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS;
}

function migrateLegacyState(
  state: LegacyPersistedAccountDeletionState,
  now = Date.now(),
): PersistedAccountDeletionState {
  const terminal = state.phase === "cancelled" || state.phase === "released";
  return {
    ...state,
    version: 2,
    createdAt: now,
    expiresAt: terminal ? tombstoneExpiry(now) : null,
  };
}

function malformedFailClosedState(): PersistedAccountDeletionState {
  return {
    version: 2,
    generation: 1,
    phase: "pending",
    epoch: "invalid-persisted-deletion-state",
    accountId: null,
    createdAt: 0,
    expiresAt: null,
  };
}

function parsePersistedStateValue(
  parsed: unknown,
): ParsedPersisted<PersistedAccountDeletionState> | null {
  if (isPersistedState(parsed)) {
    return { value: parsed, migrated: false };
  }
  if (isLegacyPersistedState(parsed)) {
    return {
      value: migrateLegacyState(parsed),
      migrated: true,
    };
  }
  return null;
}

function parsePersistedState(
  raw: string | null,
): ParsedPersisted<PersistedAccountDeletionState> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return (
      parsePersistedStateValue(parsed) ?? {
        value: malformedFailClosedState(),
        migrated: false,
      }
    );
  } catch {
    // A malformed coordination marker cannot authorize progress sync.
    return { value: malformedFailClosedState(), migrated: false };
  }
}

function isPersistedCleanup(
  value: unknown,
): value is PersistedAccountDeletionCleanup {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const now = Date.now();
  return (
    candidate.version === 2 &&
    typeof candidate.epoch === "string" &&
    candidate.epoch.length >= 8 &&
    candidate.epoch.length <= 200 &&
    typeof candidate.accountId === "string" &&
    candidate.accountId.length >= 1 &&
    candidate.accountId.length <= 256 &&
    hasValidTombstoneWindow(candidate.createdAt, candidate.expiresAt, now)
  );
}

function isLegacyPersistedCleanup(
  value: unknown,
): value is LegacyPersistedAccountDeletionCleanup {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    typeof candidate.epoch === "string" &&
    candidate.epoch.length >= 8 &&
    candidate.epoch.length <= 200 &&
    typeof candidate.accountId === "string" &&
    candidate.accountId.length >= 1 &&
    candidate.accountId.length <= 256
  );
}

function parsePersistedCleanup(
  raw: string | null,
): ParsedPersisted<PersistedAccountDeletionCleanup> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isPersistedCleanup(parsed)) {
      return { value: parsed, migrated: false };
    }
    if (isLegacyPersistedCleanup(parsed)) {
      const createdAt = Date.now();
      return {
        value: {
          ...parsed,
          version: 2,
          createdAt,
          expiresAt: tombstoneExpiry(createdAt),
        },
        migrated: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function isPersistedRecovery(
  value: unknown,
): value is PersistedAccountDeletionRecovery {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const now = Date.now();
  const hasValidCommonFields =
    typeof candidate.epoch === "string" &&
    candidate.epoch.length >= 8 &&
    candidate.epoch.length <= 200 &&
    hasValidTombstoneWindow(candidate.createdAt, candidate.expiresAt, now);
  return (
    hasValidCommonFields &&
    (candidate.version === 1 ||
      (candidate.version === 2 &&
        typeof candidate.cutoverEpoch === "string" &&
        candidate.cutoverEpoch.length >= 8 &&
        candidate.cutoverEpoch.length <= 200))
  );
}

function parsePersistedRecovery(
  raw: string | null,
): PersistedAccountDeletionRecovery | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPersistedRecovery(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cleanupStorageKey(accountId: string): string {
  return `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(accountId)}`;
}

function recoveryPublicState(
  recovery: PersistedAccountDeletionRecovery,
): AccountDeletionControlState {
  return {
    phase: "cleanup-all",
    epoch: recovery.epoch,
    accountId: null,
  };
}

function cleanupPublicState(
  cleanup: PersistedAccountDeletionCleanup,
): AccountDeletionControlState {
  return {
    phase: "cleanup",
    epoch: cleanup.epoch,
    accountId: cleanup.accountId,
  };
}

function persistExactStorageValue(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  const serialized = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, serialized);
    return window.localStorage.getItem(key) === serialized;
  } catch {
    return false;
  }
}

function removeExactStorageValue(key: string, raw: string): boolean {
  try {
    if (window.localStorage.getItem(key) === raw) {
      window.localStorage.removeItem(key);
      return window.localStorage.getItem(key) === null;
    }
    return window.localStorage.getItem(key) === null;
  } catch {
    // Expired entries are ignored logically and retried on a later startup.
    return false;
  }
}

function cleanupIsExpired(
  cleanup: PersistedAccountDeletionCleanup,
  now = Date.now(),
): boolean {
  return cleanup.expiresAt <= now;
}

function recoveryIsExpired(
  recovery: PersistedAccountDeletionRecovery,
  now = Date.now(),
): boolean {
  return recovery.expiresAt <= now;
}

function rawStateIsMalformed(raw: string | null): boolean {
  if (raw === null) return false;
  try {
    return parsePersistedStateValue(JSON.parse(raw) as unknown) === null;
  } catch {
    return true;
  }
}

function rawCleanupIsMalformed(raw: string | null): boolean {
  return raw !== null && parsePersistedCleanup(raw) === null;
}

function rawRecoveryIsMalformed(raw: string | null): boolean {
  return raw !== null && parsePersistedRecovery(raw) === null;
}

function readPersistedRecoveryState(): AccountDeletionControlState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY);
    if (raw === null) return null;
    const recovery = parsePersistedRecovery(raw);
    if (!recovery) {
      return {
        phase: "pending",
        epoch: "invalid-persisted-deletion-recovery",
        accountId: null,
      };
    }
    if (recoveryIsExpired(recovery)) {
      removeExactStorageValue(ACCOUNT_DELETION_RECOVERY_KEY, raw);
      return null;
    }
    return recoveryPublicState(recovery);
  } catch {
    return {
      phase: "pending",
      epoch: "unreadable-persisted-deletion-recovery",
      accountId: null,
    };
  }
}

function readPersistedCleanups(): AccountDeletionControlState[] {
  if (typeof window === "undefined") return [];
  const states: AccountDeletionControlState[] = [];
  const recoveryState = readPersistedRecoveryState();
  if (recoveryState) states.push(recoveryState);
  try {
    const cleanupKeys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    ).filter(
      (key): key is string =>
        key !== null && key.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX),
    );
    for (const key of cleanupKeys) {
      const raw = window.localStorage.getItem(key);
      const parsed = parsePersistedCleanup(raw);
      if (!parsed) {
        states.push({
          phase: "pending",
          epoch: "invalid-persisted-deletion-cleanup",
          accountId: null,
        });
        continue;
      }
      if (cleanupIsExpired(parsed.value)) {
        if (raw !== null) {
          const scalarRaw = window.localStorage.getItem(
            ACCOUNT_DELETION_CONTROL_KEY,
          );
          const scalarParsed = parsePersistedState(scalarRaw);
          const matchingTerminalScalar =
            scalarRaw !== null &&
            scalarParsed !== null &&
            scalarParsed.value.accountId === parsed.value.accountId &&
            scalarParsed.value.epoch === parsed.value.epoch &&
            (scalarParsed.value.phase === "confirmed" ||
              scalarParsed.value.phase === "released");
          // A cleanup write can succeed immediately before the scalar release
          // write fails. Remove the matching confirmed barrier first so the
          // finite ledger cannot expire while leaving an indefinite UUID.
          if (
            !matchingTerminalScalar ||
            removeExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, scalarRaw)
          ) {
            removeExactStorageValue(key, raw);
          }
        }
        continue;
      }
      if (parsed.migrated) {
        persistExactStorageValue(key, parsed.value);
      }
      states.push(cleanupPublicState(parsed.value));
    }
  } catch {
    states.push({
      phase: "pending",
      epoch: "unreadable-persisted-deletion-cleanup",
      accountId: null,
    });
  }
  return states.sort((left, right) =>
    `${left.accountId ?? ""}:${left.epoch ?? ""}`.localeCompare(
      `${right.accountId ?? ""}:${right.epoch ?? ""}`,
    ),
  );
}

function dominantInvalidCleanup(): AccountDeletionControlState | null {
  return (
    readPersistedCleanups().find((state) => state.phase === "pending") ?? null
  );
}

function malformedDeletionStorageEntries(): ReadonlyArray<
  readonly [key: string, raw: string]
> {
  if (typeof window === "undefined") return [];
  const entries: Array<readonly [string, string]> = [];
  try {
    const scalarRaw = window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY);
    if (scalarRaw !== null && rawStateIsMalformed(scalarRaw)) {
      entries.push([ACCOUNT_DELETION_CONTROL_KEY, scalarRaw]);
    }
    const recoveryRaw = window.localStorage.getItem(
      ACCOUNT_DELETION_RECOVERY_KEY,
    );
    if (recoveryRaw !== null && rawRecoveryIsMalformed(recoveryRaw)) {
      entries.push([ACCOUNT_DELETION_RECOVERY_KEY, recoveryRaw]);
    }
    const cleanupKeys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    ).filter(
      (key): key is string =>
        key !== null && key.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX),
    );
    for (const key of cleanupKeys) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null && rawCleanupIsMalformed(raw)) {
        entries.push([key, raw]);
      }
    }
  } catch {
    return [];
  }
  return entries;
}

function persistCleanup(
  state: PersistedAccountDeletionState,
): PersistedAccountDeletionCleanup | null {
  if (typeof window === "undefined" || state.accountId === null) {
    return null;
  }
  const createdAt = Date.now();
  const cleanup: PersistedAccountDeletionCleanup = {
    version: 2,
    epoch: state.epoch,
    accountId: state.accountId,
    createdAt,
    expiresAt: tombstoneExpiry(createdAt),
  };
  if (!persistExactStorageValue(cleanupStorageKey(state.accountId), cleanup)) {
    return null;
  }
  scheduleExpirySweep();
  return cleanup;
}

function toPublicState(
  state: PersistedAccountDeletionState | null,
): AccountDeletionControlState {
  if (!state || state.phase === "cancelled") {
    return IDLE_STATE;
  }
  if (state.phase === "released") {
    if (state.accountId === null) {
      return {
        phase: "pending",
        epoch: "invalid-persisted-deletion-state",
        accountId: null,
      };
    }
    return {
      phase: "cleanup",
      epoch: state.epoch,
      accountId: state.accountId,
    };
  }
  return {
    phase: state.phase,
    epoch: state.epoch,
    accountId: state.accountId,
  };
}

function effectivePublicState(
  state: PersistedAccountDeletionState | null,
): AccountDeletionControlState {
  // Any malformed or unreadable per-account tombstone may represent a
  // confirmed deletion whose owner can no longer be recovered. It must remain
  // the externally visible state until that exact marker is repaired or
  // removed; scalar protocol traffic cannot reopen synchronization around it.
  return dominantInvalidCleanup() ?? toPublicState(state);
}

function stateIsExpired(
  state: PersistedAccountDeletionState,
  now = Date.now(),
): boolean {
  return (
    (state.phase === "cancelled" || state.phase === "released") &&
    state.expiresAt !== null &&
    state.expiresAt <= now
  );
}

function inspectEarliestExpiry(): {
  readonly readable: boolean;
  readonly deadline: number | null;
} {
  if (typeof window === "undefined") {
    return { readable: true, deadline: null };
  }
  try {
    const deadlines: number[] = [];
    const scalarRaw = window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY);
    const scalar = scalarRaw
      ? (parsePersistedState(scalarRaw)?.value ?? null)
      : null;
    if (
      scalar &&
      (scalar.phase === "cancelled" || scalar.phase === "released") &&
      scalar.expiresAt !== null
    ) {
      deadlines.push(scalar.expiresAt);
    }

    const recovery = parsePersistedRecovery(
      window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY),
    );
    if (recovery) deadlines.push(recovery.expiresAt);

    const cleanupKeys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    ).filter(
      (key): key is string =>
        key !== null && key.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX),
    );
    for (const key of cleanupKeys) {
      const cleanup = parsePersistedCleanup(window.localStorage.getItem(key));
      if (cleanup) deadlines.push(cleanup.value.expiresAt);
    }
    return {
      readable: true,
      deadline: deadlines.length > 0 ? Math.min(...deadlines) : null,
    };
  } catch {
    return { readable: false, deadline: null };
  }
}

function clearExpiryTimer(): void {
  if (expiryTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(expiryTimer);
  }
  expiryTimer = null;
}

function scheduleExpirySweep(forcedRetryDelay?: number): void {
  if (typeof window === "undefined") return;
  clearExpiryTimer();
  const inspection = inspectEarliestExpiry();
  const now = Date.now();
  const targetDelay =
    forcedRetryDelay !== undefined
      ? forcedRetryDelay
      : inspection.readable
        ? inspection.deadline === null
          ? null
          : Math.max(0, inspection.deadline - now)
        : expiryRetryMs;
  if (targetDelay === null) {
    expiryRetryMs = MIN_EXPIRY_RETRY_MS;
    return;
  }
  const timerDelay = Math.min(MAX_TIMER_DELAY_MS, targetDelay);
  expiryTimer = window.setTimeout(() => {
    expiryTimer = null;
    const beforeSweep = inspectEarliestExpiry();
    if (
      beforeSweep.readable &&
      beforeSweep.deadline !== null &&
      beforeSweep.deadline > Date.now()
    ) {
      expiryRetryMs = MIN_EXPIRY_RETRY_MS;
      scheduleExpirySweep();
      return;
    }

    // Never let an expired cached tombstone survive a storage-read failure.
    currentWireState = undefined;
    readPersistedCleanups();
    const effective = effectivePublicState(getWireState());
    enqueueAnnouncement({ publicState: effective });

    const afterSweep = inspectEarliestExpiry();
    const needsRetry =
      !afterSweep.readable ||
      (afterSweep.deadline !== null && afterSweep.deadline <= Date.now());
    if (needsRetry) {
      const retryDelay = expiryRetryMs;
      expiryRetryMs = Math.min(MAX_EXPIRY_RETRY_MS, expiryRetryMs * 2);
      scheduleExpirySweep(retryDelay);
    } else {
      expiryRetryMs = MIN_EXPIRY_RETRY_MS;
      scheduleExpirySweep();
    }
  }, timerDelay);
}

function readPersistedState(): PersistedAccountDeletionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY);
    const parsed = parsePersistedState(raw);
    if (!parsed) return null;
    if (parsed.value.phase === "confirmed" && parsed.value.accountId !== null) {
      const cleanupKey = cleanupStorageKey(parsed.value.accountId);
      const cleanupRaw = window.localStorage.getItem(cleanupKey);
      const cleanupParsed = parsePersistedCleanup(cleanupRaw);
      const matchingCleanup =
        cleanupParsed &&
        cleanupParsed.value.epoch === parsed.value.epoch &&
        cleanupParsed.value.accountId === parsed.value.accountId
          ? cleanupParsed.value
          : null;
      if (matchingCleanup) {
        if (cleanupIsExpired(matchingCleanup)) {
          if (
            raw !== null &&
            removeExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, raw) &&
            cleanupRaw !== null
          ) {
            removeExactStorageValue(cleanupKey, cleanupRaw);
          }
          return null;
        }
        // Repair the only non-atomic edge of localStorage: the independent
        // cleanup ledger is already durable, so it safely supplies the release
        // expiry when the scalar phase write was interrupted.
        const repaired: PersistedAccountDeletionState = {
          ...parsed.value,
          phase: "released",
          createdAt: matchingCleanup.createdAt,
          expiresAt: matchingCleanup.expiresAt,
        };
        persistExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, repaired);
        return repaired;
      }
    }
    if (stateIsExpired(parsed.value)) {
      if (raw !== null) {
        removeExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, raw);
      }
      return null;
    }
    if (parsed.migrated) {
      persistExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, parsed.value);
    }
    return parsed.value;
  } catch {
    // Storage denial is not evidence that no deletion is in progress.
    return currentWireState && !stateIsExpired(currentWireState)
      ? currentWireState
      : null;
  }
}

function getWireState(): PersistedAccountDeletionState | null {
  if (
    currentWireState === undefined ||
    (currentWireState !== null && stateIsExpired(currentWireState))
  ) {
    currentWireState = readPersistedState();
  }
  return currentWireState;
}

function compareWireStates(
  left: PersistedAccountDeletionState,
  right: PersistedAccountDeletionState,
): number {
  if (left.generation !== right.generation) {
    return left.generation - right.generation;
  }
  const phaseDifference = PHASE_RANK[left.phase] - PHASE_RANK[right.phase];
  if (phaseDifference !== 0) return phaseDifference;
  return left.epoch.localeCompare(right.epoch);
}

function publicSignature(state: AccountDeletionControlState): string {
  return `${state.phase}:${state.epoch ?? ""}:${state.accountId ?? ""}`;
}

function notify(state: AccountDeletionControlState): void {
  notificationQueue.push(state);
  if (notificationInProgress) return;
  notificationInProgress = true;
  try {
    while (notificationQueue.length > 0) {
      const next = notificationQueue.shift();
      if (!next) continue;
      const signature = publicSignature(next);
      if (signature === lastNotifiedSignature) continue;
      lastNotifiedSignature = signature;
      // Nested state transitions enqueue behind the state currently being
      // delivered. Every subscriber therefore sees confirmed before cleanup,
      // never cleanup followed by the stale outer confirmation.
      for (const listener of Array.from(listeners)) {
        if (!listeners.has(listener)) continue;
        try {
          listener(next);
        } catch {
          // One consumer cannot break deletion coordination for the others.
        }
      }
    }
  } finally {
    notificationInProgress = false;
  }
}

function enqueueAnnouncement(announcement: ObservableAnnouncement): void {
  announcementQueue.push(announcement);
  if (announcementInProgress) return;
  announcementInProgress = true;
  try {
    while (announcementQueue.length > 0) {
      const next = announcementQueue.shift();
      if (!next) continue;
      if (next.wireState && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(ACCOUNT_DELETION_EVENT, {
            detail: next.wireState,
          }),
        );
        try {
          broadcastChannel?.postMessage(next.wireState);
        } catch {
          // The verified localStorage state remains authoritative.
        }
      }
      if (next.publicState) notify(next.publicState);
    }
  } finally {
    announcementInProgress = false;
  }
}

function announceSupplementalState(state: AccountDeletionControlState): void {
  enqueueAnnouncement({ publicState: state });
  const effective = effectivePublicState(getWireState());
  if (publicSignature(effective) !== publicSignature(state)) {
    enqueueAnnouncement({ publicState: effective });
  }
}

function persistWireState(state: PersistedAccountDeletionState): boolean {
  return persistExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, state);
}

function acceptExternalState(
  incoming: PersistedAccountDeletionState | null,
): void {
  const current = getWireState();
  if (!incoming) {
    // Once a protocol state exists, an unversioned key removal is stale. Write
    // the dominant state back so frozen tabs converge when they wake.
    if (current) persistWireState(current);
    return;
  }
  if (current && compareWireStates(current, incoming) >= 0) {
    if (compareWireStates(current, incoming) > 0) {
      persistWireState(current);
    }
    return;
  }

  const previousPublic = effectivePublicState(current);
  currentWireState = incoming;
  const nextPublic = effectivePublicState(incoming);
  if (publicSignature(previousPublic) !== publicSignature(nextPublic)) {
    enqueueAnnouncement({ publicState: nextPublic });
  }
  scheduleExpirySweep();
}

function onStorage(event: StorageEvent): void {
  if (event.key === ACCOUNT_DELETION_RECOVERY_KEY) {
    if (event.newValue === null) {
      enqueueAnnouncement({
        publicState: effectivePublicState(getWireState()),
      });
      scheduleExpirySweep();
      return;
    }
    const recovery = parsePersistedRecovery(event.newValue);
    if (!recovery) {
      enqueueAnnouncement({
        publicState: {
          phase: "pending",
          epoch: "invalid-persisted-deletion-recovery",
          accountId: null,
        },
      });
      scheduleExpirySweep();
      return;
    }
    if (recoveryIsExpired(recovery)) {
      removeExactStorageValue(ACCOUNT_DELETION_RECOVERY_KEY, event.newValue);
      currentWireState = undefined;
      enqueueAnnouncement({
        publicState: effectivePublicState(getWireState()),
      });
      scheduleExpirySweep();
      return;
    }
    announceSupplementalState(recoveryPublicState(recovery));
    scheduleExpirySweep();
    return;
  }
  if (event.key?.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX)) {
    if (event.newValue === null) {
      currentWireState = undefined;
      enqueueAnnouncement({
        publicState: effectivePublicState(getWireState()),
      });
      scheduleExpirySweep();
      return;
    }
    const parsed = parsePersistedCleanup(event.newValue);
    const cleanup =
      parsed && !cleanupIsExpired(parsed.value) ? parsed.value : null;
    if (parsed?.migrated && cleanup) {
      persistExactStorageValue(event.key, cleanup);
    }
    if (parsed && !cleanup) {
      removeExactStorageValue(event.key, event.newValue);
      currentWireState = undefined;
      enqueueAnnouncement({
        publicState: effectivePublicState(getWireState()),
      });
      scheduleExpirySweep();
      return;
    }
    if (cleanup) {
      announceSupplementalState(
        dominantInvalidCleanup() ?? cleanupPublicState(cleanup),
      );
    } else {
      enqueueAnnouncement({
        publicState: {
          phase: "pending",
          epoch: "invalid-persisted-deletion-cleanup",
          accountId: null,
        },
      });
    }
    scheduleExpirySweep();
    return;
  }
  if (event.key !== ACCOUNT_DELETION_CONTROL_KEY) return;
  const parsed = parsePersistedState(event.newValue);
  if (parsed && stateIsExpired(parsed.value)) {
    if (event.newValue !== null) {
      removeExactStorageValue(ACCOUNT_DELETION_CONTROL_KEY, event.newValue);
    }
    currentWireState = undefined;
    enqueueAnnouncement({
      publicState: effectivePublicState(getWireState()),
    });
    scheduleExpirySweep();
    return;
  }
  if (parsed?.migrated) persistWireState(parsed.value);
  acceptExternalState(parsed?.value ?? null);
  scheduleExpirySweep();
}

function onSameTabEvent(event: Event): void {
  const state = (event as CustomEvent<unknown>).detail;
  const parsed = parsePersistedStateValue(state);
  if (parsed && !stateIsExpired(parsed.value)) {
    acceptExternalState(parsed.value);
  }
}

function installBrowserListeners(): void {
  if (typeof window === "undefined") return;
  if (browserListenersInstalled) {
    scheduleExpirySweep();
    return;
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(ACCOUNT_DELETION_EVENT, onSameTabEvent);
  if (typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel(ACCOUNT_DELETION_CHANNEL);
      broadcastChannel.addEventListener("message", (event: MessageEvent) => {
        const parsed = parsePersistedStateValue(event.data);
        if (parsed && !stateIsExpired(parsed.value)) {
          acceptExternalState(parsed.value);
        }
      });
    } catch {
      broadcastChannel = null;
    }
  }
  browserListenersInstalled = true;
  scheduleExpirySweep();
}

function announcePublishedState(
  state: PersistedAccountDeletionState,
  previousPublic: AccountDeletionControlState,
): void {
  currentWireState = state;
  const nextPublic = effectivePublicState(state);
  enqueueAnnouncement({
    wireState: state,
    ...(publicSignature(previousPublic) !== publicSignature(nextPublic)
      ? { publicState: nextPublic }
      : {}),
  });
  scheduleExpirySweep();
}

function publish(state: PersistedAccountDeletionState): boolean {
  const previousPublic = effectivePublicState(getWireState());
  // Memory and BroadcastChannel are delivery optimizations, not durability.
  // Never expose a new phase unless the synchronous localStorage write can be
  // read back exactly; destructive callers use this result to fail closed.
  if (!persistWireState(state)) return false;
  announcePublishedState(state, previousPublic);
  return true;
}

function newEpoch(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAccountDeletionControlState(): AccountDeletionControlState {
  return effectivePublicState(getWireState());
}

/**
 * Complete only the cutover durably linked to this recovery notice. Requiring
 * the public recovery epoch as well prevents a stale tab from releasing a
 * newer recovery. Version-1 notices can only attest that a cutover was already
 * ready; they cannot safely finish an interrupted cutover.
 */
function finalizeMalformedAccountDeletionRecoveryUnderLock(
  recoveryEpoch: string,
  lease: AccountDeletionLockLease,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const recovery = parsePersistedRecovery(
      window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY),
    );
    if (
      !recovery ||
      recoveryIsExpired(recovery) ||
      recovery.epoch !== recoveryEpoch
    ) {
      return false;
    }
    if (recovery.version === 1) {
      return getReadyAccountLearningCutoverEpoch() !== null;
    }
    return (
      isAccountLearningCutoverEpochCurrent(recovery.cutoverEpoch) ||
      completeAccountLearningCutoverRecovery(
        recovery.cutoverEpoch,
        lease,
      )
    );
  } catch {
    return false;
  }
}

/**
 * Replace an unidentifiable deletion marker only after rotating the
 * non-PII account cutover and proving that every stale account-prefixed local
 * and tab-session value is gone. Anonymous learning keys are untouched.
 */
function recoverMalformedAccountDeletionControlUnderLock(
  lease: AccountDeletionLockLease,
): boolean {
  const malformedEntries = malformedDeletionStorageEntries();
  if (malformedEntries.length === 0) return false;
  const cutoverEpoch = beginAccountLearningCutoverRecovery(lease);
  if (!cutoverEpoch || !clearAllAccountLearningStorage(lease)) return false;

  const createdAt = Date.now();
  const recovery: PersistedAccountDeletionRecovery = {
    version: 2,
    epoch: newEpoch(),
    cutoverEpoch,
    createdAt,
    expiresAt: tombstoneExpiry(createdAt),
  };
  if (!persistExactStorageValue(ACCOUNT_DELETION_RECOVERY_KEY, recovery)) {
    return false;
  }
  for (const [key, raw] of malformedEntries) {
    if (key === ACCOUNT_DELETION_RECOVERY_KEY) continue;
    if (!removeExactStorageValue(key, raw)) return false;
  }
  const finalized = completeAccountLearningCutoverRecovery(
    cutoverEpoch,
    lease,
  );
  currentWireState = readPersistedState();
  const cleanupAll = recoveryPublicState(recovery);
  announceSupplementalState(cleanupAll);
  scheduleExpirySweep();
  // A same-tab cleanup listener may have retried finalization while the
  // supplemental state was delivered.
  return finalized || isAccountLearningCutoverEpochCurrent(cutoverEpoch);
}

export async function recoverMalformedAccountDeletionControl(): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) => recoverMalformedAccountDeletionControlUnderLock(lease),
  );
  return result.kind === "acquired" && result.value;
}

/**
 * Replays both stale-data scrub and exact cutover finalization under the same
 * queued lock. Runtime remains paused while this promise is unresolved.
 */
export async function resumeMalformedAccountDeletionRecovery(
  recoveryEpoch: string,
): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) =>
      clearAllAccountLearningStorage(lease) &&
      finalizeMalformedAccountDeletionRecoveryUnderLock(
        recoveryEpoch,
        lease,
      ),
  );
  return result.kind === "acquired" && result.value;
}

export function getAccountDeletionCleanupReplayStates(): readonly AccountDeletionControlState[] {
  return readPersistedCleanups().filter(
    (state) =>
      state.phase === "cleanup" || state.phase === "cleanup-all",
  );
}

export function subscribeAccountDeletionControl(
  listener: (state: AccountDeletionControlState) => void,
): () => void {
  installBrowserListeners();
  listeners.add(listener);
  for (const cleanup of getAccountDeletionCleanupReplayStates()) {
    listener(cleanup);
  }
  listener(getAccountDeletionControlState());
  return () => {
    listeners.delete(listener);
  };
}

export function beginAccountDeletion(accountId: string): string | null {
  installBrowserListeners();
  const normalizedAccountId = accountId.trim();
  if (!normalizedAccountId || normalizedAccountId.length > 256) return null;
  // A suspended tab can miss the storage event that announced another tab's
  // pending request. Reconcile the synchronous durable value before granting
  // destructive authority, while preserving any monotonic cached state that
  // is newer than storage and can be reasserted exactly.
  const cached = getWireState();
  const durable = readPersistedState();
  let existing = durable;
  if (cached && (!durable || compareWireStates(cached, durable) > 0)) {
    if (!persistWireState(cached)) return null;
    existing = cached;
  }
  currentWireState = existing;
  if (
    existing &&
    (existing.phase === "pending" || existing.phase === "confirmed")
  ) {
    // An active marker belongs to exactly one destructive request. Returning
    // its epoch to a sibling caller would let that caller cancel the shared
    // barrier after its own pre-delete failure while the first DELETE may
    // still commit. Terminal states below remain eligible for a new epoch.
    return null;
  }
  if (existing?.generation === Number.MAX_SAFE_INTEGER) {
    return null;
  }
  const epoch = newEpoch();
  const createdAt = Date.now();
  const generation = existing ? existing.generation + 1 : 1;
  const persisted = publish({
    version: 2,
    generation,
    phase: "pending",
    epoch,
    accountId: normalizedAccountId,
    createdAt,
    expiresAt: null,
  });
  return persisted ? epoch : null;
}

export function cancelAccountDeletion(epoch: string): boolean {
  const state = getWireState();
  if (!state || state.phase !== "pending" || state.epoch !== epoch) {
    return false;
  }
  const createdAt = Date.now();
  return publish({
    ...state,
    phase: "cancelled",
    createdAt,
    expiresAt: tombstoneExpiry(createdAt),
  });
}

export function confirmAccountDeletion(
  epoch: string,
  accountId: string,
  lease: AccountDeletionLockLease,
): boolean {
  const normalizedAccountId = accountId.trim();
  if (
    epoch.length < 8 ||
    epoch.length > 200 ||
    !normalizedAccountId ||
    normalizedAccountId.length > 256
  ) {
    return false;
  }
  const state = getWireState();
  if (state?.accountId === normalizedAccountId) {
    if (state.phase === "released") {
      return state.epoch === epoch && persistWireState(state);
    }
    if (state.phase === "confirmed") {
      return (
        state.epoch === epoch &&
        rotateAccountLearningCutoverForDeletion(
          normalizedAccountId,
          lease,
        )
      );
    }
    if (
      state.epoch !== epoch ||
      (state.phase !== "pending" && state.phase !== "cancelled")
    ) {
      return false;
    }
    // Persist the server-confirmed journal before the fallible multi-key
    // cutover. Runtime can then resume an interrupted final-ready write without
    // asking the server to delete again.
    const confirmed: PersistedAccountDeletionState = {
      ...state,
      phase: "confirmed",
      expiresAt: null,
    };
    if (!publish(confirmed)) return false;
    if (
      !rotateAccountLearningCutoverForDeletion(
        normalizedAccountId,
        lease,
      )
    ) {
      return false;
    }
    return true;
  }

  // Another account may win the scalar election while this account's server
  // deletion is in flight. Persist this account's independent cleanup ledger
  // entry without disturbing the elected scalar request.
  if (state) {
    if (
      !rotateAccountLearningCutoverForDeletion(
        normalizedAccountId,
        lease,
      )
    ) {
      return false;
    }
    const confirmed: PersistedAccountDeletionState = {
      version: 2,
      generation: state.generation,
      phase: "confirmed",
      epoch,
      accountId: normalizedAccountId,
      createdAt: Date.now(),
      expiresAt: null,
    };
    const cleanup = persistCleanup(confirmed);
    if (!cleanup) return false;
    announceSupplementalState(
      dominantInvalidCleanup() ?? cleanupPublicState(cleanup),
    );
    return true;
  }
  const confirmed: PersistedAccountDeletionState = {
    version: 2,
    generation: 1,
    phase: "confirmed",
    epoch,
    accountId: normalizedAccountId,
    createdAt: Date.now(),
    expiresAt: null,
  };
  if (!publish(confirmed)) return false;
  return rotateAccountLearningCutoverForDeletion(
    normalizedAccountId,
    lease,
  );
}

/**
 * Advances a confirmed deletion to a durable cleanup tombstone. The account
 * id remains visible for a bounded retention window so suspended tabs can
 * clear exactly that browser namespace before normal sync resumes.
 */
function releaseConfirmedAccountDeletionUnderLock(
  epoch: string,
  lease: AccountDeletionLockLease,
): boolean {
  const state = getWireState();
  if (!state || state.phase !== "confirmed" || state.epoch !== epoch) {
    return false;
  }
  if (
    state.accountId === null ||
    !rotateAccountLearningCutoverForDeletion(state.accountId, lease)
  ) {
    return false;
  }
  // Persist one immutable cleanup marker per account before advancing the
  // scalar request state. Later deletions may replace the scalar marker, but a
  // suspended tab can still replay every account-bound cleanup independently.
  const cleanup = persistCleanup(state);
  if (!cleanup) return false;
  const released: PersistedAccountDeletionState = {
    ...state,
    phase: "released",
    createdAt: cleanup.createdAt,
    expiresAt: cleanup.expiresAt,
  };
  if (publish(released)) return true;

  // localStorage has no multi-key transaction. The immutable cleanup entry
  // plus the still-confirmed scalar is a durable release encoding: startup
  // repairs it to released, and expiry removes both. Do not leave this tab's
  // cached public state stuck at confirmed when only the scalar rewrite fails.
  currentWireState = released;
  announceSupplementalState(cleanupPublicState(cleanup));
  scheduleExpirySweep();
  return true;
}

export async function releaseConfirmedAccountDeletion(
  epoch: string,
): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) => releaseConfirmedAccountDeletionUnderLock(epoch, lease),
  );
  return result.kind === "acquired" && result.value;
}

export function __resetAccountDeletionControlForTests(): void {
  currentWireState = undefined;
  listeners.clear();
  notificationQueue.length = 0;
  notificationInProgress = false;
  lastNotifiedSignature = null;
  announcementQueue.length = 0;
  announcementInProgress = false;
  expiryRetryMs = MIN_EXPIRY_RETRY_MS;
  clearExpiryTimer();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(ACCOUNT_DELETION_CONTROL_KEY);
      window.localStorage.removeItem(ACCOUNT_DELETION_RECOVERY_KEY);
      const cleanupKeys = Array.from(
        { length: window.localStorage.length },
        (_, index) => window.localStorage.key(index),
      ).filter(
        (key): key is string =>
          key !== null && key.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX),
      );
      for (const key of cleanupKeys) window.localStorage.removeItem(key);
    } catch {
      // Test cleanup remains best-effort for storage-denial cases.
    }
  }
}
