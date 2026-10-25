/**
 * Version chains: "Leitlinie_v3_final_FINAL.docx", "Leitlinie_v3_final.docx"
 * and "Leitlinie Kopie (2).docx" are one document in three versions. Only an
 * approved version can count, and a file name never says which one that is.
 * Pure.
 */

import { foldName } from "./classify";

const NOISE =
  /\b(v\d+(?:\s\d+)*|version\s?\d+|entwurf|draft|wip|final|kopie|copy|alt|old|neu|new|signed|unterschrieben|freigegeben|gez)\b|\(\d+\)|\b\d{4}\s\d{2}(?:\s\d{2})?\b|\b\d{8}\b|\b\d{1,2}\s\d{1,2}\s\d{4}\b|\b\d{4}\b|\bq[1-4]\b/g;

/** The name without extension, version, draft, copy and date words: what stays the same across versions. */
export function stemOf(name: string): string {
  const base = name.normalize("NFC").replace(/\.[^.]+$/, "").replace(/\(\d+\)/g, " ");
  return foldName(base).replace(NOISE, " ").replace(/\s+/g, " ").trim();
}

export interface Chain<T> {
  readonly stem: string;
  readonly files: readonly T[];
}

/** Groups of two or more files with the same stem, in input order. */
export function versionChains<T extends { readonly name: string }>(files: readonly T[]): readonly Chain<T>[] {
  const groups = new Map<string, T[]>();
  for (const file of files) {
    const stem = stemOf(file.name);
    if (!stem) continue;
    groups.set(stem, [...(groups.get(stem) ?? []), file]);
  }
  return [...groups.entries()].filter(([, members]) => members.length > 1).map(([stem, members]) => ({ stem, files: members }));
}

/** A draft or working-copy word in the name. Fails FREIGABE when the text was not read. */
export const NAME_DRAFT = /(entwurf|draft|wip|\bv\d+\b|final|kopie|copy|\(\d+\)|\balt\b|\bold\b)/i;
/** An approval word in the name. Never passes: the document has to say it. */
export const NAME_APPROVAL = /(signed|unterschrieben|freigegeben|\bgez\b)/i;
