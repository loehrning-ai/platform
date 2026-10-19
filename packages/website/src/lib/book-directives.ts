/**
 * Block directives in book chapter Markdown. One directive is one line on its
 * own, so the file still reads as plain text in any editor and a diff shows it:
 *
 *   ::figure{id="C4"}
 *   ::ticker{ref="c4.weighted_share" tail="der Firmen mit auffindbarer Website schreiben KI auf die Startseite."}
 *
 * `figure` places the interactive figure of that id (the JSON in
 * content/books/<book>/figures, the island in components/book-reader/figures).
 * `ticker` is the big number that opens a chapter; `ref` is a number token
 * without the braces. Values sit in double quotes and hold no double quote.
 * Number tokens ({{c4.raw_share}}) are resolved before the directive is read,
 * so a ticker tail may use them.
 *
 * Pure functions, no file access: used by the reader, the loader and the tests.
 */

export interface Directive {
  readonly name: string;
  readonly attrs: Readonly<Record<string, string>>;
  /** The line as written (after token resolution). */
  readonly source: string;
}

const LINE = /^::([a-z][a-z-]*)\{([^{}\n]*)\}$/;
const ATTR = /([a-zA-Z][a-zA-Z0-9-]*)="([^"]*)"/g;

export class DirectiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DirectiveError";
  }
}

/** Required attributes per known directive. */
const REQUIRED: Readonly<Record<string, readonly string[]>> = {
  figure: ["id"],
  ticker: ["ref", "tail"],
};

/** Parses one trimmed line; null when it is not a directive. Throws for a malformed known directive. */
export function parseDirective(line: string): Directive | null {
  const match = LINE.exec(line.trim());
  if (!match) return null;
  const name = match[1] as string;
  const body = match[2] as string;
  const attrs: Record<string, string> = {};
  let rest = body;
  for (const m of body.matchAll(ATTR)) {
    attrs[m[1] as string] = m[2] as string;
    rest = rest.replace(m[0], "");
  }
  if (rest.trim() !== "") {
    throw new DirectiveError(`::${name}: cannot read the attributes in {${body}}. Write key="value" pairs, no quotes inside a value.`);
  }
  const required = REQUIRED[name];
  if (!required) throw new DirectiveError(`unknown directive ::${name}. Known: ${Object.keys(REQUIRED).join(", ")}`);
  for (const key of required) {
    if (!attrs[key]) throw new DirectiveError(`::${name} needs ${key}="..."`);
  }
  return { name, attrs, source: line.trim() };
}

/** Figure ids are written in any case (C4, c4) and compared in lower case. */
export function figureKey(id: string): string {
  return id.trim().toLowerCase();
}

/** Every directive of a chapter in reading order. Code fences are skipped. */
export function listDirectives(markdown: string): Directive[] {
  const out: Directive[] = [];
  let fence: string | null = null;
  for (const line of markdown.split("\n")) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const mark = (fenceMatch[1] as string)[0] as string;
      fence = fence === null ? mark : fence === mark ? null : fence;
      continue;
    }
    if (fence !== null) continue;
    const directive = parseDirective(line);
    if (directive) out.push(directive);
  }
  return out;
}

/** The figure ids a chapter points at, lower case, in order of appearance. */
export function figureIdsOf(markdown: string): string[] {
  return listDirectives(markdown)
    .filter((d) => d.name === "figure")
    .map((d) => figureKey(d.attrs["id"] as string));
}

export function hasDirectives(markdown: string): boolean {
  return /^::[a-z]/m.test(markdown) && listDirectives(markdown).length > 0;
}

/**
 * The chapter as plain Markdown for readers that cannot show a figure (the
 * agent tools, the text PDF): each directive line becomes `describe(directive)`
 * or disappears when that returns null.
 */
export function replaceDirectives(markdown: string, describe: (directive: Directive) => string | null): string {
  let fence: string | null = null;
  return markdown
    .split("\n")
    .map((line) => {
      const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
      if (fenceMatch) {
        const mark = (fenceMatch[1] as string)[0] as string;
        fence = fence === null ? mark : fence === mark ? null : fence;
        return line;
      }
      if (fence !== null) return line;
      const directive = parseDirective(line);
      if (!directive) return line;
      return describe(directive) ?? "";
    })
    .join("\n");
}
