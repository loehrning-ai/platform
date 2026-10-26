"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, useBeatClock, useBeatGate, useOnEscape, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasChip, GlasReadout, GlasSheet, GlasSlider, ESCAPE_PRIORITY, pushEscapeLayer } from "@/components/demos/glas";
import { BEATS, type BeatId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/beats";
import { breaksFor, eachCheckDistinct, survivors } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/breaks";
import { ITEMS, itemById, windowMonthsOf, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { evaluate, TEST_ORDER, type Status, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { FOLDER_FILES, kitText, type FolderFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/kit";
import { buildModel } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { moveCard, ownBoard, type Moves, type Place } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-board";
import type { OwnFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-folder";
import { attachedFiles } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/probe";
import { BenchHand, BenchStage, fullyRead, useBench } from "./bench";
import { Board } from "./board";
import { DockCaption } from "./dock-caption";
import { gapListMarkdown, indexCsv, instructionsText } from "./exports";
import { EvidenceView, PlainFile } from "./file-sheet";
import { formatter, type Fmt } from "./fmt";
import { R5View } from "./r5-view";
import { ClaudeDock, ClaudeProbe, type ClaudeProbeState, type ProbeQuestion } from "./scene-claude";
import { OwnDock, OwnStage, readLines } from "./scene-own";
import { TakeHomeScene, type TakeHomeFiles } from "./scene-takehome";
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
  | { readonly kind: "own"; readonly name: string };

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
    // Three short sentences at most, so the dock never covers a row on a phone: the R1 hint first, then what R1 taught.
    return [
      fmt.t(copy.checks.allOn, { covered: fmt.word(survivors(MODEL.rows, active)) }),
      ...(guess !== null ? [fmt.t(copy.checks.guessed, { guess: fmt.word(guess) })] : []),
      ...(!r1Seen ? [copy.checks.toR1] : eachCheckDistinct(MODEL.rows) ? [copy.checks.distinct] : []),
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
  sceneId,
}: {
  readonly copy: W05Copy;
  readonly questions: readonly ProbeQuestion[];
  readonly files: TakeHomeFiles;
  readonly sceneId: string;
}) {
  const clock = useBeatClock();
  const fmt = useMemo(() => formatter(copy), [copy]);
  const reduced = clock.reducedMotion;
  const free = clock.phase === "free";
  const beatId = clock.beat.id as BeatId;
  const view: BeatId | "free" = free ? "free" : beatId;

  const [draft, setDraft] = useState(4);
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
  const [chosenGap, setChosenGap] = useState<ItemId | null>(null);
  const [moves, setMoves] = useState<Moves>({});
  const [moving, setMoving] = useState<OwnFile | null>(null);
  const [probe, setProbe] = useState<ClaudeProbeState>({ question: questions[0]?.id ?? "r7", skill: "with", source: "recorded" });
  const [ownAnswer, setOwnAnswer] = useState("");
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
    setChosenGap(null);
    setMoving(null);
    setProbe({ question: questions[0]?.id ?? "r7", skill: "with", source: "recorded" });
    bench.actions.reset("R7");
  });
  useOnEscape(() => setSheet(null));
  useEffect(() => setSheet(null), [view]);
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

  // A status word is defined the first time its stamp appears, for four seconds or until the next touch.
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
    const timer = setTimeout(() => setDef(null), 4000);
    return () => clearTimeout(timer);
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
  };

  const openR1 = () => {
    setR1Seen(true);
    setSheet({ kind: "step", id: "R1" });
  };

  // Scene 2 waits for all four checks; its first "Weiter" then opens R1. Scene 3 waits for the report; its first "Weiter" opens the rules.
  const reportRead = fullyRead(evaluate(itemById("R7"), R7_REPORT, MODEL.context), bench.state.visited[R7_REPORT] ?? []);
  const gateReady = view === "pruefungen" ? active.size === 4 : view === "r7" ? reportRead : null;
  useBeatGate(gateReady, () => {
    if (view === "pruefungen" && !r1Seen) {
      openR1();
      return true;
    }
    if (view === "r7" && !ruleSeen) {
      setRuleSeen(true);
      setSheet({ kind: "rule" });
      return true;
    }
    return false;
  });

  const r7Name = (file: FolderFile) => {
    const key = r7Key(file);
    return key ? copy.r7.cards[key] : file;
  };

  const caption = captionFor();
  function captionFor(): string[] {
    switch (view) {
      case "ordner":
        // Before the guess the question stands above the board, so the dock keeps to the slider.
        return guess !== null ? [fmt.t(copy.folder.kept, { guess: fmt.word(guess) })] : [];
      case "pruefungen":
        return checksCaption(fmt, active, last, guess, r1Seen);
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
      case "claude":
        return [copy.claude.lead];
      case "mitnehmen":
        return [fmt.t(copy.takehome.lead, { open: fmt.Word(MODEL.tally.weak + MODEL.tally.gap) })];
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
  const currentTake = (() => {
    const question = questions.find((entry) => entry.id === probe.question) ?? questions[0];
    return (probe.skill === "with" ? question?.withSkill : question?.withoutSkill) ?? question?.withSkill ?? null;
  })();
  const personal = own.audit !== "" && own.windowFrom !== null;
  const promptText = personal ? fmt.t(copy.claude.ownPrompt, { audit: fmt.date(own.audit), window: fmt.date(own.windowFrom ?? "") }) : (currentTake?.prompt ?? "");

  const data = (): ReactNode => {
    switch (view) {
      case "ordner":
      case "pruefungen":
        return (
          <Board
            model={MODEL}
            fmt={fmt}
            active={view === "ordner" ? NO_CHECKS : active}
            checking={view === "pruefungen"}
            drawn={reduced || clock.progress >= 1 || view !== "ordner"}
            front={front}
            guess={guess}
            attention={attention}
            lead={view === "ordner" && guess === null ? copy.folder.question : undefined}
            onRequest={(id) => setSheet(view === "ordner" ? { kind: "request", id } : { kind: "step", id })}
            onFile={(file) => setSheet({ kind: "file", file, line: null })}
            onTurn={(id) => setFront((current) => (current.has(id) ? new Set([...current].filter((entry) => entry !== id)) : new Set([...current, id])))}
          />
        );
      case "r7":
        return <BenchStage fmt={fmt} bench={bench} noticeHours={MODEL.context.noticeHours} reducedMotion={reduced} title={copy.r7.cardTitle} cardName={r7Name} />;
      case "free":
        return (
          <BenchStage
            fmt={fmt}
            bench={bench}
            noticeHours={MODEL.context.noticeHours}
            reducedMotion={reduced}
            title={`${bench.state.item} ${copy.shortName[bench.state.item].replace(/­/g, "")}`}
            cardName={(file) => file}
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
          <ClaudeProbe
            fmt={fmt}
            questions={questions}
            state={probe}
            ownText={ownAnswer}
            onOwnText={setOwnAnswer}
            kitTally={MODEL.tally}
            sceneId={sceneId}
            reducedMotion={reduced}
            onOpenQuote={(file, line) => setSheet({ kind: "file", file, line })}
            onState={setProbe}
            prompt={promptText}
            personal={personal}
          />
        );
      case "mitnehmen":
        return <TakeHomeScene fmt={fmt} model={MODEL} chosen={chosenGap} onChoose={setChosenGap} files={files} built={built} reducedMotion={reduced} />;
    }
  };

  const controls = (): ReactNode => {
    switch (view) {
      case "ordner":
        if (guess !== null) return <GlasChip kind="status">{fmt.t(copy.checks.guessMark, { guess: fmt.word(guess) })}</GlasChip>;
        return (
          <div className="w05-guess">
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
                  <span className="w05-switch-dot" aria-hidden="true" />
                  {copy.check[test]}
                </button>
              ))}
              <GlasButton variant="icon" size="compact" icon="info" label={copy.checks.group} onClick={() => setSheet({ kind: "checks" })} data-w05-checks-info="" />
            </div>
          </div>
        );
      case "r7":
        // The hand leaves the dock while a file lies on the bench, so a phone keeps room for the document;
        // "Zurücklegen" brings it back. After the report is read, Weiter opens the four rules first.
        return bench.state.placed ? null : <BenchHand fmt={fmt} bench={bench} files={R7_FILES} label={copy.r7.hand} cardName={r7Name} />;
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
            {bench.state.placed ? null : <BenchHand fmt={fmt} bench={bench} files={FOLDER_FILES} label={copy.free.hand} cardName={(file) => file} />}
          </>
        );
      case "ordner-eigen":
        return null;
      case "claude":
        return <ClaudeDock fmt={fmt} questions={questions} state={probe} onState={setProbe} />;
      case "mitnehmen":
        return null;
    }
  };

  return (
    <div className="w05" data-w05-view={view}>
      <DemoGlasStage
        label={copy.stageLabel}
        feld={feld}
        className="w05-stage"
        dock={
          <DemoDock className="w05-dock">
            {clock.phase === "intro" ? null : <DockCaption sentences={caption} more={copy.more} less={copy.less} />}
            {clock.phase === "intro" ? null : controls()}
          </DemoDock>
        }
      >
        <div className="w05-data" data-view={view} data-w05-data={view}>
          {def && view === "pruefungen" ? (
            <GlasReadout lines={2} popKey={def} className="w05-def">
              {copy.statusDef[def]}
            </GlasReadout>
          ) : null}
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
  const fileText = sheet?.kind === "file" ? attachedFiles().find((entry) => entry.name === sheet.file)?.text ?? "" : "";
  const ownFile = sheet?.kind === "own" ? ownFiles.find((file) => file.entry.name === sheet.name) : undefined;
  return (
    <>
      <GlasSheet {...common} open={sheet?.kind === "file"} title={sheet?.kind === "file" ? sheet.file : ""} detent={sheet?.kind === "file" && sheet.line !== null ? "large" : "medium"}>
        {sheet?.kind === "file" ? (
          <PlainFile key={`${sheet.file}-${sheet.line}`} fmt={fmt} name={sheet.file} text={fileText} line={sheet.line} reducedMotion={reduced} note={sheet.file === VENDOR ? copy.folder.vendorNote : null} />
        ) : null}
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "request"} title={row ? `${row.item.id} ${copy.own.genericName[row.item.id]}` : ""}>
        {row ? (
          <div className="w05-request-sheet" data-w05-request-sheet={row.item.id}>
            <p className="w05-label">{fmt.t(copy.folder.requestOf, { id: row.item.id })}</p>
            <p className="w05-request-text" lang="en">
              {row.item.request}
            </p>
            {copy.explain[row.item.id] ? <p>{copy.explain[row.item.id]}</p> : null}
            <p className="w05-hint">{fmt.t(copy.folder.caseLine, { sent: fmt.date(MODEL.exercise), audit: fmt.date(MODEL.context.audit) })}</p>
          </div>
        ) : null}
      </GlasSheet>
      <GlasSheet {...common} open={sheet?.kind === "step"} title={row ? `${row.item.id} ${copy.own.genericName[row.item.id]}` : ""} detent={row?.item.id === "R1" ? "large" : "medium"}>
        {row && sheet?.kind === "step" ? (
          row.item.id === "R5" ? (
            <R5View fmt={fmt} evaluation={MODEL.r5} percent={Math.round(MODEL.context.trainingShare * 100)} merged={r5Merged} onMerge={onMerge} />
          ) : (
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
          )
        ) : null}
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
