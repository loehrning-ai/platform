"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DemoLever,
  DemoStage,
  FILE_CHIP,
  revealIfOffscreen,
  setTakeHomeLine,
  TAKEHOME_TARGET_ID,
  useBeatClock,
  useOnRestart,
} from "@/components/demos/shell";
import type { Pack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { DEMO, HORIZON, KIT_BASIS, kitRows, modelAt, PAPER, paperFlip, STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import { BASIS_TEMPLATE, SECOND_CASE_CSV } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/kit-data";
import {
  compute,
  fill,
  fmtEur,
  fmtNumber,
  parse,
  type CostRow,
  type Lang,
  type ParseError,
  type StackModel,
} from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import { fillTemplate, firstMissing, missingSentence, templateVars } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/template";
import { downloadText } from "./download";
import { OwnLines } from "./own-lines";
import { Sources } from "./sources";
import { StackChart } from "./stack-chart";
import "./offers.css";

const SLUG = "angebote-mit-ki-vergleichen";
/** The filled basis has its own name: the blank template in the take-home block is vergleichsbasis.md. */
const FILLED_BASIS = "vergleichsbasis-mit-zahlen.md";

/** What the visitor did in the beats; "Von vorn" clears it, never their own lines. */
interface Bets {
  readonly bet: string | null;
  readonly selected: string | null;
  readonly stop: number;
}
const START: Bets = { bet: null, selected: null, stop: 0 };

/** The visitor's own lines: the text, and the rows once "Rechnen" read them without an error. */
interface Own {
  readonly text: string;
  readonly rows: readonly CostRow[] | null;
  readonly errors: readonly ParseError[];
}
const NO_OWN: Own = { text: "", rows: null, errors: [] };

export default function Demo({ pack }: { readonly pack: Pack }) {
  const clock = useBeatClock();
  const lang: Lang = pack.locale === "en" ? "en" : "de";
  const kit = useMemo(() => kitRows(lang), [lang]);
  const flip = useMemo(() => paperFlip(kit), [kit]);
  const [bets, setBets] = useState<Bets>(START);
  const [own, setOwn] = useState<Own>(NO_OWN);
  const ownRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const name = (line: string) => pack.lineNames[line] ?? line;
  // In a caption a number never breaks from its unit ("962 €", "+10 %").
  const bound = (text: string) => text.replace(/(\d) (€|%)/g, "$1\u00a0$2");
  const money = (cents: number) => bound(fmtEur(cents, lang));

  useOnRestart(() => {
    setBets(START);
    revealIfOffscreen(rootRef.current?.querySelector("[data-demo-stage]") ?? null, clock.reducedMotion);
    const url = new URL(window.location.href);
    if (url.searchParams.has("beat")) {
      url.searchParams.delete("beat");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  });

  const id = clock.beat.id;
  const ownApplied = own.rows !== null;
  const kitModel = modelAt(kit, 0);
  const paperModel = modelAt(kit, bets.stop);
  const ownModel: StackModel | null = own.rows ? compute(own.rows, HORIZON, null, STACK) : null;
  // The take-home and the own beat read the visitor's lines once applied, the kit's otherwise.
  const shownModel = ownModel ?? kitModel;

  // Row 1 of "Für deinen Claude": the visitor's own result, or their open line. Never the kit's.
  const takeLine = ownModel ? (ownModel.complete ? fill(pack.mitnehmen.line, vars(ownModel)) : missingSentence(ownModel, pack.deins)) : "";
  useEffect(() => {
    setTakeHomeLine(SLUG, takeLine);
  }, [takeLine]);

  function vars(model: StackModel): Record<string, string> {
    const bet = bets.bet ?? `${model.headWinner.name} (${pack.suggested})`;
    return {
      bet,
      winner: model.winner.name,
      winner_total: money(model.winner.total),
      runner: model.runner.name,
      runner_total: money(model.runner.total),
      gap: money(model.gap),
      headline_winner: model.headWinner.name,
      headline_gap: money(model.headGap),
      last: model.last.name,
      last_total: money(model.last.total),
      decider: name(model.decider),
      factor: bound(fill(pack.papier.label, { v: fmtNumber(PAPER.index.values[bets.stop] ?? 0, 2, lang) })),
    };
  }

  let stage: ReactNode;
  let caption: ReactNode;
  let lever: ReactNode = null;
  let details: ReactNode = null;
  let rows: 1 | 2 = 1;

  if (id === "tipp") {
    stage = (
      <Scene kicker={pack.tipp.lever} file={DEMO.data}>
        <StackChart model={kitModel} phase="headline" progress={clock.progress} bet={bets.bet} pack={pack} lang={lang} />
      </Scene>
    );
    caption = fill(pack.tipp.caption, vars(kitModel));
    lever = (
      <div className="av-bets" role="group" aria-label={pack.tipp.lever}>
        {kitModel.options.map((option) => (
          <button
            key={option.name}
            type="button"
            className="av-button av-bet"
            aria-pressed={bets.bet === option.name}
            data-bet={option.name}
            onClick={() => {
              setBets((previous) => ({ ...previous, bet: option.name }));
              clock.commit();
              clock.seek(clock.index + 1);
            }}
          >
            {option.name}
          </button>
        ))}
      </div>
    );
  } else if (id === "kipp") {
    const done = clock.progress >= 1;
    stage = (
      <Scene kicker={pack.question} file="ANSWERS.md">
        <StackChart
          model={kitModel}
          phase={done ? "full" : "stack"}
          progress={clock.progress}
          bet={bets.bet}
          pack={pack}
          lang={lang}
          selected={bets.selected ?? kitModel.headWinner.name}
          onSelect={(selected) => setBets((previous) => ({ ...previous, selected }))}
        />
      </Scene>
    );
    caption = done ? fill(pack.kipp.caption, vars(kitModel)) : pack.kipp.running;
    details = done ? <Sources model={kitModel} option={bets.selected ?? kitModel.headWinner.name} pack={pack} lang={lang} /> : null;
  } else if (id === "methode") {
    stage = (
      <Scene kicker={pack.question} file={pack.methode.file}>
        <ol className="av-method">
          {pack.methode.lines.map((line, index) => (
            <li key={line} style={{ opacity: Math.min(1, clock.progress * 3 - index), transform: `translateY(${Math.max(0, 1 - (clock.progress * 3 - index)) * 8}px)` }}>
              <span className="av-method-n">{index + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </Scene>
    );
    caption = pack.methode.caption;
    lever = (
      <a className="av-button" href={pack.methode.kitHref} download>
        {pack.methode.download}
      </a>
    );
  } else if (id === "papier") {
    const flipText = flip
      ? fill(pack.papier.flip, { rival: flip.rival.split(" ")[0] ?? flip.rival, v: fmtNumber(flip.v, 2, lang) })
      : "";
    stage = (
      <Scene kicker={pack.papier.lever} file="fall/angebot-c-brno.md">
        {/* The guess was settled at the reveal; here the rows carry only who is cheapest, so a phone keeps two lines a row. */}
        <StackChart model={paperModel} phase="full" progress={1} bet={null} pack={pack} lang={lang} />
      </Scene>
    );
    caption = fill(pack.papier.caption, vars(paperModel));
    lever = (
      <fieldset className="av-stops">
        <legend className="av-stops-legend">
          {pack.papier.stops}
          {flipText ? <span className="av-stops-flip"> · {flipText}</span> : null}
        </legend>
        <div className="av-stops-row">
          {PAPER.index.values.map((value, stop) => (
            <label key={value} className="av-stop" data-past-flip={flip && value > flip.v ? "" : undefined}>
              <input
                type="radio"
                name="av-paper"
                value={stop}
                checked={bets.stop === stop}
                onChange={() => setBets((previous) => ({ ...previous, stop }))}
              />
              <span>{fill(pack.papier.stop, { v: fmtNumber(value, 2, lang) })}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
    rows = 2;
  } else if (id === "deins") {
    stage = (
      <Scene kicker={ownApplied ? pack.deins.ownShown : pack.deins.kitShown} file={ownApplied ? null : DEMO.data}>
        <StackChart model={shownModel} phase="full" progress={1} bet={null} pack={pack} lang={lang} />
      </Scene>
    );
    // The caption holds two lines at most: the result, or the first open line. Every open line is listed under the stage.
    caption = ownModel ? (ownModel.complete ? fill(pack.deins.result, vars(ownModel)) : firstMissing(ownModel, pack.deins.missing)) : pack.deins.caption;
    details = ownModel && !ownModel.complete ? <OpenLines model={ownModel} pack={pack} /> : null;
    lever = (
      <button
        type="button"
        className="av-button av-button-primary"
        onClick={() => {
          revealIfOffscreen(ownRef.current, clock.reducedMotion);
          ownRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
        }}
      >
        {pack.deins.lever}
      </button>
    );
  } else {
    stage = (
      <Scene kicker={pack.mitnehmen.kicker} file={null}>
        <ul className="av-takehome">
          {pack.mitnehmen.items.map(([file, text]) => (
            <li key={file}>
              <span className={FILE_CHIP}>{file}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Scene>
    );
    caption = pack.mitnehmen.caption;
    // The filled basis is this demo's own file, so it is the lever; the blank template sits in "Für deinen Claude".
    lever = (
      <div className="av-takehome-levers">
        <button
          type="button"
          className="av-button av-button-primary"
          data-av-basis=""
          onClick={() =>
            downloadText(
              FILLED_BASIS,
              fillTemplate(BASIS_TEMPLATE, shownModel, templateVars(shownModel, DEMO.question), ownApplied ? null : KIT_BASIS),
            )
          }
        >
          {pack.mitnehmen.basisDownload}
        </button>
        <button
          type="button"
          className="av-button"
          onClick={() => revealIfOffscreen(document.getElementById(TAKEHOME_TARGET_ID), clock.reducedMotion)}
        >
          {pack.mitnehmen.lever}
        </button>
      </div>
    );
    details = (
      <section className="av-basis" aria-labelledby="av-basis-head">
        <h2 id="av-basis-head" className="av-sources-head">
          {FILLED_BASIS}
        </h2>
        <p className="av-sources-hint">
          {pack.mitnehmen.basisNote} {ownApplied ? pack.mitnehmen.fromYours : pack.mitnehmen.fromKit}
        </p>
      </section>
    );
  }

  return (
    <div ref={rootRef} className="av-demo" data-av-demo="">
      <DemoStage label={pack.stageLabel} caption={caption}>
        {stage}
      </DemoStage>
      <DemoLever rows={rows}>{lever}</DemoLever>
      {details ? (
        <div className="av-details" data-details={id}>
          {details}
        </div>
      ) : null}
      {/* The form belongs to the own beat and the take-home; hidden, not unmounted, so a reset keeps what the visitor typed. */}
      <div hidden={id !== "deins" && id !== "mitnehmen"} data-own-wrap="">
        <OwnLines
          ref={ownRef}
          pack={pack}
          text={own.text}
          applied={ownApplied}
          errors={own.errors}
          onText={(text) => setOwn((previous) => ({ ...previous, text }))}
          onApply={() =>
            setOwn((previous) => {
              const parsed = parse(previous.text, lang, STACK);
              return parsed.errors.length > 0 ? { ...previous, rows: null, errors: parsed.errors } : { ...previous, rows: parsed.rows, errors: [] };
            })
          }
          onLoadSecond={() => {
            const parsed = parse(SECOND_CASE_CSV, lang, STACK);
            setOwn({ text: SECOND_CASE_CSV, rows: parsed.rows, errors: parsed.errors });
          }}
          onClear={() => setOwn(NO_OWN)}
        />
      </div>
    </div>
  );
}

/** Every line one of the visitor's offers lacks: open, never 0, until they give the number. */
function OpenLines({ model, pack }: { readonly model: StackModel; readonly pack: Pack }) {
  return (
    <section className="av-open" aria-labelledby="av-open-head" data-av-open="">
      <h2 id="av-open-head" className="av-sources-head">
        {pack.deins.openHead}
      </h2>
      <p className="av-sources-hint">{pack.deins.openNote}</p>
      <ul className="av-open-list">
        {model.missing.map((gap) => (
          <li key={`${gap.option}/${gap.line}`}>{fill(pack.deins.openItem, { option: gap.option, line: gap.line })}</li>
        ))}
      </ul>
    </section>
  );
}

/** A beat's frame inside the stage: the kicker line (clear of the restart button), a file chip, the drawing. */
function Scene({ kicker, file, children }: { readonly kicker: string; readonly file: string | null; readonly children: ReactNode }) {
  return (
    <div className="av-stage">
      <p className="av-kicker">{kicker}</p>
      {file ? (
        <p className="av-file">
          <span className={FILE_CHIP}>{file}</span>
        </p>
      ) : null}
      <div className="av-stage-body">{children}</div>
    </div>
  );
}
