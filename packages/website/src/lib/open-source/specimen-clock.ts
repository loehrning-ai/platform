/**
 * Pure time math for the specimen plates on /open-source. No DOM, no React:
 * every stage is a function of one second value `s`, and everything here
 * decides which `s` to show and what to say about it.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { SpecimenChapter } from "./artifacts";

/** Index of the chapter that contains second `s`. */
export function chapterIndexAt(
  chapters: readonly SpecimenChapter[],
  s: number,
): number {
  let index = 0;
  for (let i = 1; i < chapters.length; i += 1) {
    if (s >= chapters[i].atS) index = i;
  }
  return index;
}

const SECONDS = {
  de: new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  en: new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
} as const;

export function formatSeconds(locale: Locale, s: number): string {
  return `${SECONDS[locale].format(s)} s`;
}

/** Up to hundredths, so a scrubbed 2.75 s is spoken as 2,75 s, not 2,8 s. */
const PRECISE = {
  de: new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }),
  en: new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }),
} as const;

/** The ruler's aria-valuetext, e.g. "Kapitel 3 von 8: slam, 2,5 s". */
export function valueText(
  locale: Locale,
  chapters: readonly SpecimenChapter[],
  s: number,
  endS: number,
): string {
  const clamped = Math.min(Math.max(s, 0), endS);
  const index = chapterIndexAt(chapters, clamped);
  const at = `${PRECISE[locale].format(clamped)} s`;
  const n = chapters.length;
  return locale === "de"
    ? `Kapitel ${index + 1} von ${n}: ${chapters[index].label}, ${at}`
    : `Chapter ${index + 1} of ${n}: ${chapters[index].label}, ${at}`;
}

/** Length of each chapter in seconds, the last one ending at `endS`. */
export function chapterLengths(
  chapters: readonly SpecimenChapter[],
  endS: number,
): readonly number[] {
  return chapters.map((chapter, index) =>
    (chapters[index + 1]?.atS ?? endS) - chapter.atS,
  );
}

/**
 * Where a key on the ruler moves the tape, or null for keys the ruler
 * leaves alone. Arrows step one beat on the beat grid, Page keys jump a
 * chapter (back to the current chapter's start first), Home and End go to
 * the first frame and the rest frame. The last step always lands on `endS`,
 * even when the beat does not divide it.
 */
export function rulerKeyTarget(
  key: string,
  s: number,
  stepS: number,
  chapters: readonly SpecimenChapter[],
  endS: number,
): number | null {
  const at = (value: number) =>
    Math.min(Math.max(Math.round(value * 1000) / 1000, 0), endS);
  const beat = s / stepS;
  const index = chapterIndexAt(chapters, s);
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return at((Math.floor(beat + 1e-6) + 1) * stepS);
    case "ArrowLeft":
    case "ArrowDown":
      return at((Math.ceil(beat - 1e-6) - 1) * stepS);
    case "Home":
      return 0;
    case "End":
      return endS;
    case "PageDown":
      return index === chapters.length - 1 ? endS : chapters[index + 1].atS;
    case "PageUp":
      return s - chapters[index].atS > 0.25
        ? chapters[index].atS
        : chapters[Math.max(index - 1, 0)].atS;
    default:
      return null;
  }
}

/** The visible tape rewind: longer from further away, never above 400 ms. */
export function rewindMs(fromS: number): number {
  return Math.min(400, 120 + fromS * 20);
}

/**
 * How much of a stage the visitor can see, measured against what could be
 * visible: a stage taller than the free viewport counts as fully in view
 * once it fills that viewport, so a large stage can still autoplay.
 */
export function viewportRatio({
  visible,
  target,
  root,
}: {
  /** Height of the intersection rectangle, in px. */
  readonly visible: number;
  /** Height of the stage, in px. */
  readonly target: number;
  /** Height of the viewport minus sticky header and bottom bar, in px. */
  readonly root: number;
}): number {
  const fits = Math.min(target, root);
  return fits > 0 ? Math.min(Math.max(visible / fits, 0), 1) : 0;
}

export interface PlateState {
  readonly id: string;
  /** Plate number, higher is newer. */
  readonly number: number;
  /** Visible share of the stage, from viewportRatio. */
  readonly ratio: number;
  readonly played: boolean;
  readonly userPaused: boolean;
  readonly running: boolean;
}

/** Share of a stage (see viewportRatio) that must be in view to autoplay. */
export const AUTOPLAY_RATIO = 0.7;

/** Visibility ratios closer than this count as equal. */
const RATIO_TIE = 0.1;

/**
 * Which plate should autoplay next: the most visible plate at least 70 % in
 * view that has not played and was not paused by the visitor. Nothing while
 * another plate runs. Near ties (within 0.1) go to the newer plate.
 */
export function nextToPlay(plates: readonly PlateState[]): string | null {
  if (plates.some((plate) => plate.running)) return null;
  let best: PlateState | null = null;
  for (const plate of plates) {
    if (plate.ratio < AUTOPLAY_RATIO || plate.played || plate.userPaused) continue;
    const tie = best && Math.abs(plate.ratio - best.ratio) < RATIO_TIE;
    if (
      !best ||
      (!tie && plate.ratio > best.ratio) ||
      (tie && plate.number > best.number)
    ) {
      best = plate;
    }
  }
  return best?.id ?? null;
}

export function autoplayAllowed({
  reducedMotion,
  saveData,
  hidden,
}: {
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  readonly hidden: boolean;
}): boolean {
  return !reducedMotion && !saveData && !hidden;
}

/** Smooth start and stop between 0 and 1. */
export function smoothstep(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

export type PiecewiseKeys = readonly (readonly [p: number, v: number])[];

/**
 * Value of a keyed track at progress `p`: held before the first and after
 * the last key, eased with smoothstep between neighbouring keys.
 */
export function piecewise(keys: PiecewiseKeys, p: number): number {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1) {
    const [p1, v1] = keys[i];
    if (p <= p1) {
      const [p0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * smoothstep((p - p0) / (p1 - p0));
    }
  }
  return keys[keys.length - 1][1];
}
