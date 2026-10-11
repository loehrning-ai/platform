/**
 * Turns the kit's customer questionnaire (an .xlsx in the course source) into a CSV.
 *
 * The repository's publication guards refuse spreadsheet containers in public files and in
 * archives (scan-export.mjs and zip-inspection.mjs fail closed on .xlsx), so the public kit
 * carries the same sheet as plain text: row by row, columns A to F, blank rows kept. Only
 * inline strings and numbers are read; anything else (shared strings, formulas, a second
 * sheet) stops the export so a changed source gets a human look.
 */
import { inflateRawSync } from "node:zlib";

const SHEET = "xl/worksheets/sheet1.xml";
const COLUMNS = ["A", "B", "C", "D", "E", "F"];

/** One entry's bytes from a ZIP container, read through its central directory. */
function zipEntry(bytes, wanted) {
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("Questionnaire is not a ZIP container");
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  const names = [];
  for (let index = 0; index < count; index++) {
    if (bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Questionnaire central directory is damaged");
    const method = bytes.readUInt16LE(cursor + 10);
    const compressed = bytes.readUInt32LE(cursor + 20);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const local = bytes.readUInt32LE(cursor + 42);
    const name = bytes.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    names.push(name);
    cursor += 46 + nameLength + extraLength + commentLength;
    if (name !== wanted) continue;
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + compressed);
    if (method === 0) return data;
    if (method === 8) return inflateRawSync(data);
    throw new Error(`Unsupported compression method ${method} in ${name}`);
  }
  if (names.some((name) => /^xl\/worksheets\/sheet[2-9]/.test(name))) throw new Error("Questionnaire has more than one sheet");
  throw new Error(`Questionnaire has no ${wanted}`);
}

function unescapeXml(text) {
  return text.replace(/&(lt|gt|quot|apos|amp);/g, (_, name) => ({ lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" })[name]);
}

function csvField(value) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** CSV text (LF line ends, final newline) for the first sheet of an .xlsx. */
export function questionnaireCsv(xlsx) {
  if (zipEntry(xlsx, "xl/workbook.xml").toString("utf8").match(/<sheet\b/g)?.length !== 1) {
    throw new Error("Questionnaire must have exactly one sheet");
  }
  const xml = zipEntry(xlsx, SHEET).toString("utf8");
  if (/<f[ >]/.test(xml)) throw new Error("Questionnaire contains formulas");
  const rows = new Map();
  for (const [, rowNumber, body] of xml.matchAll(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map();
    for (const [, column, attributes, content] of body.matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      if (!COLUMNS.includes(column)) throw new Error(`Questionnaire uses column ${column}`);
      const type = /\bt="([^"]+)"/.exec(attributes)?.[1] ?? "n";
      let value;
      if (type === "inlineStr") value = [...content.matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join("");
      else if (type === "n") value = /<v>([^<]*)<\/v>/.exec(content)?.[1] ?? "";
      else throw new Error(`Questionnaire cell type ${type} is not supported`);
      cells.set(column, unescapeXml(value));
    }
    rows.set(Number(rowNumber), cells);
  }
  const last = Math.max(...rows.keys());
  const lines = [];
  for (let row = 1; row <= last; row++) {
    const cells = rows.get(row) ?? new Map();
    lines.push(COLUMNS.map((column) => csvField(cells.get(column) ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}
