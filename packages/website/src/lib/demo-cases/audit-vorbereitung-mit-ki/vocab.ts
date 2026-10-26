/**
 * The kit's own words for statuses, tests, document types and test results,
 * read from the kit texts instead of retyped: the files the visitor takes
 * home (the evidence index, the gap list) speak exactly like the kit's key
 * and instructions. Pure.
 */

import { docType, type DocType } from "./classify";
import type { Status, TestId } from "./evidence";
import { kitText } from "./kit";

export type VocabLocale = "de" | "en";

const KEY: Readonly<Record<VocabLocale, string>> = { en: "ANSWERS.md", de: "de/LOESUNGEN.md" };
const RULES: Readonly<Record<VocabLocale, string>> = { en: "project-instructions.md", de: "de/projektanweisungen.md" };

export interface KitVocab {
  readonly status: Readonly<Record<Status, string>>;
  readonly test: Readonly<Record<TestId, string>>;
  /** The type words the key uses; a type the kit has no file of (a contract) is missing and shows as its id. */
  readonly type: Readonly<Partial<Record<DocType, string>>>;
  readonly pass: string;
  readonly fail: string;
}

function statusWords(locale: VocabLocale): Readonly<Record<Status, string>> {
  const match = /^\S+: \d+ (\S+), \d+ (\S+), \d+ (\S+)\.$/m.exec(kitText(KEY[locale]).slice(kitText(KEY[locale]).search(/^## (Step|Schritt) 2/m)));
  if (!match) throw new Error(`kit: no count line in ${KEY[locale]}`);
  return { covered: match[1] as string, weak: match[2] as string, gap: match[3] as string };
}

/** Rules 4 to 7 of the project instructions open with the four test words, in the order quote, period, scope, approval. */
function testWords(locale: VocabLocale): Readonly<Record<TestId, string>> {
  const words = new Map([...kitText(RULES[locale]).matchAll(/^(\d+)\. (\p{Lu}+):/gmu)].map((match) => [Number(match[1]), match[2] as string]));
  const at = (rule: number) => {
    const word = words.get(rule);
    if (!word) throw new Error(`kit: rule ${rule} has no test word`);
    return word;
  };
  return { quote: at(4), date: at(5), scope: at(6), approval: at(7) };
}

/** Step 1 of the key: file | type | date | by | period | approval. */
function indexTable(locale: VocabLocale): readonly (readonly string[])[] {
  const text = kitText(KEY[locale]);
  const start = text.search(/^## (Step|Schritt) 1/m);
  const rows: string[][] = [];
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (line.startsWith("## ")) break;
    if (/^\| \S+\.(csv|md|txt) \|/.test(line)) rows.push(line.slice(2, -2).split(" | ").map((cell) => cell.trim()));
  }
  return rows;
}

function typeWords(locale: VocabLocale): Readonly<Partial<Record<DocType, string>>> {
  const words: Partial<Record<DocType, string>> = {};
  for (const cells of indexTable(locale)) words[docType(cells[0] as string)] ??= cells[1] as string;
  return words;
}

function resultWords(locale: VocabLocale): { readonly pass: string; readonly fail: string } {
  const cells = indexTable(locale).flatMap((row) => row.slice(4, 6));
  const counts = new Map<string, number>();
  for (const cell of cells) counts.set(cell, (counts.get(cell) ?? 0) + 1);
  const [pass, fail] = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word]) => word);
  if (!pass || !fail) throw new Error(`kit: no pass and fail words in ${KEY[locale]}`);
  return { pass, fail };
}

const cache = new Map<VocabLocale, KitVocab>();

export function kitVocab(locale: VocabLocale): KitVocab {
  const hit = cache.get(locale);
  if (hit) return hit;
  const vocab: KitVocab = { status: statusWords(locale), test: testWords(locale), type: typeWords(locale), ...resultWords(locale) };
  cache.set(locale, vocab);
  return vocab;
}
