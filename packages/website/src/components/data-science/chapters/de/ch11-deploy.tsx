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
        hook="Der Produktionsbetrieb verbindet Request-Verarbeitung, Merkmalsberechnung, Model Serving, Monitoring und Rollback. Jede Kontrolle reduziert ein benanntes Risiko; keine zertifiziert das System allein."
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
          Produktions-ML ist kein einzelnes Modell, sondern ein System aus
          Request-Routing, Merkmalsabruf, Modellbereitstellung und Monitoring.
          Für jede Komponente müssen Eigentümerschaft, Timeouts, Fallbacks,
          Beobachtbarkeit und Rollback-Verhalten definiert sein, bevor der
          Gesamtpfad als belastbar gilt.
        </p>
        <ModelServingArchitecture />
      </section>

      <section className="section">
        <SectionLabel n="11.2">Drift-Erkennung</SectionLabel>
        <h2 className="h2">
          Datendrift und Konzeptdrift benötigen unterschiedliche Evidenz.
        </h2>
        <p className="prose">
          <strong>Datendrift</strong> bedeutet, dass sich die Eingabeverteilung
          verschiebt. Das Modell wurde mit Nutzern aus 2023 trainiert, sieht
          aber 2025 anderes Verhalten. Gemessen wird dies mit dem PSI
          (Population Stability Index): Summe von (actual − expected) ×
          ln(actual/expected) über alle Buckets. PSI hängt von Buckets und
          Stichprobengröße ab. Ein Grenzwert wie 0.2 ist eine kontextabhängige
          Heuristik, keine allgemeine Retraining-Regel; Eingabedrift beweist
          keinen Leistungsverlust.
        </p>
        <p className="prose">
          <strong>Konzeptdrift</strong> ist weniger offensichtlich: Die
          Beziehung zwischen Merkmalen und Labels verändert sich. Auch bei
          gleichen Eingaben ist die Entscheidungsgrenze des Modells nun falsch.
          Die Erkennung benötigt Ergebnislabels oder einen begründeten Proxy.
          Die Label-Verzögerung reicht je nach Produkt von sofort bis zu Monaten
          und muss im Monitoring-Design angegeben werden.
        </p>
        <DriftSimulator />
      </section>

      <section className="section">
        <SectionLabel n="11.3">Deployment-Strategien</SectionLabel>
        <h2 className="h2">
          Das Rollout-Muster aus Fehlerkosten und Reversibilität wählen.
        </h2>
        <p className="prose">
          Shadow-Auswertung kann Kandidatenausgaben vergleichen, ohne sie für
          Entscheidungen zu verwenden, erzeugt aber weiterhin Kapazitäts-,
          Protokollierungs-, Datenschutz- und Latenzrisiken. Canary setzt einen
          geeigneten Teil des Live-Verkehrs dem Kandidaten aus. Blue-Green hält
          zwei Umgebungen vor; die Rollback-Geschwindigkeit hängt dennoch von
          Zustand, Schemas, Caches und Folgewirkungen ab. Die Muster sind
          kombinierbar und keine vorgeschriebene Reihenfolge.
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
          Training-Serving-Skew entsteht, wenn Trainings- und
          Bereitstellungspipeline Merkmale unterschiedlich berechnen. Das Modell
          wurde auf einer Darstellung trainiert und erhält eine andere.
          Gemeinsame Definitionen, versionierte Transformationen,
          zeitpunktkorrekte Trainings-Joins und Paritätstests senken dieses
          Risiko. Ein Feature Store kann den Vertrag unterstützen, garantiert
          aber weder Datenfrische und Backfills noch Abhängigkeiten oder gleiche
          Online-/Offline-Semantik.
        </p>
        <FeatureStoreDiagram />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Kein getesteter Rollback-Pfad.</b> Ein vorheriges Artefakt reicht nicht, wenn Schemas, Zustand, Caches oder Folgewirkungen nicht mit zurückgesetzt werden können.",
          "<b>Unabhängige Merkmalslogik.</b> Unterschiedliche SQL-Abfragen, Scaler, Zeitfenster oder Imputationsregeln erzeugen Skew, wenn ihre Parität nicht geprüft wird.",
          "<b>Unbeobachtetes Kandidatenverhalten.</b> Vor der Freigabe den Kandidaten mit repräsentativen Eingaben über Replay, Shadow, Batch oder eine gestufte Route prüfen.",
          "<b>Nur eine verzögerte Ergebnismetrik überwachen.</b> Eingabequalität, Merkmals- und Vorhersageverteilungen, Latenz, Fehler und fachliche Leitplanken ergänzen, ohne Proxys als Leistungsnachweis zu behandeln.",
          "<b>Ein Modellartefakt direkt überschreiben.</b> Retraining benötigt unveränderliche Versionen, Evaluation, Freigabe, gestufte Bereitstellung und einen wiederherstellbaren Rollback-Pfad.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Einen Rollout-Vertrag schreiben.</b> Geeigneten Verkehr, Beobachtungsfenster, Akzeptanzmetriken, Leitplanken, Label-Verzögerung, Abbruchverantwortung und Rollback aus dem Systemrisiko ableiten.",
          "<b>Retraining-Auslöser kalibrieren.</b> Baselines und Fehlerbudgets festlegen, die Handlungsfähigkeit eines Alarms prüfen und bei verfügbaren Labels Ergebnisevidenz verlangen.",
          "<b>Daten, Code, Konfiguration und Modell versionieren.</b> Datenschutzkonforme Herkunftsnachweise für Training und Evaluation aufbewahren.",
          "<b>Merkmalsdefinitionen teilen und prüfen.</b> Einen Feature Store nur einsetzen, wenn Konsistenz, Latenz, Eigentümerschaft und Betriebskosten zum System passen.",
          "<b>Wiederherstellung nach wesentlichen Änderungen und in einem risikobasierten Rhythmus üben.</b> Dokumentieren, ob Artefakte, Schemas, Zustand und abhängige Dienste tatsächlich wiederhergestellt werden.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Modellverhalten hängt von Code, Daten, Konfiguration und Kontext ab.</b> Jede Ebene überwachen und Alarme mit Verantwortlichen und Reaktion verbinden.",
          "<b>Deployment-Strategie ist Risikosteuerung.</b> Shadow, Replay, Canary, Blue-Green oder ein anderes Muster nach Exposition, Evidenzbedarf und Reversibilität auswählen.",
          "<b>Merkmalsparität benötigt Kontrollen.</b> Gemeinsame Definitionen helfen; Versionierung, zeitpunktkorrekte Joins, Frischeprüfungen und Online-/Offline-Paritätstests bleiben erforderlich.",
          "<b>Retraining ist ein Freigabeprozess.</b> Unveränderliche Kandidaten erzeugen, gegen einen Vertrag evaluieren, die Freigabe bestätigen und einen getesteten Wiederherstellungspfad behalten.",
        ]}
      />
    </DataScienceLocaleProvider>
  );
}
