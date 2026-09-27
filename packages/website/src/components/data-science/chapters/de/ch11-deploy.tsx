import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  BestPractices,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { DriftSimulator } from "@/components/data-science/simulators/drift-simulator";
import { FeatureStoreDiagram } from "@/components/data-science/simulators/feature-store-diagram";
import { ModelServingArchitecture } from "@/components/data-science/simulators/model-serving-architecture";
import { ShadowDeployment } from "@/components/data-science/simulators/shadow-deployment";

export default function Ch11DeployDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 11 · Betrieb"
        title="Ein bereitgestelltes Modell ist ein <em>gewartetes System.</em>"
        hook="Produktion verbindet Request-Verarbeitung, Merkmalsberechnung, Model Serving, Monitoring und Rollback. Jede Kontrolle senkt ein benanntes Risiko, keine zertifiziert das System."
        meta={[
          { k: "Lesezeit", v: "12 min" },
          {
            k: "Inhalt",
            v: "Serving · Drift · Deployment-Strategien · Feature Stores",
          },
          { k: "Simulationen", v: "4 interaktive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="11.1">Serving-Architektur</SectionLabel>
        <h2 className="h2">
          Den Request-Pfad verfolgen und jeder Komponente eine Fehlerreaktion
          zuordnen.
        </h2>
        <p className="prose">
          Produktions-ML ist ein System aus Request-Routing, Merkmalsabruf,
          Modellbereitstellung und Monitoring. Gib jeder Komponente
          Verantwortliche, Timeouts, Fallbacks, Beobachtbarkeit und
          Rollback-Verhalten, bevor du dem Gesamtpfad vertraust.
        </p>
        <ModelServingArchitecture />
      </section>

      <section className="section">
        <SectionLabel n="11.2">Drift-Erkennung</SectionLabel>
        <h2 className="h2">
          Datendrift und Konzeptdrift benötigen unterschiedliche Evidenz.
        </h2>
        <p className="prose">
          <strong>Datendrift</strong> heißt, die Eingabeverteilung verschiebt
          sich: Das Modell lernte auf Nutzern aus 2023 und sieht 2025 anderes
          Verhalten. Der PSI (Population Stability Index) summiert (actual −
          expected) × ln(actual/expected) über alle Buckets und hängt von
          Buckets und Stichprobengröße ab. Ein Grenzwert wie 0.2 ist eine
          kontextabhängige Heuristik, keine Retraining-Regel, und Eingabedrift
          beweist keinen Leistungsverlust.
        </p>
        <p className="prose">
          <strong>Konzeptdrift</strong> sieht man schlechter: Die Beziehung
          zwischen Merkmalen und Labels verschiebt sich, die Eingaben bleiben
          gleich, und die Entscheidungsgrenze stimmt nicht mehr. Erkennen lässt
          sich das nur mit Ergebnislabels oder einem begründeten Proxy; die
          Label-Verzögerung, von sofort bis zu Monaten, gehört ins
          Monitoring-Design.
        </p>
        <DriftSimulator />
      </section>

      <section className="section">
        <SectionLabel n="11.3">Deployment-Strategien</SectionLabel>
        <h2 className="h2">
          Das Rollout-Muster aus Fehlerkosten und Reversibilität wählen.
        </h2>
        <p className="prose">
          Shadow-Auswertung vergleicht Kandidatenausgaben, ohne danach zu
          handeln, und kostet trotzdem Kapazität und bringt Risiken bei
          Protokollierung, Datenschutz und Latenz. Canary setzt einen
          geeigneten Teil des Live-Verkehrs dem Kandidaten aus. Blue-Green hält
          zwei Umgebungen vor, aber Zustand, Schemas, Caches und Folgewirkungen
          entscheiden, wie schnell der Rollback greift; die Muster lassen sich
          in beliebiger Reihenfolge kombinieren.
        </p>
        <ShadowDeployment />
      </section>

      <section className="section">
        <SectionLabel n="11.4">
          Feature Stores und Training-Serving-Skew
        </SectionLabel>
        <h2 className="h2">
          Training und Serving benötigen einen geprüften Merkmalsvertrag.
        </h2>
        <p className="prose">
          Training-Serving-Skew entsteht, wenn Training und Bereitstellung
          dasselbe Merkmal unterschiedlich rechnen: Das Modell lernte eine
          Darstellung und bekommt eine andere. Gemeinsame Definitionen,
          versionierte Transformationen, zeitpunktkorrekte Trainings-Joins und
          Paritätstests senken dieses Risiko. Ein Feature Store trägt den
          Vertrag mit, garantiert aber weder Datenfrische und Backfills noch
          Abhängigkeiten oder gleiche Online-/Offline-Semantik.
        </p>
        <FeatureStoreDiagram />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Kein getesteter Rollback-Pfad.</b> Das alte Artefakt hilft nichts, wenn Schemas, Zustand, Caches oder Folgewirkungen nicht mit zurückgehen.",
          "<b>Unbeobachtetes Kandidatenverhalten.</b> Vor der Freigabe den Kandidaten mit repräsentativen Eingaben über Replay, Shadow, Batch oder eine gestufte Route prüfen.",
          "<b>Nur eine verzögerte Ergebnismetrik überwachen.</b> Eingabequalität, Merkmals- und Vorhersageverteilungen, Latenz, Fehler und fachliche Leitplanken ergänzen, ohne Proxys als Leistungsnachweis zu behandeln.",
          "<b>Ein Modellartefakt direkt überschreiben.</b> Retraining braucht unveränderliche Versionen, Evaluation, Freigabe, gestufte Bereitstellung und einen wiederherstellbaren Rollback-Pfad.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Einen Rollout-Vertrag schreiben.</b> Geeigneten Verkehr, Beobachtungsfenster, Akzeptanzmetriken, Leitplanken, Label-Verzögerung, Abbruchverantwortung und Rollback aus dem Systemrisiko ableiten.",
          "<b>Retraining-Auslöser kalibrieren.</b> Baselines und Fehlerbudgets festlegen, prüfen, ob aus einem Alarm eine Maßnahme folgt, und bei verfügbaren Labels Ergebnisevidenz verlangen.",
          "<b>Daten, Code, Konfiguration und Modell versionieren.</b> Datenschutzkonforme Herkunftsnachweise aufbewahren, die Training und Evaluation reproduzieren.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Modellverhalten hängt von Code, Daten, Konfiguration und Kontext ab.</b> Überwach jede Ebene und gib jedem Alarm Verantwortliche und eine Reaktion.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
