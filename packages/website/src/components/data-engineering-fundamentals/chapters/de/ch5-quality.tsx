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
        hook="Ein erfolgreicher Task kann unvollständige, veraltete, doppelte oder schemawidrige Daten schreiben. Qualitätsprüfungen liefern Nachweise zu ausgewählten Eigenschaften. Sie beweisen nicht, dass jeder Wert oder jede fachliche Definition korrekt ist."
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
          <b>Zeilenzahlband:</b> Die aktuelle Partition mit einer tabellenspezifischen Basislinie und Schwelle vergleichen. Das kann leere oder
          unvollständige Schreibvorgänge sowie Quelländerungen erkennen.
          <br />
          <b>Schemaabgleich:</b> Das beobachtete Schema mit dem versionierten Vertrag und seiner Kompatibilitätsregel vergleichen.
          <br />
          <b>Aktualität:</b> Die benannte Partition oder den Ereigniszeit-Stichtag gegen das Ziel des Datensatzes prüfen.
          <br />
          <b>Eindeutigkeit:</b> Den deklarierten Schlüssel auf der deklarierten Granularität prüfen. Nicht jede Faktentabelle besitzt einen
          Primärschlüssel mit genau einer Zeile.
        </p>
        <TrustMeterSim />
      </section>

      <section className="section">
        <SectionLabel n="6.2">Die Signaltabelle als Schranke</SectionLabel>
        <h2 className="h2">Konfigurierte Verbraucher auf ein benanntes Qualitätssignal warten lassen.</h2>
        <p className="prose">
          Im Referenzdesign laufen Prüfungen nach dem Schreiben einer Partition und vor abhängigen Tasks. Bestandene ausgewählte Prüfungen
          erzeugen eine Zeile in einer <b>Signaltabelle</b>. Verbraucher mit einem <code>ExternalTaskSensor</code> können darauf warten. Die
          Datentabelle kann technisch weiterhin lesbar sein; Sichtbarkeit und Zugriff benötigen getrennte Kontrollen. Auch Alarm-Routing muss
          konfiguriert und getestet werden.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Ohne Schranke</div>
            <div className="ccard-n">Verbraucher wartet auf die Datentabelle</div>
            <div className="ccard-d">
              Unvollständige oder fehlerhafte Daten sind direkt nach dem Commit
              lesbar. Eine spätere Wiederholung kommt zu spät: Verbraucher
              wurden bereits ausgeführt.
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
          "<b>Ein Aktualitätsziel ohne Alarmverantwortung deklarieren.</b> Ziel, Messpunkt, Routing und erwartete Reaktion festhalten.",
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
          "Zeilenzahl, Schema, Aktualität und Eindeutigkeit adressieren unterschiedliche Risiken und benötigen tabellenspezifische Konfiguration.",
          "Ein Signal ist nur nützlich, wenn es die bestandenen Prüfungen benennt und abhängige Verbraucher es verlangen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch5QualityDe;
