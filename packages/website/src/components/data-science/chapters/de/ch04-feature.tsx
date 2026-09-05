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
        hook="Was hier nicht ins Merkmal kommt, sieht das Modell nie. Und was hineinkommt, muss bei der Inferenz noch da sein. Kodierung, nichtlineare Terme, Auswahl und Interaktionen vergleichst du Leakage-sicher."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Kodieren · Erweitern · Auswählen · Interagieren" },
          { k: "Simulationen", v: "4 interaktiv" },
        ]}
      />

      <section className="section">
        <SectionLabel n="04.1">Kategoriale Merkmale kodieren</SectionLabel>
        <h2 className="h2">Vier Verfahren. Ein häufiger Fehler.</h2>
        <p className="prose">
          Modelle rechnen mit Zahlen. Viele Eingaben sind Kategorien.{" "}
          <strong>One-Hot</strong> bildet nominale Werte ohne Rangfolge ab und
          bezahlt mit Spalten. <strong>Target Encoding</strong> greift auf
          Labels zu und braucht fold-lokale Schätzung, Glättung und eine Regel
          für unbekannte Kategorien. Ganzzahlige Codes schmuggeln für Modelle
          mit numerischer Distanz eine Rangfolge ein; Frequency Encoding wirft
          gleich häufige Kategorien zusammen.
        </p>
        <EncodingComparison />
      </section>
      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Nominale Kategorien als Zahlenfolge kodieren.</b> Berlin (5) ist nicht fünfmal New York (1).",
          "<b>Target Encoding vor der Fold-Bildung.</b> Dann sehen Validierungszeilen eigene oder benachbarte Labels. Schätz den Encoder je Trainingsfold neu, mit Glättung und Regel für unbekannte Kategorien.",
          "<b>Hochkardinale Kennungen ohne Ressourcenplan one-hot kodieren.</b> Vergleich Hashing, gruppierte Kategorien und gelernte Encoder unter deinen Speicher- und Validierungsgrenzen; eine universelle Kategorienzahl gibt es nicht.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>One-Hot für nominale Merkmale erwägen,</b> wenn Kardinalität und Speicher beherrschbar sind. Unbekannte Kategorien benötigen eine definierte Behandlung.",
          "<b>Fold-lokales Target Encoding</b> nur bei begründeter Nutzung von Labelinformation einsetzen; Glättung anwenden und Validierungszeilen nur aus dem Trainingsfold kodieren.",
          "<b>Frequency Encoding</b>, wenn Häufigkeit informativ ist, aber Target Leakage ausgeschlossen werden muss.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.2">Polynomiale Merkmalserweiterung</SectionLabel>
        <h2 className="h2">
          Mit x² kann ein lineares Modell eine Krümmung abbilden.
        </h2>
        <p className="prose">
          Ein lineares Modell zeichnet Geraden. Mit den Merkmalen{" "}
          <code>x²</code> und <code>x³</code> zeichnet es Kurven, ohne
          Modellwechsel. Zu wenige Terme untermodellieren, zu viele lernen
          Rauschen.
        </p>
        <PolynomialExpansion />
      </section>
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Den Grad anhand zurückgehaltener oder kreuzvalidierter Güte wählen.</b> Bei verschachtelten unregularisierten Least-Squares-Modellen auf denselben Zeilen kann Trainings-R² durch zusätzliche Terme nicht sinken; Generalisierung schon.",
          "<b>Zentrieren oder skalieren, wenn Größenordnung Konditionierung oder Regularisierung beeinflusst.</b> Polynomterme können sich um viele Größenordnungen unterscheiden.",
          "<b>Polynomterme dort prüfen, wo das Modell eine explizite Basis benötigt.</b> Bäume approximieren Nichtlinearität durch Splits; Tiefe, Stichprobe und Regularisierung bestimmen, ob eine Interaktion wirksam gelernt wird.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.3">Merkmalsauswahl</SectionLabel>
        <h2 className="h2">
          Mehr Merkmale ergeben nicht automatisch ein besseres Modell.
        </h2>
        <p className="prose">
          Irrelevante Merkmale erhöhen Rauschen. Korrelierte Duplikate
          verwässern Koeffizienten. Hohe Dimension erhöht Speicherbedarf und
          Trainingszeit und kann die Generalisierung verschlechtern.
        </p>
        <FeatureSelectionSim />
      </section>
      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Merkmale vor dem Train-Test-Split auf dem vollständigen Datensatz auswählen.</b> Damit nutzt du Information aus dem späteren Testsatz.",
          "<b>Merkmale wegen niedriger Korrelation wegwerfen.</b> Korrelation misst lineare Beziehungen, sonst nichts; r=0.04 verträgt sich bestens mit hoher Mutual Information.",
          "<b>300 Merkmale bauen und auf LASSO hoffen.</b> Merkmale kommen in kleinen, gemessenen Schritten dazu.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.4">Interaktionsterme</SectionLabel>
        <h2 className="h2">A × B ist nicht A + B.</h2>
        <p className="prose">
          Bei einer Interaktion hängt der Effekt von A am Wert von B. Ob eine
          Anzeige wirkt, entscheidet ihre Relevanz zusammen mit der Person
          davor. Lineare Modelle brauchen ein explizites A×B-Merkmal;
          Baummodelle lernen Interaktionen selbst.
        </p>
        <InteractionTerms />
      </section>
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Interaktionen vor der Berechnung fachlich begründen.</b> Alle Paare zu durchsuchen ist teuer und erzeugt überwiegend Rauschen.",
          "<b>Interaktionen zentrieren oder skalieren, wenn Interpretation, Konditionierung oder Regularisierung es verlangt.</b> Dies ist eine Modellentscheidung, keine universelle Voraussetzung.",
          "<b>Interaktionsspezifische Diagnostik verwenden.</b> Zweiweg-PDP, SHAP-Interaktionswerte oder Vergleiche verschachtelter Modelle können Kandidaten liefern; gewöhnliche Split-Wichtigkeit identifiziert kein Paar allein.",
        ]}
      />

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Kodierung ist Teil der Modellentscheidung.</b> Target Encoding mit Leakage bläst Validierungswerte künstlich auf.",
          "<b>Polynomiale Erweiterung verändert Bias und Varianz.</b> Die lokale Simulation mit 40 Punkten macht höhere Grade instabil; Basis und Regularisierung auf dem realen Design fold-lokal wählen.",
          "<b>Merkmalsauswahl gehört in die Kreuzvalidierung.</b> Auswahl vor dem Split ist Leakage.",
          "<b>Interaktionssuchen erzeugen Multiplizität.</b> Fachhypothesen verwenden, die Suche innerhalb der Validierung kontrollieren und behaltene Terme auf unberührten Daten bestätigen.",
          "<b>Training und Inferenz müssen dieselben Merkmale berechnen.</b> Jedes Merkmal muss vor Bekanntwerden des Labels verfügbar sein.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
