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
        hook="Das Abschlussprojekt kombiniert sechs Kurskontrollen in einer simulierten <code>dim_users</code>-Pipeline. Jeder Fehlerzustand zeigt, wie eine plausible Ausgabe Vollständigkeit, Wiederholungsschutz oder Veröffentlichungsnachweis verlieren kann."
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
          Nachzüglerbehandlung, Orchestrierung, ausgewählte Qualitätsprüfungen und eine registrierte Metrik. Diese Kontrollen bilden keine
          vollständige Produktionsarchitektur.
        </p>
        <p className="prose">
          Eine Kontrolle unter einer Stufe ändern, modellierte Zeilen und Signalzustand beobachten und anschließend die Analyseabfrage ausführen.
          Den angezeigten Wert mit Quellenkontext und Prüfnachweisen vergleichen.
        </p>
        <LivingPipeline />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "Eine Pipeline verbindet Daten-, Ausführungs-, Qualitäts-, Zugriffs- und Bereitstellungsverträge; diese sechs bilden eine ausgewählte Lernmenge.",
          "Ein Signal trennt einen abgeschlossenen Schreibvorgang von einem Schreibvorgang, der die benannten Prüfungen bestand. Es beweist nicht jeden fachlichen Wert.",
          "Eine plausible Zahl benötigt Quelle, Stichtag, Definitionsversion und Prüfnachweise, bevor sie interpretiert werden kann.",
          "Einen Fehler zum verantwortlichen Vertrag zurückverfolgen und den betroffenen Zustand neu aufbauen, statt nur das nachgelagerte Symptom zu verdecken.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch9CapstoneDe;
