/**
 * The upper bound for an item of the visitor's own folder. A name and a date
 * can rule evidence out, never confirm it: SCOPE and QUOTE need the content
 * and a person or Claude with the skill. So own data never reaches BELEGT.
 * Pure.
 */

export type Bound = "none" | "notMet" | "weak" | "open";

export interface BoundInput {
  /** A candidate file exists for the item. */
  readonly hasCandidate: boolean;
  /** DATUM of the best candidate: true, false or unknown. */
  readonly date: boolean | null;
  /** FREIGABE of the best candidate: true, false or unknown. */
  readonly approval: boolean | null;
  /** The best candidate's own text says the thing was not done ("planned", "not done"). */
  readonly notMet?: boolean;
}

/**
 * "none": LÜCKE unless it sits under another name. "notMet": the record's own
 * text says it was not done, so LÜCKE unless another record exists. "weak": at
 * most SCHWACH. "open": OFFEN until UMFANG and ZITAT are read.
 */
export function boundOf(input: BoundInput): Bound {
  if (!input.hasCandidate) return "none";
  if (input.notMet) return "notMet";
  if (input.date === false || input.approval === false) return "weak";
  return "open";
}
