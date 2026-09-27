import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { Hero, SectionLabel, Takeaway } from "../../primitives";
import { LivingPipeline } from "../../simulators/living-pipeline";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch9CapstoneDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch9CapstoneDe({ chapter }: Ch9CapstoneDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Eine von <span class='accent'>sechs modellierten Kontrollen</span> ändern und das Ergebnis prüfen."
        hook="Sechs Kurskontrollen treffen in einer simulierten <code>dim_users</code>-Pipeline zusammen. Jeder Fehlerzustand zeigt, wie eine plausible Ausgabe Vollständigkeit, Wiederholungsschutz oder Veröffentlichungsnachweis verliert."
        meta={[
          { k: "Datensatz", v: "dim_users" },
          { k: "Kontrollen", v: "6 ausgewählte Kurskontrollen" },
          { k: "Verbraucher", v: "Dashboards · Notebooks · Analyse" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">Die laufende Pipeline</SectionLabel>
        <h2 className="h2">Simulierte Zeilen durchlaufen sechs ausgewählte Kontrollen.</h2>
        <p className="prose">
          Jeder Punkt ist eine simulierte Nutzerzeile. Das Szenario modelliert einen additiven Merge, Wiederholungsschutz,
          Nachzüglerbehandlung, Orchestrierung, ausgewählte Qualitätsprüfungen und eine registrierte Metrik, keine vollständige
          Produktionsarchitektur.
        </p>
        <p className="prose">
          Änder eine Kontrolle unter einer Stufe, beobachte Zeilen und Signalzustand, führ dann die Analyseabfrage aus und vergleich den Wert mit
          Quellenkontext und Prüfnachweisen.
        </p>
        <LivingPipeline />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "Ein Signal trennt einen abgeschlossenen Schreibvorgang von einem, der die benannten Prüfungen bestanden hat.",
          "Eine plausible Zahl braucht Quelle, Stichtag, Definitionsversion und Prüfnachweise, bevor jemand sie interpretieren kann.",
          "Verfolg einen Fehler bis zum verantwortlichen Vertrag zurück und bau den betroffenen Zustand neu auf, statt das Symptom nachgelagert zu verdecken.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch9CapstoneDe;
