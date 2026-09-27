import type { Locale } from "@/lib/i18n/locale";
import type { QuestionSheet } from "@/lib/vorlagen/question-sheet";
import {
  POST_COPY,
  type PageLanguage,
  type PostCopy,
  type SectionId,
} from "../post-copy";
import type { RichContext } from "./rich";

/** Everything a section needs: the locale, its copy and the loaded sheet. */
export interface SectionProps {
  readonly locale: Locale;
  readonly sheet: QuestionSheet;
  readonly context: RichContext;
}

export function copyFor(locale: Locale): PostCopy {
  return POST_COPY[locale];
}

/** Section head: 2px ink rule, two-digit index, H2. */
export function SectionHead({
  id,
  index,
  locale,
}: {
  id: Exclude<SectionId, "hero">;
  index: string;
  locale: Locale;
}) {
  return (
    <header className="wz-head">
      <span className="wz-head__index" aria-hidden="true">
        {index}
      </span>
      <h2 className="wz-head__title" id={`${id}-h`}>
        {POST_COPY[locale].headings[id]}
      </h2>
    </header>
  );
}

/**
 * "in German" on the English page for a German-only link, "auf Englisch" on
 * the German page for an English-only one; nothing when the languages match.
 */
export function otherLanguageNote(
  locale: Locale,
  language: PageLanguage | undefined,
): string | null {
  if (!language || language === locale) return null;
  return POST_COPY[locale].otherLanguage[language] ?? null;
}

/** "www.gesetze-im-internet.de" -> "gesetze-im-internet.de". */
export function domainOf(href: string): string {
  return new URL(href).hostname.replace(/^www\./, "");
}
