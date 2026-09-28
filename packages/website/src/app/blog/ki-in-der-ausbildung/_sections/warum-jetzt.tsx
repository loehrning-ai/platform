import { keepLegalRefsTogether } from "../../_components/legal-text";
import { claimDate, claimIso, claimRange, stationState } from "./dates";
import { Rich } from "./rich";
import { SectionHead, copyFor, type SectionProps } from "./shared";

export function WarumJetzt({ locale, sheet, context }: SectionProps) {
  const copy = copyFor(locale).warumJetzt;

  return (
    <section
      className="wz-section"
      id="warum-jetzt"
      aria-labelledby="warum-jetzt-h"
    >
      <SectionHead id="warum-jetzt" index="01" locale={locale} />
      <div className="wz-body wz-prose">
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            <Rich source={paragraph} context={context} />
          </p>
        ))}
      </div>
      <div className="wz-body">
        <ol className="wz-route" role="list" aria-label={copy.routeLabel}>
          {copy.stations.map((station) => {
            const [startId, endId = startId] = station.claims;
            const date =
              station.claims.length === 2
                ? claimRange(startId, endId, locale, { compact: false })
                : claimDate(startId, locale);
            const state = stationState(
              claimIso(startId),
              claimIso(endId),
              sheet.meta.lastReviewed,
            );
            return (
              <li
                className="wz-route__station"
                data-state={state}
                key={startId}
              >
                <span className="wz-route__mark" aria-hidden="true" />
                <span className="wz-route__date">
                  {keepLegalRefsTogether(date)}
                </span>
                <span className="wz-route__what">
                  <Rich source={station.what} context={context} />
                  <span className="sr-only"> ({copy.states[state]})</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="wz-caption">
          <Rich source={copy.legend} context={context} />
        </p>
      </div>
    </section>
  );
}
