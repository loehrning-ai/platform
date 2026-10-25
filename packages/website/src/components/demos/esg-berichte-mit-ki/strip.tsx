import { fill, monthsText } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { Analysis, DemoPack, MonthCell } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

export const PITCH = 30;
export const BAR_WIDTH = 22;
const PAD = 4;

/** The label read by assistive technology: what is proven and what is not. */
export function stripLabel(pack: DemoPack, analysis: Analysis): string {
  if (analysis.provenMonths === 12) return pack.stripAria.all;
  const missing = analysis.missingMonths.length > 0;
  const months = monthsText(missing ? analysis.missingMonths : analysis.estimatedMonths, pack.months, pack.texts.and);
  return fill(missing ? pack.stripAria.some : pack.stripAria.estimate, { n: analysis.provenMonths, months });
}

/**
 * Beleg-Streifen: one square per month, aligned with the bars above. Filled =
 * bill in the folder, hatched = estimate, outline = missing. The shapes carry
 * the meaning, colour never does.
 */
export function Strip({
  cells,
  label,
}: {
  readonly cells: readonly MonthCell[];
  readonly label: string;
}) {
  return (
    <svg className="esg-strip" viewBox={`0 0 ${PITCH * 12} 22`} role="img" aria-label={label} focusable="false">
      <defs>
        <pattern id="esg-hatch-strip" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="var(--esg-paper)" />
          <rect width="2" height="5" fill="var(--esg-ink)" />
        </pattern>
      </defs>
      {cells.map((cell, index) => {
        const x = index * PITCH + PAD;
        return cell.state === "proven" ? (
          <rect key={cell.month} x={x} y={3} width={BAR_WIDTH} height={16} fill="var(--esg-ink)" />
        ) : cell.state === "estimate" ? (
          <rect key={cell.month} x={x} y={4} width={BAR_WIDTH} height={14} fill="url(#esg-hatch-strip)" stroke="var(--esg-ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ) : (
          <rect key={cell.month} x={x} y={4} width={BAR_WIDTH} height={14} fill="none" stroke="var(--esg-mark)" strokeWidth={2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        );
      })}
    </svg>
  );
}

/** Key to the strip and the bars: filled = bill, hatched = estimate, dashed = missing; the count sits at the right. */
export function StripLegend({ pack, count }: { readonly pack: DemoPack; readonly count: number }) {
  return (
    <div className="esg-keyrow">
      <ul className="esg-key" aria-hidden="true">
        <li className="esg-key__item" data-kind="proven">{pack.legend.proven}</li>
        <li className="esg-key__item" data-kind="estimate">{pack.legend.estimate}</li>
        <li className="esg-key__item" data-kind="missing">{pack.legend.missing}</li>
      </ul>
      <span className="esg-count">{count}/12</span>
    </div>
  );
}
