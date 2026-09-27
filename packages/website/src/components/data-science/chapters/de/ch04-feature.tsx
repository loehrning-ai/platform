import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { EncodingComparison } from "@/components/data-science/simulators/encoding-comparison";
import { PolynomialExpansion } from "@/components/data-science/simulators/polynomial-expansion";
import { FeatureSelectionSim } from "@/components/data-science/simulators/feature-selection-sim";
import { InteractionTerms } from "@/components/data-science/simulators/interaction-terms";

export default function Ch04FeatureDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 04 · Merkmalskonstruktion"
        title="Merkmalsdesign definiert <em>die Modelleingabe.</em>"
        hook="Merkmale bestimmen, welche Information das Modell sieht, und jedes muss bei der Inferenz noch existieren. Kodierung, nichtlineare Terme, Auswahl und Interaktionen vergleichst du in einem Leakage-sicheren Validierungsplan."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Kodieren · Erweitern · Auswählen · Interagieren" },
          { k: "Simulationen", v: "4 interaktiv" },
        ]}
      />

      <section className="section">
        <SectionLabel n="04.1">Kategoriale Merkmale kodieren</SectionLabel>
        <h2 className="h2">Vier Kodierungen und ein häufiger Fehler</h2>
        <p className="prose">
          <strong>One-Hot</strong> bildet nominale Werte ohne Rangfolge ab,
          kostet eine Spalte je Kategorie und braucht eine Regel für unbekannte
          Kategorien. <strong>Target Encoding</strong> nutzt Labels und braucht
          zusätzlich fold-lokale Schätzung und Glättung. Ganzzahlige Codes
          erzwingen bei Modellen mit numerischer Distanz eine Rangfolge;
          Frequency Encoding eignet sich, wenn Häufigkeit informativ ist und
          kein Target Leakage entstehen darf, wirft aber gleich häufige
          Kategorien zusammen.
        </p>
        <EncodingComparison />
      </section>
      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Nominale Kategorien als Zahlenfolge kodieren.</b> Berlin (5) ist nicht fünfmal New York (1); das Training läuft fehlerfrei, und das Modell lernt Unsinn.",
          "<b>Target Encoding vor der Fold-Bildung.</b> Dann sehen Validierungszeilen eigene oder benachbarte Labels. Schätz den Encoder je Trainingsfold, mit Glättung und Regel für unbekannte Kategorien.",
          "<b>Hochkardinale Kennungen ohne Ressourcenplan one-hot kodieren.</b> Vergleich Hashing, gruppierte Kategorien und gelernte Encoder unter deinen Speicher- und Validierungsgrenzen; eine universelle Kategorienzahl gibt es nicht.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.2">Polynomiale Merkmalserweiterung</SectionLabel>
        <h2 className="h2">
          Mit x² kann ein lineares Modell eine Krümmung abbilden.
        </h2>
        <p className="prose">
          Mit <code>x²</code> und <code>x³</code> als Merkmalen zeichnet ein
          lineares Modell Kurven, ohne dass du das Modell wechselst.
        </p>
        <PolynomialExpansion />
      </section>
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Den Grad nach zurückgehaltener oder kreuzvalidierter Güte wählen.</b> Bei verschachtelten unregularisierten Least-Squares-Modellen auf denselben Zeilen kann Trainings-R² durch zusätzliche Terme nicht sinken; die Generalisierung schon.",
          "<b>Zentrieren oder skalieren, wenn Größenordnung Konditionierung oder Regularisierung beeinflusst.</b> Polynomterme können sich um viele Größenordnungen unterscheiden.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.3">Merkmalsauswahl</SectionLabel>
        <h2 className="h2">
          Mehr Merkmale ergeben nicht automatisch ein besseres Modell.
        </h2>
        <p className="prose">
          Irrelevante Merkmale erhöhen das Rauschen, korrelierte Duplikate
          verwässern Koeffizienten. Mehr Dimensionen kosten Speicher und
          Trainingszeit und können die Generalisierung verschlechtern.
        </p>
        <FeatureSelectionSim />
      </section>
      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Merkmale vor dem Train-Test-Split auf dem vollständigen Datensatz auswählen.</b> Das nutzt Testinformation, und die Auswahl wirkt besser, als sie ist.",
          "<b>Merkmale wegen niedriger Korrelation wegwerfen.</b> Korrelation misst nur lineare Beziehungen; ein Merkmal mit r=0.04 kann hohe Mutual Information haben (z. B. day_of_week und weekend_sales).",
          "<b>300 Merkmale bauen und auf LASSO hoffen.</b> Nimm Merkmale in kleinen, gemessenen Schritten dazu; reines Rauschen kann die Regularisierung überstehen.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.4">Interaktionsterme</SectionLabel>
        <h2 className="h2">A × B ist nicht A + B.</h2>
        <p className="prose">
          Bei einer Interaktion hängt der Effekt von A vom Wert von B ab: Die
          Relevanz einer Anzeige wirkt je nach Person anders, ein Medikament je
          nach Alter. Lineare Modelle brauchen ein explizites A×B-Merkmal;
          Baummodelle können sie über Splits lernen, je nach Tiefe, Stichprobe
          und Regularisierung. Zweiweg-PDP, SHAP-Interaktionswerte oder
          Vergleiche verschachtelter Modelle liefern Kandidaten;
          Split-Wichtigkeit allein identifiziert kein Paar.
        </p>
        <InteractionTerms />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Polynomiale Erweiterung verändert Bias und Varianz.</b> Mit 40 Punkten werden höhere Grade in der Simulation instabil. Wähl Basis und Regularisierung in jedem Trainingsfold deiner echten Daten.",
          "<b>Interaktionssuchen erzeugen Multiplizität.</b> Geh von Fachhypothesen aus, kontrollier die Suche innerhalb der Validierung und bestätig behaltene Terme auf unberührten Daten.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
