import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  BestPractices,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { CUPEDExplainer } from "@/components/data-science/simulators/cuped-explainer";
import { MultipleTesting } from "@/components/data-science/simulators/multiple-testing";
import { PeekingSimulator } from "@/components/data-science/simulators/peeking-simulator";
import { PowerCalculator } from "@/components/data-science/simulators/power-calculator";

export default function Ch10PeekingDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 10 · Peeking und Integrität von Experimenten"
        title='Wie <em>p-Werte</em> <span class="accent">täuschen.</span>'
        hook="Peeking, Mehrfachvergleiche, optionales Stoppen und Kovariatenanpassung verschieben Fehlerraten, und jede Korrektur bringt eigene Annahmen mit."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Peeking · CUPED · Power · MC" },
          { k: "Simulationen", v: "4 interaktive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">Peeking und optionales Stoppen</SectionLabel>
        <h2 className="h2">
          Unkorrigierte Zwischenanalysen können die Falsch-Positiv-Rate
          hochtreiben.
        </h2>
        <p className="prose">
          Wer einen Test für eine feste Stichprobe wiederholt prüft und beim
          ersten p&lt;0.05 abbricht, hält die nominellen 5% für das Experiment
          nicht mehr ein. Die echte Rate hängt an Prüfplan, maximaler
          Stichprobe, Ergebnismodell und Abhängigkeit der Prüfungen; der
          Simulator schätzt eine konfigurierte Anordnung, keine allgemeine
          Peeking-Rate.
        </p>
        <PeekingSimulator />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            '<strong>"Gestern war es signifikant":</strong> Der p-Wert ist eine Zufallsvariable, und ein einzelner Ausschlag unter den Grenzwert ist keine Entdeckung.',
            "<strong>HARKing (Hypothesising After Results are Known):</strong> Ein erst nach Sichtung der Daten gefundenes Muster ist explorativ und braucht Bestätigung auf neuen Daten.",
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<strong>Ein geplantes sequenzielles Design verwenden,</strong> etwa gruppensequenzielle Grenzen, α-Spending oder mSPRT, und dessen Modell- und Stoppannahmen prüfen.",
            "<strong>Bei bayesschen Entscheidungen</strong> Likelihood, Prior, Verlust und Stoppregel vorab festlegen; wenn Fehlerkontrolle zählt, auch frequentistische Betriebseigenschaften prüfen.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.2">Mehrfachvergleiche</SectionLabel>
        <h2 className="h2">
          Zwanzig gültige Nulltests ergeben bei α=0.05 im Erwartungswert ein
          falsch-positives Ergebnis.
        </h2>
        <p className="prose">
          Die Family-Wise Error Rate (FWER) für <em>n</em> unabhängige Tests bei
          α = 0.05 lautet 1 − (1 − 0.05)ⁿ, bei n = 20 etwa 64%. Die Formel
          unterstellt unabhängige Tests und gültige Null-p-Werte; Abhängigkeit
          verschiebt die Rate.
        </p>
        <MultipleTesting />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<strong>Nachträglich Segmente durchsuchen:</strong> 20 Segmente schneiden, bis eines gut aussieht, sind 20 Tests.",
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<strong>Bonferroni-Korrektur:</strong> α/n je Test verwenden; konservativ und einfach.",
            "<strong>Benjamini-Hochberg</strong> (FDR): kontrolliert den erwarteten Anteil falscher Entdeckungen unter seinen Abhängigkeitsbedingungen.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.3">CUPED</SectionLabel>
        <h2 className="h2">
          Vorperiodeninformationen können die Varianz unter passenden Annahmen
          senken.
        </h2>
        <p className="prose">
          CUPED (Controlled-experiment Using Pre-Experiment Data) baut aus einer
          Kovariate X aus dem Vorzeitraum, die mit dem Ergebnis Y korreliert,
          eine bereinigte Metrik Ŷ. Bei randomisierter Zuweisung, echter
          Vorbehandlungsvariable und korrekter Anpassung sinkt die Varianz des
          Schätzers. Die Punktschätzung kann sich in endlichen Stichproben
          trotzdem verschieben, und der Gewinn hängt an Vorhersagekraft und
          Umsetzung.
        </p>
        <CUPEDExplainer />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<strong>Nur vor der Zuweisung gemessene Kovariaten verwenden,</strong> etwa frühere Werte der Zielmetrik oder stabil gemessenes Verhalten aus dem Vorzeitraum. Variablen nach dem Treatment können einen Teil des Effekts aufnehmen und den Vergleich verzerren.",
            "θ mit einem Verfahren schätzen, das zur Randomisierung und Standardfehlerberechnung passt; bei flexiblen Modellen hilft Cross-Fitting.",
            "Rohe und bereinigte Schätzung berichten. Eine schwache oder instabile Kovariate bringt wenig Präzision, und Fehler in der Umsetzung verschlechtern das Ergebnis.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.4">Statistische Power</SectionLabel>
        <h2 className="h2">
          Tests mit zu geringer Power verschwenden Zeit und Geld.
        </h2>
        <p className="prose">
          Power = P(H₀ verwerfen | H₁ gilt). Eine Studie mit zu geringer Power
          übersieht echte Effekte und belegt trotzdem einen Experimentplatz. In
          üblichen Näherungen für zwei Gruppen vervierfacht ein halbierter
          minimal nachweisbarer Effekt (MDE) ungefähr die Stichprobe, bei
          gleicher Varianz, α, Power und Zuteilung. Rechne die Power{" "}
          <em>vor</em> der Erhebung und nenn das Modell.
        </p>
        <PowerCalculator />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<strong>MDE bei der Laufzeitplanung ignorieren:</strong> Ein Test mit 30% Power besteht überwiegend aus Rauschen.",
            '<strong>Nullergebnisse aus Tests mit zu geringer Power</strong> als "kein Effekt gefunden" berichten: Fehlende Evidenz ≠ Evidenz für das Fehlen.',
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "Das Power-Ziel, häufig 80% oder 90%, aus den Kosten übersehener Effekte und der verfügbaren Stichprobe ableiten; kein Wert gilt universell.",
            "Historische Varianz und Konversionsrate verwenden und Sensitivität gegenüber Drift, Ausfällen, ungleicher Zuteilung und Multiplizität prüfen.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Vorabregistrierung trennt Bestätigung von Exploration.</b> Primärmetrik, Analyse, Stoppregel und Ausschlüsse festhalten, bevor jemand Ergebnisse sieht.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
