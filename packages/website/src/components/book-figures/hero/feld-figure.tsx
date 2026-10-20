"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent } from "react";
import {
  feldModelFor,
  fieldClassDetail,
  fieldClassItems,
  fieldHeight,
  fieldNumeralText,
  hashSeed,
  renderFigure,
  type FigureSpec,
  type FigureSpecOf,
} from "@/lib/figures";
import { VARIANT_WIDTH, type Variant } from "../basic/stage-controller";
import type { FeldLiveProps } from "./feld-live";
import { useHeroEnv } from "./use-hero-progress";
import { viewBoxOf } from "./hero-figure-shared";
import "./hero.css";

/** A long numeral ("51.716") keeps the width of the phone column: about 4,6 characters fit at the full size. */
function numeralFitStyle(text: string): CSSProperties {
  const length = Math.max(1, text.replace(/\s/g, "").length);
  const fit = Math.round(Math.min(1, 4.6 / length) * 100) / 100;
  return { "--hf-fit": fit } as CSSProperties;
}


interface FeldFigureProps {
  readonly spec: FigureSpecOf<"field">;
  readonly bare?: boolean;
}

const forLayout = (spec: FigureSpec, layout: Variant): FigureSpec =>
  ({ ...spec, id: `${spec.id}--${layout}`, seed: spec.seed ?? hashSeed(spec.id) }) as FigureSpec;

/** Loads the canvas chunk once the browser is idle: never before first paint. */
function useIdleImport(enabled: boolean): ComponentType<FeldLiveProps> | null {
  const [live, setLive] = useState<ComponentType<FeldLiveProps> | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const start = (): void => {
      void import("./feld-live").then((m) => {
        if (!cancelled) setLive(() => m.FeldLive);
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }
    const handle = window.setTimeout(start, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [enabled]);
  return live;
}

function walk(ids: readonly string[], from: string, key: string): string | null {
  const i = ids.indexOf(from);
  if (i < 0) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return ids[Math.min(ids.length - 1, i + 1)] ?? null;
  if (key === "ArrowLeft" || key === "ArrowUp") return ids[Math.max(0, i - 1)] ?? null;
  if (key === "Home") return ids[0] ?? null;
  if (key === "End") return ids[ids.length - 1] ?? null;
  return null;
}

/**
 * Das Feld on the page: the server markup is the finished SVG field plus the
 * numeral, claim and unit line of the last scene; after idle the canvas
 * painter takes the field over and the scroll stage (or the first view) drives
 * its progress. The class chips are the keyboard and tap path to hover and pin.
 */
export function FeldFigure({ spec, bare = false }: FeldFigureProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hp = useHeroEnv(rootRef);
  const Live = useIdleImport(!hp.reduced);
  const [hover, setHover] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [scene, setScene] = useState(spec.data.scenes.length - 1);
  const [settled, setSettled] = useState(true);
  const [tabStop, setTabStop] = useState<string | null>(null);

  const items = useMemo(() => fieldClassItems(spec, scene), [spec, scene]);
  const ids = useMemo(() => items.map((q) => q.id), [items]);
  const byId = useMemo(() => new Map(items.map((q) => [q.id, q])), [items]);
  const candidate = hover ?? focused ?? pinned;
  const known = useMemo(() => new Set(spec.data.classes.map((c) => c.id)), [spec]);
  const active = candidate !== null && known.has(candidate) ? candidate : null;
  const tabId = tabStop !== null && byId.has(tabStop) ? tabStop : (ids[0] ?? null);
  const live = Live !== null;
  // Rows of chips the tallest scene needs (about three chips per row on a phone): the slot below the field keeps
  // that height from the first paint, so the chips appearing after idle push nothing down.
  const chipRows = useMemo(() => {
    const most = spec.data.scenes.reduce((m, _q, i) => Math.max(m, fieldClassItems(spec, i).length), 0);
    return most === 0 ? 0 : Math.ceil(most / 3);
  }, [spec]);

  const fallbacks = useMemo(
    () =>
      (["compact", "wide"] as const).map((layout) => {
        const element = renderFigure(forLayout(spec, layout), 1, { width: VARIANT_WIDTH[layout], theme: "web", bare: true, highlight: active ?? undefined });
        return { layout, element, ratio: viewBoxOf(element) };
      }),
    [spec, active],
  );

  // The page copy of numeral, claim and unit follows the scene the field shows.
  const model = feldModelFor(spec.data, VARIANT_WIDTH.compact, fieldHeight(VARIANT_WIDTH.compact));
  const shown = model.scenes[Math.max(0, Math.min(model.scenes.length - 1, scene))] ?? model.scenes[0];
  const numeral = shown?.numeral;

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
      const next = [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-hit]") ?? [])].find((el) => el.dataset["hit"] === to);
      next?.focus();
    }
  };

  return (
    <div className="hf" ref={rootRef} data-hf-live={live} data-hs-stage={hp.inStage} data-hs-kind="field">
      {!bare ? (
        <div className="hf-head">
          <div className="hf-head-live">
            {numeral ? <p className="hf-numeral" data-hf-numeral style={numeralFitStyle(fieldNumeralText(numeral))}>{fieldNumeralText(numeral)}</p> : null}
            {shown?.claim ? <p className="hf-claim" data-hf-claim>{shown.claim}</p> : null}
          </div>
          {/* Invisible sizers: every scene's numeral and claim share the live head's grid cell, so the head is as
              tall as the tallest scene and the figure never moves when the scene (and its line count) changes. */}
          {model.scenes.map((q, i) => (
            <div key={i} className="hf-head-ghost" aria-hidden="true">
              {q.numeral ? <p className="hf-numeral" style={numeralFitStyle(fieldNumeralText(q.numeral))}>{fieldNumeralText(q.numeral)}</p> : null}
              {q.claim ? <p className="hf-claim">{q.claim}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="hf-view">
        <div className="hf-fallback">
          {fallbacks.map(({ layout, element, ratio }) => (
            <div key={layout} className="hs-variant" data-hs-variant={layout} style={{ aspectRatio: `${ratio.w} / ${ratio.h}` }}>
              {element}
            </div>
          ))}
        </div>
        {Live ? (
          <Live
            spec={spec}
            progress={hp.revealProgress}
            stage={hp.inStage}
            focusClass={active}
            onScene={(index, isSettled) => {
              setScene((current) => (current === index ? current : index));
              setSettled((current) => (current === isSettled ? current : isSettled));
            }}
            onHover={setHover}
            onPin={(id) => setPinned((current) => (current === id ? null : id))}
          />
        ) : null}
      </div>
      {!bare && shown ? <p className="hf-unit" data-hf-unit>{shown.unit}</p> : null}
      {chipRows > 0 ? (
        <div className="hf-chips-slot" style={{ "--hf-chip-rows": chipRows } as CSSProperties}>
      {live && settled && items.length > 0 ? (
        <div className="hf-chips" role="group" aria-label="Gruppen im Feld" onKeyDown={onKeyDown}>
          {items.map((item) => {
            const klass = spec.data.classes.find((c) => c.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                className="hf-chip"
                data-hit={item.id}
                data-tone={klass?.tone}
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
              >
                <span className="hf-swatch" aria-hidden="true" />
                <span className="hf-chip-text">{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
        </div>
      ) : null}
      <p className="hs-readout" aria-live="polite" aria-atomic="true" data-hs-readout>
        {active !== null ? (byId.get(active)?.detail ?? fieldClassDetail(spec, scene, active)) : (shown?.claim ?? "")}
      </p>
    </div>
  );
}
