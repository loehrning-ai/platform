/**
 * The intro of a demo (language-standard B.8, glass-spec 4.10) and which
 * shell it runs on. Each demo owns src/lib/demo-cases/<slug>/intro.ts with
 *
 *   export const SHELL: DemoShellVersion = "v4";
 *   export const INTRO: DemoIntroData = { de: {...}, en: {...} };
 *
 * Plain data in both languages (it is small and the hub needs it too).
 * The shell builds the card: kicker from the workshop number and minutes,
 * then the title, the four sentences, the start button, "Frei
 * ausprobieren" and the privacy footnote.
 */

import type { DemoShellVersion } from "@/components/demos/shell/beat-clock";

export interface DemoIntroCopy {
  /** One sentence that says what this is ("Drei Angebote fair vergleichen"). */
  readonly title: string;
  /**
   * Four sentences: what this is (say "erfunden" if it is), what you do, what
   * you take away, how long ("{minutes}" is filled from demos.ts) and that
   * nothing is sent. 50 to 75 words in all.
   */
  readonly sentences: readonly [string, string, string, string];
  /** The start button names the first action ("Mit der Schätzung starten"). */
  readonly start: string;
  /**
   * Optional: up to two sentences of real, dated news the invented case
   * rests on, shown above the four sentences. They are context, not part of
   * the B.8 formula, so they do not count towards its 50 to 75 words.
   */
  readonly news?: readonly string[];
  /** Optional: replaces the shell's privacy footnote (a demo that shows recorded Claude answers says so). */
  readonly footnote?: string;
}

export interface DemoIntroData {
  readonly de: DemoIntroCopy;
  readonly en: DemoIntroCopy;
}

export type { DemoShellVersion };

export const INTRO_MIN_WORDS = 50;
export const INTRO_MAX_WORDS = 75;

/** The sentences with {minutes} filled in. */
export function introSentences(copy: DemoIntroCopy, minutes: number): readonly [string, string, string, string] {
  return copy.sentences.map((sentence) => sentence.replaceAll("{minutes}", String(minutes))) as unknown as readonly [string, string, string, string];
}

/** Every way an intro breaks B.8; empty when it meets it. */
export function validateIntro(intro: DemoIntroData): readonly string[] {
  const errors: string[] = [];
  for (const locale of ["de", "en"] as const) {
    const copy = intro[locale];
    const words = copy.sentences.join(" ").split(/\s+/).filter(Boolean).length;
    if (words < INTRO_MIN_WORDS || words > INTRO_MAX_WORDS) errors.push(`${locale}: ${words} words, want ${INTRO_MIN_WORDS} to ${INTRO_MAX_WORDS}`);
    if (!copy.sentences[3].includes("{minutes}")) errors.push(`${locale}: sentence 4 must carry the {minutes} slot`);
    for (const sentence of copy.sentences) {
      if (!/[.!?]$/.test(sentence.trim())) errors.push(`${locale}: "${sentence.slice(0, 30)}" is not a full sentence`);
      if (/[\u2013\u2014\u2192\u00f7\u00d7\u03a3]/.test(sentence)) errors.push(`${locale}: "${sentence.slice(0, 30)}" has a dash or symbol`);
    }
    if (!copy.title || /[\u2013\u2014]/.test(copy.title)) errors.push(`${locale}: title`);
    if (copy.news && copy.news.length > 2) errors.push(`${locale}: at most two news sentences`);
    for (const sentence of [...(copy.news ?? []), ...(copy.footnote ? [copy.footnote] : [])]) {
      if (!/[.!?]$/.test(sentence.trim())) errors.push(`${locale}: "${sentence.slice(0, 30)}" is not a full sentence`);
      if (/[\u2013\u2014]/.test(sentence)) errors.push(`${locale}: "${sentence.slice(0, 30)}" has a dash`);
    }
    if (!copy.start || copy.start.split(/\s+/).length > 6) errors.push(`${locale}: start button must name the first action in at most six words`);
  }
  return errors;
}
