import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { SKILL_DOCUMENT_FILENAME } from "@/app/skills/_lib/registry";
import { takeHomeFor } from "@/lib/demo-takehome";
import { publicFile } from "@/lib/demo-takehome.server";
import { readZipText } from "@/lib/zip/read";

/* Card labels come from each language's authored skill; the learning objective comes from
 * the first bold paragraph of its kit start guide. Recorded run files remain unchanged.
 */

export interface CardWords {
  readonly checks: readonly [string, string, string, string];
  readonly statuses: readonly [string, string, string];
}

const SLUG = "esg-berichte-mit-ki";
const skillPath = (name: string) => path.join(process.cwd(), "content", "skills", name, SKILL_DOCUMENT_FILENAME);

export function cardWordsFrom(text: string, label: "Deutsch" | "Englisch"): CardWords {
  const flat = text.replace(/\s+/g, " ");
  const match = new RegExp(`${label === "Englisch" ? "(?:Englisch|English)" : label}: ([^.]+?) (?:und|and) ([^.]+)\\.`).exec(flat);
  const checks = match?.[1]?.split(", ") ?? [];
  const statuses = match?.[2]?.split(", ") ?? [];
  if (checks.length !== 4 || statuses.length !== 3) throw new Error(`esg-nachweise skill: no ${label} card words`);
  return { checks: checks as unknown as CardWords["checks"], statuses: statuses as unknown as CardWords["statuses"] };
}

/** The first bold-labelled paragraph of a start file ("**Lernziel:** ..."), on one line. */
export function objectiveFrom(text: string): string {
  const match = /(?:^|\n)\*\*[^*\n]+:\*\*[ \t]+([\s\S]+?)(?:\n[ \t]*\n|\s*$)/.exec(text.replace(/\r\n?/g, "\n"));
  const objective = match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (!objective) throw new Error(`${SLUG}: the kit's start file states no learning objective`);
  return objective;
}

function startFile(locale: "de" | "en"): string {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no ${locale} kit`);
  const text = readZipText(new Uint8Array(readFileSync(publicFile(kit.href))), kit.installDoc);
  if (text === null) throw new Error(`${kit.href} has no ${kit.installDoc}`);
  return text;
}

const source = readFileSync(skillPath("esg-nachweise"), "utf8");
const englishSource = readFileSync(skillPath("esg-evidence"), "utf8");

export const CARD_WORDS = { de: cardWordsFrom(source, "Deutsch"), en: cardWordsFrom(englishSource, "Englisch") } as const;

export const OBJECTIVE = { de: objectiveFrom(startFile("de")), en: objectiveFrom(startFile("en")) } as const;
