/**
 * Scene 2: which name links break for a set of switched-on checks. A link
 * breaks when its file fails any active check; switching a check off heals
 * it again. State is a pure function of the set, so any order works. Pure.
 */

import { TEST_ORDER, type TestId } from "./evidence";
import type { ItemId } from "./classify";
import type { StageRow } from "./model";

export type CheckSet = ReadonlySet<TestId>;

/** The rows whose name-linked file fails one of the active checks. */
export function breaksFor(rows: readonly StageRow[], active: CheckSet): ReadonlySet<ItemId> {
  return new Set(rows.filter((row) => row.naive.failed.some((test) => active.has(test))).map((row) => row.item.id));
}

/** How many name links still hold. */
export function survivors(rows: readonly StageRow[], active: CheckSet): number {
  return rows.length - breaksFor(rows, active).size;
}

/** The rows one check breaks on its own. */
export function brokenBy(rows: readonly StageRow[], test: TestId): readonly ItemId[] {
  return [...breaksFor(rows, new Set([test]))];
}

/**
 * True when every broken row fails exactly one check and every check breaks
 * at least one row: then "each check ruled out different files" is true.
 */
export function eachCheckDistinct(rows: readonly StageRow[]): boolean {
  const broken = rows.filter((row) => row.naive.failed.length > 0);
  return broken.every((row) => row.naive.failed.length === 1) && TEST_ORDER.every((test) => brokenBy(rows, test).length > 0);
}

/** The check that breaks a row first in check order among the active ones, or null when the link holds. */
export function breakingCheck(row: StageRow, active: CheckSet): TestId | null {
  return TEST_ORDER.find((test) => active.has(test) && row.naive.failed.includes(test)) ?? null;
}

/** All 16 on/off sets of the four checks. */
export function allCheckSets(): readonly CheckSet[] {
  return Array.from({ length: 16 }, (_, mask) => new Set(TEST_ORDER.filter((_, bit) => mask & (1 << bit))));
}
