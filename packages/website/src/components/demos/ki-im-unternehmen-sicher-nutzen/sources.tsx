import { COPY } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import { FACTS_AS_OF, formatFactDate, NOT_IN_FILES, RULE_LINES, W05_FACTS } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/facts";
import type { DemoLocale } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";

/** "Quellen und Grenzen": the rule and the facts behind the light, dated, server-rendered, always open. */
export function Sources({ locale }: { readonly locale: DemoLocale }) {
  const copy = COPY[locale].sources;
  return (
    <section id="quellen" aria-labelledby="w05-sources-title" className="w05-sources" data-sources="">
      <h2 id="w05-sources-title" className="w05-h">{copy.heading}</h2>
      <p className="w05-sources-intro">{copy.intro}</p>
      <h3 className="w05-h3">{copy.rules}</h3>
      <ul className="w05-source-list">
        {RULE_LINES.map((line) => (
          <li key={line.id} data-rule={line.id}>{line.text[locale]}</li>
        ))}
      </ul>
      <h3 className="w05-h3">{copy.facts}</h3>
      <ol className="w05-source-list">
        {W05_FACTS.map((fact) => (
          <li key={fact.id} data-fact={fact.id}>
            <span className="w05-fact-id">{copy.factWord} {fact.id}</span>
            <span>{locale === "de" ? fact.statementDe : fact.statementEn}</span>
            <span className="w05-fact-meta">
              {locale === "de" ? fact.sourceDe : fact.source} · {fact.dates.map((entry) => formatFactDate(entry, locale)).join(", ")}
            </span>
          </li>
        ))}
      </ol>
      <p className="w05-sources-intro">{NOT_IN_FILES[locale]}</p>
      <p className="w05-sources-asof">{FACTS_AS_OF[locale]}</p>
    </section>
  );
}
