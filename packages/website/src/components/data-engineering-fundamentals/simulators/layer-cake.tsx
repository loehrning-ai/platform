"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";

// ─── LayerCake ────────────────────────────────────
// Ported from `src/chapters/Ch0_StackSims.js`. Seven-layer warehouse stack:
// hover reveals detail, "Trace a query" animates a pulse down then up the
// stack, "Failure mode" lets the learner mark a layer down and see the
// blast radius on every layer above it.

interface Layer {
  readonly n: number;
  readonly key: string;
  readonly name: string;
  readonly sub: string;
  readonly api: string;
  readonly hue: string;
  readonly fail: string;
}

const LAYERS: readonly Layer[] = [
  { n: 7, key: "app", name: "Application", sub: "Hex · Mode · dashboards · notebooks · BI tools", api: "Natural language · SQL · REST", hue: "L7", fail: "User-facing surface dark. No new queries can enter the system." },
  { n: 6, key: "engine", name: "Query engine", sub: "Trino (interactive) · Spark (warehouse ETL) · Snowflake", api: "SQL → distributed plan", hue: "L6", fail: "Queries queue indefinitely. Planner never turns SQL into work." },
  { n: 5, key: "catalog", name: "Catalog / Metastore", sub: "Glue Catalog · schema + physical location of every table", api: "Thrift: getPartitions · getTableSchema", hue: "L5", fail: "Planning fails before any read happens: engine has no partition list to open." },
  { n: 4, key: "table", name: "Table abstraction", sub: "Namespaces → Tables → Partitions → Rows · ds-partitioned", api: "SELECT … WHERE ds = '2024-01-15'", hue: "L4", fail: "Partition resolution unreliable. Engine may scan too many or miss data." },
  { n: 3, key: "format", name: "File format", sub: "Parquet (ORC fork) · Parquet · Avro · TEXTFILE", api: "Read/write by stripe · predicate pushdown", hue: "L3", fail: "Footer corruption. Stripe skipping unavailable; full-file scans only." },
  { n: 2, key: "blob", name: "Blob layer", sub: "S3 · blob API · manages physical placement", api: "put(blob) · get(blob_id)", hue: "L2", fail: "Reads slow, retries kick in, timeouts cascade up to engine." },
  { n: 1, key: "physical", name: "Physical storage", sub: "SSD tier · flash tier · replicated", api: "Raw bytes", hue: "L1", fail: "Bytes unreachable. Everything above queues on I/O or errors out." },
];

interface Pulse {
  readonly idx: number;
  readonly dir: "down" | "up";
}

export function LayerCake() {
  const [hover, setHover] = useState<string | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [failMode, setFailMode] = useState(false);
  const [faulty, setFaulty] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const trace = () => {
    if (pulse) return;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const duration = 3600;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      let idx: number;
      let dir: "down" | "up";
      if (p < 0.5) {
        idx = Math.floor(p * 2 * LAYERS.length);
        dir = "down";
      } else {
        idx = LAYERS.length - 1 - Math.floor((p - 0.5) * 2 * LAYERS.length);
        dir = "up";
      }
      idx = Math.max(0, Math.min(LAYERS.length - 1, idx));
      setPulse({ idx, dir });
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setPulse(null);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const faultyIdx = faulty ? LAYERS.findIndex((l) => l.key === faulty) : -1;
  const affected = (i: number) => failMode && faultyIdx >= 0 && i <= faultyIdx;
  const hoveredLayer = hover ? LAYERS.find((l) => l.key === hover) : undefined;

  return (
    <Panel
      eyebrow="live · interactive"
      title="The 7-layer stack"
      meta="hover a layer · click trace · toggle failure mode"
      caption="Every warehouse query touches all seven. Knowing the layer means knowing the failure mode."
    >
      <div className="lc-wrap">
        <div className="lc-stack">
          {LAYERS.map((L, i) => {
            const isHover = hover === L.key;
            const pulsing = pulse?.idx === i;
            const broken = failMode && faulty === L.key;
            const impact = affected(i) && !broken;
            return (
              <div
                key={L.key}
                className={`lc-slab lc-${L.hue} ${isHover ? "on" : ""} ${pulsing ? "pulse " + pulse!.dir : ""} ${broken ? "broken" : ""} ${impact ? "impact" : ""} ${failMode ? "fm" : ""}`}
                onMouseEnter={() => setHover(L.key)}
                onMouseLeave={() => setHover(null)}
                onClick={() => failMode && setFaulty((f) => (f === L.key ? null : L.key))}
                style={{ zIndex: isHover ? 40 : 10 + (LAYERS.length - i) }}
              >
                <div className="lc-slab-num">L{L.n}</div>
                <div className="lc-slab-name">{L.name}</div>
                <div className="lc-slab-sub">{L.sub}</div>
                <div className="lc-slab-api">{L.api}</div>
                {pulsing && <div className="lc-pulse-dot" />}
                {broken && <div className="lc-x">✕</div>}
              </div>
            );
          })}
        </div>
        <aside className="lc-detail">
          {hoveredLayer ? (
            <div className="lc-detail-card">
              <div className="lc-dc-eyebrow">Layer {hoveredLayer.n}</div>
              <div className="lc-dc-title">{hoveredLayer.name}</div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">Stores</span>
                <span className="lc-dc-v">{hoveredLayer.sub}</span>
              </div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">API</span>
                <span className="lc-dc-v">{hoveredLayer.api}</span>
              </div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">Above</span>
                <span className="lc-dc-v">
                  {(() => {
                    const above = LAYERS.find((l) => l.n === hoveredLayer.n + 1);
                    return above ? `L${above.n} ${above.name}` : "- (top of stack)";
                  })()}
                </span>
              </div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">Below</span>
                <span className="lc-dc-v">
                  {(() => {
                    const below = LAYERS.find((l) => l.n === hoveredLayer.n - 1);
                    return below ? `L${below.n} ${below.name}` : "- (bare metal)";
                  })()}
                </span>
              </div>
              {failMode && (
                <div className="lc-dc-fail">
                  <div className="lc-dc-fail-lab">If this layer is down</div>
                  <div className="lc-dc-fail-v">{hoveredLayer.fail}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="lc-detail-empty">
              <div className="lc-de-dot" />
              <div className="lc-de-lab">Hover any layer</div>
              <div className="lc-de-sub">See what it stores, the API it exposes, and what sits above &amp; below.</div>
            </div>
          )}
        </aside>
      </div>
      <div className="lc-ctrls">
        <button className="btn btn-primary" onClick={trace} disabled={!!pulse}>
          {pulse ? (pulse.dir === "down" ? "▾ descending…" : "▴ returning result…") : "▶ Trace a query"}
        </button>
        <label className="lc-fm">
          <input
            type="checkbox"
            checked={failMode}
            onChange={(e) => {
              setFailMode(e.target.checked);
              if (!e.target.checked) setFaulty(null);
            }}
          />
          <span>Failure mode</span>
          <span className="lc-fm-sub">{failMode ? "click any layer to mark it down" : "see what breaks when a layer fails"}</span>
        </label>
      </div>
    </Panel>
  );
}

export default LayerCake;
