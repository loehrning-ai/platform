/**
 * Parser for question-sheet templates under content/vorlagen/.
 *
 * A question sheet is one CC BY 4.0 Markdown file per locale. The file is the
 * single source: the download route serves its bytes unchanged, and pages
 * render the structure this parser returns. The grammar is strict on purpose.
 * A malformed edit throws at build and test time instead of rendering a
 * question without its legal basis.
 *
 * Pure: no fs, no server-only, so unit tests and scripts can call it.
 */

import matter from "gray-matter";

export type SheetLocale = "de" | "en";

export interface SheetSource {
  readonly title: string;
  readonly url: string;
}

export interface SheetMeta {
  readonly title: string;
  readonly locale: SheetLocale;
  readonly version: number;
  readonly owner: string;
  /** ISO YYYY-MM-DD. Quoted in YAML so gray-matter keeps it a string. */
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly reviewCadence: string;
  readonly riskClass: string;
  readonly license: "CC BY 4.0";
  readonly attribution: string;
  readonly hostPath: string;
  readonly sources: readonly SheetSource[];
}

export interface SheetQuestion {
  /** 1-based, continuous across groups. */
  readonly number: number;
  readonly text: string;
  readonly legalBasis: string;
  readonly answer: string;
  /** Context that is settled law or a plain fact. */
  readonly note?: string;
  /** A legal point that is not settled. Rendered with the dashed "open" mark. */
  readonly open?: string;
}

export interface SheetGroup {
  /** "A", "B", ... consecutive. */
  readonly letter: string;
  readonly title: string;
  readonly questions: readonly SheetQuestion[];
}

export interface QuestionSheet {
  readonly meta: SheetMeta;
  readonly intro: readonly string[];
  /** The status paragraph without its bold label. */
  readonly status: string;
  readonly usage: { readonly steps: readonly string[]; readonly after: readonly string[] };
  readonly groups: readonly SheetGroup[];
  readonly limits: readonly string[];
  readonly questionCount: number;
}

export const SHEET_LABELS = {
  de: {
    status: "**Letzte redaktionelle Prüfung:**",
    usage: "So setzt ihr die Liste ein",
    limits: "Grenzen dieser Liste",
    sources: "Quellen",
    legalBasis: "Rechtsgrundlage:",
    answer: "Die Antwort sollte enthalten:",
    note: "Hinweis:",
    open: "Offen:",
  },
  en: {
    status: "**Last editorial review:**",
    usage: "How to use this list",
    limits: "What this list does not cover",
    sources: "Sources",
    legalBasis: "Legal basis:",
    answer: "The answer should contain:",
    note: "Note:",
    open: "Open:",
  },
} as const satisfies Record<SheetLocale, Record<string, string>>;

export class SheetFormatError extends Error {
  constructor(message: string) {
    super(`question sheet: ${message}`);
    this.name = "SheetFormatError";
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GROUP_HEADING = /^## ([A-Z])\. (.+)$/;
const QUESTION_HEADING = /^### (\d+)\. (.+\?)$/;
const ORDERED_ITEM = /^(\d+)\. (.+)$/;
const SOURCE_ITEM = /^- (.+): (https:\/\/\S+)$/;

const MONTHS: Record<SheetLocale, readonly string[]> = {
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** "2026-10-12" -> "12. Oktober 2026" (de) or "12 October 2026" (en). */
export function formatSheetDate(iso: string, locale: SheetLocale): string {
  if (!ISO_DATE.test(iso)) throw new SheetFormatError(`not an ISO date: ${iso}`);
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const name = MONTHS[locale][month - 1];
  if (!name || day < 1 || day > 31) throw new SheetFormatError(`not a real date: ${iso}`);
  return locale === "de" ? `${day}. ${name} ${year}` : `${day} ${name} ${year}`;
}

function requireString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new SheetFormatError(`frontmatter "${key}" must be a non-empty string (quote dates)`);
  }
  return value;
}

function parseMeta(data: Record<string, unknown>, expected: SheetLocale): SheetMeta {
  const locale = requireString(data, "locale");
  if (locale !== expected) throw new SheetFormatError(`locale is "${locale}", expected "${expected}"`);
  const lastReviewed = requireString(data, "lastReviewed");
  const nextReview = requireString(data, "nextReview");
  for (const [key, value] of [["lastReviewed", lastReviewed], ["nextReview", nextReview]] as const) {
    if (!ISO_DATE.test(value)) throw new SheetFormatError(`${key} must be YYYY-MM-DD`);
  }
  if (nextReview <= lastReviewed) throw new SheetFormatError("nextReview must be after lastReviewed");
  if (data.license !== "CC BY 4.0") throw new SheetFormatError('license must be "CC BY 4.0"');
  if (typeof data.version !== "number") throw new SheetFormatError("version must be a number");
  const rawSources = data.sources;
  if (!Array.isArray(rawSources) || rawSources.length === 0) {
    throw new SheetFormatError("sources must list at least one primary source");
  }
  const sources = rawSources.map((entry, index) => {
    const source = entry as Record<string, unknown>;
    if (typeof source.title !== "string" || typeof source.url !== "string" || !source.url.startsWith("https://")) {
      throw new SheetFormatError(`sources[${index}] needs a title and an https url`);
    }
    return { title: source.title, url: source.url };
  });
  return {
    title: requireString(data, "title"),
    locale,
    version: data.version,
    owner: requireString(data, "owner"),
    lastReviewed,
    nextReview,
    reviewCadence: requireString(data, "reviewCadence"),
    riskClass: requireString(data, "riskClass"),
    license: "CC BY 4.0",
    attribution: requireString(data, "attribution"),
    hostPath: requireString(data, "hostPath"),
    sources,
  };
}

/** Splits Markdown into blank-line separated blocks; list items stay one block. */
function blocks(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block !== "");
}

function takeLabelled(block: string, label: string): string | null {
  return block.startsWith(`${label} `) ? block.slice(label.length + 1).trim() : null;
}

export function parseQuestionSheet(raw: string, locale: SheetLocale): QuestionSheet {
  const labels = SHEET_LABELS[locale];
  const { data, content } = matter(raw);
  const meta = parseMeta(data, locale);
  const all = blocks(content);

  const h1 = all.shift();
  if (h1 !== `# ${meta.title}`) throw new SheetFormatError("the H1 must repeat the frontmatter title");

  const intro: string[] = [];
  let status: string | null = null;
  while (all.length > 0 && !all[0]!.startsWith("## ")) {
    const block = all.shift()!;
    if (block.startsWith(labels.status)) {
      status = block.slice(labels.status.length).trim();
      const expectedDate = formatSheetDate(meta.lastReviewed, locale);
      if (!status.startsWith(`${expectedDate}.`)) {
        throw new SheetFormatError(`status line must start with "${expectedDate}." to match lastReviewed`);
      }
    } else if (status === null) {
      intro.push(block);
    } else {
      throw new SheetFormatError("nothing may follow the status line before the first section");
    }
  }
  if (status === null || intro.length === 0) throw new SheetFormatError("intro and status line are required");

  if (all.shift() !== `## ${labels.usage}`) throw new SheetFormatError(`expected "## ${labels.usage}"`);
  const steps: string[] = [];
  const after: string[] = [];
  while (all.length > 0 && !all[0]!.startsWith("## ")) {
    const block = all.shift()!;
    const lines = block.split("\n");
    if (lines.every((line) => ORDERED_ITEM.test(line))) {
      lines.forEach((line) => {
        const [, n, text] = line.match(ORDERED_ITEM)!;
        if (Number(n) !== steps.length + 1) throw new SheetFormatError(`usage step ${n} is out of order`);
        steps.push(text!);
      });
    } else {
      after.push(block);
    }
  }
  if (steps.length === 0) throw new SheetFormatError("usage needs numbered steps");

  const groups: SheetGroup[] = [];
  let questionNumber = 0;
  while (all.length > 0 && GROUP_HEADING.test(all[0]!)) {
    const [, letter, title] = all.shift()!.match(GROUP_HEADING)!;
    const expectedLetter = String.fromCharCode(65 + groups.length);
    if (letter !== expectedLetter) throw new SheetFormatError(`group ${letter} should be ${expectedLetter}`);
    const questions: SheetQuestion[] = [];
    while (all.length > 0 && QUESTION_HEADING.test(all[0]!)) {
      const [, n, text] = all.shift()!.match(QUESTION_HEADING)!;
      questionNumber += 1;
      if (Number(n) !== questionNumber) throw new SheetFormatError(`question ${n} should be ${questionNumber}`);
      const fields: { legalBasis?: string; answer?: string; note?: string; open?: string } = {};
      while (all.length > 0 && !all[0]!.startsWith("#")) {
        const block = all.shift()!;
        const legalBasis = takeLabelled(block, labels.legalBasis);
        const answer = takeLabelled(block, labels.answer);
        const note = takeLabelled(block, labels.note);
        const open = takeLabelled(block, labels.open);
        const key = legalBasis !== null ? "legalBasis" : answer !== null ? "answer" : note !== null ? "note" : open !== null ? "open" : null;
        if (key === null) throw new SheetFormatError(`question ${n}: unlabelled block "${block.slice(0, 40)}"`);
        if (fields[key] !== undefined) throw new SheetFormatError(`question ${n}: "${key}" appears twice`);
        fields[key] = (legalBasis ?? answer ?? note ?? open)!;
      }
      if (!fields.legalBasis || !fields.answer) {
        throw new SheetFormatError(`question ${n}: legal basis and answer are both required`);
      }
      questions.push({
        number: questionNumber,
        text: text!,
        legalBasis: fields.legalBasis,
        answer: fields.answer,
        ...(fields.note ? { note: fields.note } : {}),
        ...(fields.open ? { open: fields.open } : {}),
      });
    }
    if (questions.length === 0) throw new SheetFormatError(`group ${letter} has no questions`);
    groups.push({ letter: letter!, title: title!, questions });
  }
  if (groups.length === 0) throw new SheetFormatError("at least one group is required");

  if (all.shift() !== `## ${labels.limits}`) throw new SheetFormatError(`expected "## ${labels.limits}"`);
  const limits: string[] = [];
  while (all.length > 0 && !all[0]!.startsWith("## ")) limits.push(all.shift()!);
  if (limits.length === 0) throw new SheetFormatError("limits section is empty");

  if (all.shift() !== `## ${labels.sources}`) throw new SheetFormatError(`expected "## ${labels.sources}"`);
  const listed = (all.shift() ?? "").split("\n").map((line) => {
    const match = line.match(SOURCE_ITEM);
    if (!match) throw new SheetFormatError(`source line "${line}" must read "- Title: https://..."`);
    return { title: match[1]!, url: match[2]! };
  });
  if (all.length > 0) throw new SheetFormatError("nothing may follow the sources list");
  if (JSON.stringify(listed) !== JSON.stringify(meta.sources)) {
    throw new SheetFormatError("body sources must equal frontmatter sources, in order");
  }

  return { meta, intro, status, usage: { steps, after }, groups, limits, questionCount: questionNumber };
}
