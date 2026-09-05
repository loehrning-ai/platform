import { DQ_OPERATOR_PY } from "../ch5-quality";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import {
  AntiPatterns,
  BestPractices,
  CodeBlock,
  Hero,
  SectionLabel,
  Takeaway,
} from "../../primitives";
import { TrustMeterSim } from "../../simulators/trust-meter-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch5QualityDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch5QualityDe({ chapter }: Ch5QualityDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Qualität: Eine Pipeline, die <span class='accent'>lief</span>, ist noch keine Pipeline, die <span class='accent'>korrekt</span> lief."
        hook="Ein grüner Task schreibt genauso unvollständige, veraltete, doppelte oder schemawidrige Daten wie ein roter. Qualitätsprüfungen belegen ausgewählte Eigenschaften. Dass jeder Wert und jede fachliche Definition stimmt, belegen sie nicht."
        meta={[
          { k: "Prüfwerkzeug", v: "ExpectationSuite" },
          { k: "Schranke", v: "Signaltabelle + ExternalTaskSensor" },
          { k: "Ziele", v: "pro Datensatz festgelegt" },
        ]}
      />

      <section className="section">
        <SectionLabel n="6.1">Prüfungen sind günstig, Fehler teuer</SectionLabel>
        <h2 className="h2">Vier Prüfungen für unterschiedliche Fehlerarten.</h2>
        <p className="prose">
          <b>Zeilenzahlband:</b> Vergleich die aktuelle Partition mit einer tabellenspezifischen Basislinie und Schwelle. Das fängt leere oder
          unvollständige Schreibvorgänge und Quelländerungen ab.
          <br />
          <b>Schemaabgleich:</b> Stell das beobachtete Schema neben den versionierten Vertrag und seine Kompatibilitätsregel.
          <br />
          <b>Aktualität:</b> Halt die benannte Partition oder den Ereigniszeit-Stichtag gegen das Ziel des Datensatzes.
          <br />
          <b>Eindeutigkeit:</b> Prüf den deklarierten Schlüssel auf der deklarierten Granularität. Nicht jede Faktentabelle hat einen
          Primärschlüssel mit genau einer Zeile.
        </p>
        <TrustMeterSim />
      </section>

      <section className="section">
        <SectionLabel n="6.2">Die Signaltabelle als Schranke</SectionLabel>
        <h2 className="h2">Konfigurierte Verbraucher auf ein benanntes Qualitätssignal warten lassen.</h2>
        <p className="prose">
          Im Referenzdesign laufen die Prüfungen nach dem Schreiben einer Partition und vor den abhängigen Tasks. Bestehen die ausgewählten
          Prüfungen, entsteht eine Zeile in einer <b>Signaltabelle</b>, und Verbraucher mit einem <code>ExternalTaskSensor</code> warten darauf.
          Lesbar bleibt die Datentabelle trotzdem: Sichtbarkeit und Zugriff brauchen getrennte Kontrollen. Und das Alarm-Routing gehört
          konfiguriert und getestet.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Ohne Schranke</div>
            <div className="ccard-n">Verbraucher wartet auf die Datentabelle</div>
            <div className="ccard-d">
              Unvollständige oder fehlerhafte Daten sind direkt nach dem Commit
              lesbar. Die Wiederholung danach kommt zu spät, die Verbraucher
              sind längst gelaufen.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Mit Schranke</div>
            <div className="ccard-n">Verbraucher wartet auf die Signaltabelle</div>
            <div className="ccard-d">
              Konfigurierte Tasks warten, bis die ausgewählten Prüfungen bestanden sind. Andere Leser bleiben ohne getrennte Zugriffskontrolle möglich.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="6.3">Der Operator</SectionLabel>
        <CodeBlock
          title="pipeline.py · ExpectationSuite + ExternalTaskSensor"
          lang="Python"
          html={DQ_OPERATOR_PY}
        />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Prüfungen ohne Datensatzvertrag ergänzen.</b> Eine Schwelle benötigt Granularität, Basislinie, Ausnahmeregel und Zuständigkeit.",
          "<b>Ein Signal veröffentlichen, das Verbraucher nicht verlangen.</b> Abhängigkeiten prüfen; eine Signalzeile schränkt direkte Tabellenzugriffe nicht ein.",
          "<b>Ein Aktualitätsziel ohne Alarmverantwortung deklarieren.</b> Halt Ziel, Messpunkt, Routing und erwartete Reaktion fest.",
          "<b>Nur <code>assert len(df) &gt; 0</code> prüfen.</b> Eine einzelne Zeile besteht diese Prüfung auch bei einem Quellausfall. Zeilenzahlbänder statt bloßer Plausibilitätsprüfung verwenden.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Prüfungen aus <b>Granularität, Schlüssel, Aktualitätsziel, Quellverhalten und Verbraucherrisiko</b> der Tabelle auswählen.",
          "<b>Signaltabellen sind dauerhafte Schnittstellen.</b> Sie heißen <code>&lt;table&gt;__signal</code> und werden von Wiederholungen, Backfills und Audits gelesen.",
          "Aktualitäts- und Reaktionsziele pro Datensatz mit Zuständigkeit und getestetem Alarmweg festlegen.",
          "<b>DQ-Konfiguration liegt in der Versionsverwaltung.</b> Änderungen werden wie Code geprüft; eine nur in einer Oberfläche gepflegte Regel driftet unbemerkt.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Qualitätsprüfungen liefern Nachweise zu benannten Eigenschaften; sie zertifizieren nicht die vollständige fachliche Bedeutung eines Datensatzes.",
          "Zeilenzahl, Schema, Aktualität und Eindeutigkeit decken unterschiedliche Risiken ab und wollen je Tabelle eigene Konfiguration.",
          "Ein Signal ist nur nützlich, wenn es die bestandenen Prüfungen benennt und abhängige Verbraucher es verlangen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch5QualityDe;
