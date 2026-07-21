"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTicker } from "@/lib/data-science/hooks";
import type { DsNumberedChapterId } from "@/lib/data-science/types";

// ─── FlowingPipeline ────────────────────────────────
//
// Typed port of Ch_Overview.js's `FlowingPipeline`: an animated loop
// diagram of the first 6 DS-loop stages, with particles flowing along a
// smooth bezier path and per-station animated glyphs. Source declares an
// unused `mulberry32(7)` ref inside this component (never read anywhere
// in its body) — dropped here as dead code, not a behavior change.

interface Station {
  readonly id: DsNumberedChapterId;
  readonly lab: string;
  readonly n: string;
  readonly cx: number;
  readonly cy: number;
  readonly hue: string;
  readonly glyph: "cloud" | "scatter" | "filter" | "gears" | "curve" | "target";
}

const STATIONS: readonly Station[] = [
  { id: "fund", lab: "Data", n: "01", cx: 120, cy: 90, hue: "#5B3EE8", glyph: "cloud" },
  { id: "explore", lab: "Explore", n: "02", cx: 330, cy: 180, hue: "#1CA5D9", glyph: "scatter" },
  { id: "clean", lab: "Clean", n: "03", cx: 560, cy: 120, hue: "#1FAF7E", glyph: "filter" },
  { id: "feature", lab: "Feature", n: "04", cx: 640, cy: 300, hue: "#6BCF3F", glyph: "gears" },
  { id: "model", lab: "Model", n: "05", cx: 430, cy: 380, hue: "#E8A031", glyph: "curve" },
  { id: "eval", lab: "Evaluate", n: "06", cx: 180, cy: 440, hue: "#F25F3A", glyph: "target" },
];

function buildSmoothPath(pts: readonly (readonly [number, number])[]): string {
  if (pts.length < 2) return "";
  const p0Start = pts[0]!;
  let d = `M ${p0Start[0]} ${p0Start[1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

interface StationGlyphProps {
  readonly kind: Station["glyph"];
  readonly hue: string;
  readonly t: number;
  readonly phase: number;
}

function StationGlyph({ kind, hue, t, phase }: StationGlyphProps) {
  const common = { fill: hue, stroke: "none" } as const;
  switch (kind) {
    case "cloud": {
      const dots = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + t * 0.6;
        const r = 8 + 2 * Math.sin(t * 2 + i + phase);
        dots.push(<circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={1.8} {...common} />);
      }
      dots.push(<circle key="c" cx="0" cy="0" r={2.2} {...common} />);
      return <g>{dots}</g>;
    }
    case "scatter": {
      const dots = [];
      for (let i = 0; i < 6; i++) {
        const seed = (i * 13 + phase * 17) % 19;
        const x = -10 + (seed / 19) * 20 + 0.8 * Math.sin(t + i);
        const y = 10 - (((seed * 7) % 19) / 19) * 20 + 0.8 * Math.cos(t + i);
        dots.push(<circle key={i} cx={x} cy={y} r={1.6} {...common} />);
      }
      return (
        <g>
          <line x1="-14" y1="12" x2="14" y2="12" stroke={hue} strokeWidth="0.9" opacity="0.5" />
          <line x1="-14" y1="12" x2="-14" y2="-12" stroke={hue} strokeWidth="0.9" opacity="0.5" />
          {dots}
        </g>
      );
    }
    case "filter": {
      const drip1 = 6 + 12 * ((t * 0.6 + phase * 0.3) % 1);
      const drip2 = 6 + 12 * ((t * 0.6 + 0.33 + phase * 0.3) % 1);
      return (
        <g>
          <path d="M -12 -10 L 12 -10 L 4 2 L 4 10 L -4 10 L -4 2 Z" fill="none" stroke={hue} strokeWidth="1.6" />
          <circle cx="0" cy={drip1} r={1.4} {...common} />
          <circle cx="0" cy={drip2} r={1.4} {...common} opacity="0.6" />
        </g>
      );
    }
    case "gears": {
      const rot = (t * 40) % 360;
      const ticks = (r: number, dir: number) =>
        Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + (dir * rot * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r}
              y1={Math.sin(a) * r}
              x2={Math.cos(a) * (r + 3)}
              y2={Math.sin(a) * (r + 3)}
              stroke={hue}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          );
        });
      return (
        <g>
          <g transform="translate(-5 0)">
            <circle r="7" fill="none" stroke={hue} strokeWidth="1.5" />
            {ticks(7, 1)}
          </g>
          <g transform="translate(5 0)">
            <circle r="5" fill="none" stroke={hue} strokeWidth="1.5" />
            {ticks(5, -1)}
          </g>
        </g>
      );
    }
    case "curve": {
      const off = Math.sin(t * 0.7) * 2;
      const pts: string[] = [];
      for (let i = 0; i <= 20; i++) {
        const x = -13 + (i / 20) * 26;
        const s = Math.tanh((x + off) * 0.4);
        const y = -s * 8;
        pts.push(`${x},${y}`);
      }
      return (
        <g>
          <line x1="-14" y1="10" x2="14" y2="10" stroke={hue} strokeWidth="0.9" opacity="0.4" />
          <polyline points={pts.join(" ")} fill="none" stroke={hue} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    }
    case "target": {
      const rot = (t * 60) % 360;
      return (
        <g>
          <circle r="10" fill="none" stroke={hue} strokeWidth="1.2" opacity="0.35" />
          <circle r="6" fill="none" stroke={hue} strokeWidth="1.4" opacity="0.6" />
          <circle r={2.2} {...common} />
          <g transform={`rotate(${rot})`}>
            <line x1="-13" y1="0" x2="-8" y2="0" stroke={hue} strokeWidth="1.5" />
            <line x1="8" y1="0" x2="13" y2="0" stroke={hue} strokeWidth="1.5" />
          </g>
        </g>
      );
    }
  }
}

interface Particle {
  readonly x: number;
  readonly y: number;
  readonly hue: string;
  readonly size: number;
  readonly idx: number;
}

export interface FlowingPipelineProps {
  readonly onStageClick?: (id: DsNumberedChapterId) => void;
}

export function FlowingPipeline({ onStageClick }: FlowingPipelineProps) {
  const t = useTicker(true);
  const [hover, setHover] = useState<DsNumberedChapterId | null>(null);
  const W = 760;
  const H = 540;

  const pathD = useMemo(() => {
    const s0 = STATIONS[0]!;
    const s5 = STATIONS[5]!;
    const pathPts: (readonly [number, number])[] = STATIONS.map((s) => [s.cx, s.cy]);
    return (
      buildSmoothPath(pathPts) +
      ` C ${s5.cx - 120} ${s5.cy + 60}, ${s0.cx - 60} ${s0.cy + 200}, ${s0.cx} ${s0.cy}`
    );
  }, []);

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);

  useEffect(() => {
    if (pathRef.current && typeof pathRef.current.getTotalLength === "function") {
      setPathLen(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  const N_PARTICLES = 28;
  const particles: Particle[] = [];
  if (pathLen > 0 && pathRef.current && typeof pathRef.current.getPointAtLength === "function") {
    for (let i = 0; i < N_PARTICLES; i++) {
      const speed = 0.05;
      const phase = (i / N_PARTICLES + t * speed) % 1;
      const pt = pathRef.current.getPointAtLength(phase * pathLen);
      const hue = i % 4 === 0 ? "#5B3EE8" : i % 4 === 1 ? "#E8318F" : i % 4 === 2 ? "#6BCF3F" : "#1CA5D9";
      const size = 2.4 + 1.1 * Math.sin(t * 3 + i * 0.7);
      particles.push({ x: pt.x, y: pt.y, hue, size, idx: i });
    }
  }

  return (
    <div className="ov-loop-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ov-loop">
        <defs>
          <linearGradient id="loop-grad-l" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5B3EE8" stopOpacity="0.75" />
            <stop offset="0.5" stopColor="#E8318F" stopOpacity="0.75" />
            <stop offset="1" stopColor="#6BCF3F" stopOpacity="0.75" />
          </linearGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="paper-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dy="3" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.14" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path ref={pathRef} d={pathD} fill="none" stroke="url(#loop-grad-l)" strokeWidth="2.5" opacity="0.55" />
        <path d={pathD} fill="none" stroke="url(#loop-grad-l)" strokeWidth="10" opacity="0.08" filter="url(#soft-glow)" />
        {particles.map((p) => (
          <circle key={p.idx} cx={p.x} cy={p.y} r={p.size} fill={p.hue} opacity="0.85" filter="url(#soft-glow)" />
        ))}
        {STATIONS.map((s, i) => {
          const h = hover === s.id;
          const pulseR = 34 + 1.5 * Math.sin(t * 1.4 + i);
          return (
            <g
              key={s.id}
              className="ov-loop-node"
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onStageClick?.(s.id)}
              transform={`translate(${s.cx} ${s.cy})`}
            >
              <circle r={pulseR + 6} fill="none" stroke={s.hue} strokeWidth={h ? 1.6 : 0.8} opacity={h ? 0.6 : 0.22} />
              <circle r={pulseR} fill="#FFFDF7" stroke={s.hue} strokeWidth={h ? 2.6 : 1.8} filter="url(#paper-shadow)" />
              <StationGlyph kind={s.glyph} hue={s.hue} t={t} phase={i} />
              <text
                y={pulseR + 18}
                textAnchor="middle"
                fill={h ? s.hue : "#3A3540"}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.14em"
                style={{ textTransform: "uppercase" } as CSSProperties}
              >
                {s.n} · {s.lab}
              </text>
            </g>
          );
        })}
        <g transform="translate(70 330)">
          <text fontFamily="'Instrument Serif', serif" fontSize="22" fontStyle="italic" fill="#3A3540" opacity="0.5">
            feedback
          </text>
          <text
            y="18"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="9.5"
            fill="#6A6270"
            letterSpacing="0.14em"
            style={{ textTransform: "uppercase" } as CSSProperties}
          >
            the loop closes
          </text>
        </g>
      </svg>
    </div>
  );
}

export default FlowingPipeline;
