"use client";

/**
 * The live part of Das Feld: a canvas painted from the frame buffer, a label
 * overlay for the bins, pointer hover on classes. Loaded after idle as its own
 * chunk. It draws only when the progress, the focus class or the size changed
 * (no idle animation frame), caps the device pixel ratio, and allocates its
 * buffer once per size.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { closestStage, subscribeStage } from "@/components/book-reader/stage/stage-protocol";
import { PALETTES, compileFeld, createFrameBuffer, feldFrame, type FigureSpecOf } from "@/lib/figures";
import { FELD_FIELDS, FELD_STRIDE, type FeldModel } from "@/lib/figures";
import { paintFeld, type PaintContext } from "./canvas-paint";

export interface FeldLiveProps {
  readonly spec: FigureSpecOf<"field">;
  /** Progress when the figure stands alone on a page (the first-view reveal). */
  readonly progress: number;
  /** Inside a chapter stage the painter listens to the stage events itself and draws without React. */
  readonly stage: boolean;
  /** Class id in focus (hover, keyboard or pin), or null. */
  readonly focusClass: string | null;
  /** Called when the scene on show or its settled state changes. */
  readonly onScene: (index: number, settled: boolean) => void;
  readonly onHover: (classId: string | null) => void;
  readonly onPin: (classId: string) => void;
}

/** Most device pixels per CSS pixel: 2, and 1.5 on four cores or fewer (mid-range phones). */
export function dprCap(win: Window): number {
  const cores = win.navigator.hardwareConcurrency || 4;
  return Math.min(win.devicePixelRatio || 1, cores <= 4 ? 1.5 : 2);
}

interface Size {
  readonly w: number;
  readonly h: number;
}

const START: Size = { w: 340, h: 230 };

/** The class under a point in a frame buffer, or -1. Linear in the squares, run on pointer moves only. */
export function classAt(buf: Float32Array, model: FeldModel, x: number, y: number): number {
  for (let i = model.capacity - 1; i >= 0; i -= 1) {
    const b = i * FELD_STRIDE;
    const cls = buf[b + FELD_FIELDS.cls] ?? -1;
    if (cls <= 0) continue;
    const s = buf[b + FELD_FIELDS.size] ?? 0;
    const sx = buf[b + FELD_FIELDS.x] ?? 0;
    const sy = buf[b + FELD_FIELDS.y] ?? 0;
    // Half a gap of slack, so a click between two squares still finds its class.
    if (x >= sx - 1 && x <= sx + s + 1 && y >= sy - 1 && y <= sy + s + 1) return cls;
  }
  return -1;
}

export function FeldLive({ spec, progress, stage, focusClass, onScene, onHover, onPin }: FeldLiveProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<Size>(START);
  const [display, setDisplay] = useState(spec.data.scenes.length - 1);
  const [settled, setSettled] = useState(true);

  const model = useMemo(() => compileFeld(spec.data, { width: size.w, height: size.h, lang: spec.lang === "en" ? "en" : "de" }), [spec.data, spec.lang, size.w, size.h]);
  const buf = useMemo(() => createFrameBuffer(model), [model]);
  const focusIndex = focusClass === null ? -1 : (model.classIndex.get(focusClass) ?? -1);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    const read = (): void => {
      const w = Math.max(120, Math.round(el.clientWidth));
      const h = Math.max(120, Math.round(el.clientHeight));
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    read();
    if (typeof window.ResizeObserver !== "function") return undefined;
    const observer = new window.ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Latest values for the imperative painter; React is not involved per frame.
  const latest = useRef({ model, buf, focusIndex, size, display, settled, onScene });
  latest.current = { model, buf, focusIndex, size, display, settled, onScene };
  const shown = useRef<string>("");
  const current = useRef(progress);

  const draw = useRef((p: number): void => {
    const canvas = canvasRef.current;
    const L = latest.current;
    if (!canvas) return;
    const dpr = dprCap(window);
    const key = `${L.size.w}x${L.size.h}:${dpr}:${p.toFixed(4)}:${L.focusIndex}:${L.model.scenes.length}`;
    const info = feldFrame(L.model, p, L.buf);
    if (info.display !== L.display) setDisplay(info.display);
    if (info.settled !== L.settled) setSettled(info.settled);
    if (key === shown.current) return;
    shown.current = key;
    const pw = Math.round(L.size.w * dpr);
    const ph = Math.round(L.size.h * dpr);
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintFeld(ctx as unknown as PaintContext, L.buf, L.model, {
      pal: PALETTES.web,
      dpr,
      width: L.size.w,
      height: L.size.h,
      scene: info.index,
      focus: L.focusIndex,
    });
  }).current;

  // Stage: subscribe to the shell's events and draw straight from them. Alone: draw the reveal progress.
  useLayoutEffect(() => {
    const root = stage ? closestStage(hostRef.current) : null;
    if (root) {
      return subscribeStage(root, (state) => {
        current.current = state.mode === "static" ? 1 : state.progress;
        draw(current.current);
      });
    }
    current.current = progress;
    draw(progress);
    return undefined;
  }, [stage, progress, draw]);

  // A change of size or focus repaints at the progress in force.
  useLayoutEffect(() => {
    draw(current.current);
  }, [model, focusIndex, draw]);

  useEffect(() => {
    onScene(display, settled);
  }, [display, settled, onScene]);

  const scene = model.scenes[display] ?? model.scenes[0];
  const pointer = (event: { clientX: number; clientY: number; currentTarget: HTMLCanvasElement }): number => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * size.w;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * size.h;
    return classAt(buf, model, x, y);
  };
  const idOf = (cls: number): string | null => (cls > 0 ? (model.classes[cls]?.id ?? null) : null);

  return (
    <div className="hf-live" ref={hostRef}>
      <canvas
        ref={canvasRef}
        className="hf-canvas"
        width={Math.round(size.w)}
        height={Math.round(size.h)}
        aria-hidden="true"
        data-hf-canvas
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") onHover(idOf(pointer(event)));
        }}
        onPointerLeave={() => onHover(null)}
        onClick={(event) => {
          const id = idOf(pointer(event));
          if (id) onPin(id);
        }}
      />
      {settled && scene && scene.labels.length > 0 ? (
        <svg className="hf-labels" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
          {scene.labels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={l.y}
              textAnchor={l.anchor}
              fontSize={l.size ?? (l.role === "value" ? 14 : 13)}
              fontWeight={l.role === "value" ? 700 : 600}
              data-t={l.role}
            >
              {l.text}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
