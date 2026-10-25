"use client";

import { BIAS_MAX, LAMP_KEYS, PRUEF, TREFFER_MIN, type Checker, type Lamps } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { formatNumber, formatPercent, formatShortDay, fill, type DemoLocale } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";

/**
 * Beat 4: the 52-week strip of pruefregel.md (ink = runs without sign-off,
 * Mennige = a person decides) filled by the sweep, and the four lamps of the
 * selected week with their thresholds and values.
 */
export interface RuleCopy {
  readonly lamps: Readonly<Record<"daten" | "messlatte" | "bias" | "spanne", string>>;
  readonly lampValues: Readonly<Record<"daten" | "messlatte" | "bias" | "spanne", string>>;
  readonly lampState: Readonly<Record<"green" | "red" | "none", string>>;
  readonly weekHead: string;
  readonly free: string;
  readonly person: string;
  readonly noLamps: string;
}

export function lampValue(key: (typeof LAMP_KEYS)[number], lamps: Lamps, copy: RuleCopy, locale: DemoLocale): string {
  if (key === "messlatte") {
    return lamps.verhaeltnis === null ? copy.lampState.none : fill(copy.lampValues.messlatte, { ratio: formatNumber(lamps.verhaeltnis, locale, 2, 2) });
  }
  if (key === "bias") return fill(copy.lampValues.bias, { bias: formatPercent(lamps.bias_wert, locale, { sign: true }) });
  if (key === "spanne") return fill(copy.lampValues.spanne, { hits: lamps.treffer, of: PRUEF });
  return copy.lampValues.daten;
}

export function RuleView({
  check,
  locale,
  filled,
  selected,
  copy,
}: {
  readonly check: Checker;
  readonly locale: DemoLocale;
  /** How many strip weeks the sweep has filled. */
  readonly filled: number;
  /** Strip position of the selected week. */
  readonly selected: number;
  readonly copy: RuleCopy;
}) {
  const t = check.streifen[selected];
  const lamps = t === undefined ? null : check.lamps(t);
  const row = t === undefined ? undefined : check.rows[t];
  const thresholds = { min: TREFFER_MIN, of: PRUEF, max: formatPercent(BIAS_MAX, locale, { decimals: 0 }) };

  return (
    <div className="fl-rule">
      <div className="fl-lamps" data-fl-lamps="">
        <p className="fl-lamps-head">
          <span>{row ? fill(copy.weekHead, { date: formatShortDay(row.woche, locale) }) : ""}</span>
          <span className={lamps?.frei ? "fl-verdict is-free" : "fl-verdict is-person"} data-fl-verdict={lamps ? (lamps.frei ? "free" : "person") : "none"}>
            {lamps ? (lamps.frei ? copy.free : copy.person) : copy.noLamps}
          </span>
        </p>
        <ul className="fl-lamp-list">
          {LAMP_KEYS.map((key) => {
            const state = !lamps || lamps[key] === null ? "none" : lamps[key] ? "green" : "red";
            return (
              <li key={key} className="fl-lamp" data-lamp={key} data-state={state}>
                <span className={`fl-lamp-dot is-${state}`} aria-hidden="true" />
                <span className="fl-lamp-name">{fill(copy.lamps[key], thresholds)}</span>
                <span className="fl-lamp-value">
                  {lamps ? lampValue(key, lamps, copy, locale) : ""}
                  <span className="sr-only"> {copy.lampState[state]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="fl-strip" aria-hidden="true">
        {check.streifen.map((week, i) => {
          const l = check.lamps(week);
          const state = i >= filled ? "is-empty" : !l ? "is-none" : l.frei ? "is-free" : "is-person";
          return <span key={week} className={`fl-square ${state}${i === selected ? " is-selected" : ""}`} />;
        })}
      </div>
    </div>
  );
}
