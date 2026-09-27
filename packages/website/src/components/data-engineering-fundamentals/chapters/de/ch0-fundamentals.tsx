import { Hero, SectionLabel, AntiPatterns, Takeaway } from "../../primitives";
import { LayerCake } from "../../simulators/layer-cake";
import { ByteTrace } from "../../simulators/byte-trace";
import { Scanner } from "../../simulators/scanner";
import { SqlDecoderStage } from "../../simulators/sql-decoder-stage";
import { ConnectorSwitcher } from "../../simulators/connector-switcher";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

function LakehouseDiagramDe() {
  return (
    <div className="lh-diagram">
      <div className="lh-side legacy">
        <div className="lh-badge">Legacy · gekoppelt</div>
        <div className="lh-stack">
          <div className="lh-box tight">Oracle · Teradata · lokales MPP</div>
          <div className="lh-note">Rechenleistung hängt an eigenen Festplatten. Beides skaliert gemeinsam, und ein Upgrade heißt Migration.</div>
        </div>
      </div>
      <div className="lh-arrow">ENTKOPPELN →</div>
      <div className="lh-side modern">
        <div className="lh-badge mint">Modern · Lakehouse</div>
        <div className="lh-stack">
          <div className="lh-box lh-compute">
            <div className="lh-k">Rechenleistung (elastisch)</div>
            <div className="lh-v">Presto · Spark · Trino</div>
          </div>
          <div className="lh-k-arrow">liest</div>
          <div className="lh-box lh-storage">
            <div className="lh-k">Speicher (günstig, gemeinsam)</div>
            <div className="lh-v">Parquet · ORC · HDFS · S3</div>
          </div>
          <div className="lh-note">Engines teilen sich die Dateien und skalieren getrennt vom Speicher.</div>
        </div>
      </div>
    </div>
  );
}

function FormatSpectrumDe() {
  const formats = [
    { name: "CSV / JSON", kind: "row", tagline: "Text für den Austausch. Typen, Schemaprüfung und Komprimierung hängen vom umgebenden System ab.", traits: ["zeilenorientiert", "Text", "portabel"] },
    { name: "Parquet / ORC", kind: "col", tagline: "Typisierte Spaltendateien mit Metadaten und Komprimierung für selektive Analysen.", traits: ["spaltenorientiert", "Schema", "komprimiert"] },
    { name: "Iceberg / Delta / Hudi", kind: "tbl", tagline: "Verwalten Datendateien und ergänzen Transaktionen, Schemaentwicklung und Snapshots.", traits: ["Transaktionen", "Snapshots", "Schemaentwicklung"] },
  ];
  return (
    <div className="fmt-strip">
      {formats.map((format, index) => (
        <div key={format.name} className={`fmt-card k-${format.kind}`}>
          <div className="fmt-n">0{index + 1}</div>
          <div className="fmt-name">{format.name}</div>
          <div className="fmt-tag">{format.tagline}</div>
          <div className="fmt-traits">
            {format.traits.map((trait) => (
              <span key={trait} className="fmt-chip">{trait}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Ch0FundamentalsDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch0FundamentalsDe({ chapter }: Ch0FundamentalsDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Grundlagen: <span class='accent'>Speicher, Formate und Engines.</span>"
        hook="Abfragekosten hängen vom Datenlayout, von den Metadaten und von der Engine ab, die die Dateien liest."
        meta={[
          { k: "Inhalt", v: '<span class="chip">Lakehouse</span><span class="chip">Zeilen- und Spaltenlayout</span><span class="chip">Parquet</span><span class="chip">Iceberg</span>' },
          { k: "Engines", v: "Presto · Spark · Trino · Snowflake" },
          { k: "Ergebnis", v: "Gelesene Bytes bei Zeilen- und Spaltenlayout vergleichen" },
        ]}
      />

      <section className="section">
        <SectionLabel n="0.1">Speicher und Rechenleistung entkoppeln</SectionLabel>
        <h2 className="h2">Warum Speicher und Rechenleistung getrennt sind.</h2>
        <p className="prose">Vor einem Jahrzehnt war ein Warehouse eine Appliance. Oracle, Teradata oder Vertica besaßen Festplatten und Abfrage-Engine, gekauft und skaliert wurde beides zusammen. Eine andere Engine hieß: erst Terabytes migrieren.</p>
        <p className="prose">Ein <b>Lakehouse</b> legt die Daten in einen gemeinsamen Object Store wie S3, GCS oder Azure Blob, meist als Parquet- oder ORC-Dateien. Jede Engine, die Format, Tabellenmetadaten und Zugriffsregeln versteht, liest dieselben Dateien.</p>
        <LakehouseDiagramDe />
      </section>

      <section className="section">
        <SectionLabel n="0.2">Die Schichten</SectionLabel>
        <h2 className="h2">Die Schichten einer Warehouse-Abfrage.</h2>
        <LayerCake />
      </section>

      <section className="section">
        <SectionLabel n="0.3">Der Weg eines Bytes</SectionLabel>
        <h2 className="h2">Vom SELECT bis zur Flash-Schicht und zurück.</h2>
        <p className="prose">Der Simulator verfolgt einen Wert, <code>user_email</code> in einer Zeile, von der SQL-Anweisung bis zu den Bytes auf dem Datenträger. Bei einem kalten Lauf kosten Metastore- und Blob-Zugriffe zusätzlich.</p>
        <ByteTrace />
      </section>

      <section className="section">
        <SectionLabel n="0.4">Zeilen- und Spaltenlayout im Vergleich</SectionLabel>
        <h2 className="h2">Warum Analysen Spalten lesen.</h2>
        <p className="prose">Im Zeilenlayout liegen die Felder eines Datensatzes beieinander, gut für Punktabfragen. Eine Abfrage über eine Spalte liest dann ohne anderen Zugriffspfad jedes andere Feld mit.</p>
        <p className="prose">Im Spaltenlayout stehen die Werte von <code>revenue</code> in eigenen Blöcken. Mit Projection Pushdown in Format und Konnektor holt die Engine nur diese Blöcke. Die Ersparnis hängt von Spaltenauswahl, Dateilayout und Abfrageplan ab.</p>
        <Scanner />
        <p className="prose" style={{ marginTop: 24 }}>Spalten komprimieren außerdem gut, weil benachbarte Werte Typ und Verteilung teilen. Daten, Encoding, Codec und Row-Group-Größe bestimmen das Ergebnis, also miss an repräsentativen Dateien.</p>
      </section>

      <section className="section">
        <SectionLabel n="0.5">Das Spektrum der Dateiformate</SectionLabel>
        <h2 className="h2">Von CSV bis Iceberg.</h2>
        <p className="prose">Das <b>Dateiformat</b> legt fest, wie Bytes auf dem Datenträger liegen. Ein <b>Tabellenformat</b> katalogisiert Dateien, damit sie sich wie eine Tabelle verhalten.</p>
        <FormatSpectrumDe />
        <p className="prose" style={{ marginTop: 18 }}>Eine Pipeline kann Roh-JSON für Wiederholungen behalten, validierte typisierte Datensätze als Parquet schreiben und sie in <b>Iceberg</b> registrieren. Snapshot-Abfragen und Rollback hängen dann von Engine und Tabellenformat-Implementierung ab.</p>
      </section>

      <section className="section">
        <SectionLabel n="0.6">Wie aus einer Abfrage Arbeit wird</SectionLabel>
        <h2 className="h2">Fünf Transformationen zwischen Text und Bytes.</h2>
        <p className="prose">Ein Koordinator zerlegt SQL in einen <b>AST</b>, löst Namen gegen den Katalog auf, baut einen <b>logischen</b> und dann einen <b>physischen</b> Plan und verteilt einen <b>Task-Graph</b> aus Stages auf den Cluster. Was <code>EXPLAIN</code> oder <code>EXPLAIN ANALYZE</code> zeigt, hängt von der Engine ab.</p>
        <SqlDecoderStage />
      </section>

      <section className="section">
        <SectionLabel n="0.7">Das Ökosystem der Engines</SectionLabel>
        <h2 className="h2">Die Engine nach der Abfrage wählen.</h2>
        <p className="prose">Interaktive Abfragen und lange Transformationen unterscheiden sich bei Startzeit, Arbeitsspeicher, Spill, Wiederholungen und Parallelität; prüf, wie deine Engine dafür konfiguriert ist. Trino passt zu interaktivem SQL über Konnektoren, Spark zu Batch-Jobs mit großen Joins oder Spill. Snowflake betreibt verwaltetes SQL auf virtuellen Warehouses; kläre vorher, ob andere Engines auf dieselben Daten zugreifen müssen.</p>
      </section>

      <section className="section">
        <SectionLabel n="0.8">Konnektoren: gleiches SQL, anderes Laufzeitverhalten</SectionLabel>
        <h2 className="h2">Trino-Konnektoren bestimmen, woher die Daten kommen.</h2>
        <p className="prose">Trino, die Open-Source-MPP-Engine mit dem früheren Namen PrestoSQL, hat austauschbare Konnektoren. Dasselbe SQL kann verteilte Object-Store-Zugriffe, lokalen Speicher oder Metadaten des Koordinators nutzen. Prüf Konnektorplan, Cache-Zustand und Datenplatzierung, bevor du Latenzen vergleichst.</p>
        <ConnectorSwitcher />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Einen Data Lake wie eine relationale Datenbank behandeln.</b> <code>UPDATE one_row WHERE id = ...</code> auf rohem Parquet schreibt eine ganze Datei neu. Nutz ein Tabellenformat (Iceberg/Delta) mit Änderungen auf Zeilenebene oder bündle Aktualisierungen.",
          "<b>Kleine Dateien.</b> Sie kosten Auflistung, Footer-Zugriffe und Task-Planung. Leg eine Zielgröße fest und kompaktiere, wenn Messwerte es rechtfertigen.",
          "<b>Rohes CSV als analytische Tabelle.</b> Validier die Typen und schreib für selektive Abfragen eine typisierte Spaltenkopie.",
          "<b><code>SELECT *</code> auf einer Faktentabelle mit 300 Spalten.</b> Liest jede Spalte. Frag nur die Spalten ab, die du brauchst.",
          "<b>Trino und PrestoDB gleichsetzen.</b> Die Projekte haben sich um 2020 getrennt; Funktionsnamen, Konnektorverhalten und Optimierer-Vorgaben unterscheiden sich. Prüf, welche dein Cluster betreibt, bevor du Dokumentation übernimmst.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Jede der sieben Schichten hat ihr eigenes Fehlerbild.</b> Ein ausgefallener Metastore braucht eine andere Lösung als eine langsame SSD-Schicht.",
          "Lies vor dem Optimieren Plan und Laufzeitstatistiken und filtere zuerst nach Partitions- und Indexspalten.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch0FundamentalsDe;
