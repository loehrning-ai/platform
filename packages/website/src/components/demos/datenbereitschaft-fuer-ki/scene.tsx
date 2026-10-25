import { formatCompact, formatShort } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import { geometry, MONTH_ROW } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/geometry";
import { FONT, layoutAt, type StampLayout } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/layout";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import type { Scene as SceneState } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/scene";
import { formatters, type Series } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";

/** One hard-edged stamp where the layout put it, rotated a little like a rubber stamp. */
function Stamp({ stamp, opacity, inverted }: { readonly stamp: StampLayout; readonly opacity: number; readonly inverted: boolean }) {
  if (opacity <= 0) return null;
  const { x, y, w, h } = stamp.rect;
  return (
    <g
      opacity={opacity}
      transform={`rotate(-2 ${x + w / 2} ${y + h / 2})`}
      className={inverted ? "dr3-stamp dr3-stamp-after" : "dr3-stamp"}
      data-stamp={inverted ? "after" : "before"}
    >
      <rect x={x} y={y} width={w} height={h} />
      {stamp.lines.map((line, index) => (
        <text key={line} x={x + w / 2} y={y + 19 + index * 18} textAnchor="middle" fontSize="15">
          {line}
        </text>
      ))}
    </g>
  );
}

/**
 * The plot: bars, zero line, axis, labels and the stamps, drawn in the
 * measured box (one unit is one pixel). Every number printed here is the
 * value of its bar at this very p, printed once; the header above holds the
 * big counter.
 */
export function SceneSvg({
  series,
  scene,
  pack,
  label,
  width,
  height,
}: {
  readonly series: Series;
  readonly scene: SceneState;
  readonly pack: DemoPack;
  readonly label: string;
  /** The plot box in px: the drawing box is as big, so text keeps its size. */
  readonly width: number;
  readonly height: number;
}) {
  const locale = pack.locale;
  const { ui } = pack;
  const { num } = formatters(series, locale);
  const geo = geometry(width, height);
  const { W, H, X0, X1, Y0, Y1 } = geo;
  const text = (value: number, short: boolean) => (short ? formatShort(value, locale) : num(value));
  const layout = layoutAt({
    geo,
    scene,
    label: text,
    unknown: "?",
    startLevel: series.startNote === "given" ? series.startLevel : null,
    startPrefix: ui.start,
    stampBefore: ui.stampBefore,
    stampAfter: ui.stampAfter,
    stepLabel: text,
    toneGround: ui.toneGround,
    toneStep: ui.toneStep,
  });
  const { y, rungY } = layout;

  return (
    <svg className="dr3-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="dr3-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" className="dr3-sand" />
          <rect width="3" height="8" className="dr3-ink-fill" />
        </pattern>
        <clipPath id="dr3-clip">
          <rect x={X0} y={Y0 - 4} width={X1 - X0 + 2} height={Y1 - Y0 + 4} />
        </clipPath>
      </defs>
      <g aria-hidden="true">
        {scene.ticks.map((tick) => (
          <g key={tick}>
            <line x1={X0} x2={X1} y1={y(tick)} y2={y(tick)} className="dr3-grid" opacity={rungY !== null && Math.abs(y(tick) - rungY) < 10 ? 0 : 1} />
            <text x={X0 - 10} y={y(tick) + 5} textAnchor="end" fontSize="15" className="dr3-tick">
              {formatCompact(tick, locale)}
            </text>
          </g>
        ))}
        <line x1={X0} x2={X0} y1={Y0 - 4} y2={Y1} className="dr3-axis" />

        <g clipPath="url(#dr3-clip)">
          {layout.bars.map((bar, index) => {
            const step = scene.steps[index];
            const down = step ? step.to < step.from : false;
            return (
              <g key={index} data-bar={index}>
                {bar.pillar && bar.pillar.h > 0 ? (
                  <rect x={bar.pillar.x} y={bar.pillar.y} width={bar.pillar.w} height={bar.pillar.h} className="dr3-ground" />
                ) : null}
                {bar.step.h > 0.5 ? (
                  <rect x={bar.step.x} y={bar.step.y} width={bar.step.w} height={bar.step.h} className={down ? "dr3-step-down" : "dr3-step"} />
                ) : null}
              </g>
            );
          })}
        </g>
        <line
          x1={X0}
          x2={X1}
          y1={scene.zeroVisible ? y(0) : Y1}
          y2={scene.zeroVisible ? y(0) : Y1}
          className={scene.zeroVisible ? "dr3-zero" : "dr3-floor"}
        />

        {rungY !== null ? <line x1={X0} x2={X1} y1={rungY} y2={rungY} className="dr3-rung" opacity={scene.startRung} /> : null}
        {layout.rungLabel ? (
          <text x={layout.rungLabel.x} y={layout.rungLabel.y} fontSize={FONT} className="dr3-rung-label" opacity={scene.startLabel} data-start-label="">
            {layout.rungLabel.text}
          </text>
        ) : null}

        {/* One text per bar, and it is a number that exists in the data: its change before the step is lifted, its level after. */}
        {layout.labels.map((entry, index) => (
          <text
            key={index}
            x={entry.x}
            y={entry.y}
            textAnchor="middle"
            fontSize={entry.size}
            className={entry.inside ? "dr3-barlabel dr3-barlabel-in" : "dr3-barlabel"}
            data-label={scene.labelsOf}
          >
            {entry.text}
          </text>
        ))}

        {/* A downward step names its own change, on the block or just above the bar. */}
        {layout.stepNotes.map((note) => (
          <g key={`step-${note.index}`} data-step-note={note.index}>
            {note.pill ? <rect x={note.pill.x} y={note.pill.y} width={note.pill.w} height={note.pill.h} className="dr3-sand" /> : null}
            <text x={note.x} y={note.y} textAnchor="middle" fontSize={note.size} className="dr3-barlabel">
              {note.text}
            </text>
          </g>
        ))}

        {layout.tones && scene.tones > 0 ? (
          <g opacity={scene.tones} data-tones={layout.tones.index}>
            {layout.tones.ground.lines.map((line, index) => (
              <text
                key={line}
                x={layout.tones?.ground.x}
                y={(layout.tones?.ground.y ?? 0) + index * ((layout.tones?.ground.size ?? 0) + 3)}
                textAnchor="middle"
                fontSize={layout.tones?.ground.size}
                className="dr3-barlabel dr3-barlabel-in"
              >
                {line}
              </text>
            ))}
            <text x={layout.tones.step.x} y={layout.tones.step.y} textAnchor="middle" fontSize={layout.tones.step.size} className="dr3-barlabel">
              {layout.tones.step.text}
            </text>
          </g>
        ) : null}

        <Stamp stamp={layout.before} opacity={scene.stampBefore} inverted={false} />
        <Stamp stamp={layout.after} opacity={scene.stampAfter} inverted />

        {series.months.map((month, index) => (
          <text key={month + index} x={layout.bars[index]?.center ?? 0} y={Y1 + MONTH_ROW - 7} textAnchor="middle" fontSize="15" className="dr3-month">
            {month}
          </text>
        ))}

        {scene.tornAxis > 0 ? (
          <g opacity={scene.tornAxis} className="dr3-torn">
            <rect x={X0 - 3} y={Y1 - 30} width="6" height="14" className="dr3-sand" />
            <path d={`M${X0 - 6} ${Y1 - 27}l3 -4 3 8 3 -8 3 4`} />
            <path d={`M${X0 - 6} ${Y1 - 20}l3 -4 3 8 3 -8 3 4`} />
          </g>
        ) : null}
        {scene.zeroNote > 0 ? (
          <text x={X0 + 2} y={H - 5} fontSize="13" className="dr3-zeronote" opacity={scene.zeroNote}>
            {ui.zeroNote}
          </text>
        ) : null}
      </g>
    </svg>
  );
}
