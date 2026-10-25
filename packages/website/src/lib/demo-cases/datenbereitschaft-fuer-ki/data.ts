/**
 * The facts behind demo 03 "Stufe oder Treppe?", taken from the Workshop 03
 * kit (public/workshops/datenbereitschaft-fuer-ki/). Origin classes as in
 * builder/warehouse/seed/SEED-FACTS.md:
 *
 * - DECK: a fixed fact shown in the workshop (the approved view's values).
 * - RECORDED: what an AI answered in the August 2026 recording, one run.
 * - DERIVED: arithmetic on the values above, never called a recorded value.
 *
 * data.test.ts reads the kit's CSV and SEED-FACTS.md and pins every number.
 */

export type Month = "2026-03" | "2026-04" | "2026-05" | "2026-06";

/** Ending MRR in EUR, a level (DECK, mrr_summary_monthly.csv ending_mrr_eur). */
export const ENDING_MRR: Readonly<Record<Month, number>> = {
  "2026-03": 354_635,
  "2026-04": 334_675,
  "2026-05": 344_450,
  "2026-06": 387_015,
};

/** Net new MRR in EUR, a change (DECK, mrr_summary_monthly.csv net_new_mrr_eur). */
export const NET_NEW_MRR: Readonly<Record<Month, number>> = {
  "2026-03": 60_160,
  "2026-04": -19_960,
  "2026-05": 9_775,
  "2026-06": 42_565,
};

export const FOLDLINE = {
  /** The approved table of the example. */
  table: "analytics.mrr_summary_monthly",
  /** The three Q2 levels added: "describes nothing" (DECK counter-example). */
  levelsSummedQ2: 1_066_140,
  /** June's change minus March's change, read as levels (RECORDED, SEED-FACTS). */
  recordedChangeDiff: -17_595,
} as const;
