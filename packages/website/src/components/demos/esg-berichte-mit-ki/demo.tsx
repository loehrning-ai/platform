"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyse, ladder } from "@/lib/demo-cases/esg-berichte-mit-ki/analyse";
import { ELECTRICITY, HOLE, WATER, electricityWith } from "@/lib/demo-cases/esg-berichte-mit-ki/data";
import { formatNumber, formatSmart } from "@/lib/demo-cases/esg-berichte-mit-ki/numbers";
import { INTRO_MS, REVEAL_MS, introAt, sceneAt } from "@/lib/demo-cases/esg-berichte-mit-ki/scene";
import { buildTakeaways, fill, monthsText } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { DatasetId, DemoPack, Series } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import { localizeHref } from "@/lib/i18n/locale";
import { CoverageGauge } from "./coverage-gauge";
import { FormField } from "./form-field";
import { Ladder, LadderPending } from "./ladder";
import { MonthChart } from "./month-chart";
import { OwnData } from "./own-data";
import { RevealControl } from "./reveal-control";
import { Strip, StripLegend, stripLabel } from "./strip";
import { TakeawaysPanel } from "./takeaways-panel";
import { useReducedMotion, useTween } from "./use-tween";
import { THRESHOLD_MAX, THRESHOLD_MIN, useOwnSeries } from "./use-own-series";
import "./esg-demo.css";

const DATASETS: readonly DatasetId[] = ["electricity", "water", "own"];
const FIXED_THRESHOLD = 0.95;
const SLAM_MS = 150;

/** No unit typed: close the gap it leaves instead of printing a placeholder in a sentence. */
const tidy = (text: string) => text.replace(/ {2,}/g, " ").replace(/ +([.,;:])/g, "$1");

function niceMax(values: readonly number[]): number {
  const top = Math.max(1, ...values) * 1.15;
  const magnitude = 10 ** Math.floor(Math.log10(top));
  return Math.ceil(top / magnitude / 0.5) * 0.5 * magnitude;
}

/**
 * Elf von zwölf. One scene per series: the draft's annual figure, twelve
 * monthly bars with one slot the visitor fills, the evidence strip, the
 * bill that opens, and three things to take away. Every drawn quantity is a
 * pure function of three inputs: the intro clock, the bill's progress and the
 * guess (scene.ts). Runs in the browser only; nothing is sent or stored.
 */
export default function Demo({ pack }: { readonly pack: DemoPack }) {
  const locale = pack.locale;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ladderRef = useRef<HTMLElement>(null);
  const ladderTimer = useRef(0);
  const [seen, setSeen] = useState(false);
  const [dataset, setDataset] = useState<DatasetId>("electricity");
  const [guess, setGuess] = useState<number | null>(null);
  const [ascii, setAscii] = useState(false);
  const [announce, setAnnounce] = useState("");
  const reduced = useReducedMotion();
  const intro = useTween(1);
  const bill = useTween(0);
  const slam = useTween(0);
  const own = useOwnSeries(pack);
  const { set: setIntro, to: introTo, current: introNow } = intro;
  const { set: setBill, to: billTo, current: billNow } = bill;
  const { set: setSlam, to: slamTo } = slam;

  // The intro plays once, as soon as a good part of the stage is on screen (15 %, or 120 px of it): on
  // a desktop that is at mount, on a phone it is the first screen. Reduced motion: the end state.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setIntro(1);
      return;
    }
    setIntro(0);
    const observer = new IntersectionObserver(
      (entries) => {
        const ready = entries.some(
          (entry) => entry.isIntersecting && (entry.intersectionRatio >= 0.15 || entry.intersectionRect.height >= 120),
        );
        if (!ready) return;
        observer.disconnect();
        introTo(1, INTRO_MS);
      },
      { threshold: [0, 0.1, 0.15, 0.3, 0.6, 1] },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [reduced, setIntro, introTo]);

  const skipIntro = useCallback(() => {
    if (introNow.current < 1) setIntro(1);
  }, [introNow, setIntro]);

  const scene = sceneAt(bill.value, guess);
  const introFrame = introAt(intro.value);
  const billOpen = bill.value >= 0.75;

  const live = useMemo(
    () => electricityWith(guess, billOpen, pack.form.electricity),
    [guess, billOpen, pack.form.electricity],
  );
  const folder = useMemo<Series>(() => ({ ...ELECTRICITY, label: pack.form.electricity }), [pack.form.electricity]);
  const waterSeries = useMemo<Series>(() => ({ ...WATER, label: pack.form.water }), [pack.form.water]);
  const shown: Series = dataset === "electricity" ? live : dataset === "water" ? waterSeries : own.series;
  const analysis = useMemo(() => analyse(shown), [shown]);
  // The lines default to the folder as it was (the hole stays a hole, whatever was guessed or opened);
  // once the bill is open a switch offers the 12 of 12 variant as the second view.
  const proved = bill.value > 0.8;
  const [takeView, setTakeView] = useState<"after" | "before">("before");
  const takeState = proved ? takeView : "before";
  if (bill.value > 0 && !seen) setSeen(true);
  useEffect(() => () => window.clearTimeout(ladderTimer.current), []);
  const withBill = useMemo(() => electricityWith(null, true, pack.form.electricity), [pack.form.electricity]);
  // Own numbers: the series label (default "Meine Reihe") leads the line, a missing unit is a visible placeholder.
  // No label typed: the lines stay nameless ("diese Zahlen" in the mail) rather than calling the data "Meine Reihe".
  const ownNamed = useMemo<Series>(
    () => ({ ...own.series, label: own.series.label.trim(), unit: own.series.unit || pack.own.unitToken }),
    [own.series, pack.own.unitToken],
  );
  const takeawaySeries: Series =
    dataset === "electricity" ? (takeState === "after" ? withBill : folder) : dataset === "water" ? waterSeries : ownNamed;
  const takeawayAnalysis = useMemo(() => analyse(takeawaySeries), [takeawaySeries]);
  const threshold = dataset === "own" ? own.threshold / 100 : FIXED_THRESHOLD;

  const items = useMemo(
    () => buildTakeaways(takeawaySeries, takeawayAnalysis, { locale, texts: pack.texts, months: pack.months, ascii }),
    [takeawaySeries, takeawayAnalysis, locale, pack.texts, pack.months, ascii],
  );

  const guessed = guess !== null && guess > 0;
  // The stamp is struck in 150 ms when a guess exists, and lifted again when it is cleared.
  useEffect(() => {
    if (reduced) setSlam(guessed ? 1 : 0);
    else slamTo(guessed ? 1 : 0, SLAM_MS);
  }, [guessed, reduced, setSlam, slamTo]);
  const stripText = stripLabel(pack, analysis);
  const ownEmpty = dataset === "own" && !own.hasInput;
  const unitFlagged = dataset === "own" ? own.resolved.unitHints : [];
  const status = analysis.status === "OK" && unitFlagged.length > 0 ? "NEEDS_CHECK" : analysis.status;
  const ownUnit = own.series.unit;

  /** The payoff happens in the chart: bring the stage into view before the bill opens. */
  function bringStageIntoView() {
    const stage = stageRef.current;
    if (!stage || typeof stage.scrollIntoView !== "function") return;
    const box = stage.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight - 72) return;
    stage.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }
  /** The ladder is the lesson: once the bill has landed and the chart has had a moment, bring it up. */
  function bringLadderIntoView() {
    window.clearTimeout(ladderTimer.current);
    ladderTimer.current = window.setTimeout(
      () => {
        const ladderEl = ladderRef.current;
        if (!ladderEl || typeof ladderEl.scrollIntoView !== "function") return;
        if (ladderEl.getBoundingClientRect().top < window.innerHeight * 0.55) return;
        ladderEl.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      },
      reduced ? 0 : 900,
    );
  }
  const openedText = () => {
    setAnnounce(fill(pack.reveal.opened, { x: formatNumber(HOLE.truthTotal, locale, 1) }));
    bringLadderIntoView();
  };

  function toggleBill() {
    if (billNow.current >= 0.999) {
      if (reduced) {
        setBill(0);
        setAnnounce(pack.reveal.closed);
      } else billTo(0, REVEAL_MS, () => setAnnounce(pack.reveal.closed));
      return;
    }
    bringStageIntoView();
    if (reduced) {
      setBill(1);
      openedText();
    } else billTo(1, REVEAL_MS, openedText);
  }
  function settleBill() {
    if (billNow.current >= 0.999) openedText();
  }

  const isElectricity = dataset === "electricity";
  // Struck by the guess or the opening bill; lifted again once the bill proves the year.
  const strike = isElectricity ? Math.max(scene.stampStrike, slam.value) * (1 - scene.stampLift) : 0;
  const formProps = (() => {
    if (isElectricity) {
      return {
        label: pack.form.electricity,
        value: formatNumber(scene.total, locale, 1),
        unit: "MWh",
        stamp: pack.form.stamp,
        strike,
        note: billOpen ? pack.form.proven : guessed ? pack.form.estimated : pack.form.draft,
      };
    }
    if (dataset === "water") {
      return {
        label: pack.form.water,
        value: formatNumber(analysis.provenSum, locale, 0),
        unit: "m³",
        stamp: pack.form.stamp,
        strike: 0,
        note: fill(pack.water.line, { x: formatNumber(analysis.provenSum, locale, 0) }),
      };
    }
    return {
      label: own.series.label.trim() === "" ? pack.own.defaultLabel : own.series.label,
      prefix: pack.locale === "de" ? "mindestens" : "at least",
      value: formatSmart(analysis.provenSum, locale, own.series.digits),
      unit: own.series.unit,
      unitMissing: pack.own.unitMissing,
      stamp: undefined,
      strike: 0,
      action:
        own.flipLabel !== null ? (
          <button type="button" className="esg-chip esg-field__flip" aria-pressed={own.allFlipped} onClick={() => own.flipMany(own.flippable.map((entry) => entry.id), !own.allFlipped)}>
            {own.flipLabel}
          </button>
        ) : undefined,
      note:
        unitFlagged.length > 0
          ? fill(pack.own.unitWarn, { months: monthsText(unitFlagged, pack.months, pack.texts.and) })
          : analysis.provenMonths > 0 ? fill(pack.own.counted, { n: analysis.provenMonths }) : pack.own.resultNone,
    };
  })();

  // Own numbers: the axis fits the values that agree with each other; a doubtful one is cut at the top (month-chart).
  const fitting = shown.cells.filter((cell) => !unitFlagged.includes(cell.month)).map((cell) => cell.value ?? 0);
  const axisMax = isElectricity ? HOLE.axisMax : dataset === "water" ? 1000 : niceMax(fitting.some((value) => value > 0) ? fitting : shown.cells.map((cell) => cell.value ?? 0));
  const ladderRows = ladder(analyse(folder), HOLE.truthTotal, guessed ? guess : null);
  const ladderVisible = isElectricity && scene.ladder[0] !== undefined && scene.ladder[0] > 0;
  const offBy = guessed ? Math.abs(HOLE.truth - (guess as number)) : 0;
  const bridge = bill.value > 0;

  const formEl = (
    <FormField
      {...formProps}
      stampIn={isElectricity ? introFrame.stamp : 1}
      valueAria={fill(pack.form.totalAria, { label: formProps.label, x: formProps.value, unit: formProps.unit })}
      status={status}
      statusText={pack.statuses[status]}
    />
  );

  /* One reserved line under the bars (no layout shift): the instruction, the rule of the guess, or the verdict. */
  const verdictEl = isElectricity ? (
    <div className="esg-verdict" aria-live="polite">
      {scene.barHeight > 0 ? (
        <>
          <p className="esg-legend">
            {guessed && scene.ghost > 0 ? (
              <span className="esg-legend__item esg-legend__item--guess">
                {fill(pack.chart.legendGuess, { x: formatNumber(guess as number, locale, 1), unit: "MWh" })}
              </span>
            ) : null}
            <span className="esg-legend__item esg-legend__item--bill">
              {fill(pack.chart.legendBill, { x: formatNumber(HOLE.truth, locale, 1), unit: "MWh" })}
            </span>
          </p>
          {guessed && scene.ghost > 0.5 ? (
            <strong className="esg-sr">
              {offBy < 0.05 ? pack.chart.exact : fill(pack.chart.off, { x: formatNumber(offBy, locale, 1), unit: "MWh" })}
            </strong>
          ) : null}
        </>
      ) : (
        <p className="esg-verdict__text">{guessed ? pack.gauge.hint : pack.chart.prompt}</p>
      )}
    </div>
  ) : null;

  const chartEl = (
    <>
      <MonthChart
        pack={pack}
        cells={shown.cells}
        unit={shown.unit}
        digits={shown.digits}
        axisMax={axisMax}
        intro={introFrame}
        hole={
          isElectricity
            ? {
                month: HOLE.month,
                guess,
                locked: bridge,
                scene,
                onGuess: setGuess,
                onCommit: (value) =>
                  setAnnounce(
                    value > 0 ? fill(pack.chart.holeValue, { x: formatNumber(value, locale, 1), unit: "MWh" }) : pack.chart.holeNone,
                  ),
              }
            : undefined
        }
      />
      <div className="esg-months" aria-hidden="true">
        {pack.monthLetters.map((letter, index) => (
          <span key={`${letter}${index}`}>{letter}</span>
        ))}
      </div>
      {verdictEl}
    </>
  );

  const stripEl = (
    <>
      <Strip cells={shown.cells} label={stripText} />
      <StripLegend pack={pack} count={analysis.provenMonths} />
    </>
  );

  const takeNote =
    isElectricity ? (proved ? (takeState === "before" ? pack.takeaways.beforeNote : null) : pack.takeaways.folderNote)
    : dataset === "own" ? pack.takeaways.ownNote
    : null;

  const gaugeEl = (
    <>
      <CoverageGauge pack={pack} label={pack.gauge.months} value={analysis.monthCoverage} threshold={threshold} />
      {dataset === "own" ? (
        <div className="esg-threshold">
          <span id="esg-thr">{pack.own.threshold}</span>
          <button type="button" className="esg-btn esg-btn--square" aria-label={`${pack.own.thresholdAria} -`} disabled={own.threshold <= THRESHOLD_MIN} onClick={() => own.setThreshold(own.threshold - 1)}>-</button>
          <output aria-labelledby="esg-thr">{formatNumber(own.threshold, locale, 0)} %</output>
          <button type="button" className="esg-btn esg-btn--square" aria-label={`${pack.own.thresholdAria} +`} disabled={own.threshold >= THRESHOLD_MAX} onClick={() => own.setThreshold(own.threshold + 1)}>+</button>
        </div>
      ) : null}
      {dataset === "water" ? <p className="esg-hint">{pack.water.control}</p> : null}
      {dataset === "own" && analysis.missingMonths.length > 0 && analysis.band ? (
        <div className="esg-ownfacts">
          <p>
            {tidy(fill(pack.own.cap, {
              cap: formatSmart(analysis.provenSum * (1 / threshold - 1), locale, own.series.digits === 0 ? 0 : 1),
              unit: ownUnit,
              thr: own.threshold,
            }))}
          </p>
          <p>
            {tidy(fill(pack.own.band, {
              min: formatSmart(analysis.band.min, locale, own.series.digits),
              max: formatSmart(analysis.band.max, locale, own.series.digits),
              unit: ownUnit,
            }))}
          </p>
        </div>
      ) : null}
    </>
  );

  return (
    <div
      ref={rootRef}
      className="esg"
      data-esg-root=""
      data-dataset={dataset}
      role="group"
      aria-label={pack.region}
      onPointerDownCapture={skipIntro}
      onKeyDownCapture={skipIntro}
    >
      <div className="esg-seg" role="radiogroup" aria-label={pack.switchLabel}>
        {DATASETS.map((id) => (
          <label key={id} className="esg-seg__item">
            <input type="radio" name="esg-dataset" checked={dataset === id} onChange={() => setDataset(id)} />
            <span>{pack.datasets[id]}</span>
          </label>
        ))}
      </div>

      <div className="esg-grid">
        <div className="esg-main">
          {ownEmpty ? (
            <>
              <OwnData pack={pack} own={own} />
              <p className="esg-empty">{pack.own.empty}</p>
            </>
          ) : (
            <>
              <div className="esg-stage" ref={stageRef}>
                {formEl}
                {chartEl}
                {stripEl}
                {isElectricity ? (
                  <RevealControl
                    pack={pack}
                    progress={bill.value}
                    armed={guess !== null}
                    seen={seen}
                    onToggle={toggleBill}
                    onScrub={setBill}
                    onSettle={settleBill}
                  />
                ) : null}
              </div>
              {isElectricity ? null : gaugeEl}
              {dataset === "own" ? <OwnData pack={pack} own={own} /> : null}
            </>
          )}
        </div>

        {ladderVisible ? (
          <Ladder innerRef={ladderRef} pack={pack} rows={ladderRows} reveal={scene.ladder} draft={analyse(folder)} threshold={FIXED_THRESHOLD} />
        ) : isElectricity ? (
          <LadderPending pack={pack} draft={analyse(folder)} />
        ) : null}
        <div className="esg-side">
          <TakeawaysPanel
            pack={pack}
            items={items}
            ascii={ascii}
            onAscii={setAscii}
            empty={ownEmpty}
            note={takeNote}
            view={isElectricity && proved ? { value: takeView, onChange: setTakeView } : undefined}
          />
        </div>
      </div>

      <p className="esg-footer">{pack.footer}</p>
      <p className="esg-wlink">
        <a href={localizeHref("/workshops/esg-berichte-mit-ki", locale)}>{pack.workshopLink}</a>
      </p>
      <div className="esg-sr" role="status" aria-live="polite">{announce}</div>
    </div>
  );
}
