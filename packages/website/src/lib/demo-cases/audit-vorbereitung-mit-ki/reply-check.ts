/**
 * The last step of the kit, read from the kit itself: the managing
 * director's draft reply (draft-reply.md), the answer key's check of each of
 * its four sentences (the "Draft reply check" table in ANSWERS.md, the
 * "Prüfung des Antwortentwurfs" table in LOESUNGEN.md) and the sample reply
 * that goes out instead. The six mistakes the answer key lists under "Where
 * Claude goes wrong" and the rules of the project instructions come from the
 * same files. Pure; nothing here is typed by hand.
 */

import { draftClaims } from "./case";
import { kitText } from "./kit";

export type KitLocale = "de" | "en";

const KEY: Readonly<Record<KitLocale, string>> = { de: "de/LOESUNGEN.md", en: "ANSWERS.md" };
const INSTRUCTIONS: Readonly<Record<KitLocale, string>> = { de: "de/projektanweisungen.md", en: "project-instructions.md" };
const CHECK_HEAD: Readonly<Record<KitLocale, string>> = { de: "Prüfung des Antwortentwurfs:", en: "Draft reply check:" };
const REPLY_HEAD: Readonly<Record<KitLocale, string>> = { de: "Beispielantwort", en: "Sample reply" };
const MISTAKES_HEAD: Readonly<Record<KitLocale, string>> = { de: "Wo Claude bei diesem Ordner danebenliegt", en: "Where Claude goes wrong on this folder" };

export interface DraftCheck {
  /** 1 to 4, as numbered in the draft. */
  readonly n: number;
  /** The sentence as the draft writes it (draft-reply.md, English in both kits). */
  readonly claim: string;
  /** The answer key's verdict word: "STREICHEN" or "DELETE". */
  readonly verdict: string;
  /** The answer key's evidence for the verdict, verbatim. */
  readonly evidence: string;
}

/** The draft's four sentences, each with the answer key's verdict and evidence. */
export function draftChecks(locale: KitLocale): readonly DraftCheck[] {
  const key = kitText(KEY[locale]);
  const start = key.indexOf(CHECK_HEAD[locale]);
  if (start < 0) throw new Error(`kit: ${KEY[locale]} has no draft reply check`);
  const lines = key.slice(start).split("\n").slice(1);
  const end = lines.findIndex((line) => !line.startsWith("|"));
  const rows = (end < 0 ? lines : lines.slice(0, end)).map((line) => line.split("|").map((cell) => cell.trim())).filter((cells) => /^\d+$/.test(cells[1] ?? ""));
  const claims = draftClaims();
  return rows.map((cells) => {
    const n = Number(cells[1]);
    return { n, claim: claims[n - 1] ?? cells[2] ?? "", verdict: cells[3] ?? "", evidence: cells[4] ?? "" };
  });
}

/** The sample reply at the end of the answer key, the honest version (English in both kits). */
export function sampleReplyOf(locale: KitLocale): string {
  const key = kitText(KEY[locale]);
  const start = key.indexOf(REPLY_HEAD[locale]);
  const match = /```\n([\s\S]*?)```/.exec(key.slice(Math.max(0, start)));
  if (start < 0 || !match) throw new Error(`kit: ${KEY[locale]} has no sample reply`);
  return (match[1] ?? "").trimEnd();
}

export interface KitMistake {
  /** The line as the answer key writes it, without its rule. */
  readonly line: string;
  readonly rule: number;
}

/** Every mistake the answer key lists for this folder, with the rule that stops it. */
export function kitMistakes(locale: KitLocale): readonly KitMistake[] {
  const key = kitText(KEY[locale]);
  const start = key.indexOf(MISTAKES_HEAD[locale]);
  if (start < 0) throw new Error(`kit: ${KEY[locale]} lists no mistakes`);
  const block = key.slice(start).split("\n\n")[0] ?? "";
  return [...block.matchAll(/^- (.+): (?:Regel|rule) (\d+)\.$/gm)].map((match) => ({ line: match[1] as string, rule: Number(match[2]) }));
}

/** The deck's four mistakes (slide 13), in the deck's order: the draft taken as approved, the policy taken as practice, the count, the invented control number. */
export const HUNT_RULES = [7, 4, 11, 12] as const;

/** The mistakes of the deck's slide 13, each from the answer key. */
export function huntMistakes(locale: KitLocale): readonly KitMistake[] {
  const all = kitMistakes(locale);
  return HUNT_RULES.map((rule) => {
    const mistake = all.find((entry) => entry.rule === rule);
    if (!mistake) throw new Error(`kit: no mistake for rule ${rule}`);
    return mistake;
  });
}

/** Rule n of the project instructions, verbatim, without its number. */
export function kitRule(locale: KitLocale, n: number): string {
  const line = kitText(INSTRUCTIONS[locale])
    .split("\n")
    .find((entry) => entry.startsWith(`${n}. `));
  if (!line) throw new Error(`kit: ${INSTRUCTIONS[locale]} has no rule ${n}`);
  return line.slice(`${n}. `.length);
}
