"use client";

import { useEffect, useId, useState } from "react";
import { useElementVisibility, useTicker } from "@/lib/data-science/hooks";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { DsNumberedChapterId } from "@/lib/data-science/types";
import { useDataScienceLocale } from "../locale-context";

// ─── FlowingPipeline ────────────────────────────────
//
// Typed port of Ch_Overview.js's `FlowingPipeline`, redrawn in the
// Werkzeichnung pictogram style (design direction 7.4): the first six stages
// of the working cycle as square ink nodes on a 2px ink line, a dashed return
// line labelled "Rückmeldung", and one Mennige node where the reader starts.
// The source's pastel round nodes, gradient line, glow filters and coloured
// particles are gone. The small glyph inside each node still moves while the
// drawing is in view (useTicker honours prefers-reduced-motion).

interface Station {
  readonly id: DsNumberedChapterId;
  readonly lab: string;
  readonly n: string;
  readonly cx: number;
  readonly cy: number;
  readonly glyph: "cloud" | "scatter" | "filter" | "gears" | "curve" | "target";
}

const STATIONS: readonly Station[] = [
  {
    id: "fund",
    lab: "Data",
    n: "01",
    cx: 150,
    cy: 150,
    glyph: "cloud",
  },
  {
    id: "explore",
    lab: "Explore",
    n: "02",
    cx: 380,
    cy: 150,
    glyph: "scatter",
  },
  {
    id: "clean",
    lab: "Clean",
    n: "03",
    cx: 610,
    cy: 150,
    glyph: "filter",
  },
  {
    id: "feature",
    lab: "Feature",
    n: "04",
    cx: 610,
    cy: 400,
    glyph: "gears",
  },
  {
    id: "model",
    lab: "Model",
    n: "05",
    cx: 380,
    cy: 400,
    glyph: "curve",
  },
  {
    id: "eval",
    lab: "Evaluate",
    n: "06",
    cx: 150,
    cy: 400,
    glyph: "target",
  },
];

const STATION_LABELS_DE: Readonly<Record<DsNumberedChapterId, string>> = {
  fund: "Daten",
  explore: "Exploration",
  clean: "Bereinigung",
  feature: "Merkmale",
  model: "Modell",
  eval: "Evaluation",
  interp: "Interpretation",
  exp: "Experimente",
  causal: "Kausalität",
  peek: "Peeking",
  deploy: "Betrieb",
  cap: "Abschluss",
};

interface StationGlyphProps {
  readonly kind: Station["glyph"];
  /** Stroke and fill colour; the drawing passes currentColor. */
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
        dots.push(
          <circle
            key={i}
            cx={Math.cos(a) * r}
            cy={Math.sin(a) * r}
            r={1.8}
            {...common}
          />,
        );
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
          <line
            x1="-14"
            y1="12"
            x2="14"
            y2="12"
            stroke={hue}
            strokeWidth="0.9"
            opacity="0.5"
          />
          <line
            x1="-14"
            y1="12"
            x2="-14"
            y2="-12"
            stroke={hue}
            strokeWidth="0.9"
            opacity="0.5"
          />
          {dots}
        </g>
      );
    }
    case "filter": {
      const drip1 = 6 + 12 * ((t * 0.6 + phase * 0.3) % 1);
      const drip2 = 6 + 12 * ((t * 0.6 + 0.33 + phase * 0.3) % 1);
      return (
        <g>
          <path
            d="M -12 -10 L 12 -10 L 4 2 L 4 10 L -4 10 L -4 2 Z"
            fill="none"
            stroke={hue}
            strokeWidth="1.6"
          />
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
          <line
            x1="-14"
            y1="10"
            x2="14"
            y2="10"
            stroke={hue}
            strokeWidth="0.9"
            opacity="0.4"
          />
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke={hue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      );
    }
    case "target": {
      const rot = (t * 60) % 360;
      return (
        <g>
          <circle
            r="10"
            fill="none"
            stroke={hue}
            strokeWidth="1.2"
            opacity="0.35"
          />
          <circle
            r="6"
            fill="none"
            stroke={hue}
            strokeWidth="1.4"
            opacity="0.6"
          />
          <circle r={2.2} {...common} />
          <g transform={`rotate(${rot})`}>
            <line
              x1="-13"
              y1="0"
              x2="-8"
              y2="0"
              stroke={hue}
              strokeWidth="1.5"
            />
            <line x1="8" y1="0" x2="13" y2="0" stroke={hue} strokeWidth="1.5" />
          </g>
        </g>
      );
    }
  }
}

export function FlowingPipeline() {
  const { locale, text } = useDataScienceLocale();
  // Keep the server render and the first client render byte-identical. Starting
  // the RAF immediately can update floating-point SVG attributes while React is
  // still hydrating this large tree, producing an intermittent mismatch.
  const [animationReady, setAnimationReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimationReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const [containerRef, inView] = useElementVisibility<HTMLDivElement>({
    rootMargin: "0px 0px -50% 0px",
  });
  const t = useTicker(animationReady && inView);
  const arrowId = `ov-loop-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const W = 760;
  const H = 540;
  const HALF = 34;

  // Two rows: 01 to 03 left to right, 04 to 06 right to left. The forward
  // line runs straight from node to node; the node squares cover the joints. The return line leaves the last node to the left, runs up the
  // margin and enters the first node from the left with an arrowhead.
  const forward = STATIONS.map((s) => `${s.cx},${s.cy}`).join(" ");
  const first = STATIONS[0]!;
  const last = STATIONS[STATIONS.length - 1]!;
  const RETURN_X = 44;
  const returnPath = `M ${last.cx - HALF} ${last.cy} L ${RETURN_X} ${last.cy} L ${RETURN_X} ${first.cy} L ${first.cx - HALF - 4} ${first.cy}`;

  return (
    <div ref={containerRef} className="ov-loop-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="ov-loop"
        role="group"
        aria-label={text(
          "Working cycle of the course",
          "Arbeitszyklus des Kurses",
        )}
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path className="ov-loop-arrow" d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <polyline className="ov-loop-line" points={forward} />
        <path
          className="ov-loop-return"
          d={returnPath}
          markerEnd={`url(#${arrowId})`}
        />
        <g transform={`translate(${RETURN_X + 14} 268)`}>
          <text className="ov-loop-feedback">
            {text("Feedback", "Rückmeldung")}
          </text>
          <text className="ov-loop-caption" y="24">
            {text("the loop closes", "der Zyklus schließt sich")}
          </text>
        </g>
        {STATIONS.map((s, i) => {
          const label = locale === "de" ? STATION_LABELS_DE[s.id] : s.lab;
          const isStart = i === 0;
          const onTopRow = i < 3;
          return (
            <g key={s.id} transform={`translate(${s.cx} ${s.cy})`}>
              <a
                className={isStart ? "ov-loop-node is-start" : "ov-loop-node"}
                href={dsChapterHref(s.id, locale)}
                aria-label={`${s.n} · ${label} - ${text("Open chapter", "Kapitel öffnen")}`}
              >
                <rect
                  className="ov-loop-box"
                  x={-HALF}
                  y={-HALF}
                  width={HALF * 2}
                  height={HALF * 2}
                />
                <g className="ov-loop-glyph">
                  <StationGlyph
                    kind={s.glyph}
                    hue="currentColor"
                    t={t}
                    phase={i}
                  />
                </g>
                {isStart ? (
                  <text
                    className="ov-loop-start"
                    y={-HALF - 44}
                    textAnchor="middle"
                  >
                    {text("Start here", "Hier beginnen")}
                  </text>
                ) : null}
                {/* Top-row labels sit above their node and bottom-row labels
                    below, so no label crosses the line between the rows. */}
                <text
                  className="ov-loop-label"
                  y={onTopRow ? -HALF - 14 : HALF + 30}
                  textAnchor="middle"
                >
                  {s.n} · {label}
                </text>
              </a>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default FlowingPipeline;
