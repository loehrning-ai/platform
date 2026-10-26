"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { feldFor, GlasButton, GlasSegmented, GlasSheet, GlasToggle } from "@/components/demos/glas";
import { DemoDock, DemoGlasStage, revealIfOffscreen, setTakeHomeLine, useBeatClock, useBeatGate, useOnEscape, useOnRestart } from "@/components/demos/shell";
import { assemble } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/basis";
import { BEATS } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/beats";
import { DEMO, HORIZON, KIT_BASIS, kitRows, STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { demoReducer, FREE_START, INITIAL_STATE, MOVES, moveDone, type Unit } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/demo-state";
import { BASIS_TEMPLATE, SECOND_CASE_CSV } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/kit-data";
import { keyOf, OFFER_KEYS, printedPrice, TERMS, unitCents, type OfferKey } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import { compute, parse, type CostRow, type StackModel } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import { ALL_LINES, paperNumbers, stageView, type View } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stage";
import { fillTemplate, templateVars } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/template";
import { captionFor, deciderSentence, freeSentence, type TermStage } from "./captions";
import { DockCaption } from "./dock-caption";
import { downloadText } from "./download";
import { formatter } from "./fmt";
import { FreeLevers } from "./free";
import { Letters } from "./letters";
import { TermsSort } from "./lieferort";
import { QtyStrip, RequestCard } from "./menge";
import { draftToCsv, DRAFT_KEY, Keypad, NO_OWN, OwnEditor, readOwn, rowsToDraft, type OwnState } from "./own";
import { PaperSlider } from "./paper";
import { Rangliste, type CapHandle, type RankRow } from "./rangliste";
import { MailBody, MethodBody, SourceBody, type SourcePick } from "./sheets";
import { Composer, fileSetOf, TakeHomeRows, type FileKey, type TakeHomeData } from "./takehome";
import "./demo.css";

const SLUG = "angebote-mit-ki-vergleichen";
const FILLED_BASIS = "vergleichsbasis-mit-zahlen.md";
/** How long the trucks of a sorted term drive before its pallets land (the caption follows). */
const TERM_STEP_MS = 1600;
/** Where the Mennige pool rests behind the offer in the lead (A, B, C from left to right). */
const POOL_X: Readonly<Record<OfferKey, number>> = { A: 0.2, B: 0.5, C: 0.82 };

export interface DemoData {
  /** The three offers as the kit writes them (fall/angebot-*.md). */
  readonly letters: Readonly<Record<OfferKey, string>>;
  readonly takehome: TakeHomeData;
}

type Sheet =
  | { readonly kind: "source"; readonly pick: SourcePick }
  | { readonly kind: "keypad"; readonly pick: SourcePick }
  | { readonly kind: "method" }
  | { readonly kind: "mail" }
  | { readonly kind: "more" }
  | { readonly kind: "free" };

/** "C Brno" → "c-brno": lower case, diacritics folded, spaces to hyphens. */
export function fileSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function saveDraft(text: string): void {
  try {
    if (text) window.localStorage.setItem(DRAFT_KEY, text);
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // No storage in this browser: the draft lives only in the tab.
  }
}

function lineName(pack: DemoPack, line: string): string {
  return pack.lineNames[line as keyof DemoPack["lineNames"]] ?? line;
}

function offerName(pack: DemoPack, option: string): string {
  const key = keyOf(option);
  return key ? pack.offers[key].name : option;
}

export default function Demo({ pack, data }: { readonly pack: DemoPack; readonly data: DemoData }) {
  const clock = useBeatClock();
  const lang = pack.locale === "en" ? "en" : "de";
  const fmt = useMemo(() => formatter(lang), [lang]);
  const kit = useMemo(() => kitRows(lang), [lang]);
  const second = useMemo(() => parse(SECOND_CASE_CSV, lang, STACK).rows, [lang]);
  const [state, dispatch] = useReducer(demoReducer, INITIAL_STATE);
  const [own, setOwn] = useState<OwnState>(NO_OWN);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [termStage, setTermStage] = useState<TermStage>("trucks");
  const [paid, setPaid] = useState(false);
  const [attached, setAttached] = useState<readonly FileKey[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [stripOver, setStripOver] = useState(false);
  const strip = useRef<HTMLElement | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const free = clock.phase === "free";
  const view: View = clock.phase === "intro" ? "tipp" : free ? "free" : (clock.beat.id as View);
  const paperAtZero = useMemo(() => paperNumbers(kit, 0, null), [kit]);
  const flip = paperAtZero.flip;
  const stage = stageView({ view, state, kit, own: own.rows });
  const fullKit = useMemo(() => assemble(kit, ALL_LINES, STACK, HORIZON), [kit]);
  const ownModel = useMemo(() => (own.rows ? compute(own.rows, HORIZON, null, STACK) : null), [own.rows]);
  const shownModel: StackModel = ownModel && ownModel.complete ? ownModel : fullKit;

  // The draft of pasted text, from this browser only (never the rows).
  useEffect(() => {
    try {
      const text = window.localStorage.getItem(DRAFT_KEY);
      if (text) setOwn((current) => ({ ...current, text }));
    } catch {
      // Storage blocked: start empty.
    }
  }, []);

  const beatId = clock.beat.id;
  const lastBeat = useRef(beatId);
  // The beat a deep link opens with a sheet raised: arriving there keeps the sheet once.
  const keepSheetOn = useRef<string | null>(null);
  // Old links to the method beat open the end of beat 2 with the method sheet raised.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current) return;
    deepLinked.current = true;
    if (new URLSearchParams(window.location.search).get("beat") !== "methode") return;
    const at = clock.beats.findIndex((beat) => beat.id === "kipp");
    if (at < 0) return;
    keepSheetOn.current = "kipp";
    clock.seek(at, "load");
    dispatch({ type: "method" });
    setSheet({ kind: "method" });
  }, [clock]);

  // A sorted delivery term: the trucks arrive, then the pallets land, then (all sorted) the sum.
  const lastTerm = state.lastTerm;
  const lastKey = lastTerm?.key ?? null;
  const allSorted = OFFER_KEYS.every((key) => state.terms[key] !== null);
  useEffect(() => {
    if (!lastTerm) return;
    setTermStage("trucks");
    const timer = window.setTimeout(() => setTermStage(lastTerm.key === "A" ? "done" : "pallets"), TERM_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [lastTerm]);
  useEffect(() => {
    if (termStage !== "pallets" || !allSorted) return;
    const timer = window.setTimeout(() => setTermStage("done"), TERM_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [allSorted, termStage]);
  const shownTermStage: TermStage = termStage === "done" && !allSorted ? "pallets" : termStage;

  // Free play always opens as printed with every field off, in the sheet "Die Basis".
  useEffect(() => {
    if (clock.phase !== "free") return;
    dispatch({ type: "free", patch: FREE_START });
    setSheet({ kind: "free" });
  }, [clock.phase]);

  // A new beat closes what the last one opened (the deep link's method sheet stays).
  useEffect(() => {
    if (lastBeat.current === beatId) return;
    lastBeat.current = beatId;
    if (keepSheetOn.current === beatId) {
      keepSheetOn.current = null;
      return;
    }
    if (clock.phase === "guided") setSheet(null);
    setHighlight(null);
  }, [beatId, clock.phase]);

  useOnRestart(() => {
    dispatch({ type: "restart" });
    setSheet(null);
    setPaid(false);
    setAttached([]);
    setHighlight(null);
    setTermStage("trucks");
    const url = new URL(window.location.href);
    if (url.searchParams.has("beat")) {
      url.searchParams.delete("beat");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  });
  useOnEscape(() => setHighlight(null));

  // Beat 2's "Weiter" walks through the five fields, the result and the method sheet first.
  useBeatGate(view === "kipp" ? true : null, () => {
    if (view !== "kipp") return false;
    if (state.move < 4) {
      dispatch({ type: "nextMove" });
      return true;
    }
    if (state.move === 4) {
      if (!paid && state.discount) {
        setPaid(true);
        return true;
      }
      dispatch({ type: "nextMove" });
      setSheet({ kind: "method" });
      return true;
    }
    setSheet(null);
    return false;
  });

  // The personal line of "Für deinen Claude": the result on the stage, the kit's or the visitor's.
  useEffect(() => {
    setTakeHomeLine(
      SLUG,
      fmt.t(pack.takehome.line, { winner: shownModel.winner.name, gap: fmt.money(shownModel.gap), runner: shownModel.runner.name, decider: lineName(pack, shownModel.decider) }),
    );
  }, [fmt, pack, shownModel]);

  const applyOwn = (rows: readonly CostRow[], isSecond: boolean) => setOwn((current) => ({ ...current, rows, draft: rowsToDraft(rows, lang), errors: [], second: isSecond }));
  const read = (text: string) => {
    const result = readOwn(text, lang);
    if (result.rows) applyOwn(result.rows, false);
    else setOwn((current) => ({ ...current, errors: result.errors }));
  };

  const mailText = (model: StackModel) => fillTemplate(data.takehome.mail, model, templateVars(model, DEMO.question), null);
  const downloadMail = (model: StackModel) => downloadText(`verhandlungsmail-an-${fileSlug(model.winner.name)}.md`, mailText(model));
  const downloadTable = () =>
    downloadText(FILLED_BASIS, fillTemplate(BASIS_TEMPLATE, shownModel, templateVars(shownModel, DEMO.question), shownModel === fullKit ? KIT_BASIS : null));

  // The Rangliste's rows, in a fixed DOM order; they move by rank.
  const rows: readonly RankRow[] = stage.own
    ? (stage.model?.options ?? []).map((option) => ({
        option: option.name,
        badge: option.name.slice(0, 1).toUpperCase(),
        name: option.name,
        bar: stage.bars?.find((bar) => bar.option === option.name) ?? null,
      }))
    : OFFER_KEYS.map((key) => ({
        option: TERMS[key].option,
        badge: key,
        name: pack.offers[key].name,
        printed: printedPrice(key),
        printedUnit: pack.rank.printedUnits[key] || undefined,
        perBox: fmt.unit(unitCents(key)),
        bar: stage.bars?.find((bar) => bar.option === TERMS[key].option) ?? null,
      }));
  const cheapestKey = stage.cheapest ? keyOf(stage.cheapest) : null;
  const feld = feldFor("kraft", [cheapestKey ? { x: POOL_X[cheapestKey], y: 0.16 } : undefined]);

  const surchargeCents = stage.bars?.flatMap((bar) => bar.segments).find((segment) => segment.kind === "Papier")?.cents ?? 0;
  const onSegment = (option: string, line: string) => {
    const missing = stage.model?.options.find((candidate) => candidate.name === option)?.missing.includes(line);
    setSheet(missing && stage.own ? { kind: "keypad", pick: { option, line } } : { kind: "source", pick: { option, line } });
  };

  const paperState = free ? { v: state.free.v, cap: state.free.cap } : { v: state.v, cap: state.cap };
  const capShown = (view === "papier" && state.crossed && state.v > 0) || (free && state.free.unit === "piece" && state.free.data === "kit" && state.free.v > 0);
  const capText = fmt.t(pack.papier.capSlider, { cap: fmt.pct(paperState.cap ?? paperState.v, 1) });
  const cap: CapHandle | null = capShown
    ? {
        option: TERMS.C.option,
        cap: paperState.cap,
        v: paperState.v,
        perPoint: paperAtZero.perPoint,
        label: capText,
        valueText: capText,
        onCap: (value) => (free ? dispatch({ type: "free", patch: { cap: value } }) : dispatch({ type: "cap", cap: value })),
      }
    : null;

  const move = view === "kipp" ? MOVES[state.move] : undefined;
  const guessRow = (option: string) => {
    const key = keyOf(option);
    if (!key) return;
    dispatch({ type: "guess", key });
    clock.commit();
  };

  // One line of progress at the top of the stage, beside the restart button (contract S2): the field
  // during the basis beat, the step otherwise.
  const beatIndex = BEATS.findIndex((beat) => beat.id === view);
  const stepLine = move
    ? fmt.t(pack.moves.of, { n: state.move + 1, name: pack.moves.names[move] })
    : free
      ? pack.free.title
      : fmt.t(pack.moves.step, { n: Math.max(0, beatIndex) + 1, name: BEATS[Math.max(0, beatIndex)]?.label[fmt.lang] ?? "" });
  const moveStrip = !move ? (
    <div className="av4-moves" data-av4-moves="">
      <p className="av4-move-of" data-av4-step={view}>
        {stepLine}
      </p>
    </div>
  ) : (
    <div className="av4-moves" data-av4-moves="">
      <p className="av4-move-of" data-av4-move={move}>
        {stepLine}
      </p>
      <ol className="av4-move-chips" aria-label={pack.moves.fieldsLabel}>
        {MOVES.map((name, index) => (
          <li key={name} data-current={index === state.move ? "" : undefined} data-done={index < state.move || moveDone(state, name) ? "" : undefined}>
            {pack.moves.names[name]}
          </li>
        ))}
      </ol>
      {state.move > 0 ? (
        <GlasButton variant="plain" size="compact" icon="back" onClick={() => dispatch({ type: "prevMove" })} data-av4-prev-move="">
          {pack.moves.names[MOVES[state.move - 1] ?? "menge"]}
        </GlasButton>
      ) : null}
    </div>
  );

  const bench = (): ReactNode => {
    switch (view) {
      case "kipp":
        switch (move) {
          case "menge":
            return state.qty ? null : <RequestCard pack={pack} fmt={fmt} set={state.qty} strip={() => strip.current} onDrop={() => dispatch({ type: "qty" })} onOver={setStripOver} />;
          case "lieferort":
            return <TermsSort pack={pack} fmt={fmt} terms={state.terms} lastKey={lastKey} onSort={(key, payer) => dispatch({ type: "term", key, payer })} />;
          case "einmalig":
            return state.finds.length < OFFER_KEYS.length ? <Letters pack={pack} fmt={fmt} letters={data.letters} finds={state.finds} onFind={(key) => dispatch({ type: "find", key })} /> : null;
          default:
            return null;
        }
      case "papier":
        return (
          <div className="av4-paper-bench">
            <PaperSlider pack={pack} fmt={fmt} kit={kit} v={state.v} cap={state.cap} flip={flip} onChange={(v) => dispatch({ type: "paper", v, flip })} />
          </div>
        );
      case "deins":
        return (
          <OwnEditor
            pack={pack}
            fmt={fmt}
            own={own}
            onText={(text) => {
              setOwn((current) => ({ ...current, text }));
              saveDraft(text);
            }}
            onDraft={(draft) => setOwn((current) => ({ ...current, draft }))}
            onEditor={(editor) => setOwn((current) => ({ ...current, editor }))}
            onCompare={() => read(own.text.trim() ? own.text : draftToCsv(own.draft))}
            onFile={read}
            onSecond={() => applyOwn(second, true)}
            onClear={() => {
              setOwn(NO_OWN);
              saveDraft("");
            }}
          />
        );
      case "mitnehmen":
        return (
          <>
            <Composer
              pack={pack}
              fmt={fmt}
              data={data.takehome}
              attached={attached}
              onAttached={setAttached}
              reducedMotion={clock.reducedMotion}
              onJump={(option) => {
                setHighlight(option);
                revealIfOffscreen(document.querySelector("[data-demo-stage]"), clock.reducedMotion);
              }}
            />
            <TakeHomeRows pack={pack} fmt={fmt} data={data.takehome} own={shownModel !== fullKit} onTable={downloadTable} onMail={() => downloadMail(shownModel)} />
          </>
        );
      default:
        return null;
    }
  };

  const freeAnswer = free ? freeSentence(pack, fmt, state, kit, own.rows) : "";
  const caption = ((): readonly string[] => {
    if (free) return [freeAnswer];
    if (view === "mitnehmen") {
      if (attached.length === 0) return [pack.claude.trayHint];
      const set = fileSetOf(attached);
      return [set === "mit-saetzen" ? pack.claude.mit : set === "ohne-saetze" ? pack.claude.ohne : pack.claude.none];
    }
    return captionFor(pack, fmt, { view, state, kit, termStage: shownTermStage, paid, own: own.rows, second: own.second });
  })();

  const controls = (): ReactNode => {
    if (clock.phase === "intro") return null;
    switch (view) {
      case "tipp":
        return state.guess === null ? (
          <GlasButton variant="plain" size="compact" onClick={clock.next} data-av4-skip="">
            {pack.tipp.skip}
          </GlasButton>
        ) : null;
      case "kipp":
        if (move === "menge" && state.qty) {
          return (
            <GlasButton variant="plain" size="compact" icon="info" onClick={() => setSheet({ kind: "more" })} data-av4-more="">
              {pack.more}
            </GlasButton>
          );
        }
        if (move === "zahlung") {
          return (
            <GlasToggle
              checked={state.discount}
              onChange={(on) => {
                dispatch({ type: "discount", on });
                if (on) setPaid(true);
              }}
              label={pack.zahlung.toggle}
            />
          );
        }
        if (state.move >= 5) {
          return (
            <GlasButton variant="fill" size="compact" icon="doc" onClick={() => setSheet({ kind: "method" })} data-av4-method-open="">
              {pack.methode.title}
            </GlasButton>
          );
        }
        return null;
      case "papier":
        return state.crossed || state.cap !== null ? (
          <GlasButton variant="fill" size="compact" icon="doc" onClick={() => setSheet({ kind: "mail" })} data-av4-mail-open="">
            {pack.papier.mail}
          </GlasButton>
        ) : null;
      case "free":
        return (
          <GlasButton variant="fill" size="compact" icon="sliders" onClick={() => setSheet({ kind: "free" })} aria-expanded={sheet?.kind === "free"} data-av4-free-open="">
            {pack.free.open}
          </GlasButton>
        );
      default:
        return null;
    }
  };

  const benchNode = bench();
  const compact = view === "mitnehmen" || view === "deins" || move === "einmalig" || move === "lieferort";
  const sourceTitle = sheet?.kind === "source" ? fmt.t(pack.source.title, { line: lineName(pack, sheet.pick.line), option: offerName(pack, sheet.pick.option) }) : "";
  const keypadTitle = sheet?.kind === "keypad" ? fmt.t(pack.deins.keypadTitle, { line: lineName(pack, sheet.pick.line), option: sheet.pick.option }) : "";

  return (
    <>
      <DemoGlasStage
        label={pack.stageLabel}
        feld={feld}
        className="av4-stage"
        dock={
          <div className="av4-dock-wrap" hidden={sheet !== null || undefined} data-av4-dock="">
            <DemoDock className="av4-dock">
              <DockCaption sentences={caption} more={pack.captionMore} less={pack.captionLess} />
              {controls()}
            </DemoDock>
          </div>
        }
      >
        <div className="av4-data" data-av4-view={view} data-move={move} data-bench={benchNode ? "" : undefined}>
          {moveStrip}
          {move === "einheit" ? (
            <div className="av4-unit">
              <GlasSegmented<Unit>
                label={pack.einheit.control}
                options={[
                  { value: "printed", label: pack.einheit.printed },
                  { value: "piece", label: pack.einheit.piece },
                ]}
                value={state.unit}
                onChange={(unit) => dispatch({ type: "unit", unit })}
              />
            </div>
          ) : null}
          {move === "menge" || move === "einheit" ? (
            <QtyStrip
              pack={pack}
              fmt={fmt}
              set={state.qty}
              over={stripOver}
              stripRef={(element) => {
                strip.current = element;
              }}
            />
          ) : null}
          <div className="av4-layout">
            <div className="av4-rank-wrap">
              <Rangliste
                pack={pack}
                fmt={fmt}
                rows={rows}
                order={stage.order}
                mode={stage.mode}
                scale={stage.scale}
                guess={state.guess ? TERMS[state.guess].option : null}
                cheapest={stage.cheapest}
                cap={cap}
                label={stage.cheapest ? pack.rank.label : pack.rank.labelKit}
                onSegment={view === "tipp" ? undefined : onSegment}
                onRow={view === "tipp" && clock.phase === "guided" ? guessRow : undefined}
                rowAction={(row) => fmt.t(pack.tipp.pick, { option: row.name })}
                highlight={highlight}
                compact={compact}
                perBox={move === "einheit" && state.unit === "piece"}
              />
            </div>
            {benchNode ? <div className="av4-bench">{benchNode}</div> : null}
          </div>
        </div>
      </DemoGlasStage>

      <GlasSheet open={sheet?.kind === "source"} onClose={closeSheet} title={sourceTitle} closeLabel={pack.close} resizeLabel={pack.resize} modal={false}>
        {sheet?.kind === "source" ? <SourceBody pack={pack} fmt={fmt} pick={sheet.pick} model={stage.model} own={stage.own} surchargeCents={surchargeCents} /> : null}
      </GlasSheet>
      <GlasSheet open={sheet?.kind === "keypad"} onClose={closeSheet} title={keypadTitle} closeLabel={pack.close} resizeLabel={pack.resize}>
        {sheet?.kind === "keypad" ? (
          <Keypad
            pack={pack}
            fmt={fmt}
            onConfirm={(cents) => {
              const pick = sheet.pick;
              const per = ownModel?.options.find((option) => option.per[pick.line])?.per[pick.line] ?? "recurring";
              applyOwn([...(own.rows ?? []), { option: pick.option, line: pick.line, cents, per, src: "" }], own.second);
              setSheet(null);
            }}
          />
        ) : null}
      </GlasSheet>
      <GlasSheet open={sheet?.kind === "method"} onClose={closeSheet} title={pack.methode.title} closeLabel={pack.close} resizeLabel={pack.resize} modal={false}>
        <MethodBody pack={pack} state={state} decider={deciderSentence(pack, fmt, kit)} onNext={clock.next} />
      </GlasSheet>
      <GlasSheet open={sheet?.kind === "mail"} onClose={closeSheet} title={pack.papier.mailTitle} closeLabel={pack.close} resizeLabel={pack.resize} detent="large">
        <MailBody pack={pack} fmt={fmt} text={mailText(fullKit)} cap={state.cap} onDownload={() => downloadMail(fullKit)} />
      </GlasSheet>
      <GlasSheet open={sheet?.kind === "more"} onClose={closeSheet} title={pack.more} closeLabel={pack.close} resizeLabel={pack.resize} modal={false}>
        <div className="av4-sheet-body">
          <p>{pack.menge.more}</p>
          <p className="av4-from">angebot-a-nuernberg.md</p>
        </div>
      </GlasSheet>
      <GlasSheet open={sheet?.kind === "free"} onClose={closeSheet} title={pack.free.title} closeLabel={pack.close} resizeLabel={pack.resize} modal={false}>
        <FreeLevers
          pack={pack}
          fmt={fmt}
          kit={kit}
          free={state.free}
          flip={flip}
          hasOwn={own.rows !== null}
          answer={freeAnswer}
          onChange={(patch) => dispatch({ type: "free", patch })}
          onGuide={() => {
            setSheet(null);
            clock.toGuide();
          }}
        />
      </GlasSheet>
    </>
  );
}
