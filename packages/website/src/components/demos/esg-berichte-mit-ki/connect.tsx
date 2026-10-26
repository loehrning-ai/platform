"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { ESCAPE_PRIORITY, pushEscapeLayer } from "@/components/demos/glas";

/*
 * The one tool of this demo: a line drawn from a part of an answer to the line
 * of a file that carries it. Pointer: press a handle, drag, let go on a line
 * (the line under the finger is found with elementFromPoint and
 * data-w4-line). Tap: a handle, then a line. Keyboard: Enter on a handle,
 * ArrowUp and ArrowDown through the lines, Enter connects, Escape cancels.
 * The drawing is aria-hidden; the readout sentence carries the meaning.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** An anchor: its point, plus the half size of the element it sits on. */
export interface Anchor extends Point {
  readonly hw?: number;
  readonly hh?: number;
}

export interface DragState<P extends string> {
  readonly part: P;
  readonly at: Point;
  /** The line under the finger. */
  readonly line: number | null;
  /** The finger in viewport coordinates (for the loupe). */
  readonly client: Point;
}

const THRESHOLD = 6;

/**
 * A curve from a handle to a line, soft and round-capped. A handle below its
 * line's level is left from its bottom edge, so the thread never crosses the
 * handle's own words.
 */
export function curve(origin: Anchor, to: Point): string {
  const below = to.y > origin.y + (origin.hh ?? 0) + 24;
  const from = below && origin.hh ? { x: origin.x, y: origin.y + origin.hh } : origin;
  const c1 = below ? { x: from.x, y: from.y + Math.min(80, (to.y - from.y) / 2) } : { x: from.x - Math.min(120, Math.abs(from.x - to.x) / 2), y: from.y };
  const c2 = { x: to.x + 36, y: to.y };
  return `M${from.x} ${from.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
}

/**
 * A kept quote, from a handle to its line (the line anchor sits on the line's
 * right end, where its status glyph is). When the file stands beside the card
 * (desktop), the thread leaves the handle's bottom edge and arrives at the
 * line's left edge. When the file lies below the card (phone), the thread runs
 * down the right margin in its own lane and turns into the line at its glyph,
 * so it never crosses a word.
 */
export function threadPath(from: Anchor, to: Anchor, lane: number): string {
  const startX = from.x + (from.hw ?? 0);
  const lineLeft = to.x + 8 - 2 * (to.hw ?? 0);
  if (lineLeft > startX + 16) {
    // Leave from the bottom edge: handles share a row, so a side exit would cross a neighbour.
    const y0 = from.y + (from.hh ?? 0);
    const pull = Math.max(24, (lineLeft - from.x) / 2);
    return `M${from.x} ${y0}C${from.x} ${y0 + 48} ${lineLeft - pull} ${to.y} ${lineLeft} ${to.y}`;
  }
  // The file lies below the parts: leave each part from its bottom edge, run along the gap
  // under the strip in the part's own lane, down the file's right margin, into the glyph.
  const gx = to.x + 6 - lane * 3;
  const y0 = from.y + (from.hh ?? 0);
  const y1 = y0 + 3 + lane * 2;
  const r = Math.max(2, Math.min(8, Math.abs(to.y - y1) / 2, Math.abs(gx - from.x) / 2));
  return [
    `M${from.x} ${y0}`,
    `L${from.x} ${y1 - r}`,
    `Q${from.x} ${y1} ${from.x + r} ${y1}`,
    `L${gx - r} ${y1}`,
    `Q${gx} ${y1} ${gx} ${y1 + r}`,
    `L${gx} ${to.y - r}`,
    `Q${gx} ${to.y} ${gx - r} ${to.y}`,
    `L${to.x + 4} ${to.y}`,
  ].join("");
}

/**
 * The connection running on from a line that does not carry its part into the
 * empty slot of the missing document below the file: out of the line's glyph,
 * down the file's right margin, into the slot's right edge.
 */
export function slotPath(from: Anchor, to: Anchor, lane: number): string {
  // Down the right margin, then along the gap above the slots, into the slot's top edge:
  // the thread never runs across another slot's words.
  const gx = Math.max(from.x + 14, to.x + (to.hw ?? 0) + 10) + lane * 4;
  const top = to.y - (to.hh ?? 0);
  const ty = top - 4 - lane * 3;
  const r = Math.max(2, Math.min(6, Math.abs(ty - from.y) / 2, Math.abs(gx - to.x) / 2));
  return [
    `M${from.x + 6} ${from.y}`,
    `L${gx - r} ${from.y}`,
    `Q${gx} ${from.y} ${gx} ${from.y + r}`,
    `L${gx} ${ty - r}`,
    `Q${gx} ${ty} ${gx - r} ${ty}`,
    `L${to.x + r} ${ty}`,
    `Q${to.x} ${ty} ${to.x} ${ty + r}`,
    `L${to.x} ${top}`,
  ].join("");
}

/**
 * A connection between two boxes (a file and an answer): it leaves the first
 * box on the side that faces the second and arrives on the facing side.
 */
export function boxCurve(from: Anchor, to: Anchor): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    const sx = Math.sign(dx) || 1;
    const a = { x: from.x + sx * (from.hw ?? 0), y: from.y };
    const b = { x: to.x - sx * (to.hw ?? 0), y: to.y };
    const pull = Math.max(24, Math.abs(b.x - a.x) / 2);
    return `M${a.x} ${a.y}C${a.x + sx * pull} ${a.y} ${b.x - sx * pull} ${b.y} ${b.x} ${b.y}`;
  }
  const sy = Math.sign(dy) || 1;
  const a = { x: from.x, y: from.y + sy * (from.hh ?? 0) };
  const b = { x: to.x, y: to.y - sy * (to.hh ?? 0) };
  const pull = Math.max(18, Math.abs(b.y - a.y) / 2);
  return `M${a.x} ${a.y}C${a.x} ${a.y + sy * pull} ${b.x} ${b.y - sy * pull} ${b.x} ${b.y}`;
}

/** Element centres and right edges relative to a container, re-measured on resize. */
export function useAnchors(container: RefObject<HTMLElement | null>, deps: readonly unknown[]) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const [anchors, setAnchors] = useState<Readonly<Record<string, Anchor>>>({});
  const measure = useCallback(() => {
    const root = container.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const next: Record<string, Anchor> = {};
    for (const [key, node] of nodes.current) {
      if (!node.isConnected) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const kind = key.split(":")[0];
      next[key] =
        kind === "line"
          ? { x: rect.right - box.left - 8, y: rect.top - box.top + rect.height / 2, hw: rect.width / 2 }
          : { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2, hw: rect.width / 2, hh: rect.height / 2 };
    }
    setAnchors((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
  }, [container]);
  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);
  useEffect(() => {
    const root = container.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(root);
    // Scroll does not bubble, but it is seen in the capture phase: any scroller inside re-measures.
    const onScroll = () => measure();
    root.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [container, measure]);
  const register = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      if (node) nodes.current.set(key, node);
      else nodes.current.delete(key);
    },
    [],
  );
  return { anchors, register, measure };
}

/**
 * Pointer handling for one handle: a short press is a tap (picking mode),
 * a drag follows the finger and lands on the line under it.
 */
export function useConnectDrag<P extends string>({
  container,
  onLand,
  onTap,
  onDragChange,
}: {
  readonly container: RefObject<HTMLElement | null>;
  readonly onLand: (part: P, line: number) => void;
  readonly onTap: (part: P, keyboard: boolean) => void;
  readonly onDragChange?: (drag: DragState<P> | null) => void;
}) {
  const [drag, setDrag] = useState<DragState<P> | null>(null);
  const start = useRef<{ part: P; x: number; y: number; moved: boolean; id: number } | null>(null);
  const dragged = useRef(false);
  const latest = useRef({ onLand, onTap, onDragChange });
  useEffect(() => {
    latest.current = { onLand, onTap, onDragChange };
  });

  const update = useCallback((next: DragState<P> | null) => {
    setDrag(next);
    latest.current.onDragChange?.(next);
  }, []);

  useEffect(() => {
    if (!drag) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      start.current = null;
      update(null);
    });
  }, [drag, update]);

  const lineAt = (x: number, y: number): number | null => {
    if (typeof document === "undefined") return null;
    const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-w4-line]");
    const value = hit ? Number(hit.dataset.w4Line) : NaN;
    return Number.isFinite(value) ? value : null;
  };

  const handlers = (part: P) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      start.current = { part, x: event.clientX, y: event.clientY, moved: false, id: event.pointerId };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const begun = start.current;
      if (!begun || begun.id !== event.pointerId) return;
      if (!begun.moved && Math.hypot(event.clientX - begun.x, event.clientY - begun.y) < THRESHOLD) return;
      begun.moved = true;
      const root = container.current?.getBoundingClientRect();
      if (!root) return;
      update({
        part,
        at: { x: event.clientX - root.left, y: event.clientY - root.top },
        line: lineAt(event.clientX, event.clientY),
        client: { x: event.clientX, y: event.clientY },
      });
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      const begun = start.current;
      start.current = null;
      if (!begun || begun.id !== event.pointerId) return;
      if (!begun.moved) {
        update(null);
        return;
      }
      event.preventDefault();
      dragged.current = true;
      const line = lineAt(event.clientX, event.clientY);
      update(null);
      if (line !== null) latest.current.onLand(part, line);
    },
    onPointerCancel: () => {
      start.current = null;
      update(null);
    },
    onClick: (event: { readonly detail: number }) => {
      // A drag ends in pointerup and then a click: only a real tap picks.
      if (dragged.current) {
        dragged.current = false;
        return;
      }
      latest.current.onTap(part, event.detail === 0);
    },
  });

  return { drag, handlers };
}

/** The clear loupe above the finger: the line under it, re-rendered at 1.25x. */
export function Loupe({ at, children }: { readonly at: Point; readonly children: ReactNode }) {
  return (
    <span className="w4-loupe" style={{ left: at.x, top: at.y - 56 }} aria-hidden="true">
      {children}
    </span>
  );
}
