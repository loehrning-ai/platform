"use client";

import { useEffect, useState } from "react";
import { Panel } from "../primitives";

// ─── Scanner (plan 011 stage 4) ──────────────────────────────────────
// Ported from `src/chapters/Ch0_Fundamentals.js`: row-oriented vs columnar
// disk-scan visualizer, 100 cols × 40 rows, real cells animate as "read".

const COLS = 100;
const ROWS = 40;
const TARGET_COL = 47;
const TABLE_GB = 100;
const COL_GB = TABLE_GB / COLS;

type ScanMode = "row" | "col";

export function Scanner() {
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
      eyebrow="live simulator"
      title="Row vs columnar scanner"
      meta="SELECT SUM(revenue) FROM sales"
      caption="Disk layout: 100 columns × 40 rows. Scan head animates real cells being read. Source of truth is bytes."
    >
      <div className="sc-query">
        <div className="sc-q-ln">
          <span className="tok-k">SELECT</span> <span className="tok-f">SUM</span>(<span className="tok-t">revenue</span>){" "}
          <span className="tok-k">FROM</span> sales;
        </div>
        <div className="sc-q-hint">→ Engine needs one column out of 100.</div>
      </div>

      <div className={`sc-disk ${mode}`}>
        <div className="sc-axis-left">
          <div>col 0</div>
          <div>col 25</div>
          <div>col 50</div>
          <div>col 75</div>
          <div>col 99</div>
        </div>
        <div className="sc-grid-wrap">
          <div className="sc-grid-head">
            <span>DISK · {mode === "row" ? "row-oriented (CSV / OLTP)" : "columnar (Parquet / ORC)"}</span>
            <span>
              target: <code className="sc-col47">col[47] revenue</code>
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
            <div className="sc-prog-lab">scan progress</div>
            <div className="sc-prog-bar">
              <div className="sc-prog-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="sc-prog-val">{Math.round(progress * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="sc-stats">
        <div className={`sc-stat ${mode === "row" ? "warn" : "good"}`}>
          <div className="sc-stat-k">bytes scanned</div>
          <div className="sc-stat-v">
            {bytesScanned.toFixed(2)}
            <span className="u"> GB</span>
          </div>
          <div className="sc-stat-s">of {bytesTotal} GB on disk</div>
        </div>
        <div className="sc-stat">
          <div className="sc-stat-k">columns read</div>
          <div className="sc-stat-v">
            {reads.colsRead}
            <span className="u"> / 100</span>
          </div>
          <div className="sc-stat-s">{mode === "row" ? "row layout forces full scan" : "projection pushdown"}</div>
        </div>
        <div className={`sc-stat ${mode === "col" ? "good" : ""}`}>
          <div className="sc-stat-k">efficiency</div>
          <div className="sc-stat-v">{mode === "row" ? "1×" : `${Math.round(1 / ((snappy ? 0.28 : 1) / COLS))}×`}</div>
          <div className="sc-stat-s">
            {mode === "row" ? "baseline" : `${Math.round((1 - (snappy ? 0.28 : 1) / COLS) * 100)}% of disk skipped`}
          </div>
        </div>
        <div className="sc-stat">
          <div className="sc-stat-k">scan time</div>
          <div className="sc-stat-v">
            {scanTime.toFixed(2)}
            <span className="u"> s</span>
          </div>
          <div className="sc-stat-s">at 1 GB/s</div>
        </div>
      </div>

      <div className="sc-ctrls">
        <div className="sc-tabs">
          <button className={`sc-tab ${mode === "row" ? "on" : ""}`} onClick={() => setMode("row")}>
            Row-oriented
            <span className="sc-tab-sub">CSV · JSON · Postgres</span>
          </button>
          <button className={`sc-tab ${mode === "col" ? "on" : ""}`} onClick={() => setMode("col")}>
            Columnar
            <span className="sc-tab-sub">Parquet · ORC</span>
          </button>
        </div>
        <label className={`sc-check ${mode !== "col" ? "dis" : ""}`}>
          <input type="checkbox" disabled={mode !== "col"} checked={snappy && mode === "col"} onChange={(e) => setSnappy(e.target.checked)} />
          <span className="sc-check-lab">Snappy compression</span>
          <span className="sc-check-sub">shrinks column stripe ~3.5×</span>
        </label>
        <div className="sc-actions">
          <button className="btn" onClick={reset} disabled={running}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={run} disabled={running}>
            ▶ Run scan
          </button>
        </div>
      </div>
    </Panel>
  );
}

export default Scanner;
