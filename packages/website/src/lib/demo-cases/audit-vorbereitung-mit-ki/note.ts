/**
 * The new-paper note of the kit (templates/new-paper-note.md, German vorlagen/neues-papier.md) with the
 * three slots the demo can know filled in: the title, the day it is written and what is known, each fact
 * with the paper where it is written. Every other slot stays open, and the signature line stays empty:
 * the note becomes a paper only when a named person dates and signs it. Pure; the day comes from the
 * caller, never from a clock.
 */

export type NoteLocale = "de" | "en";

const SLOTS: Readonly<Record<NoteLocale, { readonly title: RegExp; readonly day: RegExp; readonly known: RegExp }>> = {
  en: { title: /^(Title: )\[[^\]]*\]$/m, day: /^(Written on: )\[[^\]]*\]$/m, known: /^(What is known today: )\[[^\]]*\]$/m },
  de: { title: /^(Titel: )\[[^\]]*\]$/m, day: /^(Geschrieben am: )\[[^\]]*\]$/m, known: /^(Was heute bekannt ist: )\[[^\]]*\]$/m },
};

export interface NoteValues {
  readonly title: string;
  readonly day: string;
  readonly known: string;
}

/** The template with the title, the day and the known facts written in; a slot the template lacks throws. */
export function fillNote(template: string, locale: NoteLocale, values: NoteValues): string {
  const slots = SLOTS[locale];
  let text = template;
  for (const key of ["title", "day", "known"] as const) {
    if (!slots[key].test(text)) throw new Error(`note: the ${locale} template has no ${key} slot`);
    text = text.replace(slots[key], (_all, label: string) => `${label}${values[key]}`);
  }
  return text;
}
