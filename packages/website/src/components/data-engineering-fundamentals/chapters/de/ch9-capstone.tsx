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
        hook="Sechs Kurskontrollen, eine simulierte <code>dim_users</code>-Pipeline. Jeder Fehlerzustand zeigt dieselbe Sache aus einem anderen Winkel: wie eine völlig plausible Ausgabe Vollständigkeit, Wiederholungsschutz oder Veröffentlichungsnachweis verliert."
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
          Jeder Punkt steht für eine simulierte Nutzerzeile. Das Szenario modelliert einen additiven Merge, Wiederholungsschutz,
          Nachzüglerbehandlung, Orchestrierung, ausgewählte Qualitätsprüfungen und eine registrierte Metrik. Eine vollständige
          Produktionsarchitektur ist das nicht.
        </p>
        <p className="prose">
          Änder eine Kontrolle unter einer Stufe, beobachte modellierte Zeilen und Signalzustand, führ danach die Analyseabfrage aus. Und stell
          den angezeigten Wert neben Quellenkontext und Prüfnachweise.
        </p>
        <LivingPipeline />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "Eine Pipeline verbindet Daten-, Ausführungs-, Qualitäts-, Zugriffs- und Bereitstellungsverträge; diese sechs bilden eine ausgewählte Lernmenge.",
          "Ein Signal trennt einen abgeschlossenen Schreibvorgang von einem Schreibvorgang, der die benannten Prüfungen bestand. Es beweist nicht jeden fachlichen Wert.",
          "Eine plausible Zahl braucht Quelle, Stichtag, Definitionsversion und Prüfnachweise, bevor du sie interpretierst.",
          "Verfolg einen Fehler bis zum verantwortlichen Vertrag zurück und bau den betroffenen Zustand neu auf. Das nachgelagerte Symptom zu verdecken ist keine Lösung.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch9CapstoneDe;
