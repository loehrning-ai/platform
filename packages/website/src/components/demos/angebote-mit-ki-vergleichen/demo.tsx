"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { feldFor, GlasButton, GlasSegmented, GlasSheet, GlasToggle } from "@/components/demos/glas";
import { DemoDock, DemoGlasStage, revealIfOffscreen, useBeatClock, useBeatGate, useOnEscape, useOnRestart } from "@/components/demos/shell";
import { assemble } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/basis";
import { DEMO, HORIZON, KIT_BASIS, kitRows, STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { demoReducer, FREE_START, INITIAL_STATE, MOVES, type Unit } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/demo-state";
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
import { PAPER_MAX, PaperSlider } from "./paper";
import { Rangliste, type RankRow, type RankSize } from "./rangliste";
import { MailBody, MethodBody, SourceBody, type SourcePick } from "./sheets";
import { ClaudeStep, TakeHomeRows, type TakeHomeData } from "./takehome";
import "./demo.css";

const FILLED_BASIS = "vergleichsbasis-mit-zahlen.md";
/** Where the Mennige pool rests behind the offer in the lead (A, B, C from left to right). */
const POOL_X: Readonly<Record<OfferKey, number>> = { A: 0.2, B: 0.5, C: 0.82 };

/** How long a caption of a sorted delivery term stays before the next one: 250 ms a word, at least 2,4 s. */
export function readingMs(text: string): number {
  return Math.max(2400, text.split(/\s+/).filter(Boolean).length * 250 + 800);
}

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
  const [rates, setRates] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [stripOver, setStripOver] = useState(false);
  const strip = useRef<HTMLElement | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const free = clock.phase === "free";
  const guided = clock.phase === "guided";
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
    setRates(false);
    setHighlight(null);
    setTermStage("trucks");
    const url = new URL(window.location.href);
    if (url.searchParams.has("beat")) {
      url.searchParams.delete("beat");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  });
  useOnEscape(() => setHighlight(null));

  const move = view === "kipp" ? MOVES[state.move] : undefined;
  // Beat 2's "Weiter" walks through the five fields, the result and the method sheet first; its
  // "Zurück" walks back through the fields before it leaves the beat.
  useBeatGate(
    view === "kipp" ? true : null,
    () => {
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
    },
    () => {
      if (view !== "kipp" || state.move === 0) return false;
      if (state.move === 4 && paid) {
        setPaid(false);
        return true;
      }
      setSheet(null);
      dispatch({ type: "prevMove" });
      return true;
    },
  );

  // A sorted delivery term: its trucks drive while the caption says what they cost; after the time
  // it takes to read that, its pallets land and the caption follows; once all three are sorted, the sum.
  const lastTerm = state.lastTerm;
  const allSorted = OFFER_KEYS.every((key) => state.terms[key] !== null);
  useEffect(() => {
    if (lastTerm) setTermStage("trucks");
  }, [lastTerm]);
  const shownTermStage: TermStage = termStage === "done" && !allSorted ? "pallets" : termStage;

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
  // The result in one sentence for the take-home: the kit's names the two open questions to Kartovka.
  const resultLine =
    shownModel === fullKit
      ? fmt.t(pack.takehome.lineKit, { winner: shownModel.winner.name, gap: fmt.money(shownModel.gap), runner: shownModel.runner.name })
      : fmt.t(pack.takehome.lineOwn, { winner: shownModel.winner.name, gap: fmt.money(shownModel.gap), runner: shownModel.runner.name, decider: lineName(pack, shownModel.decider) });

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

  const guessRow = (option: string) => {
    const key = keyOf(option);
    if (!key) return;
    dispatch({ type: "guess", key });
    clock.commit();
  };

  const bench = (): ReactNode => {
    switch (view) {
      case "kipp":
        switch (move) {
          case "menge":
            return state.qty ? null : <RequestCard pack={pack} fmt={fmt} set={state.qty} strip={() => strip.current} onDrop={() => dispatch({ type: "qty" })} onOver={setStripOver} />;
          case "lieferort":
            return <TermsSort pack={pack} fmt={fmt} terms={state.terms} lastKey={lastTerm?.key ?? null} stage={shownTermStage} onSort={(key, payer) => dispatch({ type: "term", key, payer })} />;
          case "einmalig":
            return state.finds.length < OFFER_KEYS.length ? <Letters pack={pack} fmt={fmt} letters={data.letters} finds={state.finds} onFind={(key) => dispatch({ type: "find", key })} /> : null;
          default:
            return null;
        }
      case "papier":
        return (
          <PaperSlider
            pack={pack}
            fmt={fmt}
            kit={kit}
            v={state.v}
            cap={state.cap}
            flip={flip}
            showCap={state.crossed}
            onChange={(v) => dispatch({ type: "paper", v, flip })}
            onCap={(cap) => dispatch({ type: "cap", cap: cap >= PAPER_MAX ? null : cap })}
            onMail={() => setSheet({ kind: "mail" })}
          />
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
            <ClaudeStep
              pack={pack}
              fmt={fmt}
              data={data.takehome}
              rates={rates}
              onRates={setRates}
              onJump={(option) => {
                setHighlight(option);
                revealIfOffscreen(document.querySelector("[data-av4-rank-glass]"), clock.reducedMotion);
              }}
            />
            <TakeHomeRows pack={pack} fmt={fmt} data={data.takehome} own={shownModel !== fullKit} line={resultLine} onTable={downloadTable} onMail={() => downloadMail(shownModel)} />
          </>
        );
      default:
        return null;
    }
  };

  const freeAnswer = free ? freeSentence(pack, fmt, state, kit, own.rows) : "";
  const caption = ((): readonly string[] => {
    if (free) return [freeAnswer];
    if (view === "mitnehmen") return [rates ? pack.claude.mit : pack.claude.ohne];
    return captionFor(pack, fmt, { view, state, kit, termStage: shownTermStage, paid, own: own.rows, second: own.second });
  })();
  const captionText = caption.join(" ");

  // The caption of a sorted term holds as long as it takes to read it, then the next part follows.
  useEffect(() => {
    if (move !== "lieferort" || !lastTerm || termStage === "done") return;
    if (termStage === "pallets" && !allSorted) return;
    const next: TermStage = termStage === "trucks" ? (lastTerm.key === "A" ? "done" : "pallets") : "done";
    const timer = window.setTimeout(() => setTermStage(next), readingMs(captionText));
    return () => window.clearTimeout(timer);
  }, [allSorted, captionText, lastTerm, move, termStage]);

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

  // The dock names the field in view and where "Weiter" leads, so the beat has one progress line.
  // The labels stay short enough that the path and its buttons share one row on a phone.
  const dockStep = guided && view === "kipp" ? (move ? pack.moves.steps[move] : pack.moves.done) : undefined;
  const dockNext = ((): string | undefined => {
    if (!guided) return undefined;
    switch (view) {
      case "tipp":
        return pack.moves.toBasis;
      case "kipp":
        if (move === "zahlung") return paid || !state.discount ? pack.moves.next.zahlung : pack.moves.nextResult;
        return move ? pack.moves.next[move] : pack.moves.toPaper;
      case "papier":
      case "deins":
        return fmt.t(pack.moves.toStep, { n: clock.index + 2 });
      default:
        return undefined;
    }
  })();

  const benchNode = bench();
  // On a phone the Rangliste gives a workbench the room: the three totals in a row beside a
  // workbench, one line per offer otherwise; two lines per offer only for the guess and the take-home.
  const size: RankSize = view === "tipp" || view === "mitnehmen" ? "full" : benchNode ? "mini" : "compact";
  const sourceTitle = sheet?.kind === "source" ? fmt.t(pack.source.title, { line: lineName(pack, sheet.pick.line), option: offerName(pack, sheet.pick.option) }) : "";
  const keypadTitle = sheet?.kind === "keypad" ? fmt.t(pack.deins.keypadTitle, { line: lineName(pack, sheet.pick.line), option: sheet.pick.option }) : "";
  const tall = view === "mitnehmen";

  return (
    <>
      <DemoGlasStage
        label={pack.stageLabel}
        feld={feld}
        className="av4-stage"
        style={tall ? { height: "auto", minHeight: "var(--demo4-stage-h)" } : undefined}
        dock={
          <div className="av4-dock-wrap" hidden={sheet !== null || undefined} data-av4-dock="">
            <DemoDock className="av4-dock" step={dockStep} nextLabel={dockNext}>
              <DockCaption sentences={caption} />
              {controls()}
            </DemoDock>
          </div>
        }
      >
        <div className="av4-data" data-av4-data="" data-av4-view={view} data-move={move} data-size={size} data-bench={benchNode ? "" : undefined}>
          <p className="av4-head" data-av4-head="">
            {stage.cheapest ? pack.rank.label : pack.rank.labelKit}
          </p>
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
                floor={stage.floor}
                guess={state.guess ? TERMS[state.guess].option : null}
                cheapest={stage.cheapest}
                label={stage.cheapest ? pack.rank.label : pack.rank.labelKit}
                onSegment={view === "tipp" ? undefined : onSegment}
                onRow={view === "tipp" && guided ? guessRow : undefined}
                rowAction={(row) => fmt.t(pack.tipp.pick, { option: row.name })}
                highlight={highlight}
                size={size}
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
