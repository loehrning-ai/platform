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
        hook="Ungeplante Analysen verschieben Fehlerraten. Peeking, Mehrfachvergleiche, optionales Stoppen und Kovariatenanpassung gehören dazu. Jede Korrektur bringt eigene Annahmen mit, und die gehören benannt."
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
          ersten p&lt;0.05 abbricht, hat den nominellen Grenzwert von 5% für das
          Gesamtexperiment verloren. Wie weit, hängt an Prüfplan, maximaler
          Stichprobe, Ergebnismodell und Abhängigkeit der Prüfungen. Der
          Simulator schätzt genau eine konfigurierte Versuchsanordnung und keine
          allgemeine Peeking-Rate.
        </p>
        <PeekingSimulator />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<strong>Kontinuierliches Monitoring mit α für eine feste Stichprobe:</strong> Wiederholt prüfen und beim ersten p&lt;0.05 stoppen macht die ursprüngliche Fehlerkalibrierung ungültig.",
            '<strong>"Gestern war es signifikant":</strong> Der p-Wert ist eine Zufallsvariable. Ein einzelner Ausschlag unter den Grenzwert ist keine Entdeckung.',
            "<strong>HARKing (Hypothesising After Results are Known):</strong> Ein erst nach Sichtung der Daten gefundenes Muster ist explorativ und muss mit neuen Daten bestätigt werden.",
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<strong>Vorab registrieren:</strong> Stichprobengröße, Primärmetrik und Testdauer festlegen, bevor Daten erhoben werden.",
            "<strong>Ein geplantes sequenzielles Design verwenden,</strong> etwa gruppensequenzielle Grenzen, α-Spending oder mSPRT, und dessen Modell- und Stoppannahmen prüfen.",
            "<strong>Bei bayesschen Entscheidungen</strong> Likelihood, Prior, Verlust und Stoppregel vorab festlegen; bei notwendiger Fehlerkontrolle auch frequentistische Betriebseigenschaften prüfen.",
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
          α = 0.05 lautet 1 − (1 − 0.05)ⁿ. Für n = 20 sind das etwa 64%. Die
          Formel unterstellt unabhängige Tests und gültige Null-p-Werte; mit
          Abhängigkeiten verschiebt sich die Family-Wise Error Rate.
        </p>
        <MultipleTesting />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<strong>Jede grüne Metrik ohne FWER-Korrektur berichten:</strong> So wird aus Rauschen eine Erfolgsmeldung.",
            "<strong>Nachträglich Segmente durchsuchen:</strong> Wer 20 Segmente schneidet, bis eines gut aussieht, hat 20 Tests gemacht.",
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<strong>Bonferroni-Korrektur:</strong> α/n je Test verwenden. Konservativ, aber einfach.",
            "<strong>Benjamini-Hochberg</strong> (FDR): kontrolliert den erwarteten Anteil falscher Entdeckungen unter den zugehörigen Abhängigkeitsbedingungen.",
            "<strong>Eine Primärmetrik benennen,</strong> bevor der Test startet. Sekundärmetriken informieren, entscheiden aber nicht.",
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
          CUPED (Controlled-experiment Using Pre-Experiment Data) nimmt eine
          Kovariate X aus dem Vorzeitraum, die mit dem Ergebnis Y korreliert,
          und baut daraus eine bereinigte Metrik Ŷ. Bei randomisierter
          Zuweisung, einer echten Vorbehandlungsvariable und korrekt geschätzter
          Anpassung sinkt die Varianz des Schätzers. Die Punktschätzung kann
          sich in einer endlichen Stichprobe trotzdem verschieben, und wie viel
          das bringt, hängt an Vorhersagekraft und Umsetzung.
        </p>
        <CUPEDExplainer />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<strong>Nur vor der Zuweisung gemessene Kovariaten verwenden.</strong> Variablen nach dem Treatment können einen Teil des Effekts aufnehmen und den Vergleich verzerren.",
            "Geeignet sind etwa frühere Werte der Zielmetrik oder stabil gemessenes Verhalten aus dem Vorzeitraum.",
            "θ mit einem Verfahren schätzen, das zur Randomisierung und zur Standardfehlerberechnung passt; bei flexiblen Modellen kann Cross-Fitting helfen.",
            "Rohe und bereinigte Schätzung berichten. Eine schwache oder instabile Kovariate bringt wenig Präzisionsgewinn; Fehler in der Umsetzung können das Ergebnis verschlechtern.",
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
          übersieht einen echten Effekt und belegt trotzdem einen
          Experimentplatz. Den Ausschlag gibt der minimal nachweisbare Effekt
          (MDE). In üblichen Näherungen für zwei Gruppen vervierfacht eine
          halbierte MDE ungefähr die erforderliche Stichprobe, sofern Varianz,
          α, Power und Zuteilung gleich bleiben. Rechne die Power <em>vor</em>{" "}
          der Erhebung und nenn das Modell, mit dem du gerechnet hast.
        </p>
        <PowerCalculator />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<strong>Bis zur Signifikanz laufen lassen:</strong> Das entspricht Peeking und vermischt Effektgröße mit Zufall.",
            "<strong>MDE bei der Laufzeitplanung ignorieren:</strong> Ein Test mit 30% Power besteht überwiegend aus Rauschen.",
            '<strong>Nullergebnisse aus Tests mit zu geringer Power</strong> als "kein Effekt gefunden" berichten: Fehlende Evidenz ≠ Evidenz für das Fehlen.',
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "Ein Power-Ziel, häufig 80% oder 90%, aus den Kosten übersehener Effekte und der verfügbaren Stichprobe ableiten; kein Wert gilt universell.",
            "Historische Varianz und Konversionsrate verwenden und Sensitivität gegenüber Drift, Ausfällen, ungleicher Zuteilung und Multiplizität prüfen.",
            "Eine validierte Vorbehandlungsanpassung kann das erforderliche n durch geringere Varianz reduzieren; den Gewinn vorab nicht unterstellen.",
            "Einen Rechner verwenden, dessen Ergebnistyp, Zuteilung, Test und Analyseplan zum Experiment passen.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Ungeplantes Stoppen verändert den Test.</b> Halt den festen Plan ein, oder nimm gleich ein sequenzielles Verfahren, das für Zwischenanalysen gebaut ist.",
          "<b>Multiplizität benötigt ein Fehlerziel.</b> Bonferroni kontrolliert die Family-Wise Error Rate; BH zielt unter benannten Bedingungen auf die False Discovery Rate.",
          "<b>CUPED ist bedingt, nicht automatisch.</b> Zeitpunkt, Unabhängigkeit von der Zuweisung, Vorhersagekraft und Standardfehler prüfen; rohe und bereinigte Ergebnisse berichten.",
          "<b>Power ist eine Designrechnung.</b> Gib Effekt, Varianz, Zuteilung, α, Test, Ausfälle und Multiplizität an.",
          "<b>Vorabregistrierung trennt Bestätigung von Exploration.</b> Primärmetrik, Analyse, Stoppregel und Ausschlüsse vor Sichtung der Ergebnisse festhalten.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
