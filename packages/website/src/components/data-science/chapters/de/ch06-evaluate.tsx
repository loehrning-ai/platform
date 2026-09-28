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
        hook="In Metrik und Schwellenwert stecken Fehlerkosten, Klassenhäufigkeit, Kalibrierungsbedarf und Prüfkapazität. Die synthetische Score-Verteilung zeigt diese Zielkonflikte."
        meta={[
          { k: "Lesezeit", v: "8 min" },
          { k: "Inhalt", v: "Konfusionsmatrix · ROC · PR" },
          { k: "Modelle", v: "1 synthetischer Sweep" },
        ]}
      />

      <section className="section">
        <SectionLabel n="06.1">Die Konfusionsmatrix</SectionLabel>
        <h2 className="h2">
          Vier Felder zählen jede Entscheidung <em>am Schwellenwert.</em>
        </h2>
        <p className="prose">
          Ein Schwellenwert macht aus Scores TP, FP, FN und TN. Präzision,
          Recall, Spezifität und F1 ergeben sich aus diesen vier Feldern.
          ROC-AUC und PR-AUC fassen mehrere Schwellenwerte zusammen; Log Loss
          und Kalibrierung lesen die Wahrscheinlichkeiten direkt.
        </p>
        <ThresholdSim />
      </section>

      <section className="section">
        <SectionLabel n="06.2">Die passende Metrik auswählen</SectionLabel>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Betrug oder Screening:</strong> Wenn übersehene Fälle
            dominieren, hohen Recall verlangen und Prüfaufwand sowie Schaden
            durch Falsch-Positive begrenzen.
          </li>
          <li>
            <strong>Spamfilter:</strong> Wenn legitime Nachrichten nicht
            markiert werden dürfen, Falsch-Positiv-Rate begrenzen oder Präzision
            am Betriebsschwellenwert verlangen.
          </li>
          <li>
            <strong>Ausgewogene Klassen:</strong> Die Prävalenz allein wählt
            keine Metrik; wähl zwischen Ranking, Wahrscheinlichkeitsgüte,
            Kalibrierung und Entscheidungskosten.
          </li>
          <li>
            <strong>Seltene Ereignisse:</strong> PR-Kurven zeigen Präzision bei
            erreichbarem Recall und hängen von der Prävalenz ab; berichte
            Basisrate, Ranking- und Schwellenwertmetriken gemeinsam.
          </li>
        </ul>
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Bei seltenen Ereignissen nur Genauigkeit berichten.</b> Bei 0.1% Ereignisrate liefert ein Modell, das immer negativ sagt, 99.9% Genauigkeit und erkennt nichts.",
            "<b>Trainingsziel und Entscheidungsziel verwechseln.</b> Für ein mit Log Loss trainiertes Modell wählst du den Schwellenwert nach Kosten; prüf dann Kalibrierung und Betriebsmetriken getrennt.",
            "<b>τ=0.5 einfach stehen lassen.</b> Leg den Schwellenwert nach deinem Kostenverhältnis fest.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Eine Metrik enthält ein Werturteil.</b> Sie legt fest, welcher Fehler schwerer wiegt.",
          "<b>Kalibrierung betrifft Gruppen von Vorhersagen.</b> Unter Fällen mit Score nahe 0.7 sollten über die angegebene Population und Zeit ungefähr 70% positiv sein; für einen Einzelfall garantiert das nichts.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
