/**
 * "Liste einfügen": one file per line, as `dir /b`, `ls -l` or a SharePoint
 * or OneDrive list pasted as text print it. Fields split on a tab, ";" or two
 * or more spaces. A line nothing can be read from is reported by its number,
 * never guessed. Pure.
 */

import { firstDate, type DateToken } from "./dates";

export interface ListedFile {
  readonly name: string;
  readonly date: DateToken | null;
  /** `ls -l` prints "Oct  6 12:01" for this year: the date has no year. */
  readonly yearMissing: boolean;
  readonly line: number;
}

export interface ParsedList {
  readonly files: readonly ListedFile[];
  /** 1-based numbers of lines that could not be read. */
  readonly unread: readonly number[];
}

const LS_LONG = /^[-l][-rwxsStT@+.]{9,11}\s+\d+\s+\S+\s+\S+\s+\d+\s+(\w{3})\s+(\d{1,2})\s+(\d{1,2}:\d{2}|\d{4})\s+(.+)$/;
const LS_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const FILE_NAME = /^[^\\/:*?"<>|]*[^\s\\/:*?"<>|]\.[A-Za-z0-9]{1,5}$/;
const HEADER = /^(name|dateiname|file|datei)\b/i;

export function parseList(text: string): ParsedList {
  const files: ListedFile[] = [];
  const unread: number[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    const number = index + 1;
    if (!line || /^d[-rwx]{9}/.test(line) || /^total \d+$/.test(line) || HEADER.test(line)) return;
    const ls = LS_LONG.exec(line);
    if (ls) {
      const month = LS_MONTHS.indexOf((ls[1] ?? "").toLowerCase()) + 1;
      const timeOrYear = ls[3] ?? "";
      const yearMissing = timeOrYear.includes(":");
      const date = !yearMissing && month > 0 ? firstDate(`${timeOrYear}-${String(month).padStart(2, "0")}-${String(ls[2]).padStart(2, "0")}`) : null;
      files.push({ name: (ls[4] ?? "").trim(), date, yearMissing, line: number });
      return;
    }
    const fields = line.split(/\t|;|\s{2,}/).map((field) => field.trim().replace(/^"|"$/g, "")).filter(Boolean);
    const name = fields.find((field) => FILE_NAME.test(field.split(/[\\/]/).pop() ?? ""));
    if (!name) {
      unread.push(number);
      return;
    }
    const others = fields.filter((field) => field !== name).join(" ");
    files.push({ name: name.split(/[\\/]/).pop() ?? name, date: firstDate(others), yearMissing: false, line: number });
  });
  return { files, unread };
}
