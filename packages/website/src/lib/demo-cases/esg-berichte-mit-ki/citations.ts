/**
 * Finds the file citations in Claude's recorded answers ("ordner/strom_2025.csv
 * Z. 3–10", "kompensation_2025.txt:5, 7", "`files/electricity_2025.csv:3-14`"),
 * so the visitor can open the cited file at the cited line. Pure: the text is
 * never changed, only cut into plain parts and citation parts.
 */

export interface Citation {
  readonly file: string;
  /** First and last cited line; null when the text names the file without a line. */
  readonly from: number | null;
  readonly to: number | null;
}

export type CitePart = { readonly kind: "text"; readonly text: string } | { readonly kind: "cite"; readonly text: string; readonly cite: Citation };

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The pattern for a set of file names: an optional folder, the name, then an optional line or range. */
function citePattern(names: readonly string[]): RegExp | null {
  if (names.length === 0) return null;
  const alternatives = [...names].sort((a, b) => b.length - a.length).map(escape).join("|");
  return new RegExp(
    `(?:[\\w-]+/)?(${alternatives})(?:(?::|\\s+Z\\.\\s*|\\s+(?:Zeilen?|lines?)\\s+)(\\d+)(?:\\s*[-\\u2013]\\s*(\\d+))?)?`,
    "g",
  );
}

/** Cuts a text into plain parts and citations of the given file names. */
export function citeParts(text: string, names: readonly string[]): readonly CitePart[] {
  const pattern = citePattern(names);
  if (!pattern) return [{ kind: "text", text }];
  const parts: CitePart[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ kind: "text", text: text.slice(last, at) });
    const from = match[2] ? Number(match[2]) : null;
    const to = match[3] ? Number(match[3]) : from;
    parts.push({ kind: "cite", text: match[0], cite: { file: match[1] as string, from, to } });
    last = at + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

/** Every citation in a text, in order. */
export function citationsIn(text: string, names: readonly string[]): readonly Citation[] {
  return citeParts(text, names).flatMap((part) => (part.kind === "cite" ? [part.cite] : []));
}
