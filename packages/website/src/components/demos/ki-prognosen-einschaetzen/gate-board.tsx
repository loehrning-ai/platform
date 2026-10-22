import type { Morning, Triple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtHours, fmtList, fmtPct, fmtSignedPct, fmtTriple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import { gateChecks, isRed, modelDelivery, type CheckResult } from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import type { Locale } from "@/lib/i18n/locale";
import { CheckGlyph, CrossGlyph } from "./glyphs";
import { InlineList } from "./inline-list";

interface Props {
  readonly morning: Morning;
  readonly standing: Triple;
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly statusId: string;
}

function valueOf(check: CheckResult, locale: Locale): string {
  switch (check.key) {
    case "fresh":
      return fmtHours(check.value, locale);
    case "wape":
      return fmtPct(check.value, locale, 1);
    case "bias":
      return fmtSignedPct(check.value, locale, 1);
    case "coverage":
      return fmtPct(check.value, locale, 0);
  }
}

/**
 * The gate as the machine computed it: four tiles with value, limit and a
 * pass or fail mark (shape, hatch and word, never colour alone), the bias
 * per store, what the 50 would be today, the morning's note and the status.
 */
export function GateBoard({ morning, standing, copy, locale, statusId }: Props) {
  const m = copy.mornings;
  const checks = gateChecks(morning);
  const red = isRed(morning);
  const failed = checks.filter((check) => !check.pass).map((check) => m.tiles[check.key].name);

  return (
    <div className="fr-board">
      <ul className="fr-tiles" aria-label={m.boardLabel}>
        {checks.map((check) => {
          const tile = m.tiles[check.key];
          return (
            <li key={check.key} className="fr-tile" data-fail={check.pass ? undefined : ""}>
              <span className="fr-tile-name">
                {tile.name}
                <span className="sr-only">:</span>
              </span>
              <span className="fr-tile-sub">
                {tile.sub}
                <span className="sr-only">,</span>
              </span>
              <span className="fr-tile-value">
                {valueOf(check, locale)}
                <span className="sr-only">,</span>
              </span>
              <span className="fr-tile-limit">
                {m.limitPrefix} {tile.limit}
                <span className="sr-only">,</span>
              </span>
              <span className="fr-tile-mark">
                {check.pass ? <CheckGlyph /> : <CrossGlyph />}
                {check.pass ? m.pass : m.fail}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="fr-storebias">
        <strong>{m.storeBias}:</strong>{" "}
        <InlineList
          items={morning.storeBias.map((bias, i) => `${copy.stores.names[i]} ${fmtSignedPct(bias, locale, 1)}`)}
        />
      </p>

      <dl className="fr-plans">
        <div className="fr-plans-head">
          <dt>{m.todayUnits}</dt>
          <dd className="fr-small">{copy.stores.order}</dd>
        </div>
        <div>
          <dt>{m.modelPlan}</dt>
          <dd className="fr-num">{fmtTriple(modelDelivery(morning), locale)}</dd>
        </div>
        <div>
          <dt>{m.standingPlan}</dt>
          <dd className="fr-num">{fmtTriple(standing, locale)}</dd>
        </div>
      </dl>

      {morning.event ? (
        <p className="fr-event">
          <strong>{m.eventLabel}</strong> {m.events[morning.event]}
        </p>
      ) : null}

      <p id={statusId} className="fr-status" data-red={red ? "" : undefined}>
        {red ? <CrossGlyph /> : <CheckGlyph />}
        <span>{red ? m.statusRed(fmtList(failed, locale)) : m.statusGreen}</span>
      </p>
    </div>
  );
}
