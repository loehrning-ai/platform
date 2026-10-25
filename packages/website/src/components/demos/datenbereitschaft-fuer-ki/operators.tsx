"use client";

import { formatNumber } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import {
  arithmetic,
  firstChangeUnknown,
  formatters,
  operate,
  ratio,
  staircase,
  type OpId,
  type Reading,
  type Series,
} from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import { Radios } from "./radios";

/** The answer that fits each reading: the sum of changes for a step, the last level for a staircase. */
export const defaultOp = (reading: Reading): OpId => (reading === "change" ? "sum" : "end");

/**
 * The pinned arithmetic line, the Stufe/Treppe switch, the three operators and
 * what each gives for the current reading. `op` is the operator on show: the
 * page passes the right answer of the reading until the visitor tries another.
 */
export function Operators({
  series,
  reading,
  op,
  onOp,
  onReading,
  pack,
}: {
  readonly series: Series;
  readonly reading: Reading;
  readonly op: OpId;
  readonly onOp: (op: OpId) => void;
  readonly onReading: (reading: Reading) => void;
  readonly pack: DemoPack;
}) {
  const { ops, ui } = pack;
  const locale = pack.locale;
  const line = arithmetic(series, reading, locale);
  const { money } = formatters(series, locale);
  const result = operate(series, reading, op);
  const test = reading === "level" && series.startNote !== "zero" ? staircase(series) : null;
  const note = result ? fill(ops.notes[result.note], { r: formatNumber(ratio(series), locale, 2) }) : "";
  const verdict = result ? ops[result.verdict] : "";
  const months = series.months.length - (firstChangeUnknown(series) ? 1 : 0);
  const growth = months === 3 ? ops.arithGrowth : fill(ops.arithGrowthN, { n: months });
  const labelOf = { growth, staircase: ops.arithStaircase, assumed: ops.arithAssumed, fromFirst: ops.arithFromFirst }[line.label];

  return (
    <section className="dr3-ops" aria-label={ops.group}>
      <p className="dr3-arith" data-arith={line.label}>
        <span className="dr3-arith-sum">
          {line.lhs} = <strong>{line.result}</strong>
        </span>
        <span className="dr3-arith-label">{labelOf}</span>
      </p>
      <Radios
        className="dr3-read"
        label={ui.readingGroup}
        value={reading}
        onChange={onReading}
        options={[
          { id: "change", label: ui.stufe },
          { id: "level", label: ui.treppe },
        ]}
      />
      <Radios
        className="dr3-seg"
        label={ops.group}
        value={op}
        onChange={onOp}
        options={[
          { id: "sum", label: ops.sum },
          { id: "end", label: ops.end },
          { id: "endMinusStart", label: ops.endMinusStart },
        ]}
      />
      <div className="dr3-result" data-verdict={result?.verdict ?? "none"}>
        {result ? (
          <>
            <span className="dr3-result-value">{money(result.value)}</span>
            <span className="dr3-verdict" data-kind={result.verdict}>
              {verdict}
            </span>
            <span className="dr3-result-note">{note}</span>
            {result.recorded ? <span className="dr3-result-tag">{ops.recordedTag}</span> : null}
          </>
        ) : (
          <span className="dr3-result-note">{ops.needsStart}</span>
        )}
      </div>
      {test !== null ? <p className="dr3-test">{fill(ops.treppentest, { d: money(test) })}</p> : null}
    </section>
  );
}
