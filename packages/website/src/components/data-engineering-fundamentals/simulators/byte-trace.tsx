"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── ByteTrace ────────────────────────────────────
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

const BT_STOPS_DE: readonly Stop[] = [
  { k: "sql", n: "SQL trifft ein", d: "SELECT user_email …", warm: 40, cold: 40 },
  { k: "plan", n: "Planer löst auf", d: "column_id=7 im Parquet-Schema", warm: 120, cold: 120 },
  { k: "meta", n: "Metastore-Abfrage", d: "Partitionsliste für ds='2024-01-15'", warm: 800, cold: 80000 },
  { k: "foot", n: "Parquet-Footer öffnen", d: "Stripe-Metadaten · Min/Max-Index", warm: 260, cold: 2600 },
  { k: "skip", n: "Predicate Pushdown", d: "Stripe-Min/Max enthält keinen Treffer → überspringen", warm: 40, cold: 40 },
  { k: "blob", n: "S3-Abruf", d: "Blob für den passenden Stripe", warm: 1800, cold: 180000 },
  { k: "flash", n: "SSD-Schicht lesen", d: "Flash-Schicht · replizierte Bytes", warm: 420, cold: 4200 },
  { k: "ret", n: "Dekomprimieren → zurückgeben", d: "Bytes → Worker → Koordinator → Nutzer", warm: 180, cold: 900 },
];

function formatLat(us: number): string {
  if (us < 1e3) return `${Math.round(us)} μs`;
  if (us < 1e6) return `${(us / 1e3).toFixed(us < 1e4 ? 1 : 0)} ms`;
  return `${(us / 1e6).toFixed(2)} s`;
}

type CacheMode = "warm" | "cold";

export function ByteTrace() {
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const stops = locale === "de" ? BT_STOPS_DE : BT_STOPS;
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
      setPos(p * stops.length);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [token, cache, stops]);

  const curIdx = Math.min(stops.length - 1, Math.floor(pos));
  const cum = useMemo(() => {
    let total = 0;
    return stops.map((s) => {
      total += s[cache];
      return total;
    });
  }, [cache, stops]);
  const cumNow = pos === 0 ? 0 : cum[curIdx];
  const totalAll = cum[cum.length - 1];
  const totalWarm = useMemo(() => stops.reduce((a, s) => a + s.warm, 0), [stops]);
  const totalCold = useMemo(() => stops.reduce((a, s) => a + s.cold, 0), [stops]);
  const speedupX = Math.round(totalCold / totalWarm);

  return (
    <Panel
      eyebrow={text("live · trace", "live · Ablauf")}
      title={text("A byte's journey", "Der Weg eines Bytes")}
      meta={`dim_users.user_email · ${text("warm vs cold cache", "warmer und kalter Cache")}`}
      caption={text("Illustrative latency model for two cache states; values are not vendor benchmarks.", "Beispielhaftes Latenzmodell für zwei Cache-Zustände; die Werte sind keine Anbieter-Benchmarks.")}
    >
      <div className="bt-headline">
        <div className={`bt-headline-cell ${cache === "warm" ? "is-active" : ""}`}>
          <div className="lab">{text("Warm cache", "Warmer Cache")}</div>
          <div className="big">{formatLat(totalWarm)}</div>
          <div className="sub">{text("metastore + blobs hot", "Metastore und Blobs im Cache")}</div>
        </div>
        <div className="bt-headline-vs">vs</div>
        <div className={`bt-headline-cell is-cold ${cache === "cold" ? "is-active" : ""}`}>
          <div className="lab">{text("Cold cache", "Kalter Cache")}</div>
          <div className="big">{formatLat(totalCold)}</div>
          <div className="sub">{text("cold start · S3 round-trips", "Kaltstart · S3-Roundtrips")}</div>
        </div>
        <div className="bt-headline-speedup">
          <div className="big">{speedupX}×</div>
          <div className="lab">{text("modeled ratio", "modelliertes Verhältnis")}</div>
        </div>
      </div>

      <div
        className="bt-rail-wrap"
        role="region"
        aria-label={text("Byte journey timeline", "Zeitleiste des Byte-Ablaufs")}
        tabIndex={0}
        data-course-horizontal-scroll
      >
        <div className="bt-rail">
          {stops.map((s, i) => {
            const done = i < curIdx;
            const active = i === curIdx && pos > 0;
            const stripActive = s.k === "skip" && pos > 4.5;
            return (
              <div key={s.k} className={`bt-stop ${done ? "done" : ""} ${active ? "on" : ""} ${s.k === "skip" ? "skip" : ""}`}>
                <div className="bt-stop-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="bt-stop-node">
                  {s.k === "skip" && (
                    <div className={`bt-strip-skip ${stripActive ? "is-active" : ""}`}>
                      {text("stripe", "Stripe")} 1 · {text("stripe", "Stripe")} 2 · <s>{text("stripe", "Stripe")} 3</s> · {text("stripe", "Stripe")} 4
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
            <div className="bt-particle" style={{ left: `calc(${(Math.min(pos, stops.length) / stops.length) * 100}% - 6px)` }} />
          )}
          <div className="bt-track" style={{ width: `${(Math.min(pos, stops.length) / stops.length) * 100}%` }} />
        </div>
      </div>
      <div className="course-scroll-hint" aria-hidden="true">{text("Scroll horizontally →", "Horizontal scrollen →")}</div>

      <div className="bt-readouts">
        <div className="bt-ro">
          <div className="bt-ro-k">{text("elapsed", "verstrichen")}</div>
          <div className="bt-ro-v">{formatLat(cumNow)}</div>
          <div className="bt-ro-s">{text("of", "von")} {formatLat(totalAll)} {text("total", "gesamt")}</div>
        </div>
        <div className={`bt-ro ${cache === "cold" ? "warn" : ""}`}>
          <div className="bt-ro-k">Cache</div>
          <div className="bt-ro-v">{cache === "warm" ? text("warm", "warm") : text("cold", "kalt")}</div>
          <div className="bt-ro-s">{cache === "warm" ? text("cached lookup inputs", "Lookup-Eingaben im Cache") : text("higher modeled lookup cost", "höhere modellierte Lookup-Kosten")}</div>
        </div>
        <div className="bt-ro good">
          <div className="bt-ro-k">{text("skipped stripes", "übersprungene Stripes")}</div>
          <div className="bt-ro-v">{pos > 4 ? text("1 of 4", "1 von 4") : "-"}</div>
          <div className="bt-ro-s">{text("predicate pushdown kicks in at step 05", "Predicate Pushdown greift in Schritt 05")}</div>
        </div>
      </div>

      <div className="bt-ctrls">
        <div className="sc-tabs">
          <button type="button" className={`sc-tab ${cache === "warm" ? "on" : ""}`} onClick={() => setCache("warm")}>
            {text("Warm cache", "Warmer Cache")}
            <span className="sc-tab-sub">{text("metastore + blobs hot", "Metastore und Blobs im Cache")}</span>
          </button>
          <button type="button" className={`sc-tab ${cache === "cold" ? "on" : ""}`} onClick={() => setCache("cold")}>
            {text("Cold cache", "Kalter Cache")}
            <span className="sc-tab-sub">{text("higher modeled lookup cost", "höhere modellierte Lookup-Kosten")}</span>
          </button>
        </div>
        <div className="sc-actions">
          <button type="button" className="btn btn-primary" onClick={run} disabled={running}>
            {text("▶ Trace byte", "▶ Byte verfolgen")}
          </button>
        </div>
      </div>
    </Panel>
  );
}

export default ByteTrace;
