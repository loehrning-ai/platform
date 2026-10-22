import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";

interface Props {
  readonly copy: ForecastCopy;
  readonly caseHref: string;
  readonly hrefLang?: string;
}

/** Where every figure comes from: the workshop's launch case, or invented here. */
export function Sources({ copy, caseHref, hrefLang }: Props) {
  const s = copy.sources;
  return (
    <section id="quellen" aria-labelledby="fr-h-sources" className="fr-step fr-sources">
      <h2 id="fr-h-sources" className="fr-h2">
        {s.heading}
      </h2>
      <div className="fr-sources-grid">
        <div>
          <h3 className="fr-h3">{s.fromCase}</h3>
          <ul className="fr-list">
            {s.fromCaseItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <a href={caseHref} hrefLang={hrefLang} className="fr-link">
              {s.toCase}
            </a>
          </p>
        </div>
        <div>
          <h3 className="fr-h3">{s.invented}</h3>
          <ul className="fr-list">
            {s.inventedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
