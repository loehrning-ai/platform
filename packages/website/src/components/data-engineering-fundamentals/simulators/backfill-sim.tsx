"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── BackfillSim ──────────────────────────────────
// Ported from `src/chapters/Ch4_Orchestrate.js`: 7-partition backfill,
// INSERT OVERWRITE (idempotent) vs plain INSERT (retries double rows).

const PART_COUNT = 7;
const baseDate = (i: number) => `04-${String(10 + i).padStart(2, "0")}`;

type WriteMode = "overwrite" | "insert";
type PartStatus = "pending" | "writing" | "success" | "failed" | "doubled";

interface Part {
  readonly i: number;
  readonly date: string;
  readonly status: PartStatus;
  readonly attempts: number;
  readonly rows: number | null;
  readonly fill: number;
}

interface LogEntry {
  readonly t: string;
  readonly k: "info" | "ok" | "err";
  readonly m: string;
  readonly _seq: number;
}

function initialParts(): readonly Part[] {
  return Array.from({ length: PART_COUNT }, (_, i) => ({
    i,
    date: baseDate(i),
    status: "pending",
    attempts: 0,
    rows: null,
    fill: 0,
  }));
}

export function BackfillSim() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const [mode, setMode] = useState<WriteMode>("overwrite");
  const [concurrency, setConcurrency] = useState(3);
  const [failureRate, setFailureRate] = useState(15);
  const [parts, setParts] = useState<readonly Part[]>(initialParts);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<readonly LogEntry[]>([
    { t: "00:00", k: "info", m: text("Scheduler idle. Press ▶ Run backfill to queue 7 partitions.", "Scheduler wartet. Mit ▶ Backfill starten werden 7 Partitionen eingeplant."), _seq: 0 },
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const logSeqRef = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const append = (entry: Omit<LogEntry, "_seq">) => {
    const seq = ++logSeqRef.current;
    setLog((l) => [...l, { ...entry, _seq: seq }].slice(-40));
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const timestampFrom = (start: number | null) => {
    if (!start) return "00:00";
    const ms = Date.now() - start;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const updatePart = (pi: number, patch: Partial<Part>) => {
    setParts((s) => s.map((p) => (p.i === pi ? { ...p, ...patch } : p)));
  };

  const commitPartition = (pi: number, wasRetried: boolean, resolve: () => void) => {
    const baseRows = 100 + pi * 8;
    if (modeRef.current === "overwrite") {
      updatePart(pi, { status: "success", rows: baseRows, fill: 100 });
      append({ t: "  •  ", k: "ok", m: `task.${baseDate(pi)} → COMMIT · rows=${baseRows} ${wasRetried ? text("(retry OK)", "(Wiederholung OK)") : ""}` });
    } else {
      const doubled = wasRetried;
      const rows = doubled ? baseRows * 2 : baseRows;
      updatePart(pi, { status: doubled ? "doubled" : "success", rows, fill: 100 });
      if (wasRetried) {
        append({ t: "  •  ", k: "err", m: `task.${baseDate(pi)} → INSERT ${text("appended DOUBLED rows", "hängte DOPPELTE Zeilen an")} (${baseRows * 2}): ${text("no idempotency", "nicht idempotent")}` });
      } else {
        append({ t: "  •  ", k: "ok", m: `task.${baseDate(pi)} → INSERT ${text("committed", "geschrieben")} · rows=${baseRows}` });
      }
    }
    resolve();
  };

  const retryPartition = (pi: number, resolve: () => void) => {
    updatePart(pi, { status: "writing", fill: 0 });
    setParts((s) => s.map((p) => (p.i === pi ? { ...p, attempts: p.attempts + 1 } : p)));
    append({ t: "  •  ", k: "info", m: `task.${baseDate(pi)} → ${text("retrying (attempt 2)", "Wiederholung (Versuch 2)")}` });
    const start = Date.now();
    const totalMs = 1300 + Math.random() * 500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const frac = Math.min(1, elapsed / totalMs);
      updatePart(pi, { fill: frac * 100 });
      if (frac < 1) requestAnimationFrame(tick);
      else commitPartition(pi, true, resolve);
    };
    requestAnimationFrame(tick);
  };

  const runPartition = (pi: number) =>
    new Promise<void>((resolve) => {
      updatePart(pi, { status: "writing", fill: 0 });
      setParts((s) => s.map((p) => (p.i === pi ? { ...p, attempts: p.attempts + 1 } : p)));
      append({ t: "  •  ", k: "info", m: `task.${baseDate(pi)} → ${text("writing (attempt 1)", "schreibt (Versuch 1)")}` });
      const totalMs = 1400 + Math.random() * 800;
      const shouldFail = Math.random() * 100 < failureRate;
      const failAt = shouldFail ? 0.45 + Math.random() * 0.3 : null;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const frac = Math.min(1, elapsed / totalMs);
        if (failAt && frac >= failAt) {
          updatePart(pi, { status: "failed", fill: failAt * 100 });
          append({ t: "  •  ", k: "err", m: `task.${baseDate(pi)} → ${text("FAILED at", "FEHLER bei")} ${Math.round(failAt * 100)}% (${text("network timeout", "Netzwerk-Zeitüberschreitung")})` });
          setTimeout(() => retryPartition(pi, resolve), 900);
          return;
        }
        updatePart(pi, { fill: frac * 100 });
        if (frac < 1) requestAnimationFrame(tick);
        else commitPartition(pi, false, resolve);
      };
      requestAnimationFrame(tick);
    });

  const runBackfill = () => {
    const start = Date.now();
    setRunning(true);
    setParts(initialParts());
    append({ t: "00:00", k: "info", m: `▶ ${text("Backfill dispatched", "Backfill gestartet")} · 7 ${text("partitions", "Partitionen")} · mode=${mode.toUpperCase()}` });
    const queue = Array.from({ length: PART_COUNT }, (_, i) => i);
    let active = 0;
    let index = 0;
    const launch = () => {
      while (active < concurrency && index < queue.length) {
        const pi = queue[index++];
        active++;
        runPartition(pi).then(() => {
          active--;
          if (index < queue.length) launch();
          else if (active === 0) {
            setRunning(false);
            append({ t: timestampFrom(start), k: "ok", m: text("✓ Backfill complete", "✓ Backfill abgeschlossen") });
          }
        });
      }
    };
    launch();
  };

  const reset = () => {
    setParts(initialParts());
    setRunning(false);
    setLog([]);
  };

  const totalRows = parts.reduce((a, p) => a + (p.rows ?? 0), 0);
  const expected = parts.reduce((a, p, i) => a + (p.rows !== null ? 100 + i * 8 : 0), 0);
  const drift = totalRows - expected;
  const anyDoubled = parts.some((p) => p.status === "doubled");
  const allDone = parts.every((p) => p.status === "success" || p.status === "doubled");

  return (
    <Panel
      eyebrow={text("live simulator · retry semantics", "Live-Simulator · Wiederholungssemantik")}
      title={mode === "overwrite" ? text("Backfill with INSERT OVERWRITE (idempotent in this model)", "Backfill mit INSERT OVERWRITE (in diesem Modell idempotent)") : text("Backfill with INSERT (non-idempotent in this model)", "Backfill mit INSERT (in diesem Modell nicht idempotent)")}
      meta={`${concurrency} Worker · ${failureRate}% ${text("fail rate", "Fehlerrate")}`}
      caption={text("This simulator uses deterministic partition replacement for overwrite and row retention for append. Real idempotency also depends on stable inputs and transaction semantics.", "Dieser Simulator verwendet deterministischen Partitionsersatz für Overwrite und Zeilenbeibehaltung für Append. Reale Idempotenz hängt zusätzlich von stabilen Eingaben und Transaktionssemantik ab.")}
    >
      <div className="bf-parts">
        {parts.map((p) => (
          <div key={p.i} className={`bf-part ${p.status}`} style={p.status === "writing" ? ({ "--fill": `${p.fill}%` } as CSSProperties) : {}}>
            <div className="date">ds={p.date}</div>
            <div className="rows">{p.rows != null ? p.rows.toLocaleString() : "-"}</div>
            <div className="sub">
              {p.status === "pending" && text("queued", "eingeplant")}
              {p.status === "writing" && `${text("writing", "schreibt")} ${Math.round(p.fill)}%`}
              {p.status === "failed" && text("failed · retrying", "fehlgeschlagen · Wiederholung")}
              {p.status === "success" && (p.attempts > 1 ? text("✓ retry OK", "✓ Wiederholung OK") : "✓ OK")}
              {p.status === "doubled" && text("⚠ doubled", "⚠ verdoppelt")}
            </div>
          </div>
        ))}
      </div>

      <div ref={logRef} className="sched-log" style={{ marginTop: 18, maxHeight: 200, overflowY: "auto" }}>
        {log.map((e) => (
          <div key={e._seq}>
            <span className="t">[{e.t}]</span> <span className={e.k}>{e.m}</span>
          </div>
        ))}
      </div>

      <div className="readout-grid">
        <div className={`readout ${allDone ? (anyDoubled ? "danger" : "ok") : "blue"}`}>
          <div className="r-k">{text("Pipeline status", "Pipeline-Status")}</div>
          <div className="r-v" style={{ fontSize: 18, textTransform: "uppercase" }}>
            {allDone ? (anyDoubled ? text("corrupt", "fehlerhaft") : text("clean", "sauber")) : running ? text("running", "läuft") : text("idle", "wartet")}
          </div>
          <div className="r-s">
            {parts.filter((p) => p.status === "success" || p.status === "doubled").length}/{PART_COUNT} {text("committed", "geschrieben")}
          </div>
        </div>
        <div className="readout">
          <div className="r-k">{text("Actual rows", "Tatsächliche Zeilen")}</div>
          <div className="r-v">{totalRows.toLocaleString()}</div>
          <div className="r-s">{text("sum across partitions", "Summe über alle Partitionen")}</div>
        </div>
        <div className={`readout ${drift > 0 ? "danger" : "ok"}`}>
          <div className="r-k">{text("Drift vs expected", "Abweichung vom Soll")}</div>
          <div className="r-v">
            {drift > 0 ? "+" : ""}
            {drift.toLocaleString()}
          </div>
          <div className="r-s">{drift > 0 ? text("duplicate rows", "doppelte Zeilen") : drift < 0 ? text("missing rows", "fehlende Zeilen") : text("matches expected", "entspricht dem Soll")}</div>
        </div>
        <div className="readout blue">
          <div className="r-k">{text("Retries", "Wiederholungen")}</div>
          <div className="r-v">{parts.reduce((a, p) => a + Math.max(0, p.attempts - 1), 0)}</div>
          <div className="r-s">{text("attempts", "Versuche")} &gt; 1</div>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-group" style={{ flex: 1.2 }}>
          <div className="ctl-lab">{text("Write mode", "Schreibmodus")}</div>
          <div className="pill-row">
            <button type="button" className={`pill ${mode === "overwrite" ? "on" : ""}`} onClick={() => setMode("overwrite")}>
              OVERWRITE
              <span className="ps">idempotent</span>
            </button>
            <button type="button" className={`pill ${mode === "insert" ? "on" : ""}`} onClick={() => setMode("insert")}>
              INSERT
              <span className="ps">{text("appends", "hängt an")}</span>
            </button>
          </div>
        </div>
        <div className="ctl-slider" style={{ flex: 1 }}>
          <div className="row">
            <label className="lab" htmlFor="backfill-concurrency">{text("Concurrency", "Parallelität")}</label>
            <span className="val">{concurrency}</span>
          </div>
          <input id="backfill-concurrency" type="range" min={1} max={7} value={concurrency} onChange={(e) => setConcurrency(+e.target.value)} />
          <span className="hint">{text("parallel workers", "parallele Worker")}</span>
        </div>
        <div className="ctl-slider warn" style={{ flex: 1 }}>
          <div className="row">
            <label className="lab" htmlFor="backfill-failure-rate">{text("Failure rate", "Fehlerrate")}</label>
            <span className="val">{failureRate}%</span>
          </div>
          <input id="backfill-failure-rate" type="range" min={0} max={60} step={5} value={failureRate} onChange={(e) => setFailureRate(+e.target.value)} />
          <span className="hint">{text("simulated transient errors", "simulierte vorübergehende Fehler")}</span>
        </div>
        <button type="button" className="btn btn-primary" disabled={running} onClick={runBackfill}>
          {text("▶ Run backfill", "▶ Backfill starten")}
        </button>
        <button type="button" className="btn" disabled={running} onClick={reset}>
          {text("Reset", "Zurücksetzen")}
        </button>
      </div>
    </Panel>
  );
}

export default BackfillSim;
