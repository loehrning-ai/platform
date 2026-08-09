import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { MissingnessSim } from "@/components/data-science/simulators/missingness-sim";
import { ImputationRace } from "@/components/data-science/simulators/imputation-race";
import { ScalerDemo } from "@/components/data-science/simulators/scaler-demo";
import { LeakageDetector } from "@/components/data-science/simulators/leakage-detector";

export default function Ch03CleanDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 03 · Datenbereinigung"
        title='Datenqualität bestimmt, <em><span class="accent">was das Modell lernen kann.</span></em>'
        hook="Fehlwerte, Einheiten, Zeitstempel, Joins, Duplikate und Information nach dem Ergebnis verändern Estimand und verfügbares Signal. Jede Transformation innerhalb der Validierungsgrenze prüfen."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Fehlwerte · Imputation · Skalierung · Leakage" },
          { k: "Simulationen", v: "4 interaktiv" },
        ]}
      />

      <section className="section">
        <SectionLabel n="03.1">Fehlwertmechanismen</SectionLabel>
        <h2 className="h2">
          Fehlwerte entstehen aus unterschiedlichen Mechanismen.
        </h2>
        <p className="prose">
          Drei Mechanismen beschreiben unterschiedliche Annahmen.{" "}
          <strong>MCAR</strong> bedeutet, dass das Fehlen von beobachteten und
          unbeobachteten Werten unabhängig ist. Vollständige Fälle können dann
          für bestimmte Estimands unverzerrt bleiben, verlieren aber
          Information. <strong>MAR</strong>
          bedeutet, dass das Fehlen durch andere beobachtete Spalten erklärbar
          ist, etwa eine übersprungene deutsche Umfrageseite für EU-Nutzer.{" "}
          <strong>MNAR</strong> bedeutet, dass der fehlende Wert seine eigene
          Abwesenheit vorhersagt, etwa wenn Personen mit hohem Einkommen die
          Einkommensfrage auslassen. MNAR benötigt zusätzliche Annahmen,
          Sensitivitätsanalyse oder ein explizites Modell des Fehlprozesses.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Bei MNAR steigt die Fehlrate im oberen Wertebereich deutlich. Eine
          Imputation mit dem beobachteten Mittelwert unterschätzt dann den
          tatsächlichen Mittelwert. Ein Indikator wie{" "}
          <code>feature_was_missing</code> ist ein Kandidat, wenn er zum
          Vorhersagezeitpunkt verfügbar ist, in der Validierung trägt und keinen
          unzulässigen Proxy für Prozessänderungen oder sensible Gruppen bildet.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">
          Lücken füllen, ohne die Verteilung zu verfälschen.
        </h2>
        <p className="prose">
          Mittelwert-Imputation verringert die Varianz. Forward-Fill kann in
          Zeitreihen künstliche Plateaus erzeugen. KNN-Imputation ist
          aufwendiger, kann aber bei sinnvoller Distanz lokale Struktur
          abbilden. Die folgende Demo kennt die synthetische Wahrheit. Bei
          realen Fehlwerten erfordern Methodenvergleich und Unsicherheit
          konstruierte Holdouts sowie Sensitivitätsanalysen.
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Fehlmuster bei Imputation"
          items={[
            "<b>Mit dem Mittelwert des vollständigen Datensatzes imputieren.</b> Der Imputer wird ausschließlich auf dem Trainingssatz angepasst.",
            "<b>Einen einzelnen Füllwert ohne Prüfung des Estimands wählen.</b> Weder Mittelwert noch Median erhalten gemeinsame Beziehungen oder Imputationsunsicherheit; Verfahren im Validierungsdesign vergleichen.",
            "<b>Imputationsherkunft verbergen.</b> Erfassen, welche Werte imputiert wurden. Einen Fehlwertindikator nur bei Verfügbarkeit zur Inferenz und geprüftem Nutzen verwenden.",
            "<b>KNN mit ungeeigneter Distanz verwenden.</b> Numerische Eingaben bei dominierenden Einheiten skalieren, gemischte Daten gezielt kodieren und Nachbarn in der Validierung abstimmen.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.3">Merkmalsskalierung</SectionLabel>
        <h2 className="h2">
          Einkommen bei 150,000, Alter bei 34.{" "}
          <em>Ohne Skalierung dominieren Einheiten das Modell.</em>
        </h2>
        <p className="prose">
          Regularisierte lineare Modelle bestrafen große Koeffizienten, während
          ein Einkommenskoeffizient in Rohwährung natürlicherweise klein ist.
          Die Einheit verändert dadurch effektive Regularisierung und
          Koeffizienteninterpretation. Distanzbasierte Verfahren wie kNN,
          Kernel-SVM und PCA sind ebenfalls empfindlicher: Distanzen im
          Wertebereich 200,000 überlagern den Altersbereich. Skalierung stellt
          vergleichbare Größenordnungen her.
        </p>
        <ScalerDemo />
        <BestPractices
          title="Regeln für Skalierung"
          items={[
            "<b>StandardScaler für zentrierte und varianzskalierte Eingaben.</b> Normalität ist nicht erforderlich; Mittelwert und Standardabweichung reagieren aber auf Ausreißer.",
            "<b>MinMaxScaler für einen erlernten numerischen Bereich.</b> Werte außerhalb des Trainingsbereichs können außerhalb [0, 1] liegen; Trainingsextreme komprimieren die übrigen Werte.",
            "<b>RobustScaler bei realen Ausreißern.</b> Median und IQR verhindern, dass Randwerte die Skala aller Beobachtungen bestimmen.",
            "<b>Gewöhnliche Entscheidungsbaum-Splits benötigen meist keine Skalierung.</b> Monotone Skalierung erhält die Reihenfolge; gemeinsame Pipelines, numerische Präzision oder andere Modellteile können sie dennoch rechtfertigen.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.4">Data Leakage</SectionLabel>
        <h2 className="h2">
          Leakage lässt nicht verfügbare Information prädiktiv erscheinen.
        </h2>
        <p className="prose">
          <strong>Leakage</strong> liegt vor, wenn Trainingsmerkmale Information
          enthalten, die zum Vorhersagezeitpunkt nicht verfügbar wäre. Hinweise
          sind unplausibel starke Validierung, nach dem Zielereignis erfasste
          Merkmale oder ein Einbruch bei zeit- oder gruppengerechter Aufteilung.
          Starke Werte allein beweisen Leakage nicht; normale Werte schließen es
          nicht aus.
        </p>
        <p className="prose">
          Drei Formen sind besonders häufig: <strong>Target Leakage</strong>,
          bei dem ein Merkmal das Label direkt kodiert;{" "}
          <strong>temporales Leakage</strong> durch Daten nach dem
          Vorhersagezeitpunkt; und <strong>Train-Test-Kontamination</strong>,
          wenn Vorverarbeitung den Testsatz gesehen hat.
        </p>
        <LeakageDetector />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Den Scaler auf dem vollständigen Datensatz anpassen.</b> Der Trainingsprozess sieht dadurch Teststatistiken.",
            "<b>Target Encoding ohne Out-of-Fold-Berechnung.</b> Jede Zeile fließt sonst in ihre eigene Kodierung ein.",
            "<b>Merkmale nach dem Ereignis verwenden.</b> <code>total_purchases_lifetime</code> darf für <code>will_churn</code> keine Käufe nach dem Churn-Zeitpunkt enthalten.",
            "<b>Den Testsatz während der EDA untersuchen.</b> Jede daraus abgeleitete Anpassung überträgt Testinformation in den Entwicklungsprozess.",
          ]}
        />
        <BestPractices
          title="Saubere Umsetzung"
          items={[
            "<b>Die Evaluationsaufteilung vor erlernter Vorverarbeitung definieren.</b> Einen finalen Testanteil von Modell- und Merkmalsentscheidungen trennen.",
            "<b>Eine angepasste Pipeline innerhalb der Kreuzvalidierung verwenden.</b> Eine korrekt konfigurierte <code>Pipeline</code> hält erlernte Transformationen in Trainingsfolds; semantisches oder temporales Leakage verhindert sie nicht allein.",
            "<b>Zeitgerechte Evaluation verwenden, wenn der Einsatz die Zukunft vorhersagt.</b> Rollende, expandierende oder feste Stichtage an den tatsächlichen Entscheidungszeitpunkt anpassen.",
            "<b>Für jedes Merkmal den Verfügbarkeitszeitpunkt angeben.</b> Ein Merkmal, das erst nach dem Ergebnis existiert, ist unzulässig.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Fehlwertherkunft ist Information.</b> Für Audits erhalten; einen Indikator nur nach Prüfung von Inferenzverfügbarkeit und Validierungsnutzen als Merkmal verwenden.",
          "<b>Der Mechanismus ist eine Annahme.</b> MCAR, MAR und MNAR werden nicht automatisch aus den Daten erkannt; Sensitivitätsanalyse gehört zur Behandlung.",
          "<b>Skalierung hängt von Algorithmus und Pipeline ab.</b> Nur auf Trainingsfolds anpassen und den Umgang mit Werten außerhalb des Trainingsbereichs dokumentieren.",
          "<b>Leakage kann vor dem Betrieb sichtbar werden.</b> Zeit- oder gruppengerechte Splits, Zeitstempel, Herkunftsnachweise und fold-lokale Vorverarbeitung sind direkte Prüfungen, kein Beweis vollständiger Abwesenheit.",
          "<b>Datenbereinigung ist fortlaufend.</b> Jedes neue Merkmal, jeder Join und jede Aggregation kann Fehler oder Leakage einführen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
