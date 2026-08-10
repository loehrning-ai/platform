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
        hook="Prädiktive Güte und Erklärung beantworten verschiedene Fragen. SHAP, LIME und Permutationswichtigkeit beschreiben ausgewählte Aspekte des Modellverhaltens unter benannten Referenzdaten und Methodenannahmen."
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
          SHAP (SHapley Additive exPlanations) definiert additive
          Merkmalsattributionen über Shapley-Werte und eine gewählte
          Hintergrundverteilung. Das Ergebnis erklärt das Modell relativ zu
          dieser Referenz; korrelierte Merkmale, bedingte oder interventionelle
          Annahmen und Approximation verändern die Zuweisung. Das lokale Panel
          ist ein handgebautes additives Lehrmodell, keine Ausgabe eines
          angepassten SHAP-Explainers.
        </p>
        <SHAPWaterfallSim />
      </section>

      <section className="section">
        <SectionLabel n="07.2">Lokale Approximation mit LIME</SectionLabel>
        <h2 className="h2">
          Komplexes Modell, einfache Erklärung in lokaler Nähe.
        </h2>
        <p className="prose">
          LIME (Local Interpretable Model-agnostic Explanations) ersetzt die
          Frage nach der globalen Komplexität durch eine lokale Frage:{" "}
          <em>
            Welches lineare Modell bildet das Verhalten des Modells um diesen
            Punkt ab?
          </em>{" "}
          LIME zieht nahe Punkte, gewichtet sie nach Entfernung und passt ein
          kleines Ersatzmodell an. Die Güte hängt von Perturbationsstichprobe,
          Merkmalsdarstellung, Kernelbreite und lokalem Modell ab. Der
          Abfragepunkt untersucht hier eine feste Lehrfläche.
        </p>
        <LIMEExplainer />
      </section>

      <section className="section">
        <SectionLabel n="07.3">
          Globale Merkmalswichtigkeit durch Permutation
        </SectionLabel>
        <h2 className="h2">Eine Spalte zerstören. Den Schaden messen.</h2>
        <p className="prose">
          Permutationswichtigkeit trennt ein Merkmal vom Ziel, indem seine
          Spalte zufällig gemischt wird. Das Modell läuft weiter, doch dieses
          Merkmal ist nun permutiert. Die Metrikänderung schätzt die
          Abhängigkeit des Modells von diesem Merkmal unter der
          Evaluationsverteilung. Korrelierte oder ersetzbare Prädiktoren können
          einander verdecken; das Ergebnis hängt von Metrik, Datensatz,
          Gruppierung und Permutationsschema ab. Das Verfahren ist
          modellunabhängig, aber nicht annahmenfrei.
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
          Ein Merkmal kann global hoch eingestuft sein und eine einzelne
          Vorhersage kaum verändern; umgekehrt gilt dasselbe. Ein Datenpunkt
          vergleicht seinen lokalen SHAP-Beitrag mit der globalen Wichtigkeit.
          Individuelle Attribution, Untergruppenleistung, Kalibrierung und
          Fairness-Metriken sind unterschiedliche Evidenz. Anwendbare Governance
          kann mehrere davon verlangen; eine lokale Erklärung allein belegt
          weder Fairness noch regulatorische Konformität.
        </p>
        <GlobalVsLocal />
      </section>

      <section className="section">
        <AntiPatterns
          title="Fehlmuster"
          items={[
            "<b>Merkmalswichtigkeit als Kausalität lesen.</b> Ein hoher SHAP-Wert bedeutet, dass das Modell ein Merkmal <em>verwendet</em>, nicht dass eine Änderung des Merkmals das Ergebnis verändert; siehe Kapitel 09.",
            "<b>Für Einzelentscheidungen nur globaler Wichtigkeit vertrauen.</b> Globale Rangfolgen können den Treiber einer einzelnen Vorhersage vollständig falsch darstellen.",
            "<b>Den LIME-Radius zu groß wählen.</b> Dann deckt die lineare Approximation nichtlineare Bereiche ab und führt in die Irre.",
            "<b>Auf Trainingsdaten permutieren.</b> Evaluationsdaten verwenden, die den Einsatz abbilden; Trainingsrückgänge vermischen Abhängigkeit und Overfitting.",
          ]}
        />
        <BestPractices
          title="Bewährte Verfahren"
          items={[
            "<b>SHAP für additive Attribution:</b> Explainer, Ausgabeskala, Hintergrunddaten, Behandlung von Merkmalsabhängigkeit und Approximationsfehler angeben. Effizienz gilt für die gewählte SHAP-Formulierung, nicht jede Implementierungsausgabe.",
            "<b>Permutation für Abhängigkeit auf Evaluationsdaten:</b> Metrik und Permutationseinheit wählen und korrelierte Merkmale bei Bedarf gemeinsam interpretieren.",
            "<b>LIME für ein lokales Ersatzmodell:</b> Lokalität, Perturbationsverteilung, Ersatzmodellgüte und Stabilität über Seeds berichten.",
            "<b>Stabilität von Wichtigkeitsschätzungen zeigen.</b> Stochastische Verfahren wiederholen und Streuung berichten; nur bei begründeter Stichprobeninterpretation von Konfidenz sprechen.",
          ]}
        />
      </section>

      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Erklärungsbedarf vor dem Deployment definieren.</b> Zielgruppe, Entscheidung, Ausgabeskala, Referenzdaten und akzeptable Grenzen festlegen.",
          "<b>Erklärung an die Frage anpassen.</b> Additive Attribution, Abhängigkeit auf Evaluationsdaten und lokale Ersatzmodellgüte sind verschiedene Größen.",
          "<b>Korrelation ≠ Mechanismus.</b> Merkmalswichtigkeit ist kein kausaler Einfluss; siehe Kapitel 09.",
          "<b>Globale, gruppenbezogene und individuelle Evidenz unterscheiden.</b> Jede für die Entscheidung erforderliche Ebene prüfen und Fairness nicht aus einem Attributionsdiagramm ableiten.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
