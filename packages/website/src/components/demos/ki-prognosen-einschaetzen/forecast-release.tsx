"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtTriple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import {
  detectPattern,
  INITIAL_STATE,
  planOf,
  reducer,
  standingDelivery,
  summarizeWeek,
  type DemoState,
  type Step,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import { MORNING_COUNT } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import { loadState, saveState } from "@/lib/demo-cases/ki-prognosen-einschaetzen/storage";
import type { Locale } from "@/lib/i18n/locale";
import { CheckGlyph } from "./glyphs";
import { MorningsStep } from "./mornings-step";
import { ResultStep } from "./result-step";
import { SplitStep } from "./split-step";
import { Takeaways } from "./takeaways";

interface Props {
  /** This locale's copy only, from forecast-release-de/-en.tsx. */
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly workshopHref: string;
  readonly caseHref: string;
}

const STEPS: readonly Step[] = ["split", "mornings", "result"];
const SECTION_IDS: Readonly<Record<Step, string>> = { split: "verteilen", mornings: "morgen", result: "ergebnis" };

/**
 * Demo 01 "1.050 Stück, sieben Morgen". One reducer holds the run. The three
 * steps page one at a time below the band; a finished step stays as a
 * read-only record, a coming one shows what it holds, and "Zum Mitnehmen"
 * is always rendered. The only way back is "Woche neu starten", offered on
 * every step after the first; a week picked up from this browser says so.
 */
export function ForecastRelease({ copy, locale, workshopHref, caseHref }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [focusStep, setFocusStep] = useState<Step | null>(null);
  const headings = {
    split: useRef<HTMLHeadingElement>(null),
    mornings: useRef<HTMLHeadingElement>(null),
    result: useRef<HTMLHeadingElement>(null),
  };
  const takeawaysHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef<Step>(state.step);

  // Resume in this browser, or open Part 2 directly from #morgen.
  useEffect(() => {
    const stored = loadState();
    let step: Step = stored?.step ?? "split";
    if (stored) dispatch({ type: "HYDRATE", state: stored });
    if (window.location.hash === "#morgen" && step === "split") {
      dispatch({ type: "ENTER_MORNINGS" });
      step = "mornings";
      setFocusStep("mornings");
    } else if (stored) {
      setResumed(true);
    }
    // A resumed step is not a step change: no focus jump on load.
    previousStep.current = step;
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  // A step change moves focus to that step's heading.
  useEffect(() => {
    if (!ready) return;
    if (previousStep.current !== state.step) {
      previousStep.current = state.step;
      setResumed(false);
      setFocusStep((current) => current ?? state.step);
    }
  }, [state.step, ready]);

  useEffect(() => {
    if (!focusStep) return;
    const heading = headings[focusStep].current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView?.({ block: "start", behavior: "auto" });
    setFocusStep(null);
    // headings are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusStep]);

  const plan = planOf(state);
  const current = STEPS.indexOf(state.step);
  const summary = state.step === "result" ? summarizeWeek(state.answers, plan) : null;
  const s = copy.split;

  const [undoState, setUndoState] = useState<DemoState | null>(null);
  const restart = () => {
    setUndoState(state);
    dispatch({ type: "RESTART" });
    previousStep.current = "split";
    setResumed(false);
    setFocusStep("split");
  };

  const undo = () => {
    if (!undoState) return;
    dispatch({ type: "HYDRATE", state: undoState });
    previousStep.current = undoState.step;
    setUndoState(null);
    setFocusStep(undoState.step);
  };

  const position =
    state.step === "mornings"
      ? copy.thread.resumedMorning(state.day + 1, MORNING_COUNT)
      : copy.thread.steps[STEPS.indexOf(state.step)];

  const sectionHead = (step: Step, index: number) => (
    <h2 ref={headings[step]} tabIndex={-1} id={`fr-h-${step}`} className="fr-h2">
      {index < 2 ? (
        <span className="fr-h2-n" aria-hidden="true">
          {index + 1}
        </span>
      ) : null}
      {copy.thread.steps[index]}
    </h2>
  );

  return (
    <div className="fr" data-step={state.step} data-ready={ready ? "" : undefined}>
      <ol className="fr-thread" aria-label={copy.thread.label}>
        {STEPS.map((step, i) => (
          <li
            key={step}
            aria-current={i === current ? "step" : undefined}
            data-done={i < current ? "" : undefined}
          >
            {i < current || i < 2 ? (
              <span className="fr-thread-n" aria-hidden="true">
                {i < current ? <CheckGlyph /> : i + 1}
              </span>
            ) : null}
            {copy.thread.steps[i]}
            <span className="sr-only">
              {i === current ? `, ${copy.thread.current}` : i < current ? `, ${copy.thread.done}` : ""}
            </span>
          </li>
        ))}
      </ol>

      {resumed ? (
        <p className="fr-resumed">
          <span className="fr-resumed-label">{`${copy.thread.resumed}: ${position}`}</span>
          <button type="button" className="fr-btn fr-chip" onClick={restart}>
            {copy.thread.resumedRestart}
          </button>
        </p>
      ) : null}

      {undoState && state.step === "split" ? (
        <p className="fr-resumed fr-undo" role="status">
          <span className="fr-resumed-label">{copy.thread.restarted}</span>
          <button type="button" className="fr-btn fr-chip" onClick={undo}>
            {copy.thread.undo}
          </button>
        </p>
      ) : null}

      <section id={SECTION_IDS.split} aria-labelledby="fr-h-split" className="fr-step" data-state={state.step === "split" ? "active" : "done"}>
        {sectionHead("split", 0)}
        {state.step === "split" ? (
          <SplitStep alloc={state.alloc} checked={state.checked} copy={copy} locale={locale} dispatch={dispatch} />
        ) : (
          <p className="fr-record">
            {s.record(fmtTriple(plan, locale), s.patternNames[detectPattern(plan)])}
            <span className="fr-record-order">{copy.stores.order}</span>
          </p>
        )}
      </section>

      <section id={SECTION_IDS.mornings} aria-labelledby="fr-h-mornings" className="fr-step" data-state={state.step === "mornings" ? "active" : state.step === "result" ? "done" : "coming"}>
        {sectionHead("mornings", 1)}
        {state.step === "split" ? (
          <div className="fr-preview">
            <p>{copy.mornings.preview}</p>
            <p className="fr-preview-entry">
              <button type="button" className="fr-btn" onClick={() => dispatch({ type: "ENTER_MORNINGS" })}>
                {copy.mornings.directEntry}
              </button>
              <span className="fr-small">{copy.mornings.directEntryNote}</span>
            </p>
          </div>
        ) : state.step === "mornings" ? (
          <>
            <p className="fr-lead">
              {copy.mornings.intro(fmtTriple(plan, locale), fmtTriple(standingDelivery(plan), locale))}
            </p>
            {state.planSource === "fallback" ? <p className="fr-small">{copy.mornings.fallback}</p> : null}
            <MorningsStep state={state} plan={plan} copy={copy} locale={locale} dispatch={dispatch} />
            <p className="fr-restart">
              <button type="button" className="fr-btn" onClick={restart}>
                {copy.result.restart}
              </button>
            </p>
          </>
        ) : (
          <p className="fr-record">
            {copy.mornings.ownerRecord(state.owner?.key === "custom" ? state.owner.custom : state.owner ? copy.mornings.ownerOptions[state.owner.key] : "")}{" "}
            {summary ? copy.result.record(summary.right) : ""}
          </p>
        )}
      </section>

      <section id={SECTION_IDS.result} aria-labelledby="fr-h-result" className="fr-step" data-state={state.step === "result" ? "active" : "coming"}>
        {sectionHead("result", 2)}
        {state.step === "result" ? (
          <ResultStep
            state={state}
            plan={plan}
            copy={copy}
            locale={locale}
            workshopHref={workshopHref}
            caseHref={caseHref}
            onRestart={restart}
            onTakeaways={() => {
              takeawaysHeading.current?.focus({ preventScroll: true });
              takeawaysHeading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
            }}
          />
        ) : (
          <p className="fr-preview">{copy.result.preview}</p>
        )}
      </section>

      <section id="mitnehmen" aria-labelledby="fr-h-takeaways" className="fr-step fr-step-takeaways">
        <Takeaways owner={state.owner} ownerLocked={state.ownerLocked} copy={copy} headingRef={takeawaysHeading} />
      </section>
    </div>
  );
}
