"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { DemoLever, DemoStage, TAKEHOME_TARGET_ID, setTakeHomeLine, useBeatClock, useOnEscape, useOnRestart } from "@/components/demos/shell";
import { BEATS, type BeatId } from "@/lib/demo-cases/ki-prognosen-einschaetzen/beats";
import { BIAS_MAX, LAMP_KEYS, LERNEN, PRUEF, TREFFER_MIN, type CheckResult, type Checker } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { baselinePin, causeBefore, chances, longestRun, planErrors, rangeSplit, redRuns } from "@/lib/demo-cases/ki-prognosen-einschaetzen/derive";
import { slugify, toResultCsv, toRuleMarkdown } from "@/lib/demo-cases/ki-prognosen-einschaetzen/export";
import { formatEuro, formatNumber, formatOne, formatPercent, formatShortDay, fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { KIT_COSTS, kitCheck } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { evaluateOwn } from "@/lib/demo-cases/ki-prognosen-einschaetzen/own";
import { MAX_BYTES, parseCell } from "@/lib/demo-cases/ki-prognosen-einschaetzen/parse";
import { GUESSES, RANGE_TIPS, planFrame, sweep, type RangeTip } from "@/lib/demo-cases/ki-prognosen-einschaetzen/timeline";
import { downloadText } from "./download";
import { KitMap } from "./kit-map";
import { OwnPanel, OwnStage, type OwnInputs } from "./own-data";
import { PlanView } from "./plan-view";
import { RuleView } from "./rule-view";
import { BaselineStage, GuessStage, RangeStage, type KitFacts } from "./stages";
import "./fehlerliste.css";

const SLUG = "ki-prognosen-einschaetzen";

/** A cost field's text as euros: "1,50", "1.50", "1,50 €"; null when empty, zero or not a number. */
function parseCost(text: string): number | null {
  const cell = parseCell(text.replace(/€/g, ""));
  return cell.ok && cell.value !== null && cell.value > 0 ? cell.value : null;
}

const costText = (value: number, locale: DemoPack["locale"]) => formatNumber(value, locale, 2, 2);

function ruleFill(copy: DemoPack, series: string, owner: string, result: CheckResult, fehlmenge: number | null, rest: number | null) {
  return {
    reihe: series,
    system: copy.ruleFile.system,
    messlatte: copy.ruleNames[result.messlatte],
    owner,
    fehlmenge,
    rest,
    lampWords: copy.regel.lampState,
    lampSummary: (green: number, red: number) => fill(copy.ruleFile.lampSummary, { green, red }),
  };
}

/** The visitor's sentence for the take-home block: the plan week, its number and who decides. */
function personalLine(copy: DemoPack, series: string, owner: string, result: CheckResult): string {
  const next = result.naechste;
  if (!next) return "";
  const who = owner.trim() || copy.takeHome.lineNoOwner;
  const red = next.lampen ? LAMP_KEYS.filter((key) => next.lampen?.[key] === false).length : 0;
  const forecast = formatNumber(next.prognose, copy.locale);
  if (next.lampen?.frei && next.planzahl !== undefined) {
    return fill(copy.takeHome.line, { series, forecast, plan: formatNumber(next.planzahl, copy.locale), owner: who });
  }
  return fill(copy.takeHome.lineRed, { series, forecast, count: red, owner: who });
}

export function Fehlerliste({ copy }: { readonly copy: DemoPack }) {
  const clock = useBeatClock();
  const locale = copy.locale;
  const id = useId();
  const beat = (BEATS[clock.index]?.id ?? "schaetzen") as BeatId;
  const p = clock.progress;

  // The visitor's bets and levers. Restart clears them; the owner and the own file stay.
  const [guess, setGuess] = useState<number | null>(null);
  const [tip, setTip] = useState<RangeTip | "none" | null>(null);
  const [shortText, setShortText] = useState(() => costText(KIT_COSTS.fehlmenge, locale));
  const [leftText, setLeftText] = useState(() => costText(KIT_COSTS.restKantine, locale));
  const [selected, setSelected] = useState<number | null>(null);
  const [owner, setOwner] = useState("");
  const [own, setOwn] = useState<OwnInputs>({ text: "", series: "", messlatte: "wie letzte Woche", short: "", left: "" });
  const [ownChecked, setOwnChecked] = useState("");
  const [fileProblem, setFileProblem] = useState<"tooBig" | "fileType" | null>(null);

  useOnRestart(() => {
    setGuess(null);
    setTip(null);
    setShortText(costText(KIT_COSTS.fehlmenge, locale));
    setLeftText(costText(KIT_COSTS.restKantine, locale));
    setSelected(null);
  });
  useOnEscape(() => setSelected(null));

  const fehlmenge = parseCost(shortText);
  const rest = parseCost(leftText);
  const kit = useMemo(() => kitCheck(fehlmenge, rest), [fehlmenge, rest]);
  const facts: KitFacts = useMemo(() => {
    const { result } = kit;
    return {
      check: kit.check,
      result,
      toolAccuracy: 1 - (result.tabelle.Prognose?.wape ?? 0),
      ruleAccuracy: 1 - (result.tabelle["wie letzte Woche"]?.wape ?? 0),
      year: result.bis.slice(0, 4),
    };
  }, [kit]);
  const { check, result } = kit;

  const derived = useMemo(() => {
    const runs = redRuns(check);
    const longest = longestRun(runs);
    const cause = longest ? causeBefore(check, longest.from) : null;
    return { pin: baselinePin(check), runs, longest, cause, split: rangeSplit(check, cause), chance: chances(result) };
  }, [check, result]);

  const ownOutcome = useMemo(
    () =>
      evaluateOwn(ownChecked, {
        fehlmenge: parseCost(own.short),
        rest: parseCost(own.left),
        messlatte: own.messlatte,
      }),
    [ownChecked, own.short, own.left, own.messlatte],
  );
  const ownSeries = own.series.trim() || copy.own.seriesFallback;

  // The take-home block's personal line: the own file once checked, otherwise the kit with the named owner.
  useEffect(() => {
    if (ownOutcome.kind === "ok") setTakeHomeLine(SLUG, personalLine(copy, ownSeries, owner, ownOutcome.result));
    else if (owner.trim()) setTakeHomeLine(SLUG, personalLine(copy, copy.product, owner, result));
    else setTakeHomeLine(SLUG, "");
  }, [copy, owner, ownOutcome, ownSeries, result]);

  const lastStrip = check.streifen.length - 1;
  const strip = selected ?? lastStrip;
  const gated = tip === null && !clock.room;

  const downloadRule = (series: string, target: { result: CheckResult }, short: number | null, left: number | null) => {
    const text = toRuleMarkdown(copy.ruleFile.template, target.result, ruleFill(copy, series, owner, target.result, short, left), locale);
    downloadText(fill(copy.ruleFile.name, { series: slugify(series, copy.own.seriesFallback) }), text, "text/markdown");
  };
  const downloadCsv = (series: string, target: { check: Checker }) => {
    const name = `${locale === "de" ? "ergebnis" : "result"}-${slugify(series, copy.own.seriesFallback)}.csv`;
    downloadText(name, toResultCsv(target.check, locale, copy.own.csvWords), "text/csv");
  };

  const ownerField: ReactNode = (
    <label className="fl-field" htmlFor={`${id}-owner`}>
      <span className="fl-field-label">{copy.regel.owner}</span>
      <input
        id={`${id}-owner`}
        className="fl-input"
        value={owner}
        placeholder={copy.regel.ownerPlaceholder}
        onChange={(event) => setOwner(event.target.value)}
        autoComplete="off"
        maxLength={80}
        data-fl-owner=""
      />
    </label>
  );

  const replay = (
    <button type="button" className="fl-chip is-wide" onClick={() => clock.seek(clock.index)} data-fl-replay="">
      {copy.replay}
    </button>
  );

  let stage: ReactNode;
  let caption: ReactNode;
  let lever: ReactNode;
  let below: ReactNode = null;

  const scored = result.wochen;
  const rule = result.tabelle["wie letzte Woche"];
  const forecast = result.tabelle.Prognose;
  const lead = formatPercent(result.vorsprung ?? 0, locale, { decimals: 0 });
  const points = formatOne((facts.toolAccuracy - facts.ruleAccuracy) * 100, locale);
  const promised = Math.round(result.spanne_wochen * 0.8);

  if (beat === "schaetzen") {
    stage = <GuessStage copy={copy} kit={facts} p={p} />;
    caption = copy.guess.caption;
    const choose = (value: number | null) => {
      setGuess(value);
      clock.commit();
      clock.seek(BEATS.findIndex((b) => b.id === "messlatte"));
    };
    lever = (
      <div className="fl-chips" role="group" aria-label={copy.guess.chipsLabel}>
        {GUESSES.map((value) => (
          <button key={value} type="button" className="fl-chip" aria-pressed={guess === value} onClick={() => choose(value)} data-fl-guess={value}>
            {fill(copy.guess.chip, { value })}
          </button>
        ))}
      </div>
    );
    below = (
      <button type="button" className="fl-link" onClick={() => choose(null)} data-fl-skip="">
        {copy.guess.skip}
      </button>
    );
  } else if (beat === "messlatte") {
    stage = <BaselineStage copy={copy} kit={facts} p={p} guess={guess} pin={derived.pin} />;
    const accuracy = formatPercent(facts.ruleAccuracy, locale);
    caption =
      p < 1
        ? fill(copy.messlatte.captionShift, { accuracy })
        : fill(copy.messlatte.captionEnd, { lead, closer: result.naeher, weeks: scored });
    lever = replay;
    const skipped = result.nicht_bewertet
      .map(([woche, reason]) => fill(copy.messlatte.skipped[reason], { date: formatShortDay(woche, locale) }))
      .join(", ");
    below = (
      <div className="fl-notes" data-fl-notes="messlatte">
        <p className="fl-note-strong">
          {guess !== null ? fill(copy.messlatte.guessLine, { guess, accuracy }) : fill(copy.messlatte.noGuessLine, { accuracy })}
        </p>
        <p>{fill(copy.messlatte.notes[0] as string, { tool: formatPercent(facts.toolAccuracy, locale), points })}</p>
        <p>
          {fill(copy.messlatte.notes[1] as string, {
            mae: forecast ? formatOne(forecast.mae, locale) : "",
            maeRule: rule ? formatOne(rule.mae, locale) : "",
          })}
        </p>
        <p>{fill(copy.messlatte.notes[2] as string, { points, lead, skipped })}</p>
      </div>
    );
  } else if (beat === "spanne") {
    const effective = gated ? 0 : p;
    const ranged = check.wochen.filter((t) => check.hit(t) !== null).length;
    const done = !gated && sweep(effective, ranged) >= ranged;
    stage = <RangeStage copy={copy} kit={facts} p={effective} cause={derived.cause} showBars={gated} />;
    const share = formatPercent(0.8, locale, { decimals: 0 });
    caption = done
      ? fill(copy.spanne.captionEnd, { hits: result.spanne_treffer, weeks: result.spanne_wochen, promised })
      : fill(copy.spanne.captionTip, { share });
    const pick = (value: RangeTip | "none") => {
      setTip(value);
      clock.seek(clock.index);
    };
    lever = gated ? (
      <div className="fl-chips" role="group" aria-label={copy.spanne.tipsLabel}>
        {RANGE_TIPS.map((value) => (
          <button key={value} type="button" className="fl-chip" onClick={() => pick(value)} data-fl-tip={value}>
            {fill(copy.spanne.tips[value], { promised })}
          </button>
        ))}
      </div>
    ) : (
      replay
    );
    const split = derived.split;
    const date = split ? formatShortDay(split.cause.woche, locale) : "";
    below = gated ? (
      <button type="button" className="fl-link" onClick={() => pick("none")} data-fl-skip-tip="">
        {copy.spanne.skipTip}
      </button>
    ) : (
      <div className="fl-notes" data-fl-notes="spanne">
        <p className="fl-note-strong">
          {tip && tip !== "none"
            ? fill(copy.spanne.tipLine, { tip: fill(copy.spanne.tips[tip], { promised }), hits: result.spanne_treffer })
            : fill(copy.spanne.noTipLine, { hits: result.spanne_treffer })}
        </p>
        <p>{fill(copy.spanne.notes[0] as string, { window: LERNEN })}</p>
        {split ? (
          <p>
            {fill(copy.spanne.notes[1] as string, {
              date,
              before: `${split.before.hits}/${split.before.weeks}`,
              after: `${split.after.hits}/${split.after.weeks}`,
              misses: split.misses,
              missesAfter: split.missesAfter,
            })}
          </p>
        ) : null}
        <p>{fill(copy.spanne.notes[2] as string, { chance: formatPercent(derived.chance.year, locale, { decimals: 0 }), hits: result.spanne_treffer })}</p>
      </div>
    );
  } else if (beat === "planzahl") {
    const { errors, buffer } = planErrors(check, result);
    const frame = planFrame(p, errors.length);
    const next = result.naechste;
    stage = (
      <div className="fl-stage">
        <PlanView
          locale={locale}
          result={result}
          errors={errors}
          buffer={buffer}
          jars={frame.jars}
          line={frame.line}
          copy={copy.planzahl}
          year={facts.year}
          dateLabel={next ? formatShortDay(next.woche, locale) : ""}
        />
      </div>
    );
    const plan = next?.planzahl;
    caption =
      plan === undefined || !next
        ? copy.planzahl.noCosts
        : plan === next.prognose
          ? fill(copy.planzahl.captionSame, { plan: formatNumber(plan, locale) })
          : fill(copy.planzahl.caption, { plan: formatNumber(plan, locale), forecast: formatNumber(next.prognose, locale) });
    const kantine = rest === KIT_COSTS.restKantine && fehlmenge === KIT_COSTS.fehlmenge;
    const ohne = rest === KIT_COSTS.restOhne && fehlmenge === KIT_COSTS.fehlmenge;
    const preset = (value: number) => {
      setShortText(costText(KIT_COSTS.fehlmenge, locale));
      setLeftText(costText(value, locale));
    };
    lever = (
      <div className="fl-chips is-two" role="group" aria-label={copy.planzahl.presetsLabel}>
        <button type="button" className="fl-chip" aria-pressed={kantine} onClick={() => preset(KIT_COSTS.restKantine)} data-fl-preset="kantine">
          {fill(copy.planzahl.withCanteen, { rest: formatEuro(KIT_COSTS.restKantine, locale, 2) })}
        </button>
        <button type="button" className="fl-chip" aria-pressed={ohne} onClick={() => preset(KIT_COSTS.restOhne)} data-fl-preset="ohne">
          {fill(copy.planzahl.withoutCanteen, { rest: formatEuro(KIT_COSTS.restOhne, locale, 2) })}
        </button>
      </div>
    );
    const costs = result.kosten;
    below = (
      <div className="fl-notes" data-fl-notes="planzahl">
        <div className="fl-fields is-two">
          <label className="fl-field">
            <span className="fl-field-label">{copy.planzahl.costShort}</span>
            <input className="fl-input" inputMode="decimal" value={shortText} onChange={(event) => setShortText(event.target.value)} data-fl-cost="short" />
          </label>
          <label className="fl-field">
            <span className="fl-field-label">{copy.planzahl.costLeft}</span>
            <input className="fl-input" inputMode="decimal" value={leftText} onChange={(event) => setLeftText(event.target.value)} data-fl-cost="left" />
          </label>
        </div>
        {result.anteil !== undefined && fehlmenge !== null && rest !== null ? (
          <p>
            {fill(copy.planzahl.notes[0] as string, {
              cu: formatNumber(fehlmenge, locale, 2, 2),
              co: formatNumber(rest, locale, 2, 2),
              tau: formatNumber(result.anteil, locale, 2, 2),
            })}
          </p>
        ) : (
          <p>{copy.planzahl.noCosts}</p>
        )}
        {next?.planzahl !== undefined ? (
          <p>
            {fill(copy.planzahl.notes[1] as string, {
              short: next.zu_wenig ?? 0,
              left: next.uebrig ?? 0,
              of: next.von ?? 0,
              plan: formatNumber(next.planzahl, locale),
            })}
          </p>
        ) : null}
        {costs ? (
          <p>
            {fill(copy.planzahl.notes[2] as string, {
              year: facts.year,
              costRule: formatEuro(costs.Messlatte, locale),
              costForecast: formatEuro(costs.Prognose, locale),
              costPlan: formatEuro(costs.Planzahl, locale),
            })}
          </p>
        ) : null}
      </div>
    );
  } else if (beat === "regel") {
    const filled = sweep(p, check.streifen.length);
    stage = (
      <div className="fl-stage">
        <RuleView check={check} locale={locale} filled={filled} selected={strip} copy={copy.regel} />
      </div>
    );
    caption = fill(copy.regel.caption, { free: result.regel_frei, red: result.regel_wochen - result.regel_frei });
    const week = check.streifen[strip];
    const weekLamps = week === undefined ? null : check.lamps(week);
    const weekState = weekLamps ? (weekLamps.frei ? copy.regel.free : copy.regel.person) : copy.regel.noLamps;
    lever = (
      <label className="fl-slider">
        <span className="sr-only">{copy.regel.stripLabel}</span>
        <input
          type="range"
          min={0}
          max={lastStrip}
          step={1}
          value={strip}
          onChange={(event) => setSelected(Number(event.target.value))}
          aria-valuetext={week === undefined ? "" : fill(copy.regel.stripValue, { date: formatShortDay(check.rows[week]?.woche ?? "", locale), state: weekState })}
          data-fl-strip=""
        />
      </label>
    );
    const lampNames = (keys: readonly string[]) =>
      keys.map((key) => fill(copy.regel.lamps[key as keyof typeof copy.regel.lamps], { max: formatPercent(BIAS_MAX, locale, { decimals: 0 }), min: TREFFER_MIN, of: PRUEF })).join(" + ");
    const next = result.naechste;
    const nextRed = next?.lampen ? LAMP_KEYS.filter((key) => next.lampen?.[key] === false).length : 0;
    const longest = derived.longest;
    below = (
      <div className="fl-notes" data-fl-notes="regel">
        {derived.runs.map((run) => {
          const from = formatShortDay(check.rows[run.from]?.woche ?? "", locale);
          const to = formatShortDay(check.rows[run.to]?.woche ?? "", locale);
          return (
            <p key={run.from}>
              {run.from === run.to
                ? fill(copy.regel.singleLine, { from, lamps: lampNames(run.lamps) })
                : fill(copy.regel.runLine, { from, to, lamps: lampNames(run.lamps) })}
            </p>
          );
        })}
        {longest && derived.cause ? (
          <p>
            {fill(copy.regel.lagLine, {
              lag: longest.from - derived.cause.t,
              note: derived.cause.note,
              length: longest.to - longest.from + 1,
            })}
          </p>
        ) : null}
        {next ? (
          <p className="fl-note-strong" data-fl-plan-line="">
            {next.lampen?.frei && next.planzahl !== undefined
              ? fill(copy.regel.planLineFree, { date: formatShortDay(next.woche, locale), plan: formatNumber(next.planzahl, locale) })
              : fill(copy.regel.planLineRed, { date: formatShortDay(next.woche, locale), count: nextRed })}
          </p>
        ) : null}
        <p>{fill(copy.regel.chance, { chance: formatPercent(derived.chance.lamp, locale), window: PRUEF, min: TREFFER_MIN })}</p>
        <div className="fl-fields">{ownerField}</div>
        <div className="fl-row">
          <button
            type="button"
            className="fl-button is-primary"
            onClick={() => downloadRule(copy.product, kit, fehlmenge, rest)}
            data-fl-download-rule=""
          >
            {copy.regel.download}
          </button>
        </div>
      </div>
    );
  } else if (beat === "meine-daten") {
    stage = <OwnStage copy={copy} outcome={ownOutcome} series={ownSeries} />;
    caption = copy.own.caption;
    const onFile = async (file: File | undefined) => {
      if (!file) return;
      if (!/\.(csv|txt)$/i.test(file.name)) {
        setFileProblem("fileType");
        return;
      }
      if (file.size > MAX_BYTES) {
        setFileProblem("tooBig");
        return;
      }
      const text = await file.text();
      setFileProblem(null);
      setOwn((previous) => ({ ...previous, text, series: previous.series || file.name.replace(/\.(csv|txt)$/i, "") }));
      setOwnChecked(text);
    };
    lever = (
      <label className="fl-chip is-wide fl-file">
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="sr-only"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          data-fl-file=""
        />
        <span>{copy.own.file}</span>
      </label>
    );
    below = (
      <OwnPanel
        copy={copy}
        inputs={own}
        onChange={(next) => setOwn((previous) => ({ ...previous, ...next }))}
        onCheck={() => {
          setFileProblem(null);
          setOwnChecked(own.text);
        }}
        onClear={() => {
          setFileProblem(null);
          setOwn({ text: "", series: "", messlatte: "wie letzte Woche", short: "", left: "" });
          setOwnChecked("");
        }}
        outcome={ownOutcome}
        fileProblem={fileProblem}
        ownerField={ownerField}
        onDownloadRule={() => {
          if (ownOutcome.kind === "ok") downloadRule(ownSeries, ownOutcome, parseCost(own.short), parseCost(own.left));
        }}
        onDownloadCsv={() => {
          if (ownOutcome.kind === "ok") downloadCsv(ownSeries, ownOutcome);
        }}
      />
    );
  } else {
    const root = locale === "de" ? "prognose-pruefen" : "forecast-check";
    stage = (
      <div className="fl-stage">
        <KitMap root={root} label={copy.takeHome.treeLabel} tree={copy.takeHome.tree} />
      </div>
    );
    caption = copy.takeHome.caption;
    lever = (
      <a className="fl-chip is-wide" href={`#${TAKEHOME_TARGET_ID}`} data-fl-takehome="">
        {copy.takeHome.lever}
      </a>
    );
  }

  return (
    <div className="fl-root" data-fl-beat={beat}>
      <DemoStage label={copy.stageLabel} caption={caption}>
        {stage}
      </DemoStage>
      <DemoLever>{lever}</DemoLever>
      {below ? <div className="fl-below">{below}</div> : null}
    </div>
  );
}
