import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_RETRIEVAL_SCHEDULE,
  getRetrievalIntervalDays,
  hasExactRetrievalSchedule,
  isRetrievalDue,
  scheduleRetrievalAttempt,
} from "./retrieval-schedule";

afterEach(() => {
  vi.useRealTimers();
});

describe("retrieval schedule", () => {
  it("makes an incorrect response due for immediate repair", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-08-13T12:00:00.000Z");

    const schedule = scheduleRetrievalAttempt(EMPTY_RETRIEVAL_SCHEDULE, false);

    expect(schedule).toEqual({
      successLevel: 0,
      lastAttemptAt: "2026-08-13T12:00:00.000Z",
      nextDueAt: "2026-08-13T12:00:00.000Z",
    });
    expect(isRetrievalDue(schedule.nextDueAt)).toBe(true);
  });

  it("advances successful repair and reviews through 1, 7, and 21 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-08-13T12:00:00.000Z");

    const incorrect = scheduleRetrievalAttempt(EMPTY_RETRIEVAL_SCHEDULE, false);
    const repaired = scheduleRetrievalAttempt(incorrect, true);
    expect(repaired.successLevel).toBe(1);
    expect(repaired.nextDueAt).toBe("2026-08-14T12:00:00.000Z");
    expect(isRetrievalDue(repaired.nextDueAt)).toBe(false);

    vi.setSystemTime(repaired.nextDueAt!);
    const firstReview = scheduleRetrievalAttempt(repaired, true);
    expect(firstReview.successLevel).toBe(2);
    expect(firstReview.nextDueAt).toBe("2026-08-21T12:00:00.000Z");

    vi.setSystemTime(firstReview.nextDueAt!);
    const secondReview = scheduleRetrievalAttempt(firstReview, true);
    expect(secondReview.successLevel).toBe(3);
    expect(secondReview.nextDueAt).toBe("2026-09-11T12:00:00.000Z");
    expect(getRetrievalIntervalDays(secondReview.successLevel)).toBe(21);

    vi.setSystemTime(secondReview.nextDueAt!);
    const cappedReview = scheduleRetrievalAttempt(secondReview, true);
    expect(cappedReview.successLevel).toBe(3);
    expect(cappedReview.nextDueAt).toBe("2026-10-02T12:00:00.000Z");
  });

  it("resets the success sequence after a later misconception", () => {
    const reviewed = {
      successLevel: 3 as const,
      lastAttemptAt: "2026-08-01T00:00:00.000Z",
      nextDueAt: "2026-08-22T00:00:00.000Z",
    };

    const incorrect = scheduleRetrievalAttempt(
      reviewed,
      false,
      Date.parse("2026-08-22T00:00:00.000Z"),
    );
    expect(incorrect.successLevel).toBe(0);
    expect(incorrect.nextDueAt).toBe(incorrect.lastAttemptAt);

    const repaired = scheduleRetrievalAttempt(
      incorrect,
      true,
      Date.parse("2026-08-22T00:05:00.000Z"),
    );
    expect(repaired.successLevel).toBe(1);
    expect(repaired.nextDueAt).toBe("2026-08-23T00:05:00.000Z");
  });

  it("validates only the exact 0, 1, 7, and 21 day persisted deltas", () => {
    const lastAttemptAt = "2026-08-13T12:00:00.000Z";
    for (const [successLevel, nextDueAt] of [
      [0, "2026-08-13T12:00:00.000Z"],
      [1, "2026-08-14T12:00:00.000Z"],
      [2, "2026-08-20T12:00:00.000Z"],
      [3, "2026-09-03T12:00:00.000Z"],
    ] as const) {
      expect(
        hasExactRetrievalSchedule({
          successLevel,
          lastAttemptAt,
          nextDueAt,
        }),
      ).toBe(true);
    }

    expect(hasExactRetrievalSchedule(EMPTY_RETRIEVAL_SCHEDULE)).toBe(true);
    expect(
      hasExactRetrievalSchedule({
        successLevel: 1,
        lastAttemptAt,
        nextDueAt: lastAttemptAt,
      }),
    ).toBe(false);
    expect(
      hasExactRetrievalSchedule({
        successLevel: 3,
        lastAttemptAt,
        nextDueAt: "2026-08-20T12:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      hasExactRetrievalSchedule({
        successLevel: 1,
        lastAttemptAt: null,
        nextDueAt: null,
      }),
    ).toBe(false);
    expect(
      hasExactRetrievalSchedule({
        successLevel: 0,
        lastAttemptAt,
        nextDueAt: null,
      }),
    ).toBe(false);
  });
});
