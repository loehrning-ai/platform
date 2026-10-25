/** A hedged guess whether pasted numbers are a change (Stufe) or a level (Treppe). It proves nothing. */
export type Likely = "change" | "level" | "unclear";

export function classify(values: readonly number[], neverNegative: boolean): Likely {
  if (values.some((value) => value < 0)) return neverNegative ? "change" : "unclear";
  const mean = values.reduce((total, value) => total + Math.abs(value), 0) / values.length;
  if (mean === 0) return "unclear";
  const spread = (Math.max(...values) - Math.min(...values)) / mean;
  return spread < 0.5 ? "level" : "unclear";
}
