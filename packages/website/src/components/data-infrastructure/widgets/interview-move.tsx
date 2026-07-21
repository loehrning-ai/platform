"use client";

// Ported from data-infrastructure/js/data-widgets.js's InterviewMove (lines
// 2477-2718): canvas progress track + a step-through move stage (plan 010
// stage 9). The 12-entry `moves` array is trusted static content ported
// verbatim into `lib/data-infrastructure/lessons/interview-playbook.ts`
// (INTERVIEW_MOVES) — rendered here via dangerouslySetInnerHTML since the
// source's real formatting (<b>/<code>/<pre>/<br>) is author-authored, not
// user input.

import { useCallback, useMemo, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { INTERVIEW_MOVES } from "@/lib/data-infrastructure/lessons/interview-playbook";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface InterviewMoveProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const TAG_COLOR: Record<string, string> = {
  clarify: "#5b8a8f",
  scope: "#5b8a8f",
  estimate: "#cf8a3f",
  api: "#3f8264",
  "data model": "#3f8264",
  storage: "#7a4a8a",
  streaming: "#a8632c",
  serving: "#cf8a3f",
  tradeoff: "#b85a4a",
  scale: "#b85a4a",
  "follow-up": "#5b8a8f",
};

function tagColor(tag: string): string {
  const key = tag.toLowerCase();
  for (const k of Object.keys(TAG_COLOR)) {
    if (key.includes(k.split(" ")[0])) return TAG_COLOR[k];
  }
  return "#5b8a8f";
}

function dotPos(i: number, total: number, width: number, height: number) {
  const padX = 40;
  const x = padX + (i / Math.max(1, total - 1)) * (width - 2 * padX);
  const y = height / 2 + Math.sin(i * 0.7) * (height * 0.16);
  return { x, y };
}

export function InterviewMove({ lessonId, cpId }: InterviewMoveProps): JSX.Element {
  const moves = INTERVIEW_MOVES;
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [cur, setCur] = useState(0);
  const curRef = useRef(0);
  curRef.current = cur;

  const show = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(moves.length - 1, i));
      setCur(next);
      if (next === moves.length - 1) complete();
    },
    [moves.length, complete],
  );

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 130 });

  const draw = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setContextUnavailable(true);
      return false;
    }
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.width;
    const h = rect.height || canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(91,138,143,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < moves.length; i++) {
      const p = dotPos(i, moves.length, w, h);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    for (let i = 0; i < moves.length; i++) {
      const p = dotPos(i, moves.length, w, h);
      const isCur = i === curRef.current;
      const isPast = i < curRef.current;
      const col = tagColor(moves[i].tag);
      ctx.fillStyle = isPast || isCur ? col : "oklch(0.985 0.003 240)";
      ctx.strokeStyle = col;
      ctx.lineWidth = isCur ? 2.5 : 1.5;
      const r = isCur ? 12 : isPast ? 9 : 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isPast || isCur ? "white" : col;
      ctx.font = "bold 10px monospace";
      const label = String(i + 1).padStart(2, "0");
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, p.x - tw / 2, p.y + 3.5);
    }
    return false;
  }, [moves]);

  useCanvasRAF(draw);

  const current = moves[cur];
  const currentColor = useMemo(() => tagColor(current.tag), [current.tag]);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Walkthrough · IC5 design · step through the moves {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="Interview move progress"
          summary={`Move ${cur + 1} of ${moves.length}: ${current.title}`}
        />
      ) : (
        <div ref={wrapRef} className="h-[130px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Interview-replay progress track showing the current move in a system-design walkthrough."
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 border-2 border-border bg-background p-4">
        <span
          className="inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: currentColor }}
        >
          {current.tag}
        </span>
        <h3 className="mt-2 text-[15px] font-semibold text-foreground">{current.title}</h3>
        <div
          className="prose-sm mt-2 text-[13.5px] leading-relaxed text-foreground [&_code]:font-mono [&_code]:text-[12px] [&_pre]:overflow-x-auto [&_pre]:bg-card [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-[11px]"
          // Trusted static content authored in lib/data-infrastructure/lessons/interview-playbook.ts, never user input.
          dangerouslySetInnerHTML={{ __html: current.body }}
        />
        <p className="mt-2 border-l-2 border-brand-orange/60 pl-3 text-[12px] italic text-muted-foreground">
          {current.note}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => show(cur - 1)}
          disabled={cur === 0}
          className={cn(
            "border-2 border-border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide",
            cur === 0 ? "cursor-not-allowed text-muted-foreground" : "text-foreground hover:border-brand-orange/60",
          )}
        >
          ◀ prev move
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">
          move <b className="text-foreground">{cur + 1}</b> / <b className="text-foreground">{moves.length}</b> ·{" "}
          {current.tag}
        </span>
        <button
          type="button"
          onClick={() => show(cur + 1)}
          disabled={cur === moves.length - 1}
          className={cn(
            "border-2 border-foreground px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide",
            cur === moves.length - 1
              ? "cursor-not-allowed border-border text-muted-foreground"
              : "bg-brand-orange text-white",
          )}
        >
          next move ▶
        </button>
      </div>
    </div>
  );
}

export default InterviewMove;
