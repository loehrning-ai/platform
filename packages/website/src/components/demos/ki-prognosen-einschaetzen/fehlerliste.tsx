"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { feldFor, GlasButton, GlasChip, GlasSegmented, GlasSheet, GlasSlider, GlasToggle } from "@/components/demos/glas";
import { DemoDock, DemoGlasStage, setTakeHomeLine, useBeatClock, useBeatGate, useOnRestart } from "@/components/demos/shell";
import { BEATS, type BeatId } from "@/lib/demo-cases/ki-prognosen-einschaetzen/beats";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { slugify, toResultCsv, toRuleMarkdown } from "@/lib/demo-cases/ki-prognosen-einschaetzen/export";
import { fill, formatDay, formatShortDay } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { KIT_COSTS, kitCheck, kitCsv } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { buildModel, type Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { evaluateOwn } from "@/lib/demo-cases/ki-prognosen-einschaetzen/own";
import { MAX_BYTES } from "@/lib/demo-cases/ki-prognosen-einschaetzen/parse";
import {
  baselineCaption,
  errorsCaption,
  errorsMoment,
  freeCaption,
  planCaption,
  planGap,
  rangeCaption,
  ruleCaption,
  type Paragraphs,
  type Progress,
} from "./captions";
import { downloadText } from "./download";
import { euro2, fillProject, jars, ownerOr, parseCost, percent, personalLine, ruleFill, SLUG, weekOf, weekSentence } from "./helpers";
import { EMPTY_OWN, OwnStep, type OwnInputs } from "./own-step";
import { SceneBaseline } from "./scene-baseline";
import { SceneErrors } from "./scene-errors";
import { bufferDomain, curveMax, ScenePlan } from "./scene-plan";
import { SceneRange } from "./scene-range";
import { SceneRule } from "./scene-rule";
import { ExportSheet, RangeSheet, RowSheet, WeekSheet, YearSheet, type SheetState } from "./sheets";
import { CopyRowButton, TakeHomeStep } from "./take-home-step";
import "./w01.css";

type Decision = "open" | "locked" | "skipped";
type FreeView = "fehler" | "spanne" | "planzahl" | "lampen";
const FREE_VIEWS: readonly FreeView[] = ["fehler", "spanne", "planzahl", "lampen"];
const GUESS_START = 90;
const GUESS3_START = 30;
const POOL_REST = 0.92;

function clampTo(list: readonly number[], t: number): number {
  const first = list[0] ?? t;
  const last = list[list.length - 1] ?? t;
  return Math.min(last, Math.max(first, t));
}

function Caption({ paragraphs, children }: { readonly paragraphs: Paragraphs; readonly children?: ReactNode }) {
  return (
    <div className="w01-cap" data-w01-caption="">
      {paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
      {children}
    </div>
  );
}

/**
 * "Die Fehlerliste" on the v4 shell: one column (sales minus forecast)
 * built by hand and read four ways. The visitor's bets, playheads and
 * levers live here; r and Shift+R reset them, never the own file or the
 * person who decides. Every number comes from one check (the kit's or the
 * visitor's file) through buildModel, so the captions, the take-home and
 * the rule file say the same thing.
 */
export function Fehlerliste({ copy, kitHref, kitSize }: { readonly copy: DemoPack; readonly kitHref: string; readonly kitSize: string }) {
  const clock = useBeatClock();
  const locale = copy.locale;
  const beat = (BEATS[clock.index]?.id ?? "messlatte") as BeatId;
  const free = clock.phase === "free";

  const [guess, setGuess] = useState(GUESS_START);
  const [guessState, setGuessState] = useState<Decision>("open");
  const [shift, setShift] = useState(0);
  const [shiftDrag, setShiftDrag] = useState(false);
  const [baselineDone, setBaselineDone] = useState(false);
  const [p2, setP2] = useState<number | null>(null);
  const [errorsDone, setErrorsDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [guess3, setGuess3] = useState(GUESS3_START);
  const [guess3State, setGuess3State] = useState<Decision>("open");
  const [p3, setP3] = useState<number | null>(null);
  const [rangeDone, setRangeDone] = useState(false);
  const [canteen, setCanteen] = useState(true);
  const [buffer, setBuffer] = useState(0);
  const [visited, setVisited] = useState<readonly [number, number]>([0, 0]);
  const [planFull, setPlanFull] = useState(false);
  const [planDone, setPlanDone] = useState(false);
  const [planActive, setPlanActive] = useState(false);
  const [p5, setP5] = useState<number | null>(null);
  const [ruleDone, setRuleDone] = useState(false);
  const [freeView, setFreeView] = useState<FreeView>("fehler");
  const [freeT, setFreeT] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [poolX, setPoolX] = useState(POOL_REST);
  // The visitor's own data and the person: r never clears them.
  const [owner, setOwner] = useState("");
  const [own, setOwn] = useState<OwnInputs>(EMPTY_OWN);
  const [ownChecked, setOwnChecked] = useState("");
  const [fileProblem, setFileProblem] = useState<"tooBig" | "fileType" | null>(null);
  const [source, setSource] = useState<"kit" | "own">("kit");

  const kitCo = canteen ? KIT_COSTS.restKantine : KIT_COSTS.restOhne;
  const kit = useMemo(() => kitCheck(KIT_COSTS.fehlmenge, kitCo, locale), [kitCo, locale]);
  const kitModel = useMemo(() => buildModel(kit.check, kit.result, { cu: KIT_COSTS.fehlmenge, co: kitCo }), [kit, kitCo]);
  const kitText = useMemo(() => kitCsv(locale), [locale]);
  const ownCu = parseCost(own.short);
  const ownCo = parseCost(own.left);
  const ownOutcome = useMemo(
    () => evaluateOwn(ownChecked, { fehlmenge: ownCu, rest: ownCo, messlatte: own.rule }),
    [ownChecked, ownCu, ownCo, own.rule],
  );
  const ownModel = useMemo(
    () => (ownOutcome.kind === "ok" ? buildModel(ownOutcome.check, ownOutcome.result, ownCu && ownCo ? { cu: ownCu, co: ownCo } : null) : null),
    [ownOutcome, ownCu, ownCo],
  );
  const useOwn = source === "own" && ownModel !== null;
  const model: Model = useOwn && ownModel ? ownModel : kitModel;
  const ownCosts = ownCu && ownCo ? { cu: ownCu, co: ownCo } : null;
  const costs = useOwn ? ownCosts : { cu: KIT_COSTS.fehlmenge, co: kitCo };
  const lampsReady = useOwn ? ownOutcome.kind === "ok" && ownOutcome.lampsReady : true;
  const series = useOwn ? own.series.trim() || copy.own.seriesFallback : copy.product;
  const { check, span, strip } = model;

  const errorsFirst = (span[0] ?? 0) - 1;
  const errorsLast = span[span.length - 1] ?? 0;
  const P2 = p2 ?? errorsFirst;
  const P3 = p3 ?? model.park;
  const P5 = p5 ?? clampTo(strip, model.park);
  const plan = model.plan;
  const yMax = useMemo(() => {
    if (!plan) return 1;
    if (useOwn) return curveMax(plan, ownCosts ? [ownCosts] : []);
    return curveMax(plan, [
      { cu: KIT_COSTS.fehlmenge, co: KIT_COSTS.restKantine },
      { cu: KIT_COSTS.fehlmenge, co: KIT_COSTS.restOhne },
    ]);
  }, [plan, useOwn, ownCosts?.cu, ownCosts?.co]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetScenes = () => {
    setGuess(GUESS_START);
    setGuessState("open");
    setShift(0);
    setShiftDrag(false);
    setBaselineDone(false);
    setP2(null);
    setErrorsDone(false);
    setSelected(null);
    setGuess3(GUESS3_START);
    setGuess3State("open");
    setP3(null);
    setRangeDone(false);
    setBuffer(0);
    setVisited([0, 0]);
    setPlanFull(false);
    setPlanDone(false);
    setP5(null);
    setRuleDone(false);
    setFreeT(null);
    setSheet(null);
    setPoolX(POOL_REST);
  };
  useOnRestart(() => {
    resetScenes();
    setCanteen(true);
    setFreeView("fehler");
  });

  // The light under the finger moves on release only, never per frame under the live dock.
  const settle = (share: number) => {
    if (!clock.reducedMotion) setPoolX(Math.min(0.95, Math.max(0.05, share)));
  };

  const moveP2 = (t: number) => {
    const next = Math.min(errorsLast, Math.max(errorsFirst, t));
    setP2(next);
    if (next >= errorsLast) setErrorsDone(true);
  };
  const moveP3 = (t: number) => {
    const next = clampTo(span, t);
    setP3(next);
    if (next >= model.rangeDone) setRangeDone(true);
  };
  const moveP5 = (t: number) => {
    const next = clampTo(strip, t);
    setP5(next);
    if (next >= model.ruleDone) setRuleDone(true);
  };
  const moveBuffer = (b: number) => {
    setBuffer(b);
    setVisited(([lo, hi]) => [Math.min(lo, b), Math.max(hi, b)]);
  };
  const commitBuffer = (share: number) => {
    setPlanFull(true);
    settle(share);
    if (plan && Math.abs(buffer - plan.argmin) <= 2) setPlanDone(true);
  };
  const toggleCanteen = (on: boolean) => {
    setCanteen(on);
    setPlanDone(true);
    setPlanFull(true);
  };
  // The order line follows the new curve's lowest point when the canteen flips.
  const kitArgmin = kitModel.plan?.argmin ?? 0;
  useEffect(() => {
    if (!planDone) return;
    setBuffer(kitArgmin);
  }, [canteen]); // eslint-disable-line react-hooks/exhaustive-deps

  // The take-home block's personal line (in memory only).
  useEffect(() => {
    if (useOwn && ownModel) setTakeHomeLine(SLUG, personalLine(copy, series, owner, ownModel.result));
    else if (owner.trim()) setTakeHomeLine(SLUG, personalLine(copy, copy.product, owner, kitModel.result));
    else setTakeHomeLine(SLUG, "");
  }, [copy, owner, useOwn, ownModel, kitModel, series]);

  // Scene gates: "Weiter" turns prominent once a scene's goal is met (it always works).
  const ready: Readonly<Record<BeatId, boolean | null>> = {
    messlatte: baselineDone,
    fehlerliste: errorsDone,
    spanne: !lampsReady || (guess3State !== "open" && rangeDone),
    planzahl: !plan || planDone,
    pruefregel: !lampsReady || ruleDone,
    "meine-daten": null,
    mitnehmen: null,
  };
  useBeatGate(clock.phase === "guided" ? ready[beat] : null);

  const progress: Progress = {
    guess: guessState,
    guessValue: guess,
    baselineDone,
    errorsAt: P2,
    errorsDone,
    guess3: guess3State,
    guess3Value: guess3,
    rangeAt: P3,
    rangeDone,
    planDone,
    canteen,
    ruleDone,
    owner,
    kit: !useOwn,
    lampsReady,
  };

  // Downloads and the question for Claude, built in this tab.
  const ruleCosts = useOwn ? { cu: ownCu, co: ownCo } : { cu: KIT_COSTS.fehlmenge, co: kitCo };
  const downloadRule = () => {
    const fillIn = ruleFill(copy, series, owner, model, ruleCosts.cu, ruleCosts.co, useOwn ? null : copy.ruleFile.system);
    downloadText(fill(copy.ruleFile.name, { series: slugify(series, copy.own.seriesFallback) }), toRuleMarkdown(copy.ruleFile.template, model.result, fillIn, locale), "text/markdown");
  };
  const downloadCsv = () => {
    downloadText(fill(copy.ruleFile.resultName, { series: slugify(series, copy.own.seriesFallback) }), toResultCsv(check, locale, copy.own.csvWords), "text/csv");
  };
  const downloadTemplate = () => downloadText(copy.files.template, copy.kitText.template, "text/csv");
  const who = ownerOr(copy, owner);
  const prompt =
    ruleCosts.cu && ruleCosts.co
      ? fill(copy.takeHome.promptText, { cu: euro2(ruleCosts.cu, locale), co: euro2(ruleCosts.co, locale), owner: who, today: copy.takeHome.promptToday })
      : fill(copy.takeHome.promptNoCosts, { owner: who, today: copy.takeHome.promptToday });
  const project = fillProject(copy.kitText.project, {
    series,
    rule: copy.own.ruleNames[model.result.messlatte],
    cu: ruleCosts.cu ? euro2(ruleCosts.cu, locale) : null,
    co: ruleCosts.co ? euro2(ruleCosts.co, locale) : null,
    owner: owner.trim() || null,
  });
  const line = model.result.naechste ? personalLine(copy, series, owner, model.result) : "";

  // The visitor's own file, read in this tab only.
  const startOwn = (text: string) => {
    setOwnChecked(text);
    setSource("own");
    resetScenes();
  };
  const takeFile = (file: File) => {
    setFileProblem(null);
    if (file.size > MAX_BYTES) {
      setFileProblem("tooBig");
      return;
    }
    if (!/\.(csv|txt|tsv)$/i.test(file.name) && !file.type.startsWith("text/")) {
      setFileProblem("fileType");
      return;
    }
    void file.text().then((text) => {
      setOwn((previous) => ({ ...previous, text }));
      startOwn(text);
    });
  };
  const tryKit = () => {
    setFileProblem(null);
    setOwn((previous) => ({ ...previous, text: kitText }));
    startOwn(kitText);
  };
  const clearOwn = () => {
    setOwn(EMPTY_OWN);
    setOwnChecked("");
    setFileProblem(null);
    setSource("kit");
    resetScenes();
  };
  const switchSource = (next: "kit" | "own") => {
    setSource(next);
    resetScenes();
  };

  // The timeline in the dock: one row index per week, the week as its value text.
  const timeline = (value: number, min: number, max: number, onChange: (t: number) => void, announce: (t: number) => string) => (
    <GlasSlider
      className="w01-timeline"
      label={copy.ui.timeline}
      value={value}
      min={min}
      max={max}
      step={1}
      bigStep={4}
      onChange={onChange}
      onCommit={(t) => settle((t - min) / Math.max(1, max - min))}
      format={(t) => formatShortDay(check.rows[t]?.woche ?? "", locale)}
      valueText={(t) => weekOf(copy, check, t)}
      announce={announce}
    />
  );
  const errorsAnnounce = (t: number) => {
    const moment = errorsMoment(copy, model, t, !useOwn);
    if (moment) return moment;
    const ist = check.rows[t]?.ist;
    const forecast = check.forecast(t);
    const rule = check.rule(t);
    if (ist === null || ist === undefined || forecast === null || rule === null) return weekOf(copy, check, t);
    return fill(copy.s2.barLabel, { date: formatDay(check.rows[t]!.woche, locale), forecast: jars(Math.abs(ist - forecast), locale), rule: jars(Math.abs(ist - rule), locale) });
  };
  const rangeAnnounce = (t: number) => {
    const hit = check.hit(t);
    return hit === null ? copy.s3.weekNone : hit ? copy.s3.weekIn : copy.s3.weekOut;
  };
  const ruleAnnounce = (t: number) => weekSentence(copy, check.lamps(t), owner);

  const decideButtons = (onLock: () => void, onSkip: () => void) => (
    <div className="w01-decide">
      <GlasButton variant="prominent" size="compact" icon="check" onClick={onLock} data-w01-lock="">
        {copy.ui.lock}
      </GlasButton>
      <GlasButton variant="plain" size="compact" onClick={onSkip} data-w01-skip="">
        {copy.ui.skip}
      </GlasButton>
    </div>
  );

  const ownerField = (
    <label className="w01-field is-dock is-owner">
      <span className="w01-field-label">{copy.s5.owner}</span>
      <input
        className="w01-input"
        value={owner}
        placeholder={copy.s5.ownerPlaceholder}
        onChange={(event) => setOwner(event.target.value)}
        autoComplete="off"
        maxLength={80}
        data-w01-owner=""
      />
    </label>
  );
  const canteenToggle = !useOwn ? <GlasToggle className="w01-toggle" checked={canteen} onChange={toggleCanteen} label={copy.s4.toggle} /> : null;
  const missing = (paragraphs: Paragraphs) => <p className="w01-empty">{paragraphs[0]}</p>;

  // ---- What the stage shows for each beat (guided) or view (free) ----
  const view: BeatId | FreeView = free ? freeView : beat;
  const freeAt = (list: readonly number[]) => clampTo(list, freeT ?? list[list.length - 1] ?? 0);
  let data: ReactNode;
  let caption: Paragraphs;
  let captionExtra: ReactNode = null;
  let controls: ReactNode = null;

  if (view === "messlatte") {
    data = (
      <SceneBaseline
        copy={copy}
        model={model}
        guess={guessState === "skipped" ? null : guess}
        onGuess={guessState === "open" ? setGuess : undefined}
        showGrip={guessState !== "open"}
        shift={shift}
        dragging={shiftDrag}
        onShift={setShift}
        onActive={setShiftDrag}
        onRelease={(share) => {
          setShift((value) => {
            const snapped = Math.round(Math.min(1, Math.max(0, value)));
            if (snapped === 1) setBaselineDone(true);
            return snapped;
          });
          settle(share);
        }}
      />
    );
    caption = baselineCaption(copy, model, progress);
    if (guessState === "open" && !useOwn) {
      captionExtra = (
        <p>
          <GlasChip kind="file" icon="doc" onClick={() => setSheet({ kind: "export" })}>
            {copy.files.export}
          </GlasChip>
        </p>
      );
    }
    const tool = model.toolAccuracy;
    controls =
      guessState === "open" ? (
        <>
          <GlasSlider
            className="w01-guess is-ruler"
            label={copy.s1.sliderLabel}
            value={guess}
            min={80}
            max={100}
            step={0.5}
            bigStep={2}
            onChange={setGuess}
            format={(value) => percent(value / 100, locale)}
            valueText={(value) => fill(copy.s1.sliderValue, { value: percent(value / 100, locale).replace(/\s?%$/, "") })}
            ticks={tool !== null ? [{ value: Math.round(tool * 1000) / 10 }] : []}
          />
          {decideButtons(
            () => {
              setGuessState("locked");
              clock.commit();
            },
            () => {
              setGuessState("skipped");
              clock.commit();
            },
          )}
        </>
      ) : guessState === "locked" ? (
        <GlasChip kind="status">{fill(copy.ui.locked, { value: percent(guess / 100, locale) })}</GlasChip>
      ) : null;
  } else if (view === "fehlerliste" || view === "fehler") {
    const playhead = free ? freeAt(span) : P2;
    const move = free ? (t: number) => setFreeT(clampTo(span, t)) : moveP2;
    data = (
      <SceneErrors
        copy={copy}
        model={model}
        playhead={playhead}
        selected={selected}
        onPlayhead={move}
        onCommit={(_, share) => settle(share)}
        onSelect={(t) => {
          setSelected(t);
          setSheet({ kind: "row", t });
        }}
      />
    );
    caption = free ? freeCaption(copy, model) : errorsCaption(copy, model, progress);
    const row = check.rows[playhead];
    controls = (
      <>
        {timeline(playhead, free ? (span[0] ?? 0) : errorsFirst, errorsLast, move, errorsAnnounce)}
        {row?.line && check.wochen.includes(playhead) ? (
          <GlasButton
            variant="icon"
            icon="doc"
            label={fill(copy.s2.rowTitle, { line: row.line, file: useOwn ? series : copy.files.csv })}
            onClick={() => {
              setSelected(playhead);
              setSheet({ kind: "row", t: playhead });
            }}
            data-w01-row-open=""
          />
        ) : null}
      </>
    );
  } else if (view === "spanne") {
    const playhead = free ? freeAt(span) : P3;
    const move = free ? (t: number) => setFreeT(clampTo(span, t)) : moveP3;
    data = lampsReady ? (
      <SceneRange copy={copy} model={model} playhead={playhead} filled={free || rangeDone} onPlayhead={move} onCommit={(_, share) => settle(share)} />
    ) : (
      missing(rangeCaption(copy, model, progress))
    );
    caption = free ? freeCaption(copy, model) : rangeCaption(copy, model, progress);
    const promised = Math.round(model.result.spanne_wochen * 0.8);
    if (!lampsReady) controls = null;
    else if (!free && guess3State === "open") {
      controls = (
        <>
          <GlasSlider
            className="w01-guess"
            label={copy.s3.sliderLabel}
            value={guess3}
            min={0}
            max={model.result.spanne_wochen}
            step={1}
            bigStep={5}
            onChange={setGuess3}
            format={(value) => String(value)}
            valueText={(value) => fill(copy.s3.sliderValue, { value })}
            ticks={[{ value: promised }]}
          />
          {decideButtons(
            () => setGuess3State("locked"),
            () => setGuess3State("skipped"),
          )}
        </>
      );
    } else {
      controls = (
        <>
          {timeline(playhead, span[0] ?? 0, errorsLast, move, rangeAnnounce)}
          <GlasButton variant="icon" icon="info" label={copy.ui.more} onClick={() => setSheet({ kind: "range" })} data-w01-range-more="" />
        </>
      );
    }
  } else if (view === "planzahl") {
    const domain = plan ? bufferDomain(plan) : ([0, 0] as const);
    data =
      plan && costs ? (
        <ScenePlan
          copy={copy}
          plan={plan}
          costs={costs}
          yMax={yMax}
          buffer={Math.min(domain[1], Math.max(domain[0], buffer))}
          visited={visited}
          full={planFull || free}
          onBuffer={moveBuffer}
          onCommit={commitBuffer}
          onActive={setPlanActive}
          active={planActive}
        />
      ) : (
        missing(planCaption(copy, model, progress))
      );
    caption = free ? freeCaption(copy, model) : planCaption(copy, model, progress);
    controls = (
      <>
        {canteenToggle}
        {model.result.kosten ? <GlasButton variant="icon" icon="info" label={copy.s4.yearTitle} onClick={() => setSheet({ kind: "year" })} data-w01-year="" /> : null}
      </>
    );
  } else if (view === "pruefregel" || view === "lampen") {
    const playhead = free ? freeAt(strip) : P5;
    const move = free ? (t: number) => setFreeT(clampTo(strip, t)) : moveP5;
    data = lampsReady ? (
      <SceneRule
        copy={copy}
        model={model}
        playhead={playhead}
        filled={free || ruleDone}
        owner={owner}
        selected={sheet?.kind === "week" ? sheet.t : null}
        onPlayhead={move}
        onCommit={(_, share) => settle(share)}
        onSelect={(t) => setSheet({ kind: "week", t })}
      />
    ) : (
      missing(ruleCaption(copy, model, progress))
    );
    caption = free ? freeCaption(copy, model) : ruleCaption(copy, model, progress);
    controls = lampsReady ? (
      <>
        {timeline(playhead, strip[0] ?? 0, strip[strip.length - 1] ?? 0, move, ruleAnnounce)}
        {ownerField}
      </>
    ) : null;
  } else if (view === "meine-daten") {
    data = (
      <OwnStep
        copy={copy}
        inputs={own}
        outcome={ownOutcome}
        fileProblem={fileProblem}
        owner={owner}
        onInputs={setOwn}
        onCheck={() => {
          setFileProblem(null);
          startOwn(own.text);
        }}
        onFile={takeFile}
        onKitTry={tryKit}
        onTemplate={downloadTemplate}
        onClear={clearOwn}
        onReplay={() => {
          resetScenes();
          setSource("own");
          clock.seek(0);
        }}
        onExplore={() => {
          setSource("own");
          setFreeView("fehler");
          clock.explore();
        }}
        onOwner={setOwner}
      />
    );
    caption = [copy.own.caption];
  } else {
    data = <TakeHomeStep copy={copy} line={line} kitHref={kitHref} kitSize={kitSize} prompt={prompt} onRule={downloadRule} onMore={() => setSheet({ kind: "files" })} />;
    caption = [copy.takeHome.caption];
  }

  if (free) {
    const viewControls = controls;
    controls = (
      <>
        <GlasSegmented
          className="w01-views"
          label={copy.free.viewLabel}
          options={FREE_VIEWS.map((value) => ({ value, label: copy.free.views[value] }))}
          value={freeView}
          onChange={(next) => {
            setFreeView(next);
            setSheet(null);
          }}
        />
        {viewControls}
        {ownModel ? (
          <GlasSegmented
            className="w01-source"
            label={copy.free.sourceLabel}
            options={(["kit", "own"] as const).map((value) => ({ value, label: copy.free.sources[value] }))}
            value={useOwn ? "own" : "kit"}
            onChange={switchSource}
          />
        ) : null}
      </>
    );
  }

  const feld = feldFor("lemons", [undefined, { x: poolX, y: 1.04, size: 0.85 }, { x: 0.1, y: 1.12, size: 0.7 }]);
  const scrolls = view === "meine-daten" || view === "mitnehmen";
  const closeSheet = () => setSheet(null);

  return (
    <DemoGlasStage
      label={copy.stageLabel}
      feld={feld}
      caption={<Caption paragraphs={caption}>{captionExtra}</Caption>}
      dock={<DemoDock>{controls}</DemoDock>}
      className="w01-stage"
    >
      <div className="w01-data" data-w01-view={view} data-w01-source={useOwn ? "own" : "kit"}>
        <div className="w01-top">
          <span className="w01-tag">{useOwn ? series : copy.invented}</span>
          {(view === "pruefregel" || view === "lampen") && model.toolAccuracy !== null ? (
            <span className="w01-tag is-soft">{fill(copy.ui.year, { value: percent(model.toolAccuracy, locale) })}</span>
          ) : null}
        </div>
        <div className={scrolls ? "w01-body is-scroll" : "w01-body"}>{data}</div>
      </div>
      <ExportSheet copy={copy} open={sheet?.kind === "export"} onClose={closeSheet} />
      <RowSheet
        copy={copy}
        model={model}
        source={useOwn ? ownChecked : kitText}
        file={useOwn ? series : copy.files.csv}
        t={sheet?.kind === "row" ? sheet.t : null}
        onClose={closeSheet}
      />
      <RangeSheet copy={copy} model={model} open={sheet?.kind === "range"} onClose={closeSheet} />
      <YearSheet copy={copy} model={model} open={sheet?.kind === "year"} onClose={closeSheet} gap={!useOwn && !canteen ? planGap(copy, model) : null} />
      <WeekSheet copy={copy} model={model} t={sheet?.kind === "week" ? sheet.t : null} owner={owner} onClose={closeSheet} />
      <GlasSheet open={sheet?.kind === "files"} onClose={closeSheet} title={copy.takeHome.more} closeLabel={copy.ui.close} resizeLabel={copy.ui.resize} modal={false}>
        <div className="w01-sheet">
          <p className="w01-take-title">{copy.takeHome.project}</p>
          <p>{copy.takeHome.projectNote}</p>
          <CopyRowButton text={project} label={copy.takeHome.project} copied={copy.takeHome.copied} testId="project" />
          <p className="w01-take-title">{copy.takeHome.csv}</p>
          <p>{copy.takeHome.csvNote}</p>
          <GlasButton variant="glass" icon="download" onClick={downloadCsv}>
            {copy.takeHome.csv}
          </GlasButton>
          <p className="w01-take-title">{copy.takeHome.template}</p>
          <p>{copy.takeHome.templateNote}</p>
          <GlasButton variant="glass" icon="download" onClick={downloadTemplate}>
            {copy.takeHome.template}
          </GlasButton>
        </div>
      </GlasSheet>
    </DemoGlasStage>
  );
}
