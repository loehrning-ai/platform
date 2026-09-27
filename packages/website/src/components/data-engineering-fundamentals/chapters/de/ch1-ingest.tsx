import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../../primitives";
import { WatermarkSim } from "../../simulators/watermark-sim";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { KAFKA_TO_WAREHOUSE_SQL } from "../ch1-ingest";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

function IngestStreamsDe() {
  return (
    <div className="cards-2">
      <div className="ccard">
        <div className="ccard-t">ClickHouse</div>
        <div className="ccard-n">Stichprobe · operative Sicht</div>
        <div className="ccard-d">Behält eines von N Ereignissen. Schätzungen daraus brauchen das dokumentierte Stichprobenverfahren und einen passenden Schätzer.</div>
      </div>
      <div className="ccard">
        <div className="ccard-t">Snowflake</div>
        <div className="ccard-n">Vollständig · geplanter Batch</div>
        <div className="ccard-d">Behält alle akzeptierten Rohereignisse und baut eine Partition aus festen Eingaben neu. Vollständigkeit hängt weiter von Quellerfassung und Nachzüglerregel ab.</div>
      </div>
    </div>
  );
}

export interface Ch1IngestDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch1IngestDe({ chapter }: Ch1IngestDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Datenaufnahme: <span class='accent'>Ereigniszeit, Verarbeitungszeit und Nachzügler.</span>"
        hook="Eine Watermark schließt jedes Ereigniszeitfenster. Was danach eintrifft, regelt die Nachzüglerregel."
        meta={[
          { k: "Quelle", v: '<span class="chip">ClickHouse</span><span class="chip">Logger</span><span class="chip">CDC</span>' },
          { k: "Ziel", v: "Snowflake · Iceberg-Tabellen" },
          { k: "Kernproblem", v: "verspätete Ereignisse und Uhrabweichung" },
        ]}
      />

      <section className="section">
        <SectionLabel n="1.1">Zwei Uhren, ein Ereignis</SectionLabel>
        <h2 className="h2">Ereigniszeit und Verarbeitungszeit.</h2>
        <p className="prose">Jedes Ereignis hat zwei Zeitstempel: die <b>Ereigniszeit</b>, wann es passiert ist (ein Tippen auf dem Smartphone, eine angezeigte Werbung), und die <b>Verarbeitungszeit</b>, wann der Stream es sieht. Mobile Clients, Wiederholungen, schwacher Empfang und Uhrabweichungen lassen beide auseinanderlaufen. Wer sie gleichsetzt, bekommt falsche Zahlen.</p>
        <p className="prose">In der Kursarchitektur transportiert Kafka die Ereignisse, und ein Flink-Job verarbeitet sie, bevor sich operative und Batch-Schreibvorgänge trennen. Die <b>Watermark</b> markiert den Fortschritt in der Ereigniszeit. Danach aktualisiert die konfigurierte Regel ein Fenster, gibt Nachzügler getrennt aus oder verwirft sie.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.2">Der Zielkonflikt im Simulator</SectionLabel>
        <h2 className="h2">Wie lange wartet ein Zeitfenster?</h2>
        <p className="prose">Verschieb die blaue Linie. Dieser Simulator verwirft Nachzügler; eine Produktionspipeline kann die Rohdaten behalten und verspätete Datensätze getrennt oder neu verarbeiten. So oder so tauschst du Veröffentlichungsverzug gegen Vollständigkeit.</p>
        <WatermarkSim />
        <p className="prose" style={{ marginTop: 22 }}>Leite die Watermark aus der beobachteten Verspätung und der tolerierten Verzögerung ab. Überwach, wie viel nach Schließung eintrifft, und pass die Regel an, wenn sich das ändert.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.3">Zwei Speicher, zwei Aufgaben</SectionLabel>
        <h2 className="h2">Operative Sicht und vollständigen Batch trennen.</h2>
        <p className="prose">Stichprobe und Batch sind Rollen dieser Kursarchitektur; Kafka oder Flink liefern sie nicht mit. Die Stichprobe dient der operativen Prüfung, der Batch reproduzierbaren Berichten, sobald Quelle, Vollständigkeitsprüfungen und Nachzüglerregel feststehen.</p>
        <IngestStreamsDe />
      </section>

      <section className="section">
        <SectionLabel n="1.4">SQL des Kurses von Kafka zum Warehouse</SectionLabel>
        <CodeBlock title="kafka_to_warehouse_events.sql" lang="Spark" html={KAFKA_TO_WAREHOUSE_SQL} />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Stichprobenzahlen als Grundgesamtheit behandeln.</b> Eine Stichprobe von 1:1000 braucht eine dokumentierte Gewichtung oder einen Schätzer und Annahmen zur Auswahl.",
          "<b>Nachzügler ohne Wiederherstellungspfad verwerfen.</b> Behalt ein unveränderliches Rohprotokoll oder eine getrennte Ausgabe, wenn spätere Korrekturen nötig sind.",
          "<b><code>NOW()</code> in einem Aufnahmejob lesen.</b> Ein Backfill im Mai für den vergangenen Dienstag wird dadurch nicht reproduzierbar. <code>&lt;DATEID&gt;</code> verwenden.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Für jedes Ereignis <b>beide Zeitstempel</b> ausgeben: <code>event_time</code> vom Gerät und <code>processing_time</code> vom Server. Ihre Differenz ist das Watermark-Budget.",
          "Stichprobenausgaben mit Stichprobenverfahren kennzeichnen, geplante Ausgaben mit Stichtag, Quellenabdeckung und Korrekturregel.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch1IngestDe;
