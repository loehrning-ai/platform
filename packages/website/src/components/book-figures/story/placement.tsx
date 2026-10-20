"use client";

import { useId, useMemo, useState } from "react";
import { formatDecimal, formatInterval, type DotItem, type FigureSpecOf } from "@/lib/figures";
import { FigureShell } from "./figure-shell";
import { FigureSvg } from "./figure-svg";
import type { PlacementCell, PlacementData } from "./fixtures.provisional";

interface PlacementProps {
  readonly data: PlacementData;
  readonly provisional?: boolean;
  readonly csvHref?: string;
}

const PERCENT = { style: "percent", digits: 1 } as const;

/** Groups smaller than this still show a number, but with a warning that the interval is wide. */
const SMALL_GROUP = 100;

export function cellFor(data: PlacementData, industry: string, region: string): PlacementCell | null {
  return data.cells[`${industry}|${region || "all"}`] ?? null;
}

/** A cell with fewer than 5 hits (hits null) or no sample size is never shown as a number. */
export function isTooFew(cell: PlacementCell | null): boolean {
  return !cell || cell.n === null || cell.hits === null || cell.value === null;
}

function toDot(industry: { id: string; label: string }, cell: PlacementCell | null): DotItem {
  const few = isTooFew(cell);
  return {
    id: industry.id,
    label: industry.label,
    value: few ? null : (cell?.value ?? null),
    lo: few ? undefined : (cell?.lo ?? undefined),
    hi: few ? undefined : (cell?.hi ?? undefined),
    n: cell?.n ?? undefined,
    hits: few ? null : (cell?.hits ?? null),
  };
}

function buildSpec(data: PlacementData, region: string): FigureSpecOf<"dotplot"> {
  const regionLabel = data.regions.find((r) => r.id === region)?.label;
  return {
    id: "c14-einordnung",
    kind: "dotplot",
    title: regionLabel ? `Wo steht mein Betrieb? Region ${regionLabel}` : "Wo steht mein Betrieb? Ganz Deutschland",
    alt: `Punkte mit Intervall pro Branchengruppe: Anteil der Websites, auf denen das Wort KI steht, ${regionLabel ? `in der Region ${regionLabel}` : "in ganz Deutschland"}. Gruppen mit weniger als 5 Treffern sind schraffiert und ohne Zahl.`,
    caption: "Anteil der Firmenwebsites mit dem Wort KI, je Branchengruppe. Deine Gruppe ist hervorgehoben.",
    n: data.overall.n,
    source: data.source,
    asOf: data.asOf,
    limitation:
      "Gezählt werden Websites, auf denen das Wort KI steht, nicht Firmen, die KI nutzen. Die Branche ist aus Stichwörtern abgeleitet. Gruppen mit weniger als 5 Treffern zeigen wir nicht als Zahl.",
    data: {
      fmt: PERCENT,
      sort: "none",
      reference: { value: data.overall.value, label: `alle: ${formatDecimal(data.overall.value, 1)} %` },
      items: data.industries.map((industry) => toDot(industry, cellFor(data, industry.id, region))),
    },
  };
}

function resultText(data: PlacementData, industry: string, region: string): string {
  const industryLabel = data.industries.find((i) => i.id === industry)?.label ?? "";
  const regionLabel = data.regions.find((r) => r.id === region)?.label ?? "";
  const cell = cellFor(data, industry, region);
  if (isTooFew(cell)) {
    return `Zu wenige Daten. In der Gruppe ${industryLabel}, Region ${regionLabel}, steht das Wort KI auf weniger als 5 Websites. Wir zeigen dafür keine Zahl, damit keine einzelne Firma erkennbar wird.`;
  }
  const { n, value, lo, hi } = cell as { n: number; value: number; lo: number; hi: number };
  const small = n < SMALL_GROUP ? " Die Gruppe ist klein, das Intervall ist breit." : "";
  return `In der Gruppe ${industryLabel}, Region ${regionLabel}, haben wir ${formatDecimal(n, 0)} Websites gelesen. Auf ${formatDecimal(value, 1)} Prozent steht das Wort KI (Intervall ${formatInterval(PERCENT, lo, hi)}). Alle Gruppen zusammen: ${formatDecimal(data.overall.value, 1)} Prozent.${small} Das sagt nichts darüber, ob dein Betrieb KI nutzt.`;
}

/**
 * C14, "Wo steht mein Betrieb?". Two native selects and a marker on the dot
 * plot of the chosen region. The lookup runs on the baked aggregate in the
 * page; nothing is sent, stored or logged.
 */
export function Placement({ data, provisional, csvHref }: PlacementProps) {
  const baseId = useId();
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const spec = useMemo(() => buildSpec(data, region), [data, region]);
  const chosen = industry !== "" && region !== "";

  return (
    <FigureShell spec={spec} provisional={provisional} csvHref={csvHref} className="bf-place-figure">
      <div className="bf-place">
        <div className="bf-selects">
          <div className="bf-field">
            <label htmlFor={`${baseId}-industry`} className="bf-field-label">
              Branchengruppe
            </label>
            <select id={`${baseId}-industry`} className="bf-select" value={industry} onChange={(event) => setIndustry(event.currentTarget.value)}>
              <option value="">Bitte wählen</option>
              {data.industries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bf-field">
            <label htmlFor={`${baseId}-region`} className="bf-field-label">
              Region
            </label>
            <select id={`${baseId}-region`} className="bf-select" value={region} onChange={(event) => setRegion(event.currentTarget.value)}>
              <option value="">Bitte wählen</option>
              {data.regions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} ({item.note})
                </option>
              ))}
            </select>
          </div>
        </div>
        <FigureSvg spec={spec} highlight={industry || undefined} layout="pair" />
        <p className="bf-result bf-place-result" role="status" data-state={chosen ? (isTooFew(cellFor(data, industry, region)) ? "few" : "value") : "idle"}>
          {chosen
            ? resultText(data, industry, region)
            : "Wähle Branche und Region. Dann siehst du, wie oft das Wort KI in deiner Gruppe auf Firmenwebsites steht."}
        </p>
        <p className="bf-privacy">Deine Auswahl bleibt in diesem Browser. Sie wird weder gesendet noch gespeichert.</p>
      </div>
    </FigureShell>
  );
}
