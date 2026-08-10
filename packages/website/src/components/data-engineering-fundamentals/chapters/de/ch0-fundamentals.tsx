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
          <div className="lh-note">Ein System. Rechenleistung ist an eigene Festplatten gebunden. Wird eine Seite skaliert, muss die andere mitwachsen. Ein Upgrade erfordert eine Migration.</div>
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
          <div className="lh-note">Kompatible Engines können dieselben Dateien lesen. Rechenleistung und Speicher lassen sich getrennt skalieren.</div>
        </div>
      </div>
    </div>
  );
}

function FormatSpectrumDe() {
  const formats = [
    { name: "CSV / JSON", kind: "row", tagline: "Textformate für Austausch und Prüfung. Typen, Schemaprüfung und Komprimierung hängen vom umgebenden System ab.", traits: ["zeilenorientiert", "Text", "portabel"] },
    { name: "Parquet / ORC", kind: "col", tagline: "Typisierte Spaltendateien mit Metadaten und Komprimierung für selektive analytische Lesevorgänge.", traits: ["spaltenorientiert", "Schema", "komprimiert"] },
    { name: "Iceberg / Delta / Hudi", kind: "tbl", tagline: "Tabellenformate, die Datendateien verwalten und Transaktionen, Schemaentwicklung und Snapshots ergänzen.", traits: ["Transaktionen", "Snapshots", "Schemaentwicklung"] },
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

function EngineCardsDe() {
  const engines = [
    { n: "Presto / Trino", kind: "verteiltes SQL", fits: "Interaktives SQL über konfigurierte Kataloge und Konnektoren.", not: "Lange Transformationen ohne Prüfung von Spill-, Wiederholungs- und Ressourceneinstellungen." },
    { n: "Spark / Databricks", kind: "verteilte Verarbeitung", fits: "Batch-Transformationen, große Joins sowie Jobs mit Neuberechnung oder Spill.", not: "Latenzkritische Abfragen ohne Messung von Start- und Scheduling-Aufwand." },
    { n: "Snowflake", kind: "verwaltetes Cloud-Warehouse", fits: "Verwaltete SQL-Rechenleistung mit getrennt dimensionierten virtuellen Warehouses.", not: "Lasten, deren Portabilitäts- oder Fremd-Engine-Anforderungen nicht zum Plattformmodell passen." },
  ];
  return (
    <div className="eng-cards">
      {engines.map((engine) => (
        <div className="eng-card" key={engine.n}>
          <div className="eng-n">{engine.n}</div>
          <div className="eng-kind">{engine.kind}</div>
          <div className="eng-row"><span className="eng-k mint">Geeignet</span> <span className="eng-v">{engine.fits}</span></div>
          <div className="eng-row"><span className="eng-k amber">Vermeiden</span> <span className="eng-v">{engine.not}</span></div>
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
        hook="Abfragekosten beginnen bei Datenlayout, Metadaten und der Engine, die die Dateien liest. Dieses Kapitel verfolgt diese Schichten und vergleicht anschließend Ausführungsmodelle."
        meta={[
          { k: "Inhalt", v: '<span class="chip">Lakehouse</span><span class="chip">Zeilen- und Spaltenlayout</span><span class="chip">Parquet</span><span class="chip">Iceberg</span>' },
          { k: "Engines", v: "Presto · Spark · Trino · Snowflake" },
          { k: "Ergebnis", v: "Gelesene Bytes bei Zeilen- und Spaltenlayout vergleichen" },
        ]}
      />

      <section className="section">
        <SectionLabel n="0.1">Speicher und Rechenleistung entkoppeln</SectionLabel>
        <h2 className="h2">Der grundlegende Wechsel hinter modernen Warehouses.</h2>
        <p className="prose">Vor einem Jahrzehnt war ein Warehouse eine Appliance. Oracle, Teradata und Vertica besaßen sowohl die Festplatten als auch die Abfrage-Engine. Beides wurde gemeinsam gekauft und skaliert. Der Wechsel der Engine erforderte zuerst die Migration von Terabytes an Daten.</p>
        <p className="prose">In einer <b>Lakehouse</b>-Architektur können Daten in einem gemeinsamen Object Store wie S3, GCS oder Azure Blob liegen, häufig als Parquet- oder ORC-Dateien. Engines mit Unterstützung für Format, Tabellenmetadaten und Zugriffsregeln können diese Dateien lesen. Rechenleistung und Speicher erhalten dadurch getrennte Skalierungsmechanismen.</p>
        <LakehouseDiagramDe />
      </section>

      <section className="section">
        <SectionLabel n="0.2">Die Schichten</SectionLabel>
        <h2 className="h2">Sieben Schichten, eine Abfrage.</h2>
        <p className="prose">Der Kurs trennt den Pfad einer Warehouse-Abfrage in sieben Diagnoseschichten. Von unten nach oben: <b>physischer Speicher</b> (SSD-Schicht), <b>Blob</b> (S3), <b>Dateiformat</b> (Parquet · ORC · Avro), <b>Tabellenabstraktion</b> (Namespaces → Tabellen → Partitionen), <b>Katalog</b> (Glue Catalog), <b>Abfrage-Engine</b> (Presto · Spark) und <b>Anwendung</b> (Hex · Dashboards).</p>
        <LayerCake />
      </section>

      <section className="section">
        <SectionLabel n="0.3">Der Weg eines Bytes</SectionLabel>
        <h2 className="h2">Vom SELECT bis zur Flash-Schicht und zurück.</h2>
        <p className="prose">Der Speicherpfad wird an einem einzelnen Byte konkret: dem Wert von <code>user_email</code> in einer Zeile. Der Simulator verfolgt ihn von der SQL-Anweisung bis zu den physischen Bytes. Bei einem kalten Lauf können Metastore- und Blob-Zugriffe zusätzliche Arbeit erzeugen. Die angezeigten Werte sind Anschauungsdaten und keine Anbieter-Benchmarks.</p>
        <ByteTrace />
      </section>

      <section className="section">
        <SectionLabel n="0.4">Zeilen- und Spaltenlayout im Vergleich</SectionLabel>
        <h2 className="h2">Warum Analysen spaltenorientierte Daten benötigen.</h2>
        <p className="prose">In einem Zeilenlayout liegen alle Felder eines Datensatzes zusammen. Das unterstützt Punktabfragen, während eine Analyse einer einzelnen Spalte ohne zusätzlichen Zugriffspfad auch nicht benötigte Felder liest.</p>
        <p className="prose">Im Spaltenlayout liegen die Werte von <code>revenue</code> in Spaltenblöcken. Wenn Format und Konnektor Projection Pushdown unterstützen, liest die Engine die angeforderten Blöcke statt aller Felder. Die tatsächliche Einsparung hängt von Spaltenauswahl, Dateilayout und Abfrageplan ab.</p>
        <Scanner />
        <p className="prose" style={{ marginTop: 24 }}>Spaltenorientierte Daten können sich effizient komprimieren lassen, weil benachbarte Werte oft Typ und Verteilung teilen. Das Ergebnis hängt von Daten, Encoding, Codec und Row-Group-Größe ab und muss an repräsentativen Dateien gemessen werden.</p>
      </section>

      <section className="section">
        <SectionLabel n="0.5">Das Spektrum der Dateiformate</SectionLabel>
        <h2 className="h2">Von CSV bis Iceberg.</h2>
        <p className="prose"><b>Dateiformat</b> bezeichnet die Anordnung der Bytes auf dem Datenträger. Ein <b>Tabellenformat</b> katalogisiert Dateien und ergänzt Transaktionen, Schemaentwicklung und Time Travel.</p>
        <FormatSpectrumDe />
        <p className="prose" style={{ marginTop: 18 }}>Eine Pipeline kann Rohdaten für Wiederholungen als JSON aufbewahren, validierte typisierte Datensätze als Parquet schreiben und diese Dateien in einem Tabellenformat wie <b>Iceberg</b> registrieren. Snapshot-Abfragen und Rollback-Verhalten hängen von der eingesetzten Engine und Implementierung ab.</p>
      </section>

      <section className="section">
        <SectionLabel n="0.6">Wie aus einer Abfrage Arbeit wird</SectionLabel>
        <h2 className="h2">Fünf Transformationen zwischen Text und Bytes.</h2>
        <p className="prose">SQL wird nicht unmittelbar ausgeführt. Ein Koordinator verarbeitet die Anweisung in einer Kette: Der Parser baut einen <b>AST</b>, der Analyzer löst Namen gegen den Katalog auf, der Planer erzeugt einen <b>logischen</b> Baum relationaler Operatoren und danach einen <b>physischen</b> Plan mit Exchange-Typen und Worker-Anzahl. Abschließend entsteht ein <b>Task-Graph</b> verteilter Stages. Welche Details <code>EXPLAIN</code> oder <code>EXPLAIN ANALYZE</code> zeigt, hängt von der Engine ab.</p>
        <SqlDecoderStage />
      </section>

      <section className="section">
        <SectionLabel n="0.7">Das Ökosystem der Engines</SectionLabel>
        <h2 className="h2">Die Engine nach der Abfrage wählen.</h2>
        <p className="prose">Interaktive Abfragen und lange Transformationen stellen unterschiedliche Anforderungen an Startzeit, Arbeitsspeicher, Spill, Wiederholungen und Parallelität. Diese Anforderungen müssen mit dem konfigurierten Verhalten der Engine verglichen werden.</p>
        <EngineCardsDe />
      </section>

      <section className="section">
        <SectionLabel n="0.8">Konnektoren: gleiches SQL, anderes Laufzeitverhalten</SectionLabel>
        <h2 className="h2">Der Konnektor bestimmt die Laufzeitbedingungen.</h2>
        <p className="prose">Trino, die ursprünglich als PrestoSQL entwickelte Open-Source-MPP-Engine, besitzt eine austauschbare Konnektorschnittstelle. Dieselbe SQL-Anweisung kann verteilte Object-Store-Zugriffe, lokalen Speicher oder Metadaten des Koordinators verwenden. Vor einem Latenzvergleich müssen Konnektorplan, Cache-Zustand und Datenplatzierung geprüft werden.</p>
        <ConnectorSwitcher />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Einen Data Lake wie eine relationale Datenbank behandeln.</b> <code>UPDATE one_row WHERE id = ...</code> auf rohem Parquet schreibt eine vollständige Datei neu. Ein Tabellenformat wie Iceberg oder Delta für Änderungen auf Zeilenebene verwenden oder Aktualisierungen bündeln.",
          "<b>Das Small-Files-Problem ignorieren.</b> Viele kleine Dateien können Aufwand für Auflistung, Footer-Zugriffe und Task-Planung erzeugen. Zielgrößen festlegen und anhand von Messwerten kompaktieren.",
          "<b>Rohes CSV als analytische Tabelle verwenden.</b> Typen validieren und bei selektiven analytischen Zugriffen eine typisierte spaltenorientierte Darstellung schreiben.",
          "<b><code>SELECT *</code> auf einer Faktentabelle mit 300 Spalten.</b> Damit entfällt der Vorteil des Spaltenlayouts. Nur benötigte Spalten abfragen.",
          "<b>Trino und PrestoDB gleichsetzen.</b> Trino, früher PrestoSQL, und PrestoDB trennten sich um 2020. Funktionsnamen, Konnektorverhalten und Optimierer-Vorgaben unterscheiden sich inzwischen deutlich. Vor der Übernahme von Dokumentation die tatsächlich betriebene Engine prüfen.",
          "<b>Den Ausführungsplan ignorieren.</b> Vor Änderungen an SQL oder Cluster-Einstellungen den Plan und die Laufzeitstatistiken der Engine prüfen.",
          "<b>Eine Engine nur nach ihrem Ruf auswählen.</b> Start, Scan, Speicher, Spill, Wiederholung und Parallelität für die konkrete Last messen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Ein Warehouse besteht aus sieben Schichten.</b> Die Schicht bestimmt die Fehlerart. Ein ausgefallener Metastore ist nicht dasselbe wie eine langsame SSD-Schicht.",
          "<b>SQL → AST → logisch → physisch → Stages → Tasks.</b> Die von der Engine bereitgestellten Plan- und Laufzeitdetails zur Prüfung verwenden.",
          "<b>Der Konnektor bestimmt den Zugriffspfad.</b> Gleiches SQL kann unterschiedliche Speicher-, Metadaten- und Cache-Schichten erreichen.",
          "Spaltenformate machen Analysen zu Operationen, die <b>den Großteil des Datenträgers überspringen</b>. Tabellenformate ergänzen ACID und Time Travel.",
          "Vor der Optimierung den Plan lesen. Zuerst nach Partitions- und Indexspalten filtern. <code>SELECT *</code> vermeiden.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch0FundamentalsDe;
