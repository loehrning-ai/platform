import type { Check, Hit, HitKind } from "./types";

/*
 * The detector: pure, deterministic, high precision only. It finds what LOOKS
 * like an e-mail, an IBAN (mod-97 checked), a phone number, an order or
 * reference number, a key, an address, a salutation name or an amount. It
 * cannot see names without a title, company names, context or images, and the
 * screen says so. Nothing here guesses names from capitalised words.
 */

/** Tie-break when two hits overlap and are equally long: earlier wins. */
const PRIORITY: readonly HitKind[] = [
  "secret",
  "iban",
  "email",
  "address",
  "person",
  "order",
  "ref",
  "phone",
  "amount",
  "manual",
];

interface Candidate {
  readonly kind: HitKind;
  readonly start: number;
  readonly end: number;
  readonly check: Check;
}

const candidate = (kind: HitKind, start: number, end: number, check: Check): Candidate => ({
  kind,
  start,
  end,
  check,
});

/** ISO 7064 mod 97-10 over the digit-expanded string, chunked so no BigInt is needed. */
export function ibanMod97(compact: string): boolean {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(compact)) return false;
  const moved = compact.slice(4) + compact.slice(0, 4);
  let remainder = 0;
  for (const char of moved) {
    const code = char.charCodeAt(0);
    const digits = code >= 65 ? String(code - 55) : char;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** Shannon entropy in bits per character. */
export function entropy(token: string): number {
  if (token.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const char of token) counts.set(char, (counts.get(char) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const share = count / token.length;
    bits -= share * Math.log2(share);
  }
  return bits;
}

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
const IBAN_SHAPE = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/gu;
const PHONE_INTL = /(?<![\p{L}\p{N}])(?:\+|00)\d{1,3}[\d ()/-]{7,14}\d/gu;
const PHONE_LOCAL = /(?<![\p{L}\p{N}-])0\d{1,4}[ /-]?\d{3,}(?:[ -]\d{2,5}){0,2}(?![\p{L}\p{N}])/gu;
const REFERENCE = /\b[A-Z]{2,3}-\d{3,8}\b/gu;
const ORDER_CONTEXT = /(?:bestell|order)/i;
const SECRET_PREFIX =
  /\bsk[-_][A-Za-z0-9_-]{8,}|\bAKIA[0-9A-Z]{16}\b|\bghp_[A-Za-z0-9]{20,}|\bxox[bp]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/gu;
const SECRET_ASSIGNED =
  /(?:api[_-]?key|secret|token|passwort|password|passwd|pwd)\s*[:=]\s*["']?([^\s"',;)}]{4,})/giu;
/** A placeholder this tool wrote: never a secret, so the rest scan stays at 0. */
const PLACEHOLDER = /^\[[A-ZÄÖÜ_ \d-]{2,24}\]$/u;
const SECRET_TOKEN = /[A-Za-z0-9_\-+/=]{20,}/gu;
const STREET_DE =
  /\p{Lu}[\p{L}-]*(?:straße|strasse|str\.|weg|allee|platz|gasse|ring|damm|ufer|steig)\s+\d{1,3}[a-z]?\b/gu;
const STREET_EN = /\b\d{1,4}\s+\p{Lu}\p{L}+\s+(?:Street|St\.|Road|Rd\.|Avenue|Ave\.|Lane)/gu;
const POSTCODE = /\b\d{5}\s+(?!(?:EUR|Euro)\b)\p{Lu}[\p{L}-]+/gu;
/** Salutations whose next words are a name. */
const SALUTATION = String.raw`(?:Frau|Herrn|Herr|Fr\.|Hr\.|Dr\.|Prof\.|Mrs?\.?|Ms\.?|Mx\.?)`;
/** Stacked titles after a salutation: "Dr.", "Prof. Dr.", "Dipl.-Ing.", with or without the dot. */
const TITLE = String.raw`(?:Prof(?![\p{L}])\.?|Dr(?![\p{L}])\.?(?:-Ing\.?)?|Dipl\.-\p{L}+\.?|Mag(?![\p{L}])\.?|Ing(?![\p{L}])\.?|PD(?![\p{L}])|MBA(?![\p{L}])|(?:med|nat|rer|phil|jur|iur|habil)(?![\p{L}])\.?|h\.\s?c\.)`;
/** One name word: capitalised, never ends on an abbreviation dot (the dot is not a name character). */
const NAME_WORD = String.raw`\p{Lu}[\p{L}'-]+`;
/**
 * The run after a salutation, as ONE hit: any stacked titles, then one or two
 * name words ("Dr. Schmidt", "Prof. Dr. Müller", "Smith"). A title is never a
 * name word, so "Frau Dr." alone is not a hit.
 */
const SALUTATION_NAME = new RegExp(
  String.raw`(?<=\b${SALUTATION}\s+)(?:${TITLE}\s+)*(?!${TITLE}(?:\s|$))${NAME_WORD}(?:\s${NAME_WORD})?`,
  "gu",
);
/*
 * Names that sit in a recognisable frame: "ich bin / mein Name ist" before,
 * "Hallo / Liebe / Dear" before, a sign-off ("Viele Grüße", "Regards,") above.
 * Each frame yields one or two capitalised words; CONTEXT_STOP removes the
 * common false friends ("Hallo Team", "Ich bin Kunde"), so a hit is always a
 * name that stands in a name's place.
 */
const INTRO_FRAME = String.raw`(?:[Mm]ein Name ist|[Ii]ch hei(?:ß|ss)e|[Ii]ch bin|[Mm]y name is|[Ii] am called|[Ii] am|[Ii]['’]m)`;
const GREETING_FRAME = String.raw`(?:Hallo|Hi|Hey|Hello|Moin|Servus|Liebe|Lieber|Dear)`;
const CLOSING_FRAME = String.raw`(?:(?:Viele|Beste|Liebe|Herzliche|Freundliche|Schöne|Sonnige|Besten) Grüße|Mit (?:freundlichen|besten|herzlichen) Grüßen|Grüße|Gruß|Gruss|(?:Best|Kind|Warm|Many|Sincere) regards|Regards|Sincerely|Cheers|Thanks|Thank you|Danke|Dank)`;
const CONTEXT_NAME = String.raw`${NAME_WORD}(?: ${NAME_WORD})?`;
const INTRO_NAME = new RegExp(String.raw`(?<=${INTRO_FRAME}\s+)${CONTEXT_NAME}`, "gu");
const GREETING_NAME = new RegExp(String.raw`(?<=\b${GREETING_FRAME}\s+)${CONTEXT_NAME}`, "gu");
const CLOSING_NAME = new RegExp(
  String.raw`(?<=\b${CLOSING_FRAME}(?:,[ \t]*(?:\r?\n[ \t]*){0,2}|[ \t]*(?:\r?\n[ \t]*){1,2}))${CONTEXT_NAME}`,
  "gu",
);
/** Words that look like the start of a name in these frames but are not one. */
const CONTEXT_STOP = new Set(
  (
    "kunde kundin kunden mitarbeiter mitarbeiterin kollege kollegin kolleginnen kollegen team zusammen alle leute freunde community " +
    "herr herrn frau fr hr dr prof damen herren grüße grüßen gruß gruss support kundenservice service teil neu " +
    "entwickler entwicklerin lehrer lehrerin student studentin berater beraterin teamleiter teamleiterin leiter leiterin " +
    "customer user member teacher engineer manager developer student everyone all there sir madam team support " +
    "mr mrs ms mx regards welt world"
  ).split(" "),
);
const NUMBER = String.raw`(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{1,2})?`;
const AMOUNT_TRAILING = new RegExp(String.raw`(?<![\d.,])${NUMBER}\s?(?:€|(?:EUR|Euro)\b)`, "gu");
const AMOUNT_LEADING = new RegExp(String.raw`(?:€|\bEUR\b)\s?${NUMBER}(?![\d])`, "gu");

type Found = RegExpMatchArray & { readonly index: number };

function* matches(pattern: RegExp, text: string): Generator<Found> {
  for (const match of text.matchAll(pattern)) if (match[0].length > 0 && match.index !== undefined) yield match as Found;
}

/**
 * How much of a framed run is the name: the first word must not be a false
 * friend, the second only joins when it is not a sentence opener. 0 = none.
 */
function contextNameLength(run: string): number {
  const [first = "", second] = run.split(" ");
  const lower = (word: string) => word.toLowerCase().replace(/\.$/, "");
  if (CONTEXT_STOP.has(lower(first)) || NOT_A_NAME_START.has(lower(first))) return 0;
  if (second === undefined || CONTEXT_STOP.has(lower(second)) || NOT_A_NAME_START.has(lower(second))) return first.length;
  return run.length;
}

function digitCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

/** Longest prefix of an IBAN-shaped match that passes mod-97, in source indices. */
function ibanPrefix(shape: string): number {
  const keep: number[] = [];
  for (let i = 0; i < shape.length; i += 1) if (shape[i] !== " ") keep.push(i);
  for (let length = Math.min(keep.length, 34); length >= 15; length -= 1) {
    const compact = keep
      .slice(0, length)
      .map((i) => shape[i])
      .join("");
    if (ibanMod97(compact)) return (keep[length - 1] as number) + 1;
  }
  return 0;
}

function collect(text: string): readonly Candidate[] {
  const found: Candidate[] = [];
  const ibanShapes: Array<readonly [number, number]> = [];

  for (const m of matches(EMAIL, text)) {
    found.push(candidate("email", m.index, m.index + m[0].length, "pattern"));
  }
  for (const m of matches(IBAN_SHAPE, text)) {
    ibanShapes.push([m.index, m.index + m[0].length]);
    const length = ibanPrefix(m[0]);
    if (length > 0) found.push(candidate("iban", m.index, m.index + length, "iban-mod97"));
  }
  const insideIbanShape = (start: number, end: number) =>
    ibanShapes.some(([from, to]) => start < to && end > from);
  for (const pattern of [PHONE_INTL, PHONE_LOCAL]) {
    for (const m of matches(pattern, text)) {
      const digits = digitCount(m[0]);
      const end = m.index + m[0].length;
      if (digits < 8 || digits > 15 || insideIbanShape(m.index, end)) continue;
      found.push(candidate("phone", m.index, end, "pattern"));
    }
  }
  for (const m of matches(REFERENCE, text)) {
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    const kind: HitKind = ORDER_CONTEXT.test(before) ? "order" : "ref";
    found.push(candidate(kind, m.index, m.index + m[0].length, "pattern"));
  }
  for (const m of matches(SECRET_PREFIX, text)) {
    found.push(candidate("secret", m.index, m.index + m[0].length, "prefix"));
  }
  for (const m of matches(SECRET_ASSIGNED, text)) {
    const value = m[1] as string;
    if (PLACEHOLDER.test(value)) continue;
    const start = m.index + m[0].length - value.length;
    found.push(candidate("secret", start, start + value.length, "prefix"));
  }
  for (const m of matches(SECRET_TOKEN, text)) {
    const token = m[0];
    if (/\d/.test(token) && /[A-Za-z]/.test(token) && entropy(token) >= 3.5 && !ibanMod97(token)) {
      found.push(candidate("secret", m.index, m.index + token.length, "entropy"));
    }
  }
  for (const pattern of [STREET_DE, STREET_EN, POSTCODE]) {
    for (const m of matches(pattern, text)) {
      found.push(candidate("address", m.index, m.index + m[0].length, "pattern"));
    }
  }
  for (const m of matches(SALUTATION_NAME, text)) {
    found.push(candidate("person", m.index, m.index + m[0].length, "salutation"));
  }
  for (const pattern of [INTRO_NAME, GREETING_NAME, CLOSING_NAME]) {
    for (const m of matches(pattern, text)) {
      const length = contextNameLength(m[0]);
      if (length > 0) found.push(candidate("person", m.index, m.index + length, "salutation"));
    }
  }
  for (const pattern of [AMOUNT_TRAILING, AMOUNT_LEADING]) {
    for (const m of matches(pattern, text)) {
      found.push(candidate("amount", m.index, m.index + m[0].length, "pattern"));
    }
  }
  return found;
}

/** Address parts that touch, separated only by a comma, are one address. */
function mergeAddresses(found: readonly Candidate[], text: string): readonly Candidate[] {
  const addresses = found.filter((c) => c.kind === "address").sort((a, b) => a.start - b.start);
  const merged: Candidate[] = [];
  for (const part of addresses) {
    const last = merged[merged.length - 1];
    if (last && part.start >= last.end && /^,\s*$/.test(text.slice(last.end, part.start))) {
      merged[merged.length - 1] = candidate("address", last.start, part.end, "pattern");
    } else if (!last || part.start >= last.end) {
      merged.push(part);
    }
  }
  return [...found.filter((c) => c.kind !== "address"), ...merged];
}

const rank = (kind: HitKind) => PRIORITY.indexOf(kind);

/** Keep the longer of two overlapping hits; on a tie the earlier kind in PRIORITY. */
export function resolveOverlaps<T extends Candidate>(all: readonly T[]): readonly T[] {
  const order = [...all]
    .filter((c) => c.end > c.start)
    .sort((a, b) => b.end - b.start - (a.end - a.start) || rank(a.kind) - rank(b.kind) || a.start - b.start);
  const accepted: T[] = [];
  for (const next of order) {
    if (!accepted.some((a) => next.start < a.end && next.end > a.start)) accepted.push(next);
  }
  return accepted.sort((a, b) => a.start - b.start);
}

export const toHit = (text: string, c: Candidate): Hit => ({
  id: `${c.kind}:${c.start}`,
  kind: c.kind,
  start: c.start,
  end: c.end,
  value: text.slice(c.start, c.end),
  check: c.check,
});

/** The detector's hits in source order, never overlapping. */
export function detect(text: string): readonly Hit[] {
  return resolveOverlaps(mergeAddresses(collect(text), text)).map((c) => toHit(text, c));
}

/**
 * Two capitalised words in a row that no hit covers: a name without a title or
 * a company, which the detector cannot know. The screen asks the visitor to
 * tap them; it never blacks them out on a guess.
 */
const WORD_PAIR = /(\p{Lu}\p{Ll}[\p{L}'-]+)\s\p{Lu}\p{Ll}[\p{L}'-]+/gu;

/** Words that start a sentence or a phrase ("Mein Name", "Das Team", "Dear Sir"): never the start of a name. */
const NOT_A_NAME_START = new Set(
  (
    "mein meine meinen meiner meinem dein deine ihr ihre ihren ihrem unser unsere der die das den dem des ein eine einen einem " +
    "wir sie ich du er es hallo guten gute liebe lieber sehr bitte danke vielen mit von bei und aber oder wenn dann dies diese dieser " +
    "hier heute jetzt zur zum im am an auf in für nach vor seit " +
    "my your our the a an this that these those hello hi dear please thanks thank we you i it he she they if when then here today now " +
    "and but or for with from at on in to by after before since"
  ).split(" "),
);

export interface NameSpan {
  readonly start: number;
  readonly end: number;
}

/** Where those uncovered capitalised word pairs sit, so the card can underline them. */
export function skippedNameSpans(text: string, hits: readonly NameSpan[]): readonly NameSpan[] {
  const spans: NameSpan[] = [];
  for (const m of matches(WORD_PAIR, text)) {
    const end = m.index + m[0].length;
    if (NOT_A_NAME_START.has((m[1] as string).toLowerCase())) continue;
    if (!hits.some((h) => m.index < h.end && end > h.start)) spans.push({ start: m.index, end });
  }
  return spans;
}

export const skippedNames = (text: string, hits: readonly NameSpan[]): number => skippedNameSpans(text, hits).length;

/**
 * A company name the detector cannot clear: up to three capitalised words in
 * front of a legal form ("Weber Metallbau GmbH"), or the legal form alone.
 * Company names are not personal data by themselves, but they say who the
 * text is about, so the screen flags them next to the Rest-Scan.
 */
const COMPANY_FORM_SPAN =
  /(?:(?:\p{Lu}[\p{L}&'-]*\s+){0,3})(?:GmbH|mbH|AG|UG|KG|OHG|SE|GbR|Ltd|Inc|LLC|e\.\s?K\.)(?![\p{L}])/gu;

export function companySpans(text: string, hits: readonly NameSpan[]): readonly NameSpan[] {
  const spans: NameSpan[] = [];
  for (const m of matches(COMPANY_FORM_SPAN, text)) {
    const end = m.index + m[0].length;
    if (!hits.some((h) => m.index < h.end && end > h.start)) spans.push({ start: m.index, end });
  }
  return spans;
}
