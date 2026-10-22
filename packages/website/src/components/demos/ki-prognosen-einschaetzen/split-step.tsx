"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ASKS, MEDIANS, PREORDERS, SUPPLY_CAP, type Triple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtInt, fmtPct } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import {
  assessAllocation,
  splitMessage,
  sumOf,
  type DemoAction,
  type Pattern,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import type { Locale } from "@/lib/i18n/locale";
import { MinusGlyph, PlusGlyph } from "./glyphs";
import { InlineList } from "./inline-list";
import { SplitChart } from "./split-chart";
import { useProgress } from "./use-progress";

interface Props {
  readonly alloc: Triple;
  readonly checked: boolean;
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly dispatch: (action: DemoAction) => void;
}

const PRESET_ORDER = ["median", "ask", "preorders", "equal", "case"] as const satisfies readonly Exclude<Pattern, "own">[];

/** The remaining counter, announced politely 400 ms after the last change. */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

export function SplitStep({ alloc, checked, copy, locale, dispatch }: Props) {
  const s = copy.split;
  const n = (value: number) => fmtInt(value, locale);
  const given = sumOf(alloc);
  const remaining = SUPPLY_CAP - given;
  const exact = remaining === 0;
  const { t, start } = useProgress(700);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const chartHeading = useRef<HTMLHeadingElement>(null);
  const [focusFeedback, setFocusFeedback] = useState(false);

  const counter = remaining > 0 ? s.remaining(n(remaining)) : remaining < 0 ? s.tooMany(n(-remaining)) : s.allSplit;
  const spoken = useDebounced(counter, 400);

  useEffect(() => {
    if (!focusFeedback) return;
    // The chart heading goes to the top (under the site header), so the pool,
    // the three rows and the feedback headline are on screen while the
    // segments travel. Focus follows without a second scroll.
    chartHeading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
    feedbackHeading.current?.focus({ preventScroll: true });
    setFocusFeedback(false);
  }, [focusFeedback]);

  const set = (store: number, value: number) => dispatch({ type: "SET_UNITS", store, value });

  const onKey = (store: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    const step = event.shiftKey ? 50 : 10;
    const delta =
      event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : event.key === "PageUp" ? 50 : event.key === "PageDown" ? -50 : 0;
    if (delta === 0) return;
    event.preventDefault();
    set(store, (alloc[store] ?? 0) + delta);
  };

  const assessment = assessAllocation(alloc);
  const showFeedback = checked && exact;

  return (
    <div className="fr-split">
      <div className="fr-split-main">
        <p className="fr-lead">{s.lead}</p>
        <dl className="fr-glossary">
          {s.glossary.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.text}</dd>
            </div>
          ))}
        </dl>

        <ul className="fr-stores">
          {alloc.map((units, i) => {
            const name = copy.stores.names[i] ?? "";
            const inputId = `fr-units-${i}`;
            const refId = `fr-ref-${i}`;
            return (
              <li key={name} className="fr-store">
                <label htmlFor={inputId} className="fr-store-name">
                  {name}
                  <span className="sr-only">{s.inputLabel(name).slice(name.length)}</span>
                </label>
                <p id={refId} className="fr-store-ref">
                  {s.reference(n(ASKS[i] ?? 0), n(PREORDERS[i] ?? 0), n(MEDIANS[i] ?? 0))}
                </p>
                <div className="fr-stepper">
                  <button
                    type="button"
                    className="fr-btn fr-btn-step"
                    aria-label={s.fewer(name)}
                    onClick={() => set(i, units - 10)}
                    disabled={units <= 0}
                  >
                    <MinusGlyph />
                  </button>
                  <input
                    id={inputId}
                    className="fr-input fr-input-units"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    aria-describedby={`${refId} fr-keys`}
                    value={String(units)}
                    onFocus={(event) => event.currentTarget.select()}
                    onKeyDown={onKey(i)}
                    onChange={(event) => {
                      const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 5);
                      set(i, digits === "" ? 0 : Number(digits));
                    }}
                  />
                  <button
                    type="button"
                    className="fr-btn fr-btn-step"
                    aria-label={s.more(name)}
                    onClick={() => set(i, units + 10)}
                    disabled={units >= SUPPLY_CAP}
                  >
                    <PlusGlyph />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p id="fr-keys" className="fr-small">
          {s.keys}
        </p>

        <div className="fr-counter-row">
          <p className="fr-counter" data-over={remaining < 0 ? "" : undefined} data-exact={exact ? "" : undefined} aria-hidden="true">
            {remaining < 0 ? <span className="fr-over-mark" /> : null}
            {counter}
          </p>
          <p className="sr-only" aria-live="polite">
            {spoken}
          </p>
          <button
            type="button"
            className="fr-btn fr-btn-primary"
            disabled={!exact}
            aria-describedby={exact ? undefined : "fr-check-hint"}
            onClick={() => {
              dispatch({ type: "CHECK" });
              start();
              setFocusFeedback(true);
            }}
          >
            {s.check}
          </button>
        </div>
        {!exact ? (
          <p id="fr-check-hint" className="fr-small">
            {s.checkHint}
          </p>
        ) : null}
      </div>

      <div className="fr-split-side">
        <h3 ref={chartHeading} className="fr-h3 fr-chart-heading">
          {s.chartHeading}
        </h3>
        <SplitChart alloc={alloc} placed={checked && exact} t={t} copy={copy} locale={locale} />

        {checked ? (
          <div className="fr-feedback">
            <h3 ref={feedbackHeading} tabIndex={-1} className="fr-h3" id="fr-feedback-heading">
              {s.feedbackHeading}
            </h3>
            {showFeedback ? (
              <>
                <p className="fr-headline">
                  {assessment.unsoldAtMedian === 0 ? s.headlineAll : s.headlineLeft(n(assessment.unsoldAtMedian))}
                </p>
                <p>
                  {assessment.unsoldAtMedian === 0
                    ? s.customersNone
                    : s.customersSome(n(assessment.customersWithout), n(130), n(assessment.unsoldAtMedian))}
                </p>
                <p>{s.message(splitMessage(alloc, assessment), locale)}</p>
                <p className="fr-headroom">
                  <strong>{s.headroomLabel}:</strong>{" "}
                  <InlineList
                    items={assessment.headroom.map(
                      (h, i) => `${copy.stores.names[i]} ${h > 0 ? fmtPct(h, locale) : s.headroomNone}`,
                    )}
                  />
                </p>
                <p className="fr-small">{s.headroomDefinition}</p>
              </>
            ) : (
              <p className="fr-headline">{s.stale}</p>
            )}
            <p className="fr-reference">{s.referenceLine}</p>

            <div className="fr-presets" role="group" aria-labelledby="fr-presets-label">
              <p id="fr-presets-label" className="fr-small fr-presets-label">
                {s.presetsLabel}
              </p>
              <div className="fr-chip-row">
                {PRESET_ORDER.map((pattern) => (
                  <button
                    key={pattern}
                    type="button"
                    className="fr-btn fr-chip"
                    aria-pressed={showFeedback && assessment.pattern === pattern}
                    onClick={() => {
                      dispatch({ type: "APPLY_PRESET", pattern });
                      start();
                    }}
                  >
                    {s.presets[pattern]}
                  </button>
                ))}
              </div>
            </div>

            <div className="fr-actions">
              <button
                type="button"
                className="fr-btn fr-btn-primary"
                disabled={!exact}
                onClick={() => dispatch({ type: "CONTINUE", with: "own" })}
              >
                {s.continueOwn}
              </button>
              <button type="button" className="fr-btn" onClick={() => dispatch({ type: "CONTINUE", with: "median" })}>
                {s.continueMedian}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
