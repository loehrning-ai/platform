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
        title='Datenwissenschaft übersetzt <em>Rauschen</em> <span class="accent">in Entscheidungen.</span>'
        hook="Vor jedem Modell, jeder SQL-Abfrage und jedem Dashboard stehen drei Unterscheidungen: <strong>Stichprobe und Grundgesamtheit.</strong> <strong>Signal und Rauschen.</strong> <strong>Korrelation und Kausalität.</strong>"
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
          Angenommen, ein fiktiver Dienst hat{" "}
          <strong>44 Millionen Nutzer</strong>
          und ein A/B-Test enthält <strong>180,000</strong> geeignete
          Beobachtungen. Eine Retention-Differenz von 2.3% schätzt eine
          Populationsgröße aus dieser Stichprobe. Ihre Aussage hängt von
          Zuweisung, Fehlwerten, Messung, Auswahl und statistischer Unsicherheit
          ab.
        </p>
        <p className="prose">
          Datenwissenschaft arbeitet häufig mit <code>samples</code> und trifft
          Aussagen über <code>populations</code> oder künftige Fälle.
          Konfidenzintervalle, Tests, Validierung und Versuchsdesign erfassen
          unterschiedliche Unsicherheiten; sie reparieren keine verzerrte
          Stichprobe oder ungültige Messung.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Erhöhe <code>n</code> von 2 auf 100. In diesem unabhängigen Generator
          mit endlicher Varianz skaliert der Standardfehler des Mittelwerts mit{" "}
          <code>1/√n</code>; die Stichprobenverteilung nähert sich bei
          wachsendem n einer Normalform. Der zentrale Grenzwertsatz hat
          Bedingungen. Abhängigkeit, schwere Verteilungsschwänze, kleine
          Stichproben und wechselnde Populationen können die Approximation
          verschlechtern.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="01.2">Der Data-Science-Zyklus</SectionLabel>
        <h2 className="h2">
          Sechs wiederkehrende Phasen.{" "}
          <em>Die Reihenfolge hängt vom Problem ab.</em>
        </h2>
        <p className="prose">
          Ein nützlicher Arbeitszyklus umfasst{" "}
          <strong>
            Daten → Exploration → Bereinigung → Merkmale → Modell → Evaluation
          </strong>{" "}
          und beginnt danach erneut. Spätere Kapitel ergänzen Experimente,
          Kausalanalyse und Betrieb.
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
            "<b>Modellieren vor der Exploration.</b> Wer <code>model.fit()</code> ausführt, bevor die Daten visualisiert wurden, kann versehentlich eine Indexspalte lernen.",
            "<b>Die falsche Kennzahl optimieren.</b> Hohe Güte auf einer irrelevanten Kennzahl ist schlechter als mäßige Güte auf der richtigen Kennzahl.",
            "<b>Korrelation mit Kausalität verwechseln.</b> Wenn Nutzer mit Kontakt zu Funktion X länger bleiben, beweist das keine kausale Wirkung von X.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Die Zielpopulation benennen.</b> Angeben, wie Auswahl, Zuweisung, Fehlwerte und Messung die Schätzung begrenzen.",
          "<b>Der zentrale Grenzwertsatz hat Bedingungen.</b> In vielen unabhängigen Situationen mit endlicher Varianz werden Mittelwerte bei wachsendem n annähernd normal; die Eignung prüfen.",
          "<b>Den Zyklus als Kontrollsystem verwenden.</b> Nach neuen Daten oder Transformationen erneut explorieren, validieren und überwachen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
