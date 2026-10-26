"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ESCAPE_PRIORITY, pushEscapeLayer, useGlas } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { ACTIVE_ACCOUNTS, ENDING_MRR, NET_NEW_2026, STATUS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { CODES, type Code, type DemoState, type Pour } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import { countCodes, sumAt } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import type { Fmt } from "./fmt";
import type { TubGeometry } from "./tub";
import { PLOT, QUARTER_MONTHS, y, Y_MAX } from "./tub-geometry";

const LEVELS = [ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]];
const CHANGES = NET_NEW_2026.slice(3);
const MARCH = ENDING_MRR["2026-03"];

/** Which quarter column is under an SVG x, or null. */
function quarterAt(geometry: TubGeometry, x: number): number | null {
  const index = QUARTER_MONTHS.findIndex((month) => {
    const c = geometry.col(month);
    return c ? x >= c.x0 - 6 && x <= c.x1 + 6 : false;
  });
  return index < 0 ? null : index;
}

function svgX(element: Element, clientX: number, clientY: number): number {
  const svg = element instanceof SVGElement ? element.ownerSVGElement : null;
  const matrix = svg?.getScreenCTM();
  if (!matrix) return 0;
  const inverse = matrix.inverse();
  return inverse.a * clientX + inverse.c * clientY + inverse.e;
}

/** The members after pouring `from` onto `to`: the stack grows when the kind stays the same. */
export function pourOnto(current: Pour, kind: "levels" | "changes", from: number, to: number): Pour {
  const base = current.kind === kind ? current.members : [];
  const members = [...new Set([...base, from, to])].sort((a, b) => a - b);
  return { kind, members };
}

/**
 * Scene 4 move 1, drawn on the tub: the April to June water columns and the
 * three change arrows, each draggable onto another one. Released anywhere
 * else they spring back. Tapping June lights it alone.
 */
export function PourLayer({ pack, fmt, geometry, pour, onPour, reducedMotion }: { readonly pack: Pack; readonly fmt: Fmt; readonly geometry: TubGeometry; readonly pour: Pour; readonly onPour: (pour: Pour) => void; readonly reducedMotion: boolean }) {
  const glas = useGlas();
  const [drag, setDrag] = useState<null | { id: number; kind: "levels" | "changes"; from: number; x0: number; x: number }>(null);
  useEffect(() => {
    if (!drag) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => setDrag(null));
  }, [drag]);
  const w = pack.wer;

  const down = (kind: "levels" | "changes", from: number) => (event: PointerEvent<SVGElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const x = svgX(event.currentTarget, event.clientX, event.clientY);
    setDrag({ id: event.pointerId, kind, from, x0: x, x });
    glas.noteDrag();
  };
  const move = (event: PointerEvent<SVGElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    setDrag({ ...drag, x: svgX(event.currentTarget, event.clientX, event.clientY) });
  };
  const up = (event: PointerEvent<SVGElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = Math.abs(drag.x - drag.x0) > 6;
    const target = quarterAt(geometry, drag.x);
    setDrag(null);
    if (!moved) {
      if (drag.kind === "levels" && drag.from === 2) onPour({ kind: "june", members: [2] });
      return;
    }
    if (target !== null && target !== drag.from) onPour(pourOnto(pour, drag.kind, drag.from, target));
  };

  const columnsDrawn = QUARTER_MONTHS.map((month, index) => {
    const c = geometry.col(month);
    if (!c) return null;
    const level = LEVELS[index] ?? 0;
    const lit = pour.kind === "june" ? index === 2 : pour.kind === "levels" && pour.members.includes(index);
    const dim = (pour.kind === "june" && index !== 2) || (pour.kind === "levels" && pour.members.length > 0 && !pour.members.includes(index));
    return (
      <g
        key={month}
        className="w03-pour-col"
        data-lit={lit ? "" : undefined}
        data-dim={dim ? "" : undefined}
        role="button"
        tabIndex={-1}
        aria-label={fmt.t(w.columnLabel, { month: fmt.month(month), value: fmt.eur(level) })}
        onPointerDown={down("levels", index)}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        data-w03-column={index}
      >
        <rect x={c.x0 + 2} y={y(level)} width={c.x1 - c.x0 - 4} height={PLOT.b - y(level)} rx="3" />
      </g>
    );
  });

  const arrowsDrawn = QUARTER_MONTHS.map((month, index) => {
    const c = geometry.col(month);
    if (!c) return null;
    const before = index === 0 ? MARCH : (LEVELS[index - 1] ?? 0);
    const after = LEVELS[index] ?? 0;
    const lit = pour.kind === "changes" && pour.members.includes(index);
    const x = c.x0 + 6;
    return (
      <g
        key={month}
        className="w03-pour-arrow"
        data-lit={lit ? "" : undefined}
        data-down={after < before ? "" : undefined}
        role="button"
        tabIndex={-1}
        aria-label={fmt.t(w.arrowLabel, { month: fmt.month(month), value: fmt.eur(after - before) })}
        onPointerDown={down("changes", index)}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        data-w03-arrow={index}
      >
        <rect x={x - 11} y={Math.min(y(before), y(after)) - 10} width="22" height={Math.abs(y(before) - y(after)) + 20} className="w03-hit" />
        <line x1={x} x2={x} y1={y(before)} y2={y(after)} />
        <path d={after < before ? `M${x - 4},${y(after) - 5}l4,5l4,-5` : `M${x - 4},${y(after) + 5}l4,-5l4,5`} />
      </g>
    );
  });

  let result: ReactNode = null;
  if (pour.kind === "levels" && pour.members.length >= 2) {
    const last = pour.members[pour.members.length - 1] as number;
    const c = geometry.col(QUARTER_MONTHS[last] as string);
    const sum = sumAt(LEVELS, pour.members);
    if (c) {
      const over = sum > Y_MAX;
      const top = over ? PLOT.t - 2 : y(sum);
      result = (
        <g className="w03-stack" aria-hidden="true" data-reduced={reducedMotion ? "" : undefined}>
          {pour.members.map((member, order) => {
            const below = sumAt(LEVELS, pour.members.slice(0, order));
            const height = ((LEVELS[member] ?? 0) / Y_MAX) * (PLOT.b - PLOT.t);
            const yy = y(below) - height;
            return <rect key={member} x={c.x0 + 2} y={Math.max(PLOT.t - 2, yy)} width={c.x1 - c.x0 - 4} height={Math.max(0, y(below) - Math.max(PLOT.t - 2, yy))} className="w03-stack-part" data-part={order} />;
          })}
          {over ? <path d={`M${c.x0 + 1},${PLOT.t + 4}l5,-4l5,4l5,-4l5,4l5,-4`} className="w03-break" /> : null}
          <text x={(c.x0 + c.x1) / 2} y={Math.max(PLOT.t + 22, top + 14)} textAnchor="middle" className="w03-stack-label">
            {fmt.n(sum)}
          </text>
          {over ? (
            <text x={(c.x0 + c.x1) / 2} y={PLOT.t + 34} textAnchor="middle" className="w03-stack-note">
              {w.breakMark}
            </text>
          ) : null}
        </g>
      );
    }
  } else if (pour.kind === "changes" && pour.members.length >= 2) {
    const first = pour.members[0] as number;
    const last = pour.members[pour.members.length - 1] as number;
    const c = geometry.col(QUARTER_MONTHS[last] as string);
    const before = first === 0 ? MARCH : (LEVELS[first - 1] ?? 0);
    const sum = sumAt(CHANGES, pour.members);
    if (c) {
      const x = c.x1 - 8;
      result = (
        <g className="w03-stack-arrow" aria-hidden="true">
          <line x1={x} x2={x} y1={y(before)} y2={y(before + sum)} />
          <path d={sum < 0 ? `M${x - 5},${y(before + sum) - 6}l5,6l5,-6` : `M${x - 5},${y(before + sum) + 6}l5,-6l5,6`} />
          <text x={x - 8} y={(y(before) + y(before + sum)) / 2 + 4} textAnchor="end" className="w03-stack-label">
            {sum > 0 ? "+" : ""}
            {fmt.n(sum)}
          </text>
        </g>
      );
    }
  } else if (pour.kind === "june") {
    const c = geometry.col("2026-06");
    if (c) {
      result = (
        <text x={(c.x0 + c.x1) / 2} y={y(LEVELS[2] ?? 0) - 20} textAnchor="middle" className="w03-stack-label" aria-hidden="true">
          {fmt.n(LEVELS[2] ?? 0)}
        </text>
      );
    }
  }

  const ghostX = drag ? drag.x : 0;
  const dragged = drag ? geometry.col(QUARTER_MONTHS[drag.from] as string) : undefined;
  return (
    <g className="w03-pour">
      {columnsDrawn}
      {arrowsDrawn}
      {result}
      {drag && dragged && Math.abs(drag.x - drag.x0) > 6 ? (
        drag.kind === "levels" ? (
          <rect x={ghostX - (dragged.x1 - dragged.x0) / 2} y={y(LEVELS[drag.from] ?? 0)} width={dragged.x1 - dragged.x0 - 4} height={PLOT.b - y(LEVELS[drag.from] ?? 0)} rx="3" className="w03-pour-ghost" />
        ) : (
          <circle cx={ghostX} cy={y(LEVELS[drag.from] ?? 0)} r="8" className="w03-pour-ghost" />
        )
      ) : null}
    </g>
  );
}

/** The caption of the pour, from its state (scene 4 move 1). */
export function pourCaption(pack: Pack, fmt: Fmt, pour: Pour): readonly string[] {
  const w = pack.wer;
  if (pour.kind === "june") return [fmt.t(w.june, { jun: fmt.eur(LEVELS[2] ?? 0) })];
  if (pour.kind === "levels" && pour.members.length >= 2) return [fmt.t(w.levels, { count: pour.members.length, sum: fmt.eur(sumAt(LEVELS, pour.members)) })];
  if (pour.kind === "changes" && pour.members.length === 3) return [fmt.t(w.changesAll, { sum: fmt.eur(sumAt(CHANGES, pour.members)) })];
  if (pour.kind === "changes" && pour.members.length === 2) return [fmt.t(w.changesTwo, { sum: fmt.eur(sumAt(CHANGES, pour.members)) })];
  return [w.lead1, w.pourStart];
}

/** The key of the counting rule for its caption: "AN", "A", "search", "none" … */
export function ruleKey(state: DemoState): keyof Pack["wer"]["captions"] {
  if (state.search) return "search";
  const on = CODES.filter((code) => state.codes[code]);
  const key = on.join("");
  if (key === "") return "none";
  const order: Record<string, keyof Pack["wer"]["captions"]> = { A: "A", N: "N", C: "C", AN: "AN", AC: "AC", NC: "NC", ANC: "ANC" };
  return order[key] ?? "none";
}

export function matchedCount(state: DemoState): number {
  if (state.search) return 0;
  return countCodes(new Set(CODES.filter((code) => state.codes[code])), STATUS);
}

export function whoCaption(pack: Pack, fmt: Fmt, state: DemoState): readonly string[] {
  const key = ruleKey(state);
  const newCount = [...STATUS].filter((code) => code === "N").length;
  const line = fmt.t(pack.wer.captions[key], { n: matchedCount(state), new: newCount });
  return key === "AN" ? [line, pack.wer.closing] : [line];
}

/**
 * Scene 4 move 2: three sentences with a tappable phrase each, and the 144
 * rows of customer_master.csv as tiles that light when the rule counts them.
 */
export function WhoCounts({ pack, fmt, state, onCode, onSearch, reducedMotion }: { readonly pack: Pack; readonly fmt: Fmt; readonly state: DemoState; readonly onCode: (code: Code, on: boolean) => void; readonly onSearch: (on: boolean) => void; readonly reducedMotion: boolean }) {
  const w = pack.wer;
  const touched = useRef<Set<Code>>(new Set());
  const n = matchedCount(state);
  return (
    <div className="w03-who" data-reduced={reducedMotion ? "" : undefined}>
      <ul className="w03-rules">
        {CODES.map((code) => {
          const [before, after] = w.sentences[code];
          const on = state.codes[code];
          return (
            <li key={code}>
              {before}{" "}
              <button
                type="button"
                className="w03-rule-toggle"
                aria-pressed={on}
                onClick={() => {
                  touched.current.add(code);
                  onCode(code, !on);
                }}
                data-w03-rule={code}
              >
                {on ? w.toggle.on : w.toggle.off}
              </button>
              {after}
              {touched.current.has(code) || state.codesSeen ? <span className="w03-code-chip">{fmt.t(w.code, { code })}</span> : null}
            </li>
          );
        })}
      </ul>
      <button type="button" className="w03-search" aria-pressed={state.search} onClick={() => onSearch(!state.search)} data-w03-search="">
        {w.search}
      </button>
      <div className="w03-accounts">
        <div className="w03-grid12" role="img" aria-label={`${w.tilesLabel}. ${fmt.t(w.counter, { n })}`}>
          {[...STATUS].map((code, index) => {
            const lit = !state.search && state.codes[code as Code];
            return <span key={index} className="w03-acct" data-lit={lit ? "" : undefined} data-group={code} />;
          })}
        </div>
        <div className="w03-counter">
          <p className="w03-counter-n" data-w03-counter="">
            {fmt.t(w.counter, { n })}
          </p>
          <p className="w03-counter-target">{fmt.t(w.target, { n: ACTIVE_ACCOUNTS["2026-06"] })}</p>
        </div>
      </div>
    </div>
  );
}
