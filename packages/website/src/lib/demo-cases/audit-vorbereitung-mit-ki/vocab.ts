/**
 * The kit's own words for the four tests and the three statuses, read from the kit texts instead of
 * retyped: the demo, the files the visitor takes home and the skill speak the same words. Rules 4 to 7
 * of the project instructions open with the four test words, rule 8 names the three statuses.
 * Pure; kit.ts is the only input.
 */

import type { Status, TestId } from "./evidence";
import { kitText } from "./kit";

export type VocabLocale = "de" | "en";

const RULES: Readonly<Record<VocabLocale, string>> = { en: "project-instructions.md", de: "de/projektanweisungen.md" };

export interface KitVocab {
  readonly status: Readonly<Record<Status, string>>;
  readonly test: Readonly<Record<TestId, string>>;
}

/** Rules 4 to 7 open with the four test words, in the order quote, period, scope, approval. */
function testWords(locale: VocabLocale): Readonly<Record<TestId, string>> {
  const words = new Map([...kitText(RULES[locale]).matchAll(/^(\d+)\. (\p{Lu}+):/gmu)].map((match) => [Number(match[1]), match[2] as string]));
  const at = (rule: number) => {
    const word = words.get(rule);
    if (!word) throw new Error(`kit: rule ${rule} has no test word`);
    return word;
  };
  return { quote: at(4), date: at(5), scope: at(6), approval: at(7) };
}

/** Rule 8 names the statuses in the order covered, weak, gap, each followed by a colon. */
function statusWords(locale: VocabLocale): Readonly<Record<Status, string>> {
  const rule = new RegExp("^8\\. .*$", "m").exec(kitText(RULES[locale]))?.[0] ?? "";
  const found = [...rule.matchAll(/(\p{Lu}[\p{Lu}]+): /gu)].map((match) => match[1] as string);
  const [covered, weak, gap] = found;
  if (!covered || !weak || !gap) throw new Error(`kit: rule 8 of ${RULES[locale]} does not name three statuses`);
  return { covered, weak, gap };
}

const cache = new Map<VocabLocale, KitVocab>();

export function kitVocab(locale: VocabLocale): KitVocab {
  const hit = cache.get(locale);
  if (hit) return hit;
  const vocab: KitVocab = { status: statusWords(locale), test: testWords(locale) };
  cache.set(locale, vocab);
  return vocab;
}
