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
        hook="Fehlwerte, Einheiten, Zeitstempel, Joins, Duplikate und Information von nach dem Ergebnis verschieben Estimand und verfügbares Signal. Prüf jede Transformation innerhalb der Validierungsgrenze."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Fehlwerte · Imputation · Skalierung · Leakage" },
          { k: "Simulationen", v: "4 interaktiv" },
        ]}
      />

      <section className="section">
        <SectionLabel n="03.1">Fehlwertmechanismen</SectionLabel>
        <h2 className="h2">Fehlt ist nicht gleich fehlt.</h2>
        <p className="prose">
          Drei Mechanismen, drei Annahmen. <strong>MCAR</strong> bedeutet, dass
          das Fehlen von beobachteten und unbeobachteten Werten unabhängig ist;
          vollständige Fälle bleiben für bestimmte Estimands unverzerrt und
          kosten trotzdem Information. <strong>MAR</strong> bedeutet, dass
          andere beobachtete Spalten das Fehlen erklären, etwa eine
          übersprungene deutsche Umfrageseite für EU-Nutzer.{" "}
          <strong>MNAR</strong> bedeutet, dass der fehlende Wert seine eigene
          Abwesenheit vorhersagt, etwa wenn Personen mit hohem Einkommen die
          Einkommensfrage auslassen. Der dritte Fall ist der teure: Er braucht
          zusätzliche Annahmen, Sensitivitätsanalyse oder ein Modell des
          Fehlprozesses.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Bei MNAR steigt die Fehlrate im oberen Wertebereich deutlich, und eine
          Imputation mit dem beobachteten Mittelwert schätzt den echten
          Mittelwert zu niedrig. Ein Indikator wie{" "}
          <code>feature_was_missing</code> ist ein Kandidat, sofern er zum
          Vorhersagezeitpunkt verfügbar ist, in der Validierung trägt und kein
          unzulässiger Proxy für Prozessänderungen oder sensible Gruppen ist.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">
          Lücken füllen, ohne die Verteilung zu verfälschen.
        </h2>
        <p className="prose">
          Mittelwert-Imputation drückt die Varianz. Forward-Fill baut in
          Zeitreihen künstliche Plateaus. KNN kostet Rechenzeit und bildet bei
          sinnvoller Distanz lokale Struktur ab. Die Demo hier kennt die
          synthetische Wahrheit; bei echten Fehlwerten vergleichst du Verfahren
          und Unsicherheit über konstruierte Holdouts und Sensitivitätsanalysen.
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Fehlmuster bei Imputation"
          items={[
            "<b>Mit dem Mittelwert des vollständigen Datensatzes imputieren.</b> Der Imputer gehört ausschließlich auf den Trainingssatz.",
            "<b>Einen Füllwert wählen, ohne den Estimand zu prüfen.</b> Weder Mittelwert noch Median erhalten gemeinsame Beziehungen oder Imputationsunsicherheit; vergleich die Verfahren im Validierungsdesign.",
            "<b>Die Imputationsherkunft verschwinden lassen.</b> Halt fest, welche Werte imputiert wurden. Einen Fehlwertindikator nimmst du nur bei Inferenzverfügbarkeit und geprüftem Nutzen.",
            "<b>KNN mit ungeeigneter Distanz fahren.</b> Numerische Eingaben bei dominierenden Einheiten skalieren, gemischte Daten gezielt kodieren, Nachbarn in der Validierung abstimmen.",
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
          Regularisierte lineare Modelle bestrafen große Koeffizienten. Ein
          Einkommenskoeffizient in Rohwährung ist von Natur aus klein, also
          entscheidet die Einheit über effektive Regularisierung und
          Interpretation. Distanzbasierte Verfahren wie kNN, Kernel-SVM und PCA
          trifft es genauso, weil Distanzen im Wertebereich 200,000 den
          Altersbereich übertönen. Skalierung stellt vergleichbare
          Größenordnungen her.
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
          tragen, die zum Vorhersagezeitpunkt nicht verfügbar wäre. Hinweise
          sind unplausibel starke Validierung, nach dem Zielereignis erfasste
          Merkmale, ein Einbruch bei zeit- oder gruppengerechter Aufteilung.
          Starke Werte beweisen Leakage nicht. Normale Werte schließen es nicht
          aus.
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
            "<b>Den Scaler auf dem vollständigen Datensatz anpassen.</b> Damit sieht das Training Teststatistiken.",
            "<b>Target Encoding ohne Out-of-Fold-Berechnung.</b> Sonst fließt jede Zeile in ihre eigene Kodierung ein.",
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
          "<b>Fehlwertherkunft ist Information.</b> Heb sie für Audits auf; als Merkmal nimmst du einen Indikator erst nach geprüfter Inferenzverfügbarkeit und Validierungsnutzen.",
          "<b>Der Mechanismus ist eine Annahme, kein Messwert.</b> MCAR, MAR und MNAR liest niemand automatisch aus den Daten ab; Sensitivitätsanalyse gehört zur Behandlung.",
          "<b>Skalierung hängt von Algorithmus und Pipeline ab.</b> Nur auf Trainingsfolds anpassen und dokumentieren, was mit Werten außerhalb des Trainingsbereichs passiert.",
          "<b>Leakage kann vor dem Betrieb sichtbar werden.</b> Zeit- oder gruppengerechte Splits, Zeitstempel, Herkunftsnachweise und fold-lokale Vorverarbeitung sind direkte Prüfungen, kein Beweis vollständiger Abwesenheit.",
          "<b>Datenbereinigung ist fortlaufend.</b> Jedes neue Merkmal, jeder Join und jede Aggregation kann Fehler oder Leakage einführen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
