import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../../primitives";
import { CumulativeSim } from "../../simulators/cumulative-sim";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { CUMULATIVE_SQL } from "../ch2-store";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch2StoreDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch2StoreDe({ chapter }: Ch2StoreDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Speicherung: <span class='accent'>Ein fehlerhafter Tag</span> verfälscht alle Folgetage."
        hook="Jede Partition verbindet den Zustand von gestern mit den Änderungen von heute. Ein fehlerhafter Tag steckt in jedem Folgetag, bis der Bereich neu berechnet ist."
        meta={[
          { k: "Muster", v: "zustandsfortschreibend" },
          { k: "Engine", v: "Spark (FULL OUTER JOIN)" },
          { k: "Verwendung", v: '<span class="chip">Analyse</span><span class="chip">Berichte</span><span class="chip">Personalisierung</span>' },
        ]}
      />

      <section className="section">
        <SectionLabel n="3.1">Das Muster</SectionLabel>
        <h2 className="h2">Gestern + heute = heutiger kumulativer Zustand.</h2>
        <p className="prose">Das additive Beispiel verbindet die vorherige Partition mit den heutigen Änderungen per <code>FULL OUTER JOIN</code> und <code>COALESCE</code>, sodass Schlüssel von beiden Seiten überleben. Andere kumulative Modelle ergänzen Merge-Regeln, Löschungen, Gültigkeitsintervalle oder Konfliktregeln.</p>
        <p className="prose">Tag 7 baut auf Tag 6 auf, der schon alles davor enthält. Ist Tag 3 falsch, berechnest du ab der frühesten betroffenen Partition alles neu; eine Code-Korrektur allein schreibt keine gespeicherte Historie um.</p>
      </section>

      <section className="section">
        <SectionLabel n="3.2">Die Woche prüfen</SectionLabel>
        <h2 className="h2">Ein Fehler an Tag 3, erkannt an Tag 4, per Backfill an Tag 5 behoben.</h2>
        <p className="prose">Klick dich durch die Tage. An Tag 3 halbiert eine Einheitenverwechslung die Punkte aller Nutzer, bis Tag 5 steckt die Abweichung in jeder Aggregation. <em>Korrigieren und neu berechnen</em> verarbeitet die fehlerhaften Tage mit der korrigierten Logik neu.</p>
        <CumulativeSim />
      </section>

      <section className="section">
        <SectionLabel n="3.3">Die Abfrage</SectionLabel>
        <CodeBlock title="user_lifetime_points.sql" lang="Spark" html={CUMULATIVE_SQL} />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Einen Left Join für den kumulativen Merge verwenden.</b> Schlüssel, die erstmals in der heutigen Änderung auftauchen, fehlen dann. Neue, bestehende und fehlende Schlüssel testen.",
          "<b>Eine Korrektur ohne Neuberechnung abhängiger Partitionen veröffentlichen.</b> Such das früheste betroffene Datum und berechne alles danach neu.",
          "<b>Die Wanduhr in einem Backfill lesen.</b> <code>&lt;DATEID&gt;</code> und weitere Laufparameter explizit übergeben, damit dieselbe Eingabe denselben Quellenbereich wählt.",
          "<b>Unvollständigen Zustand veröffentlichen.</b> Atomares Replace, Merge oder Snapshot des Tabellenformats nutzen, damit niemand eine halbe Partition liest.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Kumulative Logik versionieren und die erzeugende Version pro Partition erfassen. Den Bereich neu aufbauen, dessen Semantik sich geändert hat.",
          "<b>Invarianten aus dem Fachmodell</b> ableiten. Löschung oder Aufbewahrung kann die Zeilenzahl senken. Teste deshalb erwartete Schlüsselübergänge; die Zeilenzahl muss nicht stetig wachsen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch2StoreDe;
