/**
 * The take-home files the demo builds in the browser: the skill zip with the
 * visitor's cards in references/steckbriefe.md next to the unchanged
 * SKILL.md, the project instructions with the cards appended, and the lines
 * each beat writes into the kit's northwind-metrics Skill.
 */
import { zipStore } from "@/lib/zip/store";
import { cardToMarkdown, type CardWords, type OwnCard } from "./steckbrief";
import type { Basis, Counter } from "./definitions";

export const SKILL_NAME = "kennzahlen-steckbrief";
export const REFERENCES_PATH = `${SKILL_NAME}/references/steckbriefe.md`;

/** references/steckbriefe.md: a title and one block per card. */
export function renderReferences(cards: readonly OwnCard[], words: CardWords, title: string): string {
  return [`# ${title}`, "", ...cards.map((card) => `${cardToMarkdown(card, words)}\n`)].join("\n");
}

/** The kit's project instructions with the visitor's cards appended under the closing heading line. */
export function renderProjectInstructions(base: string, cards: readonly OwnCard[], words: CardWords): string {
  if (cards.length === 0) return base;
  const head = base.endsWith("\n") ? base : `${base}\n`;
  return `${head}\n${cards.map((card) => cardToMarkdown(card, words)).join("\n\n")}\n`;
}

/** The skill zip: SKILL.md byte for byte, plus the cards when there are any. */
export function buildSkillZip(skillText: string, references: string | null): Uint8Array {
  return zipStore([
    { path: `${SKILL_NAME}/SKILL.md`, data: skillText },
    ...(references ? [{ path: REFERENCES_PATH, data: references }] : []),
  ]);
}

/** The northwind-metrics wording of each choice, exactly as in the kit's metric-cards.md. */
export interface KitCardWords {
  readonly defectsHeading: string;
  readonly demandHeading: string;
  readonly releaseHeading: string;
  readonly numeratorLabel: string;
  readonly periodLabel: string;
  readonly denominatorLine: string;
  readonly counters: Readonly<Record<Counter, string>>;
  readonly bases: Readonly<Record<Basis, string>>;
  readonly releases: Readonly<Record<Counter, string>>;
}

export type KitStrip = "counter" | "period" | "all";

/** The lines a beat writes into .claude/skills/northwind-metrics/SKILL.md. */
export function renderKitCards(choice: { readonly counter: Counter; readonly basis: Basis }, words: KitCardWords, strip: KitStrip): string {
  const defects = [`### ${words.defectsHeading}`, `- ${words.numeratorLabel}: ${words.counters[choice.counter]}`, words.denominatorLine];
  const demand = [`### ${words.demandHeading}`, `- ${words.periodLabel}: ${words.bases[choice.basis]}`];
  const release = [`### ${words.releaseHeading}`, `- ${words.releases[choice.counter]}`];
  if (strip === "counter") return defects.join("\n");
  if (strip === "period") return demand.join("\n");
  return [...defects, "", ...demand, "", ...release].join("\n");
}

export interface SkillHeader {
  readonly name: string;
  readonly description: string;
}

/** Reads the frontmatter the way claude.ai does: name and description on single `key: value` lines. */
export function readSkillHeader(text: string): SkillHeader | null {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) return null;
  const fields = new Map<string, string>();
  for (const line of (match[1] as string).split("\n")) {
    const at = line.indexOf(": ");
    if (at < 0) return null;
    fields.set(line.slice(0, at), line.slice(at + 2));
  }
  const name = fields.get("name");
  const description = fields.get("description");
  return name && description ? { name, description } : null;
}
