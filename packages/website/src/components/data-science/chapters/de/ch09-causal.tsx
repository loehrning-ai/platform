import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  BestPractices,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { ConfoundingSimulator } from "@/components/data-science/simulators/confounding-simulator";
import { DAGBuilder } from "@/components/data-science/simulators/dag-builder";
import { DAGViewer } from "@/components/data-science/simulators/dag-viewer";
import { DifferenceInDifferences } from "@/components/data-science/simulators/difference-in-differences";
import { InstrumentalVariable } from "@/components/data-science/simulators/instrumental-variable";

export default function Ch09CausalDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 09 · Kausalität"
        title='Korrelation ist eine <em>Hypothese.</em><br/>Kausalität verlangt <span class="accent">Arbeit.</span>'
        hook="Ohne Experiment stützen sich kausale Aussagen auf DAGs, Backdoor-Anpassung, Difference-in-Differences und Instrumentvariablen, und auf dein Urteil über deren Annahmen."
        meta={[
          { k: "Lesezeit", v: "14 min" },
          { k: "Inhalt", v: "DAGs · DiD · IV" },
          { k: "Simulationen", v: "4 interaktive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="09.1">Die verborgene Variable</SectionLabel>
        <h2 className="h2">
          Eine Korrelation, die <em>kausal aussieht.</em>
        </h2>
        <p className="prose">
          Im synthetischen Beispiel treibt die Temperatur Eisverkauf und
          Todesfälle durch Ertrinken, also entsteht eine positive Assoziation,
          obwohl Eis nichts bewirkt. Innerhalb der drei Temperaturgruppen
          schrumpft sie.
        </p>
        <ConfoundingSimulator />
      </section>

      <section className="section">
        <SectionLabel n="09.2">Kausale Graphen</SectionLabel>
        <h2 className="h2">
          Den DAG <em>vor</em> der Regression zeichnen.
        </h2>
        <p className="prose">
          Ein gerichteter azyklischer Graph (DAG) hält die kausalen Beziehungen
          fest, die du annimmst: Knoten sind Variablen, Pfeile sind Annahmen
          über direkte Effekte. Mit korrektem Graphen und ausgesprochenem
          Estimand folgen daraus mögliche Anpassungsmengen.
        </p>
        <DAGBuilder />
      </section>

      <section className="section">
        <SectionLabel n="09.3">Klassische DAG-Muster</SectionLabel>
        <h2 className="h2">Confounder, Collider und Mediator unterscheiden</h2>
        <p className="prose">
          Confounder, Collider und Mediatoren verlangen verschiedene
          Anpassungsentscheidungen. Keine Software liest eine kausale Rolle aus
          der Tabelle ab; sie folgt aus dem Graphen und den Fachannahmen.
        </p>
        <DAGViewer />
      </section>

      <section className="section">
        <SectionLabel n="09.4">Quasi-Experimente</SectionLabel>
        <h2 className="h2">
          Wenn Randomisierung unmöglich ist, ein <em>natürliches Experiment</em>{" "}
          finden.
        </h2>
        <p className="prose">
          Difference-in-Differences (DiD) vergleicht die Veränderung einer
          behandelten Gruppe mit der einer unbehandelten Kontrollgruppe. Unter
          parallelen Trends, ohne
          Antizipation und Interferenz sowie bei stabiler Zusammensetzung (oder
          einer Analyse, die Änderungen berücksichtigt) bildet
          der Kontrolltrend die kontrafaktische Veränderung der behandelten
          Gruppe ab. Ähnliche Vortrends stützen das Design, beweisen aber nichts
          über den unbeobachteten Trend nach dem Treatment.
        </p>
        <DifferenceInDifferences />
      </section>

      <section className="section">
        <SectionLabel n="09.5">Instrumentvariablen</SectionLabel>
        <h2 className="h2">
          Eine Variation in X mit begründbarer Exklusion und Exogenität finden.
        </h2>
        <p className="prose">
          Verzerren unbeobachtete Confounder das OLS, identifiziert ein
          Instrumentvariablen-Design einen Effekt nur unter starken Annahmen: Z
          beeinflusst X (Relevanz), wirkt auf Y nur über X (Exklusion) und ist
          von unbeobachteten Ursachen von Y unabhängig (Exogenität). Heterogene
          Effekte verlangen zusätzlich Monotonie. Du begründest diese Annahmen
          aus Design und Fachwissen; die erste Stufe klärt höchstens die
          Relevanz.
        </p>
        <InstrumentalVariable />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Auf alles regressieren.</b> Mehr Kontrollvariablen ≠ bessere Schätzung; der DAG bestimmt die Anpassungsmenge.",
          "<b>Die F-Statistik der ersten Stufe als IV-Gültigkeitstest behandeln.</b> Stärke belegt weder Exklusion noch Exogenität. Berichte Weak-IV-robuste Inferenz.",
          "<b>Dynamik vor dem Treatment in DiD ignorieren.</b> Zeichne Event-Time-Schätzungen und prüf vorher Zusammensetzung, Antizipation und andere Schocks.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Zuerst den DAG zeichnen,</b> vor jeder Zeile Code, und ihn Fachleuten zeigen; sie sehen falsche Pfeile.",
          "<b>Das Backdoor-Kriterium auf den angenommenen Graphen anwenden.</b> Eine hinreichende Anpassungsmenge finden und plausible ausgelassene Strukturen per Sensitivitätsanalyse prüfen.",
          "<b>Den gewünschten Effekt benennen.</b> Gesamteffekt, direkter Effekt oder Local Average Treatment Effect (LATE).",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Kausale Inferenz aus Beobachtungsdaten braucht starke Annahmen.</b> Schreib sie hin und begründe sie.",
          "<b>Randomisierung bevorzugen, wenn sie machbar, ethisch und korrekt umgesetzt ist.</b> Sonst das Design mit den am besten begründbaren und prüfbaren Identifikationsannahmen wählen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
