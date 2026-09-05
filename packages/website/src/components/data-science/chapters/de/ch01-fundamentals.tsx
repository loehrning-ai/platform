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
        hook="Vor jedem Modell, jeder SQL-Abfrage, jedem Dashboard stehen drei Unterscheidungen: <strong>Stichprobe und Grundgesamtheit.</strong> <strong>Signal und Rauschen.</strong> <strong>Korrelation und Kausalität.</strong> Sitzen die drei, sitzt der Rest."
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
          Ein fiktiver Dienst mit <strong>44 Millionen Nutzern</strong>, darin
          ein A/B-Test mit <strong>180,000</strong> geeigneten Beobachtungen.
          Die Retention-Differenz von 2.3% schätzt eine Größe der
          Grundgesamtheit. Was sie bedeutet, hängt an Zuweisung, Fehlwerten,
          Messung, Ziehung und Unsicherheit.
        </p>
        <p className="prose">
          Datenwissenschaft rechnet auf <code>samples</code> und redet über{" "}
          <code>populations</code> oder künftige Fälle. Konfidenzintervalle,
          Tests, Validierung und Versuchsdesign beziffern verschiedene Teile
          dieser Unsicherheit. Keines repariert eine verzerrte Stichprobe oder
          ungültige Messung.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Schieb <code>n</code> von 2 auf 100. In diesem unabhängigen Generator
          mit endlicher Varianz skaliert der Standardfehler des Mittelwerts mit{" "}
          <code>1/√n</code>; die Stichprobenverteilung nähert sich mit
          wachsendem n der Normalform. Der Grenzwertsatz hat Bedingungen.
          Abhängigkeit, schwere Verteilungsschwänze, kleine Stichproben und
          wechselnde Grundgesamtheiten verschlechtern die Approximation.
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
          später dazu.
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
            "<b>Fitten, bevor du hinschaust.</b> Wer <code>model.fit()</code> ungeplottet laufen lässt, liefert ein Modell mit gelernter Indexspalte aus.",
            "<b>Eine Zahl optimieren, nach der niemand gefragt hat.</b> Hohe Güte auf der falschen Kennzahl ist schlechter als mäßige auf der richtigen.",
            "<b>Korrelation für Kausalität halten.</b> „Wer Funktion X sieht, bleibt länger“ heißt nicht, dass X die Retention verursacht.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Nenn die Zielpopulation.</b> Und wie Ziehung, Zuweisung, Fehlwerte und Messung sie begrenzen.",
          "<b>Der zentrale Grenzwertsatz hat Bedingungen.</b> In vielen unabhängigen Situationen mit endlicher Varianz werden Mittelwerte bei wachsendem n annähernd normal. Prüf die Eignung.",
          "<b>Nutz den Zyklus als Kontrollsystem.</b> Explorier, validier und überwach, wo neue Daten oder Transformationen alte Evidenz entwerten.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
