import { Hero, SectionLabel, AntiPatterns, BestPractices } from "../../primitives";
import { ShuffleSim } from "../../simulators/shuffle-sim";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

function EngineMatrixDe() {
  const rows = [
    { n: "Presto", s: "Verteiltes SQL", d: "Interaktives SQL über Konnektoren. Spill, Wiederholungen und Ressourcen hängen von Engine-Version und Clusterkonfiguration ab." },
    { n: "Spark", s: "Batch-Verarbeitung", d: "DataFrame- und SQL-Jobs mit partitionierter Ausführung, Shuffle, Neuberechnung und konfigurierbarem Spill." },
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
        title="Verarbeitung: <span class='accent'>Der Planer entscheidet nach Statistiken.</span>"
        hook="Ein kostenbasierter Planer wählt die Join-Strategie aus Tabellenstatistiken und Konfiguration. Veraltete Statistiken können eine Build-Seite wählen, die den Worker-Speicher sprengt, oder Arbeit auf wenige Partitionen häufen."
        meta={[
          { k: "Engines", v: '<span class="chip">Presto</span><span class="chip">Spark</span><span class="chip">Snowflake</span>' },
          { k: "Planer", v: "CBO · statistikbasiert" },
          { k: "Kernrisiken", v: "Skew · veraltete Statistiken · Speicher" },
        ]}
      />

      <section className="section">
        <SectionLabel n="4.1">Engine-Wahl</SectionLabel>
        <h2 className="h2">Trino, Spark und Snowflake lesen dieselben Parquet-Dateien.</h2>
        <p className="prose">Engines mit demselben Tabellenformat und Katalog lesen dieselben Parquet-Dateien. Wähl nach gemessener Last: Start- und Antwortzeit, Shuffle, Speicher und Spill, Wiederholungen, Parallelität, Verantwortung und Kosten.</p>
        <EngineMatrixDe />
      </section>

      <section className="section">
        <SectionLabel n="4.2">Der Planer im Simulator</SectionLabel>
        <h2 className="h2">So läuft ein Join.</h2>
        <p className="prose">Ein partitionierter <b>Hash-Join</b> verteilt Zeilen nach dem Join-Schlüssel neu, sodass ein häufiger Schlüssel einem Worker weit mehr Daten gibt. Ein <b>Broadcast-Join</b> kopiert die Build-Seite auf jeden Worker und taugt nur, wenn sie dort mit Reserve in den Arbeitsspeicher passt.</p>
        <p className="prose">Erhöhe den Skew, und Worker 0 bekommt mehr Last. Ein häufiger Sentinel-Wert wie <code>user_id = 0</code> im Join-Schlüssel erzeugt genau das.</p>
        <ShuffleSim />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Eine ungemessene Build-Seite per Broadcast verteilen.</b> Komprimierte und entpackte Größe, Worker-Anzahl, parallele Arbeit und Speichergrenzen vor einem Hint prüfen.",
          "<b>Hash-Join über eine Spalte mit einem heißen Schlüssel</b>, etwa <code>user_id = 0</code> für nicht angemeldete Nutzer. Den Schlüssel salzen oder vorher filtern.",
          "<b>Annehmen, dass die Engine auslagert oder nicht auslagert.</b> Prüf Engine-Version, Operatorunterstützung und Clusterkonfiguration, bevor du ihr einen großen Join gibst.",
          "<b>Veraltete Tabellenstatistiken verwenden.</b> Nach großen Datenänderungen aktualisieren und Planschätzungen mit Laufzeitzeilen vergleichen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Verteilungen der Join-Schlüssel prüfen.</b> Repräsentative Daten verwenden und größten Schlüssel oder größte Partition mit dem Median vergleichen.",
          "Bei dauerhaftem Skew Filtern, Voraggregation, Aufteilen heißer Schlüssel oder <b>Salting</b> versuchen. Salting kostet Replikation und eine zweite Aggregation.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch3ComputeDe;
