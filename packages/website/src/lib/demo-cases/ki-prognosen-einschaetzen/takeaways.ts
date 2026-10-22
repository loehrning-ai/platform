/**
 * The "Zum Mitnehmen" texts as they are copied: the split rule, the morning
 * check with the participant's owner, and the five filled sentences.
 */
import { SENTENCE_BLANK_MAX } from "./data";
import type { ForecastCopy, SentencePart } from "./copy-types";
import { ownerAccepted, trimRole, type Owner } from "./logic";

/** The owner as it stands in the takeaways: the chosen role, else the default. */
export function ownerText(owner: Owner | null, copy: ForecastCopy): string {
  if (!owner || !ownerAccepted(owner) || owner.key === "plannerOnDuty") {
    return copy.takeaways.ownerDefault;
  }
  return trimRole(owner.custom);
}

/** Every blank of the five sentences, in reading order. */
export function sentenceBlanks(copy: ForecastCopy): readonly { readonly sentence: number; readonly label: string; readonly blank: string }[] {
  return copy.takeaways.sentences.flatMap((parts, sentence) =>
    parts.flatMap((part) => (typeof part === "string" ? [] : [{ sentence, label: part.label, blank: part.blank }])),
  );
}

export const BLANK_COUNT = 8;
/** Sentence 5's blank ("Bei einem Nein entscheidet ___"), prefilled with the owner. */
export const OWNER_BLANK = BLANK_COUNT - 1;

export function cleanBlank(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, SENTENCE_BLANK_MAX);
}

/** The eight blanks plus the owner text last written into sentence 5 for the visitor. */
export interface SentenceDraft {
  readonly blanks: readonly string[];
  readonly prefill: string | null;
}

/**
 * Writes the chosen owner into sentence 5 when the blank is empty or still
 * holds the previous prefill, so a restart with a new role never leaves the
 * old one behind. A blank the visitor edited is kept. Each role prefills once:
 * the same role again changes nothing, so a deliberately cleared blank stays.
 */
export function prefillOwner(draft: SentenceDraft, role: string): SentenceDraft {
  if (draft.prefill === role) return draft;
  const current = cleanBlank(draft.blanks[OWNER_BLANK] ?? "");
  const untouched = current === "" || (draft.prefill !== null && current === cleanBlank(draft.prefill));
  return {
    blanks: untouched ? draft.blanks.map((value, i) => (i === OWNER_BLANK ? role : value)) : draft.blanks,
    prefill: role,
  };
}

/** One sentence with its blanks filled; an empty blank stays "___". */
export function fillSentence(parts: readonly SentencePart[], values: readonly string[], blank: string): string {
  let index = 0;
  return parts
    .map((part) => {
      if (typeof part === "string") return part;
      const value = cleanBlank(values[index] ?? "");
      index += 1;
      return value.length > 0 ? value : blank;
    })
    .join("");
}

export interface Takeaways {
  readonly rule: string;
  readonly check: string;
  readonly sentences: string;
}

export function buildTakeaways({
  owner,
  blanks,
  copy: allCopy,
}: {
  readonly owner: Owner | null;
  /** The eight blank values in reading order. */
  readonly blanks: readonly string[];
  /** The copy of the current locale. */
  readonly copy: ForecastCopy;
}): Takeaways {
  const copy = allCopy.takeaways;
  let offset = 0;
  const lines = copy.sentences.map((parts, i) => {
    const count = parts.filter((part) => typeof part !== "string").length;
    const values = blanks.slice(offset, offset + count);
    offset += count;
    return `${i + 1}. ${fillSentence(parts, values, copy.blank)}`;
  });
  return {
    rule: copy.rule,
    check: copy.check(ownerText(owner, allCopy)),
    sentences: lines.join("\n"),
  };
}
