"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { csvCells } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import { docLines, type DecisionLine } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/decision-lines";
import type { TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";

/** A band snaps to a decision line within this many pixels of its centre. */
const SNAP_PX = 16;

export interface DocMark {
  readonly line: number;
  readonly tests: readonly TestId[];
  readonly pass: boolean;
}

/** Decision lines grouped by line: one mark per line, with every test that reads it. */
export function marksOf(decisions: readonly DecisionLine[]): readonly DocMark[] {
  const byLine = new Map<number, { tests: TestId[]; pass: boolean }>();
  for (const entry of decisions) {
    const mark = byLine.get(entry.line) ?? { tests: [], pass: true };
    mark.tests.push(entry.test);
    mark.pass = mark.pass && entry.pass;
    byLine.set(entry.line, mark);
  }
  return [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([line, mark]) => ({ line, ...mark }));
}

/**
 * A kit file (or a visitor's text file) as HTML lines: text wraps to the
 * panel, a CSV becomes a small table that scrolls sideways inside itself.
 * The Prüflupe is an opaque band over one line that shows a larger copy of
 * that line, wrapped, so the deciding words are never cut off; on a CSV row
 * it shows each cell under its column name. It follows a drag, snaps to the
 * deciding lines, moves to a marked line on a tap, and steps with ArrowUp
 * and ArrowDown when the document has focus. The band never blurs (it costs
 * no filter).
 */
export function DocView({
  name,
  text,
  marks,
  band,
  onBand,
  lensLabel,
  lineLabel,
  readout,
  reducedMotion,
}: {
  readonly name: string;
  readonly text: string;
  readonly marks: readonly DocMark[];
  /** The line under the band, or null for no band. */
  readonly band: number | null;
  readonly onBand: (line: number) => void;
  readonly lensLabel: string;
  /** "Zeile {n}" as a function. */
  readonly lineLabel: (n: number) => string;
  /** What the line under the band means, shown above it. */
  readonly readout?: string | null;
  readonly reducedMotion: boolean;
}) {
  const lines = docLines(text);
  const csv = /\.csv$/i.test(name);
  const box = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState<number | null>(null);
  const [height, setHeight] = useState(24);
  const drag = useRef<{ id: number; offset: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const marked = new Map(marks.map((mark) => [mark.line, mark]));

  const lineBox = useCallback((line: number) => box.current?.querySelector<HTMLElement>(`[data-doc-line="${line}"]`) ?? null, []);

  // The band rests on its line; re-measured when the line, the text or the panel width changes.
  useLayoutEffect(() => {
    if (band === null || drag.current) return;
    const place = () => {
      const element = lineBox(band);
      const root = box.current;
      if (!element || !root) return;
      const a = element.getBoundingClientRect();
      const b = root.getBoundingClientRect();
      setTop(a.top - b.top + root.scrollTop);
      setHeight(a.height);
    };
    place();
    if (typeof ResizeObserver === "undefined" || !box.current) return;
    const observer = new ResizeObserver(place);
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [band, lineBox, text]);

  // The resting band stays in view inside the document's own scroll box.
  useEffect(() => {
    const root = box.current;
    if (band === null || !root || top === null || dragging) return;
    if (top < root.scrollTop + 8 || top + height > root.scrollTop + root.clientHeight - 8) {
      root.scrollTop = Math.max(0, top - root.clientHeight / 3);
    }
  }, [band, dragging, height, top]);

  const lineAt = (y: number): { line: number; distance: number; marked: boolean } | null => {
    const root = box.current;
    if (!root) return null;
    const rootTop = root.getBoundingClientRect().top - root.scrollTop;
    let best: { line: number; distance: number; marked: boolean } | null = null;
    let nearestMark: { line: number; distance: number; marked: boolean } | null = null;
    for (let line = 1; line <= lines.length; line += 1) {
      const element = lineBox(line);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const centre = rect.top - rootTop + rect.height / 2;
      const distance = Math.abs(centre - y);
      if (!best || distance < best.distance) best = { line, distance, marked: marked.has(line) };
      if (marked.has(line) && (!nearestMark || distance < nearestMark.distance)) nearestMark = { line, distance, marked: true };
    }
    return nearestMark && nearestMark.distance <= SNAP_PX ? nearestMark : best;
  };

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (top === null) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const root = box.current;
    const rootTop = (root?.getBoundingClientRect().top ?? 0) - (root?.scrollTop ?? 0);
    drag.current = { id: event.pointerId, offset: event.clientY - rootTop - top };
    setDragging(true);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const root = box.current;
    if (!state || state.id !== event.pointerId || !root) return;
    const rootTop = root.getBoundingClientRect().top - root.scrollTop;
    const next = Math.max(0, Math.min(root.scrollHeight - height, event.clientY - rootTop - state.offset));
    setTop(next);
    const hit = lineAt(next + height / 2);
    if (hit && hit.line !== band) onBand(hit.line);
  };
  const onUp = () => {
    const state = drag.current;
    drag.current = null;
    setDragging(false);
    if (!state || top === null) return;
    const hit = lineAt(top + height / 2);
    if (hit) {
      onBand(hit.line);
      const element = lineBox(hit.line);
      const root = box.current;
      if (element && root) setTop(element.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop);
    }
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (marks.length === 0) return;
    event.preventDefault();
    const order = marks.map((mark) => mark.line);
    const index = band === null ? -1 : order.indexOf(band);
    const next = event.key === "ArrowDown" ? order[Math.min(order.length - 1, index + 1)] : order[Math.max(0, index - 1)];
    if (next !== undefined) onBand(next);
  };

  const bandText = band !== null ? (lines[band - 1] ?? "") : "";
  const header = csv ? lines.findIndex((line) => line && !line.startsWith("#")) : -1;
  const columns = header >= 0 ? csvCells(lines[header] ?? "") : [];
  // A CSV data row: every cell under its column name, so an empty transfer_basis reads as such.
  const bandCells = csv && band !== null && header >= 0 && band - 1 > header ? csvCells(bandText).map((cell, index) => ({ column: columns[index] ?? "", cell })) : null;
  const lineNode = (line: number, content: ReactNode, cells = false) => {
    const mark = marked.get(line);
    const props = {
      "data-doc-line": line,
      "data-marked": mark ? (mark.pass ? "pass" : "fail") : undefined,
      "data-active": band === line ? "" : undefined,
    };
    if (!mark) return cells ? <tr key={line} {...props}>{content}</tr> : <li key={line} {...props}>{content}</li>;
    const select = () => onBand(line);
    return cells ? (
      <tr key={line} {...props} onClick={select}>
        {content}
      </tr>
    ) : (
      <li key={line} {...props}>
        <button type="button" className="w05-doc-hit" onClick={select} aria-label={lineLabel(line)}>
          {content}
        </button>
      </li>
    );
  };

  let body: ReactNode;
  if (csv) {
    body = (
      <>
        <ol className="w05-doc-lines">{lines.slice(0, Math.max(0, header)).map((line, index) => lineNode(index + 1, <span>{line.replace(/^#\s*/, "")}</span>))}</ol>
        <div className="w05-doc-table-wrap">
          <table className="w05-doc-table">
            <tbody>
              {lines.slice(Math.max(0, header)).map((line, offset) => {
                const n = header + offset + 1;
                const cells = csvCells(line);
                return lineNode(
                  n,
                  cells.map((cell, index) =>
                    offset === 0 ? (
                      <th key={index} scope="col">
                        {cell}
                      </th>
                    ) : (
                      <td key={index}>{cell === "" ? <span className="w05-doc-empty">{"∅"}</span> : cell}</td>
                    ),
                  ),
                  true,
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  } else {
    body = <ol className="w05-doc-lines">{lines.map((line, index) => lineNode(index + 1, <span>{line || " "}</span>))}</ol>;
  }

  return (
    <div className="w05-doc" data-w05-doc={name} data-reduced={reducedMotion ? "" : undefined}>
      <div ref={box} className="w05-doc-scroll" tabIndex={0} role="document" aria-label={name} onKeyDown={onKey}>
        {body}
        {band !== null && top !== null ? (
          <div
            className="w05-band"
            style={{ transform: `translateY(${top}px)`, minHeight: height }}
            data-dragging={dragging ? "" : undefined}
            data-w05-band={band}
            role="slider"
            aria-label={lensLabel}
            aria-valuemin={1}
            aria-valuemax={lines.length}
            aria-valuenow={band}
            aria-valuetext={`${lineLabel(band)}: ${bandText}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <span className="w05-band-lens" aria-hidden="true">
              {bandCells ? (
                bandCells.map(({ column, cell }, index) => (
                  <span key={index} className="w05-band-cell">
                    <span className="w05-band-column">{column}</span> {cell === "" ? "∅" : cell}
                  </span>
                ))
              ) : (
                <span>{bandText.replace(/^#\s*/, "")}</span>
              )}
            </span>
            <span className="w05-band-grip" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {readout ? (
        <p className="w05-doc-readout" aria-live="polite">
          {readout}
        </p>
      ) : null}
    </div>
  );
}
