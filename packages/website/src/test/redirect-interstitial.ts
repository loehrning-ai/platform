/**
 * Reads a redirect interstitial the way a browser does, for unit tests.
 *
 * The body is parsed with the DOM parser, so entity decoding and attribute
 * boundaries are the parser's, not a regular expression's. The refresh
 * instruction is then parsed with the HTML standard's own algorithm (the
 * "shared declarative refresh steps"), so a test asserts the exact URL a
 * browser would navigate to, not a substring of the markup.
 */

export interface DeclarativeRefresh {
  readonly delay: number;
  /** Null when the instruction names no URL, which reloads the same page. */
  readonly url: string | null;
}

const ASCII_WHITESPACE = new Set(["\t", "\n", "\f", "\r", " "]);

/**
 * HTML Living Standard, "shared declarative refresh steps", parsing half.
 * Returns null where the standard says to return without refreshing.
 */
export function parseDeclarativeRefresh(input: string): DeclarativeRefresh | null {
  let position = 0;
  const skipWhitespace = () => {
    while (position < input.length && ASCII_WHITESPACE.has(input[position])) {
      position += 1;
    }
  };

  skipWhitespace();
  const digitsStart = position;
  while (position < input.length && /[0-9]/.test(input[position])) position += 1;
  const digits = input.slice(digitsStart, position);
  if (digits === "" && input[position] !== ".") return null;
  const delay = digits === "" ? 0 : Number.parseInt(digits, 10);
  while (position < input.length && /[0-9.]/.test(input[position])) position += 1;

  if (position >= input.length) return { delay, url: null };
  if (
    input[position] !== ";" &&
    input[position] !== "," &&
    !ASCII_WHITESPACE.has(input[position])
  ) {
    return null;
  }
  skipWhitespace();
  if (input[position] === ";" || input[position] === ",") position += 1;
  skipWhitespace();
  if (position >= input.length) return { delay, url: null };

  let url = input.slice(position);

  // An optional `URL=` prefix. A first code point other than U goes straight
  // to "skip quotes"; a prefix that starts with U but then breaks off keeps the
  // whole remainder as the URL ("parse").
  const prefixThenQuotes = (): boolean => {
    if (input[position]?.toLowerCase() !== "u") return true;
    position += 1;
    for (const letter of ["r", "l"]) {
      if (input[position]?.toLowerCase() !== letter) return false;
      position += 1;
    }
    skipWhitespace();
    if (input[position] !== "=") return false;
    position += 1;
    skipWhitespace();
    return true;
  };

  if (prefixThenQuotes()) {
    // "Skip quotes".
    let quote = "";
    if (input[position] === "'" || input[position] === '"') {
      quote = input[position];
      position += 1;
    }
    url = input.slice(position);
    if (quote !== "" && url.includes(quote)) {
      url = url.slice(0, url.indexOf(quote));
    }
  }
  return { delay, url };
}

export interface InterstitialReading {
  readonly document: Document;
  readonly lang: string | null;
  readonly title: string;
  readonly visibleText: string;
  readonly refreshes: readonly (DeclarativeRefresh | null)[];
  readonly linkHrefs: readonly string[];
}

/** Parse an interstitial body into what a browser would act on and show. */
export function readInterstitialHtml(html: string): InterstitialReading {
  const document = new DOMParser().parseFromString(html, "text/html");
  const refreshes = Array.from(
    document.querySelectorAll("meta[http-equiv]"),
  )
    .filter(
      (meta) => meta.getAttribute("http-equiv")?.toLowerCase() === "refresh",
    )
    .map((meta) => parseDeclarativeRefresh(meta.getAttribute("content") ?? ""));
  return {
    document,
    lang: document.documentElement.getAttribute("lang"),
    title: document.title,
    visibleText: document.body.textContent ?? "",
    refreshes,
    linkHrefs: Array.from(document.querySelectorAll("a[href]")).map(
      (anchor) => anchor.getAttribute("href") ?? "",
    ),
  };
}

/** Every attribute name in the document, for inline-handler checks. */
export function attributeNames(document: Document): string[] {
  return Array.from(document.querySelectorAll("*")).flatMap((element) =>
    Array.from(element.attributes).map((attribute) => attribute.name),
  );
}
