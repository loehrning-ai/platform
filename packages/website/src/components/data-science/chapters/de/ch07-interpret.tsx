import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  BestPractices,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { GlobalVsLocal } from "@/components/data-science/simulators/global-vs-local";
import { LIMEExplainer } from "@/components/data-science/simulators/lime-explainer";
import { PermutationImportance } from "@/components/data-science/simulators/permutation-importance";
import { SHAPWaterfallSim } from "@/components/data-science/simulators/shap-waterfall-sim";

export default function Ch07InterpretDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 07 · Interpretation"
        title="Erklärungsverfahren beantworten <em>bestimmte Fragen.</em>"
        hook="Gute Vorhersagen erklären noch nichts. SHAP, LIME und Permutationswichtigkeit beschreiben je einen Ausschnitt des Modellverhaltens, unter Referenzdaten und Annahmen, die du benennen musst."
        meta={[
          { k: "Lesezeit", v: "10 min" },
          { k: "Inhalt", v: "SHAP · LIME · Permutation" },
          { k: "Simulationen", v: "4 interaktive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="07.1">
          Erklärungen einzelner Vorhersagen mit SHAP
        </SectionLabel>
        <h2 className="h2">SHAP: Spieltheorie für ML.</h2>
        <p className="prose">
          SHAP (SHapley Additive exPlanations) verteilt eine Vorhersage additiv
          auf Merkmale, über Shapley-Werte und eine gewählte
          Hintergrundverteilung, und erklärt das Modell relativ zu dieser
          Referenz. Korrelierte Merkmale, bedingte oder interventionelle
          Annahmen und die Approximation verschieben die Zuweisung.
        </p>
        <SHAPWaterfallSim />
      </section>

      <section className="section">
        <SectionLabel n="07.2">Lokale Approximation mit LIME</SectionLabel>
        <h2 className="h2">
          Komplexes Modell, einfache Erklärung in lokaler Nähe.
        </h2>
        <p className="prose">
          LIME (Local Interpretable Model-agnostic Explanations) stellt eine
          lokale Frage:{" "}
          <em>
            Welches lineare Modell bildet das Verhalten des Modells um diesen
            Punkt ab?
          </em>{" "}
          LIME zieht nahe Punkte, gewichtet sie nach Entfernung und passt ein
          kleines Ersatzmodell an. Die Güte hängt von Perturbationsstichprobe,
          Merkmalsdarstellung, Kernelbreite und lokalem Modell ab.
        </p>
        <LIMEExplainer />
      </section>

      <section className="section">
        <SectionLabel n="07.3">
          Globale Merkmalswichtigkeit durch Permutation
        </SectionLabel>
        <h2 className="h2">Eine Spalte zerstören. Den Schaden messen.</h2>
        <p className="prose">
          Mischst du eine Spalte durch, verliert das Merkmal seinen Bezug zum
          Ziel, und das Modell rechnet weiter. Der Metrikverlust schätzt, wie
          stark es unter der Evaluationsverteilung daran hing. Korrelierte oder
          ersetzbare Prädiktoren verdecken einander, und das Ergebnis hängt an
          Metrik, Datensatz, Gruppierung und Permutationsschema.
        </p>
        <PermutationImportance />
      </section>

      <section className="section">
        <SectionLabel n="07.4">Global ≠ lokal</SectionLabel>
        <h2 className="h2">
          Das durchschnittliche Modellverhalten kann für{" "}
          <em>eine konkrete Person</em> falsch sein.
        </h2>
        <p className="prose">
          Ein Merkmal kann global weit oben stehen und eine einzelne Vorhersage
          kaum bewegen, oder umgekehrt. Individuelle Attribution, Untergruppenleistung, Kalibrierung und
          Fairness-Metriken sind getrennte Evidenz, und eine lokale Erklärung
          allein belegt weder Fairness noch Konformität.
        </p>
        <GlobalVsLocal />
      </section>

      <section className="section">
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Merkmalswichtigkeit als Kausalität lesen.</b> Ein hoher SHAP-Wert bedeutet, dass das Modell ein Merkmal <em>verwendet</em>; eine Änderung des Merkmals muss das Ergebnis nicht ändern (siehe Kapitel 09).",
            "<b>Den LIME-Radius zu groß wählen.</b> Dann spannt sich die lineare Approximation über nichtlineare Bereiche und führt in die Irre.",
            "<b>Auf Trainingsdaten permutieren.</b> Nimm Evaluationsdaten, die den Einsatz abbilden; Trainingsrückgänge vermischen Abhängigkeit mit Overfitting.",
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<b>SHAP für additive Attribution:</b> Explainer, Ausgabeskala, Hintergrunddaten, Behandlung von Merkmalsabhängigkeit und Approximationsfehler angeben. Effizienz gilt für die gewählte SHAP-Formulierung, nicht für jede Implementierungsausgabe.",
            "<b>Permutation für Abhängigkeit auf Evaluationsdaten:</b> Metrik und Permutationseinheit wählen und korrelierte Merkmale bei Bedarf gemeinsam lesen.",
            "<b>LIME für ein lokales Ersatzmodell:</b> Lokalität, Perturbationsverteilung, Ersatzmodellgüte und Stabilität über Seeds berichten.",
            "<b>Stabilität von Wichtigkeitsschätzungen zeigen.</b> Stochastische Verfahren wiederholen und Streuung berichten; von Konfidenz nur bei begründeter Stichprobeninterpretation sprechen.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Erklärungsbedarf vor dem Deployment definieren.</b> Zielgruppe, Entscheidung, Ausgabeskala, Referenzdaten und akzeptierte Grenzen festlegen.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
