import { cx } from "@/components/werk/cx";
import type { PlakatKey } from "@/lib/plakat/palettes";

export type ResultChartBarKind = "reference" | "answer" | "correct";

export interface ResultChartBar {
  readonly label: string;
  readonly value: number;
  /** The value as the narrative prints it ("2.017,5 t"); never recomputed. */
  readonly display: string;
  readonly note?: string;
  /** reference and correct are solid; answer (the unchecked AI answer) is hatched. */
  readonly kind: ResultChartBarKind;
}

export interface ResultChartData {
  readonly heading: string;
  /** Unit and provenance under the chart, e.g. "t CO2e, Scope 1 und 2, erfundene Zahlen". */
  readonly caption: string;
  /** One sentence under the bars: what the difference means. Optional in effect: empty renders nothing. */
  readonly note: string;
  /** The unit the values share, e.g. "t CO2e". */
  readonly unit: string;
  readonly bars: readonly ResultChartBar[];
}

export type ResultChartProps = {
  readonly chart: ResultChartData;
  /** The workshop's scene: the bars take its paper ink. */
  readonly plakat: PlakatKey;
  readonly className?: string;
};

/** Solid bars in the scene's paper ink (5.42 to 12.57:1 on Kalkweiß). */
const SOLID: Readonly<Record<PlakatKey, string>> = {
  lemons: "bg-ultramarin",
  idea: "bg-kobalt",
  bloom: "bg-aubergine",
  autumn: "bg-rost",
};

/**
 * The answer bar: a 45-degree hatch (2px lines, 6px pitch) with a 2px
 * outline, the "raw or unapproved" grammar. Autumn keeps it in Rost (Ocker
 * tief against Rost is 1.17:1, so hue could never separate them); the other
 * scenes use their chart accent. The hatch, not the hue, tells the series
 * apart, and every bar carries its label as text.
 */
const ANSWER: Readonly<Record<PlakatKey, string>> = {
  lemons: "border-2 border-mennige bg-[repeating-linear-gradient(135deg,var(--color-mennige)_0_2px,transparent_2px_6px)]",
  idea: "border-2 border-himbeere-tief bg-[repeating-linear-gradient(135deg,var(--color-himbeere-tief)_0_2px,transparent_2px_6px)]",
  bloom: "border-2 border-terrakotta-tief bg-[repeating-linear-gradient(135deg,var(--color-terrakotta-tief)_0_2px,transparent_2px_6px)]",
  autumn: "border-2 border-rost bg-[repeating-linear-gradient(135deg,var(--color-rost)_0_2px,transparent_2px_6px)]",
};

/** Note text in the chart accent, on Kalkweiß only (4.62 to 5.95:1; never on Beton). */
const NOTE: Readonly<Record<PlakatKey, string>> = {
  lemons: "text-mennige",
  idea: "text-himbeere-tief",
  bloom: "text-terrakotta-tief",
  autumn: "text-ocker-tief",
};

/**
 * What the case shows, as bars on Kalkweiß (SPEC §3.11): one row per value
 * with its label (14px Schiefer), a bar from zero on one shared scale and the
 * value (17px Druckschwarz, tabular). The bars are aria-hidden; the label,
 * value and note are real text, so the chart reads without colour or
 * pattern. Place it on Kalkweiß, never on Beton (`bg-inset`).
 */
export function ResultChart({ chart, plakat, className }: ResultChartProps) {
  const max = Math.max(...chart.bars.map((bar) => bar.value));
  return (
    <figure data-result-chart="" data-plakat={plakat} data-unit={chart.unit} className={cx("min-w-0", className)}>
      <h3 className="text-fluid-h3 font-bold text-foreground text-balance">{chart.heading}</h3>
      <ul role="list" className="mt-6 grid gap-y-5">
        {chart.bars.map((bar) => (
          <li
            key={`${bar.kind}-${bar.label}`}
            data-result-bar={bar.kind}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 [grid-template-areas:'label_value'_'bar_bar'_'note_note'] md:grid-cols-[11rem_minmax(0,1fr)_7.5rem] md:[grid-template-areas:'label_bar_value'_'._note_note']"
          >
            <span className="text-label text-muted-foreground [grid-area:label]">{bar.label}</span>
            <span className="text-right text-body font-semibold tabular-nums text-foreground [grid-area:value]">
              {bar.display}
            </span>
            <span aria-hidden="true" className="block h-6 [grid-area:bar]">
              <span
                data-result-bar-fill=""
                className={cx("block h-full", bar.kind === "answer" ? ANSWER[plakat] : SOLID[plakat])}
                style={{ width: `${max > 0 ? (bar.value / max) * 100 : 0}%` }}
              />
            </span>
            {bar.note ? (
              <span className={cx("text-label [grid-area:note]", NOTE[plakat])}>{bar.note}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {chart.note ? <p className="mt-5 max-w-[60ch] text-body text-foreground text-pretty">{chart.note}</p> : null}
      <figcaption className="mt-5 text-caption text-muted-foreground">{chart.caption}</figcaption>
    </figure>
  );
}
