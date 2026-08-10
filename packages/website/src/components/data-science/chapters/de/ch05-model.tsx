import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  Hero,
  SectionLabel,
  AntiPatterns,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { BiasVarianceSim } from "@/components/data-science/simulators/bias-variance-sim";

export default function Ch05ModelDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 05 · Modellierung"
        title="Der Zielkonflikt zwischen <em>Bias und Varianz.</em>"
        hook="Modellflexibilität verändert Approximationsfehler, Schätzvarianz, Rechenaufwand und Interpretierbarkeit. <strong>Ein zur Bereitstellung passendes Validierungsdesign vergleicht diese Zielkonflikte.</strong>"
        meta={[
          { k: "Lesezeit", v: "9 min" },
          { k: "Inhalt", v: "Anpassen · Kreuzvalidieren · Abstimmen" },
          { k: "Simulationen", v: "1 Ensemble-Simulation" },
        ]}
      />

      <section className="section">
        <SectionLabel n="05.1">Der Zielkonflikt als Simulation</SectionLabel>
        <h2 className="h2">
          Komplexität verändern, Daten neu ziehen,{" "}
          <em>Streuung der Modellkurven beobachten.</em>
        </h2>
        <p className="prose">
          In diesem festen Polynomgenerator erzeugen niedrige Grade ähnliche,
          aber systematisch falsch spezifizierte Kurven. Höhere Grade passen die
          Stichprobenpunkte enger an und variieren stärker zwischen
          initialisierten Ziehungen. Für andere Modelle, Regularisierung, Daten
          oder Verluste muss dieser Verlauf nicht monoton gelten.
        </p>
        <BiasVarianceSim />
      </section>

      <section className="section">
        <SectionLabel n="05.2">Ein Modell auswählen</SectionLabel>
        <h2 className="h2">
          Einfach beginnen. <em>Komplexität nur anhand von Evidenz erhöhen.</em>
        </h2>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Logistische oder lineare Regression:</strong>{" "}
            interpretierbare und schnelle Baselines für tabellarische Daten,
            wenn ihre Funktionsform ausreicht.
          </li>
          <li>
            <strong>Gradient-Boosted Trees (XGBoost, LightGBM):</strong> ein
            belastbarer Standard für tabellarische Daten.
          </li>
          <li>
            <strong>Random Forest:</strong> eine nichtlineare Ensemble-Baseline
            mit Grenzen bei Kalibrierung, Latenz und Extrapolation.
          </li>
          <li>
            <strong>Tiefe neuronale Netze:</strong> vor allem für
            unstrukturierte Daten wie Text, Bilder und Audio; bei tabellarischen
            Daten gegen einfachere Baselines unter demselben Budget und Split
            vergleichen.
          </li>
        </ul>
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Auf dem Testsatz abstimmen.</b> Das ist Overfitting mit zusätzlichem Zeitaufwand.",
          "<b>Ranglistenwerte verfolgen.</b> Eine AUC-Differenz von 0.01 ist ohne Unsicherheit über Folds, Leakage-Prüfung und unberührte Bestätigung keine Entscheidungsgrundlage.",
          "<b>Architekturen nach Ruf auswählen.</b> Lineare, baumbasierte und neuronale Kandidaten unter denselben Daten-, Rechen-, Latenz-, Kalibrierungs- und Interpretierbarkeitsanforderungen vergleichen.",
        ]}
      />

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Das Ziel ist Generalisierung.</b> Evaluationsdaten von der Anpassung trennen und die Aufteilung an künftige Entitäten, Gruppen oder Zeit anpassen.",
          "<b>Resampling quantifiziert Split-Empfindlichkeit.</b> Kreuzvalidierung hilft nur bei passender Fold-Struktur; gruppierte, zeitliche oder verschachtelte Designs können erforderlich sein.",
          "<b>Bias² + Varianz + Rauschen ist eine Zerlegung für quadratischen Fehler.</b> Sie ist eine Lehrperspektive unter einem festgelegten Datengenerierungsprozess, keine Formel für jede Metrik.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
