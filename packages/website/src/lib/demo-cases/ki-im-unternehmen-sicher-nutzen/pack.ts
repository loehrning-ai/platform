import type { EmptySlot } from "./core";
import {
  BUCKET_NOTES,
  CARD_TEMPLATES,
  EMPTY_SLOT,
  FRIDAY_ROWS,
  LOGIC_WORDS,
  RULE_BUCKETS,
  UI,
  type CardTemplates,
  type LogicWords,
  type UiCopy,
} from "./copy";
import { localize, type Localized } from "./localize";
import { ACCOUNTS, DEVICE_WORD, FIX_OVERRIDES, RULE_LINES, SCENES, STORED_LINE } from "./scenes";
import type { DemoLocale } from "./types";

/*
 * Everything the client island shows, in one language. The server component
 * builds it and passes it down as a prop, so the island's script carries no
 * copy at all and the page's payload carries only its own language.
 */

export interface W05Text {
  readonly locale: DemoLocale;
  readonly ui: UiCopy;
  readonly words: LogicWords;
  readonly scenes: Localized<typeof SCENES>;
  readonly accounts: Localized<typeof ACCOUNTS>;
  readonly deviceWord: Localized<typeof DEVICE_WORD>;
  readonly storedLine: string;
  readonly ruleLines: Localized<typeof RULE_LINES>;
  readonly fixOverrides: Localized<typeof FIX_OVERRIDES>;
  readonly fridayRows: Localized<typeof FRIDAY_ROWS>;
  readonly templates: CardTemplates;
  readonly emptySlot: EmptySlot;
  /** German pages also offer the vendor mail in English; null on English pages. */
  readonly mailEn: { readonly template: string; readonly empty: EmptySlot } | null;
  readonly ruleBuckets: Localized<typeof RULE_BUCKETS>;
  readonly bucketNotes: Localized<typeof BUCKET_NOTES>;
}

const cache = new Map<DemoLocale, W05Text>();

function build(locale: DemoLocale): W05Text {
  return {
    locale,
    ui: UI[locale],
    words: LOGIC_WORDS[locale],
    scenes: localize(SCENES, locale),
    accounts: localize(ACCOUNTS, locale),
    deviceWord: localize(DEVICE_WORD, locale),
    storedLine: STORED_LINE[locale],
    ruleLines: localize(RULE_LINES, locale),
    fixOverrides: localize(FIX_OVERRIDES, locale),
    fridayRows: localize(FRIDAY_ROWS, locale),
    templates: CARD_TEMPLATES[locale],
    emptySlot: EMPTY_SLOT[locale],
    mailEn: locale === "en" ? null : { template: CARD_TEMPLATES.en.mail, empty: EMPTY_SLOT.en },
    ruleBuckets: localize(RULE_BUCKETS, locale),
    bucketNotes: localize(BUCKET_NOTES, locale),
  };
}

/** The demo's words for one page; built once per language. */
export function textFor(locale: DemoLocale): W05Text {
  const known = cache.get(locale);
  if (known) return known;
  const text = build(locale);
  cache.set(locale, text);
  return text;
}
