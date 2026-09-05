import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../../primitives";
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
        <div className="ccard-d">Im Kursszenario wird eines von N Ereignissen für die operative Sicht gespeichert. Eine Schätzung aus dieser Stichprobe benötigt das dokumentierte Stichprobenverfahren und einen passenden Schätzer.</div>
      </div>
      <div className="ccard">
        <div className="ccard-t">Snowflake</div>
        <div className="ccard-n">Vollständig · geplanter Batch</div>
        <div className="ccard-d">Der Kurs-Batch übernimmt alle akzeptierten Rohereignisse und baut eine Partition aus festen Eingaben neu. Vollständigkeit hängt weiterhin von Quellerfassung und Nachzüglerregel ab.</div>
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
        hook="Die Referenzpipeline des Kurses schreibt eine stichprobenbasierte operative Sicht nach ClickHouse und einen vollständigen geplanten Batch nach Snowflake. Eine Watermark schließt jedes Ereigniszeitfenster. Was danach noch eintrifft, entscheidet die konfigurierte Nachzüglerregel."
        meta={[
          { k: "Quelle", v: '<span class="chip">ClickHouse</span><span class="chip">Logger</span><span class="chip">CDC</span>' },
          { k: "Ziel", v: "Snowflake · Iceberg-Tabellen" },
          { k: "Kernproblem", v: "verspätete Ereignisse und Uhrabweichung" },
        ]}
      />

      <section className="section">
        <SectionLabel n="1.1">Zwei Uhren, ein Ereignis</SectionLabel>
        <h2 className="h2">Ereigniszeit und Verarbeitungszeit.</h2>
        <p className="prose">Jedes Ereignis besitzt zwei Zeitstempel. Die <b>Ereigniszeit</b> bezeichnet den tatsächlichen Zeitpunkt, etwa das Tippen auf einem Smartphone oder die Darstellung einer Werbeeinblendung. Die <b>Verarbeitungszeit</b> bezeichnet den Zeitpunkt, an dem der Stream das Ereignis gesehen hat. Mobile Clients, Wiederholungen, schwache Funkverbindungen und Uhrabweichungen lassen beide Werte auseinanderlaufen. Wer sie gleichsetzt, erzeugt falsche Zahlen.</p>
        <p className="prose">In der Kursarchitektur trägt Kafka die Ereignisse, und ein Flink-Job verarbeitet sie vor den getrennten operativen und Batch-Schreibvorgängen. Die <b>Watermark</b> markiert den Fortschritt in der Ereigniszeit. Was mit einem Nachzügler passiert, steht in der Regel dahinter: Fenster aktualisieren, getrennt ausgeben oder verwerfen.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.2">Der Zielkonflikt im Simulator</SectionLabel>
        <h2 className="h2">Wie lange wartet ein Zeitfenster?</h2>
        <p className="prose">Verschiebe die blaue Linie. Grüne Punkte treffen vor der simulierten Watermark ein, gelbe Punkte danach. Dieser Simulator verwirft Nachzügler. Eine Produktionspipeline kann Rohdaten stattdessen behalten und verspätete Datensätze getrennt verarbeiten oder neu einlesen. Die Wahl verändert Veröffentlichungsverzug und Vollständigkeit.</p>
        <WatermarkSim />
        <p className="prose" style={{ marginTop: 22 }}>Leite die Watermark aus der beobachteten Verspätungsverteilung und der zulässigen Veröffentlichungsverzögerung ab. Überwach den Anteil, der nach Schließung noch eintrifft, und zieh die Regel nach, sobald sich die Verteilung verschiebt.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.3">Zwei Speicher, zwei Aufgaben</SectionLabel>
        <h2 className="h2">Operative Sicht und vollständigen Batch trennen.</h2>
        <p className="prose">Diese Rollen gehören zur Referenzarchitektur, nicht zu den Anbietern. Die Stichprobe trägt die operative Prüfung. Der geplante Batch trägt reproduzierbare Berichte, sobald Quelle, Vollständigkeitsprüfungen und Nachzüglerregel feststehen.</p>
        <IngestStreamsDe />
      </section>

      <section className="section">
        <SectionLabel n="1.4">SQL des Kurses von Kafka zum Warehouse</SectionLabel>
        <CodeBlock title="kafka_to_warehouse_events.sql" lang="Spark" html={KAFKA_TO_WAREHOUSE_SQL} />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Rohe Stichprobenzahlen als Grundgesamtheit verwenden.</b> Eine Stichprobe von 1:1000 benötigt eine dokumentierte Gewichtung oder einen Schätzer sowie Annahmen über die Auswahl.",
          "<b>Ein Fenster ohne Messung der Verspätung schließen.</b> Watermark und Überwachung aus der Differenz zwischen Ereignis- und Verarbeitungszeit ableiten.",
          "<b>Nachzügler ohne Wiederherstellungspfad verwerfen.</b> Behalt ein unveränderliches Rohprotokoll oder eine getrennte Ausgabe, sobald spätere Korrekturen denkbar sind.",
          "<b><code>NOW()</code> in einem Aufnahmejob lesen.</b> Ein Backfill im Mai für den vergangenen Dienstag wird dadurch nicht reproduzierbar. <code>&lt;DATEID&gt;</code> verwenden.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Für jedes Ereignis <b>beide Zeitstempel</b> ausgeben: <code>event_time</code> vom Gerät und <code>processing_time</code> vom Server. Ihre Differenz bestimmt das Watermark-Budget.",
          "Die Watermark aus der <b>beobachteten Verspätungsverteilung</b> und einer dokumentierten Abwägung zwischen Vollständigkeit und Verzögerung ableiten.",
          "Stichprobenausgaben mit Stichprobenverfahren kennzeichnen. Geplante Ausgaben mit Stichtag, Quellenabdeckung und Korrekturregel kennzeichnen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Jedes Ereignis hat zwei Uhren: <b>Ereigniszeit</b> und <b>Verarbeitungszeit</b>. Verspätete Ereignisse liegen in der Differenz.",
          "Eine <b>Watermark</b> markiert den Fortschritt in der Ereigniszeit. Die Nachzüglerregel entscheidet über Aktualisierung, Umleitung oder Verwerfen.",
          "Die Anbieterwahl belegt weder Aktualität noch Vollständigkeit. Beides gibst du pro Pipeline-Ausgabe an.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch1IngestDe;
