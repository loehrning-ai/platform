"use client";

import Link from "next/link";
import { MORNINGS, type Triple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtDays, fmtInt, fmtTriple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import { detectPattern, summarizeWeek, type DemoState } from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import type { Locale } from "@/lib/i18n/locale";
import { OutcomeGlyph } from "./glyphs";
import { gradesOf, slotsOf } from "./mornings-step";
import { WeekStrip } from "./week-strip";

interface Props {
  readonly state: DemoState;
  readonly plan: Triple;
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly workshopHref: string;
  readonly caseHref: string;
  readonly onRestart: () => void;
  readonly onTakeaways: () => void;
}

/** The week as a record, the opening split restated, and the way on. */
export function ResultStep({ state, plan, copy, locale, workshopHref, caseHref, onRestart, onTakeaways }: Props) {
  const r = copy.result;
  const s = copy.split;
  const grades = gradesOf(state, plan);
  const summary = summarizeWeek(state.answers, plan);
  const held = r.holdMornings(summary.holdDays);
  const opening = (() => {
    if (state.planSource === "fallback") return r.openingFallback(held);
    if (state.planSource === "median") {
      return state.opening
        ? r.openingMedian(s.patternNames[detectPattern(state.opening)], fmtTriple(state.opening, locale), held)
        : r.openingMedianOnly(held);
    }
    return r.openingOwn(s.patternNames[detectPattern(plan)], fmtTriple(plan, locale), held);
  })();
  const outcomes = ["right", "missed", "needless", "wrongStep"] as const;

  return (
    <div className="fr-result">
      <WeekStrip slots={slotsOf(grades)} today={null} copy={copy} />
      <ul className="fr-week-legend" aria-hidden="true">
        {outcomes.map((outcome) => (
          <li key={outcome}>
            <OutcomeGlyph outcome={outcome} />
            {r.legend[outcome]}
          </li>
        ))}
      </ul>

      <div className="fr-result-grid">
        <div>
          <p className="fr-score">{r.score(summary.right)}</p>
          {summary.missed.length > 0 || summary.needless.length > 0 || summary.wrongStep.length > 0 ? (
            <ul className="fr-misses">
              {summary.missed.length > 0 ? <li>{r.missed(fmtDays(summary.missed, locale), summary.missed.length)}</li> : null}
              {summary.needless.length > 0 ? <li>{r.needless(fmtDays(summary.needless, locale), summary.needless.length)}</li> : null}
              {summary.wrongStep.length > 0 ? <li>{r.wrongStep(fmtDays(summary.wrongStep, locale), summary.wrongStep.length)}</li> : null}
            </ul>
          ) : null}
          <p>
            {opening}
            {summary.deviation
              ? ` ${r.deviation(copy.stores.atStart[summary.deviation.store] ?? "", fmtInt(summary.deviation.got, locale), fmtInt(summary.deviation.median, locale))}`
              : ""}
          </p>
          <p className="fr-room">{r.roomQuestion}</p>
        </div>

        <div>
          <h3 className="fr-h3">{r.lessonsHeading}</h3>
          <ol className="fr-lessons">
            {MORNINGS.map((morning, i) => {
              const grade = grades[i];
              return (
                <li key={morning.day} data-outcome={grade?.outcome}>
                  <span className="fr-lessons-mark" aria-hidden="true">
                    {grade ? <OutcomeGlyph outcome={grade.outcome} /> : null}
                  </span>
                  <span>
                    <span className="fr-lessons-day">
                      {copy.mornings.dayLabel(morning.day)}
                      {grade ? ` · ${copy.mornings.stamps[grade.stamp]}` : ""}
                    </span>
                    {copy.mornings.lessons[i]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="fr-actions">
        <a
          href="#mitnehmen"
          className="fr-btn fr-btn-primary"
          onClick={(event) => {
            event.preventDefault();
            onTakeaways();
          }}
        >
          {r.toTakeaways}
        </a>
        <button type="button" className="fr-btn" onClick={onRestart}>
          {r.restart}
        </button>
        <Link href={workshopHref} className="fr-btn">
          {r.toWorkshop}
        </Link>
        <a href={caseHref} className="fr-btn" hrefLang="en">
          {r.toCase}
        </a>
      </div>
    </div>
  );
}
