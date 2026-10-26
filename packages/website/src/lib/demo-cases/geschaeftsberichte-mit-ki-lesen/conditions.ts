/**
 * The release condition Claude proposed without the skill, quoted from the
 * recorded take for scene 3 ("Zusammenfassen"). The quote is a substring of
 * the take's final_text (conditions.test.ts), so a re-record cannot drift;
 * `counter` and `denom` say what the condition counts, so the card can show
 * that merging does or does not move it. `gaps` marks the words that leave a
 * line of a metric card open (our annotation, not Claude's). Never paraphrase
 * a take here.
 */
import type { Counter, Denom } from "./definitions";

/** A phrase of the quote that leaves one line of a metric card open. */
export interface ConditionGap {
  readonly phrase: string;
  readonly line: "denominator" | "period" | "trigger";
}

export interface RecordedCondition {
  /** The recording id in claude-runs/ (a take without the skill). */
  readonly takeId: string;
  /** Claude's words, exactly as in final_text once {line} is filled with LINE. */
  readonly quote: string;
  readonly counter: Counter;
  readonly denom: Denom;
  /** In the order they appear in the quote; each phrase occurs in it once. */
  readonly gaps: readonly ConditionGap[];
}

export const CONDITIONS: Readonly<Record<"de" | "en", RecordedCondition>> = {
  de: {
    takeId: "de-marketing-without-1",
    quote: "Der Anteil betroffener Stück sinkt über mehrere Wochen deutlich, zum Beispiel unter 15 %.",
    counter: "affected",
    denom: "per1000",
    gaps: [
      { phrase: "Anteil", line: "denominator" },
      { phrase: "über mehrere Wochen", line: "period" },
      { phrase: "deutlich, zum Beispiel unter 15 %", line: "trigger" },
    ],
  },
  en: {
    takeId: "en-marketing-without-2",
    quote: "such as the share of {line} units affected falling well below 30% over several comparable weeks",
    counter: "affected",
    denom: "per1000",
    gaps: [
      { phrase: "share", line: "denominator" },
      { phrase: "well below 30%", line: "trigger" },
      { phrase: "over several comparable weeks", line: "period" },
    ],
  },
};
