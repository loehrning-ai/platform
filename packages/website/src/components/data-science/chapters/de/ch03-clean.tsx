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
        hook="Fehlwerte, Einheiten, Zeitstempel, Joins, Duplikate und Information aus der Zeit nach dem Ergebnis verschieben Estimand und Signal. Prüf jede Transformation innerhalb der Validierungsgrenze."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Fehlwerte · Imputation · Skalierung · Leakage" },
          { k: "Simulationen", v: "4 interaktiv" },
        ]}
      />

      <section className="section">
        <SectionLabel n="03.1">Fehlwertmechanismen</SectionLabel>
        <h2 className="h2">Warum ein Wert fehlt, bestimmt die Behandlung.</h2>
        <p className="prose">
          <strong>MCAR</strong> (missing completely at random) heißt, das
          Fehlen hängt von keinem Wert ab; vollständige Fälle bleiben für
          manche Estimands unverzerrt, verlieren aber Information.{" "}
          <strong>MAR</strong> (missing at random) heißt, andere beobachtete
          Spalten erklären das Fehlen: Bei EU-Nutzern fehlt das Einkommen
          öfter, weil die deutsche Umfrage eine Seite übersprang. Imputier mit
          diesen Prädiktoren.
        </p>
        <p className="prose">
          <strong>MNAR</strong> (missing not at random) heißt, der fehlende
          Wert sagt sein eigenes Fehlen vorher, etwa wenn Personen mit hohem
          Einkommen die Einkommensfrage auslassen. Dann brauchst du zusätzliche
          Annahmen, Sensitivitätsanalyse oder ein Modell des Fehlprozesses.
          Alle drei sind Annahmen über den Prozess; die Daten zeigen nicht,
          welche gilt.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Bei MNAR steigt die Fehlrate im oberen Wertebereich, also schätzt
          eine Imputation mit dem beobachteten Mittelwert den echten Mittelwert
          zu niedrig. Ein Indikator wie <code>feature_was_missing</code> kommt
          infrage, wenn er zum Vorhersagezeitpunkt existiert, in der
          Validierung hilft und kein Proxy für Prozessänderungen oder sensible
          Gruppen ist.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">
          Lücken füllen, ohne die Verteilung zu verfälschen.
        </h2>
        <p className="prose">
          Mittelwert-Imputation drückt die Varianz, Forward-Fill erzeugt in
          Zeitreihen künstliche Plateaus, und KNN erhält lokale Struktur, wenn
          die Distanz sinnvoll ist. Die Demo kennt die synthetische Wahrheit; bei
          echten Fehlwerten vergleichst du Verfahren über konstruierte Holdouts
          und Sensitivitätsanalysen.
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Fehlmuster bei Imputation"
          items={[
            "<b>Mit dem Mittelwert des vollständigen Datensatzes imputieren.</b> Pass den Imputer nur auf dem Trainingssatz an.",
            "<b>Einen Füllwert wählen, ohne den Estimand zu prüfen.</b> Mittelwert und Median erhalten weder gemeinsame Beziehungen noch Imputationsunsicherheit. Vergleich die Verfahren im Validierungsdesign.",
            "<b>Die Imputationsherkunft verschwinden lassen.</b> Halt fest, welche Werte imputiert wurden. Einen Fehlwertindikator nimmst du nur, wenn er bei der Inferenz existiert und in der Validierung hilft.",
            "<b>KNN mit ungeeigneter Distanz.</b> Skalier numerische Eingaben, kodier gemischte Daten bewusst und stimm die Nachbarn in der Validierung ab.",
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
          Regularisierte lineare Modelle bestrafen die Koeffizientengröße,
          also verändert die Einheit die effektive Strafe und den Koeffizienten,
          den du abliest. kNN, Kernel-SVM und PCA trifft es auch: Distanzen im
          Bereich 200,000 übertönen das Alter. Skalierung bringt Merkmale auf
          vergleichbare Größenordnungen.
        </p>
        <ScalerDemo />
        <BestPractices
          title="Regeln für Skalierung"
          items={[
            "<b>StandardScaler zentriert und skaliert die Varianz.</b> Normalität braucht er nicht, aber Ausreißer verbiegen Mittelwert und Standardabweichung.",
            "<b>MinMaxScaler für einen erlernten Bereich.</b> Werte außerhalb des Trainingsbereichs können außerhalb [0, 1] landen; Trainingsextreme stauchen den Rest.",
            "<b>RobustScaler bei realen Ausreißern.</b> Median und IQR verhindern, dass Randwerte die Skala bestimmen.",
            "<b>Baum-Splits brauchen selten Skalierung.</b> Monotone Skalierung erhält die Reihenfolge; gemeinsame Pipelines, numerische Präzision oder andere Modellteile können sie trotzdem verlangen.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.4">Data Leakage</SectionLabel>
        <h2 className="h2">
          Leakage bringt Information aus der Zukunft ins Training.
        </h2>
        <p className="prose">
          <strong>Leakage</strong> heißt, die Modellentwicklung nutzte
          Information, die zum Vorhersagezeitpunkt nicht verfügbar wäre.
          Hinweise sind nach dem Zielereignis erfasste Merkmale, auf Testdaten
          angepasste Transformationen und ein Einbruch bei zeit- oder
          gruppengerechter Aufteilung. Starke Werte beweisen Leakage nicht,
          normale schließen es nicht aus.
        </p>
        <p className="prose">
          Drei Formen sind häufig: <strong>Target Leakage</strong>, bei dem ein
          Merkmal das Label kodiert; <strong>temporales Leakage</strong> durch
          Daten nach dem Vorhersagezeitpunkt; und{" "}
          <strong>Train-Test-Kontamination</strong>, wenn Vorverarbeitung den
          Testsatz gesehen hat.
        </p>
        <LeakageDetector />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Merkmale nach dem Ereignis verwenden.</b> <code>total_revenue_lifetime</code> darf für <code>will_churn</code> keinen Umsatz nach dem Stichtag enthalten.",
            "<b>Den Testsatz während der EDA untersuchen.</b> Jede daraus abgeleitete Änderung trägt Testinformation in die Entwicklung.",
          ]}
        />
        <BestPractices
          title="Saubere Umsetzung"
          items={[
            "<b>Die Evaluationsaufteilung vor erlernter Vorverarbeitung festlegen.</b> Halt einen finalen Testanteil aus Modell- und Merkmalsentscheidungen heraus.",
            "<b>Eine Pipeline innerhalb der Kreuzvalidierung anpassen.</b> Eine korrekte <code>Pipeline</code> hält erlernte Transformationen in den Trainingsfolds; semantisches oder temporales Leakage verhindert sie nicht.",
            "<b>Zeitgerecht aufteilen, wenn der Einsatz die Zukunft vorhersagt.</b> Richte rollende, expandierende oder feste Stichtage am echten Entscheidungszeitpunkt aus.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Skalierung hängt von Algorithmus und Pipeline ab.</b> Dokumentier, was mit Werten außerhalb des Trainingsbereichs passiert.",
          "<b>Datenbereinigung ist fortlaufend.</b> Jedes neue Merkmal, jeder Join und jede Aggregation kann Fehler oder Leakage einführen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
