"use client";

import type { Pack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { fill, fmtEur, type Lang, type StackModel } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";

/**
 * Under the lever: every line of one offer with its amount and the place in the document it comes from
 * (the stelle column of kostenzeilen.csv). A missing line says so instead of a number.
 */
export function Sources({ model, option, pack, lang }: { readonly model: StackModel; readonly option: string; readonly pack: Pack; readonly lang: Lang }) {
  const offer = model.options.find((candidate) => candidate.name === option) ?? model.headWinner;
  const hasSources = model.options.some((candidate) => Object.keys(candidate.src).length > 0);
  if (!hasSources) return null;
  return (
    <section className="av-sources" aria-labelledby="av-sources-head" data-av-sources={offer.name}>
      <h2 id="av-sources-head" className="av-sources-head">
        {fill(pack.sources.head, { option: offer.name })}
      </h2>
      <p className="av-sources-hint">
        {pack.sources.hint}
        {pack.sources.quoteNote ? ` ${pack.sources.quoteNote}` : ""}
      </p>
      <ul className="av-sources-list">
        {model.lines.map((line, index) => {
          const missing = offer.missing.includes(line);
          const value = offer.lines[line] ?? 0;
          return (
            <li key={line}>
              <span className="av-sources-line">
                <i className={`av-swatch ${index === 0 ? "av-seg-head" : value < 0 ? "av-seg-neg" : "av-seg-add"}`} />
                {pack.lineNames[line] ?? line}
              </span>
              <b className="av-sources-value">{missing ? pack.sources.missingCell : fmtEur(value, lang)}</b>
              <span className="av-sources-quote" lang="de">
                {offer.src[line] ?? pack.sources.none}
              </span>
            </li>
          );
        })}
        <li className="av-sources-total">
          <span className="av-sources-line">{pack.sources.total}</span>
          <b className="av-sources-value">{offer.missing.length > 0 ? pack.open : fmtEur(offer.total, lang)}</b>
          <span />
        </li>
      </ul>
    </section>
  );
}
