/**
 * The kit's own case: the CSV of the zip in the page's language (same numbers,
 * the notes and column names translated), read by the same parser a
 * visitor's file goes through, and the costs of daten/kosten.md (kit.test.ts
 * holds both against the kit files).
 */
import { runCheck, type CheckResult, type Checker } from "./check";
import type { DemoLocale } from "./format";
import { KIT_CSV, KIT_CSV_EN } from "./kit-series";
import { parseTable, type ParsedTable } from "./parse";

/** daten/kosten.md: a missing jar 1,50 €; a leftover jar 0,40 € with the canteen, 1,60 € without. */
export const KIT_COSTS = { fehlmenge: 1.5, restKantine: 0.4, restOhne: 1.6 } as const;

/** The kit CSV of an edition: linsensuppe-woechentlich.csv (de) or lentil-soup-weekly.csv (en). */
export function kitCsv(locale: DemoLocale = "de"): string {
  return locale === "en" ? KIT_CSV_EN : KIT_CSV;
}

const tables = new Map<DemoLocale, ParsedTable>();

export function kitTable(locale: DemoLocale = "de"): ParsedTable {
  const cached = tables.get(locale);
  if (cached) return cached;
  const parsed = parseTable(kitCsv(locale));
  if (!parsed.ok) throw new Error(`kit CSV (${locale}) does not parse: ${parsed.error.key}`);
  tables.set(locale, parsed);
  return parsed;
}

export function kitCheck(
  fehlmenge: number | null,
  rest: number | null,
  locale: DemoLocale = "de",
): { readonly result: CheckResult; readonly check: Checker } {
  const outcome = runCheck(kitTable(locale).rows, { fehlmenge, rest, messlatte: "wie letzte Woche" });
  if (!outcome.ok) throw new Error("kit CSV has too few weeks");
  return outcome;
}
