"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { hashSeed, renderFigure, type FigureSpec } from "@/lib/figures";
import { glide, measure, placeHits, unitsPerPixel, type Box } from "./geometry";
import { VARIANT_WIDTH, type Variant } from "./stage-controller";
import type { CanvasItem } from "./types";
import { useStage } from "./use-stage";

export interface FigureCanvasProps {
  /** The spec to draw right now; the parent applies sort, chip and toggle state. */
  readonly spec: FigureSpec;
  /** Things a reader can point at. Each id must be a data-id in the SVG. */
  readonly items?: readonly CanvasItem[];
  /** Line under the figure when nothing is pointed at. */
  readonly summary: string;
  /** Changes when rows move (sort, expand): the rows glide to their new place. */
  readonly layoutKey?: string;
  readonly groupLabel?: string;
  /** Keep the line for screen readers only (the figure already prints the same sentence). */
  readonly quiet?: boolean;
  /** Next item for an arrow key, or null. Default: linear in item order. */
  readonly navigate?: (from: string, key: string) => string | null;
}

const NO_PREFERENCE = "(prefers-reduced-motion: no-preference)";

/** The spec for one variant: own ids (patterns must not clash) and one shared seed. */
function forVariant(spec: FigureSpec, variant: Variant): FigureSpec {
  return { ...spec, id: `${spec.id}--${variant}`, seed: spec.seed ?? hashSeed(spec.id) } as FigureSpec;
}

/** Arrow keys walk the items in order; Home and End jump to the ends. */
export function linearNavigate(ids: readonly string[]) {
  return (from: string, key: string): string | null => {
    const i = ids.indexOf(from);
    if (i < 0) return null;
    switch (key) {
      case "ArrowDown":
      case "ArrowRight":
        return ids[Math.min(ids.length - 1, i + 1)] ?? null;
      case "ArrowUp":
      case "ArrowLeft":
        return ids[Math.max(0, i - 1)] ?? null;
      case "Home":
        return ids[0] ?? null;
      case "End":
        return ids[ids.length - 1] ?? null;
      default:
        return null;
    }
  };
}

function canMove(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(NO_PREFERENCE).matches;
}

/**
 * The live part of a figure: both SVG variants from the server render, the
 * one-shot reveal, hit areas with a roving keyboard path, a pinned state and
 * the line that says what is pointed at. Without script the markup is the
 * finished figure; with reduced motion nothing moves.
 */
export function FigureCanvas({
  spec,
  items = [],
  summary,
  layoutKey = "",
  groupLabel = "Einzelwerte",
  quiet = false,
  navigate,
}: FigureCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const snap = useStage(stageRef);
  const [hover, setHover] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [tabStop, setTabStop] = useState<string | null>(null);

  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const walk = useMemo(() => navigate ?? linearNavigate(ids), [navigate, ids]);

  const candidate = hover ?? focused ?? pinned;
  const active = candidate !== null && byId.has(candidate) ? candidate : null;
  const tabId = tabStop !== null && byId.has(tabStop) ? tabStop : (ids[0] ?? null);
  const live = snap.ready && snap.progress >= 1 && items.length > 0;
  const variants: readonly Variant[] = snap.variant ? [snap.variant] : ["compact", "wide"];

  const before = useRef<ReadonlyMap<string, Box> | null>(null);
  const lastKey = useRef(layoutKey);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !snap.ready || snap.progress < 1) return undefined;
    const run = (animate: boolean): void => {
      const now = measure(stage);
      placeHits(stage, now);
      if (animate && before.current && canMove()) {
        glide(before.current, now, unitsPerPixel(stage));
      }
      before.current = new Map([...now].map(([id, found]) => [id, found.box]));
    };
    run(lastKey.current !== layoutKey);
    lastKey.current = layoutKey;
    if (typeof window.ResizeObserver !== "function") return undefined;
    const observer = new window.ResizeObserver(() => run(false));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [snap.ready, snap.progress, snap.variant, layoutKey, spec, items, live]);

  const focusHit = (id: string): void => {
    const stage = stageRef.current;
    const target = stage
      ? [...stage.querySelectorAll<HTMLElement>("[data-hit]")].find((el) => el.dataset["hit"] === id)
      : undefined;
    target?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const origin = (event.target as HTMLElement).closest<HTMLElement>("[data-hit]");
    const from = origin?.dataset["hit"];
    if (!from) return;
    if (event.key === "Escape") {
      setPinned(null);
      setHover(null);
      return;
    }
    const to = walk(from, event.key);
    if (to !== null) {
      event.preventDefault();
      focusHit(to);
    }
  };

  return (
    <>
      <div className="bf-stage" ref={stageRef} data-ready={snap.ready}>
        {variants.map((variant) => (
          <div key={variant} className="bf-variant" data-bf-variant={variant}>
            {renderFigure(forVariant(spec, variant), snap.progress, {
              width: VARIANT_WIDTH[variant],
              theme: "web",
              highlight: active ?? undefined,
            })}
          </div>
        ))}
        {live ? (
          <div className="bf-hits" role="group" aria-label={groupLabel} onKeyDown={onKeyDown}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="bf-hit"
                data-hit={item.id}
                aria-label={item.label}
                aria-pressed={pinned === item.id}
                tabIndex={tabId === item.id ? 0 : -1}
                onClick={() => setPinned((current) => (current === item.id ? null : item.id))}
                onFocus={() => {
                  setFocused(item.id);
                  setTabStop(item.id);
                }}
                onBlur={() => setFocused(null)}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHover(item.id);
                }}
                onPointerLeave={() => setHover(null)}
              />
            ))}
          </div>
        ) : null}
      </div>
      <p className={quiet ? "bf-sr" : "bf-detail"} aria-live="polite" aria-atomic="true" data-ready={snap.ready}>
        {active !== null ? (byId.get(active)?.detail ?? summary) : summary}
      </p>
    </>
  );
}
