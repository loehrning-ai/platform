import challengesData from "../../../content/ai-native/challenges.json";

/**
 * AI Challenge of the Week — content loader + ISO-week resolver.
 *
 * Twelve pre-seeded weekly scenarios rotate via ISO-week-modulo 12.
 * Week 13 wraps back to week 1. The registry itself defines the cadence.
 *
 * See: AI-native challenge flow Stages 1-2.
 */

export interface Challenge {
  readonly weekOffset: number;
  readonly role: string;
  readonly scenario: string;
  readonly stack: readonly string[];
  readonly timeBudget: string;
  readonly modelSolution: string;
  readonly rubric: readonly string[];
}

interface ChallengesData {
  readonly _meta: {
    readonly title: string;
    readonly version: string;
    readonly authored: string;
    readonly rotationWeeks: number;
    readonly language: string;
    readonly rotationNote: string;
  };
  readonly challenges: readonly Challenge[];
}

const DATA = challengesData as ChallengesData;

export function getAllChallenges(): readonly Challenge[] {
  return DATA.challenges;
}

export function getChallengesMeta(): ChallengesData["_meta"] {
  return DATA._meta;
}

/**
 * Compute current challenge by ISO week number modulo rotation length.
 * Pure function — takes the reference date as a parameter for deterministic
 * testing (no hidden Date.now() in grading).
 */
export function getChallengeForDate(now: Date = new Date()): Challenge {
  const isoWeek = getISOWeek(now);
  const offset = (isoWeek - 1) % DATA.challenges.length;
  return DATA.challenges[offset < 0 ? offset + DATA.challenges.length : offset];
}

/**
 * ISO 8601 week number. Reference: Tuesday of the same week determines the
 * week number. Handles year boundary correctly (Jan 1 can be week 52 of the
 * previous year or week 1 of the current, depending on the weekday).
 */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // Set to Thursday in the current week (ISO: week contains Thursday)
  const dayNr = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = (d.getTime() - firstThursday.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

/** Formatted ISO-week string (e.g. "2026-W17") for display + analytics. */
export function formatWeekIso(date: Date = new Date()): string {
  const week = getISOWeek(date);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
