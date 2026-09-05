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
        hook="Kein Experiment möglich, und trotzdem soll eine Wirkung belegt werden. Dafür gibt es DAGs, Backdoor-Anpassung, Difference-in-Differences und Instrumentvariablen. Die Mathematik ist anspruchsvoll. Das fachliche Urteil noch mehr."
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
          Im synthetischen Beispiel treibt die Temperatur den Eisverkauf und die
          Todesfälle durch Ertrinken. Heraus kommt eine positive
          Gesamtassoziation, obwohl Eis nichts bewirkt. Innerhalb der drei
          konstruierten Temperaturgruppen schrumpft sie deutlich. Reale Daten
          brauchen dafür ein Kausalmodell, Messprüfungen und Unsicherheit;
          Stratifizierung allein beweist keine vollständige Entzerrung.
        </p>
        <ConfoundingSimulator />
      </section>

      <section className="section">
        <SectionLabel n="09.2">Kausale Graphen</SectionLabel>
        <h2 className="h2">
          Den DAG <em>vor</em> der Regression zeichnen.
        </h2>
        <p className="prose">
          Ein gerichteter azyklischer Graph (DAG) hält fest, welche kausalen
          Beziehungen du annimmst. Knoten sind Variablen, Pfeile sind Annahmen
          über direkte Effekte. Stimmt der Graph und ist der Estimand
          ausgesprochen, folgen daraus mögliche Anpassungsmengen. Die Daten
          bestätigen die Pfeile nicht von selbst, und vier Lehrmuster sind kein
          vollständiges Kausalmodell.
        </p>
        <DAGBuilder />
      </section>

      <section className="section">
        <SectionLabel n="09.3">Klassische DAG-Muster</SectionLabel>
        <h2 className="h2">Confounder. Collider. Mediator.</h2>
        <p className="prose">
          Confounder, Collider und Mediatoren verlangen jeweils eine andere
          Anpassungsentscheidung. Keine Regressionssoftware liest die kausale
          Rolle einer Spalte aus der Tabelle ab; sie steht im angegebenen
          Graphen und in den Fachannahmen.
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
          behandelten Gruppe mit der Veränderung einer unbehandelten
          Kontrollgruppe im selben Zeitraum. Unter parallelen Trends, ohne
          Antizipation und Interferenz sowie bei stabiler Zusammensetzung bildet
          der Kontrolltrend die kontrafaktische Veränderung der behandelten
          Gruppe ab. Ähnliche Vortrends stützen das Design, beweisen aber nicht
          den unbeobachteten Trend nach dem Treatment.
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
          Instrumentvariablen-Design einen Effekt nur unter starken Annahmen. Z
          muss X beeinflussen (Relevanz), darf Y ausschließlich über X
          beeinflussen (Exklusion) und muss von unbeobachteten Ursachen von Y
          unabhängig sein (Exogenität). Bei heterogenen Effekten kommt Monotonie
          dazu. Diese Annahmen stammen aus Design und Fachwissen, nicht aus der
          ersten Stufe.
        </p>
        <InstrumentalVariable />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Unter dem angenommenen DAG für einen Collider kontrollieren.</b> Dies kann eine nichtkausale Beziehung zwischen seinen Ursachen öffnen und Selektionsbias erzeugen.",
          "<b>Bei Schätzung des Gesamteffekts für einen Mediator kontrollieren.</b> Dies blockiert einen Teil des Pfads; Mediationsanalyse benötigt ein anderes Estimand und zusätzliche Annahmen.",
          "<b>Auf alles regressieren.</b> Mehr Kontrollvariablen ≠ bessere Schätzung. Der DAG bestimmt die Anpassungsmenge.",
          "<b>Die F-Statistik der ersten Stufe als IV-Gültigkeitstest behandeln.</b> Stärke belegt weder Exklusion noch Exogenität; der konventionelle Wert 10 ist nur ein kontextabhängiger Weak-IV-Screen.",
          "<b>Dynamik vor dem Treatment in DiD ignorieren.</b> Event-Time-Schätzungen zeichnen und Zusammensetzung, Antizipation sowie andere Schocks vor der Interpretation prüfen.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Zuerst den DAG zeichnen.</b> Vor jeder Zeile Code, gemeinsam mit der Fachexpertin aus dem Betrieb. Sie sieht den falschen Pfeil.",
          "<b>Das Backdoor-Kriterium auf den angenommenen Graphen anwenden.</b> Eine hinreichende Anpassungsmenge finden und plausible ausgelassene Strukturen per Sensitivitätsanalyse prüfen.",
          "<b>Verhalten vor dem Treatment für DiD diagnostizieren.</b> Divergenz ist ein Warnsignal; Ähnlichkeit beweist keine parallelen Trends nach dem Treatment.",
          "<b>Diagnostik der ersten Stufe und Weak-IV-robuste Inferenz berichten.</b> Eine F-Statistik über 10 validiert das Instrument nicht; die passende Diagnostik hängt vom Design ab.",
          "<b>Den gewünschten Effekt benennen.</b> Gesamteffekt, direkter Effekt oder Local Average Treatment Effect (LATE).",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Den DAG vor der Regression zeichnen.</b> Annahmen offenlegen und eine Anpassungsmenge vorschlagen; der Graph ist kein Beleg für die Richtigkeit seiner Pfeile.",
          ' <b>"Für X kontrollieren" ist nicht harmlos.</b> Die Wirkung hängt vollständig von der strukturellen Rolle von X ab.',
          "<b>Kausale Inferenz aus Beobachtungsdaten braucht starke Annahmen.</b> Schreib sie hin und begründe sie.",
          "<b>Randomisierung bevorzugen, wenn sie machbar, ethisch und korrekt umgesetzt ist.</b> Andernfalls das Design mit den am besten begründbaren und prüfbaren Identifikationsannahmen wählen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
