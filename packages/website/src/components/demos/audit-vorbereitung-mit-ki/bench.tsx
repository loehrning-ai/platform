"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ESCAPE_PRIORITY, pushEscapeLayer } from "@/components/demos/glas";
import { itemById, type AuditContext, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { decisionLines } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/decision-lines";
import { evaluate, TEST_ORDER, type Evaluation, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { FolderFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/kit";
import { DocView, marksOf } from "./doc-view";
import { bandReadout, CheckList, firstBand } from "./file-sheet";
import type { Fmt } from "./fmt";

/** How long "Alle vier Zeilen lesen" rests the band on each line. */
const WALK_MS = 600;

export interface BenchState {
  readonly item: ItemId;
  readonly placed: FolderFile | null;
  readonly lifted: FolderFile | null;
  /** The first file the visitor played on this request: their prediction. */
  readonly first: FolderFile | null;
  readonly band: number | null;
  /** Lines the band has rested on, per file. */
  readonly visited: Readonly<Record<string, readonly number[]>>;
  readonly moved: boolean;
}

export const BENCH_START: BenchState = { item: "R7", placed: null, lifted: null, first: null, band: null, visited: {}, moved: false };

/** The checks of a placed file whose line the band has read; checks without a line light once every lined one is read. */
export function litChecks(evaluation: Evaluation, visited: readonly number[]): ReadonlySet<TestId> {
  const decisions = decisionLines(evaluation);
  const lit = new Set(decisions.filter((entry) => visited.includes(entry.line)).map((entry) => entry.test));
  if (decisions.every((entry) => visited.includes(entry.line))) for (const test of TEST_ORDER) lit.add(test);
  return lit;
}

export function fullyRead(evaluation: Evaluation, visited: readonly number[]): boolean {
  return litChecks(evaluation, visited).size === TEST_ORDER.length;
}

/** The bench (scene 3 and free play): one request, a hand of files, the Prüflupe. */
export function useBench(context: AuditContext, reducedMotion: boolean) {
  const [state, setState] = useState<BenchState>(BENCH_START);
  const walk = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopWalk = useCallback(() => {
    for (const timer of walk.current) clearTimeout(timer);
    walk.current = [];
  }, []);
  useEffect(() => stopWalk, [stopWalk]);

  const evaluation = useMemo(() => (state.placed ? evaluate(itemById(state.item), state.placed, context) : null), [context, state.item, state.placed]);

  const visit = useCallback((band: number, moved = true) => {
    setState((current) => {
      if (!current.placed) return current;
      const seen = current.visited[current.placed] ?? [];
      return {
        ...current,
        band,
        moved: current.moved || moved,
        visited: seen.includes(band) ? current.visited : { ...current.visited, [current.placed]: [...seen, band] },
      };
    });
  }, []);

  const place = useCallback(
    (file: FolderFile) => {
      stopWalk();
      setState((current) => {
        const placedEval = evaluate(itemById(current.item), file, context);
        const decisions = decisionLines(placedEval);
        const band = firstBand(placedEval, decisions, "quote") ?? decisions[0]?.line ?? null;
        return { ...current, placed: file, lifted: null, first: current.first ?? file, band, visited: current.visited };
      });
    },
    [context, stopWalk],
  );

  const actions = useMemo(
    () => ({
      lift: (file: FolderFile) => setState((current) => ({ ...current, lifted: current.lifted === file ? null : file })),
      cancel: () => setState((current) => ({ ...current, lifted: null })),
      place,
      putBack: () => {
        stopWalk();
        setState((current) => ({ ...current, placed: null, band: null }));
      },
      band: (line: number) => visit(line),
      item: (item: ItemId) => {
        stopWalk();
        setState((current) => ({ ...current, item, placed: null, band: null, first: null, visited: {} }));
      },
      reset: (item: ItemId = "R7") => {
        stopWalk();
        setState({ ...BENCH_START, item });
      },
      readAll: () => {
        if (!evaluation) return;
        stopWalk();
        const lines = [...new Set(decisionLines(evaluation).map((entry) => entry.line))];
        if (reducedMotion) {
          for (const line of lines) visit(line);
          return;
        }
        lines.forEach((line, index) => {
          walk.current.push(setTimeout(() => visit(line), index * WALK_MS));
        });
      },
    }),
    [evaluation, place, reducedMotion, stopWalk, visit],
  );

  // Escape puts a lifted card back into the hand.
  useEffect(() => {
    if (!state.lifted) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => setState((current) => ({ ...current, lifted: null })));
  }, [state.lifted]);

  return { state, evaluation, actions };
}

export type Bench = ReturnType<typeof useBench>;

/** The stage part: the request card with its Prüfring, then the placed file under the lens. */
export function BenchStage({
  fmt,
  bench,
  noticeHours,
  reducedMotion,
  title,
  showVerdictSlot,
  cardName,
  hand,
}: {
  readonly fmt: Fmt;
  readonly bench: Bench;
  readonly noticeHours: number;
  readonly reducedMotion: boolean;
  readonly title: string;
  readonly showVerdictSlot?: ReactNode;
  readonly cardName: (file: FolderFile) => string;
  /** The file cards, laid out in the stage while nothing lies on the bench. */
  readonly hand?: ReactNode;
}) {
  const { copy } = fmt;
  const { state, evaluation, actions } = bench;
  const item = itemById(state.item);
  const visited = state.placed ? (state.visited[state.placed] ?? []) : [];
  const lit = evaluation ? litChecks(evaluation, visited) : new Set<TestId>();
  const decisions = evaluation ? decisionLines(evaluation) : [];
  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.getData("text/plain") as FolderFile;
    if (file) actions.place(file);
  };
  return (
    <div className="w05-bench" data-w05-bench={state.item}>
      <button
        type="button"
        className="w05-target"
        data-lifted={state.lifted ? "" : undefined}
        data-w05-target={state.item}
        onClick={() => (state.lifted ? actions.place(state.lifted) : undefined)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        aria-label={state.lifted ? fmt.t(copy.r7.drop, { card: cardName(state.lifted) }) : `${title}. ${item.request}`}
        aria-disabled={state.lifted ? undefined : "true"}
      >
        <span className="w05-target-title">{title}</span>
        <span className="w05-ring" role="list" aria-label={evaluation ? fmt.t(copy.sheet.ring, { file: evaluation.doc.file }) : copy.checks.group}>
          {TEST_ORDER.map((test) => {
            const on = evaluation !== null && lit.has(test);
            const failed = evaluation?.failed.includes(test) ?? false;
            const notMet = test === "quote" && evaluation?.tests.quote.kind === "notMet";
            return (
              <span key={test} role="listitem" className="w05-ring-chip" data-state={on ? (failed ? "fail" : "pass") : "open"} data-w05-ring={test}>
                <span aria-hidden="true" className="w05-ring-mark" />
                {copy.check[test]}
                {on ? <span className="sr-only">{`: ${notMet ? copy.sheet.notMet : failed ? copy.sheet.failed : copy.sheet.passed}`}</span> : null}
              </span>
            );
          })}
        </span>
        {state.lifted ? <span className="w05-target-drop">{fmt.t(copy.r7.drop, { card: cardName(state.lifted) })}</span> : null}
      </button>
      {evaluation ? (
        <div className="w05-bench-doc">
          <div className="w05-bench-bar">
            <span className="w05-file">{evaluation.doc.file}</span>
            <button type="button" className="w05-link-button" onClick={actions.putBack} data-w05-putback="">
              {copy.r7.putBack}
            </button>
          </div>
          <DocView
            name={evaluation.doc.file}
            text={evaluation.doc.text}
            marks={marksOf(decisions)}
            band={state.band}
            onBand={actions.band}
            lensLabel={copy.sheet.lens}
            lineLabel={(n) => fmt.t(copy.line, { n })}
            readout={bandReadout(fmt, evaluation, decisions, state.band, noticeHours)}
            reducedMotion={reducedMotion}
          />
          <button type="button" className="w05-link-button w05-readall" data-shown={state.moved ? "" : undefined} onClick={actions.readAll} data-w05-readall="">
            {copy.sheet.readAll}
          </button>
          {showVerdictSlot}
        </div>
      ) : hand ? (
        <div className="w05-bench-hand">
          {state.lifted ? <p className="w05-bench-lifted">{fmt.t(copy.r7.lifted, { card: cardName(state.lifted), item: state.item })}</p> : null}
          {hand}
        </div>
      ) : (
        <p className="w05-bench-empty">{state.lifted ? fmt.t(copy.r7.lifted, { card: cardName(state.lifted), item: state.item }) : copy.free.pick}</p>
      )}
      {evaluation ? <CheckList fmt={fmt} evaluation={evaluation} noticeHours={noticeHours} lit={lit} /> : null}
    </div>
  );
}

/** A finger drag in progress: which card, where it started and how far it moved. */
interface TouchDrag {
  readonly file: FolderFile;
  readonly x0: number;
  readonly y0: number;
  readonly dx: number;
  readonly dy: number;
  readonly moved: boolean;
}

/** Past this many pixels a press on a card is a drag, not a tap. */
const DRAG_SLOP = 8;

/** True when the point lies on the request card of the bench. */
function overTarget(x: number, y: number): boolean {
  return document.elementsFromPoint(x, y).some((element) => element.closest("[data-w05-target]") !== null);
}

/**
 * The file cards, in the stage. A card can be dragged onto the request with
 * a mouse (native drag) or a finger (pointer events, the card follows), or
 * tapped and then the request tapped: three ways to the same place.
 */
export function BenchHand({ fmt, bench, files, label, cardName }: { readonly fmt: Fmt; readonly bench: Bench; readonly files: readonly FolderFile[]; readonly label: string; readonly cardName: (file: FolderFile) => string }) {
  const { state, actions } = bench;
  const [drag, setDrag] = useState<TouchDrag | null>(null);
  const dragged = useRef(false);
  return (
    <ul className="w05-hand" aria-label={label} data-w05-hand="">
      {files.map((file) => (
        <li key={file}>
          <button
            type="button"
            className="w05-hand-card"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", file);
              event.dataTransfer.effectAllowed = "move";
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragged.current = false;
              setDrag({ file, x0: event.clientX, y0: event.clientY, dx: 0, dy: 0, moved: false });
            }}
            onPointerMove={(event) => {
              if (drag?.file !== file) return;
              const dx = event.clientX - drag.x0;
              const dy = event.clientY - drag.y0;
              setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > DRAG_SLOP });
            }}
            onPointerUp={(event) => {
              if (drag?.file !== file) return;
              if (drag.moved) {
                dragged.current = true;
                if (overTarget(event.clientX, event.clientY)) actions.place(file);
              }
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              actions.lift(file);
            }}
            style={drag?.file === file && drag.moved ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
            aria-pressed={state.lifted === file}
            data-lifted={state.lifted === file ? "" : undefined}
            data-dragging={drag?.file === file && drag.moved ? "" : undefined}
            data-placed={state.placed === file ? "" : undefined}
            data-w05-card={file}
          >
            <span className="w05-hand-name">{cardName(file)}</span>
            {cardName(file) !== file ? <span className="w05-hand-file">{file}</span> : null}
          </button>
        </li>
      ))}
      {state.lifted ? (
        <li>
          <button type="button" className="w05-hand-cancel" onClick={actions.cancel}>
            {fmt.copy.own.cancelMove}
          </button>
        </li>
      ) : null}
    </ul>
  );
}
