// ─── Badge logic tests (shared course architecture) ──
//
// The badge catalog + award rules power the cross-course gamification ledger.
// These assert the pure mapping from (lessonsCompleted, streakDays) → badges
// and the newly-earned diffing that the store + toast provider rely on.

import { describe, it, expect } from "vitest";
import {
  BADGES,
  getBadgeDefinition,
  computeNewlyEarnedBadges,
} from "./badges";
import { UNIFIED_SCHEMA_VERSION, type UnifiedProgress } from "./types";

function makeState(over: Partial<UnifiedProgress> = {}): UnifiedProgress {
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-06-03T00:00:00.000Z",
    ...over,
  };
}

describe("BADGES catalog", () => {
  it("defines six badges with unique ids and German labels", () => {
    expect(BADGES).toHaveLength(6);
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BADGES) {
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
      // No em dashes anywhere in user-facing copy.
      expect(b.label).not.toMatch(/—/);
      expect(b.description).not.toMatch(/—/);
    }
  });

  it("lesson-count badges fire at the documented thresholds", () => {
    const byId = (id: string) => getBadgeDefinition(id)!;
    expect(byId("first-light").earned(0, 0)).toBe(false);
    expect(byId("first-light").earned(1, 0)).toBe(true);
    expect(byId("apprentice").earned(2, 0)).toBe(false);
    expect(byId("apprentice").earned(3, 0)).toBe(true);
    expect(byId("journeyman").earned(5, 0)).toBe(false);
    expect(byId("journeyman").earned(6, 0)).toBe(true);
    expect(byId("maestro").earned(11, 0)).toBe(false);
    expect(byId("maestro").earned(12, 0)).toBe(true);
  });

  it("streak badges fire on streak days independent of lessons", () => {
    expect(getBadgeDefinition("streak-3")!.earned(0, 2)).toBe(false);
    expect(getBadgeDefinition("streak-3")!.earned(0, 3)).toBe(true);
    expect(getBadgeDefinition("streak-7")!.earned(0, 6)).toBe(false);
    expect(getBadgeDefinition("streak-7")!.earned(0, 7)).toBe(true);
  });

  it("getBadgeDefinition returns undefined for unknown ids", () => {
    expect(getBadgeDefinition("does-not-exist")).toBeUndefined();
  });
});

describe("computeNewlyEarnedBadges", () => {
  it("returns nothing for a fresh learner with zero progress", () => {
    expect(computeNewlyEarnedBadges(makeState(), 0)).toEqual([]);
  });

  it("awards only the not-yet-held badges that qualify", () => {
    const state = makeState({
      streak: { days: 3, last: "2026-06-03" },
      badges: { "first-light": "2026-06-01T00:00:00.000Z" },
    });
    // 3 lessons + 3-day streak → apprentice + first-light(held) + streak-3.
    const earned = computeNewlyEarnedBadges(state, 3);
    expect(earned).toContain("apprentice");
    expect(earned).toContain("streak-3");
    expect(earned).not.toContain("first-light"); // already held
    expect(earned).not.toContain("journeyman"); // threshold not met
  });

  it("is idempotent once every qualifying badge is held", () => {
    const allHeld: Record<string, string> = {};
    for (const b of BADGES) allHeld[b.id] = "2026-06-01T00:00:00.000Z";
    const state = makeState({
      streak: { days: 7, last: "2026-06-03" },
      badges: allHeld,
    });
    expect(computeNewlyEarnedBadges(state, 12)).toEqual([]);
  });
});
