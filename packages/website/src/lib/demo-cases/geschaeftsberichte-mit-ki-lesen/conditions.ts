/**
 * The release condition Claude proposed without the skill, quoted from the
 * recorded take for scene 3 ("Zusammenfassen"). The quote is a substring of
 * the take's final_text (conditions.test.ts), so a re-record cannot drift;
 * `counter` and `denom` say what the condition counts, so the card can show
 * that merging does or does not move it. Never paraphrase a take here.
 */
import type { Counter, Denom } from "./definitions";

export interface RecordedCondition {
  /** The recording id in claude-runs/ (a take without the skill). */
  readonly takeId: string;
  /** Claude's words, exactly as in final_text once {line} is filled with LINE. */
  readonly quote: string;
  readonly counter: Counter;
  readonly denom: Denom;
}

export const CONDITIONS: Readonly<Record<"de" | "en", RecordedCondition>> = {
  de: {
    takeId: "de-marketing-without-1",
    quote: "Der Anteil betroffener Stück sinkt über mehrere Wochen deutlich, zum Beispiel unter 15 %.",
    counter: "affected",
    denom: "per1000",
  },
  en: {
    takeId: "en-marketing-without-2",
    quote: "the share of {line} units affected falling well below 30% over several comparable weeks",
    counter: "affected",
    denom: "per1000",
  },
};
