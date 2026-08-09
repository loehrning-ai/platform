import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../../primitives";
import { ConveyorSim } from "../../simulators/conveyor-sim";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { DEDUP_SQL } from "../ch1-5-streaming";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch15StreamingDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch15StreamingDe({ chapter }: Ch15StreamingDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Streaming: <span class='accent'>Zustellung, Fenster und Veröffentlichung.</span>"
        hook="In der Kursarchitektur transportiert Kafka Ereignisse, und Flink verarbeitet sie. Kafka Streams ist eine alternative Verarbeitungsbibliothek und keine Schicht unter Flink. Eine veröffentlichte Ausgabe benötigt klare Angaben zu Zustellung, Fenstern und Vollständigkeit."
        meta={[
          { k: "Streaming-Engine", v: "Flink" },
          { k: "Bus", v: "Kafka" },
          { k: "Batch-Takt", v: "durch das Datensatz-SLO festgelegt" },
        ]}
      />

      <section className="section">
        <SectionLabel n="2.1">Kontinuierliche Verarbeitung</SectionLabel>
        <h2 className="h2">Micro-Batch oder kontinuierlich, Exactly Once oder At Least Once.</h2>
        <p className="prose">Batch-Engines verarbeiten begrenzte Eingaben nach einem Zeitplan. Streaming-Engines verarbeiten eine fortlaufende Eingabe und halten Zustand. Beide können richtige oder falsche Ergebnisse erzeugen. Ihre Verträge unterscheiden sich darin, wann ein Ergebnis erscheint, wann es endgültig ist und wie Wiederholungen, Duplikate und Nachzügler behandelt werden.</p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">Latenz</div>
            <div className="ccard-n">Veröffentlichungstakt</div>
            <div className="ccard-d">Für operative Ansichten und abgeschlossene Berichte getrennte Aktualitätsziele festlegen und messen.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Zustellung</div>
            <div className="ccard-n">Verarbeitungsgrenze festlegen</div>
            <div className="ccard-d">Exactly-Once-Aussagen hängen von Quell-Offsets, Zustands-Checkpoints und transaktionalen oder idempotenten Zielen ab.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Fenster</div>
            <div className="ccard-n">Tumbling · Sliding · Session</div>
            <div className="ccard-d">Festlegen, ob Nachzügler ein Fenster aktualisieren, in ein späteres Fenster gelangen, getrennt ausgegeben oder verworfen werden.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="2.2">Das Problem an der Systemgrenze</SectionLabel>
        <h2 className="h2">Die Kursgrenze modelliert Wiederholungsschutz und Watermark.</h2>
        <p className="prose">Wiederholungen und Wiederherstellung können Datensätze erneut zustellen; Ereigniszeit und Ankunftszeit können abweichen. An der Warehouse-Grenze schützen idempotentes Schreiben oder ein deterministischer Deduplizierungsschlüssel vor Wiederholungen. Watermark und Nachzüglerregel steuern Veröffentlichung und spätere Datensätze. Der Simulator zeigt beide Kontrollen getrennt.</p>
        <ConveyorSim />
      </section>

      <section className="section">
        <SectionLabel n="2.3">Vorlage für die Deduplizierung</SectionLabel>
        <CodeBlock title="fct_events_dedup.sql · Warehouse-Grenze" lang="SQL" html={DEDUP_SQL} />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Eine frühe Schätzung ohne Status veröffentlichen.</b> Kennzeichnen, ob ein Ergebnis stichprobenbasiert, vorläufig oder abgeschlossen ist, und den Quellenstichtag angeben.",
          "<b>Eine Zustellungszusage des Produzenten als Ende-zu-Ende-Garantie behandeln.</b> Quelle, Prozessor, Zustand und Ziel bei Wiederholung und Wiederherstellung prüfen.",
          "<b>Einen Rollup unabhängig vom Fortschritt der Ereigniszeit planen.</b> Veröffentlichung an die dokumentierte Watermark oder ein Vollständigkeitssignal koppeln.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Signaltabelle pro Stream.</b> Eine kleine getrennte Tabelle vermerkt, wann die Watermark für ein Paar aus Quelle und <code>ds</code> geschlossen wurde. Ein nachgelagerter ExternalTaskSensor wartet auf das <em>Signal</em>, nicht auf die Daten.",
          "<b>Wiederholungsempfindliche Schreibvorgänge schützen.</b> Bei möglichen Duplikaten einen stabilen Ereignisschlüssel mit idempotentem Upsert oder deterministischer Deduplizierung verwenden.",
          "<b>Vorläufige und abgeschlossene Ausgaben abgleichen.</b> Takt und Toleranz aus dem Datensatz-SLO ableiten und anhaltende Differenzen untersuchen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Streaming- und Batch-Ausgaben benötigen klare Angaben zu <b>Aktualität, Vollständigkeit und Endgültigkeit</b>.",
          "Wiederholungsschutz und Nachzüglerbehandlung lösen unterschiedliche Fehlerarten. Beide werden dort eingerichtet, wo der Vertrag sie verlangt.",
          "Ein Abschlusssignal erst veröffentlichen, wenn die benannten Prüfungen und Watermark-Bedingungen erfüllt sind.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch15StreamingDe;
