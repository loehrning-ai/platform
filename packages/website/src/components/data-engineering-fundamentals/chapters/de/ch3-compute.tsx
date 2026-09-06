import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "../../primitives";
import { ShuffleSim } from "../../simulators/shuffle-sim";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

function EngineMatrixDe() {
  const rows = [
    { n: "Presto", s: "Verteiltes SQL", d: "Interaktives SQL über Konnektoren. Spill-, Wiederholungs- und Ressourcenverhalten hängen von Engine-Version und Clusterkonfiguration ab." },
    { n: "Spark", s: "Batch-Verarbeitung", d: "DataFrame- und SQL-Lasten mit partitionierter Ausführung, Shuffle, Neuberechnung und konfigurierbarem Spill." },
    { n: "Snowflake", s: "Verwaltetes SQL-Warehouse", d: "Verwalteter Speicher und virtuelle Warehouses. Laufzeit und Kosten hängen von Warehouse-Größe, Abfrageform, Cache und Parallelität ab." },
  ];
  return (
    <div className="cards-3">
      {rows.map((engine) => (
        <div key={engine.n} className="ccard">
          <div className="ccard-t">{engine.s}</div>
          <div className="ccard-n">{engine.n}</div>
          <div className="ccard-d">{engine.d}</div>
        </div>
      ))}
    </div>
  );
}

export interface Ch3ComputeDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch3ComputeDe({ chapter }: Ch3ComputeDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Verarbeitung: <span class='accent'>Der Planer entscheidet anhand von Statistiken.</span> Falsche Statistiken erzeugen einen falschen Plan."
        hook="Ein kostenbasierter Planer wählt die Join-Strategie aus Tabellenstatistiken und Konfiguration. Sind die Statistiken veraltet oder unvollständig, landet er bei einer Build-Seite oder Verteilung, die den Arbeitsspeicher sprengt oder alle Arbeit auf wenige Partitionen kippt."
        meta={[
          { k: "Engines", v: '<span class="chip">Presto</span><span class="chip">Spark</span><span class="chip">Snowflake</span>' },
          { k: "Planer", v: "CBO · statistikbasiert" },
          { k: "Kernrisiken", v: "Skew · veraltete Statistiken · Speicher" },
        ]}
      />

      <section className="section">
        <SectionLabel n="4.1">Die Engine nach der Abfrage wählen</SectionLabel>
        <h2 className="h2">Drei Engines, dieselben Bytes.</h2>
        <p className="prose">Jede Engine, die dasselbe Tabellenformat und denselben Katalog unterstützt, liest dieselben Parquet-Dateien. Entschieden wird nach gemessenen Anforderungen: Start- und Antwortzeit, Shuffle-Volumen, Speicher und Spill, Wiederholungsverhalten, Parallelität, Betriebsverantwortung und Kosten.</p>
        <EngineMatrixDe />
      </section>

      <section className="section">
        <SectionLabel n="4.2">Der Planer im Simulator</SectionLabel>
        <h2 className="h2">Die tatsächliche Ausführung eines Joins.</h2>
        <p className="prose">Ein partitionierter <b>Hash-Join</b> verteilt Zeilen nach dem Join-Schlüssel neu. Ist ein Schlüssel viel häufiger als die anderen, bekommt ein Worker deutlich mehr Daten als der Rest. Ein <b>Broadcast-Join</b> kopiert die Build-Seite auf jeden Worker und taugt nur, wenn sie dort mit Reserve neben der übrigen Abfrage in den Arbeitsspeicher passt.</p>
        <p className="prose">Erhöhe den Skew und beobachte, wie Worker 0 mehr modellierte Last erhält. Ein häufiger Sentinel-Wert wie <code>user_id = 0</code> kann diese Verteilung erzeugen, wenn er Teil des Join-Schlüssels ist.</p>
        <ShuffleSim />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Eine ungemessene Build-Seite per Broadcast verteilen.</b> Komprimierte und entpackte Größe, Worker-Anzahl, parallele Arbeit und Speichergrenzen vor einem Hint prüfen.",
          "<b>Einen Hash-Join über eine Spalte mit einem stark belasteten Schlüssel ausführen.</b> Typisches Beispiel: <code>user_id = 0</code> für abgemeldeten Verkehr. Den Schlüssel salzen oder vorher filtern.",
          "<b>Darauf setzen, dass die Engine schon auslagern wird.</b> Prüf Engine-Version, Operatorunterstützung und Clusterkonfiguration, bevor du ihr einen großen Join gibst.",
          "<b>Veraltete Tabellenstatistiken verwenden.</b> Nach wesentlichen Datenänderungen aktualisieren und Schätzungen im Plan mit Laufzeitzeilen vergleichen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Verteilungen der Join-Schlüssel prüfen.</b> Repräsentative Daten verwenden und größten Schlüssel oder größte Partition mit dem Median vergleichen.",
          "<b>Broadcast-Hints</b> nur nach Messung der kleinen Seite verwenden. <code>/*+ BROADCAST(x) */</code> ist eine ausdrückliche Zusage an den Planer.",
          "Bei dauerhaftem Skew Filtern, Voraggregation, Aufteilen heißer Schlüssel oder <b>Salting</b> bewerten. Salting ergänzt Replikation und eine zweite Aggregation; diesen Aufwand prüfen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Der Planer wählt <b>Shuffle oder Broadcast</b> anhand von Statistiken, Konfiguration und Hints. Schätzungen mit Laufzeitdaten prüfen.",
          "Skew konzentriert Arbeit. Schau auf Schlüssel- und Partitionsverteilungen, bevor du die Clustergröße verantwortlich machst.",
          "Die Engine-Wahl gehört zum Jobdesign. Die Zielabfrage mit Zielkonfiguration und repräsentativer Datenverteilung testen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch3ComputeDe;
