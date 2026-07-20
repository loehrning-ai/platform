/**
 * types.test.ts (regression coverage - lib coverage catch-all)
 *
 * Exercises the shared widget-system type guards + kind partition in
 * `@/lib/widgets/types`. This COMPLEMENTS the pre-existing
 * `tier-a-kinds.test.ts` (which pins the Tier-A list + `isTierAKind` /
 * `isWidgetKind` / `isExerciseKind` around the `task-spec` case). Here we cover
 * the guards that file leaves untested (`isDemoKind`, `isPracticeKind`,
 * `isWidgetPlacement`, and `isExerciseKind` across every real exercise kind),
 * plus the cross-group invariant the widget registry depends on: the four kind
 * arrays are a disjoint partition of `ALL_WIDGET_KINDS`.
 *
 * Everything is derived from the exported arrays (not hard-coded literal
 * lists), so a widget-catalogue change keeps the assertions honest instead of
 * silently drifting.
 */

import { describe, it, expect } from "vitest";
import {
  DEMO_KINDS,
  EXERCISE_KINDS,
  TIER_A_KINDS,
  PRACTICE_KINDS,
  CLAUDE_KINDS,
  ALL_WIDGET_KINDS,
  WIDGET_PLACEMENTS,
  isDemoKind,
  isExerciseKind,
  isTierAKind,
  isPracticeKind,
  isClaudeKind,
  isWidgetKind,
  isWidgetPlacement,
} from "./types";

// A guard bound to the group it is supposed to accept. Iterating these keeps
// every assertion sourced from the live catalogue rather than a copied list.
type KindGuard = (value: unknown) => boolean;

interface KindGroup {
  readonly name: string;
  readonly kinds: readonly string[];
  readonly guard: KindGuard;
}

const GROUPS: readonly KindGroup[] = [
  { name: "demo", kinds: DEMO_KINDS, guard: isDemoKind },
  { name: "exercise", kinds: EXERCISE_KINDS, guard: isExerciseKind },
  { name: "tier-a", kinds: TIER_A_KINDS, guard: isTierAKind },
  { name: "practice", kinds: PRACTICE_KINDS, guard: isPracticeKind },
  { name: "claude", kinds: CLAUDE_KINDS, guard: isClaudeKind },
];

const ALL_GUARDS: readonly KindGuard[] = [
  isDemoKind,
  isExerciseKind,
  isTierAKind,
  isPracticeKind,
  isClaudeKind,
  isWidgetKind,
  isWidgetPlacement,
];

const NON_STRINGS: readonly unknown[] = [
  null,
  undefined,
  0,
  42,
  true,
  false,
  {},
  [],
  { kind: "demo-roi" },
  Symbol("demo-roi"),
];

describe("widgets/types: isDemoKind", () => {
  it("accepts every registered demo kind", () => {
    for (const kind of DEMO_KINDS) {
      expect(isDemoKind(kind)).toBe(true);
    }
  });

  it("rejects kinds from the other groups and unknown strings", () => {
    expect(isDemoKind("quiz")).toBe(false); // Tier-A
    expect(isDemoKind("exercise-fix-prompt")).toBe(false); // exercise
    expect(isDemoKind("prompt-orrery")).toBe(false); // practice
    expect(isDemoKind("demo-does-not-exist")).toBe(false);
    expect(isDemoKind("")).toBe(false);
  });
});

describe("widgets/types: isPracticeKind", () => {
  it("accepts every registered practice kind", () => {
    for (const kind of PRACTICE_KINDS) {
      expect(isPracticeKind(kind)).toBe(true);
    }
  });

  it("rejects kinds from the other groups and unknown strings", () => {
    expect(isPracticeKind("demo-roi")).toBe(false);
    expect(isPracticeKind("exercise-pii-spotter")).toBe(false);
    expect(isPracticeKind("flashcards")).toBe(false);
    expect(isPracticeKind("semantic space")).toBe(false); // space, not hyphen
  });
});

describe("widgets/types: isExerciseKind", () => {
  it("accepts every registered exercise kind", () => {
    for (const kind of EXERCISE_KINDS) {
      expect(isExerciseKind(kind)).toBe(true);
    }
  });

  it("rejects demo, Tier-A, and practice kinds", () => {
    expect(isExerciseKind("demo-agent")).toBe(false);
    expect(isExerciseKind("risk-pyramid")).toBe(false); // Tier-A
    expect(isExerciseKind("prompt-transform")).toBe(false); // practice
  });
});

describe("widgets/types: isWidgetPlacement", () => {
  it("accepts every declared placement slot", () => {
    for (const placement of WIDGET_PLACEMENTS) {
      expect(isWidgetPlacement(placement)).toBe(true);
    }
    // Pin the exact vocabulary the reader resolves against.
    expect([...WIDGET_PLACEMENTS]).toEqual(["after-intro", "before-quiz", "end"]);
  });

  it("rejects unknown slots and is case-sensitive", () => {
    expect(isWidgetPlacement("middle")).toBe(false);
    expect(isWidgetPlacement("END")).toBe(false);
    expect(isWidgetPlacement("after intro")).toBe(false);
    expect(isWidgetPlacement("")).toBe(false);
  });

  it("does not treat a widget kind as a placement", () => {
    expect(isWidgetPlacement("demo-roi")).toBe(false);
  });
});

describe("widgets/types: isWidgetKind", () => {
  it("accepts a representative kind from each of the five groups", () => {
    expect(isWidgetKind(DEMO_KINDS[0])).toBe(true);
    expect(isWidgetKind(EXERCISE_KINDS[0])).toBe(true);
    expect(isWidgetKind(TIER_A_KINDS[0])).toBe(true);
    expect(isWidgetKind(PRACTICE_KINDS[0])).toBe(true);
    expect(isWidgetKind(CLAUDE_KINDS[0])).toBe(true);
  });

  it("rejects unknown strings and placement slots", () => {
    expect(isWidgetKind("not-a-widget")).toBe(false);
    expect(isWidgetKind("after-intro")).toBe(false); // a placement, not a kind
    expect(isWidgetKind("")).toBe(false);
  });
});

describe("widgets/types: isClaudeKind", () => {
  it("accepts every registered claude kind", () => {
    for (const kind of CLAUDE_KINDS) {
      expect(isClaudeKind(kind)).toBe(true);
    }
  });

  it("rejects kinds from the other groups and unknown strings", () => {
    expect(isClaudeKind("demo-roi")).toBe(false);
    expect(isClaudeKind("quiz")).toBe(false);
    expect(isClaudeKind("prompt-orrery")).toBe(false);
    expect(isClaudeKind("prompt-sandbox-does-not-exist")).toBe(false);
  });
});

describe("widgets/types: kind partition invariant", () => {
  it("ALL_WIDGET_KINDS is exactly the concatenation of the five groups", () => {
    expect([...ALL_WIDGET_KINDS]).toEqual([
      ...DEMO_KINDS,
      ...EXERCISE_KINDS,
      ...TIER_A_KINDS,
      ...PRACTICE_KINDS,
      ...CLAUDE_KINDS,
    ]);
    expect(ALL_WIDGET_KINDS).toHaveLength(
      DEMO_KINDS.length +
        EXERCISE_KINDS.length +
        TIER_A_KINDS.length +
        PRACTICE_KINDS.length +
        CLAUDE_KINDS.length,
    );
  });

  it("contains no duplicate kind across the whole catalogue", () => {
    const unique = new Set<string>(ALL_WIDGET_KINDS);
    expect(unique.size).toBe(ALL_WIDGET_KINDS.length);
  });

  it("keeps the four groups pairwise disjoint", () => {
    for (let a = 0; a < GROUPS.length; a += 1) {
      const setA = new Set<string>(GROUPS[a].kinds);
      for (let b = a + 1; b < GROUPS.length; b += 1) {
        const overlap = GROUPS[b].kinds.filter((k) => setA.has(k));
        expect(overlap).toEqual([]);
      }
    }
  });

  it("routes each kind to exactly one group guard (and to isWidgetKind)", () => {
    for (const group of GROUPS) {
      for (const kind of group.kinds) {
        // Its own guard accepts it, isWidgetKind accepts it...
        expect(group.guard(kind)).toBe(true);
        expect(isWidgetKind(kind)).toBe(true);
        // ...and every OTHER group guard rejects it.
        for (const other of GROUPS) {
          if (other.name === group.name) continue;
          expect(other.guard(kind)).toBe(false);
        }
      }
    }
  });
});

describe("widgets/types: guards reject non-string input", () => {
  it("returns false for null, undefined, numbers, booleans, objects, arrays, symbols", () => {
    for (const guard of ALL_GUARDS) {
      for (const value of NON_STRINGS) {
        expect(guard(value)).toBe(false);
      }
    }
  });
});
