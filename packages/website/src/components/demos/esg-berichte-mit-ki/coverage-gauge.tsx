import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import { formatPercent } from "@/lib/demo-cases/esg-berichte-mit-ki/numbers";
import type { DemoPack } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

/**
 * A coverage bar with the threshold drawn as a line across it and its label
 * standing on the line. Below the line the fill is Mennige (it fails), at or
 * above it ink (it passes); the number is always there. Every gauge on a page
 * carries its own heading, so no two read alike.
 */
export function CoverageGauge({
  pack,
  label,
  value,
  threshold,
  computed = false,
}: {
  readonly pack: DemoPack;
  readonly label: string;
  /** 0..1 */
  readonly value: number;
  /** 0..1 */
  readonly threshold: number;
  readonly computed?: boolean;
}) {
  const below = value + 1e-9 < threshold;
  const percent = formatPercent(value, pack.locale, 1);
  const lineText = fill(pack.gauge.line, { x: Math.round(threshold * 100) });
  return (
    <div className="esg-gauge" data-below={below ? "" : undefined}>
      <div className="esg-gauge__head">
        <span className="esg-gauge__label">{label}</span>
        <span className="esg-gauge__value">
          {percent}
          {computed ? <span className="esg-gauge__computed"> {pack.gauge.computed}</span> : null}
        </span>
      </div>
      <div className="esg-gauge__scale">
        <span className="esg-gauge__tick" style={{ left: `${threshold * 100}%` }} aria-hidden="true">
          {lineText}
        </span>
        <div className="esg-gauge__track" role="img" aria-label={`${label}: ${percent}, ${lineText}`}>
          <span className="esg-gauge__fill" style={{ width: `${Math.min(100, value * 100)}%` }} />
          <span className="esg-gauge__line" style={{ left: `${threshold * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
