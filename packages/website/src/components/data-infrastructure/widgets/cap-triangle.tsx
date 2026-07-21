"use client";

// Ported from data-infrastructure/js/data-widgets.js's CapTriangle (lines
// 228-470) — single-canvas, click-driven, no DOM-overlay coordinate mapping
// (plan 010 stage 6). Deliberate simplification from source: the source
// auto-emits a "client request" particle every ~800ms forever, which never
// lets the widget settle; here a small burst of request particles fires on
// each pick/split interaction instead, preserving the real visual (traffic
// flowing to the cluster, colored by outcome) while staying interaction-
// driven so the RAF loop can genuinely idle between interactions.

import { useCallback, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface CapTriangleProps {
  readonly lessonId: string;
  readonly cpId: string;
}

type CapPick = "CP" | "AP" | "CA";

const PICK_TEXT: Record<CapPick, string> = {
  CP: "CP — refuses writes on the minority side during partition. HBase, MongoDB (default), Spanner.",
  AP: "AP — both sides keep serving; reads may be stale, will reconcile later. Cassandra, DynamoDB, Riak.",
  CA: "CA — only safe on a single node. Real distributed systems must pick CP or AP. Single-node Postgres.",
};

interface RequestParticle {
  x: number;
  y: number;
  readonly x0: number;
  readonly y0: number;
  x1: number;
  y1: number;
  t: number;
  returning: boolean;
  readonly born: number;
  readonly outcome: "ok" | "stale" | "reject" | "fail";
}

const CX = 190;
const CY = 190;
const R = 130;
const VERTS = {
  C: { x: CX, y: CY - R },
  A: { x: CX - R * 0.866, y: CY + R * 0.5 },
  P: { x: CX + R * 0.866, y: CY + R * 0.5 },
};
const BASE_X = 470;
const CLUSTER_CY = 190;
const CLIENT = { x: 620, y: CLUSTER_CY };

function clusterPos(splitT: number) {
  const offset = splitT * 60;
  return {
    n1: { x: BASE_X - 55 - offset, y: CLUSTER_CY - 40 },
    n2: { x: BASE_X - 35 - offset, y: CLUSTER_CY + 30 },
    n3: { x: BASE_X + 35 + offset, y: CLUSTER_CY - 40 },
    n4: { x: BASE_X + 35 + offset, y: CLUSTER_CY + 30 },
  };
}

export function CapTriangle({ lessonId, cpId }: CapTriangleProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [pick, setPick] = useState<CapPick | null>(null);
  const [split, setSplit] = useState(false);
  const [statusText, setStatusText] = useState(
    "Pick a pair · then inject a partition to see the trade in action.",
  );

  const picksRef = useRef(0);
  const splitTRef = useRef(0);
  const particlesRef = useRef<RequestParticle[]>([]);
  const pickRef = useRef<CapPick | null>(null);
  const splitRef = useRef(false);

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 300 });

  const draw = useCallback((now: number): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setContextUnavailable(true);
      return false;
    }
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    ctx.clearRect(0, 0, w, h);

    const target = splitRef.current ? 1 : 0;
    splitTRef.current += (target - splitTRef.current) * 0.08;
    const splitT = splitTRef.current;

    const edges: { a: keyof typeof VERTS; b: keyof typeof VERTS; label: CapPick }[] = [
      { a: "C", b: "A", label: "CA" },
      { a: "C", b: "P", label: "CP" },
      { a: "A", b: "P", label: "AP" },
    ];
    for (const e of edges) {
      const isPick = pickRef.current === e.label;
      ctx.strokeStyle = isPick ? "#cf8a3f" : "rgba(91,138,143,0.35)";
      ctx.lineWidth = isPick ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(VERTS[e.a].x, VERTS[e.a].y);
      ctx.lineTo(VERTS[e.b].x, VERTS[e.b].y);
      ctx.stroke();
      const mx = (VERTS[e.a].x + VERTS[e.b].x) / 2;
      const my = (VERTS[e.a].y + VERTS[e.b].y) / 2;
      ctx.fillStyle = isPick ? "#cf8a3f" : "rgba(91,138,143,0.6)";
      ctx.font = isPick ? "bold 13px monospace" : "12px monospace";
      ctx.fillText(e.label, mx - 10, my + 4);
    }
    for (const key of Object.keys(VERTS) as (keyof typeof VERTS)[]) {
      const v = VERTS[key];
      const inPick = pickRef.current != null && pickRef.current.includes(key);
      ctx.fillStyle = inPick ? "#5b8a8f" : "#ffffff";
      ctx.strokeStyle = inPick ? "#3a6b70" : "rgba(91,138,143,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = inPick ? "#fff" : "rgba(91,138,143,0.85)";
      ctx.font = "bold 18px monospace";
      ctx.fillText(key, v.x - 6, v.y + 6);
    }

    if (splitT > 0.05) {
      ctx.strokeStyle = "rgba(184,90,74,0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(BASE_X, 60);
      ctx.lineTo(BASE_X, 320);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#b85a4a";
      ctx.font = "bold 12px monospace";
      ctx.fillText("PARTITION", BASE_X - 30, 56);
    }

    const c = clusterPos(splitT);
    ctx.strokeStyle = "rgba(91,138,143,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.n1.x, c.n1.y);
    ctx.lineTo(c.n2.x, c.n2.y);
    ctx.moveTo(c.n3.x, c.n3.y);
    ctx.lineTo(c.n4.x, c.n4.y);
    ctx.stroke();
    for (const [i, n] of [c.n1, c.n2, c.n3, c.n4].entries()) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#5b8a8f";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5b8a8f";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`n${i + 1}`, n.x - 8, n.y + 4);
    }
    ctx.fillStyle = "#cf8a3f";
    ctx.fillRect(CLIENT.x - 32, CLIENT.y - 14, 64, 28);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.fillText("client", CLIENT.x - 18, CLIENT.y + 4);

    const now2 = now;
    particlesRef.current = particlesRef.current.filter((pt) => {
      const dt = now2 - pt.born;
      const dur = 500;
      if (!pt.returning) {
        pt.t = Math.min(1, dt / dur);
        const e = 1 - Math.pow(1 - pt.t, 3);
        pt.x = pt.x0 + (pt.x1 - pt.x0) * e;
        pt.y = pt.y0 + (pt.y1 - pt.y0) * e;
        if (pt.t >= 1) {
          pt.returning = true;
          return true;
        }
      } else {
        const rt = Math.min(1, (dt - dur) / dur);
        const e = 1 - Math.pow(1 - rt, 3);
        pt.x = pt.x1 + (CLIENT.x - 32 - pt.x1) * e;
        pt.y = pt.y1 + (CLIENT.y - pt.y1) * e;
        if (rt >= 1) return false;
      }
      const col =
        pt.outcome === "ok" ? "#3f8264" : pt.outcome === "stale" ? "#cf8a3f" : "#b85a4a";
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    return Math.abs(target - splitTRef.current) > 0.002 || particlesRef.current.length > 0;
  }, []);

  const { wake } = useCanvasRAF(draw);

  const emitRequests = useCallback(() => {
    const c = clusterPos(splitTRef.current);
    const targets = [c.n3, c.n4];
    for (let i = 0; i < 3; i++) {
      const target = targets[i % 2];
      const partitionedSide = target.x < BASE_X;
      let outcome: RequestParticle["outcome"] = "ok";
      if (splitRef.current) {
        if (pickRef.current === "CP") outcome = partitionedSide ? "reject" : "ok";
        else if (pickRef.current === "AP") outcome = "stale";
        else if (pickRef.current === "CA") outcome = partitionedSide ? "fail" : "ok";
      }
      particlesRef.current.push({
        x: CLIENT.x - 32,
        y: CLIENT.y,
        x0: CLIENT.x - 32,
        y0: CLIENT.y,
        x1: target.x,
        y1: target.y,
        t: 0,
        returning: false,
        born: performance.now() + i * 150,
        outcome,
      });
    }
    wake();
  }, [wake]);

  const setPickAndText = useCallback(
    (p: CapPick) => {
      pickRef.current = p;
      setPick(p);
      picksRef.current += 1;
      setStatusText(PICK_TEXT[p]);
      emitRequests();
      if (picksRef.current >= 2) complete();
    },
    [complete, emitRequests],
  );

  const toggleSplit = useCallback(() => {
    splitRef.current = !splitRef.current;
    setSplit(splitRef.current);
    emitRequests();
  }, [emitRequests]);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Sim · CAP — pick the partition you accept {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="CAP theorem triangle"
          summary="Pick two of Consistency, Availability, and Partition tolerance, then inject a network split to see the real trade-off play out against a 4-node cluster."
        />
      ) : (
        <div ref={wrapRef} className="h-[320px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Interactive CAP theorem triangle showing the trade-off between consistency, availability, and partition tolerance."
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["CP", "AP", "CA"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPickAndText(p)}
            aria-pressed={pick === p}
            className={cn(
              "border-2 px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide transition-colors",
              pick === p
                ? "border-foreground bg-brand-orange text-white"
                : "border-border bg-background text-foreground hover:border-brand-orange/60",
            )}
          >
            {p === "CP" ? "CP — consistent + partition-tolerant" : p === "AP" ? "AP — available + partition-tolerant" : "CA — single-node only"}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleSplit}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          {split ? "✓ heal partition" : "⚡ inject network split"}
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{statusText}</p>
    </div>
  );
}

export default CapTriangle;
