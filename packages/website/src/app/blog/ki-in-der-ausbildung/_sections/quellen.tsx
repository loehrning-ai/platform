import { keepLegalRefsTogether } from "../../_components/legal-text";
import {
  SectionHead,
  copyFor,
  domainOf,
  otherLanguageNote,
  type SectionProps,
} from "./shared";

/**
 * Source rows carry the page's status date, not an access date: the sources
 * were confirmed through search results on that date, not opened. A row whose
 * page exists only in the other language says so (hreflang plus a word).
 */
export function Quellen({ locale, context }: SectionProps) {
  const copy = copyFor(locale).quellen;

  return (
    <section className="wz-section" id="quellen" aria-labelledby="quellen-h">
      <SectionHead id="quellen" index="07" locale={locale} />
      <div className="wz-body">
        <ul className="wz-rows" role="list">
          {copy.rows.map((row) => {
            const languageNote = otherLanguageNote(locale, row.language);
            return (
              <li key={row.href}>
                <a className="wz-row" href={row.href} hrefLang={row.language}>
                  <span className="wz-row__title">{row.title}</span>
                  <span className="wz-row__desc">
                    {keepLegalRefsTogether(row.covers)}
                    <span className="wz-row__source">
                      <span className="wz-mono">{domainOf(row.href)}</span>
                      {languageNote ? ` · ${languageNote}` : null}
                      {" · "}
                      {copy.statusLabel}: {keepLegalRefsTogether(context.stand)}
                    </span>
                  </span>
                  <span className="wz-row__meta">{row.type}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
