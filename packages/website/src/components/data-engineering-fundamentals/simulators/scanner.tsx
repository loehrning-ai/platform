"use client";

import { useEffect, useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── Scanner ──────────────────────────────────────
// Ported from `src/chapters/Ch0_Fundamentals.js`: row-oriented vs columnar
// disk-scan visualizer, 100 cols × 40 rows, real cells animate as "read".

const COLS = 100;
const ROWS = 40;
const TARGET_COL = 47;
const TABLE_GB = 100;
const COL_GB = TABLE_GB / COLS;

type ScanMode = "row" | "col";

export function Scanner() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const [mode, setMode] = useState<ScanMode>("row");
  const [snappy, setSnappy] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reads, setReads] = useState({ bytes: 0, cells: 0, colsRead: 0 });
  const [grid, setGrid] = useState<number[]>(() => Array(ROWS * COLS).fill(0));

  const reset = () => {
    setRunning(false);
    setProgress(0);
    setReads({ bytes: 0, cells: 0, colsRead: 0 });
    setGrid(Array(ROWS * COLS).fill(0));
  };

  useEffect(() => {
    reset();
  }, [mode]);

  useEffect(() => {
    if (runToken === 0) return;
    let cancelled = false;
    let raf: number;
    const start = performance.now();
    const duration = 2800;
    setRunning(true);
    const tick = (t: number) => {
      if (cancelled) return;
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      if (mode === "row") {
        const totalCells = ROWS * COLS;
        const cellsRead = Math.floor(p * totalCells);
        const ng = new Array<number>(totalCells);
        for (let i = 0; i < totalCells; i++) {
          if (i < cellsRead) ng[i] = 2;
          else if (i < cellsRead + COLS) ng[i] = 1;
          else ng[i] = 0;
        }
        setGrid(ng);
        setReads({ bytes: p * TABLE_GB, cells: cellsRead, colsRead: COLS });
      } else {
        const stripeCells = ROWS;
        const cellsRead = Math.floor(p * stripeCells);
        const ng = new Array<number>(ROWS * COLS).fill(0);
        for (let r = 0; r < stripeCells; r++) {
          const idx = r * COLS + TARGET_COL;
          if (r < cellsRead) ng[idx] = 2;
          else if (r === cellsRead) ng[idx] = 1;
        }
        setGrid(ng);
        const compressMul = snappy ? 0.28 : 1;
        setReads({ bytes: p * COL_GB * compressMul, cells: cellsRead, colsRead: 1 });
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [runToken, mode, snappy]);

  const run = () => {
    reset();
    setRunToken((n) => n + 1);
  };

  const bytesScanned = reads.bytes;
  const bytesTotal = TABLE_GB;
  const scanTime = mode === "row" ? 100 : snappy ? 0.28 : 1;

  return (
    <Panel
      eyebrow={text("live simulator", "Live-Simulator")}
      title={text("Row vs columnar scanner", "Zeilen- und Spaltenscan im Vergleich")}
      meta="SELECT SUM(revenue) FROM sales"
      caption={text("Normalized teaching model: 100 columns, 40 visual rows, and illustrative size and throughput assumptions.", "Normiertes Lernmodell: 100 Spalten, 40 sichtbare Zeilen sowie beispielhafte Größen- und Durchsatzannahmen.")}
    >
      <div className="sc-query">
        <div className="sc-q-ln">
          <span className="tok-k">SELECT</span> <span className="tok-f">SUM</span>(<span className="tok-t">revenue</span>){" "}
          <span className="tok-k">FROM</span> sales;
        </div>
        <div className="sc-q-hint">{text("→ Engine needs one column out of 100.", "→ Die Engine benötigt eine von 100 Spalten.")}</div>
      </div>

      <div className={`sc-disk ${mode}`}>
        <div className="sc-axis-left">
          <div>{text("col", "Spalte")} 0</div>
          <div>{text("col", "Spalte")} 25</div>
          <div>{text("col", "Spalte")} 50</div>
          <div>{text("col", "Spalte")} 75</div>
          <div>{text("col", "Spalte")} 99</div>
        </div>
        <div className="sc-grid-wrap">
          <div className="sc-grid-head">
            <span>{text("DISK", "FESTPLATTE")} · {mode === "row" ? text("row-oriented (CSV / OLTP)", "zeilenorientiert (CSV / OLTP)") : text("columnar (Parquet / ORC)", "spaltenorientiert (Parquet / ORC)")}</span>
            <span>
              {text("target", "Ziel")}: <code className="sc-col47">col[47] revenue</code>
            </span>
          </div>
          <div
            className="sc-grid"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            }}
          >
            {grid.map((v, i) => {
              const col = i % COLS;
              const isTarget = col === TARGET_COL;
              const cls = [
                "sc-c",
                v === 1 ? "head" : v === 2 ? "read" : "",
                isTarget ? "target" : "",
                mode === "col" && !isTarget ? "dark" : "",
                mode === "col" && isTarget && snappy && v === 2 ? "snappy" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return <span key={i} className={cls} />;
            })}
          </div>
          <div className="sc-prog">
            <div className="sc-prog-lab">{text("scan progress", "Scan-Fortschritt")}</div>
            <div className="sc-prog-bar">
              <div className="sc-prog-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="sc-prog-val">{Math.round(progress * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="sc-stats">
        <div className={`sc-stat ${mode === "row" ? "warn" : "good"}`}>
          <div className="sc-stat-k">{text("bytes scanned", "gelesene Bytes")}</div>
          <div className="sc-stat-v">
            {bytesScanned.toFixed(2)}
            <span className="u"> GB</span>
          </div>
          <div className="sc-stat-s">{text("of", "von")} {bytesTotal} GB {text("on disk", "auf der Festplatte")}</div>
        </div>
        <div className="sc-stat">
          <div className="sc-stat-k">{text("columns read", "gelesene Spalten")}</div>
          <div className="sc-stat-v">
            {reads.colsRead}
            <span className="u"> / 100</span>
          </div>
          <div className="sc-stat-s">{mode === "row" ? text("row layout forces full scan", "Zeilenlayout erzwingt vollständigen Scan") : "Projection Pushdown"}</div>
        </div>
        <div className={`sc-stat ${mode === "col" ? "good" : ""}`}>
          <div className="sc-stat-k">{text("bytes-read ratio (model)", "Verhältnis gelesener Bytes (Modell)")}</div>
          <div className="sc-stat-v">{mode === "row" ? "1×" : `${Math.round(1 / ((snappy ? 0.28 : 1) / COLS))}×`}</div>
          <div className="sc-stat-s">
            {mode === "row" ? text("baseline", "Referenz") : `${Math.round((1 - (snappy ? 0.28 : 1) / COLS) * 100)}% ${text("of disk skipped", "der Festplatte übersprungen")}`}
          </div>
        </div>
        <div className="sc-stat">
          <div className="sc-stat-k">{text("modeled scan time", "modellierte Scan-Dauer")}</div>
          <div className="sc-stat-v">
            {scanTime.toFixed(2)}
            <span className="u"> s</span>
          </div>
          <div className="sc-stat-s">{text("scenario assumption", "Szenarioannahme")}: 1 GB/s</div>
        </div>
      </div>

      <div className="sc-ctrls">
        <div className="sc-tabs">
          <button type="button" className={`sc-tab ${mode === "row" ? "on" : ""}`} onClick={() => setMode("row")}>
            {text("Row-oriented", "Zeilenorientiert")}
            <span className="sc-tab-sub">CSV · JSON · Postgres</span>
          </button>
          <button type="button" className={`sc-tab ${mode === "col" ? "on" : ""}`} onClick={() => setMode("col")}>
            {text("Columnar", "Spaltenorientiert")}
            <span className="sc-tab-sub">Parquet · ORC</span>
          </button>
        </div>
        <label className={`sc-check ${mode !== "col" ? "dis" : ""}`}>
          <input type="checkbox" disabled={mode !== "col"} checked={snappy && mode === "col"} onChange={(e) => setSnappy(e.target.checked)} />
          <span className="sc-check-lab">{text("Snappy compression", "Snappy-Komprimierung")}</span>
          <span className="sc-check-sub">{text("model assumes 0.28× encoded size", "Modell nimmt 0,28× codierte Größe an")}</span>
        </label>
        <div className="sc-actions">
          <button type="button" className="btn" onClick={reset} disabled={running}>
            {text("Reset", "Zurücksetzen")}
          </button>
          <button type="button" className="btn btn-primary" onClick={run} disabled={running}>
            {text("▶ Run scan", "▶ Scan starten")}
          </button>
        </div>
      </div>
    </Panel>
  );
}

export default Scanner;
