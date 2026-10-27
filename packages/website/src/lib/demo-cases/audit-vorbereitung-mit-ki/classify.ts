/**
 * Document types and the words that make a file a candidate for a request
 * item. The type decides which DATUM and FREIGABE rule applies and carries
 * "a policy is not a record". Keyword lists in German and English, exported
 * so the tests can read them. Pure.
 */

export type DocType = "POLICY" | "CONTRACT" | "REGISTER" | "RECORD" | "STATEMENT";

/** Matched against folded text (umlauts as ae, oe, ue, ss), so "Zugriffspruefung" and "Zugriffsprüfung" read the same. */
const TYPE_WORDS: readonly (readonly [DocType, RegExp])[] = [
  ["POLICY", /policy|richtlinie|leitlinie|rule|regel|anweisung|handbuch|konzept/i],
  ["CONTRACT", /contract|vertrag|agreement|vereinbarung|\bavv\b|\bdpa\b/i],
  ["STATEMENT", /notes?\b|notiz|vendor|page|printout|e[- ]?mail|chat|folie|slides?|praesentation|memo/i],
  ["REGISTER", /list|liste|register|verzeichnis|inventar|inventory|subprocessor|unterauftrag/i],
  ["RECORD", /review|pruefung|log|records?|nachweis|protokoll|report|bericht|export|test|schulung|training|audit|zugriff|access|admin/i],
];

/** The type from the file name, then from the first lines of the text. */
export function docType(name: string, text = ""): DocType {
  const stem = foldName(name.replace(/\.[^.]+$/, ""));
  for (const source of [stem, foldName(text.split("\n").slice(0, 3).join(" "))]) {
    const hit = TYPE_WORDS.find(([, words]) => words.test(source));
    if (hit) return hit[0];
  }
  return "STATEMENT";
}

/** Generic request items for the visitor's own folder, the kit's eight without Tannwald. */
export const GENERIC_ITEM_IDS = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"] as const;
export type ItemId = (typeof GENERIC_ITEM_IDS)[number];

export const ITEM_KEYWORDS: Readonly<Record<ItemId, readonly string[]>> = {
  R1: ["system", "inventar", "inventory", "verarbeitungsverzeichnis", "vvt", "asset", "anwendung"],
  R2: ["subprocessor", "unterauftrag", "dienstleister", "vendor", "lieferant", "avv", "dpa"],
  R3: ["ki", "ai", "claude", "chatgpt", "copilot", "gpt", "llm"],
  R4: ["access", "zugriff", "berechtigung", "admin", "konten", "accounts", "rezertifizierung"],
  R5: ["training", "schulung", "unterweisung", "awareness", "teilnahme"],
  R6: ["incident", "vorfall", "vorfälle", "datenpanne", "breach", "störung"],
  R7: ["backup", "sicherung", "restore", "wiederherstellung", "recovery", "notfall"],
  R8: ["policy", "richtlinie", "leitlinie", "isms", "sicherheit", "security", "infosec"],
};

/** Folds a name for matching: NFC, lower case, umlauts as ae/oe/ue/ss, separators as spaces. */
export function foldName(name: string): string {
  return name
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[_\-.()]+/g, " ");
}

const fold = (word: string) => foldName(word).trim();

/** How strongly a file name speaks for an item: the number of keywords it contains as words. */
export function keywordHits(item: ItemId, name: string): number {
  const words = ` ${foldName(name.replace(/\.[^.]+$/, ""))} `;
  return ITEM_KEYWORDS[item].filter((keyword) => words.includes(` ${fold(keyword)} `) || (fold(keyword).length >= 6 && words.includes(fold(keyword)))).length;
}
