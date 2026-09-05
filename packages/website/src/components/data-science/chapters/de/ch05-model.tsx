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
        hook="Mehr Flexibilität senkt den Approximationsfehler, hebt die Schätzvarianz und kostet Rechenzeit und Interpretierbarkeit. <strong>Welcher Tausch sich lohnt, entscheidet ein Validierungsdesign passend zur Bereitstellung.</strong>"
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
          In diesem festen Polynomgenerator liefern niedrige Grade ähnliche
          Kurven, die systematisch danebenliegen. Höhere Grade legen sich enger
          an die Stichprobenpunkte und springen zwischen Ziehungen stärker. Bei
          anderen Modellen, Daten oder Verlusten muss der Verlauf nicht monoton
          sein.
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
          "<b>Auf dem Testsatz abstimmen.</b> Overfitting mit zusätzlichem Zeitaufwand.",
          "<b>Ranglistenwerten hinterherlaufen.</b> Eine AUC-Differenz von 0.01 entscheidet nichts ohne Unsicherheit über Folds, Leakage-Prüfung und unberührte Bestätigung.",
          "<b>Architekturen nach Ruf wählen.</b> Vergleich lineare, baumbasierte und neuronale Kandidaten unter denselben Anforderungen an Daten, Rechenzeit, Latenz, Kalibrierung, Interpretierbarkeit.",
        ]}
      />

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Das Ziel ist Generalisierung.</b> Halt Evaluationsdaten von der Anpassung fern und schneid die Aufteilung auf künftige Entitäten, Gruppen oder Zeit.",
          "<b>Resampling beziffert Split-Empfindlichkeit.</b> Kreuzvalidierung hilft nur bei passender Fold-Struktur; gruppierte, zeitliche oder verschachtelte Designs sind oft nötig.",
          "<b>Bias² + Varianz + Rauschen ist eine Zerlegung für quadratischen Fehler.</b> Eine Lehrperspektive unter festgelegtem Datengenerierungsprozess, keine Formel für jede Metrik.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
