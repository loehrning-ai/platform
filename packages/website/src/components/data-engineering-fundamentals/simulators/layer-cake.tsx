"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

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
  { n: 7, key: "app", name: "Application", sub: "Hex · Mode · dashboards · notebooks · BI tools", api: "Natural language · SQL · REST", hue: "L7", fail: "The user-facing surface is down. No new queries enter." },
  { n: 6, key: "engine", name: "Query engine", sub: "Trino (interactive) · Spark (batch) · Snowflake", api: "SQL → distributed plan", hue: "L6", fail: "Queries queue, get rejected or fail, depending on resource and timeout settings." },
  { n: 5, key: "catalog", name: "Catalog / Metastore", sub: "Glue Catalog · schema + physical location of registered tables", api: "Thrift: getPartitions · getTableSchema", hue: "L5", fail: "Planning fails before any read when schema or partition metadata is missing." },
  { n: 4, key: "table", name: "Table abstraction", sub: "Namespaces → Tables → Partitions → Rows · ds-partitioned", api: "SELECT … WHERE ds = '2024-01-15'", hue: "L4", fail: "Partition resolution breaks. The engine scans too much or misses data." },
  { n: 3, key: "format", name: "File format", sub: "Parquet · ORC · Avro · text", api: "Read/write by row group or stripe · predicate pushdown", hue: "L3", fail: "Missing or corrupt metadata disables skipping or makes the file unreadable." },
  { n: 2, key: "blob", name: "Blob layer", sub: "S3 · blob API · object placement", api: "put(blob) · get(blob_id)", hue: "L2", fail: "Higher latency or errors can trigger configured retries and query timeouts." },
  { n: 1, key: "physical", name: "Physical storage", sub: "SSD tier · flash tier · replicated", api: "Raw bytes", hue: "L1", fail: "Dependent reads wait, retry or fail, depending on configuration." },
];

const LAYERS_DE: readonly Layer[] = [
  { n: 7, key: "app", name: "Anwendung", sub: "Hex · Mode · Dashboards · Notebooks · BI-Werkzeuge", api: "Natürliche Sprache · SQL · REST", hue: "L7", fail: "Die sichtbare Anwendung fällt aus. Keine neuen Abfragen kommen herein." },
  { n: 6, key: "engine", name: "Abfrage-Engine", sub: "Trino (interaktiv) · Spark (Batch) · Snowflake", api: "SQL → verteilter Plan", hue: "L6", fail: "Abfragen warten, werden abgelehnt oder scheitern, je nach Ressourcen- und Timeout-Einstellungen." },
  { n: 5, key: "catalog", name: "Katalog / Metastore", sub: "Glue Catalog · Schema und physischer Speicherort registrierter Tabellen", api: "Thrift: getPartitions · getTableSchema", hue: "L5", fail: "Die Planung scheitert vor dem Lesen, wenn Schema- oder Partitionsmetadaten fehlen." },
  { n: 4, key: "table", name: "Tabellenabstraktion", sub: "Namespaces → Tabellen → Partitionen → Zeilen · nach ds partitioniert", api: "SELECT … WHERE ds = '2024-01-15'", hue: "L4", fail: "Die Partitionsauflösung versagt. Die Engine liest zu viel oder übersieht Daten." },
  { n: 3, key: "format", name: "Dateiformat", sub: "Parquet · ORC · Avro · Text", api: "Lesen/Schreiben nach Row Group oder Stripe · Predicate Pushdown", hue: "L3", fail: "Fehlende oder beschädigte Metadaten verhindern das Überspringen oder machen die Datei unlesbar." },
  { n: 2, key: "blob", name: "Blob-Schicht", sub: "S3 · Blob-API · Objektplatzierung", api: "put(blob) · get(blob_id)", hue: "L2", fail: "Höhere Latenz oder Fehler können konfigurierte Wiederholungen und Zeitüberschreitungen auslösen." },
  { n: 1, key: "physical", name: "Physischer Speicher", sub: "SSD-Schicht · Flash-Schicht · repliziert", api: "Rohbytes", hue: "L1", fail: "Abhängige Lesevorgänge warten, wiederholen oder scheitern, je nach Konfiguration." },
];

interface Pulse {
  readonly idx: number;
  readonly dir: "down" | "up";
}

export function LayerCake() {
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const layers = locale === "de" ? LAYERS_DE : LAYERS;
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
        idx = Math.floor(p * 2 * layers.length);
        dir = "down";
      } else {
        idx = layers.length - 1 - Math.floor((p - 0.5) * 2 * layers.length);
        dir = "up";
      }
      idx = Math.max(0, Math.min(layers.length - 1, idx));
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

  const faultyIdx = faulty ? layers.findIndex((l) => l.key === faulty) : -1;
  const affected = (i: number) => failMode && faultyIdx >= 0 && i <= faultyIdx;
  const hoveredLayer = hover ? layers.find((l) => l.key === hover) : undefined;

  return (
    <Panel
      eyebrow={text("live · interactive", "live · interaktiv")}
      title={text("The 7-layer stack", "Der Stack aus sieben Schichten")}
      meta={text("hover a layer · click trace · toggle failure mode", "Schicht auswählen · Abfrage verfolgen · Fehlermodus umschalten")}
      caption={text("A real deployment may combine or replace layers.", "Ein echtes System kann Schichten zusammenfassen oder ersetzen.")}
    >
      <div className="lc-wrap">
        <div className="lc-stack">
          {layers.map((L, i) => {
            const isHover = hover === L.key;
            const pulsing = pulse?.idx === i;
            const broken = failMode && faulty === L.key;
            const impact = affected(i) && !broken;
            return (
              <button
                type="button"
                key={L.key}
                className={`lc-slab lc-${L.hue} ${isHover ? "on" : ""} ${pulsing ? "pulse " + pulse!.dir : ""} ${broken ? "broken" : ""} ${impact ? "impact" : ""} ${failMode ? "fm" : ""}`}
                onMouseEnter={() => setHover(L.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(L.key)}
                onBlur={() => setHover(null)}
                onClick={() => failMode && setFaulty((f) => (f === L.key ? null : L.key))}
                aria-pressed={failMode ? broken : undefined}
                style={{ zIndex: isHover ? 40 : 10 + (layers.length - i) }}
              >
                <div className="lc-slab-num">L{L.n}</div>
                <div className="lc-slab-name">{L.name}</div>
                <div className="lc-slab-sub">{L.sub}</div>
                <div className="lc-slab-api">{L.api}</div>
                {pulsing && <div className="lc-pulse-dot" />}
                {broken && <div className="lc-x">✕</div>}
              </button>
            );
          })}
        </div>
        <aside className="lc-detail">
          {hoveredLayer ? (
            <div className="lc-detail-card">
              <div className="lc-dc-eyebrow">{text("Layer", "Schicht")} {hoveredLayer.n}</div>
              <div className="lc-dc-title">{hoveredLayer.name}</div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">{text("Stores", "Speichert")}</span>
                <span className="lc-dc-v">{hoveredLayer.sub}</span>
              </div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">API</span>
                <span className="lc-dc-v">{hoveredLayer.api}</span>
              </div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">{text("Above", "Darüber")}</span>
                <span className="lc-dc-v">
                  {(() => {
                    const above = layers.find((l) => l.n === hoveredLayer.n + 1);
                    return above ? `L${above.n} ${above.name}` : text("- (top of stack)", "- (oberste Schicht)");
                  })()}
                </span>
              </div>
              <div className="lc-dc-row">
                <span className="lc-dc-k">{text("Below", "Darunter")}</span>
                <span className="lc-dc-v">
                  {(() => {
                    const below = layers.find((l) => l.n === hoveredLayer.n - 1);
                    return below ? `L${below.n} ${below.name}` : text("- (bare metal)", "- (physische Hardware)");
                  })()}
                </span>
              </div>
              {failMode && (
                <div className="lc-dc-fail">
                  <div className="lc-dc-fail-lab">{text("If this layer is down", "Wenn diese Schicht ausfällt")}</div>
                  <div className="lc-dc-fail-v">{hoveredLayer.fail}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="lc-detail-empty">
              <div className="lc-de-dot" />
              <div className="lc-de-lab">{text("Hover any layer", "Eine Schicht auswählen")}</div>
              <div className="lc-de-sub">{text("See what it stores, its API and its neighbours.", "Was sie speichert, ihre API und ihre Nachbarn.")}</div>
            </div>
          )}
        </aside>
      </div>
      <div className="lc-ctrls">
        <button type="button" className="btn btn-primary" onClick={trace} disabled={!!pulse}>
          {pulse ? (pulse.dir === "down" ? text("▾ descending…", "▾ Abfrage läuft abwärts…") : text("▴ returning result…", "▴ Ergebnis läuft zurück…")) : text("▶ Trace a query", "▶ Abfrage verfolgen")}
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
          <span>{text("Failure mode", "Fehlermodus")}</span>
          <span className="lc-fm-sub">{failMode ? text("click a layer to mark it down", "Schicht anklicken, um sie ausfallen zu lassen") : text("see what breaks above a failed layer", "Folgen eines Ausfalls anzeigen")}</span>
        </label>
      </div>
    </Panel>
  );
}

export default LayerCake;
