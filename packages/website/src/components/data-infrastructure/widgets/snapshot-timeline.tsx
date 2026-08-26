"use client";

// Ported from data-infrastructure/js/data-widgets.js's SnapshotTimeline
// (lines 1434-1670) —.
//
// The source's only selection mechanism is canvas mouse hit-testing
// (`pickAt()` via raw `mousemove`/`click` listeners), with no keyboard or
// screen-reader path — a real accessibility gap since this checkpoint feeds
// the all-lessons-completed certificate-eligibility path (a keyboard-only
// learner could otherwise be permanently blocked from certification). This
// port keeps the canvas hit-testing AND adds a real, always-present,
// Tab-focusable list of snapshot buttons driving the exact same `select()`
// function — not a hidden/visually-only fallback, a first-class keyboard
// path to the same interaction.

import { useCallback, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import {
  handleRovingFocusKeyDown,
  rovingTabIndex,
} from "@/lib/a11y/roving-focus";
import { useAutoSizedCanvasRAF } from "../canvas/use-auto-sized-canvas-raf";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { useDataInfraWidgetLocale } from "../widget-locale-context";

interface SnapshotTimelineProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface Snapshot {
  readonly t: string;
  readonly op:
    "CREATE" | "INSERT" | "UPDATE" | "COMPACT" | "BAD WRITE" | "ROLLBACK";
  readonly desc: string;
  readonly files: number;
  readonly bytes: string;
}

const SNAPS: readonly Snapshot[] = [
  {
    t: "10:00",
    op: "CREATE",
    desc: "initial load · 1.2 TB · 4,800 files",
    files: 4800,
    bytes: "1.2 TB",
  },
  {
    t: "10:42",
    op: "INSERT",
    desc: "+ 12 GB clickstream · adds 48 files",
    files: 4848,
    bytes: "1.21 TB",
  },
  {
    t: "11:15",
    op: "UPDATE",
    desc: "GDPR delete for 412 users · 6 files rewritten (CoW)",
    files: 4854,
    bytes: "1.21 TB",
  },
  {
    t: "11:50",
    op: "COMPACT",
    desc: "small-file compaction · 4,854 → 1,920 files",
    files: 1920,
    bytes: "1.21 TB",
  },
  {
    t: "12:33",
    op: "INSERT",
    desc: "hourly batch · +14 GB · adds 56 files",
    files: 1976,
    bytes: "1.22 TB",
  },
  {
    t: "13:01",
    op: "BAD WRITE",
    desc: "bad transformation · NULLs in price column",
    files: 2010,
    bytes: "1.22 TB",
  },
  {
    t: "13:08",
    op: "ROLLBACK",
    desc: "rolled back to snap @12:33 · time travel",
    files: 1976,
    bytes: "1.22 TB",
  },
];

const OP_COLOR: Record<Snapshot["op"], string> = {
  CREATE: "#5b8a8f",
  INSERT: "#3f8264",
  UPDATE: "#cf8a3f",
  COMPACT: "#7a4a8a",
  "BAD WRITE": "#b85a4a",
  ROLLBACK: "#cf8a3f",
};

const SNAPSHOT_DESCRIPTIONS_DE = [
  "initialer Import · 1,2 TB · 4.800 Dateien",
  "+12 GB Clickstream · 48 neue Dateien",
  "DSGVO-Löschung für 412 Nutzer · 6 Dateien neu geschrieben (CoW)",
  "Small-File-Kompaktierung · 4.854 → 1.920 Dateien",
  "stündlicher Batch · +14 GB · 56 neue Dateien",
  "fehlerhafte Transformation · NULL-Werte in price",
  "Rollback auf Snapshot 12:33 · Zeitreise",
] as const;

function snapshotDescription(
  locale: Locale,
  snapshot: Snapshot,
  index: number,
): string {
  return locale === "de" ? SNAPSHOT_DESCRIPTIONS_DE[index] : snapshot.desc;
}

function nodeX(i: number, w: number) {
  const pad = 40;
  return pad + (i + 0.5) * ((w - 2 * pad) / SNAPS.length);
}
function nodeY(i: number, h: number) {
  return SNAPS[i].op === "BAD WRITE" ? h / 2 + 30 : h / 2 - 6;
}

export function SnapshotTimeline({
  lessonId,
  cpId,
}: SnapshotTimelineProps): JSX.Element {
  const { locale } = useDataInfraWidgetLocale();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [cur, setCur] = useState(0);
  const hoverRef = useRef(-1);

  const draw = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setContextUnavailable(true);
      return false;
    }
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(91,138,143,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, h / 2 - 6);
    ctx.lineTo(w - 30, h / 2 - 6);
    ctx.stroke();

    for (let i = 0; i < SNAPS.length; i++) {
      const s = SNAPS[i];
      const x = nodeX(i, w);
      const y = nodeY(i, h);
      const r = 14;
      const isCur = i === cur;
      const isHover = i === hoverRef.current;
      ctx.fillStyle = isCur ? OP_COLOR[s.op] : "#ffffff";
      ctx.strokeStyle = OP_COLOR[s.op];
      ctx.lineWidth = isCur || isHover ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isCur ? "#fff" : OP_COLOR[s.op];
      ctx.font = "bold 8px monospace";
      const label = s.op.length > 6 ? s.op.slice(0, 4) : s.op;
      ctx.fillText(label, x - label.length * 2.6, y + 3);
      ctx.fillStyle = "rgba(91,138,143,0.7)";
      ctx.font = "8px monospace";
      ctx.fillText(s.t, x - 12, y - r - 4);
    }
    return false;
  }, [cur]);

  useAutoSizedCanvasRAF(canvasRef, wrapRef, draw, { minHeight: 180 });

  const select = useCallback(
    (i: number) => {
      setCur(i);
      complete();
    },
    [complete],
  );

  const pickAt = useCallback(
    (mx: number, my: number, w: number, h: number): number => {
      for (let i = 0; i < SNAPS.length; i++) {
        const x = nodeX(i, w);
        const y = nodeY(i, h);
        if ((mx - x) ** 2 + (my - y) ** 2 < 20 * 20) return i;
      }
      return -1;
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const i = pickAt(mx, my, r.width, r.height);
      if (i >= 0) select(i);
    },
    [pickAt, select],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      hoverRef.current = pickAt(mx, my, r.width, r.height);
    },
    [pickAt],
  );

  const current = SNAPS[cur];
  const currentDescription = snapshotDescription(locale, current, cur);

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-3 sm:p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {locale === "de"
          ? "Modell · Iceberg-Snapshots und Zeitreise"
          : "Model · Iceberg snapshots and time travel"}{" "}
        {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title={locale === "de" ? "Snapshot-Zeitleiste" : "Snapshot timeline"}
          summary={
            locale === "de"
              ? `Aktiver Snapshot ${current.t} (${current.op}): ${currentDescription}`
              : `Currently viewing snapshot @ ${current.t} (${current.op}): ${currentDescription}`
          }
        />
      ) : (
        <div ref={wrapRef} className="h-[130px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={
              locale === "de"
                ? "Lakehouse-Snapshot-Zeitleiste. Die Auswahl zeigt den Tabellenzustand zu diesem Zeitpunkt."
                : "Lakehouse snapshot timeline. Selecting a snapshot shows the table state at that time."
            }
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            className="h-full w-full cursor-pointer"
          />
        </div>
      )}

      <div className="mt-4 border-2 border-border bg-background p-3">
        <div className="flex items-center gap-2">
          <b className="font-mono text-[12px]">
            {locale === "de" ? "Snapshot" : "snapshot"} @ {current.t}
          </b>
          <span
            className="border px-1.5 py-0.5 font-mono text-xs font-bold uppercase"
            style={{
              borderColor: OP_COLOR[current.op],
              color: OP_COLOR[current.op],
            }}
          >
            {current.op}
          </span>
        </div>
        <p className="mt-1 break-words text-[13px] text-muted-foreground">
          {currentDescription}
        </p>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
          {`manifest_list: snap-${1000 + cur}.avro\n${locale === "de" ? "Dateien" : "files"}:        ${current.files.toLocaleString(locale === "de" ? "de-DE" : "en-US")}\n${locale === "de" ? "Bytes" : "bytes"}:          ${current.bytes}\n${locale === "de" ? "Vorgänger" : "parent"}:     ${cur > 0 ? `snap-${999 + cur}` : locale === "de" ? "(keiner)" : "(none)"}`}
        </pre>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {locale === "de"
            ? "Snapshot auswählen (mit Tastatur bedienbar)"
            : "Select a snapshot (keyboard accessible)"}
        </p>
        <div
          role="listbox"
          aria-label={locale === "de" ? "Snapshot-Auswahl" : "Snapshot picker"}
          aria-orientation="horizontal"
          data-roving-group
          className="flex flex-wrap gap-1.5"
        >
          {SNAPS.map((s, i) => (
            <button
              key={s.t}
              type="button"
              role="option"
              aria-selected={i === cur}
              aria-posinset={i + 1}
              aria-setsize={SNAPS.length}
              data-roving-item
              tabIndex={rovingTabIndex(cur, i)}
              onClick={() => select(i)}
              onKeyDown={(event) =>
                handleRovingFocusKeyDown(event, {
                  currentIndex: i,
                  itemCount: SNAPS.length,
                  onMove: select,
                })
              }
              className={cn(
                "min-h-11 border-2 px-2 py-1 font-mono text-xs font-semibold transition-colors",
                i === cur
                  ? "border-foreground bg-brand-orange text-white"
                  : "border-border bg-background text-foreground hover:border-brand-orange/60",
              )}
            >
              {s.t} · {s.op}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => select(Math.max(0, cur - 1))}
          className="min-h-11 border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
        >
          {locale === "de" ? "vorheriger" : "◀ prev"}
        </button>
        <button
          type="button"
          onClick={() => select(Math.min(SNAPS.length - 1, cur + 1))}
          className="min-h-11 border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
        >
          {locale === "de" ? "nächster" : "next ▶"}
        </button>
        <button
          type="button"
          onClick={() => select(4)}
          className="min-h-11 border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          {locale === "de" ? "Rollback auf 12:33" : "⏎ rollback to 12:33"}
        </button>
      </div>
    </div>
  );
}

export default SnapshotTimeline;
