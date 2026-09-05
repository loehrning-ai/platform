import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { ABSim } from "@/components/data-science/simulators/ab-sim";

export default function Ch08ExperimentDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 08 · Experimente"
        title='Das Experiment <em>vor</em> der Datenerhebung planen. <span class="accent">Danach gemäß</span> diesem Plan auswerten.'
        hook="Zuweisung, Estimand, Primärmetrik, kleinster relevanter Effekt, Analyse, Stoppregel. Alles steht fest, bevor die erste Ergebniszeile existiert."
        meta={[
          { k: "Lesezeit", v: "9 min" },
          { k: "Inhalt", v: "Power · KI · MDE" },
          { k: "Modelle", v: "1 synthetischer A/B-Test" },
        ]}
      />

      <section className="section">
        <SectionLabel n="08.1">
          Ein synthetischer Experimentverlauf
        </SectionLabel>
        <h2 className="h2">
          Den Test simulieren, <em>bevor</em> er beginnt.
        </h2>
        <p className="prose">
          Schieb den datenerzeugenden Lift zwischen null und +2 Prozentpunkten
          und vergleich die Zwischenschätzungen. Das ist ein einzelner
          synthetischer Bernoulli-Verlauf, dessen Intervall die Null mehrfach
          kreuzen kann. Eine solche Kreuzung ist keine gültige Stoppregel. Die
          Übung zeigt Stichprobenvariabilität, nicht das Ergebnis eines
          geplanten Produktionstests.
        </p>
        <ABSim />
      </section>

      <section className="section">
        <SectionLabel n="08.2">Vier Vorabfestlegungen</SectionLabel>
        <ol className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Primäres Estimand und Metrik:</strong> Population,
            Ergebnisfenster, Analyseeinheit und Kontrast definieren.
          </li>
          <li>
            <strong>Kleinster relevanter Effekt:</strong> den kleinsten Effekt
            wählen, der eine Entscheidung ändern würde. Kleinere Zielwerte
            benötigen bei sonst gleichen Eingaben mehr Information.
          </li>
          <li>
            <strong>Power:</strong> Zielwert anhand der Kosten übersehener
            Effekte, falsch-positiver Ergebnisse und der Datenerhebung wählen;
            Annahmen der Berechnung dokumentieren.
          </li>
          <li>
            <strong>Dauer und Stopp:</strong> relevante Betriebszyklen und die
            geplante Stichprobe abdecken; danach die vorab festgelegte feste
            oder sequenzielle Regel anwenden.
          </li>
        </ol>
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Unkorrigiertes optionales Stoppen.</b> Einen p-Wert für einen festen Endzeitpunkt wiederholt prüfen und beim ersten Grenzübertritt stoppen verändert die Fehlerrate; das Ausmaß hängt von Prüfplan und Stoppregel ab. Siehe Kapitel 10.",
            "<b>HARKing.</b> Die Hypothese entsteht nach den Ergebnissen, und die Daten werden geschnitten, bis etwas auffällt.",
            "<b>Mehrfachvergleiche ohne Korrektur.</b> Bei 20 unabhängigen, unter der Nullhypothese gültigen p-Werten mit α=0.05 beträgt die Wahrscheinlichkeit für mindestens ein falsch-positives Ergebnis 1 − 0.95²⁰ ≈ 64%. Abhängigkeit verändert diese Rechnung.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Die Stichprobengröße skaliert häufig näherungsweise mit 1 / Effekt².</b> Bei unveränderter Varianz, Zuweisung, α und Power benötigt ein halbierter Zieleffekt etwa die vierfache Stichprobe.",
          "<b>Intervalle und p-Werte fassen dasselbe Modell unterschiedlich zusammen.</b> Berichte Effektgröße und Unsicherheit. Ein schwaches Design reparieren beide nicht.",
          '<b>Aussagen auf den ausgeschlossenen Bereich begrenzen.</b> "Kein Effekt nachgewiesen" bedeutet nicht "kein Effekt"; das Intervall mit dem vorab festgelegten relevanten Bereich vergleichen.',
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
