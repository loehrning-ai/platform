"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "../primitives";

// ─── ByteTrace (plan 011 stage 4) ────────────────────────────────────
// Ported from `src/chapters/Ch0_StackSims.js`: traces `dim_users.user_email`
// through 8 stops from SQL parse to physical bytes, warm vs cold cache.

interface Stop {
  readonly k: string;
  readonly n: string;
  readonly d: string;
  readonly warm: number;
  readonly cold: number;
}

const BT_STOPS: readonly Stop[] = [
  { k: "sql", n: "SQL enters", d: "SELECT user_email …", warm: 40, cold: 40 },
  { k: "plan", n: "Planner resolves", d: "column_id=7 in Parquet schema", warm: 120, cold: 120 },
  { k: "meta", n: "Metastore lookup", d: "partition list for ds='2024-01-15'", warm: 800, cold: 80000 },
  { k: "foot", n: "Open Parquet footer", d: "stripe metadata · min/max index", warm: 260, cold: 2600 },
  { k: "skip", n: "Predicate pushdown", d: "stripe min/max says no match → skip", warm: 40, cold: 40 },
  { k: "blob", n: "S3 fetch", d: "blob for matching stripe", warm: 1800, cold: 180000 },
  { k: "flash", n: "SSD tier read", d: "flash tier · replicated bytes", warm: 420, cold: 4200 },
  { k: "ret", n: "Decompress → return", d: "bytes → worker → coordinator → user", warm: 180, cold: 900 },
];

function formatLat(us: number): string {
  if (us < 1e3) return `${Math.round(us)} μs`;
  if (us < 1e6) return `${(us / 1e3).toFixed(us < 1e4 ? 1 : 0)} ms`;
  return `${(us / 1e6).toFixed(2)} s`;
}

type CacheMode = "warm" | "cold";

export function ByteTrace() {
  const [cache, setCache] = useState<CacheMode>("warm");
  const [token, setToken] = useState(0);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState(0);
  const rafRef = useRef<number | null>(null);

  const run = () => {
    setPos(0);
    setToken((n) => n + 1);
  };

  useEffect(() => {
    if (token === 0) return;
    setRunning(true);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const totalMs = cache === "warm" ? 3400 : 5800;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / totalMs);
      setPos(p * BT_STOPS.length);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [token, cache]);

  const curIdx = Math.min(BT_STOPS.length - 1, Math.floor(pos));
  const cum = useMemo(() => {
    let total = 0;
    return BT_STOPS.map((s) => {
      total += s[cache];
      return total;
    });
  }, [cache]);
  const cumNow = pos === 0 ? 0 : cum[curIdx];
  const totalAll = cum[cum.length - 1];
  const totalWarm = useMemo(() => BT_STOPS.reduce((a, s) => a + s.warm, 0), []);
  const totalCold = useMemo(() => BT_STOPS.reduce((a, s) => a + s.cold, 0), []);
  const speedupX = Math.round(totalCold / totalWarm);

  return (
    <Panel
      eyebrow="live · trace"
      title="A byte's journey"
      meta="dim_users.user_email · warm vs cold cache"
      caption="Each stop has its own latency budget. Cold Metastore and S3 dominate: that's why caching matters."
    >
      <div className="bt-headline">
        <div className={`bt-headline-cell ${cache === "warm" ? "is-active" : ""}`}>
          <div className="lab">Warm cache</div>
          <div className="big">{formatLat(totalWarm)}</div>
          <div className="sub">metastore + blobs hot</div>
        </div>
        <div className="bt-headline-vs">vs</div>
        <div className={`bt-headline-cell is-cold ${cache === "cold" ? "is-active" : ""}`}>
          <div className="lab">Cold cache</div>
          <div className="big">{formatLat(totalCold)}</div>
          <div className="sub">cold start · S3 round-trips</div>
        </div>
        <div className="bt-headline-speedup">
          <div className="big">{speedupX}×</div>
          <div className="lab">faster when warm</div>
        </div>
      </div>

      <div className="bt-rail-wrap">
        <div className="bt-rail">
          {BT_STOPS.map((s, i) => {
            const done = i < curIdx;
            const active = i === curIdx && pos > 0;
            const stripActive = s.k === "skip" && pos > 4.5;
            return (
              <div key={s.k} className={`bt-stop ${done ? "done" : ""} ${active ? "on" : ""} ${s.k === "skip" ? "skip" : ""}`}>
                <div className="bt-stop-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="bt-stop-node">
                  {s.k === "skip" && (
                    <div className={`bt-strip-skip ${stripActive ? "is-active" : ""}`}>
                      stripe 1 · stripe 2 · <s>stripe 3</s> · stripe 4
                    </div>
                  )}
                </div>
                <div className="bt-stop-name">{s.n}</div>
                <div className="bt-stop-d">{s.d}</div>
                <div className="bt-stop-lat">{s[cache] >= 1000 ? `${(s[cache] / 1000).toFixed(1)} ms` : `${s[cache]} μs`}</div>
              </div>
            );
          })}
          {pos > 0 && (
            <div className="bt-particle" style={{ left: `calc(${(Math.min(pos, BT_STOPS.length) / BT_STOPS.length) * 100}% - 6px)` }} />
          )}
          <div className="bt-track" style={{ width: `${(Math.min(pos, BT_STOPS.length) / BT_STOPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="bt-readouts">
        <div className="bt-ro">
          <div className="bt-ro-k">elapsed</div>
          <div className="bt-ro-v">{formatLat(cumNow)}</div>
          <div className="bt-ro-s">of {formatLat(totalAll)} total</div>
        </div>
        <div className={`bt-ro ${cache === "cold" ? "warn" : ""}`}>
          <div className="bt-ro-k">cache</div>
          <div className="bt-ro-v">{cache === "warm" ? "warm" : "cold"}</div>
          <div className="bt-ro-s">{cache === "warm" ? "metastore + blobs cached" : "~100× on metastore + s3"}</div>
        </div>
        <div className="bt-ro good">
          <div className="bt-ro-k">skipped stripes</div>
          <div className="bt-ro-v">{pos > 4 ? "1 of 4" : "-"}</div>
          <div className="bt-ro-s">predicate pushdown kicks in at step 05</div>
        </div>
      </div>

      <div className="bt-ctrls">
        <div className="sc-tabs">
          <button className={`sc-tab ${cache === "warm" ? "on" : ""}`} onClick={() => setCache("warm")}>
            Warm cache
            <span className="sc-tab-sub">metastore + blobs hot</span>
          </button>
          <button className={`sc-tab ${cache === "cold" ? "on" : ""}`} onClick={() => setCache("cold")}>
            Cold cache
            <span className="sc-tab-sub">~100× slower lookups</span>
          </button>
        </div>
        <div className="sc-actions">
          <button className="btn btn-primary" onClick={run} disabled={running}>
            ▶ Trace byte
          </button>
        </div>
      </div>
    </Panel>
  );
}

export default ByteTrace;
