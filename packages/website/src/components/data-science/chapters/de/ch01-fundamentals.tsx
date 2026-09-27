import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  Hero,
  SectionLabel,
  AntiPatterns,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { GaltonSim } from "@/components/data-science/simulators/galton-sim";

export default function Ch01FundamentalsDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 01 · Grundlagen"
        title='Die Data Scientistin macht aus <em>Rauschen</em> <span class="accent">Entscheidungen.</span>'
        hook="Vor jedem Modell, jeder SQL-Abfrage und jedem Dashboard stehen drei Unterscheidungen: <strong>Stichprobe und Grundgesamtheit</strong>, <strong>Signal und Rauschen</strong> sowie <strong>Korrelation und Kausalität</strong>."
        meta={[
          { k: "Lesezeit", v: "7 min" },
          { k: "Inhalt", v: "CLT · Stichproben · Data-Science-Zyklus" },
          { k: "Simulationen", v: "1 interaktives Lehrmodell" },
        ]}
      />

      <section className="section">
        <SectionLabel n="01.1">Stichprobe und Grundgesamtheit</SectionLabel>
        <h2 className="h2">
          Eine Stichprobe liefert Evidenz über die Grundgesamtheit; sie ist
          nicht die Grundgesamtheit.
        </h2>
        <p className="prose">
          Ein fiktiver Dienst hat <strong>44 Millionen Nutzer</strong> und
          testet per A/B-Test auf <strong>180,000</strong> geeigneten
          Beobachtungen. Die Retention-Differenz von 2.3% schätzt eine Größe
          der Grundgesamtheit; ihre Bedeutung hängt an Zuweisung, Fehlwerten,
          Messung, Ziehung und Unsicherheit.
        </p>
        <p className="prose">
          Datenwissenschaft rechnet auf <code>samples</code> und redet über{" "}
          <code>populations</code> oder künftige Fälle. Intervalle, Tests,
          Validierung und Versuchsdesign beziffern Teile dieser Unsicherheit;
          keines repariert eine verzerrte Stichprobe oder ungültige Messung.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Schieb <code>n</code> von 2 auf 100. In diesem unabhängigen Generator
          mit endlicher Varianz skaliert der Standardfehler des Mittelwerts mit{" "}
          <code>1/√n</code>, und die Stichprobenverteilung nähert sich der
          Normalform. Abhängigkeit, schwere Verteilungsschwänze, kleine
          Stichproben und wechselnde Grundgesamtheiten schwächen diese
          Näherung nach dem zentralen Grenzwertsatz.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="01.2">Der Data-Science-Zyklus</SectionLabel>
        <h2 className="h2">
          Sechs wiederkehrende Phasen.{" "}
          <em>Die Reihenfolge hängt vom Problem ab.</em>
        </h2>
        <p className="prose">
          Der Arbeitszyklus lautet{" "}
          <strong>
            Daten → Exploration → Bereinigung → Merkmale → Modell → Evaluation
          </strong>{" "}
          und beginnt von vorn. Experimente, Kausalanalyse und Betrieb kommen
          später.
        </p>
        <div className="loop-mini">
          {[
            "Daten",
            "Exploration",
            "Bereinigung",
            "Merkmale",
            "Modell",
            "Evaluation",
          ].map((stage, index) => (
            <div className="loop-mini-stage" key={stage}>
              <div className="loop-mini-n">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="loop-mini-t">{stage}</div>
            </div>
          ))}
        </div>
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Fitten, bevor du hinschaust.</b> Lässt du <code>model.fit()</code> auf nie <em>geplotteten</em> Daten laufen, kann das Modell die Indexspalte lernen.",
            "<b>Eine Zahl optimieren, nach der niemand gefragt hat.</b> Hohe Güte auf der falschen Kennzahl ist schlechter als mäßige auf der richtigen.",
            "<b>Korrelation für Kausalität halten.</b> „Wer Funktion X sieht, bleibt länger“ heißt nicht, dass X die Retention verursacht.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Nenn die Zielpopulation</b> und wie Ziehung, Zuweisung, Fehlwerte und Messung die Schätzung begrenzen.",
          "<b>Nutz den Zyklus als Kontrollsystem.</b> Explorier, validier und überwach überall, wo neue Daten oder Transformationen alte Evidenz entwerten können.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
