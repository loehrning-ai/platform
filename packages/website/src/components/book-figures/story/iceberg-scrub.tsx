"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement } from "react";
import { formatDecimal, renderFigure, type FigureSpecOf } from "@/lib/figures";
import { FigureShell } from "./figure-shell";
import { COMPACT_WIDTH } from "./figure-svg";

/** Parts of the engine's iceberg in drawing order (kinds/iceberg.ts), after title, desc and defs. */
export const ICEBERG_PARTS = [
  { tag: "rect", name: "water", moves: false },
  { tag: "g", name: "body", moves: true },
  { tag: "line", name: "line", moves: false },
  { tag: "g", name: "tip", moves: true },
  { tag: "text", name: "linelabel", moves: false },
  { tag: "g", name: "tiplabel", moves: true },
  { tag: "g", name: "bodylabel", moves: true },
  { tag: "g", name: "total", moves: true },
] as const;

const HEADER_NODES = 3;

/**
 * Adds a class to each part of the finished iceberg so CSS can move it. The
 * engine draws the parts in a fixed order; if that order ever changes the
 * figure is returned untouched (finished, unanimated) rather than mis-tagged.
 */
export function tagIcebergParts(svg: ReactElement<{ children?: unknown }>): { svg: ReactElement; tagged: boolean } {
  const children = Children.toArray(svg.props.children as never);
  const parts = children.slice(HEADER_NODES);
  const matches =
    parts.length === ICEBERG_PARTS.length &&
    parts.every((part, i) => isValidElement(part) && part.type === ICEBERG_PARTS[i]?.tag);
  if (!matches) return { svg, tagged: false };
  const tagged = [
    ...children.slice(0, HEADER_NODES),
    ...parts.map((part, i) =>
      cloneElement(part as ReactElement<{ className?: string }>, { className: `${ICEBERG_PARTS[i]?.moves ? "bf-ice-part " : ""}bf-ice-${ICEBERG_PARTS[i]?.name}` }),
    ),
  ];
  return { svg: cloneElement(svg, undefined, ...tagged), tagged: true };
}

type Phase = "idle" | "armed" | "in";

interface IcebergScrubProps {
  readonly spec: FigureSpecOf<"iceberg">;
  readonly provisional?: boolean;
  readonly csvHref?: string;
}

/**
 * C2, the iceberg. Scroll scrub in CSS: where `animation-timeline: view()` is
 * supported the parts follow the scroll position while the stage is pinned;
 * elsewhere an IntersectionObserver plays the same keyframes once. Reduced
 * motion, no JS where the browser has no timeline, and print all show the
 * finished iceberg; the figure is the engine's output at progress 1.
 */
export function IcebergScrub({ spec, provisional, csvHref }: IcebergScrubProps) {
  const root = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const { svg } = tagIcebergParts(renderFigure(spec, 1, { width: COMPACT_WIDTH }) as ReactElement<{ children?: unknown }>);

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    // With a scroll timeline CSS drives everything; the observer is only the fallback.
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) return;
    let first = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((entry) => entry.isIntersecting);
        if (first) {
          first = false;
          if (seen) {
            observer.disconnect();
            return;
          }
          setPhase("armed");
          return;
        }
        if (seen) {
          setPhase("in");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const visible = spec.data.visible.value;
  const total = spec.data.total.value;

  return (
    <FigureShell spec={spec} provisional={provisional} csvHref={csvHref} className="bf-ice-figure">
      <div ref={root} className="bf-ice" data-phase={phase}>
        <div className="bf-ice-stage">
          <div className="bf-ice-chart">{svg}</div>
        </div>
      </div>
      <p className="bf-ice-text">
        Sichtbar sind {formatDecimal(visible, 1)} Prozent der Lohnsumme. Das Modell rechnet insgesamt mit {formatDecimal(total, 1)} Prozent.
      </p>
    </FigureShell>
  );
}
