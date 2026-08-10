import { IDEMPOTENT_WRITE_SQL } from "../ch4-orchestrate";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import {
  AntiPatterns,
  BestPractices,
  CodeBlock,
  Hero,
  SectionLabel,
  Takeaway,
} from "../../primitives";
import { BackfillSim } from "../../simulators/backfill-sim";
import { DAGDiagram } from "../../simulators/dag-diagram";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch4OrchestrateDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch4OrchestrateDe({ chapter }: Ch4OrchestrateDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Orchestrierung: <span class='accent'>Wiederholungen gehören zum Betrieb.</span> Sicher sind sie nur bei idempotenten Schreibvorgängen."
        hook="Airflow ist der Scheduler der Kursarchitektur. Konfigurierte Wiederholungen, manuelle Neustarts und Backfills können einen Task erneut ausführen. Jeder Task muss festlegen, wie Wiederholungen Ausgaben und Nebeneffekte behandeln."
        meta={[
          { k: "Scheduler", v: "Airflow · Cron + DAG" },
          { k: "Einheit", v: "Task · eine Operation auf einer Partition" },
          { k: "Kernmuster", v: "<code>INSERT OVERWRITE</code>" },
        ]}
      />

      <section className="section">
        <SectionLabel n="5.1">Pipelines sind Graphen</SectionLabel>
        <h2 className="h2">Ein DAG aus Tasks, Partition für Partition.</h2>
        <p className="prose">
          Eine geplante Pipeline kann als <b>gerichteter azyklischer Graph</b> dargestellt werden. Knoten sind
          Tasks, etwa das Lesen einer Tabelle oder das Schreiben einer
          Partition. Kanten bilden Datenabhängigkeiten ab: <em>agg</em> kann erst
          starten, wenn <em>clean</em> vorliegt. Airflow plant bereite Knoten. Wiederholung, Löschen eines Task-Zustands, Backfill und
          nachgelagertes Verhalten hängen von DAG-Konfiguration und Operatorsemantik ab.
        </p>
        <DAGDiagram />
        <p className="prose" style={{ marginTop: 18 }}>
          Idempotenz ist ein Vertrag des Tasks und keine Zusage des Schedulers. Bei denselben logischen Eingaben soll eine Wiederholung auf den
          vorgesehenen Zustand zulaufen oder doppelte Nebeneffekte erkennbar und unterdrückbar machen.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="5.2">Idempotenz im Simulator</SectionLabel>
        <h2 className="h2">OVERWRITE durch INSERT ersetzen und die Zeilen verdoppeln.</h2>
        <p className="prose">
          Der Simulator modelliert einen siebentägigen Backfill mit mehreren Versuchen. Sein deterministischer Zweig mit
          <code> INSERT OVERWRITE</code> ersetzt die modellierte Partition; der Append-Zweig behält Zeilen früherer Versuche. Reale Idempotenz
          hängt zusätzlich von stabilen Eingaben, Transaktionsgrenzen und Veröffentlichungssemantik des Tabellenformats ab.
        </p>
        <BackfillSim />
      </section>

      <section className="section">
        <SectionLabel n="5.3">Der Schreibvertrag</SectionLabel>
        <CodeBlock
          title="pipeline.py · der von Airflow erwartete Schreibvorgang"
          lang="Spark"
          html={IDEMPOTENT_WRITE_SQL}
        />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Auf einem wiederholbaren Pfad ohne stabilen Schlüssel anhängen.</b> Mehrere Versuche können Duplikate erhalten, wenn das Ziel keinen idempotenten Merge- oder Deduplizierungsvertrag besitzt.",
          "<b>Externe Nebeneffekte mit dem Datenschreiben vermischen.</b> Benachrichtigungen und API-Schreibvorgänge auslagern und mit Idempotenzschlüssel oder Zustellungs-Ledger schützen.",
          "<b><code>CURRENT_DATE</code> oder <code>NOW()</code> zur Auswahl der logischen Partition verwenden.</b> Die geplante Partition explizit übergeben.",
          "<b>Vorhandene Alarmierung annehmen.</b> Fristen, Callbacks, Zuständigkeit und Routing ausdrücklich konfigurieren und den Fehlerpfad testen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Overwrite, Merge oder Upsert</b> aus Schlüssel- und Partitionssemantik der Tabelle wählen. Eine Wiederholung mit derselben logischen Eingabe testen.",
          "Die logische Partition als Laufparameter übergeben. Für bytegleiche Reproduktion zusätzlich Code, Quell-Snapshots und nichtdeterministische Eingaben fixieren.",
          "Fristen und Alarme auf der passenden DAG- oder Task-Ebene definieren. Prüfen, ob Airflow-Version und Benachrichtigungspfad wie vorgesehen eskalieren.",
          "Unvermeidbare Nebeneffekte wie E-Mails oder externe API-Schreibvorgänge werden in <b>einem eigenen abschließenden Task</b> ausgeführt. Ein externes Ledger verhindert doppelte Ausführung.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Airflow kann Tasks durch Wiederholungen, Löschen von Zuständen und Backfills mehrfach ausführen. Das Task-Design muss dieses Modell berücksichtigen.",
          "Ein logisches Datum, deterministische Eingabeauswahl und geeignete Zielsemantik können einen Partitionsschreibvorgang idempotent machen.",
          "Externe Nebeneffekte isolieren und mit stabilen Idempotenzschlüsseln oder einem Zustellungs-Ledger schützen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch4OrchestrateDe;
