import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { ENGLISH_TERMS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";

const TERMS = new RegExp(`(${ENGLISH_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

/** Compounds whose hyphen must not end a line ("E-" / "Mails"); copied text keeps the plain hyphen. */
const UNBREAKABLE = /(E-Mail[\p{L}-]*)/u;

function keepTogether(text: string, keyPrefix: string): ReactNode[] {
  return text.split(UNBREAKABLE).map((part, index) =>
    index % 2 === 1 ? (
      <span key={`${keyPrefix}-${index}`} className="dr3-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>
    ),
  );
}

function withLang(text: string, locale: Locale, keyPrefix: string): ReactNode[] {
  if (locale !== "de") return keepTogether(text, keyPrefix);
  return text.split(TERMS).map((part, index) =>
    index % 2 === 1 ? (
      <span key={`${keyPrefix}-${index}`} lang="en">
        {part}
      </span>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{keepTogether(part, `${keyPrefix}-${index}`)}</Fragment>
    ),
  );
}

/**
 * Copy text with `identifiers` in mono and, in German, the English terms of
 * the deck (Net New MRR, the four control names, permission denied) wrapped
 * in <span lang="en">.
 */
export function Rich({ text, locale }: { readonly text: string; readonly locale: Locale }) {
  const parts = text.split(/`([^`]+)`/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} lang="en">
            {part}
          </code>
        ) : (
          <Fragment key={index}>{withLang(part, locale, String(index))}</Fragment>
        ),
      )}
    </>
  );
}
