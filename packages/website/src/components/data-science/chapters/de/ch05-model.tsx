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
        hook="Mehr Flexibilität senkt meist den Approximationsfehler, hebt die Schätzvarianz und kostet Rechenzeit und Interpretierbarkeit. <strong>Welcher Tausch sich lohnt, entscheidet ein Validierungsdesign passend zur Bereitstellung.</strong>"
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
          Kurven mit demselben systematischen Fehler. Höhere Grade legen sich enger an
          die Stichprobenpunkte und springen zwischen Ziehungen stärker. Bei
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
            starker Standard für tabellarische Daten; Abstimmung und
            Kalibrierung bleiben deine Aufgabe.
          </li>
          <li>
            <strong>Random Forest:</strong> eine nichtlineare Ensemble-Baseline
            mit Grenzen bei Kalibrierung, Latenz und Extrapolation.
          </li>
          <li>
            <strong>Tiefe neuronale Netze:</strong> Standard für Text, Bilder
            und Audio; bei tabellarischen Daten vergleichst du sie mit
            einfacheren Baselines unter demselben Budget und Split.
          </li>
        </ul>
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Auf dem Testsatz abstimmen.</b> Dann passt du das Modell indirekt an den Testsatz an, und seine Güte wirkt zu gut.",
          "<b>Ranglistenwerten hinterherlaufen.</b> Eine AUC-Differenz von 0.01 entscheidet nichts ohne Unsicherheit über Folds, Leakage-Prüfung und unberührte Bestätigung.",
        ]}
      />

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Resampling zeigt, wie stark das Ergebnis vom Split abhängt.</b> Kreuzvalidierung hilft nur bei passender Fold-Struktur; gruppierte, zeitliche oder verschachtelte Designs sind oft nötig.",
          "<b>Bias² + Varianz + Rauschen zerlegt den quadratischen Fehler.</b> Das gilt unter einem festgelegten Datengenerierungsprozess und nicht für jede Metrik.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
