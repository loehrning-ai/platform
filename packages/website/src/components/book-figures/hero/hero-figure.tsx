"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  defaultDetentOf,
  hashSeed,
  pinItemsOf,
  readoutOf,
  renderFigure,
  type FigureSpec,
  type PinItem,
} from "@/lib/figures";
import { measure, placeHits } from "../basic/geometry";
import { VARIANT_WIDTH, type Variant } from "../basic/stage-controller";
import { FeldFigure } from "./feld-figure";
import { viewBoxOf } from "./hero-figure-shared";
import { useHeroProgress } from "./use-hero-progress";
import { useVariantShift } from "./use-variant-shift";
import { VariantControl } from "./variant-control";
import "./hero.css";

export interface HeroFigureProps {
  readonly spec: FigureSpec;
  /** Inside a chapter stage: the shell prints numeral, claim and unit line, the figure draws without them. */
  readonly bare?: boolean;
  /** Detent id per stage step (index = step); a step without one keeps the reader's choice. */
  readonly stepVariants?: readonly (string | undefined)[];
  /** Locale of the strings the figure writes itself and of its number format; default German. */
  readonly lang?: "de" | "en";
}

/** The spec for one layout: its own ids (patterns must not clash) and one shared seed. */
const forLayout = (spec: FigureSpec, layout: Variant): FigureSpec =>
  ({ ...spec, id: `${spec.id}--${layout}`, seed: spec.seed ?? hashSeed(spec.id) }) as FigureSpec;

/** Arrow keys walk the pin items; Home and End jump to the ends. */
function walk(ids: readonly string[], from: string, key: string): string | null {
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
}

/**
 * A hero figure: the finished SVG in the server markup (no script, print and
 * reduced motion see exactly this), then, once the island runs, the same
 * engine call with a live progress and a live detent. Das Feld (kind field)
 * hands over to the canvas painter; every other kind stays SVG.
 */
export function HeroFigure({ lang, ...props }: HeroFigureProps) {
  const spec = useMemo(() => (lang === undefined || props.spec.lang === lang ? props.spec : ({ ...props.spec, lang } as FigureSpec)), [props.spec, lang]);
  return spec.kind === "field" ? <FeldFigure spec={spec} bare={props.bare} /> : <SvgHero {...props} spec={spec} />;
}

function SvgHero({ spec, bare = false, stepVariants }: HeroFigureProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hp = useHeroProgress(rootRef);
  const fallback = defaultDetentOf(spec);
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const stepVariant = hp.inStage ? stepVariants?.[hp.step] : undefined;
  const target = picked ?? stepVariant ?? fallback;
  const shift = useVariantShift(target, hp.reduced);
  const [pinned, setPinned] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tabStop, setTabStop] = useState<string | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const variant = shift.variant;
  const items: readonly PinItem[] = useMemo(() => pinItemsOf(spec, variant), [spec, variant]);
  const byId = useMemo(() => new Map(items.map((q) => [q.id, q])), [items]);
  const ids = useMemo(() => items.map((q) => q.id), [items]);
  const candidate = hover ?? focused ?? pinned;
  const active = candidate !== null && byId.has(candidate) ? candidate : null;
  const tabId = tabStop !== null && byId.has(tabStop) ? tabStop : (ids[0] ?? null);
  const settled = hp.ready && hp.progress >= 1 && shift.shift >= 1;
  const layouts: readonly Variant[] = hp.layout ? [hp.layout] : ["compact", "wide"];
  // In a stage the control waits until the auto steps have been played: the first step is a clean picture.
  const showControl = !hp.inStage || stepVariants === undefined || hp.step >= 1;

  // In a stage the figure fits the box the shell leaves it: tell the engine its aspect.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !hp.inStage || typeof window.ResizeObserver !== "function") return undefined;
    const observe = (): void => setBox({ w: el.clientWidth, h: el.clientHeight });
    observe();
    const observer = new window.ResizeObserver(observe);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hp.inStage]);

  const options = (layout: Variant) => {
    const width = VARIANT_WIDTH[layout];
    const height = hp.inStage && box && box.w > 0 && box.h > 0 ? Math.round((width * box.h) / box.w) : undefined;
    return {
      width,
      theme: "web" as const,
      bare,
      height,
      highlight: active ?? undefined,
      variant: variant,
      from: shift.from,
      shift: shift.shift,
    };
  };

  const rendered = layouts.map((layout) => {
    const element = renderFigure(forLayout(spec, layout), hp.progress, options(layout));
    return { layout, element, ratio: viewBoxOf(element) };
  });

  const place = useCallback(() => {
    const stage = stageRef.current;
    if (stage) placeHits(stage, measure(stage));
  }, []);

  useLayoutEffect(() => {
    if (!settled) return undefined;
    place();
    const stage = stageRef.current;
    if (!stage || typeof window.ResizeObserver !== "function") return undefined;
    const observer = new window.ResizeObserver(place);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [settled, place, variant, hp.layout, items]);

  const focusHit = (id: string): void => {
    const stage = stageRef.current;
    [...(stage?.querySelectorAll<HTMLElement>("[data-hit]") ?? [])].find((el) => el.dataset["hit"] === id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const from = (event.target as HTMLElement).closest<HTMLElement>("[data-hit]")?.dataset["hit"];
    if (!from) return;
    if (event.key === "Escape") {
      setPinned(null);
      setHover(null);
      return;
    }
    const to = walk(ids, from, event.key);
    if (to !== null) {
      event.preventDefault();
      focusHit(to);
    }
  };

  const idle = useMemo(() => readoutOf(spec, variant), [spec, variant]);
  const line = active !== null ? (byId.get(active)?.detail ?? "") : idle;
  return (
    <div className="hs" ref={rootRef} data-hs-kind={spec.kind} data-hs-ready={hp.ready} data-hs-stage={hp.inStage}>
      <div className="hs-stage" ref={stageRef}>
        {rendered.map(({ layout, element, ratio }) => (
          <div
            key={layout}
            className="hs-variant"
            data-hs-variant={layout}
            style={{ aspectRatio: `${ratio.w} / ${ratio.h}` }}
          >
            {element}
          </div>
        ))}
        {settled && items.length > 0 ? (
          <div className="hs-hits" role="group" aria-label="Einzelwerte" onKeyDown={onKeyDown}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="hs-hit"
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
      {showControl ? <VariantControl spec={spec} value={target ?? ""} onChange={setPicked} /> : null}
      <p className="hs-readout" aria-live="polite" aria-atomic="true" data-hs-readout>
        {line}
      </p>
    </div>
  );
}
