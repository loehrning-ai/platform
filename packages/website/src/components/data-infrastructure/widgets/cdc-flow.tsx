"use client";

// Ported from data-infrastructure/js/data-widgets.js's CDCFlow (lines 1919-2108).
// Real JSX <svg> rendering, not the source's innerHTML string-building
//. Not canvas: no RAF loop, no getContext null-check.

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import {
  handleRovingFocusKeyDown,
  rovingTabIndex,
} from "@/lib/a11y/roving-focus";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { useDataInfraWidgetLocale } from "../widget-locale-context";

interface CdcFlowProps {
  readonly lessonId: string;
  readonly cpId: string;
}

type CdcMode = "kappa" | "lambda";
const CDC_MODES: readonly CdcMode[] = ["kappa", "lambda"];

const KAPPA_STAGES = [
  "Postgres (OLTP)",
  "WAL / replication slot",
  "Debezium / Kafka Connect",
  "Kafka topic · cdc.public.users",
  "Streaming consumer (Flink)",
  "Iceberg · analytics.dim_users",
];

const KAPPA_STAGES_DE = [
  "Postgres (OLTP)",
  "WAL / Replikations-Slot",
  "Debezium / Kafka Connect",
  "Kafka-Topic · cdc.public.users",
  "Streaming-Consumer (Flink)",
  "Iceberg · analytics.dim_users",
];

const KAPPA_NOTE =
  "One pipeline. Re-process by replaying the topic from offset 0 of a long-retention compacted topic.";
const LAMBDA_NOTE =
  "Two pipelines computing the same logic, then merged. Killer flaw: two codebases for one transform.";

const KAPPA_NOTE_DE =
  "Eine Pipeline. Für eine Neuberechnung wird das Topic ab Offset 0 erneut gelesen; dafür braucht es lange Aufbewahrung und Kompaktierung.";
const LAMBDA_NOTE_DE =
  "Zwei Pipelines berechnen dieselbe Logik und werden danach zusammengeführt. Der zentrale Nachteil sind zwei Implementierungen derselben Transformation.";

const PAYLOAD_LINES: readonly { key: string; value: string; note: string }[] = [
  {
    key: '"op":',
    value: '"u"',
    note: ", c·u·d·r (create / update / delete / read=snapshot)",
  },
  { key: '"ts_ms":', value: "1714233601000", note: ", commit time on source" },
  { key: '"source":', value: "{ db, schema, lsn, ... }", note: ", provenance" },
  {
    key: '"before":',
    value: '{ id:42, plan:"free" }',
    note: ", prior row state (UPDATE / DELETE only)",
  },
  {
    key: '"after":',
    value: '{ id:42, plan:"pro" }',
    note: ", new row state (INSERT / UPDATE only)",
  },
];

const WHY_CDC_WINS = [
  "captures DELETEs (no row to SELECT)",
  "no load on source, reads WAL directly",
  "ordered, gap-free by LSN",
  "replayable from any offset",
];

const WHY_CDC_WINS_DE = [
  "erfasst DELETEs, obwohl keine Zeile mehr per SELECT lesbar ist",
  "liest das WAL ohne Abfragelast auf dem Quellsystem",
  "ist über die LSN geordnet und lückenlos",
  "kann ab jedem Offset erneut gelesen werden",
];

export function CdcFlow({ lessonId, cpId }: CdcFlowProps): JSX.Element {
  const { locale } = useDataInfraWidgetLocale();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [mode, setMode] = useState<CdcMode>("kappa");
  const [recorded, setRecorded] = useState(false);
  const tabsId = `data-infra-${lessonId}-${cpId}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );

  const recordCheckpoint = () => {
    if (recorded || done) return;
    setRecorded(true);
    complete();
  };

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-3 sm:p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {locale === "de"
          ? "Diagramm · CDC-Pipeline · Kappa und Lambda"
          : "Diagram · CDC pipeline · Kappa vs. Lambda"}
      </p>
      <div
        className="mb-4 flex flex-wrap gap-2"
        role="tablist"
        aria-label={locale === "de" ? "CDC-Architektur" : "CDC architecture"}
        aria-orientation="horizontal"
        data-roving-group
      >
        {CDC_MODES.map((m, index) => (
          <button
            key={m}
            id={`${tabsId}-${m}-tab`}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-controls={`${tabsId}-${m}-panel`}
            data-roving-item
            tabIndex={rovingTabIndex(CDC_MODES.indexOf(mode), index)}
            onClick={() => setMode(m)}
            onKeyDown={(event) =>
              handleRovingFocusKeyDown(event, {
                currentIndex: index,
                itemCount: CDC_MODES.length,
                orientation: "horizontal",
                onMove: (nextIndex) => {
                  const nextMode = CDC_MODES[nextIndex];
                  if (nextMode) setMode(nextMode);
                },
              })
            }
            className={cn(
              "min-h-11 border-2 px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide transition-colors",
              mode === m
                ? "border-foreground bg-brand-orange text-white"
                : "border-border bg-background text-muted-foreground hover:border-brand-orange/60",
            )}
          >
            {m === "kappa"
              ? locale === "de"
                ? "Kappa (ein Stream)"
                : "Kappa (one stream)"
              : locale === "de"
                ? "Lambda (Speed und Batch)"
                : "Lambda (speed + batch)"}
          </button>
        ))}
      </div>

      {CDC_MODES.map((panelMode) => (
        <div
          key={panelMode}
          id={`${tabsId}-${panelMode}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${panelMode}-tab`}
          hidden={mode !== panelMode}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="overflow-x-auto">
            {panelMode === "kappa" ? (
              <KappaDiagram locale={locale} />
            ) : (
              <LambdaDiagram locale={locale} />
            )}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            {panelMode === "kappa"
              ? locale === "de"
                ? KAPPA_NOTE_DE
                : KAPPA_NOTE
              : locale === "de"
                ? LAMBDA_NOTE_DE
                : LAMBDA_NOTE}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={recordCheckpoint}
        disabled={recorded || done}
        className={cn(
          "mt-4 inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-wide transition-colors",
          recorded || done
            ? "cursor-default border-border bg-border text-muted-foreground"
            : "bg-brand-orange text-white hover:opacity-90",
        )}
      >
        {recorded || done
          ? locale === "de"
            ? "Checkpoint erfasst"
            : "Checkpoint recorded"
          : locale === "de"
            ? "Checkpoint festhalten"
            : "Record checkpoint"}
      </button>
    </div>
  );
}

function StageBox({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}) {
  const words = label.split(" ");
  let line1 = "";
  let line2 = "";
  for (const word of words) {
    if ((line1 + " " + word).trim().length <= 20)
      line1 = (line1 + " " + word).trim();
    else line2 = (line2 + " " + word).trim();
  }
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className="fill-card stroke-brand-orange"
        strokeWidth={1.2}
      />
      <text
        x={x + w / 2}
        y={y + (line2 ? h / 2 - 4 : h / 2 + 4)}
        textAnchor="middle"
        className="fill-foreground text-[11px] font-semibold"
      >
        {line1}
      </text>
      {line2 && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          className="fill-foreground text-[11px] font-semibold"
        >
          {line2}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="stroke-muted-foreground"
        strokeWidth={1.2}
      />
      <polygon
        points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
        className="fill-muted-foreground"
      />
    </g>
  );
}

function PayloadCard({
  x,
  y,
  w,
  h,
  locale,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  locale: Locale;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className="fill-card stroke-border"
        strokeWidth={1}
      />
      <text
        x={x + 14}
        y={y + 20}
        className="fill-foreground text-[11px] font-bold"
      >
        {locale === "de"
          ? "Ereignis-Payload (Debezium-Format)"
          : "Event payload (Debezium-style)"}
      </text>
      {PAYLOAD_LINES.map((line, i) => (
        <g key={line.key}>
          <text
            x={x + 20}
            y={y + 42 + i * 24}
            className="fill-brand-orange font-mono text-[10px]"
          >
            {line.key}
          </text>
          <text
            x={x + 78}
            y={y + 42 + i * 24}
            className="fill-foreground font-mono text-[10px]"
          >
            {line.value}
          </text>
          <text
            x={x + 260}
            y={y + 42 + i * 24}
            className="fill-muted-foreground text-[9.5px]"
          >
            {locale === "de"
              ? [
                  "c·u·d·r (create / update / delete / read=Snapshot)",
                  "Commit-Zeit im Quellsystem",
                  "Herkunft",
                  "vorheriger Zeilenzustand (nur UPDATE / DELETE)",
                  "neuer Zeilenzustand (nur INSERT / UPDATE)",
                ][i]
              : line.note}
          </text>
        </g>
      ))}
    </g>
  );
}

function WhyWinsCard({
  x,
  y,
  w,
  h,
  locale,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  locale: Locale;
}) {
  const reasons = locale === "de" ? WHY_CDC_WINS_DE : WHY_CDC_WINS;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className="fill-card stroke-border"
        strokeWidth={1}
      />
      <text
        x={x + 14}
        y={y + 20}
        className="fill-foreground text-[11px] font-bold"
      >
        {locale === "de"
          ? "Vorteile gegenüber Polling"
          : "Why this wins over polling"}
      </text>
      {reasons.map((p, i) => (
        <g key={p}>
          <circle
            cx={x + 20}
            cy={y + 46 + i * 24 - 4}
            r={3}
            className="fill-[#3f8264]"
          />
          <text
            x={x + 32}
            y={y + 46 + i * 24}
            className="fill-foreground text-[10.5px]"
          >
            {p}
          </text>
        </g>
      ))}
    </g>
  );
}

function KappaDiagram({ locale }: { readonly locale: Locale }): JSX.Element {
  const padL = 30;
  const padT = 30;
  const cellW = 160;
  const cellH = 60;
  const gap = 16;
  const y = padT + 20;
  return (
    <svg
      viewBox="0 0 1100 320"
      role="img"
      aria-label={
        locale === "de"
          ? "Kappa-Architektur: eine Streaming-Pipeline von Postgres über Debezium und Kafka bis Iceberg."
          : "Kappa architecture: one streaming pipeline from Postgres through Debezium and Kafka to Iceberg."
      }
      className="min-w-[900px]"
    >
      {(locale === "de" ? KAPPA_STAGES_DE : KAPPA_STAGES).map((s, i) => {
        const x = padL + i * (cellW + gap);
        return (
          <g key={s}>
            <StageBox x={x} y={y} w={cellW} h={cellH} label={s} />
            {i < KAPPA_STAGES.length - 1 && (
              <Arrow
                x1={x + cellW + 1}
                y1={y + cellH / 2}
                x2={x + cellW + gap - 1}
                y2={y + cellH / 2}
              />
            )}
          </g>
        );
      })}
      <PayloadCard
        x={padL}
        y={y + cellH + 36}
        w={520}
        h={190}
        locale={locale}
      />
      <WhyWinsCard
        x={padL + 540}
        y={y + cellH + 36}
        w={510}
        h={190}
        locale={locale}
      />
    </svg>
  );
}

function LambdaDiagram({ locale }: { readonly locale: Locale }): JSX.Element {
  const padL = 30;
  const sharedY = 130;
  const cellW = 130;
  const cellH = 56;
  const gap = 14;
  const sharedStages = ["Postgres (OLTP)", "WAL", "Debezium", "Kafka topic"];
  const branchX = padL + 4 * (cellW + gap) + 30;
  const speedY = 60;
  const batchY = 230;
  const branchW = cellW + 30;
  const mergeX = branchX + branchW + 28;
  const mergeY = sharedY - 10;
  const mergeW = 260;
  const mergeH = cellH + 20;

  return (
    <svg
      viewBox="0 0 1100 340"
      role="img"
      aria-label={
        locale === "de"
          ? "Lambda-Architektur: gemeinsame Aufnahme, Verzweigung in Speed- und Batch-Schicht und Zusammenführung für die Bereitstellung."
          : "Lambda architecture: shared ingestion branching into a speed layer and a batch layer, merged for serving."
      }
      className="min-w-[900px]"
    >
      {sharedStages.map((s, i) => {
        const x = padL + i * (cellW + gap);
        return (
          <g key={s}>
            <StageBox x={x} y={sharedY} w={cellW} h={cellH} label={s} />
            {i < sharedStages.length - 1 && (
              <Arrow
                x1={x + cellW + 1}
                y1={sharedY + cellH / 2}
                x2={x + cellW + gap - 1}
                y2={sharedY + cellH / 2}
              />
            )}
          </g>
        );
      })}
      <StageBox
        x={branchX}
        y={speedY}
        w={branchW}
        h={cellH}
        label={
          locale === "de"
            ? "Speed-Schicht, Flink · näherungsweise"
            : "Speed layer, Flink · approximate"
        }
      />
      <StageBox
        x={branchX}
        y={batchY}
        w={branchW}
        h={cellH}
        label={
          locale === "de"
            ? "Batch-Schicht, Spark · korrekt, stündlich"
            : "Batch layer, Spark · correct, hourly"
        }
      />
      <Arrow
        x1={padL + 4 * (cellW + gap) - gap}
        y1={sharedY + cellH / 2}
        x2={branchX - 4}
        y2={speedY + cellH / 2}
      />
      <Arrow
        x1={padL + 4 * (cellW + gap) - gap}
        y1={sharedY + cellH / 2}
        x2={branchX - 4}
        y2={batchY + cellH / 2}
      />
      <StageBox
        x={mergeX}
        y={mergeY}
        w={mergeW}
        h={mergeH}
        label={
          locale === "de"
            ? "Zusammenführen / Bereitstellen, Batch ⊕ aktuelles Delta → Iceberg"
            : "Merge / serve, batch ⊕ recent-speed-delta → Iceberg"
        }
      />
      <Arrow
        x1={branchX + branchW}
        y1={speedY + cellH / 2}
        x2={mergeX - 4}
        y2={mergeY + mergeH / 2 - 6}
      />
      <Arrow
        x1={branchX + branchW}
        y1={batchY + cellH / 2}
        x2={mergeX - 4}
        y2={mergeY + mergeH / 2 + 6}
      />
      <text
        x={padL}
        y={320}
        className="fill-[#b85a4a] text-[11px] font-semibold"
      >
        {locale === "de"
          ? "Zwei Codebasen: Jede Aggregation existiert als Stream- und Batch-Variante. Abweichungen zwischen beiden erhöhen den Betriebsaufwand."
          : "⚠ Two codebases. Every aggregation expressed twice, once streaming, once batch. Drift between the two is the dominant operational pain."}
      </text>
    </svg>
  );
}

export default CdcFlow;
