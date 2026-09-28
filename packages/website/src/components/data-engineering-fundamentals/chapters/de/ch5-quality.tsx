import { DQ_OPERATOR_PY } from "../ch5-quality";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { AntiPatterns, BestPractices, CodeBlock, Hero, SectionLabel } from "../../primitives";
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
        hook="Ein erfolgreicher Task kann trotzdem unvollständige, veraltete, doppelte oder schemawidrige Daten schreiben. Jede Prüfung zeigt, ob eine benannte Eigenschaft erfüllt ist. Bestandene Prüfungen belegen nicht, dass jeder Wert stimmt."
        meta={[
          { k: "Prüfwerkzeug", v: "ExpectationSuite" },
          { k: "Schranke", v: "Signaltabelle + ExternalTaskSensor" },
          { k: "Ziele", v: "pro Datensatz festgelegt" },
        ]}
      />

      <section className="section">
        <SectionLabel n="6.1">Die Kernprüfungen</SectionLabel>
        <h2 className="h2">Jede Prüfung fängt einen anderen Fehler.</h2>
        <ul className="prose">
          <li>
            <b>Zeilenzahlband:</b> Vergleich die Partition mit einer tabellenspezifischen Basislinie und Schwelle, um leere oder unvollständige
            Schreibvorgänge und Quelländerungen zu finden.
          </li>
          <li>
            <b>Schemaabgleich:</b> Vergleich das beobachtete Schema mit dem versionierten Vertrag und seiner Kompatibilitätsregel.
          </li>
          <li>
            <b>Aktualität:</b> Prüf die benannte Partition oder den Ereigniszeit-Stichtag gegen das Ziel des Datensatzes.
          </li>
          <li>
            <b>Eindeutigkeit:</b> Prüf den deklarierten Schlüssel auf der deklarierten Granularität. Nicht jede Faktentabelle hat einen
            Primärschlüssel mit genau einer Zeile.
          </li>
        </ul>
        <TrustMeterSim />
      </section>

      <section className="section">
        <SectionLabel n="6.2">Die Signaltabelle als Schranke</SectionLabel>
        <h2 className="h2">Konfigurierte Verbraucher auf ein benanntes Qualitätssignal warten lassen.</h2>
        <p className="prose">
          Hier laufen die Prüfungen nach dem Schreiben einer Partition und vor den abhängigen Tasks. Bestehen sie, entsteht eine Zeile in einer{" "}
          <b>Signaltabelle</b>, und Verbraucher mit einem <code>ExternalTaskSensor</code> warten darauf. Die Datentabelle bleibt lesbar, also
          braucht der Zugriff eine eigene Kontrolle, und das Alarm-Routing muss konfiguriert und getestet sein.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Ohne Schranke</div>
            <div className="ccard-n">Verbraucher wartet auf die Datentabelle</div>
            <div className="ccard-d">
              Unvollständige oder fehlerhafte Daten sind nach dem Commit
              lesbar. Eine Wiederholung kommt erst, wenn die Verbraucher
              schon gelaufen sind.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Mit Schranke</div>
            <div className="ccard-n">Verbraucher wartet auf die Signaltabelle</div>
            <div className="ccard-d">
              Konfigurierte Tasks warten, bis die Prüfungen bestanden sind. Andere Leser kommen ohne getrennte Zugriffskontrolle weiter durch.
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
          "<b>Prüfungen ohne Datensatzvertrag ergänzen.</b> Eine Schwelle braucht Granularität, Basislinie, Ausnahmeregel und Zuständigkeit.",
          "<b>Ein Signal veröffentlichen, das Verbraucher nicht verlangen.</b> Abhängigkeiten prüfen; eine Signalzeile sperrt keine direkten Tabellenzugriffe.",
          "<b>Ein Aktualitätsziel ohne Alarmverantwortung deklarieren.</b> Halt Ziel, Messpunkt, Routing und erwartete Reaktion fest.",
          "<b>Nur <code>assert len(df) &gt; 0</code> prüfen.</b> Eine Zeile besteht das auch nach einem Quellausfall. Zeilenzahlbänder und Prüfungen für wahrscheinliche Fehler nutzen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Prüfungen aus <b>Granularität, Schlüssel, Aktualitätsziel, Quellverhalten und Verbraucherrisiko</b> der Tabelle auswählen.",
          "<b>Signaltabellen als dauerhafte Schnittstellen behandeln.</b> Sie heißen <code>&lt;table&gt;__signal</code>; Wiederholungen, Backfills und Audits lesen sie.",
          "<b>DQ-Konfiguration in die Versionsverwaltung legen.</b> Änderungen werden wie Code geprüft; eine nur in einer Oberfläche gepflegte Regel driftet unbemerkt.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch5QualityDe;
