import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { TRIGGER } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { fill, formatNumber } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import { BARS, bars, meanLabelOpacity, rowLabelOpacity, totalLabelOpacity } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/geometry";
import { clamp, craftComparison, septemberRates } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { smoothstep, type Scene } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/motion";
import { DragHandle } from "./drag-handle";
import { SwitchTwo } from "./switch-two";

const AXIS_Y = BARS.top + 4 * BARS.rowHeight;
/**
 * Bars above the axis; below it the trigger rail (per 1.000) or the hint (count)
 * has its own strip, so no height is left empty. The handle sits on the rail.
 */
const VIEW = { width: BARS.width, height: AXIS_Y + 64, trigY: AXIS_Y + 24, labelY: BARS.top - 12 } as const;
const TRACK = VIEW.width - BARS.left - BARS.right;
const RATES = septemberRates().map((row) => ({ ...row }));

interface Props {
  readonly scene: Scene;
  readonly pack: DemoPack;
  readonly mode: 0 | 1;
  readonly trigger: number;
  readonly onMode: (mode: 0 | 1) => void;
  readonly onTrigger: (value: number) => void;
  readonly onStart: () => void;
}

const triggerX = (value: number) => BARS.left + (value / BARS.perMax) * TRACK;
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Same switch, other axis: defect records as a count, then per 1.000 units. */
export function Act2({ scene, pack, mode, trigger, onMode, onTrigger, onStart }: Props) {
  const t = pack.act2;
  const countOp = totalLabelOpacity(scene.u);
  const rateOp = meanLabelOpacity(scene.u);
  // The finding is shown only once the per-1.000 view has been reached.
  const reached = scene.u >= 0.9;
  // The trigger (rail, handle, buttons) is shown only once the per-1.000 view has settled, at full strength; before that the
  // strip says what it is for.
  const settled = mode === 1 && scene.u >= 0.98;
  const railOp = smoothstep(0.98, 1, scene.u);
  const rows = bars(RATES, scene.u);
  const comparison = craftComparison();
  const craft = rows.find((row) => row.line === "CRAFT");
  const next = rows.find((row) => row.line === comparison.nextByRate.line);
  // The payoff frame: once the bars have landed on the per-1.000 view, a chip on CRAFT states the ratio to the next-worst line.
  const ratioOp = smoothstep(0.92, 1, scene.u);
  const chipText = `${formatNumber(comparison.multiple, pack.locale, { digits: 1 })}\u202f\u00d7\u00a0${comparison.nextByRate.line}`;
  const chipWidth = 14 + chipText.length * 7.4;
  const fmt = (value: number, digits: number) => formatNumber(value, pack.locale, { digits });
  const sentence =
    mode === 0
      ? fill(t.lead, { x: fmt(comparison.leadRecords * 100, 0) })
      : fill(t.mult, { x: fmt(comparison.multiple, 1) });
  const triggerText = fmt(trigger, 2);
  const flip = triggerX(trigger) > 215;
  const setTrigger = (value: number) => onTrigger(round2(clamp(value, TRIGGER.min, TRIGGER.max)));

  return (
    <section className="mg-card mg-act2" aria-labelledby="mg-act2-h">
      <h2 id="mg-act2-h" className="mg-h">{t.h}</h2>
      <p className="mg-lede">{t.intro}</p>
      <SwitchTwo id="mg-act2-switch" label={t.switchLabel} options={[t.sw1, t.sw2]} value={mode} onChange={onMode} />
      <p className="mg-sentence" aria-live="polite">{sentence}</p>
      <div className="mg-chart mg-bars">
        <svg className="mg-svg" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
          {rows.map((row) => {
            const mid = row.y + BARS.rowHeight / 2;
            return (
              <rect
                key={row.line}
                className={row.line === "CRAFT" ? "mg-fill-r" : "mg-fill-l"}
                x={BARS.left}
                y={mid - 12}
                width={Math.max(1, row.length * TRACK)}
                height={24}
                shapeRendering="crispEdges"
              />
            );
          })}
          <path className="mg-axis" d={`M${BARS.left + 0.5} ${BARS.top}V${AXIS_Y}`} />
          {/* The threshold runs over the bars but under every label, which carry a paper halo: no number is ever struck through. */}
          <path className="mg-trigger" opacity={railOp} d={`M${triggerX(trigger)} ${BARS.top - 4}V${VIEW.trigY}`} />
          {craft && next && scene.u > 0.5 && (
            <g opacity={ratioOp}>
              <path
                className="mg-guide"
                d={`M${BARS.left + next.length * TRACK} ${craft.y + BARS.rowHeight / 2 - 12}V${next.y + BARS.rowHeight / 2 + 12}`}
              />
              <rect className="mg-chip" x={BARS.left + next.length * TRACK + 9} y={craft.y + BARS.rowHeight / 2 - 11} width={chipWidth} height={22} />
              <text className="mg-svg-text mg-chip-text" x={BARS.left + next.length * TRACK + 9 + chipWidth / 2} y={craft.y + BARS.rowHeight / 2 + 5} textAnchor="middle">
                {chipText}
              </text>
            </g>
          )}
          {rows.map((row) => {
            const rate = RATES.find((entry) => entry.line === row.line)!;
            const end = BARS.left + row.length * TRACK;
            const mid = row.y + BARS.rowHeight / 2;
            const moving = row.fromY !== row.toY;
            // One name per row, riding with its bar and fading out over the crossing, so two names never share a row and none is exposed twice.
            const nameOp = !moving ? 1 : rowLabelOpacity(scene.u);
            const valueOp = moving ? rowLabelOpacity(scene.u) : scene.u < 0.5 ? countOp : rateOp;
            return (
              <g key={row.line}>
                <text className="mg-svg-text mg-svg-name mg-halo" x={BARS.left - 8} y={mid + 5} textAnchor="end" opacity={nameOp}>
                  {row.line}
                </text>
                <text className="mg-svg-text mg-svg-name mg-halo" x={end + 7} y={mid + 5} opacity={valueOp}>
                  {scene.u < 0.5 ? rate.records : fmt(rate.rate, 2)}
                </text>
              </g>
            );
          })}
          <text className="mg-svg-text mg-svg-sub" x={8} y={VIEW.labelY} textAnchor="start" opacity={scene.u < 0.5 ? countOp : rateOp}>
            {scene.u < 0.5 ? t.scaleCount : t.scaleRate}
          </text>
          <g opacity={railOp}>
            <path className="mg-rail" d={`M${triggerX(TRIGGER.min)} ${VIEW.trigY}H${triggerX(TRIGGER.max)}M${triggerX(TRIGGER.min)} ${VIEW.trigY - 6}V${VIEW.trigY + 6}M${triggerX(TRIGGER.max)} ${VIEW.trigY - 6}V${VIEW.trigY + 6}`} />
            <text className="mg-svg-text mg-svg-sub" x={triggerX(TRIGGER.min)} y={VIEW.trigY + 30} textAnchor="middle">{fmt(TRIGGER.min, 2)}</text>
            <text className="mg-svg-text mg-svg-sub" x={triggerX(TRIGGER.max)} y={VIEW.trigY + 30} textAnchor="middle">{fmt(TRIGGER.max, 2)}</text>
            <text
              className="mg-svg-text mg-trigger-tag mg-halo"
              x={triggerX(trigger) + (flip ? -34 : 34)}
              y={VIEW.trigY - 7}
              textAnchor={flip ? "end" : "start"}
            >
              {fill(t.trigTag, { x: triggerText })}
            </text>
          </g>
        </svg>
        {!settled && (
        <p className="mg-trigger-hint" style={{ top: `${((AXIS_Y + 6) / VIEW.height) * 100}%`, height: `${((VIEW.height - AXIS_Y - 14) / VIEW.height) * 100}%` }} aria-hidden={mode === 1}>
          {t.trigHint}
        </p>
        )}
        {settled && (
          <DragHandle
            at={triggerX(trigger) / VIEW.width}
            top={VIEW.trigY / VIEW.height}
            label={t.trigLabel}
            min={TRIGGER.min}
            max={TRIGGER.max}
            now={trigger}
            valueText={fill(t.trigValue, { x: triggerText })}
            onStart={onStart}
            onDrag={(fraction) => setTrigger((fraction * VIEW.width - BARS.left) / TRACK * BARS.perMax)}
            onDragEnd={() => undefined}
            onKey={(key) => {
              const step = key === "ArrowLeft" || key === "ArrowDown" ? -0.01 : key === "ArrowRight" || key === "ArrowUp" ? 0.01 : 0;
              if (step !== 0) setTrigger(trigger + step);
              else if (key === "PageDown") setTrigger(trigger - TRIGGER.nudge);
              else if (key === "PageUp") setTrigger(trigger + TRIGGER.nudge);
              else if (key === "Home") setTrigger(TRIGGER.min);
              else if (key === "End") setTrigger(TRIGGER.max);
              else return false;
              return true;
            }}
          />
        )}
      </div>
      {settled && (
      <div className="mg-trigger-row">
        <button type="button" className="mg-btn" aria-label={t.trigDown} onClick={() => setTrigger(trigger - TRIGGER.nudge)}>
          {formatNumber(-TRIGGER.nudge, pack.locale, { digits: 2 })}
        </button>
        <output className="mg-trigger-value" aria-hidden="true">{triggerText}</output>
        <button type="button" className="mg-btn" aria-label={t.trigUp} onClick={() => setTrigger(trigger + TRIGGER.nudge)}>
          {formatNumber(TRIGGER.nudge, pack.locale, { digits: 2, sign: true })}
        </button>
      </div>
      )}
      {settled && <p className="mg-note mg-trigger-text">{fill(t.trig, { x: triggerText })}</p>}
      <ul className="mg-sr">
        {RATES.map((row) => (
          <li key={row.line}>{fill(t.rowAlt, { line: row.line, records: row.records, rate: fmt(row.rate, 2) })}</li>
        ))}
      </ul>
      {reached && (
        <div className="mg-reveal">
          <p className="mg-payoff">{t.payoff}</p>
          <p className="mg-note">{t.vp}</p>
        </div>
      )}
    </section>
  );
}
