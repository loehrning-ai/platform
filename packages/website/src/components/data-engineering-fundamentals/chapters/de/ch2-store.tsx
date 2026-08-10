import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../../primitives";
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
        hook="Viele Tabellen sind ein Abbild des Vortags. <strong>Kumulative Tabellen</strong> enthalten die gesamte bisherige Entwicklung: Der Zustand von gestern wird fortgeschrieben und mit den heutigen Änderungen zusammengeführt. Das Muster ist kompakt, aber empfindlich. Ein fehlerhafter Tag bleibt in allen Folgetagen enthalten, bis ein Backfill ihn ersetzt."
        meta={[
          { k: "Muster", v: "zustandsfortschreibend" },
          { k: "Engine", v: "Spark (FULL OUTER JOIN)" },
          { k: "Verwendung", v: '<span class="chip">Analyse</span><span class="chip">Berichte</span><span class="chip">Personalisierung</span>' },
        ]}
      />

      <section className="section">
        <SectionLabel n="3.1">Das Muster</SectionLabel>
        <h2 className="h2">Gestern + heute = heutiger kumulativer Zustand.</h2>
        <p className="prose">Dieses additive Kursbeispiel verbindet die vorherige Partition und die heutigen Änderungen mit einem <code>FULL OUTER JOIN</code> und verwendet anschließend <code>COALESCE</code>. Dadurch bleiben Schlüssel von beiden Seiten erhalten. Andere kumulative Modelle benötigen eventuell Merge-Regeln, Löschungen oder Gültigkeitsintervalle.</p>
        <p className="prose">Die Fortschreibung erzeugt den Nutzen: Der kumulative Wert von Tag 7 besteht aus Tag 6 plus heute; Tag 6 enthält bereits Tag 5 und dessen Änderungen. Dieselbe Eigenschaft überträgt Fehler. Ein Fehler an Tag 3 bleibt in jedem Folgetag, bis er erkannt und rückwirkend neu berechnet wird.</p>
      </section>

      <section className="section">
        <SectionLabel n="3.2">Die Woche prüfen</SectionLabel>
        <h2 className="h2">Fehler an Tag 3. Erkannt an Tag 4. Backfill an Tag 5.</h2>
        <p className="prose">Gehe die Tage im Simulator durch. An Tag 3 halbiert eine Einheitenverwechslung die Punkte aller Nutzer. Bis Tag 5 ist die Abweichung in jeder Aggregation enthalten. Mit <em>Korrigieren und neu berechnen</em> werden die fehlerhaften Tage mit der korrigierten Logik erneut verarbeitet.</p>
        <CumulativeSim />
      </section>

      <section className="section">
        <SectionLabel n="3.3">Die Abfrage</SectionLabel>
        <CodeBlock title="user_lifetime_points.sql" lang="Spark" html={CUMULATIVE_SQL} />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>In diesem additiven Muster einen Left Join verwenden.</b> Schlüssel, die erstmals in der heutigen Änderung erscheinen, würden fehlen. Fälle mit neuen, bestehenden und fehlenden Schlüsseln testen.",
          "<b>Eine Korrektur ohne Neuberechnung abhängiger Partitionen veröffentlichen.</b> Das früheste betroffene Datum ermitteln und den nachgelagerten Bereich neu aufbauen.",
          "<b>Die Wanduhr in einem Backfill lesen.</b> Logische Partition und weitere Laufparameter explizit übergeben, damit dieselbe Eingabe denselben Quellenbereich wählt.",
          "<b>Unvollständigen Zustand veröffentlichen.</b> Die vom Tabellenformat unterstützte atomare Replace-, Merge- oder Snapshot-Operation verwenden.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Für dieses Tagesmodell <code>&lt;DATEID&gt;</code> als logische Partition übergeben, statt sie aus der Wanduhr abzuleiten.",
          "Kumulative Logik versionieren und die erzeugende Version pro Partition erfassen. Den Bereich neu aufbauen, dessen Semantik sich geändert hat.",
          "<b>Invarianten aus dem Fachmodell</b> ableiten. Löschung oder Aufbewahrung kann die Zeilenzahl rechtmäßig senken; erwartete Schlüsselübergänge statt monotones Wachstum testen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Kumulativ = <b>gestern ⊕ heute</b>. Jeder fehlerhafte Tag verfälscht alle Folgetage bis zum Backfill.",
          "<code>FULL OUTER JOIN</code> und <code>COALESCE</code> setzen das additive Beispiel um. Merge-Semantik aus dem tatsächlichen Lebenszyklus der Entität ableiten.",
          "Ein explizites logisches Datum und stabile Eingaben verwenden, damit Backfills den beabsichtigten Quellenbereich auswählen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch2StoreDe;
