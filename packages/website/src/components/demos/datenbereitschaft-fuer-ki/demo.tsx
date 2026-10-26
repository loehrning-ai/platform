"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { feldFor, GlasButton, GlasPanel, GlasSegmented, GlasSheet, GLAS_PRIORITY, useGlas } from "@/components/demos/glas";
import { DemoDock, DemoGlasStage, setTakeHomeLine, useBeatClock, useBeatGate, useOnEscape, useOnRestart } from "@/components/demos/shell";
import { aliasTarget, type BeatId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/beats";
import { clean, validateCard } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/card";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { CLAUDE_ANSWER, OPENING_DEC_2025, T1_EXPECTED } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { boxes, codesRight, demoReducer, INITIAL_STATE, moveDone, openingOf, pourDone, type Code, type DemoState, type Sent } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import { EXAMPLES, type ExampleId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/examples";
import { answerLine, CardCapsule, CardSheetBody } from "./card";
import { captionFor } from "./captions";
import { DockCaption } from "./dock-caption";
import { formatter, type Fmt } from "./fmt";
import { EMPTY_OWN, loadTable, ownCaption, OwnStage, readOwnFile, type OwnState } from "./own";
import { OwnForm, ownFills } from "./own-form";
import { SceneAnswer, TARGET_ATTR } from "./scene-answer";
import { ProjectSort, TestCard, TestMarks, TUB_DROP_ATTR } from "./scene-project";
import { QuestionBuilder, ViewPicker } from "./scene-question";
import { PourLayer, WhoCounts } from "./scene-who";
import { TakeHome, type TakeHomeHrefs } from "./takehome";
import { Tub } from "./tub";
import "./demo.css";

const SLUG = "datenbereitschaft-fuer-ki";
const SITE_KIT = "/workshops/datenbereitschaft-fuer-ki/";
/** The glossary terms each scene explains where they first appear (language-standard C.3, word for word). */
const TERMS: Readonly<Record<BeatId, readonly (keyof Pack["glossary"])[]>> = {
  antwort: ["endingMrr"],
  wanne: ["opening", "level", "change"],
  sicht: ["view"],
  "wer-zaehlt": ["level", "change"],
  projekt: ["lock", "test"],
  "deine-karte": ["level", "change"],
  mitnehmen: [],
};

function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(min-width: 64rem)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return desktop;
}

/** What the "Mehr dazu" sheet says on this beat, or null when the beat has none. */
function moreFor(pack: Pack, beat: BeatId, state: DemoState): string | null {
  if (beat === "antwort") return pack.answer.more;
  if (beat === "wanne") return state.readAsLevel ? pack.wanne.asLevel : pack.wanne.asChange;
  if (beat === "wer-zaehlt" && state.werMove === 2) return pack.wer.moreAC;
  if (beat === "projekt" && state.projektMove === 1 && state.lastFile === "contacts") return pack.projekt.contactsMore;
  return null;
}

/** The pour buttons of scene 4 move 1: the keyboard and tap path to the same three pours. */
function PourButtons({ pack, state, onPour }: { readonly pack: Pack; readonly state: DemoState; readonly onPour: (kind: "june" | "levels" | "changes" | "none") => void }) {
  const w = pack.wer;
  return (
    <div className="w03-pours" role="group" aria-label={w.segLabel}>
      {(["june", "levels", "changes"] as const).map((kind) => (
        <button key={kind} type="button" className="w03-pour-button" aria-pressed={state.pour.kind === kind} onClick={() => onPour(kind)} data-w03-pour={kind}>
          {w.segments[kind]}
        </button>
      ))}
      {state.pour.kind !== "none" ? (
        <button type="button" className="w03-pour-button" data-quiet="" onClick={() => onPour("none")}>
          {w.pourReset}
        </button>
      ) : null}
    </div>
  );
}

export default function Demo({ pack, hrefs, todayLine }: { readonly pack: Pack; readonly hrefs: TakeHomeHrefs; readonly todayLine: string | null }) {
  const fmt: Fmt = useMemo(() => formatter(pack), [pack]);
  const clock = useBeatClock();
  const [state, dispatch] = useReducer(demoReducer, INITIAL_STATE);
  const [own, setOwn] = useState<OwnState>(EMPTY_OWN);
  const [sheet, setSheet] = useState<null | "card" | "more">(null);
  const [hover, setHover] = useState<Sent | null>(null);
  const [hold, setHold] = useState<{ readonly x: number; readonly y: number } | null>(null);
  const desktop = useDesktop();
  const flat = useGlas().mode === "solid";
  const beat = clock.beat.id as BeatId;
  const free = clock.phase === "free";
  const reduced = clock.reducedMotion;
  const { commit, seek, index, next } = clock;

  // Old kit links (?beat=lesarten, grenze, test) land on their beat and move.
  useEffect(() => {
    const target = aliasTarget(new URLSearchParams(window.location.search).get("beat"));
    if (!target) return;
    seek(target.index, "load");
    dispatch({ type: "reach", beat: target.index, move: target.move });
  }, [seek]);

  // A jump or a deep link fills the boxes of the scenes before it with the card's own answers.
  useEffect(() => {
    dispatch({ type: "reach", beat: index });
  }, [index]);

  // On a phone the tub takes the full width and the stage scrolls, so its labels stay readable.
  const scrolls = beat === "deine-karte" || beat === "mitnehmen" || beat === "wer-zaehlt" || beat === "projekt" || beat === "sicht" || (!desktop && (beat === "wanne" || (beat === "antwort" && state.sent !== null)));
  // A new scene or move starts at the top of the stage, never where the last one was scrolled to.
  const mainRef = useRef<HTMLDivElement>(null);
  const sceneKey = `${beat}:${state.wanneMove}:${state.sichtMove}:${state.werMove}:${state.projektMove}`;
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [sceneKey]);

  useOnRestart(() => {
    dispatch({ type: "restart" });
    setSheet(null);
    setHold(null);
  });
  useOnEscape(() => setSheet(null));

  const send = useCallback(
    (to: Sent) => {
      dispatch({ type: "send", to });
      commit();
    },
    [commit],
  );

  // Inner moves: "Weiter" first opens move 2 of the scene, then the next scene.
  const gated = beat === "wanne" || beat === "sicht" || beat === "wer-zaehlt" || beat === "projekt";
  useBeatGate(gated && !free ? moveDone(state, beat) : null, () => {
    if (beat === "wanne" && state.wanneMove === 1) dispatch({ type: "wanneMove", move: 2 });
    else if (beat === "sicht" && state.sichtMove === 1) dispatch({ type: "sichtMove", move: 2 });
    else if (beat === "wer-zaehlt" && state.werMove === 1) dispatch({ type: "werMove", move: 2 });
    else if (beat === "projekt" && state.projektMove === 1) dispatch({ type: "projektMove", move: 2 });
    else return false;
    return true;
  });

  const ownReady = validateCard(own.card, pack.locale).length === 0;
  useEffect(() => {
    setTakeHomeLine(SLUG, ownReady ? clean(own.card.question) : "");
  }, [own.card.question, ownReady]);

  const test = () => {
    dispatch({ type: "test" });
    setSheet("card");
  };

  const takeExample = (id: ExampleId) => {
    const example = EXAMPLES.find((entry) => entry.id === id);
    if (!example) return;
    const preset = pack.presets.find((entry) => entry.id === id)?.card ?? null;
    setOwn((previous) => loadTable(previous, example.csv, example.csv.length, example.file, id, preset));
  };
  const takeFile = (file: File) => {
    void readOwnFile(file).then((read) => {
      if (typeof read === "string") setOwn((previous) => ({ ...previous, error: read }));
      else setOwn((previous) => loadTable(previous, read.text, read.bytes, file.name, null, null));
    });
  };

  // The card: the demo's five boxes, or the visitor's own on "Deine Karte".
  const onOwn = beat === "deine-karte";
  const fills = onOwn ? ownFills(own.card, pack.locale) : boxes(state);
  const right = state.viewPlaced;
  const answer = onOwn
    ? clean(own.card.metric)
    : answerLine(pack, fmt, right ? T1_EXPECTED : CLAUDE_ANSWER, state.tested ? pack.strip.stateTested : right ? pack.strip.stateView : pack.strip.stateOpen);
  const caption = onOwn ? ownCaption(pack, fmt, own) : captionFor(pack, fmt, beat, state, free);
  const more = onOwn ? null : moreFor(pack, beat, state);
  const kitFile = clock.beat.kitFile;

  const captionExtra: ReactNode = (
    <>
      {more ? (
        <button type="button" className="w03-caption-more" onClick={() => setSheet("more")} data-w03-more="">
          {pack.more}
        </button>
      ) : null}
      {kitFile ? (
        <a className="w03-kit" href={`${SITE_KIT}${kitFile}`} data-w03-kit-file={kitFile}>
          {pack.inKit} {kitFile.split("/").pop()}
        </a>
      ) : null}
    </>
  );
  const terms = TERMS[beat].map((key) => pack.glossary[key]);
  const captionNode = <DockCaption sentences={caption} more={pack.captionMore} less={pack.captionLess} extra={captionExtra} terms={terms} />;

  // The tub on the scenes that draw it.
  const tubCommon = { pack, fmt, reducedMotion: reduced, onHold: setHold, label: pack.stageLabel };
  let scene: ReactNode;
  if (beat === "antwort") {
    scene = state.sent ? (
      <div className="w03-answered">
        <Tub {...tubCommon} opening={0} edge={0} wide={false} ghost />
        <p className="w03-stamp" data-w03-stamp={state.sent}>
          {pack.answer.stamps[state.sent]}
        </p>
      </div>
    ) : (
      <SceneAnswer pack={pack} fmt={fmt} sent={state.sent} run={state.run} onRun={(run) => dispatch({ type: "run", run })} onSend={send} onHover={setHover} todayLine={todayLine} reducedMotion={reduced} />
    );
  } else if (beat === "wanne") {
    const second = state.wanneMove === 2 || free;
    scene = (
      <Tub
        {...tubCommon}
        opening={openingOf(state)}
        edge={state.edge}
        wide={second}
        ghost
        brackets={openingOf(state) > 0}
        asLevel={state.readAsLevel}
        onOpening={state.wanneMove === 1 || free ? (value) => dispatch({ type: "opening", value }) : undefined}
        onEdge={second ? (edge) => dispatch({ type: "edge", edge }) : undefined}
        computed={state.edge > 0}
      />
    );
  } else if (beat === "sicht") {
    scene =
      state.sichtMove === 1 && !free ? (
        <QuestionBuilder pack={pack} fmt={fmt} state={state} onChip={(chip) => dispatch({ type: "chip", chip })} onUnchip={(gap) => dispatch({ type: "unchip", gap })} />
      ) : (
        <div className="w03-sicht2">
          {free ? <QuestionBuilder pack={pack} fmt={fmt} state={state} onChip={(chip) => dispatch({ type: "chip", chip })} onUnchip={(gap) => dispatch({ type: "unchip", gap })} /> : null}
          <ViewPicker pack={pack} fmt={fmt} state={state} onTile={(tile) => dispatch({ type: "tile", tile })} />
        </div>
      );
  } else if (beat === "wer-zaehlt") {
    scene =
      state.werMove === 1 ? (
        <Tub {...tubCommon} opening={OPENING_DEC_2025} edge={0} wide={false} ghost={false} strips={false} layer={(geometry) => <PourLayer pack={pack} fmt={fmt} geometry={geometry} pour={state.pour} onPour={(pour) => dispatch({ type: "pour", pour })} reducedMotion={reduced} />} />
      ) : (
        <WhoCounts pack={pack} fmt={fmt} state={state} onCode={(code: Code, on: boolean) => dispatch({ type: "code", code, on })} onSearch={(on) => dispatch({ type: "search", on })} reducedMotion={reduced} />
      );
  } else if (beat === "projekt") {
    scene =
      state.projektMove === 1 ? (
        <ProjectSort pack={pack} fmt={fmt} state={state} onPlace={(file, side) => dispatch({ type: "place", file, side })} onSettle={() => dispatch({ type: "settle" })} reducedMotion={reduced} />
      ) : (
        <div className="w03-testing">
          <div className="w03-tubdrop" {...{ [TUB_DROP_ATTR]: "" }}>
            <Tub {...tubCommon} opening={OPENING_DEC_2025} edge={0} wide={false} ghost strips={false} layer={(geometry) => <TestMarks pack={pack} fmt={fmt} geometry={geometry} tested={state.tested} />} />
          </div>
          <TestCard pack={pack} fmt={fmt} tested={state.tested} onTest={test} />
        </div>
      );
  } else if (beat === "deine-karte") {
    scene = <OwnStage pack={pack} fmt={fmt} own={own} onChange={setOwn} onExample={takeExample} onFile={takeFile} />;
  } else {
    scene = (
      <div className="w03-final">
        <CardSheetBody pack={pack} fmt={fmt} fills={boxes(state)} expected={T1_EXPECTED} />
      </div>
    );
  }

  // The dock: this scene's own controls (the guided path is the shell's).
  let controls: ReactNode = null;
  if (beat === "antwort" && !state.sent) {
    controls = (
      <div className="w03-targets" role="group" aria-label={pack.answer.targetsLabel}>
        {(["ask", "report"] as const).map((to) => (
          <button key={to} type="button" className="w03-target" data-hover={hover === to ? "" : undefined} {...{ [TARGET_ATTR]: to }} onClick={() => send(to)} data-w03-send={to}>
            {pack.answer.targets[to]}
          </button>
        ))}
      </div>
    );
  } else if (beat === "wer-zaehlt" && state.werMove === 1) {
    controls = (
      <PourButtons
        pack={pack}
        state={state}
        onPour={(kind) => dispatch({ type: "pour", pour: kind === "none" ? { kind: "none", members: [] } : { kind, members: kind === "june" ? [2] : [0, 1, 2] } })}
      />
    );
  } else if (beat === "projekt" && state.projektMove === 2 && !state.tested) {
    controls = (
      <GlasButton variant="prominent" size="compact" onClick={test} data-w03-test="">
        {pack.projekt.testButton}
      </GlasButton>
    );
  }

  const halfWho = !pourDone(state) && codesRight(state);
  const sideCard = (
    <GlasPanel material="thick" shape="card" live={GLAS_PRIORITY.panel} className="w03-side" data-w03-side-panel="">
      <div className="w03-side-caption">{captionNode}</div>
      <p className="w03-side-title">{onOwn ? pack.own.boxesTitle : pack.strip.sheetTitle}</p>
      {onOwn ? null : <CardSheetBody pack={pack} fmt={fmt} fills={fills} expected={T1_EXPECTED} halfWho={halfWho} />}
    </GlasPanel>
  );

  const feld = feldFor("bloom", [undefined, undefined, hold ? { x: hold.x, y: Math.min(0.9, 0.12 + hold.y * 0.7) } : undefined]);

  return (
    <>
      <DemoGlasStage
        label={pack.stageLabel}
        feld={feld}
        className="w03-glasstage"
        dock={
          <DemoDock>
            {desktop ? null : captionNode}
            {controls}
          </DemoDock>
        }
      >
        <div className="w03-root" data-beat={beat} data-desktop={desktop ? "" : undefined} data-flat={flat ? "" : undefined} data-w03-beat={beat}>
          <div className="w03-top">
            <CardCapsule pack={pack} fmt={fmt} name={onOwn ? pack.own.boxesTitle : pack.strip.card} fills={fills} answer={answer} onOpen={() => setSheet("card")} expanded={sheet === "card"} />
            <span className="w03-invented">{pack.invented}</span>
          </div>
          <div className="w03-body">
            <div className="w03-main" ref={mainRef} data-scroll={scrolls ? "" : undefined}>
              {scene}
            </div>
            {desktop ? sideCard : null}
          </div>
        </div>
      </DemoGlasStage>

      {beat === "deine-karte" ? <OwnForm pack={pack} fmt={fmt} card={own.card} onChange={(card) => setOwn((previous) => ({ ...previous, card }))} onClear={() => setOwn(EMPTY_OWN)} /> : null}
      {beat === "mitnehmen" ? <TakeHome pack={pack} fmt={fmt} card={own.card} hrefs={hrefs} /> : null}

      <GlasSheet
        open={sheet === "card"}
        onClose={() => setSheet(null)}
        title={onOwn ? pack.own.boxesTitle : pack.strip.sheetTitle}
        closeLabel={pack.close}
        resizeLabel={pack.resize}
        detent="medium"
        footer={
          beat === "projekt" && state.tested ? (
            <GlasButton
              variant="prominent"
              block
              onClick={() => {
                setSheet(null);
                next();
              }}
              data-w03-sheet-next=""
            >
              {pack.strip.sheetNext}
            </GlasButton>
          ) : undefined
        }
      >
        <CardSheetBody pack={pack} fmt={fmt} fills={fills} expected={T1_EXPECTED} halfWho={halfWho} />
      </GlasSheet>
      <GlasSheet open={sheet === "more" && more !== null} onClose={() => setSheet(null)} title={beat === "wanne" ? pack.wanne.moreTitle : pack.more} closeLabel={pack.close} resizeLabel={pack.resize} detent="medium">
        {beat === "wanne" ? (
          <div className="w03-more">
            <GlasSegmented
              label={pack.wanne.switchLabel}
              options={[
                { value: "change", label: pack.wanne.switch.change },
                { value: "level", label: pack.wanne.switch.level },
              ]}
              value={state.readAsLevel ? "level" : "change"}
              onChange={(value) => dispatch({ type: "readAsLevel", on: value === "level" })}
            />
            <p>{more}</p>
          </div>
        ) : (
          <p className="w03-more">{more}</p>
        )}
      </GlasSheet>
    </>
  );
}
