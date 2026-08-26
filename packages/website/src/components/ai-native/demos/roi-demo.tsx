"use client";

import { useState, type JSX } from "react";
import { DemoOverline } from "./_shared";
import { useDemoLocale } from "@/components/demos/demo-locale";
import { cn } from "@/lib/utils";

/**
 * RoiDemo — Wirtschaftlichkeits-Rechner for AI adoption.
 *
 * Four sliders (headcount, hourly rate, adoption %, hours/week/employee)
 * feed a deterministic three-year cashflow calculation. Implementation cost
 * and per-seat license baseline are explicit illustrative assumptions.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21 to Tailwind + brand tokens.
 * See: AI-native demo gallery implementation.
 */

interface SliderSpec {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly format: (v: number) => string;
}

const WEEKS_PER_YEAR_WORKING = 46;
const IMPLEMENTATION_COST = 280_000;
const LICENSE_PER_SEAT_MONTH = 45;
const YEAR_2_GROWTH = 1.25;
const YEAR_3_GROWTH = 1.4;

export function RoiDemo(): JSX.Element {
  const { text } = useDemoLocale();
  const [headcount, setHeadcount] = useState(180);
  const [hourly, setHourly] = useState(85);
  const [adoptionPct, setAdoptionPct] = useState(55);
  const [hoursPerWeek, setHoursPerWeek] = useState(4);

  const annualHours =
    headcount * (adoptionPct / 100) * hoursPerWeek * WEEKS_PER_YEAR_WORKING;
  const annualSavings = annualHours * hourly;
  const licensesPerYear = headcount * LICENSE_PER_SEAT_MONTH * 12;
  const netY1 = annualSavings - IMPLEMENTATION_COST - licensesPerYear;
  const netY2 = annualSavings * YEAR_2_GROWTH - licensesPerYear;
  const netY3 = annualSavings * YEAR_3_GROWTH - licensesPerYear;
  const totalNet = netY1 + netY2 + netY3;
  const roiPct = Math.round(
    (totalNet / (IMPLEMENTATION_COST + licensesPerYear * 3)) * 100,
  );
  const paybackMonths =
    annualSavings > IMPLEMENTATION_COST + licensesPerYear
      ? (
          ((IMPLEMENTATION_COST + licensesPerYear) / annualSavings) *
          12
        ).toFixed(1)
      : null;

  const sliderSpecs: readonly [SliderSpec, number, (n: number) => void][] = [
    [
      {
        label: text("Beschäftigte", "Employees"),
        min: 20,
        max: 1000,
        step: 10,
        format: (v) => `${v} FTE`,
      },
      headcount,
      setHeadcount,
    ],
    [
      {
        label: text("Vollkosten pro Stunde", "Fully loaded hourly cost"),
        min: 40,
        max: 200,
        step: 5,
        format: (v) => `${v} €`,
      },
      hourly,
      setHourly,
    ],
    [
      {
        label: text(
          "Anteil einbezogener Beschäftigter",
          "Share of employees included",
        ),
        min: 10,
        max: 95,
        step: 5,
        format: (v) => `${v}%`,
      },
      adoptionPct,
      setAdoptionPct,
    ],
    [
      {
        label: text(
          "Angenommene Stunden/Woche/Person",
          "Assumed hours/week/person",
        ),
        min: 1,
        max: 12,
        step: 0.5,
        format: (v) => `${v}h`,
      },
      hoursPerWeek,
      setHoursPerWeek,
    ],
  ];

  const maxBarValue = Math.max(netY1, netY2, netY3, 1);
  const yearBars = [
    { label: "J.1", value: netY1, bg: "bg-brand-orange" },
    { label: "J.2", value: netY2, bg: "bg-brand-amber" },
    { label: "J.3", value: netY3, bg: "bg-[var(--color-kupfer-mist)]" },
  ];

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label={text("Wirtschaftlichkeits-Szenario", "Economic scenario")}
    >
      <div>
        <DemoOverline>
          {text("Wirtschaftlichkeits-Szenario", "Economic scenario")}
        </DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          {text("Annahmen und", "Assumptions and")}{" "}
          <span className="text-brand-orange">
            {text("modellierter Cashflow", "modelled cash flow")}
          </span>
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {text(
            "Didaktische Rechnung mit veränderbaren Arbeitsannahmen und fest ausgewiesenen Kostenparametern. Kein Benchmark und keine Prognose.",
            "Illustrative calculation with adjustable work assumptions and disclosed cost parameters. It is not a benchmark or forecast.",
          )}
        </p>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3.5">
        {sliderSpecs.map(([spec, value, setter]) => (
          <div
            key={spec.label}
            className="border border-border bg-card/60 p-3.5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {spec.label}
              </span>
              <span className="font-mono text-[14px] font-bold text-brand-orange">
                {spec.format(value)}
              </span>
            </div>
            <input
              type="range"
              min={spec.min}
              max={spec.max}
              step={spec.step}
              value={value}
              onChange={(e) => setter(parseFloat(e.target.value))}
              aria-label={spec.label}
              className="ai-range min-h-11 w-full cursor-pointer accent-brand-orange"
            />
          </div>
        ))}
      </div>

      {/* Headline KPIs — dark panel */}
      <div className="dark-section grid grid-cols-2 gap-4 border-t-[3px] border-brand-orange bg-[var(--color-dark-bg)] px-5 py-5 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-5 md:px-6">
        <div>
          <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
            {text(
              "Modellierter Netto-Wert · 3 Jahre",
              "Modelled net value · 3 years",
            )}
          </div>
          <div className="mt-1.5 font-mono text-[34px] font-bold leading-none tracking-[-0.04em] text-brand-orange md:text-[38px]">
            {(totalNet / 1e6).toFixed(2)} M€
          </div>
        </div>
        {[
          [text("Modellierter ROI", "Modelled ROI"), `${roiPct}%`],
          [
            text("Modellierte Amortisation", "Modelled payback"),
            paybackMonths === null
              ? text("nicht erreicht", "not reached")
              : `${paybackMonths} ${text("Mon.", "mo.")}`,
          ],
          [
            text("Angenommene Stunden/Jahr", "Assumed hours/year"),
            `${Math.round(annualHours / 1000)}k`,
          ],
        ].map(([label, val]) => (
          <div key={label}>
            <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
              {label}
            </div>
            <div className="mt-1.5 font-mono text-[22px] font-bold text-[var(--color-dark-fg)] md:text-[26px]">
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* Cashflow projection */}
      <div>
        <DemoOverline>
          <span className="mb-3 inline-block">
            {text("Rechenszenario", "Calculation scenario")}
          </span>
        </DemoOverline>
        <div className="flex h-[160px] items-end gap-2.5 border-b border-border pb-1">
          {yearBars.map((bar) => {
            const heightPx = Math.max(0, (bar.value / maxBarValue) * 140);
            return (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="font-mono text-[13px] font-bold text-foreground">
                  {(bar.value / 1e6).toFixed(2)}M
                </div>
                <div
                  style={{ height: heightPx }}
                  className={cn(
                    "w-full border-t-2 border-foreground transition-[height] duration-300 ease-out",
                    bar.bg,
                  )}
                  aria-hidden="true"
                />
                <div className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground">
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assumption disclosure */}
      <div className="flex gap-3.5 border-l-[3px] border-brand-orange bg-card/60 px-4 py-3">
        <div className="shrink-0 font-mono text-[12px] font-bold tracking-[0.14em] text-brand-orange">
          ◆ {text("ANNAHMEN", "ASSUMPTIONS")}
        </div>
        <div className="text-[12px] leading-[1.5] text-muted-foreground">
          {text(
            "Fest im Beispiel: 46 Arbeitswochen, 280.000 € Implementierung, 45 € Lizenz pro Person und Monat sowie Auslastungsfaktoren 1,25 und 1,40 in Jahr 2 und 3. Diese Werte sind keine empirischen Benchmarks. Ersetze sie vor einer Entscheidung durch geprüfte interne Werte und dokumentiere Unsicherheit, Nebenkosten und nicht realisierte Zeit.",
            "Fixed in this example: 46 working weeks, €280,000 implementation cost, €45 licence cost per person per month, and utilisation factors of 1.25 and 1.40 in years 2 and 3. These values are not empirical benchmarks. Replace them with reviewed internal values before a decision, and document uncertainty, indirect costs, and time that cannot be converted into savings.",
          )}
        </div>
      </div>
    </div>
  );
}

export default RoiDemo;
