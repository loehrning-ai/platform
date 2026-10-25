"use client";

import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { CLAUDE_ANSWER, EXPORT_ROWS, NET_NEW_2026, OPENING_DEC_2025 } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { formatNumber, MINUS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import { monthlyTotals, readings } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import { ease, phase } from "./tween";

const READINGS = readings(NET_NEW_2026, OPENING_DEC_2025);
const TOTALS = [...monthlyTotals(EXPORT_ROWS).values()];
/** The answer card's fixed bar scale, 0 to 400.000. */
const ANSWER_MAX = 400_000;

/** Beat 1: Claude's answer as it came, bars drawn once from 0 over the beat. */
export function AnswerScene({ pack, progress }: { readonly pack: Pack; readonly progress: number }) {
  const copy = pack.answer;
  const grow = ease(progress);
  return (
    <div className="fk-answer">
      <p className="fk-kicker">{copy.kicker}</p>
      <div className="fk-sheet" data-fk-answer="">
        <p className="fk-sheet-head">{copy.header}</p>
        <ul className="fk-bars">
          {CLAUDE_ANSWER.map((value, index) => (
            <li key={pack.months[index]} className="fk-bar-row">
              <span className="fk-month">{pack.months[index]}</span>
              <span className="fk-bar-track" aria-hidden="true">
                <span className="fk-bar" style={{ transform: `scaleX(${(value / ANSWER_MAX) * grow})` }} />
              </span>
              <span className="fk-figure">{formatNumber(value, pack.locale)}</span>
            </li>
          ))}
        </ul>
        <p className="fk-caveat">{copy.caveat}</p>
      </div>
      <p className="fk-source">{copy.source}</p>
    </div>
  );
}

/** One column of the readings chart: a Mennige outlined opening block and the ink part on it. */
interface Column {
  readonly open: number;
  readonly value: number;
}

/** The columns of each reading: 0 change as level, 1 summed with no opening, 2 levels added, 3 opening plus changes. */
const COLUMNS: readonly (readonly Column[])[] = [
  READINGS.changeAsLevel.map((value) => ({ open: 0, value })),
  READINGS.runningNoOpen.map((value) => ({ open: 0, value })),
  [{ open: 0, value: READINGS.levelsSummed }, { open: 0, value: 0 }, { open: 0, value: 0 }],
  READINGS.runningNoOpen.map((value) => ({ open: OPENING_DEC_2025, value })),
];

/** Columns at a continuous reading s in [0, 3]: neighbouring detents interpolated. */
function columnsAt(s: number): readonly Column[] {
  const low = Math.max(0, Math.min(3, Math.floor(s)));
  const high = Math.min(3, low + 1);
  const share = ease(s - low);
  return (COLUMNS[low] as readonly Column[]).map((from, index) => {
    const to = (COLUMNS[high] as readonly Column[])[index] as Column;
    return { open: from.open + (to.open - from.open) * share, value: from.value + (to.value - from.value) * share };
  });
}

/** The figures printed at a detent; never an interpolated value. */
export function readingFigures(detent: number): readonly number[] {
  if (detent === 0) return READINGS.changeAsLevel;
  if (detent === 1) return READINGS.runningNoOpen;
  if (detent === 2) return [READINGS.levelsSummed];
  return READINGS.levels;
}

/** The arithmetic line under the chart, computed from the kit values. */
function arithmetic(detent: number, pack: Pack): string {
  const n = (value: number) => formatNumber(value, pack.locale);
  if (detent === 1) {
    const terms = NET_NEW_2026.slice(0, 4)
      .map((value, index) => (index === 0 ? n(value) : value < 0 ? `${MINUS} ${n(-value)}` : `+ ${n(value)}`))
      .join(" ");
    return `${terms} = ${n(READINGS.runningNoOpen[0] as number)}`;
  }
  if (detent === 2) return `${READINGS.levels.map(n).join(" + ")} = ${n(READINGS.levelsSummed)}. ${pack.reveal.readings[2]?.how ?? ""}`;
  if (detent === 3) return `${n(OPENING_DEC_2025)} + ${n(READINGS.runningNoOpen[0] as number)} = ${n(READINGS.levels[0] as number)}`;
  return pack.reveal.readings[0]?.how ?? "";
}

const Y_MIN = -40_000;
const Y_MAX = 400_000;
const CHART_H = 132;
const y = (value: number) => CHART_H - ((Math.min(Y_MAX, value) - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_H;

/**
 * Beat 2: the file is right (ticks, 6 of 6 months), the missing level grows
 * under each bar, then the verdict; afterwards the slider walks the four
 * readings of the same 18 rows.
 */
export function ReadingsScene({
  pack,
  progress,
  reading,
  detent,
}: {
  readonly pack: Pack;
  readonly progress: number;
  /** Continuous reading from the slider's tween. */
  readonly reading: number;
  readonly detent: number;
}) {
  const copy = pack.reveal;
  const revealing = progress < 1;
  const ticks = Math.round(phase(progress, 0, 0.25) * TOTALS.length);
  const s = revealing ? 1 + 2 * ease(phase(progress, 0.25, 0.67)) : reading;
  const columns = columnsAt(s);
  const settled = !revealing && Math.abs(reading - detent) < 0.001;
  const shown = revealing ? (progress >= 0.67 ? 3 : 1) : detent;
  const figures = revealing && progress < 0.67 ? READINGS.runningNoOpen : settled ? readingFigures(detent) : [];
  const label = copy.readings[shown];
  const zero = y(0);

  return (
    <div className="fk-readings">
      <p className="fk-file">
        <span className="fk-file-name">{copy.fileName}</span>
        <span>{fill(copy.fileRows, { rows: EXPORT_ROWS.length })}</span>
        <span className="fk-file-check" data-fk-check={ticks === TOTALS.length ? "done" : "running"}>
          {fill(copy.fileCheck, { n: ticks, total: TOTALS.length })}
        </span>
      </p>
      <div className="fk-chart" data-fk-reading={shown}>
        <svg viewBox={`0 0 300 ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true" className="fk-chart-svg">
          <line x1="0" x2="300" y1={zero} y2={zero} className="fk-zero" />
          {columns.map((column, index) => {
            const x = 18 + index * 96;
            const top = column.open + column.value;
            const inkTop = y(Math.max(column.open, top));
            const inkBottom = y(Math.min(column.open, top));
            const clipped = top > Y_MAX;
            return (
              <g key={pack.months[index]}>
                {column.open > 0 ? <rect x={x} width="72" y={y(column.open)} height={zero - y(column.open)} className="fk-open" /> : null}
                <rect x={x} width="72" y={inkTop} height={Math.max(0, inkBottom - inkTop)} className="fk-ink" />
                {clipped ? <path d={`M${x - 2} 10 l14 -6 l14 6 l14 -6 l14 6 l14 -6 l6 3`} className="fk-break" /> : null}
              </g>
            );
          })}
        </svg>
        <ol className="fk-chart-figures" aria-label={label?.label}>
          {pack.months.map((month, index) => (
            <li key={month} className="fk-chart-figure" data-strong={!revealing && detent === 3 ? "" : undefined}>
              {figures[index] === undefined ? "" : formatNumber(figures[index] as number, pack.locale)}
            </li>
          ))}
        </ol>
        <ol className="fk-chart-months" aria-hidden="true">
          {pack.months.map((month, index) => (
            <li key={month}>{shown === 2 && settled ? (index === 0 ? copy.oneNumber : "") : month}</li>
          ))}
        </ol>
      </div>
      {revealing && progress >= 0.25 ? (
        <p className="fk-opening">{fill(copy.opening, { value: formatNumber(OPENING_DEC_2025, pack.locale) })}</p>
      ) : (
        <p className="fk-reading-line">
          <strong>{label?.label}</strong> · {arithmetic(shown, pack)}
          <span className="fk-origin">{label?.origin}</span>
        </p>
      )}
    </div>
  );
}
