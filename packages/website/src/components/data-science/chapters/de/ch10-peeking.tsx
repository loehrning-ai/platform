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
        hook="Peeking, Mehrfachvergleiche, optionales Stoppen und Kovariatenanpassung: Ungeplante Analysen verändern Fehlerraten. Jede Korrektur benötigt klar benannte Annahmen."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          { k: "Inhalt", v: "Peeking · CUPED · Power · MC" },
          { k: "Simulationen", v: "4 interaktive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">Peeking und optionales Stoppen</SectionLabel>
        <h2 className="h2">
          Wiederholte unkorrigierte Zwischenanalysen können die
          Falsch-Positiv-Rate erhöhen.
        </h2>
        <p className="prose">
          Wird ein Test für eine feste Stichprobe wiederholt geprüft und beim
          ersten p&lt;0.05 beendet, kontrolliert der nominelle Grenzwert von 5%
          den Fehler 1. Art für das gesamte Experiment nicht mehr. Die
          tatsächliche Rate hängt von Prüfplan, maximaler Stichprobe,
          Ergebnismodell und Abhängigkeit der Prüfungen ab. Der Simulator
          schätzt genau eine konfigurierte Versuchsanordnung, keine allgemeine
          Peeking-Rate.
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
          α = 0.05 lautet 1 − (1 − 0.05)ⁿ. Für n = 20 ergibt das etwa 64%. Diese
          Formel setzt unabhängige Tests und gültige Null-p-Werte voraus;
          Abhängigkeiten verändern die Family-Wise Error Rate.
        </p>
        <MultipleTesting />
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<strong>Jede grüne Metrik ohne FWER-Korrektur berichten:</strong> Das macht aus Rauschen eine Erfolgsmeldung.",
            "<strong>Nachträglich Segmente durchsuchen:</strong> 20 Segmente zu schneiden, bis eines gut aussieht, entspricht 20 Tests.",
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
          CUPED (Controlled-experiment Using Pre-Experiment Data) nutzt eine
          Kovariate X aus dem Vorzeitraum, die mit dem Ergebnis Y korreliert,
          und konstruiert eine bereinigte Metrik Ŷ. Bei randomisierter
          Zuweisung, einer echten Vorbehandlungsvariable und korrekt geschätzter
          Anpassung kann dies die Varianz des Schätzers senken. Die
          Punktschätzung kann sich in einer endlichen Stichprobe verändern; der
          Nutzen hängt von Vorhersagekraft und Umsetzung ab.
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
          übersieht einen echten Effekt und belegt dennoch einen
          Experimentplatz. Der minimal nachweisbare Effekt (MDE) bestimmt die
          Planung: In üblichen Näherungen für zwei Gruppen vervierfacht eine
          halbierte MDE ungefähr die erforderliche Stichprobe, wenn Varianz, α,
          Power und Zuteilung gleich bleiben. Power <em>vor</em> der Erhebung
          berechnen und das verwendete Modell benennen.
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
          "<b>Ungeplantes Stoppen verändert den Test.</b> Den festen Plan einhalten oder ein für Zwischenanalysen entworfenes sequenzielles Verfahren verwenden.",
          "<b>Multiplizität benötigt ein Fehlerziel.</b> Bonferroni kontrolliert die Family-Wise Error Rate; BH zielt unter benannten Bedingungen auf die False Discovery Rate.",
          "<b>CUPED ist bedingt, nicht automatisch.</b> Zeitpunkt, Unabhängigkeit von der Zuweisung, Vorhersagekraft und Standardfehler prüfen; rohe und bereinigte Ergebnisse berichten.",
          "<b>Power ist eine Designrechnung.</b> Effekt, Varianz, Zuteilung, α, Test, Ausfälle und Multiplizität angeben.",
          "<b>Vorabregistrierung trennt Bestätigung von Exploration.</b> Primärmetrik, Analyse, Stoppregel und Ausschlüsse vor Sichtung der Ergebnisse festhalten.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
