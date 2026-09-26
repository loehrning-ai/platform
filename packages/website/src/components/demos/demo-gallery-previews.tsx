"use client";

import { useId, type ReactNode } from "react";
import { ArrowGlyph, cx, Pictogram, type PictogramName } from "@/components/werk";
import { useDemoLocale } from "./demo-locale";

/*
 * Gallery previews as schematic drawings (Werkzeichnung), not app windows.
 *
 * Grammar, shared with the Workshop 03 deck:
 * - hatch   = raw or unapproved input (an export, a scan, a draft)
 * - ink     = the processing step or an approved result
 * - dashed  = a gate that is still open (review, sign-off, a known gap)
 * - Mennige = the one thing to look at; at most one mark per drawing
 *
 * Every preview renders inside the tile's aria-hidden band, so its short
 * labels are decoration for sighted readers only. Labels stay at 12px or
 * larger anyway; mono is used only for data (values, clause numbers, code).
 */

const LABEL = "text-[0.75rem] font-semibold leading-tight text-foreground";
const DATA = "font-mono text-[0.75rem] leading-tight text-foreground tabular-nums";

function Hatch({ className }: { readonly className?: string }) {
  const raw = useId();
  const id = `pv-hatch-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute inset-0 size-full text-foreground/30",
        className,
      )}
    >
      <defs>
        <pattern
          id={id}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

type NodeTone = "plain" | "raw" | "ink" | "gate" | "mark";

const NODE_TONES: Record<NodeTone, string> = {
  plain: "border border-foreground bg-card text-foreground",
  raw: "border border-foreground bg-card text-foreground",
  ink: "border border-foreground bg-foreground text-background",
  gate: "border border-dashed border-foreground bg-transparent text-foreground",
  mark: "border-2 border-mennige bg-card text-kupfer-dark",
};

/** A square station with a pictogram and a label underneath. */
function Node({
  icon,
  label,
  tone = "plain",
  text,
  className,
}: {
  readonly icon?: PictogramName;
  readonly label: string;
  readonly tone?: NodeTone;
  /** Short word drawn inside the square instead of a pictogram. */
  readonly text?: string;
  readonly className?: string;
}) {
  return (
    <div className={cx("demo-pv-rise flex min-w-0 flex-col items-center gap-2", className)}>
      <div
        className={cx(
          "relative grid size-12 shrink-0 place-items-center overflow-hidden",
          NODE_TONES[tone],
        )}
      >
        {tone === "raw" ? <Hatch /> : null}
        {text ? (
          <span className="relative text-[0.75rem] font-bold">{text}</span>
        ) : icon ? (
          <Pictogram name={icon} className="relative size-6" />
        ) : null}
      </div>
      <span className={cx(LABEL, "max-w-[6.5rem] text-center text-balance")}>{label}</span>
    </div>
  );
}

function Arrow({ className }: { readonly className?: string }) {
  return (
    <ArrowGlyph
      className={cx("mb-6 size-4 shrink-0 text-muted-foreground", className)}
    />
  );
}

function Flow({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div
      className={cx(
        "flex w-full items-center justify-center gap-2 px-4 py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A sheet of paper drawn as lines; `raw` hatches it. */
function Sheet({
  lines = 4,
  raw = false,
  className,
  children,
}: {
  readonly lines?: number;
  readonly raw?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className={cx("relative overflow-hidden border border-foreground bg-card p-3", className)}>
      {raw ? <Hatch /> : null}
      <div className="relative flex flex-col gap-2">
        {children}
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className="block h-1.5 bg-hairline"
            style={{ width: `${[92, 78, 86, 64, 72, 55][index % 6]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ExcelPreview() {
  const { text } = useDemoLocale();
  const bars = [52, 44, 60, 48];
  return (
    <div className="grid w-full grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-6">
      <div className="demo-pv-rise min-w-0">
        <div className="relative overflow-hidden border border-foreground bg-card">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] border-b border-foreground">
            {[text("KW", "Wk"), text("Umsatz", "Revenue")].map((head) => (
              <span key={head} className={cx(LABEL, "whitespace-nowrap px-2 py-1.5")}>
                {head}
              </span>
            ))}
          </div>
          <div className="relative">
            <Hatch />
            {/* Two columns so every value fits whole on a narrow tile: the
                drawing never truncates its own data. */}
            {[
              ["15", "911.800"],
              ["16", "780.850"],
              ["17", "984.550"],
              ["18", "843.200"],
            ].map((row) => (
              <div
                key={row[0]}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] border-b border-hairline last:border-b-0"
              >
                <span className={cx(DATA, "w-9 px-2 py-1")}>{row[0]}</span>
                <span className={cx(DATA, "whitespace-nowrap px-2 py-1 text-right")}>
                  {row[1]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className={cx(LABEL, "mt-2")}>{text("Absatzdaten, Export", "Sales export")}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Node tone="ink" text="Claude" label={text("Formel", "Formula")} />
      </div>

      <div className="demo-pv-rise min-w-0">
        <div className="flex h-28 items-end gap-1.5 border-b border-l border-foreground px-2">
          {bars.map((height, index) => (
            <span key={index} className="w-full bg-foreground" style={{ height: `${height}%` }} />
          ))}
          <span className="w-full bg-mennige" style={{ height: "56%" }} />
        </div>
        <p className={cx(LABEL, "mt-2")}>
          {text("Prognose KW 19, zu prüfen", "Week 19 forecast, to check")}
        </p>
      </div>
    </div>
  );
}

export function WordPreview() {
  const { text } = useDemoLocale();
  const checks: ReadonlyArray<{ label: string; open?: boolean }> = [
    { label: text("Stil", "Style") },
    { label: text("Quellen", "Sources") },
    { label: text("Personendaten", "Personal data") },
    { label: text("Freigabe offen", "Approval open"), open: true },
  ];
  return (
    <div className="flex w-full flex-col gap-3 px-5 py-4">
      <Sheet lines={3} raw className="demo-pv-rise">
        <span className="block h-2.5 w-3/5 bg-foreground" />
      </Sheet>
      <ul className="flex flex-col gap-1">
        {checks.map((check) => (
          <li
            key={check.label}
            className={cx(
              "demo-pv-rise flex items-center gap-2 px-2 py-1",
              check.open ? "border-2 border-dashed border-mennige" : "border-b border-hairline",
            )}
          >
            <Pictogram
              name={check.open ? "gap" : "pass"}
              className={cx("size-4", check.open ? "text-kupfer-dark" : "text-foreground")}
            />
            <span className={LABEL}>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OutboundWorkflowPreview() {
  const { text } = useDemoLocale();
  return (
    <div className="flex w-full flex-col gap-3 px-5 py-6">
      {[
        text("Fördersignal", "Funding signal"),
        text("Stellenanzeige", "Job posting"),
      ].map((signal) => (
        <div key={signal} className="demo-pv-rise flex items-center gap-3 border-b border-hairline pb-2">
          <Pictogram name="table" className="size-5 text-foreground" />
          <span className={LABEL}>{signal}</span>
          <span className={cx(DATA, "ml-auto text-muted-foreground")}>
            {text("Quelle", "Source")}
          </span>
        </div>
      ))}
      <Sheet lines={3} className="demo-pv-rise border-dashed">
        <span className={LABEL}>{text("Entwurf", "Draft")}</span>
      </Sheet>
      <div className="demo-pv-rise flex items-center gap-2 border-2 border-mennige bg-card px-3 py-2">
        <Pictogram name="person" className="size-5 text-kupfer-dark" />
        <span className={LABEL}>{text("Review vor Versand", "Review before sending")}</span>
      </div>
    </div>
  );
}

export function AgentPipelinePreview() {
  const { text } = useDemoLocale();
  // Short station names so all four fit whole on a 300px tile.
  const stations = [
    text("Suche", "Search"),
    text("Synthese", "Synthesis"),
    text("Kritik", "Critique"),
    text("Text", "Edit"),
  ];
  return (
    <div className="flex w-full flex-col gap-5 px-5 py-6">
      <ol className="relative grid grid-cols-4">
        <span className="absolute left-[12.5%] right-[12.5%] top-[0.6875rem] h-0.5 bg-foreground" />
        {stations.map((station, index) => (
          <li key={station} className="demo-pv-rise relative flex min-w-0 flex-col items-center gap-2">
            <span
              className={cx(
                "grid size-6 place-items-center border-2 text-[0.75rem] font-bold tabular-nums",
                index === 2
                  ? "border-mennige bg-mennige text-paper"
                  : "border-foreground bg-foreground text-background",
              )}
            >
              {index + 1}
            </span>
            <span className={cx(LABEL, "whitespace-nowrap text-center")}>{station}</span>
          </li>
        ))}
      </ol>
      <Sheet lines={3} className="demo-pv-rise">
        <span className={LABEL}>Memo</span>
      </Sheet>
    </div>
  );
}

export function N8nSupplyChainPreview() {
  const { text } = useDemoLocale();
  return (
    <Flow>
      <Node tone="raw" icon="clock" label={text("Verzug 31\u00a0h", "31\u00a0h delay")} />
      <Arrow />
      <Node icon="table" label={text("Bestand", "Stock")} />
      <Arrow />
      <Node icon="canvas" label={text("Kundenentwurf", "Customer draft")} />
      <Arrow />
      <Node tone="mark" icon="person" label={text("Freigabe", "Sign-off")} />
    </Flow>
  );
}

export function RagVertragsassistentPreview() {
  const { text } = useDemoLocale();
  return (
    <div className="flex w-full flex-col gap-3 px-5 py-6">
      <div className="demo-pv-rise flex items-center gap-2 self-end border border-foreground bg-card px-3 py-2">
        <Pictogram name="question" className="size-4" />
        <span className={LABEL}>{text("Kündigungsfrist?", "Notice period?")}</span>
      </div>
      <Sheet lines={3} className="demo-pv-rise">
        <span className="flex items-baseline gap-2">
          <span className={cx(DATA, "font-bold")}>§ 5 (2)</span>
          <span className="block h-1.5 flex-1 border-b-2 border-mennige" />
        </span>
      </Sheet>
      <div className="demo-pv-rise flex items-center gap-2 self-end border border-foreground bg-card px-3 py-2">
        <Pictogram name="question" className="size-4" />
        <span className={LABEL}>{text("Haftung Dritter?", "Third-party liability?")}</span>
      </div>
      <div className="demo-pv-rise flex items-center gap-2 border border-dashed border-foreground px-3 py-2">
        <Pictogram name="gap" className="size-4" />
        <span className={LABEL}>{text("Kein Treffer, keine Antwort", "No match, no answer")}</span>
      </div>
    </div>
  );
}

export function RechnungZuSapPreview() {
  const { text } = useDemoLocale();
  return (
    <div className="flex w-full flex-col gap-3 px-5 py-5">
      <div className="flex items-center gap-3">
        <Node tone="raw" icon="canvas" label="PDF" />
        <Arrow />
        <div className="demo-pv-rise mb-6 flex min-w-0 flex-1 flex-col border border-foreground bg-card">
          {[
            [text("Nr.", "No."), "04211"],
            [text("Brutto", "Gross"), "100.317"],
          ].map(([label, value]) => (
            <span key={label} className="flex items-baseline justify-between gap-2 border-b border-hairline px-2 py-1 last:border-b-0">
              <span className={LABEL}>{label}</span>
              <span className={DATA}>{value}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="demo-pv-rise flex items-center gap-2 border-2 border-mennige bg-card px-3 py-1.5">
        <Pictogram name="person" className="size-4 text-kupfer-dark" />
        <span className={LABEL}>{text("Review vor SAP-Import", "Review before SAP import")}</span>
      </div>
    </div>
  );
}

export function PromptScannerPreview() {
  const { text } = useDemoLocale();
  return (
    <div className="flex w-full flex-col gap-3 px-5 py-6">
      <div className="demo-pv-rise flex flex-col gap-3 border border-foreground bg-card p-3">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="h-3 w-10 bg-hairline" />
          <span className="demo-pv-snap h-3 w-16 bg-foreground" />
          <span className="h-3 w-6 bg-hairline" />
          <span className={cx(DATA, "border-b-2 border-mennige px-0.5")}>IBAN</span>
          <span className="h-3 w-12 bg-hairline" />
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="h-3 w-14 bg-hairline" />
          {/* Dashed = the known gap: a confidential term the rules miss. */}
          <span className={cx(LABEL, "border-b border-dashed border-foreground px-0.5")}>
            {text("Projekt Nord", "Project Nord")}
          </span>
          <span className="h-3 w-10 bg-hairline" />
          <span className="h-3 w-8 bg-hairline" />
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="h-3 w-20 bg-hairline" />
          <span className="h-3 w-12 bg-hairline" />
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="demo-pv-rise inline-flex items-center gap-1.5 border border-foreground bg-card px-2 py-1">
          <Pictogram name="shield" className="size-4" />
          <span className={LABEL}>{text("2 markiert", "2 flagged")}</span>
        </span>
        <span className="demo-pv-rise inline-flex items-center gap-1.5 border border-dashed border-foreground px-2 py-1">
          <Pictogram name="gap" className="size-4" />
          <span className={LABEL}>{text("1 übersehen", "1 missed")}</span>
        </span>
      </div>
    </div>
  );
}

export function CostDriftObservabilityPreview() {
  const { text } = useDemoLocale();
  return (
    <div className="flex w-full flex-col gap-2 px-5 py-5">
      <svg viewBox="0 0 220 90" className="h-36 w-full" preserveAspectRatio="none" aria-hidden="true">
        {[22, 45, 68].map((y) => (
          <line key={y} x1="0" x2="220" y1={y} y2={y} className="stroke-hairline" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <line x1="0" x2="220" y1="30" y2="30" className="stroke-mennige" strokeWidth="1.5" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
        <polyline
          className="demo-pv-draw stroke-foreground"
          pathLength={1}
          strokeDasharray={1}
          points="0,74 22,68 44,70 66,58 88,62 110,50 132,54 154,40 176,44 198,24 220,30"
          fill="none"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-baseline justify-between gap-3">
        <span className={LABEL}>{text("Kosten pro Tag", "Cost per day")}</span>
        <span className={cx(LABEL, "text-kupfer-dark")}>{text("Budgetgrenze", "Budget line")}</span>
      </div>
    </div>
  );
}

export function FineTunePlaygroundPreview() {
  const { text } = useDemoLocale();
  const columns = [
    { label: text("Basismodell", "Base model"), score: 41, mark: false },
    { label: text("Domäne", "Domain"), score: 79, mark: true },
  ];
  return (
    <div className="grid w-full grid-cols-2 gap-3 px-5 py-6">
      {columns.map((column) => (
        <div key={column.label} className="demo-pv-rise flex min-w-0 flex-col gap-2">
          <Sheet lines={3} className="p-2.5">
            <span className={LABEL}>{column.label}</span>
          </Sheet>
          <span className="block h-2 bg-hairline">
            <span
              className={cx("block h-2", column.mark ? "bg-mennige" : "bg-foreground")}
              style={{ width: `${column.score}%` }}
            />
          </span>
          <span className={cx(DATA, "text-muted-foreground")}>
            {text("Holdout", "Holdout")} {column.score}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RoiRechnerPreview() {
  const { text } = useDemoLocale();
  const factors = [
    text("Team", "Team"),
    text("Satz", "Rate"),
    text("Quote", "Adoption"),
    text("Stunden", "Hours"),
  ];
  return (
    <div className="flex w-full flex-col gap-4 px-5 py-6">
      <div className="flex flex-wrap items-center gap-1.5">
        {factors.map((factor, index) => (
          <span key={factor} className="inline-flex items-center gap-1.5">
            {index > 0 ? <span className={cx(DATA, "text-muted-foreground")}>×</span> : null}
            <span className={cx(LABEL, "demo-pv-rise border border-foreground bg-card px-2 py-1")}>
              {factor}
            </span>
          </span>
        ))}
      </div>
      <div className="demo-pv-rise">
        <div className="relative h-4 border-x-2 border-foreground">
          <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-foreground" />
          <span className="absolute left-[46%] top-0 h-4 w-2 bg-mennige" />
        </div>
        <div className="mt-2 flex justify-between">
          <span className={DATA}>{text("niedrig", "low")}</span>
          <span className={LABEL}>{text("Szenario", "Scenario")}</span>
          <span className={DATA}>{text("hoch", "high")}</span>
        </div>
      </div>
    </div>
  );
}

export function LlmObservabilityPreview() {
  const { text } = useDemoLocale();
  const rows = [
    { auto: true, human: true },
    { auto: true, human: true },
    { auto: true, human: false },
    { auto: false, human: false },
  ];
  return (
    <div className="flex w-full flex-col gap-1 px-5 py-5">
      <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] gap-2 pb-1">
        <span />
        <span className={cx(LABEL, "text-center")}>{text("Auto", "Auto")}</span>
        <span className={cx(LABEL, "text-center")}>{text("Mensch", "Human")}</span>
      </div>
      {rows.map((row, index) => {
        const disagree = row.auto !== row.human;
        return (
          <div
            key={index}
            className={cx(
              "demo-pv-rise grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-center gap-2 px-1 py-1",
              disagree ? "border-2 border-mennige" : "border-b border-hairline",
            )}
          >
            <span className={DATA}>
              {text("Antwort", "Answer")} {index + 1}
            </span>
            {[row.auto, row.human].map((passed, cellIndex) => (
              <span key={cellIndex} className="grid place-items-center">
                <Pictogram name={passed ? "pass" : "fail"} className="size-4" />
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
