import type { Beat } from "@/lib/demo-beats";

/**
 * "Die Fehlerliste": one column (actual minus forecast) read four ways, the
 * same four tasks as the kit's uebung.md and the same four lamps as
 * pruefregel.md. Plain data, both languages (the rail labels).
 *
 *   schaetzen  commit    guess what "same as last week" scores with the tool's formula
 *   messlatte  reveal    92,6 %; the replay counts both error lists on the same 50 weeks
 *   spanne     tool      the 80 % range from the last 26 errors, hits counted
 *   planzahl   apply     the costs pick a point of the sorted errors
 *   regel      apply     four lamps every week, a person for red weeks
 *   meine-daten own      the same four checks on the visitor's own file
 *   mitnehmen  takehome  the kit, the skill, the rule
 */
export const BEATS = [
  { id: "schaetzen", kind: "commit", seconds: 1.2, label: { de: "Schätzen", en: "Guess" } },
  { id: "messlatte", kind: "reveal", seconds: 8, label: { de: "Messlatte", en: "Baseline" } },
  { id: "spanne", kind: "tool", seconds: 5, label: { de: "Spanne", en: "Range" } },
  { id: "planzahl", kind: "apply", seconds: 1.6, label: { de: "Planzahl", en: "Plan number" } },
  { id: "regel", kind: "apply", seconds: 4, label: { de: "Regel", en: "Rule" } },
  { id: "meine-daten", kind: "own", seconds: 0, label: { de: "Meine Daten", en: "My data" } },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" } },
] as const satisfies readonly Beat[];

export type BeatId = (typeof BEATS)[number]["id"];

export const BEAT_INDEX: Readonly<Record<BeatId, number>> = Object.fromEntries(
  BEATS.map((beat, index) => [beat.id, index]),
) as Record<BeatId, number>;
