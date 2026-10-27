"use client";

import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, useBeatClock, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasChip, GlasSegmented, GlasSheet, GlasSlider, GlasToggle, useGlas } from "@/components/demos/glas";
import type { BeatId } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/beats";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import type { NcrRow } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { decide, freeDecision, startTrigger, TRIGGER_RANGE } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import {
  COUNTERS,
  maxMerges,
  PERIODS,
  rate,
  reading,
  readingId,
  type Counter,
  type Denom,
  type Period,
  type SeptemberEnds,
  type Verdict,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { cardChoice, demoReducer, freeKey, INITIAL_STATE, totalMerges, type DemoState } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/demo-state";
import { EMPTY_CARD, MAX_CARDS, canAddCard, type OwnCard } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import { scaleX, SCALE_VIEW, TRAY_VIEW } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trays";
import { captionFor, septemberEnd } from "./captions";
import { ConditionCard } from "./condition-card";
import { craftOwnCard } from "./craft-card";
import { DockCaption } from "./dock-caption";
import { FitBox } from "./fit-box";
import { formatter, type Fmt } from "./fmt";
import { OwnCardForm } from "./own";
import { RecordSheet } from "./record-sheet";
import { ReportCard } from "./report-card";
import { ScaleView, type ScaleTick } from "./scale-view";
import { DecisionRaster, TriggerChecks } from "./scene-decide";
import { MERGE_VIEW, MergeGrid } from "./scene-merge";
import { PeriodCalendar } from "./scene-period";
import { TraceCarpet } from "./scene-trace";
import { SceneMore, SceneTable } from "./sheets";
import type { KitCardWords } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { EDITABLE, SteckbriefCard, SteckbriefChip } from "./steckbrief-card";
import { TakeHome, type TakeHomeFiles } from "./takehome";
import { TraysView } from "./trays-view";
import "./demo.css";

const GUESSES: readonly Verdict[] = ["worse", "same", "better"];
const TRAY_RATIO = TRAY_VIEW.w / TRAY_VIEW.h;
const MERGE_RATIO = MERGE_VIEW.w / MERGE_VIEW.h;
const TABLE_BEATS = new Set<BeatId | "free">(["zaehlen", "zusammenfassen", "zeitraum", "nachrechnen", "free"]);
const MORE_BEATS = new Set<BeatId | "free">(["zaehlen", "zeitraum", "nachrechnen", "entscheiden", "free"]);
const SIDE_BEATS = new Set<BeatId | "free">(["schaetzen", "zaehlen", "zusammenfassen", "zeitraum", "nachrechnen", "free"]);

/** A reading id ("affected/none/month/oct6/0") back to its key. */
function keyOf(id: string) {
  const [counter, denom, period, septemberEnds, merges] = id.split("/");
  return {
    counter: counter as Counter,
    denom: denom as Denom,
    period: period as Period,
    septemberEnds: septemberEnds as SeptemberEnds,
    merges: Number(merges),
  };
}

function scaleFor(pack: DemoPack, fmt: Fmt, state: DemoState, free: boolean) {
  const base = free
    ? freeKey(state.free)
    : {
        counter: state.counter,
        denom: state.denom,
        septemberEnds: "oct6" as const,
        merges: 0,
      };
  const options = COUNTERS.map((counter) => reading({ ...base, counter }));
  const current = COUNTERS.indexOf(base.counter);
  const reportId = readingId({ counter: "records" });
  const tick = (id: string, ghost = false): ScaleTick => {
    const r = reading(keyOf(id));
    return {
      id,
      change: r.change,
      verdict: r.verdict,
      ghost,
      tag: id === reportId ? pack.scale.reportTag : ghost ? pack.scale.ghostTag : undefined,
    };
  };
  const ticks = free
    ? state.seen.map((id) => tick(id))
    : [...state.visited.map((counter) => tick(readingId({ counter }))), ...(state.denom === "none" ? [tick(readingId({ counter: state.counter, denom: "none" }), true)] : [])];
  const r = options[current] ?? options[0];
  const valueText = r
    ? fmt.t(pack.scale.lensValue, {
        counter: pack.counters[base.counter].label,
        denom: base.denom === "per1000" ? fmt.t(pack.per) : pack.absolute,
        change: fmt.pct(r.change),
        verdict: pack.verdicts[r.verdict],
      })
    : "";
  return {
    options: options.map((item) => item.change),
    current,
    ticks,
    valueText,
    change: r?.change ?? 0,
  };
}

export default function Demo({
  pack,
  files,
  recordedOn,
  kitCounters,
}: {
  readonly pack: DemoPack;
  readonly files: TakeHomeFiles;
  readonly recordedOn: string;
  /** The numerator options as the kit words them (read from metric-cards.md on the server). */
  readonly kitCounters: KitCardWords["counters"];
}) {
  const clock = useBeatClock();
  const glas = useGlas();
  const fmt = useMemo(() => formatter(pack), [pack]);
  const [state, dispatch] = useReducer(demoReducer, INITIAL_STATE);
  const [card, setCard] = useState<OwnCard>(EMPTY_CARD);
  const [cards, setCards] = useState<readonly OwnCard[]>([]);
  const [record, setRecord] = useState<NcrRow | null>(null);
  const [sheet, setSheet] = useState<"table" | "more" | "levers" | "raster" | null>(null);
  const flat = glas.mode === "solid";
  const reduced = clock.reducedMotion;
  const free = clock.phase === "free";
  const beatId = clock.beat.id as BeatId;
  const view: BeatId | "free" = free ? "free" : beatId;

  useOnRestart(() => {
    dispatch({ type: "restart" });
    setRecord(null);
    setSheet(null);
  });
  useEffect(() => {
    if (clock.phase === "guided") dispatch({ type: "reach", index: clock.index });
  }, [clock.index, clock.phase]);

  const choice = cardChoice(state);
  const trigger = state.trigger[choice.counter];
  const scale = scaleFor(pack, fmt, state, free);
  const caption = captionFor(pack, fmt, beatId, state, clock.phase, cards.length);
  const reached = free ? Math.max(state.reached, 5) : state.reached;
  const showScale = view === "zaehlen" || view === "free";
  const feld = feldFor("idea", [undefined, undefined, showScale ? { x: scaleX(scale.change) / SCALE_VIEW.w, y: 0.5 } : undefined]);

  const cardView = (editable: boolean, only?: typeof EDITABLE) => (
    <SteckbriefCard
      pack={pack}
      fmt={fmt}
      choice={choice}
      trigger={trigger}
      reached={reached}
      editable={editable}
      only={only}
      heading={only ? pack.decide.cardLines : undefined}
      onChange={(patch) => dispatch({ type: "cardLine", ...patch })}
    />
  );
  const freeChoice = freeDecision(state.free.counter, state.free.denom);

  const counterControl = (value: Counter, onChange: (counter: Counter) => void) => (
    <GlasSegmented
      label={pack.count.control}
      wrap
      options={COUNTERS.map((counter) => ({
        value: counter,
        label: pack.counters[counter].short,
      }))}
      value={value}
      onChange={onChange}
    />
  );

  const data = (): ReactNode => {
    switch (view) {
      case "schaetzen":
        return (
          <>
            <ReportCard pack={pack} fmt={fmt} compact={state.guess !== null} />
            <FitBox ratio={TRAY_RATIO} min={state.guess === null ? 0 : 96}>
              <TraysView
                pack={pack}
                fmt={fmt}
                counter="records"
                denom="per1000"
                reducedMotion={reduced}
                flat={flat}
                resting={state.guess === null}
                onSelect={setRecord}
                selected={record?.id}
              />
            </FitBox>
          </>
        );
      case "zaehlen":
      case "free":
        return (
          <>
            {view === "zaehlen" ? <ReportCard pack={pack} fmt={fmt} compact /> : null}
            <ScaleView
              pack={pack}
              fmt={fmt}
              options={scale.options}
              current={scale.current}
              ticks={scale.ticks}
              reducedMotion={reduced}
              valueText={scale.valueText}
              onPick={(index) => {
                const counter = COUNTERS[index] as Counter;
                if (free) dispatch({ type: "free", patch: { counter } });
                else dispatch({ type: "counter", counter });
              }}
            />
            <FitBox ratio={TRAY_RATIO} min={72}>
              <TraysView
                pack={pack}
                fmt={fmt}
                counter={free ? state.free.counter : state.counter}
                denom={free ? state.free.denom : state.denom}
                reducedMotion={reduced}
                flat={flat}
                onSelect={setRecord}
                selected={record?.id}
              />
            </FitBox>
            {free ? (
              <p className="w02-free-decision" data-w02-free-decision="">
                {freeChoice ? (
                  <>
                    <span className="w02-doc-kicker">{pack.free.decision}</span> {fmt.t(pack.decide.decisions[freeChoice.key])}
                  </>
                ) : (
                  pack.free.noDecision
                )}
              </p>
            ) : null}
          </>
        );
      case "zusammenfassen": {
        const merges = totalMerges(state);
        const g = pack.merge.gauges;
        return (
          <>
            <dl className="w02-gauges" data-w02-gauges="">
              <div>
                <dt>{fmt.t(g.records)}</dt>
                <dd data-w02-gauge="records">{fmt.n(rate("records", "sep", merges), 2)}</dd>
              </div>
              <div>
                <dt>{fmt.t(g.affected)}</dt>
                <dd>
                  {fmt.n(rate("affected", "sep"))} <span>{g.unchanged}</span>
                </dd>
              </div>
              <div>
                <dt>{fmt.t(g.scrapped)}</dt>
                <dd>
                  {fmt.n(rate("scrapped", "sep"))} <span>{g.unchanged}</span>
                </dd>
              </div>
            </dl>
            <FitBox ratio={MERGE_RATIO} min={96}>
              <MergeGrid pack={pack} fmt={fmt} state={state} reducedMotion={reduced} flat={flat} onMerge={(cell) => dispatch({ type: "merge", cell })} />
            </FitBox>
            <ConditionCard pack={pack} fmt={fmt} recordedOn={recordedOn} />
          </>
        );
      }
      case "zeitraum":
        return (
          <PeriodCalendar
            pack={pack}
            fmt={fmt}
            ends={state.septemberEnds}
            period={state.period}
            reducedMotion={reduced}
            onEnds={(ends) => dispatch({ type: "septemberEnds", ends })}
          />
        );
      case "nachrechnen":
        return <TraceCarpet pack={pack} fmt={fmt} range={state.range} reducedMotion={reduced} onRange={(range) => dispatch({ type: "range", range })} />;
      case "entscheiden":
        return (
          <div className="w02-decide">
            <TriggerChecks pack={pack} fmt={fmt} counter={choice.counter} threshold={trigger} />
            <div className="w02-outcome" data-w02-outcome="">
              <p>
                <span className="w02-doc-kicker">{pack.decide.outcome}</span> {fmt.t(pack.decide.decisions[decide(choice.counter, choice.period).key])}
              </p>
              <span className="w02-phone-only">
                <GlasButton variant="plain" size="compact" trailingIcon="forward" onClick={() => setSheet("raster")} data-w02-raster-open="">
                  {pack.decide.rasterOpen}
                </GlasButton>
              </span>
            </div>
            <div className="w02-decide-card">{cardView(true)}</div>
            <div className="w02-decide-lines">{cardView(true, EDITABLE)}</div>
            <div className="w02-decide-raster">
              <DecisionRaster pack={pack} fmt={fmt} counter={choice.counter} period={choice.period} />
            </div>
            <p className="w02-objective" data-w02-objective="">
              <span className="w02-doc-kicker">{pack.decide.rule}</span> {pack.decide.objective}
            </p>
          </div>
        );
      case "deine-kennzahl":
        return (
          <OwnCardForm
            pack={pack}
            fmt={fmt}
            card={card}
            cards={cards}
            onCard={setCard}
            onAdd={() => {
              if (!canAddCard(card) || cards.length >= MAX_CARDS) return;
              setCards([...cards, card]);
              setCard(EMPTY_CARD);
            }}
            onRemove={(index) => setCards(cards.filter((_, at) => at !== index))}
            onClear={() => {
              setCards([]);
              setCard(EMPTY_CARD);
            }}
          />
        );
      case "mitnehmen":
        return <TakeHome pack={pack} fmt={fmt} files={files} cards={cards} craftCard={craftOwnCard(pack, fmt, choice, trigger)} />;
    }
  };

  const controls = (): ReactNode => {
    if (clock.phase === "intro") return null;
    switch (view) {
      case "free":
        return (
          <>
            {counterControl(state.free.counter, (counter) => dispatch({ type: "free", patch: { counter } }))}
            <GlasButton variant="fill" size="compact" icon="sliders" onClick={() => setSheet("levers")} aria-expanded={sheet === "levers"}>
              {pack.free.levers}
            </GlasButton>
          </>
        );
      case "schaetzen":
        // No extra skip button: "Weiter" in the path moves on without a guess.
        return (
          <div className="w02-guess" role="group" aria-label={pack.guess.label}>
            {GUESSES.map((guess) => (
              <GlasChip
                key={guess}
                kind="filter"
                selected={state.guess === guess}
                onClick={() => {
                  dispatch({ type: "guess", guess });
                  clock.commit();
                }}
              >
                {pack.guess.options[guess]}
              </GlasChip>
            ))}
          </div>
        );
      case "zaehlen":
        return (
          <>
            {counterControl(state.counter, (counter) => dispatch({ type: "counter", counter }))}
            {state.visited.length === COUNTERS.length ? (
              <GlasToggle checked={state.denom === "per1000"} onChange={(on) => dispatch({ type: "denom", denom: on ? "per1000" : "none" })} label={fmt.t(pack.count.denomLabel)} />
            ) : null}
          </>
        );
      case "zusammenfassen": {
        const merges = totalMerges(state);
        return (
          <>
            {merges < maxMerges() ? (
              <GlasButton variant="fill" size="compact" onClick={() => dispatch({ type: "mergeAll" })}>
                {pack.merge.all_button}
              </GlasButton>
            ) : (
              <p className="w02-dock-label">{pack.merge.choose}</p>
            )}
            {merges > 0 && merges < maxMerges() ? (
              <GlasButton variant="plain" size="compact" icon="back" onClick={() => dispatch({ type: "undo" })} data-w02-undo="">
                {pack.merge.undo}
              </GlasButton>
            ) : null}
            {merges >= maxMerges() ? (
              <GlasSegmented
                label={pack.merge.choose}
                wrap
                options={COUNTERS.map((counter) => ({
                  value: counter,
                  label: pack.counters[counter].short,
                }))}
                value={choice.counter}
                onChange={(counter) => dispatch({ type: "cardCounter", counter })}
              />
            ) : null}
          </>
        );
      }
      case "zeitraum":
        return (
          <GlasSegmented
            label={pack.period.control}
            options={PERIODS.map((period) => ({
              value: period,
              label: pack.period.options[period],
            }))}
            value={state.period}
            onChange={(period) => dispatch({ type: "period", period })}
          />
        );
      case "entscheiden": {
        const range = TRIGGER_RANGE[choice.counter];
        const start = startTrigger(choice.counter);
        const unit = pack.counters[choice.counter].unit;
        return (
          <div className="w02-slider">
            <GlasSlider
              label={pack.decide.triggerLabel}
              value={trigger}
              min={range.min}
              max={range.max}
              step={range.step}
              bigStep={range.step * 10}
              onChange={(value) => dispatch({ type: "trigger", counter: choice.counter, value })}
              format={(value) => fmt.t(pack.decide.triggerShort, { v: fmt.rate(choice.counter, value) })}
              valueText={(value) =>
                fmt.t(pack.decide.triggerValue, {
                  v: fmt.rate(choice.counter, value),
                  unit,
                })
              }
              announce={(value) =>
                fmt.t(pack.decide.triggerValue, {
                  v: fmt.rate(choice.counter, value),
                  unit,
                })
              }
              // The start mark is named only when it is not September's own value, which the hint already names.
              ticks={[
                Math.abs(start.value - rate(choice.counter, "sep")) < range.step / 2
                  ? { value: start.value }
                  : { value: start.value, label: fmt.t(start.source === "kit" ? pack.decide.kitTag : pack.decide.demoTag, { v: fmt.rate(choice.counter, start.value) }) },
                { value: rate(choice.counter, "sep") },
              ]}
              hint={fmt.t(pack.decide.triggerToday, {
                v: fmt.rate(choice.counter, rate(choice.counter, "sep")),
              })}
            />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      <DemoGlasStage
        label={fmt.t(pack.stageLabel)}
        feld={feld}
        className="w02-stage"
        dock={
          <DemoDock className="w02-dock" compact>
            <DockCaption sentences={caption} more={pack.captionMore} less={pack.captionLess} />
            {controls()}
          </DemoDock>
        }
      >
        <div className="w02-data" data-view={view} data-w02-view={view}>
          <div className="w02-toolbar" hidden={clock.phase === "intro"}>
            {view !== "deine-kennzahl" && view !== "mitnehmen" ? (
              <SteckbriefChip pack={pack} fmt={fmt} reached={reached}>
                {cardView(false)}
              </SteckbriefChip>
            ) : null}
            {TABLE_BEATS.has(view) ? (
              <GlasButton variant="plain" size="compact" onClick={() => setSheet("table")}>
                {pack.table.open}
              </GlasButton>
            ) : null}
            {MORE_BEATS.has(view) ? <GlasButton variant="icon" size="compact" icon="info" label={pack.more} onClick={() => setSheet("more")} /> : null}
          </div>
          <div className="w02-layout" data-side={SIDE_BEATS.has(view) ? "" : undefined}>
            <div className="w02-main">{data()}</div>
            {SIDE_BEATS.has(view) ? <aside className="w02-side">{cardView(false)}</aside> : null}
          </div>
        </div>
      </DemoGlasStage>
      <RecordSheet pack={pack} fmt={fmt} row={record} onSelect={setRecord} onClose={() => setRecord(null)} />
      <GlasSheet open={sheet === "table"} onClose={() => setSheet(null)} title={pack.table.title} closeLabel={pack.close} resizeLabel={pack.resize}>
        <SceneTable pack={pack} fmt={fmt} beat={view} ends={state.septemberEnds} range={state.range} />
      </GlasSheet>
      <GlasSheet open={sheet === "raster"} onClose={() => setSheet(null)} title={pack.decide.rasterTitle} closeLabel={pack.close} resizeLabel={pack.resize}>
        <DecisionRaster pack={pack} fmt={fmt} counter={choice.counter} period={choice.period} />
        <p className="w02-sheet-lead">{pack.decide.raster}</p>
      </GlasSheet>
      <GlasSheet open={sheet === "more"} onClose={() => setSheet(null)} title={pack.more} closeLabel={pack.close} resizeLabel={pack.resize}>
        <div className="w02-more">
          <SceneMore pack={pack} fmt={fmt} beat={view} choice={choice} trigger={trigger} kitCounters={kitCounters} />
        </div>
      </GlasSheet>
      <GlasSheet open={sheet === "levers"} onClose={() => setSheet(null)} modal={false} title={pack.free.leversTitle} closeLabel={pack.close} resizeLabel={pack.resize}>
        <div className="w02-levers">
          {counterControl(state.free.counter, (counter) => dispatch({ type: "free", patch: { counter } }))}
          <GlasToggle
            checked={state.free.denom === "per1000"}
            onChange={(on) =>
              dispatch({
                type: "free",
                patch: { denom: on ? "per1000" : "none" },
              })
            }
            label={fmt.t(pack.count.denomLabel)}
          />
          <GlasToggle checked={state.free.merged} onChange={(merged) => dispatch({ type: "free", patch: { merged } })} label={pack.free.merge} />
          <GlasSegmented
            label={pack.free.end}
            options={(["oct6", "sep29"] as const).map((ends) => ({
              value: ends,
              label: fmt.t(pack.free.ends[ends], {
                oct6: septemberEnd(fmt, "oct6"),
                sep29: septemberEnd(fmt, "sep29"),
              }),
            }))}
            value={state.free.septemberEnds}
            onChange={(septemberEnds) => dispatch({ type: "free", patch: { septemberEnds } })}
          />
        </div>
      </GlasSheet>
    </>
  );
}
