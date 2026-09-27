import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../../primitives";
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
        hook="Kafka transportiert die Ereignisse, Flink verarbeitet sie. Kafka Streams ist eine alternative Bibliothek, keine Schicht unter Flink."
        meta={[
          { k: "Streaming-Engine", v: "Flink" },
          { k: "Bus", v: "Kafka" },
          { k: "Batch-Takt", v: "durch das Datensatz-SLO festgelegt" },
        ]}
      />

      <section className="section">
        <SectionLabel n="2.1">Kontinuierliche Verarbeitung</SectionLabel>
        <h2 className="h2">Micro-Batch oder kontinuierlich, Exactly Once oder At Least Once.</h2>
        <p className="prose">Batch-Engines verarbeiten begrenzte Eingaben nach einem Zeitplan. Streaming-Engines verarbeiten eine fortlaufende Eingabe und halten Zustand. Beide können richtig oder falsch liegen; der Vertrag legt fest, wann ein Ergebnis erscheint, wann es endgültig ist und was mit Wiederholungen, Duplikaten und Nachzüglern passiert.</p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">Latenz</div>
            <div className="ccard-n">Veröffentlichungstakt</div>
            <div className="ccard-d">Getrennte Aktualitätsziele für operative Ansichten und abgeschlossene Berichte.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Zustellung</div>
            <div className="ccard-n">Verarbeitungsgrenze</div>
            <div className="ccard-d">Exactly-Once-Aussagen hängen von Quell-Offsets, Zustands-Checkpoints und transaktionalen oder idempotenten Zielen ab.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Fenster</div>
            <div className="ccard-n">Tumbling · Sliding · Session</div>
            <div className="ccard-d">Nachzügler aktualisieren ein Fenster, landen in einem späteren, gehen in eine getrennte Ausgabe oder werden verworfen.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="2.2">Das Problem an der Systemgrenze</SectionLabel>
        <h2 className="h2">Die Kursgrenze modelliert Wiederholungsschutz und Watermark.</h2>
        <p className="prose">Wiederholungen und Wiederherstellung stellen Datensätze erneut zu, und Ereigniszeit und Ankunftszeit laufen auseinander. An der Warehouse-Grenze fangen idempotentes Schreiben oder ein deterministischer Deduplizierungsschlüssel die Wiederholungen ab. Watermark und Nachzüglerregel steuern Veröffentlichung und spätere Datensätze. Schalte jede Kontrolle einzeln, um ihre Wirkung zu sehen.</p>
        <ConveyorSim />
      </section>

      <section className="section">
        <SectionLabel n="2.3">Vorlage für die Deduplizierung</SectionLabel>
        <CodeBlock title="fct_events_dedup.sql · Warehouse-Grenze" lang="SQL" html={DEDUP_SQL} />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Eine frühe Schätzung ohne Status veröffentlichen.</b> Kennzeichne sie als stichprobenbasiert, vorläufig oder abgeschlossen und nenn den Quellenstichtag.",
          "<b>Eine Zustellzusage des Produzenten als Ende-zu-Ende-Garantie behandeln.</b> Quelle, Prozessor, Zustand und Ziel bei Wiederholung und Wiederherstellung prüfen.",
          "<b>Einen Rollup unabhängig vom Fortschritt der Ereigniszeit planen.</b> Veröffentlichung an die dokumentierte Watermark oder ein Vollständigkeitssignal koppeln.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Signaltabelle pro Stream.</b> Eine kleine Tabelle vermerkt, wann die Watermark für ein Paar aus Quelle und <code>ds</code> geschlossen wurde. Ein nachgelagerter ExternalTaskSensor wartet auf das <em>Signal</em>, nicht auf die Daten.",
          "<b>Vorläufige und abgeschlossene Ausgaben abgleichen.</b> Takt und Toleranz aus dem Datensatz-SLO ableiten und anhaltende Differenzen untersuchen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch15StreamingDe;
