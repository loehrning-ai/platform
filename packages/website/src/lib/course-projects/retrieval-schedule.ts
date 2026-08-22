const DAY_MS = 24 * 60 * 60 * 1_000;

export const RETRIEVAL_INTERVAL_DAYS = [1, 7, 21] as const;

export type RetrievalSuccessLevel = 0 | 1 | 2 | 3;

export interface RetrievalSchedule {
  readonly successLevel: RetrievalSuccessLevel;
  readonly lastAttemptAt: string | null;
  readonly nextDueAt: string | null;
}

export const EMPTY_RETRIEVAL_SCHEDULE: RetrievalSchedule = {
  successLevel: 0,
  lastAttemptAt: null,
  nextDueAt: null,
};

function assertValidNow(now: number): void {
  if (!Number.isFinite(now)) {
    throw new RangeError("Retrieval scheduling requires a finite timestamp.");
  }
}

export function getRetrievalIntervalDays(
  successLevel: RetrievalSuccessLevel,
): 0 | 1 | 7 | 21 {
  if (successLevel === 0) return 0;
  return RETRIEVAL_INTERVAL_DAYS[successLevel - 1];
}

/**
 * Validates the persisted relationship between a retrieval level and its due
 * timestamp. The empty schedule is the only valid null-timestamp record;
 * migrated legacy attempts are handled explicitly at their parse boundary.
 */
export function hasExactRetrievalSchedule(
  schedule: RetrievalSchedule,
): boolean {
  const { lastAttemptAt, nextDueAt, successLevel } = schedule;
  if (lastAttemptAt === null || nextDueAt === null) {
    return lastAttemptAt === null && nextDueAt === null && successLevel === 0;
  }

  const lastAttempt = Date.parse(lastAttemptAt);
  const nextDue = Date.parse(nextDueAt);
  if (!Number.isFinite(lastAttempt) || !Number.isFinite(nextDue)) return false;

  return (
    nextDue - lastAttempt === getRetrievalIntervalDays(successLevel) * DAY_MS
  );
}

/**
 * Advances the local retrieval schedule after one locked answer. Incorrect
 * answers are due for immediate repair. Consecutive successful attempts move
 * through the bounded 1, 7, and 21 day sequence and remain capped at 21 days.
 */
export function scheduleRetrievalAttempt(
  current: RetrievalSchedule,
  correct: boolean,
  now = Date.now(),
): RetrievalSchedule {
  assertValidNow(now);
  const lastAttemptAt = new Date(now).toISOString();

  if (!correct) {
    return {
      successLevel: 0,
      lastAttemptAt,
      nextDueAt: lastAttemptAt,
    };
  }

  const successLevel = Math.min(
    RETRIEVAL_INTERVAL_DAYS.length,
    current.successLevel + 1,
  ) as RetrievalSuccessLevel;
  const intervalDays = getRetrievalIntervalDays(successLevel);

  return {
    successLevel,
    lastAttemptAt,
    nextDueAt: new Date(now + intervalDays * DAY_MS).toISOString(),
  };
}

export function isRetrievalDue(
  nextDueAt: string | null,
  now = Date.now(),
): boolean {
  assertValidNow(now);
  if (nextDueAt === null) return true;
  const dueAt = Date.parse(nextDueAt);
  return !Number.isFinite(dueAt) || dueAt <= now;
}
