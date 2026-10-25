/**
 * The answer key as ANSWERS.md states it, read from the kit text: Mission 1
 * (which files pass DATE and APPROVAL) and Mission 2 (one status per item).
 * Tests hold the engine (evidence.ts) to it, so the demo can never show a
 * status the kit does not.
 */

import type { ItemId } from "./classify";
import type { Status } from "./evidence";
import { kitText } from "./kit";

const STATUS: Readonly<Record<string, Status>> = { COVERED: "covered", WEAK: "weak", GAP: "gap" };

function tableAfter(text: string, heading: string): readonly (readonly string[])[] {
  const start = text.indexOf(heading);
  if (start < 0) return [];
  const rows: string[][] = [];
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (line.startsWith("## ")) break;
    if (!line.startsWith("| ") || /^\|\s*-/.test(line) || /^\| (File|Item) \|/.test(line)) continue;
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

export function keyIndex(text = kitText("ANSWERS.md")): readonly KeyIndexRow[] {
  return tableAfter(text, "## Mission 1").map((cells) => ({
    file: cells[0] as string,
    type: cells[1] as string,
    date: cells[4] === "pass",
    approval: cells[5] === "pass",
  }));
}

export interface KeyItemRow {
  readonly id: ItemId;
  readonly file: string;
  readonly status: Status;
}

export function keyItems(text = kitText("ANSWERS.md")): readonly KeyItemRow[] {
  return tableAfter(text, "## Mission 2").map((cells) => ({
    id: cells[0] as ItemId,
    file: cells[1] as string,
    status: STATUS[cells[4] as string] as Status,
  }));
}
