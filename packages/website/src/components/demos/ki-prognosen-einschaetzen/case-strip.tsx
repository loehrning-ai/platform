import { ASK_OVER_CAP, SUPPLY_CAP, TOTAL_ASK, TOTAL_MEDIAN } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtInt } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import type { Locale } from "@/lib/i18n/locale";

interface Props {
  readonly copy: ForecastCopy;
  readonly locale: Locale;
}

/**
 * The case in three numbers, on one scale: asked (outline), estimated
 * (hatched) and delivered (solid). Static and server-rendered, so the demo
 * stands alone in self-study.
 */
export function CaseStrip({ copy, locale }: Props) {
  const c = copy.caseStrip;
  const rows = [
    { key: "asked", value: TOTAL_ASK, word: c.asked, note: c.askedNote },
    { key: "estimated", value: TOTAL_MEDIAN, word: c.estimated, note: c.estimatedNote },
    { key: "delivered", value: SUPPLY_CAP, word: c.delivered, note: c.deliveredNote },
  ] as const;
  return (
    <section className="fr-case" aria-labelledby="fr-case-heading">
      <h2 id="fr-case-heading" className="fr-case-heading">
        {c.heading}
      </h2>
      <figure className="fr-case-figure">
        <ul className="fr-case-rows">
          {rows.map((row) => (
            <li key={row.key} className="fr-case-row" data-kind={row.key}>
              <p className="fr-case-number">
                <strong>{fmtInt(row.value, locale)}</strong> {row.word}
              </p>
              <span className="fr-case-bar" aria-hidden="true">
                <span style={{ width: `${(row.value / TOTAL_ASK) * 100}%` }} />
              </span>
              <p className="fr-case-note">{row.note}</p>
            </li>
          ))}
        </ul>
        <figcaption className="fr-case-gap">{c.gap(fmtInt(ASK_OVER_CAP, locale))}</figcaption>
      </figure>
    </section>
  );
}
