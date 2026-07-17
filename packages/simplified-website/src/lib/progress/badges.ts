// ─── Badge catalog + award rules (shared course architecture) ──
//
// Badges are cross-course: earned from the unified ledger's lesson-completion
// count + streak. German Mittelstand copy, no em dashes.

import type { UnifiedProgress } from "./types";

export interface BadgeDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Returns true when the progress state qualifies for this badge. */
  readonly earned: (lessonsCompleted: number, streakDays: number) => boolean;
}

export const BADGES: readonly BadgeDefinition[] = [
  {
    id: "first-light",
    label: "Erster Schritt",
    description: "Erste Lektion abgeschlossen.",
    earned: (n) => n >= 1,
  },
  {
    id: "apprentice",
    label: "Auf Kurs",
    description: "Drei Lektionen abgeschlossen.",
    earned: (n) => n >= 3,
  },
  {
    id: "journeyman",
    label: "Im Fluss",
    description: "Sechs Lektionen abgeschlossen.",
    earned: (n) => n >= 6,
  },
  {
    id: "maestro",
    label: "Routiniert",
    description: "Zwölf Lektionen abgeschlossen.",
    earned: (n) => n >= 12,
  },
  {
    id: "streak-3",
    label: "Drei Tage am Stück",
    description: "Drei Tage in Folge gelernt.",
    earned: (_n, streak) => streak >= 3,
  },
  {
    id: "streak-7",
    label: "Eine Woche dran",
    description: "Sieben Tage in Folge gelernt.",
    earned: (_n, streak) => streak >= 7,
  },
] as const;

const BADGE_BY_ID: ReadonlyMap<string, BadgeDefinition> = new Map(
  BADGES.map((b) => [b.id, b]),
);

export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_BY_ID.get(id);
}

/**
 * Compute which badge ids the state qualifies for but has not yet been awarded.
 * Pure: returns the list of newly-earned ids without mutating anything.
 */
export function computeNewlyEarnedBadges(
  state: UnifiedProgress,
  lessonsCompleted: number,
): readonly string[] {
  const streakDays = state.streak.days;
  return BADGES.filter(
    (b) => b.earned(lessonsCompleted, streakDays) && !state.badges[b.id],
  ).map((b) => b.id);
}
