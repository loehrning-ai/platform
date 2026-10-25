/**
 * The kit's own case: the CSV of the zip, read by the same parser a visitor's
 * file goes through, and the costs of daten/kosten.md (kit.test.ts holds
 * both against the kit files).
 */
import { runCheck, type CheckResult, type Checker } from "./check";
import { KIT_CSV } from "./kit-series";
import { parseTable, type ParsedTable } from "./parse";

/** daten/kosten.md: a missing jar 1,50 €; a leftover jar 0,40 € with the canteen, 1,60 € without. */
export const KIT_COSTS = { fehlmenge: 1.5, restKantine: 0.4, restOhne: 1.6 } as const;

let table: ParsedTable | null = null;

export function kitTable(): ParsedTable {
  if (table) return table;
  const parsed = parseTable(KIT_CSV);
  if (!parsed.ok) throw new Error(`kit CSV does not parse: ${parsed.error.key}`);
  table = parsed;
  return parsed;
}

export function kitCheck(fehlmenge: number | null, rest: number | null): { readonly result: CheckResult; readonly check: Checker } {
  const outcome = runCheck(kitTable().rows, { fehlmenge, rest, messlatte: "wie letzte Woche" });
  if (!outcome.ok) throw new Error("kit CSV has too few weeks");
  return outcome;
}
