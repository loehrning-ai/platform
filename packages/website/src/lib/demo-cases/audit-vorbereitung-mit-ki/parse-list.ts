/**
 * "Liste einfügen": one file per line, as `dir`, `dir /b`, `ls -l` or a
 * SharePoint or OneDrive list pasted as text print it. Fields split on a tab,
 * ";" or two or more spaces. A line nothing can be read from is reported by
 * its number, never guessed. A date that is no real day ("2026/13/45") or
 * could be two days ("05/06/2026") is flagged, never read as a year. Pure.
 */

import { firstDate, parseDateTokens, type DateToken } from "./dates";

export interface ListedFile {
  readonly name: string;
  readonly date: DateToken | null;
  /** `ls -l` prints "Oct  6 12:01" for this year: the date has no year. */
  readonly yearMissing: boolean;
  /** The line carries something shaped like a date that is no real day. */
  readonly dateInvalid: boolean;
  /** The line or the name carries a dd/mm/yyyy date that could be two days. */
  readonly dateAmbiguous: boolean;
  readonly line: number;
}

export interface ParsedList {
  readonly files: readonly ListedFile[];
  /** 1-based numbers of lines that could not be read. */
  readonly unread: readonly number[];
}

const LS_LONG = /^[-l][-rwxsStT@+.]{9,11}\s+\d+\s+\S+\s+\S+\s+\d+\s+(\w{3})\s+(\d{1,2})\s+(\d{1,2}:\d{2}|\d{4})\s+(.+)$/;
const LS_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** A name with an extension that holds a letter: "25.10.2026" is a date, not a file. */
const FILE_NAME = /^[^\\/:*?"<>|]*[^\s\\/:*?"<>|]\.(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{1,5}$/;
const HEADER = /^(name|dateiname|file|datei)\b/i;
/** Windows `dir`: "25.10.2026  09:14    48.211 Leitlinie.docx" (or 10/25/2026 09:14 AM); folders say <DIR>. */
const DIR_LINE = /^(\d{2}[./]\d{2}[./]\d{4}),?\s+\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?\s+(<DIR>|<JUNCTION>|[\d.,\u00a0\u202f]+)\s+(.+)$/;
/** A dd/mm/yyyy date inside a name: its slashes are not folders. */
const SLASH_DATE = /(?<!\d)(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?!\d)/g;
const HIDDEN = "\u2215";
/** The head and foot lines `dir` prints around the files. */
const DIR_NOISE = /^(verzeichnis von|directory of|datenträger|volume)\b|^\d+\s+(datei|verzeichnis|file|dir)/i;

/** The last path part. Splits on "\\" and on "/" between folder names, never inside a dd/mm/yyyy date. */
export function baseName(field: string): string {
  const kept = field.replace(SLASH_DATE, (match) => match.replaceAll("/", HIDDEN));
  return (kept.split(/[\\/]/).pop() ?? kept).replaceAll(HIDDEN, "/");
}

const isFileName = (field: string) => FILE_NAME.test(baseName(field).replaceAll("/", "-"));

function dateFlags(text: string): { readonly dateInvalid: boolean; readonly dateAmbiguous: boolean } {
  const tokens = parseDateTokens(text);
  const valid = tokens.some((token) => token.iso !== null);
  return { dateInvalid: !valid && tokens.some((token) => token.invalid), dateAmbiguous: tokens.some((token) => token.ambiguous) };
}

export function parseList(text: string): ParsedList {
  const files: ListedFile[] = [];
  const unread: number[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    const number = index + 1;
    if (!line || /^d[-rwx]{9}/.test(line) || /^total \d+$/.test(line) || HEADER.test(line) || DIR_NOISE.test(line)) return;
    const ls = LS_LONG.exec(line);
    if (ls) {
      const month = LS_MONTHS.indexOf((ls[1] ?? "").toLowerCase()) + 1;
      const timeOrYear = ls[3] ?? "";
      const yearMissing = timeOrYear.includes(":");
      const date = !yearMissing && month > 0 ? firstDate(`${timeOrYear}-${String(month).padStart(2, "0")}-${String(ls[2]).padStart(2, "0")}`) : null;
      const name = (ls[4] ?? "").trim();
      files.push({ name, date, yearMissing, dateInvalid: false, dateAmbiguous: dateFlags(name).dateAmbiguous, line: number });
      return;
    }
    const dir = DIR_LINE.exec(line);
    if (dir) {
      if ((dir[2] ?? "").startsWith("<")) return;
      const name = baseName((dir[3] ?? "").trim());
      const stamp = dateFlags(dir[1] ?? "");
      files.push({ name, date: firstDate(dir[1] ?? ""), yearMissing: false, dateInvalid: stamp.dateInvalid, dateAmbiguous: stamp.dateAmbiguous || dateFlags(name).dateAmbiguous, line: number });
      return;
    }
    const fields = line.split(/\t|;|\s{2,}/).map((field) => field.trim().replace(/^"|"$/g, "")).filter(Boolean);
    const field = fields.find(isFileName);
    if (!field) {
      unread.push(number);
      return;
    }
    const name = baseName(field);
    const others = fields.filter((entry) => entry !== field).join(" ");
    const flags = dateFlags(others);
    files.push({ name, date: firstDate(others), yearMissing: false, dateInvalid: flags.dateInvalid, dateAmbiguous: flags.dateAmbiguous || dateFlags(name).dateAmbiguous, line: number });
  });
  return { files, unread };
}
