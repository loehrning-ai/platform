/**
 * The own-data path as one pure function: the visitor's text in, the same
 * four checks out, or exactly one problem that names the line and the fix.
 * Nothing is computed from a partial file. No DOM, no network: the text
 * never leaves the tab.
 */
import { MIN_LERNEN, PRUEF, runCheck, type CheckOptions, type CheckResult, type Checker } from "./check";
import { parseTable, type ParseError, type ParseNotice } from "./parse";

/** Weeks with a stored forecast the range and the lamps need: 20 for the first range plus 13. */
export const LAMP_WEEKS = MIN_LERNEN + PRUEF;
/** Share of zero weeks above which percentages say little. */
export const ZERO_SHARE = 0.3;

export type OwnProblem = ParseError | { readonly key: "tooFew"; readonly weeks: number } | { readonly key: "zeroSales" };

export type OwnOutcome =
  | { readonly kind: "empty" }
  | { readonly kind: "problem"; readonly problem: OwnProblem }
  | {
      readonly kind: "ok";
      readonly result: CheckResult;
      readonly check: Checker;
      readonly notices: readonly ParseNotice[];
      readonly ignored: readonly string[];
      readonly manyZeros: boolean;
      /** Valid weeks with a stored forecast and a baseline value (the lamps need LAMP_WEEKS). */
      readonly forecastWeeks: number;
      readonly lampsReady: boolean;
    };

export function evaluateOwn(text: string, options: CheckOptions): OwnOutcome {
  if (text.trim() === "") return { kind: "empty" };
  const parsed = parseTable(text);
  if (!parsed.ok) return { kind: "problem", problem: parsed.error };
  const outcome = runCheck(parsed.rows, options);
  if (!outcome.ok) return { kind: "problem", problem: { key: "tooFew", weeks: outcome.weeks } };
  const { check, result } = outcome;
  const sales = check.wochen.reduce((sum, t) => sum + (check.rows[t]?.ist ?? 0), 0);
  if (sales <= 0) return { kind: "problem", problem: { key: "zeroSales" } };
  const actuals = parsed.rows.filter((row) => row.ist !== null);
  const zeros = actuals.filter((row) => row.ist === 0).length;
  // Weeks the range and the lamps can use: an actual, a stored forecast and the
  // baseline's value (the first week has no "last week"), so the count matches
  // the "Geprüft: ... Wochen" line instead of the file's row count.
  const forecastWeeks = check.hasForecast
    ? parsed.rows.filter((row, t) => check.valid(t) && row.f !== null && check.rule(t) !== null).length
    : 0;
  return {
    kind: "ok",
    result,
    check,
    notices: parsed.notices,
    ignored: parsed.ignored,
    manyZeros: actuals.length > 0 && zeros / actuals.length > ZERO_SHARE,
    forecastWeeks,
    lampsReady: check.hasForecast && forecastWeeks >= LAMP_WEEKS && result.spanne_wochen > 0,
  };
}
