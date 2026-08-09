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
        hook="Die Referenzpipeline des Kurses schreibt eine stichprobenbasierte operative Sicht nach ClickHouse und einen vollständigen geplanten Batch nach Snowflake. Eine Watermark schließt jedes Ereigniszeitfenster; die konfigurierte Nachzüglerregel bestimmt die weitere Behandlung."
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
        <p className="prose">In der Kursarchitektur transportiert Kafka die Ereignisse, und ein Flink-Job verarbeitet sie vor getrennten operativen und Batch-Schreibvorgängen. Die <b>Watermark</b> beschreibt den Fortschritt in der Ereigniszeit. Eine konfigurierte Regel kann ein Fenster aktualisieren, Nachzügler getrennt ausgeben oder sie verwerfen.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.2">Der Zielkonflikt im Simulator</SectionLabel>
        <h2 className="h2">Wie lange wartet ein Zeitfenster?</h2>
        <p className="prose">Verschiebe die blaue Linie. Grüne Punkte treffen vor der simulierten Watermark ein, gelbe Punkte danach. Dieser Simulator verwirft Nachzügler. Eine Produktionspipeline kann Rohdaten stattdessen behalten und verspätete Datensätze getrennt verarbeiten oder neu einlesen. Die Wahl verändert Veröffentlichungsverzug und Vollständigkeit.</p>
        <WatermarkSim />
        <p className="prose" style={{ marginTop: 22 }}>Die Watermark wird aus der beobachteten Verspätungsverteilung und der zulässigen Veröffentlichungsverzögerung abgeleitet. Der Anteil nach Schließung eintreffender Daten wird überwacht; bei veränderter Verteilung wird die Regel angepasst.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.3">Zwei Speicher, zwei Aufgaben</SectionLabel>
        <h2 className="h2">Operative Sicht und vollständigen Batch trennen.</h2>
        <p className="prose">Diese Rollen gehören zur Referenzarchitektur und sind keine festen Eigenschaften der Anbieter. Die Stichprobe dient der operativen Prüfung. Der geplante Batch dient reproduzierbaren Berichten, sobald Quelle, Vollständigkeitsprüfungen und Nachzüglerregel bekannt sind.</p>
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
          "<b>Nachzügler ohne Wiederherstellungspfad verwerfen.</b> Ein unveränderliches Rohprotokoll oder eine getrennte Ausgabe behalten, wenn spätere Korrekturen erforderlich sind.",
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
          "Die Anbieterwahl belegt weder Aktualität noch Vollständigkeit. Diese Eigenschaften müssen pro Pipeline-Ausgabe angegeben werden.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch1IngestDe;
