"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ESCAPE_PRIORITY, GlasSegmented, pushEscapeLayer, useGlas } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { QUARTER, REHEARSAL_RUNS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import type { Sent } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import type { Fmt } from "./fmt";

/** The dock targets carry this attribute; a drop is hit-tested against it. */
export const TARGET_ATTR = "data-w03-target";
const MAX_TILT_DEG = 4;

/** Which dock target is under a screen point, if any. */
function targetAt(x: number, y: number): Sent | null {
  if (typeof document === "undefined" || !document.elementsFromPoint) return null;
  for (const element of document.elementsFromPoint(x, y)) {
    const hit = element.closest(`[${TARGET_ATTR}]`);
    const value = hit?.getAttribute(TARGET_ATTR);
    if (value === "report" || value === "ask") return value;
  }
  return null;
}

/**
 * Scene 1 "Die Antwort": Claude's rehearsal table as a card the visitor drags
 * to one of the two dock targets (or taps a target). Both kept runs are on
 * the card's stepper, as the run log records them. The choice is never
 * scored; the card shrinks into the target it went to.
 */
export function SceneAnswer({
  pack,
  fmt,
  sent,
  run,
  onRun,
  onSend,
  onHover,
  todayLine,
  reducedMotion,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly sent: Sent | null;
  readonly run: 1 | 2;
  readonly onRun: (run: 1 | 2) => void;
  readonly onSend: (to: Sent) => void;
  /** The target the card hovers over while dragged (the dock brightens its rim). */
  readonly onHover: (target: Sent | null) => void;
  /** The lines under the status about today's recording (from its facts), or null. */
  readonly todayLine: string | null;
  readonly reducedMotion: boolean;
}) {
  const glas = useGlas();
  const card = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<null | { id: number; x0: number; y0: number; dx: number; dy: number }>(null);
  const record = REHEARSAL_RUNS.find((entry) => entry.run === run) ?? REHEARSAL_RUNS[1];
  const a = pack.answer;

  useEffect(() => {
    if (!drag) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      setDrag(null);
      onHover(null);
    });
  }, [drag, onHover]);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (sent || event.button !== 0) return;
    if ((event.target as Element).closest("button, a, [role='radiogroup']")) return;
    // On touch the card scrolls; the grip on top drags it (a mouse or pen drags it anywhere).
    if (event.pointerType === "touch" && !(event.target as Element).closest(".w03-answer-grip")) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ id: event.pointerId, x0: event.clientX, y0: event.clientY, dx: 0, dy: 0 });
    glas.noteDrag();
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    setDrag({ ...drag, dx: event.clientX - drag.x0, dy: event.clientY - drag.y0 });
    onHover(targetAt(event.clientX, event.clientY));
  };
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    const target = targetAt(event.clientX, event.clientY);
    setDrag(null);
    onHover(null);
    if (target) onSend(target);
  };

  const tilt = drag ? Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, drag.dx / 30)) : 0;
  const style = drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${tilt}deg)` } : undefined;
  const note =
    record && record.quote === null ? (
      <p className="w03-answer-note" data-kind="described">
        <span className="w03-kicker">{a.describedLabel}</span> {a.described}
      </p>
    ) : record ? (
      <blockquote className="w03-answer-note" data-kind="quote" lang="en">
        <span className="w03-kicker" lang={fmt.locale}>
          {a.quoteLabel}
        </span>{" "}
        {fmt.quote(record.quote ?? "")}
      </blockquote>
    ) : null;

  return (
    <div className="w03-answer" data-sent={sent ?? undefined} data-reduced={reducedMotion ? "" : undefined}>
      <div
        ref={card}
        className="w03-answer-card"
        data-dragging={drag ? "" : undefined}
        style={style}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          setDrag(null);
          onHover(null);
        }}
        aria-roledescription={a.dragHint}
        data-w03-answer-card=""
      >
        <span className="w03-answer-grip" aria-hidden="true" />
        <div className="w03-answer-head">
          <span className="w03-kicker">{a.promptLabel}</span>
          <GlasSegmented
            label={a.runsLabel}
            options={[
              { value: "1", label: a.runPrev },
              { value: "2", label: a.runNext },
            ]}
            value={String(run) as "1" | "2"}
            onChange={(value) => onRun(value === "1" ? 1 : 2)}
          />
        </div>
        <p className="w03-answer-prompt">{fmt.quote(a.prompt)}</p>
        {record?.caveat === "before" ? note : null}
        <table className="w03-answer-table">
          <caption className="sr-only">{a.tableTitle}</caption>
          <thead>
            <tr>
              <th scope="col">{a.monthHead}</th>
              <th scope="col">{a.valueHead}</th>
            </tr>
          </thead>
          <tbody>
            {QUARTER.map((month, index) => (
              <tr key={month}>
                <th scope="row">{fmt.month(month)}</th>
                <td>{fmt.eur(record?.values[index] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {record?.caveat === "after" ? note : null}
        {/* The status wraps instead of being cut off (a chip truncates it on a phone). */}
        <p className="w03-answer-status" data-w03-status="">
          {fmt.t(a.status, { n: run })}
        </p>
        {todayLine ? <p className="w03-answer-today">{todayLine}</p> : null}
        <p className="w03-answer-under">{a.under}</p>
        {sent ? (
          <p className="w03-answer-stamp" data-w03-stamp={sent}>
            {a.stamps[sent]}
          </p>
        ) : null}
      </div>
    </div>
  );
}
