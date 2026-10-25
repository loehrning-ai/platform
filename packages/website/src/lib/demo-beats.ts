/**
 * The beat contract of a v3 demo (the red line, the same in deck, kit and
 * demo): ordered beats of fixed kinds
 *
 *   commit -> reveal -> tool -> apply (0 to 3) -> own -> takehome
 *
 * at most eight in all. Each beat is one segment of the clock t: beat i runs
 * from t = i to t = i + 1, and the stage is drawn as a pure function of
 * (beat, progress). A demo exports its beats from
 * src/lib/demo-cases/<slug>/beats.ts (plain data, both languages, no
 * server-only import) and its route passes them to the shell.
 */

export type BeatKind = "commit" | "reveal" | "tool" | "apply" | "own" | "takehome";

export interface Beat {
  /** URL id for ?beat=<id>: lower-case words joined by hyphens. */
  readonly id: string;
  readonly kind: BeatKind;
  /** How long the beat's own motion runs, in seconds (reduced motion: 0). */
  readonly seconds: number;
  /** The rail label, one or two words. */
  readonly label: { readonly de: string; readonly en: string };
  /** A path inside the workshop's kit zip this beat quotes or acts on. */
  readonly kitFile?: string;
}

export const MAX_BEATS = 8;
/** The id of the "Für deinen Claude" block the takehome beat moves to. */
export const TAKEHOME_TARGET_ID = "fuer-deinen-claude";
export const MAX_APPLY_BEATS = 3;
const BEAT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Every way the beats break the contract; empty when they meet it. */
export function validateBeats(beats: readonly Beat[]): readonly string[] {
  const errors: string[] = [];
  const kinds = beats.map((beat) => beat.kind).join(" ");
  if (!new RegExp(`^commit reveal tool(?: apply){0,${MAX_APPLY_BEATS}} own takehome$`).test(kinds)) {
    errors.push(`kinds must read "commit reveal tool [apply x0-3] own takehome", got "${kinds}"`);
  }
  if (beats.length > MAX_BEATS) errors.push(`${beats.length} beats, at most ${MAX_BEATS}`);
  const ids = new Set<string>();
  for (const beat of beats) {
    if (!BEAT_ID.test(beat.id)) errors.push(`beat id "${beat.id}" is not a lower-case slug`);
    if (ids.has(beat.id)) errors.push(`beat id "${beat.id}" repeats`);
    ids.add(beat.id);
    if (!(beat.seconds >= 0 && beat.seconds <= 30)) errors.push(`beat "${beat.id}": seconds ${beat.seconds} not in 0..30`);
    for (const locale of ["de", "en"] as const) {
      const label = beat.label[locale];
      if (!label || label.length > 16) errors.push(`beat "${beat.id}": ${locale} label must be 1 to 16 characters`);
    }
    if (beat.kitFile !== undefined && (beat.kitFile.startsWith("/") || beat.kitFile.includes(".."))) {
      errors.push(`beat "${beat.id}": kitFile must be a path inside the kit zip`);
    }
  }
  return errors;
}

/**
 * ?beat=<id> or ?beat=<1-based number> to a beat index; null for anything else.
 * Read once on load, never written back.
 */
export function beatIndexFromParam(beats: readonly Beat[], value: string | null): number | null {
  if (value === null || value === "") return null;
  const byId = beats.findIndex((beat) => beat.id === value);
  if (byId >= 0) return byId;
  if (/^[1-9]$/.test(value)) {
    const index = Number(value) - 1;
    return index < beats.length ? index : null;
  }
  return null;
}

/** The clock value t for a beat index and its progress in [0, 1]. */
export function clockT(index: number, progress: number): number {
  return index + Math.min(1, Math.max(0, progress));
}

/** Beat index and progress for a clock value t in [0, beats]. */
export function splitClock(t: number, count: number): { readonly index: number; readonly progress: number } {
  const clamped = Math.min(count, Math.max(0, t));
  const index = Math.min(count - 1, Math.floor(clamped));
  return { index, progress: clamped - index };
}
