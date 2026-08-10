"use client";

import { useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

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
    name: "Object-store scenario",
    sub: "columnar files in a blob store",
    latency: "modeled seconds",
    color: "c1",
    stats: { "files scanned": "47", "bytes read": "2.1 GB", "predicate pushdown": "row-group stats" },
    workers: "fan-out",
    note: "The model fans workers out over Parquet files in object storage and uses row-group statistics where supported.",
  },
  {
    id: "redis_cache",
    name: "Redis-backed cache",
    sub: "local shards on Trino workers",
    latency: "modeled milliseconds",
    color: "c2",
    stats: { "shards read": "12", "bytes read": "180 MB", "predicate pushdown": "row-group stats" },
    workers: "local-ssd",
    note: "The model places shards on worker-local SSD and omits an object-store fetch. A real deployment can still use networked coordination or replication.",
  },
  {
    id: "system",
    name: "System tables",
    sub: "in-memory engine metadata",
    latency: "modeled microseconds",
    color: "c3",
    stats: { rows: "8", bytes: "1 KB", "predicate pushdown": "N/A (in-memory)" },
    workers: "coordinator",
    note: "The model returns coordinator metadata from memory. Actual system-table work depends on the connector and requested metadata.",
  },
];

const CONNECTORS_DE: readonly Connector[] = [
  {
    id: "snowflake",
    name: "Object-Store-Szenario",
    sub: "spaltenorientierte Dateien in einem Blob-Speicher",
    latency: "modellierte Sekunden",
    color: "c1",
    stats: { "gelesene Dateien": "47", "gelesene Bytes": "2.1 GB", "Predicate Pushdown": "Row-Group-Statistiken" },
    workers: "fan-out",
    note: "Das Modell verteilt Parquet-Dateien im Object Store auf Worker und nutzt Row-Group-Statistiken, sofern unterstützt.",
  },
  {
    id: "redis_cache",
    name: "Redis-gestützter Cache",
    sub: "lokale Shards auf Trino-Workern",
    latency: "modellierte Millisekunden",
    color: "c2",
    stats: { "gelesene Shards": "12", "gelesene Bytes": "180 MB", "Predicate Pushdown": "Row-Group-Statistiken" },
    workers: "local-ssd",
    note: "Das Modell legt Shards auf lokalen Worker-SSDs ab und lässt den Object-Store-Abruf aus. Ein reales System kann weiterhin Netzwerk für Koordination oder Replikation nutzen.",
  },
  {
    id: "system",
    name: "Systemtabellen",
    sub: "Engine-Metadaten im Arbeitsspeicher",
    latency: "modellierte Mikrosekunden",
    color: "c3",
    stats: { Zeilen: "8", Bytes: "1 KB", "Predicate Pushdown": "nicht anwendbar (im Arbeitsspeicher)" },
    workers: "coordinator",
    note: "Das Modell liefert Koordinator-Metadaten aus dem Arbeitsspeicher. Reale Systemtabellen hängen vom Konnektor und den angeforderten Metadaten ab.",
  },
];

export function ConnectorSwitcher() {
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const connectors = locale === "de" ? CONNECTORS_DE : CONNECTORS;
  const [cid, setCid] = useState("snowflake");
  const C = connectors.find((c) => c.id === cid)!;

  return (
    <Panel
      eyebrow={text("live · pluggable", "live · austauschbar")}
      title={text("Same SQL. Different physics.", "Gleiches SQL. Andere Laufzeitbedingungen.")}
      meta={`${text("connector", "Konnektor")}: ${C.name}`}
      caption={text("Illustrative connector paths. Values are scenario inputs, not vendor benchmarks.", "Beispielhafte Konnektorpfade. Werte sind Szenarioeingaben und keine Anbieter-Benchmarks.")}
    >
      <div className="cs-wrap">
        <div className="cs-sql">
          <div className="cs-sql-q">
            <span className="tok-k">SELECT</span> <span className="tok-f">count</span>(*) <span className="tok-k">FROM</span> x{" "}
            <span className="tok-k">WHERE</span> region = <span className="tok-s">&apos;EU&apos;</span>;
          </div>
        </div>
        <div className="cs-tabs">
          {connectors.map((c) => (
            <button type="button" key={c.id} className={`cs-tab cs-${c.color} ${cid === c.id ? "on" : ""}`} onClick={() => setCid(c.id)}>
              <span className="cs-tab-name">{c.name}</span>
              <span className="cs-tab-sub">{c.sub}</span>
              <span className="cs-tab-lat">{c.latency}</span>
            </button>
          ))}
        </div>
        <div className={`cs-panel cs-${C.color}`}>
          <div className="cs-diag">
            <div className="cs-diag-head">{text("runtime physics", "Laufzeitverhalten")}</div>
            {C.workers === "fan-out" && (
              <div className="cs-diag-grid cs-fanout">
                <div className="cs-node coord">{text("coord", "Koord.")}</div>
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
                <div className="cs-node coord">{text("coord", "Koord.")}</div>
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
                  <div className="cs-node-lab">{text("coordinator", "Koordinator")}</div>
                  <div className="cs-node-mem">◆ {text("in-memory metadata", "Metadaten im Arbeitsspeicher")}</div>
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
