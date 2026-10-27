/**
 * The answer key as the kit states it, read from the kit text: step 1 (which
 * files pass PERIOD and APPROVAL) and step 2 (one status per item). ANSWERS.md
 * is the English edition, de/LOESUNGEN.md the German one. Tests hold the
 * engine (evidence.ts) to both, so the demo can never show a status the kit
 * does not, in either language.
 */

import type { ItemId } from "./classify";
import type { Status } from "./evidence";
import { kitText } from "./kit";

const STATUS: Readonly<Record<string, Status>> = {
  COVERED: "covered",
  WEAK: "weak",
  GAP: "gap",
  BELEGT: "covered",
  SCHWACH: "weak",
  "LÜCKE": "gap",
};

export type KeyLocale = "de" | "en";

const KEY_FILE: Readonly<Record<KeyLocale, string>> = { en: "ANSWERS.md", de: "de/LOESUNGEN.md" };
const STEP: Readonly<Record<KeyLocale, string>> = { en: "## Step", de: "## Schritt" };
const PASS: Readonly<Record<KeyLocale, string>> = { en: "pass", de: "hält" };

function tableAfter(text: string, heading: string): readonly (readonly string[])[] {
  const start = text.indexOf(heading);
  if (start < 0) return [];
  const rows: string[][] = [];
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (line.startsWith("## ")) break;
    if (!line.startsWith("| ") || /^\|\s*-/.test(line) || /^\| (File|Item|Datei|Anforderung) \|/.test(line)) continue;
    rows.push(line.slice(2, -2).split(" | ").map((cell) => cell.trim()));
  }
  return rows;
}

export interface KeyIndexRow {
  readonly file: string;
  readonly type: string;
  readonly date: boolean;
  readonly approval: boolean;
}

export function keyIndex(locale: KeyLocale = "en"): readonly KeyIndexRow[] {
  return tableAfter(kitText(KEY_FILE[locale]), `${STEP[locale]} 1`).map((cells) => ({
    file: cells[0] as string,
    type: cells[1] as string,
    date: cells[4] === PASS[locale],
    approval: cells[5] === PASS[locale],
  }));
}

export interface KeyItemRow {
  readonly id: ItemId;
  readonly file: string;
  readonly status: Status;
}

export function keyItems(locale: KeyLocale = "en"): readonly KeyItemRow[] {
  return tableAfter(kitText(KEY_FILE[locale]), `${STEP[locale]} 2`).map((cells) => ({
    id: cells[0] as ItemId,
    file: cells[1] as string,
    status: STATUS[cells[4] as string] as Status,
  }));
}
