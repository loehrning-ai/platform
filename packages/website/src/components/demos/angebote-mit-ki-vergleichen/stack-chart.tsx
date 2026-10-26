"use client";

import type { Pack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { fmtEur, type Lang, type StackModel } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import { ease, stackPhase, type Phase } from "./motion";

/**
 * The stage chart of rotfaden's stack demo (drawChart in assets/demo/demo.js), as a pure function of
 * the model, the phase and the beat's progress. One row per offer: the headline line (Ware) in ink is
 * there from the start, every other cost line stacks in after it in Mennige, the discount is cut back
 * from the end as an outlined block. When the lines are in, the rows move to the delivered order and
 * the value turns from the goods price to the total. A missing line shows "offen", never a number.
 */
export function StackChart({
  model,
  phase,
  progress,
  bet,
  pack,
  lang,
  selected,
  onSelect,
}: {
  readonly model: StackModel;
  readonly phase: Phase;
  readonly progress: number;
  readonly bet: string | null;
  readonly pack: Pack;
  readonly lang: Lang;
  /** The offer whose sources are listed; rows are buttons once the lines are in. */
  readonly selected?: string | null;
  readonly onSelect?: (option: string) => void;
}) {
  const lines = model.lines;
  const { show, reorder, landed } = stackPhase(phase, progress);
  const before = model.byHeadline;
  const after = phase === "headline" ? model.byHeadline : model.ranked;
  let max = 1;
  for (const option of model.options) {
    let positive = 0;
    for (const line of lines) if ((option.lines[line] ?? 0) > 0 && !option.missing.includes(line)) positive += option.lines[line]!;
    max = Math.max(max, positive);
  }
  const name = (line: string) => pack.lineNames[line] ?? line;
  const pickable = Boolean(onSelect) && phase !== "headline";

  return (
    <div className="av-chart" data-av-chart="" style={{ ["--av-rows" as string]: String(model.options.length) }}>
      <ol className="av-rows" aria-label={pack.stageLabel}>
        {model.options.map((option) => {
          const from = before.indexOf(option);
          const to = after.indexOf(option);
          const y = from + (to - from) * reorder;
          const win = model.complete && phase !== "headline" && reorder >= 1 && model.winner === option;
          let position = 0;
          let negative = 0;
          const segments = lines.flatMap((line, index) => {
            const value = option.missing.includes(line) ? 0 : (option.lines[line] ?? 0);
            const k = segmentAt(index, lines.length, show);
            if (value > 0) {
              const left = position;
              position += value;
              return [
                <i
                  key={line}
                  className={index === 0 ? "av-seg av-seg-head" : "av-seg av-seg-add"}
                  style={{ left: `${(left / max) * 100}%`, width: `${(value / max) * 100}%`, transform: `scaleX(${k.toFixed(4)})` }}
                />,
              ];
            }
            if (value < 0) negative += -value * k;
            return [];
          });
          const total = option.missing.length > 0 ? pack.open : fmtEur(option.total, lang);
          const body = (
            <>
              <span className="av-row-head">
                <span className="av-row-name">{option.name}</span>
                {bet === option.name ? <span className="av-chip">{pack.yourBet}</span> : null}
                {win ? <span className="av-chip av-chip-win">{pack.winner}</span> : null}
                <span className="av-row-value" aria-live="off">
                  <span style={{ opacity: landed ? 0 : 1 }}>{fmtEur(option.headline, lang)}</span>
                  <span style={{ opacity: landed ? 1 : 0 }} data-av-total="">
                    {total}
                  </span>
                </span>
              </span>
              <span className="av-bar" aria-hidden="true">
                {segments}
                {negative > 0 ? (
                  <i className="av-seg av-seg-neg" style={{ left: `${((position - negative) / max) * 100}%`, width: `${(negative / max) * 100}%` }} />
                ) : null}
              </span>
            </>
          );
          return (
            <li
              key={option.name}
              className="av-row"
              data-option={option.name}
              data-win={win ? "" : undefined}
              style={{ transform: `translateY(${(y * 100).toFixed(3)}%)` }}
            >
              {pickable ? (
                <button type="button" className="av-row-button" aria-pressed={selected === option.name} onClick={() => onSelect?.(option.name)}>
                  {body}
                </button>
              ) : (
                <div className="av-row-button">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
      <Legend model={model} phase={phase} show={show} pack={pack} name={name} />
    </div>
  );
}

/** Line 0 (the headline) is drawn from the start; the others stack in turn over show in [0, 0.82]. */
function segmentAt(index: number, count: number, show: number): number {
  if (index === 0) return 1;
  const span = 0.82 / Math.max(1, count - 1);
  return ease((show - (index - 1) * span) / span);
}

function Legend({
  model,
  phase,
  show,
  pack,
  name,
}: {
  readonly model: StackModel;
  readonly phase: Phase;
  readonly show: number;
  readonly pack: Pack;
  readonly name: (line: string) => string;
}) {
  const lines = model.lines;
  const head = lines[0] ?? "";
  if (phase === "headline") {
    return (
      <p className="av-legend">
        <span className="av-key">
          <i className="av-swatch av-seg-head" />
          {name(head)} <span className="av-key-note">{pack.headlineNote}</span>
        </span>
      </p>
    );
  }
  let current: string | null = null;
  if (phase === "stack" && show < 0.84) {
    for (let index = 1; index < lines.length; index++) {
      if (segmentAt(index, lines.length, show) < 1) {
        current = lines[index]!;
        break;
      }
    }
  }
  if (current) {
    const per = model.options.find((option) => option.per[current!])?.per[current] === "recurring" ? pack.perRecurring : pack.perOnce;
    return (
      <p className="av-legend" aria-live="polite">
        <span className="av-key">
          <i className="av-swatch av-seg-add" />+ {name(current)} <span className="av-key-note">{per}</span>
        </span>
      </p>
    );
  }
  const negatives = lines.filter((line) => model.options.some((option) => (option.lines[line] ?? 0) < 0));
  const added = lines.slice(1).filter((line) => !negatives.includes(line));
  return (
    <p className="av-legend">
      <span className="av-key">
        <i className="av-swatch av-seg-head" />
        {name(head)}
      </span>
      {added.length > 0 ? (
        <span className="av-key">
          <i className="av-swatch av-seg-add" />
          {added.map(name).join(", ")}
        </span>
      ) : null}
      {negatives.length > 0 ? (
        <span className="av-key">
          <i className="av-swatch av-seg-neg" />
          {negatives.map((line) => `− ${name(line)}`).join(", ")}
        </span>
      ) : null}
    </p>
  );
}
