"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, revealIfOffscreen, useBeatClock, useBeatGate, useOnEscape, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasChip, GlasSheet, GlasSlider, ESCAPE_PRIORITY, pushEscapeLayer } from "@/components/demos/glas";
import { BEATS, type BeatId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/beats";
import { breaksFor, eachCheckDistinct, survivors } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/breaks";
import type { WindowQuestion } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-takes";
import { ITEMS, itemById, windowMonthsOf, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { evaluate, TEST_ORDER, type Status, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { FOLDER_FILES, kitText, type FolderFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/kit";
import { buildModel } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { moveCard, ownBoard, type Moves, type Place } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-board";
import type { OwnFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-folder";
import { attachedFiles } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/probe";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { BenchHand, BenchStage, fullyRead, useBench } from "./bench";
import { Board } from "./board";
import { DockCaption } from "./dock-caption";
import { gapListMarkdown, indexCsv, instructionsText } from "./exports";
import { EvidenceView, PlainFile } from "./file-sheet";
import { formatter, testSentence, type Fmt } from "./fmt";
import { R5View } from "./r5-view";
import { ClaudeDock, ClaudeStage, countSentence, defaultClaudeState, summarySentence, useClaudeScene } from "./scene-claude";
import { OwnDock, OwnStage, readLines } from "./scene-own";
import { DRAFT, TakeHomeScene, type TakeHomeFiles } from "./scene-takehome";
import { useOwnFolder } from "./use-own-folder";
import "./w05.css";

const MODEL = buildModel();
const NO_CHECKS: ReadonlySet<TestId> = new Set();
const R7_KEYS: readonly ("policy" | "notes" | "report")[] = ["policy", "notes", "report"];
const R7_FILES = MODEL.r7.map((entry) => entry.doc.file as FolderFile);
const R7_REPORT = R7_FILES[2] as FolderFile;
const VENDOR = "vendor-page_claude_2026-06-15.md";

type Sheet =
  | { readonly kind: "file"; readonly file: string; readonly line: number | null }
  | { readonly kind: "request"; readonly id: ItemId }
  | { readonly kind: "step"; readonly id: ItemId }
  | { readonly kind: "checks" }
  | { readonly kind: "rule" }
  | { readonly kind: "own"; readonly name: string }
  | { readonly kind: "text"; readonly name: string; readonly text: string };

type LastSwitch = { readonly test: TestId; readonly on: boolean; readonly first: boolean } | null;

/** Clause 7 of the service contract, verbatim from the request. */
function clause7(): string {
  return /Clause 7[^:]*: "([^"]+)"/.exec(kitText("request_tannwald.md"))?.[1] ?? "";
}

function r7Key(file: FolderFile | null): "policy" | "notes" | "report" | null {
  const index = file ? R7_FILES.indexOf(file) : -1;
  return index < 0 ? null : (R7_KEYS[index] ?? null);
}

function checksCaption(fmt: Fmt, active: ReadonlySet<TestId>, last: LastSwitch, guess: number | null, r1Seen: boolean): string[] {
  const { copy } = fmt;
  if (active.size === 4) {
    // The dock's own button names the next step (R1), so the caption keeps to what the four tests left.
    return [
      fmt.t(copy.checks.allOn, { covered: fmt.word(survivors(MODEL.rows, active)) }),
      ...(guess !== null ? [fmt.t(copy.checks.guessed, { guess })] : []),
      ...(r1Seen && eachCheckDistinct(MODEL.rows) ? [copy.checks.distinct] : []),
    ];
  }
  if (!last) return [copy.checks.hint];
  const word = copy.checkInSentence[last.test];
  const k = breaksFor(MODEL.rows, new Set([last.test])).size;
  if (!last.on) return [fmt.t(k === 1 ? copy.checks.healOne : copy.checks.healMany, { check: word, k: fmt.word(k) })];
  const broke = fmt.t(k === 0 ? copy.checks.breakNone : k === 1 ? copy.checks.breakOne : copy.checks.breakMany, { check: word, k: fmt.word(k) });
  if (!last.first) return [broke];
  return [broke, fmt.t(copy.checks.def[last.test], { months: fmt.word(windowMonthsOf(MODEL.context.windowStart, MODEL.context.audit)), audit: fmt.date(MODEL.context.audit) })];
}

export default function Demo({
  copy,
  questions,
  files,
}: {
  readonly copy: W05Copy;
  readonly questions: readonly WindowQuestion[];
  readonly files: TakeHomeFiles;
}) {
  const clock = useBeatClock();
  const fmt = useMemo(() => formatter(copy), [copy]);
  const reduced = clock.reducedMotion;
  const free = clock.phase === "free";
  const beatId = clock.beat.id as BeatId;
  const view: BeatId | "free" = free ? "free" : beatId;

  const [draft, setDraft] = useState(4);
  // The slider was touched, focused or moved: its value, the first one too, is then a guess to keep.
  const [moved, setMoved] = useState(false);
  const [guess, setGuess] = useState<number | null>(null);
  const [active, setActive] = useState<ReadonlySet<TestId>>(NO_CHECKS);
  const [seen, setSeen] = useState<ReadonlySet<TestId>>(NO_CHECKS);
  const [last, setLast] = useState<LastSwitch>(null);
  const [front, setFront] = useState<ReadonlySet<ItemId>>(new Set());
  const [defShown, setDefShown] = useState<ReadonlySet<Status>>(new Set());
  const [def, setDef] = useState<Status | null>(null);
  const [r1Seen, setR1Seen] = useState(false);
  const [r5Merged, setR5Merged] = useState(false);
  const [ruleSeen, setRuleSeen] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // On a wide screen scenes 1 and 2 show what the visitor taps in a panel beside the board instead of a sheet.
  const wide = useWide();
  const [panel, setPanel] = useState<PanelSheet | null>(null);
  const [chosenGap, setChosenGap] = useState<ItemId | null>(null);
  // Scene 6: the sentences of the managing director's draft the visitor has checked.
  const [struck, setStruck] = useState<ReadonlySet<number>>(new Set());
  const [moves, setMoves] = useState<Moves>({});
  const [moving, setMoving] = useState<OwnFile | null>(null);
  const [ownAnswer, setOwnAnswer] = useState("");
  const scene = DEMOS_PAGE_COPY[fmt.locale].claudeScene;
  const claude = useClaudeScene(questions, { reducedMotion: reduced, visible: view === "claude" });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shownView = useRef(view);
  const own = useOwnFolder();
  const bench = useBench(MODEL.context, reduced);
  const board = useMemo(() => (own.result ? ownBoard(own.result.files, moves) : null), [own.result, moves]);

  // r and Shift+R: the kit state of every lever and scene 1; the visitor's own files and pasted answer stay.
  useOnRestart(() => {
    setDraft(4);
    setMoved(false);
    setGuess(null);
    setActive(NO_CHECKS);
    setSeen(NO_CHECKS);
    setLast(null);
    setFront(new Set());
    setDefShown(new Set());
    setDef(null);
    setR1Seen(false);
    setR5Merged(false);
    setRuleSeen(false);
    setSheet(null);
    setPanel(null);
    setChosenGap(null);
    setStruck(new Set());
    setMoving(null);
    claude.setState(defaultClaudeState(questions));
    bench.actions.reset("R7");
  });
  useOnEscape(() => {
    if (sheet === null) return false;
    setSheet(null);
    return true;
  });
  useEffect(() => {
    setSheet(null);
    setPanel(null);
  }, [view]);
  // A new beat brings the stage back into view when the visitor had scrolled away (never on load).
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    revealIfOffscreen(stageRef.current, reduced);
  }, [reduced, view]);
  // The bench holds R7 in scene 3; free play keeps whatever request the visitor picks.
  useEffect(() => {
    if (view === "r7" && bench.state.item !== "R7") bench.actions.reset("R7");
  }, [bench.actions, bench.state.item, view]);
  // Escape puts a lifted own card back.
  useEffect(() => (moving ? pushEscapeLayer(ESCAPE_PRIORITY.drag, () => setMoving(null)) : undefined), [moving]);
  // The deck's QR targets: #zitat-probe opens scene 5, #mitnehmen scene 6 (read once on load).
  useEffect(() => {
    const target = { "#zitat-probe": "claude", "#mitnehmen": "mitnehmen" }[window.location.hash];
    const index = target ? BEATS.findIndex((beat) => beat.id === target) : -1;
    if (index >= 0) clock.seek(index, "load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A status word is defined the first time its stamp appears, until the next switch.
  const stamps = useMemo(() => {
    const broken = breaksFor(MODEL.rows, active);
    const kinds = new Set<Status>(MODEL.rows.filter((row) => broken.has(row.item.id)).map((row) => row.naive.status));
    if (active.size === 4) kinds.add("covered");
    return kinds;
  }, [active]);
  useEffect(() => {
    const fresh = (["gap", "weak", "covered"] as const).find((kind) => stamps.has(kind) && !defShown.has(kind));
    if (!fresh) return;
    setDefShown((current) => new Set([...current, fresh]));
    setDef(fresh);
  }, [defShown, stamps]);

  const toggle = (test: TestId) => {
    const on = !active.has(test);
    const next = new Set(active);
    if (on) next.add(test);
    else next.delete(test);
    setActive(next);
    setLast({ test, on, first: on && !seen.has(test) });
    if (on) setSeen(new Set([...seen, test]));
    setFront(new Set());
    setDef(null);
    setPanel(null);
  };

  /** A request, step or file: in the panel beside the board on a wide screen in scenes 1 and 2, else in a sheet. */
  const show = (target: PanelSheet) => {
    if (wide && (view === "ordner" || view === "pruefungen")) setPanel(target);
    else setSheet(target);
  };
  const openR1 = () => {
    setR1Seen(true);
    show({ kind: "step", id: "R1" });
  };

  // Scene 2 waits for all four tests and R1, scene 3 for the report and the rules. Until then "Weiter" stays hidden and
  // the dock's own button names what comes next ("Weiter: R1 ansehen"), so no label promises the next scene too early.
  const reportRead = fullyRead(evaluate(itemById("R7"), R7_REPORT, MODEL.context), bench.state.visited[R7_REPORT] ?? []);
  const gateReady = view === "pruefungen" ? active.size === 4 && r1Seen : view === "r7" ? reportRead && ruleSeen : null;
  useBeatGate(gateReady);
  const openRules = () => {
    setRuleSeen(true);
    setSheet({ kind: "rule" });
  };

  const r7Name = (file: FolderFile) => {
    const key = r7Key(file);
    return key ? copy.r7.cards[key] : file;
  };

  const caption = captionFor();
  function captionFor(): string[] {
    switch (view) {
      case "ordner":
        // Before the guess the question stands above the board, so the dock keeps to the slider.
        return guess !== null ? [fmt.t(copy.folder.kept, { guess })] : [copy.folder.briefing];
      case "pruefungen":
        // A status word is defined in the caption the first time its stamp appears, so no readout covers a row.
        return [...checksCaption(fmt, active, last, guess, r1Seen), ...(def ? [copy.statusDef[def]] : [])];
      case "r7": {
        const { placed, lifted, first } = bench.state;
        if (lifted) return [fmt.t(copy.r7.lifted, { card: r7Name(lifted), item: "R7" })];
        if (reportRead && placed === R7_REPORT) return [...copy.r7.aha];
        if (!placed || !bench.evaluation) return [copy.r7.instruction];
        const key = r7Key(placed);
        const read = fullyRead(bench.evaluation, bench.state.visited[placed] ?? []);
        if (key && read) {
          const { date } = bench.evaluation.tests;
          return fmt.ts(copy.r7.verdict[key], { approved: fmt.date(date.used?.iso ?? ""), days: date.daysShort ?? 0 });
        }
        if (key && placed === first) return [copy.r7.first[key]];
        return [copy.sheet.lensHint];
      }
      case "ordner-eigen":
        return own.result ? [copy.own.afterDrop] : [copy.own.lead];
      case "claude": {
        const { replay, take, question, probe } = claude;
        if (!replay.started) return [copy.claude.lead];
        if (!replay.frame.done) return [copy.claude.streaming];
        const count = countSentence(fmt, take, question?.id, MODEL.tally);
        return [summarySentence(fmt, probe.marks), ...(count ? [count] : []), ...(claude.state.skill === "without" ? [copy.claude.compare] : []), copy.claude.huntCue];
      }
      case "mitnehmen":
        // First the draft: every sentence checked against the files; then the six open requests and their owners.
        if (struck.size < DRAFT.length) return [copy.takehome.draft.caption];
        return [fmt.t(copy.takehome.lead, { open: fmt.Word(MODEL.tally.weak + MODEL.tally.gap), gaps: fmt.word(MODEL.tally.gap), weak: fmt.word(MODEL.tally.weak) })];
      case "free": {
        const { evaluation } = bench;
        if (!evaluation) return [copy.free.instruction];
        const result = fmt.t(copy.free.result, { file: evaluation.doc.file, id: evaluation.item.id, status: copy.status[evaluation.status] });
        return evaluation.tests.quote.quote === null ? [result, copy.free.noAnswer] : [result];
      }
    }
  }

  // The attention light (the Mennige pool) sits on the rows the last switched check touched, or on the open lens.
  const attention: readonly ItemId[] = last ? [...breaksFor(MODEL.rows, new Set([last.test]))] : [];
  const lightRow = attention.length > 0 ? ITEMS.findIndex((item) => item.id === attention[0]) : -1;
  const feld = feldFor("sage", [
    { x: 0.2, y: 0.42 },
    { x: 0.78, y: 0.4 },
    lightRow >= 0 ? { x: 0.55, y: 0.12 + lightRow * 0.09 } : view === "r7" || view === "free" ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 0.96 },
  ]);

  const built = {
    instructions: instructionsText(copy, own.audit, fmt.locale),
    gapList: gapListMarkdown(MODEL, copy, fmt.locale),
    index: indexCsv(MODEL, board, copy, fmt.locale),
  };
  const currentTake = claude.take;
  const personal = own.audit !== "" && own.windowFrom !== null;
  const promptText = personal ? fmt.t(copy.claude.ownPrompt, { audit: fmt.date(own.audit), window: fmt.date(own.windowFrom ?? "") }) : (currentTake?.prompt ?? "");

  const data = (): ReactNode => {
    switch (view) {
      case "ordner":
      case "pruefungen": {
        const boardNode = (
          <Board
            model={MODEL}
            fmt={fmt}
            active={view === "ordner" ? NO_CHECKS : active}
            checking={view === "pruefungen"}
            drawn={reduced || clock.progress >= 1 || view !== "ordner"}
            matches={view === "ordner" ? { n: reduced ? MODEL.rows.length : Math.min(MODEL.rows.length, Math.round(clock.progress * MODEL.rows.length)), struck: guess !== null } : undefined}
            front={front}
            guess={guess}
            attention={attention}
            lead={view === "ordner" && guess === null && clock.phase !== "intro" ? copy.folder.question : undefined}
            onRequest={(id) => show(view === "ordner" ? { kind: "request", id } : { kind: "step", id })}
            onFile={(file) => show({ kind: "file", file, line: null })}
            onTurn={(id) => setFront((current) => (current.has(id) ? new Set([...current].filter((entry) => entry !== id)) : new Set([...current, id])))}
          />
        );
        if (!wide) return boardNode;
        // Without a tap the panel shows the first row the last switch broke, so the deciding line is always in view.
        const shown: PanelSheet | null = panel ?? (view === "pruefungen" && attention[0] ? { kind: "step", id: attention[0] } : null);
        return (
          <div className="w05-split">
            {boardNode}
            <aside className="w05-panel" aria-label={copy.panelLabel} data-w05-panel={shown ? (shown.kind === "file" ? shown.file : shown.id) : ""}>
              {shown ? (
                <>
                  <p className="w05-panel-title">{shown.kind === "file" ? shown.file : `${shown.id} ${copy.own.genericName[shown.id]}`}</p>
                  <SheetBody fmt={fmt} sheet={shown} reduced={reduced} r5Merged={r5Merged} onMerge={() => setR5Merged(true)} />
                </>
              ) : (
                <p className="w05-hint w05-panel-empty">{copy.folder.panelHint}</p>
              )}
            </aside>
          </div>
        );
      }
      case "r7":
        return (
          <BenchStage
            fmt={fmt}
            bench={bench}
            noticeHours={MODEL.context.noticeHours}
            reducedMotion={reduced}
            title={copy.r7.cardTitle}
            cardName={r7Name}
            hand={<BenchHand fmt={fmt} bench={bench} files={R7_FILES} label={copy.r7.hand} cardName={r7Name} />}
          />
        );
      case "free":
        return (
          <BenchStage
            fmt={fmt}
            bench={bench}
            noticeHours={MODEL.context.noticeHours}
            reducedMotion={reduced}
            title={`${bench.state.item} ${copy.shortName[bench.state.item].replace(/­/g, "")}`}
            cardName={(file) => file}
            hand={<BenchHand fmt={fmt} bench={bench} files={FOLDER_FILES} label={copy.free.hand} cardName={(file) => file} />}
          />
        );
      case "ordner-eigen":
        // The settings sit in the stage, not the dock: on a phone the dock keeps to the caption, so the folder keeps its room.
        return (
          <div className="w05-own-scene">
            <OwnDock
              fmt={fmt}
              own={own}
              onClear={() => {
                own.clear();
                own.setAudit("");
                setMoves({});
                setMoving(null);
              }}
            />
            <OwnStage
              fmt={fmt}
              own={own}
              board={board}
              moving={moving}
              onPick={setMoving}
              onPlace={(to: Place) => {
                if (moving) setMoves((current) => moveCard(current, moving, to));
                setMoving(null);
              }}
              onOpen={(file) => setSheet({ kind: "own", name: file.entry.name })}
            />
          </div>
        );
      case "claude":
        return (
          <ClaudeStage
            fmt={fmt}
            scene={scene}
            claude={claude}
            kitTally={MODEL.tally}
            prompt={promptText}
            personal={personal}
            ownText={ownAnswer}
            onOwnText={setOwnAnswer}
            onOpenQuote={(file, line) => setSheet({ kind: "file", file, line })}
            onOpenProduced={(name, text) => setSheet({ kind: "text", name, text })}
          />
        );
      case "mitnehmen":
        return (
          <TakeHomeScene
            fmt={fmt}
            model={MODEL}
            chosen={chosenGap}
            onChoose={setChosenGap}
            struck={struck}
            onStrike={(numbers) => setStruck((current) => new Set([...current, ...numbers]))}
            files={files}
            built={built}
            reducedMotion={reduced}
          />
        );
    }
  };

  const controls = (): ReactNode => {
    switch (view) {
      case "ordner":
        if (guess !== null) return <GlasChip kind="status">{fmt.t(copy.checks.guessMark, { guess })}</GlasChip>;
        return (
          <div className="w05-guess">
            <span className="w05-guess-slider" onFocusCapture={() => setMoved(true)} onPointerDownCapture={() => setMoved(true)}>
              <GlasSlider
                label={copy.folder.slider}
                value={draft}
                min={0}
                max={8}
                onChange={(value) => {
                  setDraft(value);
                  setMoved(true);
                }}
                format={(value) => fmt.t(copy.folder.sliderValue, { n: value })}
                valueText={(value) => fmt.t(copy.folder.sliderText, { n: value })}
              />
            </span>
            <GlasButton
              variant={moved ? "prominent" : "plain"}
              size="compact"
              onClick={() => {
                if (moved) setGuess(draft);
                clock.commit();
                // Skipping moves on at once, even while the board is still drawing its lines.
                if (!moved) clock.seek(clock.index + 1, "user");
              }}
              data-w05-commit={moved ? "keep" : "skip"}
            >
              {moved ? copy.folder.keep : copy.folder.skip}
            </GlasButton>
          </div>
        );
      case "pruefungen":
        return (
          <div className="w05-switches-row">
            <div className="w05-switches" role="group" aria-label={copy.checks.group}>
              {TEST_ORDER.map((test) => (
                <button key={test} type="button" role="switch" aria-checked={active.has(test)} className="w05-switch" onClick={() => toggle(test)} data-w05-switch={test}>
                  <span className="w05-switch-label">{copy.check[test]}</span>
                  <span className="w05-switch-track" aria-hidden="true">
                    <span className="w05-switch-knob" />
                  </span>
                </button>
              ))}
              <GlasButton variant="icon" size="compact" icon="info" label={copy.checks.group} onClick={() => setSheet({ kind: "checks" })} data-w05-checks-info="" />
            </div>
            {active.size === 4 && !r1Seen ? (
              <GlasButton variant="prominent" size="compact" trailingIcon="forward" onClick={openR1} data-w05-next-r1="">
                {copy.checks.nextR1}
              </GlasButton>
            ) : null}
          </div>
        );
      case "r7":
        // The hand leaves the dock while a file lies on the bench, so a phone keeps room for the document;
        // "Zurücklegen" brings it back. After the report is read, Weiter opens the four rules first.
        if (reportRead && !ruleSeen) {
          return (
            <GlasButton variant="prominent" size="compact" trailingIcon="forward" onClick={openRules} data-w05-next-rules="">
              {copy.r7.nextRules}
            </GlasButton>
          );
        }
        // The cards lie in the stage (BenchStage hand), so the dock keeps only the step.
        return null;
      case "free":
        return (
          <>
            <div className="w05-items" role="group" aria-label={copy.free.title}>
              {ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w05-item"
                  aria-pressed={bench.state.item === item.id}
                  aria-label={`${item.id} ${copy.shortName[item.id].replace(/\u00ad/g, "")}`}
                  onClick={() => bench.actions.item(item.id)}
                  data-w05-item={item.id}
                >
                  {item.id}
                </button>
              ))}
            </div>
          </>
        );
      case "ordner-eigen":
        return null;
      case "claude":
        return <ClaudeDock fmt={fmt} scene={scene} claude={claude} questions={questions} />;
      case "mitnehmen":
        return null;
    }
  };

  return (
    // "Von vorn" sits in the dock, so nothing floats over the top right of the folder or the Claude window.
    <div className="w05" data-w05-view={view} ref={stageRef}>
      <DemoGlasStage
        label={copy.stageLabel}
        feld={feld}
        className="w05-stage"
        restartInDock
        dock={
          <DemoDock className="w05-dock" compact restart>
            {clock.phase === "intro" ? null : <DockCaption sentences={caption} more={copy.captionMore} less={copy.captionLess} />}
            {clock.phase === "intro" ? null : controls()}
          </DemoDock>
        }
      >
        <div className="w05-data" data-view={view} data-w05-data={view}>
          <div className="w05-main">{data()}</div>
        </div>
      </DemoGlasStage>
      <Sheets fmt={fmt} sheet={sheet} onClose={() => setSheet(null)} reduced={reduced} r5Merged={r5Merged} onMerge={() => setR5Merged(true)} ownFiles={own.result?.files ?? []} />
    </div>
  );
}

function Sheets({
  fmt,
  sheet,
  onClose,
  reduced,
  r5Merged,
  onMerge,
  ownFiles,
}: {
  readonly fmt: Fmt;
  readonly sheet: Sheet | null;
  readonly onClose: () => void;
  readonly reduced: boolean;
  readonly r5Merged: boolean;
  readonly onMerge: () => void;
  readonly ownFiles: readonly OwnFile[];
}) {
  const { copy } = fmt;
  const common = { onClose, closeLabel: copy.close, resizeLabel: copy.resize, className: "w05 w05-sheet" };
  const row = sheet && (sheet.kind === "step" || sheet.kind === "request") ? MODEL.rows.find((entry) => entry.item.id === sheet.id) : undefined;
  const ownFile = sheet?.kind === "own" ? ownFiles.find((file) => file.entry.name === sheet.name) : undefined;
  return (
    <>
      <GlasSheet {...common} open={sheet?.kind === "file"} title={sheet?.kind === "file" ? sheet.file : ""} detent={sheet?.kind === "file" && sheet.line !== null ? "large" : "medium"}>
        {sheet?.kind === "file" ? <SheetBody fmt={fmt} sheet={sheet} reduced={reduced} r5Merged={r5Merged} onMerge={onMerge} /> : null}
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "request"} title={row ? `${row.item.id} ${copy.own.genericName[row.item.id]}` : ""}>
        {sheet?.kind === "request" ? <SheetBody fmt={fmt} sheet={sheet} reduced={reduced} r5Merged={r5Merged} onMerge={onMerge} /> : null}
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "step"} title={row ? `${row.item.id} ${copy.own.genericName[row.item.id]}` : ""} detent={row?.item.id === "R1" ? "large" : "medium"}>
        {sheet?.kind === "step" ? <SheetBody fmt={fmt} sheet={sheet} reduced={reduced} r5Merged={r5Merged} onMerge={onMerge} /> : null}
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "checks"} title={copy.checks.group}>
        <dl className="w05-defs">
          {TEST_ORDER.map((test) => (
            <div key={test}>
              <dt>{copy.check[test]}</dt>
              <dd>{copy.checkDef[test]}</dd>
            </div>
          ))}
        </dl>
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "rule"} title={copy.r7.ruleTitle} modal={false}>
        <div className="w05-rule" data-w05-rule-sheet="">
          <p className="w05-label">{copy.r7.objectiveLabel}</p>
          <p className="w05-objective">{copy.r7.objective}</p>
          <ol>
            {copy.r7.tool.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <GlasChip kind="file">{copy.takehome.fileNames.instructions}</GlasChip>
          <p className="w05-hint">{copy.r7.toolFile}</p>
        </div>
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "text"} title={sheet?.kind === "text" ? sheet.name : ""} detent="large">
        {sheet?.kind === "text" ? <PlainFile key={sheet.name} fmt={fmt} name={sheet.name} text={sheet.text} line={null} reducedMotion={reduced} note={fmt.copy.claude.desk.produced} /> : null}
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "own"} title={ownFile?.entry.name ?? ""}>
        {ownFile && ownFile.entry.text ? (
          <OwnFileView fmt={fmt} file={ownFile} reduced={reduced} />
        ) : (
          <p className="w05-hint">{copy.own.noText}</p>
        )}
      </GlasSheet>
    </>
  );
}

type PanelSheet = Extract<Sheet, { readonly kind: "file" | "request" | "step" }>;

/** Matches a wide screen (64rem and up): scenes 1 and 2 then get a document panel beside the board. */
function useWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

/** What a request, a step or a file shows, in a sheet or in the panel beside the board. */
function SheetBody({
  fmt,
  sheet,
  reduced,
  r5Merged,
  onMerge,
}: {
  readonly fmt: Fmt;
  readonly sheet: PanelSheet;
  readonly reduced: boolean;
  readonly r5Merged: boolean;
  readonly onMerge: () => void;
}) {
  const { copy } = fmt;
  if (sheet.kind === "file") {
    const text = attachedFiles().find((entry) => entry.name === sheet.file)?.text ?? "";
    return <PlainFile key={`${sheet.file}-${sheet.line}`} fmt={fmt} name={sheet.file} text={text} line={sheet.line} reducedMotion={reduced} note={sheet.file === VENDOR ? copy.folder.vendorNote : null} />;
  }
  const row = MODEL.rows.find((entry) => entry.item.id === sheet.id);
  if (!row) return null;
  if (sheet.kind === "request") {
    return (
      <div className="w05-request-sheet" data-w05-request-sheet={row.item.id}>
        <p className="w05-label">{fmt.t(copy.folder.requestOf, { id: row.item.id })}</p>
        <p className="w05-request-text" lang="en">
          {row.item.request}
        </p>
        {copy.explain[row.item.id] ? <p>{copy.explain[row.item.id]}</p> : null}
        <p className="w05-hint">{fmt.t(copy.folder.caseLine, { sent: fmt.date(MODEL.exercise), audit: fmt.date(MODEL.context.audit) })}</p>
      </div>
    );
  }
  if (row.item.id === "R5") return <R5View fmt={fmt} evaluation={MODEL.r5} percent={Math.round(MODEL.context.trainingShare * 100)} merged={r5Merged} onMerge={onMerge} />;
  if (row.naive.doc.file !== row.best.doc.file) return <LinkedStep key={row.item.id} fmt={fmt} row={row} reduced={reduced} />;
  return (
    <EvidenceView key={row.item.id} fmt={fmt} evaluation={row.best} noticeHours={MODEL.context.noticeHours} reducedMotion={reduced} focus={row.item.id === "R1" ? "quote" : undefined}>
      {row.item.id === "R1" ? (
        <div className="w05-r1" data-w05-r1-sheet="">
          <figure className="w05-clause">
            <blockquote lang="en">{clause7()}</blockquote>
            <figcaption>{copy.checks.clause7}</figcaption>
          </figure>
          {copy.checks.r1.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
      ) : null}
    </EvidenceView>
  );
}

/**
 * A step whose linked file is not the folder's best one (R8: the board links
 * the v4 draft, the best file is v3): the row's own file first, the file the
 * visitor tapped, then one line on the best file and a tap to read it.
 */
function LinkedStep({ fmt, row, reduced }: { readonly fmt: Fmt; readonly row: (typeof MODEL.rows)[number]; readonly reduced: boolean }) {
  const { copy } = fmt;
  const [best, setBest] = useState(false);
  const noticeHours = MODEL.context.noticeHours;
  if (best) return <EvidenceView fmt={fmt} evaluation={row.best} noticeHours={noticeHours} reducedMotion={reduced} />;
  const fails = row.best.failed[0];
  return (
    <EvidenceView fmt={fmt} evaluation={row.naive} noticeHours={noticeHours} reducedMotion={reduced} lead={fmt.t(copy.sheet.linked, { id: row.item.id, file: row.naive.doc.file })}>
      <div className="w05-best-note" data-w05-best-note={row.best.doc.file}>
        <p>
          {fmt.t(copy.sheet.best, { id: row.item.id, file: row.best.doc.file })} {fails ? testSentence(fmt, row.best, fails, noticeHours) : null}
        </p>
        <GlasButton variant="plain" size="compact" icon="doc" className="w05-wrap-label" onClick={() => setBest(true)} data-w05-show-best="">
          {fmt.t(copy.folder.openFile, { file: row.best.doc.file })}
        </GlasButton>
      </div>
    </EvidenceView>
  );
}

function OwnFileView({ fmt, file, reduced }: { readonly fmt: Fmt; readonly file: OwnFile; readonly reduced: boolean }) {
  const lines = readLines(file);
  const marks = [lines.date, lines.approval].filter((line): line is number => line !== null).map((line) => ({ line, tests: [] as TestId[], pass: true }));
  const unique = marks.filter((mark, index) => marks.findIndex((other) => other.line === mark.line) === index).sort((a, b) => a.line - b.line);
  return (
    <PlainFile
      fmt={fmt}
      name={file.entry.name}
      text={file.entry.text ?? ""}
      line={lines.date ?? lines.approval}
      marks={unique}
      readout={(line) => (line === null ? null : line === lines.date ? fmt.copy.own.readLine : line === lines.approval ? fmt.copy.own.readApproval : null)}
      reducedMotion={reduced}
    />
  );
}
