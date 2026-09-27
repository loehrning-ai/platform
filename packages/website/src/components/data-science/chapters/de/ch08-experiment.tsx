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
        hook="Leg Zuweisung, Estimand, Primärmetrik, kleinsten relevanten Effekt, Analyseplan und Stoppregel fest, bevor das erste Ergebnis eintrifft."
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
          und beobachte die Zwischenschätzungen. In diesem einen synthetischen
          Bernoulli-Verlauf kann das Intervall die Null mehrfach kreuzen, und
          eine Kreuzung ist keine gültige Stoppregel. Du siehst
          Stichprobenvariabilität, keinen geplanten Produktionstest.
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
            <strong>Kleinster relevanter Effekt:</strong> der kleinste Effekt,
            der eine Entscheidung ändern würde; kleinere Zielwerte brauchen bei
            sonst gleichen Eingaben mehr Information.
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
            "<b>Unkorrigiertes optionales Stoppen.</b> Wer einen p-Wert für einen festen Endzeitpunkt wiederholt prüft und beim ersten Grenzübertritt stoppt, verändert die Fehlerrate, je nach Prüfplan und Stoppregel (siehe Kapitel 10).",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Die Stichprobengröße skaliert ungefähr mit 1 / Effekt².</b> Bei unveränderter Varianz, Zuweisung, α und Power braucht ein halbierter Zieleffekt etwa die vierfache Stichprobe.",
          "<b>Intervalle und p-Werte fassen dasselbe Modell zusammen.</b> Berichte Effektgröße und Unsicherheit; ein schwaches Design reparieren beide nicht.",
          '<b>Aussagen auf den ausgeschlossenen Bereich begrenzen.</b> "Kein Effekt nachgewiesen" bedeutet nicht "kein Effekt"; das Intervall mit dem vorab festgelegten relevanten Bereich vergleichen.',
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
