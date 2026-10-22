/**
 * The two texts the learner's own choices shape: the block "Für Prompt 2"
 * (the worksheet blanks 1, 4, 5 and 6, as labelled lines) and the example
 * decision sheet under the blank template. Both are pure functions of the
 * demo state, and the copy button copies exactly what they return.
 */

import type { NorthwindCopy } from "./copy-types";
import { assessSheet, SHEET_FIELDS, type DemoState, type Sheet } from "./logic";
import { fill, joinList, pick } from "./template";

/** The worksheet's six blanks. The demo can answer 1, 4, 5 and 6. */
const ALL_BLANKS = [1, 2, 3, 4, 5, 6] as const;

export interface BridgeText {
  /** Blanks the learner answered, ascending. */
  readonly answered: readonly number[];
  /** The full text, lead sentence first; empty when nothing is answered. */
  readonly text: string;
}

export function bridgeLines(state: DemoState, copy: NorthwindCopy): readonly string[] {
  const lines: string[] = [];
  if (state.defect) lines.push(copy.defects.options[state.defect].bridge);
  if (state.compare) lines.push(copy.compare.options[state.compare].bridge);
  if (state.flag) lines.push(copy.flag.options[state.flag].bridge);
  if (state.sheet.open) lines.push(copy.bridge.limits[state.sheet.open]);
  return lines;
}

export function bridgeText(state: DemoState, copy: NorthwindCopy): BridgeText {
  const answered = [
    ...(state.defect ? [1] : []),
    ...(state.compare ? [4] : []),
    ...(state.flag ? [5] : []),
    ...(state.sheet.open ? [6] : []),
  ];
  if (answered.length === 0) return { answered, text: "" };
  const rest = ALL_BLANKS.filter((blank) => !answered.includes(blank));
  const { lead: leads, listAnd } = copy.bridge;
  const lead = fill(pick(leads, answered.length), {
    answered: joinList(answered, listAnd),
    rest: joinList(rest, listAnd),
  });
  return { answered, text: [lead, ...bridgeLines(state, copy)].join("\n") };
}

/**
 * The learner's NORTHWIND sheet: one line per answered row in the chosen
 * option's words; a weak line ends in [täuscht] or [nicht in den Daten].
 * Empty when no row is answered.
 */
export function sheetText(sheet: Sheet, { decide: copy }: NorthwindCopy): string {
  const result = assessSheet(sheet);
  return SHEET_FIELDS.flatMap((field, index) => {
    const option = sheet[field];
    if (option === undefined) return [];
    const options = copy.options[field] as Readonly<Record<string, { sheet: string }>>;
    const verdict = result.rows[index].verdict;
    const tag = verdict === "misleads" || verdict === "absent" ? ` ${copy.weakTag[verdict]}` : "";
    return [`${copy.sheetRows[field]}: ${options[option].sheet}${tag}`];
  }).join("\n");
}
