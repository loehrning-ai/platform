"use client";

import { useCallback, useMemo, useState } from "react";
import { analyse } from "@/lib/demo-cases/esg-berichte-mit-ki/analyse";
import { decimalsOf, formatSmart } from "@/lib/demo-cases/esg-berichte-mit-ki/numbers";
import { NO_RESOLUTION, parseSeries, resolveCells, type Entry, type Resolution } from "@/lib/demo-cases/esg-berichte-mit-ki/parse";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { DemoPack, Series } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

export const THRESHOLD_MIN = 80;
export const THRESHOLD_MAX = 100;
const DEFAULT_THRESHOLD = 95;

interface OwnState {
  readonly text: string;
  readonly label: string;
  readonly unit: string;
  readonly threshold: number;
  readonly choice: Resolution;
  /** Label and unit came from "Beispiel einsetzen" and the numbers are still the example's. */
  readonly prefilled: boolean;
}

const EMPTY: OwnState = { text: "", label: "", unit: "", threshold: DEFAULT_THRESHOLD, choice: NO_RESOLUTION, prefilled: false };

/**
 * The example's label and unit describe the example's numbers. Any change to a
 * number after loading it drops them, so they cannot leak onto the visitor's own series.
 */
const releasePrefill = (now: OwnState): Pick<OwnState, "label" | "unit" | "prefilled"> =>
  now.prefilled ? { label: "", unit: "", prefilled: false } : { label: now.label, unit: now.unit, prefilled: false };

/** "Punkt als Tausender gelesen: Jan 21.400 = 21.400. Als 21,4 lesen?": the chip's text, for the first doubtful row. */
function readNote(pack: DemoPack, first: Entry, count: number, flipped: boolean): string {
  const value = first.value as number;
  const alt = (first.alt ?? first.quiet?.alt) as number;
  const separator = first.separator ?? first.quiet?.separator;
  const thousandsNow = (value > alt) !== flipped;
  return fill(thousandsNow ? pack.own.readThousands : pack.own.readDecimal, {
    sep: separator === "," ? pack.own.sep.comma : pack.own.sep.dot,
    raw: first.raw,
    x: formatSmart(flipped ? alt : value, pack.locale, 3),
    y: formatSmart(flipped ? value : alt, pack.locale, 3),
    many: count > 1 ? fill(pack.own.readMany, { n: count }) : "",
  });
}

/**
 * The visitor's own series. Everything lives in this state: nothing is sent,
 * nothing is stored. A new paste resets the per-line choices (flip, swap, edit).
 */
export function useOwnSeries(pack: DemoPack) {
  const [state, setState] = useState<OwnState>(EMPTY);

  const parsed = useMemo(() => parseSeries(state.text, pack.locale), [state.text, pack.locale]);
  const resolved = useMemo(() => resolveCells(parsed, state.choice), [parsed, state.choice]);
  const series = useMemo<Series>(() => {
    const values = resolved.cells.flatMap((cell) => (cell.value === null ? [] : [cell.value]));
    return {
      id: "own",
      label: state.label.trim() === "" ? "" : state.label,
      unit: state.unit.trim(),
      digits: decimalsOf(values),
      cells: resolved.cells,
    };
  }, [resolved, state.label, state.unit]);
  const analysis = useMemo(() => analyse(series), [series]);
  // Numbers the parser read one way but could have read the other (a dot as thousands or as decimal): one chip flips them all.
  // A silent thousands dot ("21.400" on a German page) is offered only where its size does not fit the others.
  const flippable = useMemo(
    () =>
      parsed.entries.filter(
        (entry) =>
          entry.month !== null &&
          entry.kind === "value" &&
          !state.choice.edits.has(entry.month) &&
          (entry.alt !== null || (entry.quiet !== null && (state.choice.flips.has(entry.id) || resolved.unitHints.includes(entry.month)))),
      ),
    [parsed, resolved.unitHints, state.choice.edits, state.choice.flips],
  );
  const allFlipped = flippable.length > 0 && flippable.every((entry) => state.choice.flips.has(entry.id));
  const flipLabel = flippable.length > 0 ? readNote(pack, flippable[0] as Entry, flippable.length, allFlipped) : null;

  const setText = useCallback((text: string) => setState((now) => ({ ...now, ...releasePrefill(now), text, choice: NO_RESOLUTION })), []);
  const setLabel = useCallback((label: string) => setState((now) => ({ ...now, label, prefilled: false })), []);
  const setUnit = useCallback((unit: string) => setState((now) => ({ ...now, unit, prefilled: false })), []);
  const setThreshold = useCallback(
    (threshold: number) => setState((now) => ({ ...now, threshold: Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Math.round(threshold))) })),
    [],
  );
  const loadExample = useCallback(
    () => setState((now) => ({ ...now, text: pack.own.exampleText, label: pack.own.exampleLabel, unit: pack.own.exampleUnit, choice: NO_RESOLUTION, prefilled: true })),
    [pack],
  );
  const clear = useCallback(() => setState((now) => ({ ...EMPTY, threshold: now.threshold })), []);
  /** One chip flips every number read the same doubtful way: all at once, or all back. */
  const flipMany = useCallback(
    (ids: readonly number[], on: boolean) =>
      setState((now) => {
        const flips = new Set(now.choice.flips);
        for (const id of ids) {
          if (on) flips.add(id);
          else flips.delete(id);
        }
        return { ...now, ...releasePrefill(now), choice: { ...now.choice, flips } };
      }),
    [],
  );
  const swap = useCallback(
    (month: number) =>
      setState((now) => {
        const swaps = new Set(now.choice.swaps);
        if (swaps.has(month)) swaps.delete(month);
        else swaps.add(month);
        return { ...now, ...releasePrefill(now), choice: { ...now.choice, swaps } };
      }),
    [],
  );
  const edit = useCallback(
    (month: number, value: string) =>
      setState((now) => {
        const edits = new Map(now.choice.edits);
        edits.set(month, value);
        return { ...now, ...releasePrefill(now), choice: { ...now.choice, edits } };
      }),
    [],
  );

  return {
    ...state,
    parsed,
    resolved,
    series,
    analysis,
    flippable,
    allFlipped,
    flipLabel,
    hasInput: state.text.trim() !== "" || state.choice.edits.size > 0,
    setText, setLabel, setUnit, setThreshold, loadExample, clear, flipMany, swap, edit,
  };
}

export type OwnSeries = ReturnType<typeof useOwnSeries>;
