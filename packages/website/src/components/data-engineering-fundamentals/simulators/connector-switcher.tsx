"use client";

import { useState } from "react";
import { Panel } from "../primitives";

// ─── ConnectorSwitcher ────────────────────────────
// Ported from `src/chapters/Ch0_StackSims.js`: same SQL statement, three
// physically different connector runtimes.

interface Connector {
  readonly id: string;
  readonly name: string;
  readonly sub: string;
  readonly latency: string;
  readonly color: string;
  readonly stats: Readonly<Record<string, string>>;
  readonly workers: "fan-out" | "local-ssd" | "coordinator";
  readonly note: string;
}

const CONNECTORS: readonly Connector[] = [
  {
    id: "snowflake",
    name: "Snowflake",
    sub: "columnar files in a blob store",
    latency: "seconds",
    color: "c1",
    stats: { "files scanned": "47", "bytes read": "2.1 GB", "predicate pushdown": "stripe stats" },
    workers: "fan-out",
    note: "Workers fan out to read Parquet files from S3. Predicate pushdown via stripe stats. The big-data default.",
  },
  {
    id: "redis_cache",
    name: "Redis-backed cache",
    sub: "local shards on Trino workers",
    latency: "milliseconds",
    color: "c2",
    stats: { "shards read": "12", "bytes read": "180 MB", "predicate pushdown": "row-group stats" },
    workers: "local-ssd",
    note: "Data lives on the Trino worker nodes themselves. Reads are local SSD: no network, no blob layer.",
  },
  {
    id: "system",
    name: "System tables",
    sub: "in-memory engine metadata",
    latency: "microseconds",
    color: "c3",
    stats: { rows: "8", bytes: "1 KB", "predicate pushdown": "N/A (in-memory)" },
    workers: "coordinator",
    note: "Metadata only. No disk. The coordinator answers directly from its own memory.",
  },
];

export function ConnectorSwitcher() {
  const [cid, setCid] = useState("snowflake");
  const C = CONNECTORS.find((c) => c.id === cid)!;

  return (
    <Panel
      eyebrow="live · pluggable"
      title="Same SQL. Different physics."
      meta={`connector: ${C.name}`}
      caption="Trino's pluggable connector interface: the shape of the query is identical, the runtime is not."
    >
      <div className="cs-wrap">
        <div className="cs-sql">
          <div className="cs-sql-q">
            <span className="tok-k">SELECT</span> <span className="tok-f">count</span>(*) <span className="tok-k">FROM</span> x{" "}
            <span className="tok-k">WHERE</span> region = <span className="tok-s">&apos;EU&apos;</span>;
          </div>
        </div>
        <div className="cs-tabs">
          {CONNECTORS.map((c) => (
            <button type="button" key={c.id} className={`cs-tab cs-${c.color} ${cid === c.id ? "on" : ""}`} onClick={() => setCid(c.id)}>
              <span className="cs-tab-name">{c.name}</span>
              <span className="cs-tab-sub">{c.sub}</span>
              <span className="cs-tab-lat">{c.latency}</span>
            </button>
          ))}
        </div>
        <div className={`cs-panel cs-${C.color}`}>
          <div className="cs-diag">
            <div className="cs-diag-head">runtime physics</div>
            {C.workers === "fan-out" && (
              <div className="cs-diag-grid cs-fanout">
                <div className="cs-node coord">coord</div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cs-node worker">
                    w{i}
                  </div>
                ))}
                <div className="cs-blob">S3 · Parquet</div>
              </div>
            )}
            {C.workers === "local-ssd" && (
              <div className="cs-diag-grid cs-local">
                <div className="cs-node coord">coord</div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="cs-node worker local">
                    <div className="cs-node-lab">w{i}</div>
                    <div className="cs-node-ssd">▾ SSD</div>
                  </div>
                ))}
              </div>
            )}
            {C.workers === "coordinator" && (
              <div className="cs-diag-grid cs-memo">
                <div className="cs-node coord big">
                  <div className="cs-node-lab">coordinator</div>
                  <div className="cs-node-mem">◆ in-memory metadata</div>
                </div>
              </div>
            )}
          </div>
          <div className="cs-stats">
            {Object.entries(C.stats).map(([k, v]) => (
              <div key={k} className="cs-stat">
                <div className="cs-stat-k">{k}</div>
                <div className="cs-stat-v">{v}</div>
              </div>
            ))}
          </div>
          <div className="cs-note">{C.note}</div>
        </div>
      </div>
    </Panel>
  );
}

export default ConnectorSwitcher;
