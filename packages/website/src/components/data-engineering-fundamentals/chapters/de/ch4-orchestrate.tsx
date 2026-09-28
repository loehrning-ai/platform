import { IDEMPOTENT_WRITE_SQL } from "../ch4-orchestrate";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { AntiPatterns, BestPractices, CodeBlock, Hero, SectionLabel } from "../../primitives";
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
        title="Orchestrierung: <span class='accent'>Wiederholungen brauchen idempotente Schreibvorgänge.</span>"
        hook="Airflow führt Tasks bei Wiederholungen, manuellen Neustarts und Backfills erneut aus. Jeder Task legt fest, was ein erneuter Lauf mit Ausgaben und Nebeneffekten macht."
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
          Eine geplante Pipeline ist ein <b>gerichteter azyklischer Graph</b>.
          Knoten sind Tasks, Kanten deklarierte Abhängigkeiten, und Airflow
          plant, was bereit ist. Retries, Clear und Backfills richten sich
          nach DAG-Konfiguration und Operatorsemantik.
        </p>
        <DAGDiagram />
        <p className="prose" style={{ marginTop: 18 }}>
          Idempotenz ist Aufgabe des Tasks; der Scheduler garantiert sie nicht.
          Zweimal mit denselben logischen Eingaben gestartet, erreicht ein
          idempotenter Task denselben Zustand oder macht doppelte Nebeneffekte
          erkennbar und unterdrückbar.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="5.2">Idempotenz im Simulator</SectionLabel>
        <h2 className="h2">OVERWRITE durch INSERT ersetzen und die Zeilen verdoppeln.</h2>
        <p className="prose">
          Der Simulator modelliert einen siebentägigen Backfill mit mehreren Versuchen. <code>INSERT OVERWRITE</code> ersetzt die Partition,
          Append behält Zeilen aus jedem früheren Versuch. Reale Idempotenz braucht außerdem stabile Eingaben, Transaktionsgrenzen und die
          Veröffentlichungssemantik des Tabellenformats.
        </p>
        <BackfillSim />
      </section>

      <section className="section">
        <SectionLabel n="5.3">Der Schreibvertrag</SectionLabel>
        <CodeBlock
          title="pipeline.py · idempotenter Partitionsschreibvorgang"
          lang="Spark"
          html={IDEMPOTENT_WRITE_SQL}
        />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Auf einem wiederholbaren Pfad ohne stabilen Schlüssel anhängen.</b> Wiederholungen behalten Duplikate, wenn das Ziel nicht idempotent mergt oder dedupliziert.",
          "<b>Externe Nebeneffekte mit dem Datenschreiben vermischen.</b> Benachrichtigungen und API-Schreibvorgänge in einen eigenen abschließenden Task mit Idempotenzschlüssel oder Zustellungs-Ledger auslagern, damit Wiederholungen bereits Gesendetes überspringen.",
          "<b>Die Partition per <code>CURRENT_DATE</code> oder <code>NOW()</code> wählen.</b> Die geplante Partition explizit übergeben, damit Backfills das angefragte Intervall treffen.",
          "<b>Auf Alarme vertrauen, die niemand konfiguriert hat.</b> Setz Fristen, Callbacks, Zuständigkeit und Routing und teste den Fehlerpfad.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "<b>Overwrite, Merge oder Upsert</b> aus Schlüssel- und Partitionssemantik der Tabelle wählen und eine Wiederholung mit derselben logischen Eingabe testen.",
          "Für bytegleiche Reproduktion zusätzlich Code, Quell-Snapshots und nichtdeterministische Eingaben fixieren.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch4OrchestrateDe;
