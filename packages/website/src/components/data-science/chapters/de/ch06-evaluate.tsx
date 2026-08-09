import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { ThresholdSim } from "@/components/data-science/simulators/threshold-sim";

export default function Ch06EvaluateDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 06 · Evaluation"
        title='Die Metrik <em>vor</em> <span class="accent">dem Modell auswählen.</span>'
        hook="Metrik und Schwellenwert kodieren Fehlerkosten, Klassenhäufigkeit, Kalibrierungsbedarf und Betriebskapazität. Die synthetische Score-Verteilung macht diese Zielkonflikte sichtbar."
        meta={[
          { k: "Lesezeit", v: "8 min" },
          { k: "Inhalt", v: "Konfusionsmatrix · ROC · PR" },
          { k: "Modelle", v: "1 synthetischer Sweep" },
        ]}
      />

      <section className="section">
        <SectionLabel n="06.1">Die Konfusionsmatrix</SectionLabel>
        <h2 className="h2">
          Vier Felder. <em>Eintausend Entscheidungen.</em>
        </h2>
        <p className="prose">
          An einem Schwellenwert ergeben binäre Vorhersagen TP, FP, FN und TN.
          Präzision, Recall, Spezifität und F1 werden daraus berechnet. ROC-AUC
          und PR-AUC fassen mehrere Schwellenwerte zusammen; Log Loss und
          Kalibrierung nutzen die Wahrscheinlichkeitswerte direkt.
        </p>
        <ThresholdSim />
      </section>

      <section className="section">
        <SectionLabel n="06.2">Die passende Metrik auswählen</SectionLabel>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Betrug oder Screening:</strong> Wenn übersehene Fälle
            dominieren, hohen Recall verlangen und zugleich Prüfaufwand sowie
            Schäden durch falsch-positive Ergebnisse begrenzen.
          </li>
          <li>
            <strong>Spamfilter:</strong> Wenn legitime Nachrichten nicht
            markiert werden dürfen, Falsch-Positiv-Rate begrenzen oder Präzision
            am Betriebsschwellenwert verlangen.
          </li>
          <li>
            <strong>Ausgewogene Klassen:</strong> Die Prävalenz allein wählt
            keine Metrik. Zwischen Ranking, Wahrscheinlichkeitsgüte,
            Kalibrierung und Entscheidungskosten unterscheiden.
          </li>
          <li>
            <strong>Seltene Ereignisse:</strong> PR-Kurven zeigen Präzision bei
            erreichbarem Recall und hängen von der Prävalenz ab. Basisrate,
            Ranking und Schwellenwertmetriken gemeinsam berichten.
          </li>
        </ul>
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Nur Genauigkeit für seltene Ereignisse berichten.</b> Bei 0.1% Ereignisrate ergibt eine durchgehend negative Vorhersage 99.9% Genauigkeit und erkennt kein Ereignis.",
            "<b>Trainings- und Entscheidungsziel ungeprüft vermischen.</b> Ein auf Log Loss optimiertes Modell kann für Kosten geschwellenwertet werden; Kalibrierung und Betriebsmetriken benötigen jeweils Validierung.",
            "<b>τ=0.5 als Standard übernehmen.</b> Der Schwellenwert muss das Kostenverhältnis des Anwendungsfalls abbilden, nicht die Bibliotheksvorgabe.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Eine Metrik enthält ein Werturteil.</b> Sie legt fest, welcher Fehler schwerer wiegt.",
          "<b>Der Schwellenwert ist ein Stellhebel, keine Vorgabe.</b> Er muss angepasst werden.",
          "<b>Kalibrierung betrifft Gruppen von Vorhersagen.</b> Unter Fällen mit Score nahe 0.7 sollten über die angegebene Population und Zeit ungefähr 70% positiv sein; dies garantiert nichts für einen Einzelfall.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
