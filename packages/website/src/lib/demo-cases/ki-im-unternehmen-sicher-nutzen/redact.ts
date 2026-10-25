import { detect, resolveOverlaps, toHit } from "./detect";
import type { Hit, HitKind, KeyEntry, KindLabels, Placeholder, Redaction } from "./types";

/*
 * Redaction, pure and immutable: placeholders, the clean text, the rest scan,
 * the key table and the replay of an answer. Every function returns a new
 * value; nothing here touches the DOM, the clock or the network.
 */

/** Detector hits plus the visitor's own words, minus overlaps. */
export function allHits(text: string, extra: readonly Hit[]): readonly Hit[] {
  const own = detect(text);
  const mine = extra.filter((hit) => hit.end <= text.length && hit.start < hit.end);
  return resolveOverlaps([...own, ...mine]).map((c) => toHit(text, c));
}

export function buildRedaction(
  text: string,
  extra: readonly Hit[],
  kept: ReadonlySet<string>,
  labels: KindLabels,
): Redaction {
  const hits = allHits(text, extra);
  const active = hits.filter((hit) => !kept.has(hit.id));
  // Distinct values per kind, in order of first appearance.
  const distinct = new Map<HitKind, string[]>();
  for (const hit of active) {
    const list = distinct.get(hit.kind) ?? [];
    if (!list.includes(hit.value)) list.push(hit.value);
    distinct.set(hit.kind, list);
  }
  const placeholders: Placeholder[] = active.map((hit) => {
    const list = distinct.get(hit.kind) as string[];
    const base = labels[hit.kind];
    const label = list.length > 1 ? `${base}_${list.indexOf(hit.value) + 1}` : base;
    return { hitId: hit.id, label, token: `[${label}]` };
  });
  return { text, hits, kept, placeholders };
}

const tokenOf = (r: Redaction, hitId: string) => r.placeholders.find((p) => p.hitId === hitId)?.token;

/** The source with every hit that is not kept replaced by its placeholder. */
export function cleanText(r: Redaction): string {
  let out = "";
  let at = 0;
  for (const hit of r.hits) {
    const token = tokenOf(r, hit.id);
    if (!token) continue;
    out += r.text.slice(at, hit.start) + token;
    at = hit.end;
  }
  return out + r.text.slice(at);
}

/** How many patterns the detector still finds in the clean text (kept ones excluded). */
export function restScan(r: Redaction): number {
  const keptValues = new Set(r.hits.filter((hit) => r.kept.has(hit.id)).map((hit) => hit.value));
  return detect(cleanText(r)).filter((hit) => !keptValues.has(hit.value)).length;
}

/** One row per distinct original. */
export function keyTable(r: Redaction): readonly KeyEntry[] {
  const rows: KeyEntry[] = [];
  for (const hit of r.hits) {
    const placeholder = r.placeholders.find((p) => p.hitId === hit.id);
    if (!placeholder || rows.some((row) => row.token === placeholder.token)) continue;
    rows.push({ token: placeholder.token, label: placeholder.label, original: hit.value });
  }
  return rows;
}

/** Hits of kinds that count as the customer's: everything but a secret. */
export const isCustomerKind = (kind: HitKind) => kind !== "secret";

/* ---------------------------------------------------------------- words */

export interface Span {
  readonly start: number;
  readonly end: number;
}

const WORD = /[\p{L}\p{N}](?:[\p{L}\p{N}'’._@/+-]*[\p{L}\p{N}])?/gu;

/** Tappable words of a text piece, punctuation at the edges left out. */
export function splitWords(text: string, offset = 0): readonly Span[] {
  return [...text.matchAll(WORD)].map((m) => ({ start: offset + (m.index ?? 0), end: offset + (m.index ?? 0) + m[0].length }));
}

/** A word becomes a manual hit; a tap on a manual hit removes it; neighbours merge. */
export function toggleManual(text: string, manual: readonly Hit[], word: Span): readonly Hit[] {
  const covering = manual.find((hit) => word.start < hit.end && word.end > hit.start);
  if (covering) return manual.filter((hit) => hit !== covering);
  const make = (start: number, end: number): Hit => ({
    id: `manual:${start}`,
    kind: "manual",
    start,
    end,
    value: text.slice(start, end),
    check: "visitor",
  });
  let start = word.start;
  let end = word.end;
  const rest: Hit[] = [];
  for (const hit of manual) {
    if (hit.end <= start && /^\s*$/.test(text.slice(hit.end, start))) start = hit.start;
    else if (hit.start >= end && /^\s*$/.test(text.slice(end, hit.start))) end = hit.end;
    else rest.push(hit);
  }
  return [...rest, make(start, end)].sort((a, b) => a.start - b.start);
}

/* --------------------------------------------------------------- replay */

export interface ReplaySegment {
  readonly text: string;
  /** Set when this span is a restored original. */
  readonly token?: string;
}

export interface ReplayResult {
  readonly segments: readonly ReplaySegment[];
  readonly restored: number;
  readonly notFound: readonly string[];
  readonly unknown: readonly string[];
  readonly ambiguous: readonly string[];
}

const fold = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");

function parseLabel(raw: string): { readonly base: string; readonly n: string } {
  const m = /^(.*?)(?:[ _-]*(\d{1,2}))?$/u.exec(raw.trim());
  return { base: fold(m?.[1] ?? raw), n: m?.[2] ?? "" };
}

const BRACKETED = /[[({<«]\s*([^[\](){}<>«»\n]{2,24}?)\s*[\])}>»]|\b[A-ZÄÖÜ][A-ZÄÖÜ-]*_\d{1,2}\b/gu;
const UNKNOWN_SHAPE = /^\[[A-ZÄÖÜ_ -]{2,20}\d?\]$/u;

/**
 * Puts the originals back into an answer, tolerantly: any bracket style,
 * any case inside brackets, ä/ae folding, "_1", " 1" and "-1" alike. A bare
 * word is touched only as an exact "KUNDE_1"; the prose word "Kunde" never is.
 * What cannot be restored is reported, never swallowed.
 */
export function replay(answer: string, key: readonly KeyEntry[]): ReplayResult {
  const entries = key.map((entry) => ({ entry, ...parseLabel(entry.label.replace(/_(\d+)$/, " $1")) }));
  const used = new Set<string>();
  const unknown: string[] = [];
  const ambiguous: string[] = [];
  const segments: ReplaySegment[] = [];
  let restored = 0;
  let at = 0;
  const push = (segment: ReplaySegment) => {
    const last = segments[segments.length - 1];
    if (last && !last.token && !segment.token) segments[segments.length - 1] = { text: last.text + segment.text };
    else if (segment.text) segments.push(segment);
  };
  for (const m of answer.matchAll(BRACKETED)) {
    const written = m[0];
    const { base, n } = parseLabel(m[1] ?? written);
    const hit = entries.find((e) => e.base === base && e.n === n);
    const replacement: KeyEntry | undefined = hit?.entry;
    if (!replacement && !n && entries.some((e) => e.base === base && e.n)) {
      if (!ambiguous.includes(written)) ambiguous.push(written);
      continue;
    }
    if (!replacement && UNKNOWN_SHAPE.test(written)) {
      if (!unknown.includes(written)) unknown.push(written);
      continue;
    }
    if (!replacement) continue;
    const index = m.index ?? 0;
    push({ text: answer.slice(at, index) });
    push({ text: replacement.original, token: replacement.token });
    used.add(replacement.token);
    restored += 1;
    at = index + written.length;
  }
  push({ text: answer.slice(at) });
  const notFound = key.map((entry) => entry.token).filter((token) => !used.has(token));
  return { segments, restored, notFound, unknown, ambiguous };
}

/** The restored answer as one string. */
export const joinSegments = (segments: readonly ReplaySegment[]) => segments.map((s) => s.text).join("");
