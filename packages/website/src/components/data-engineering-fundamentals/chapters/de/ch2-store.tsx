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
        hook="Viele Tabellen zeigen nur den Vortag. <strong>Kumulative Tabellen</strong> tragen die ganze bisherige Entwicklung mit: Der Zustand von gestern wird fortgeschrieben und mit den heutigen Änderungen zusammengeführt. Kompakt und empfindlich zugleich. Ein fehlerhafter Tag steckt in jedem Folgetag, bis ein Backfill ihn ersetzt."
        meta={[
          { k: "Muster", v: "zustandsfortschreibend" },
          { k: "Engine", v: "Spark (FULL OUTER JOIN)" },
          { k: "Verwendung", v: '<span class="chip">Analyse</span><span class="chip">Berichte</span><span class="chip">Personalisierung</span>' },
        ]}
      />

      <section className="section">
        <SectionLabel n="3.1">Das Muster</SectionLabel>
        <h2 className="h2">Gestern + heute = heutiger kumulativer Zustand.</h2>
        <p className="prose">Das additive Kursbeispiel verbindet die vorherige Partition und die heutigen Änderungen mit einem <code>FULL OUTER JOIN</code> und schickt <code>COALESCE</code> hinterher. So überleben Schlüssel von beiden Seiten. Andere kumulative Modelle brauchen zusätzlich Merge-Regeln, Löschungen oder Gültigkeitsintervalle.</p>
        <p className="prose">Die Fortschreibung erzeugt den Nutzen: Der kumulative Wert von Tag 7 besteht aus Tag 6 plus heute; Tag 6 enthält bereits Tag 5 und dessen Änderungen. Dieselbe Eigenschaft überträgt Fehler. Ein Fehler an Tag 3 bleibt in jedem Folgetag, bis er erkannt und rückwirkend neu berechnet wird.</p>
      </section>

      <section className="section">
        <SectionLabel n="3.2">Die Woche prüfen</SectionLabel>
        <h2 className="h2">Fehler an Tag 3. Erkannt an Tag 4. Backfill an Tag 5.</h2>
        <p className="prose">Klick dich im Simulator durch die Tage. An Tag 3 halbiert eine Einheitenverwechslung die Punkte aller Nutzer. Bis Tag 5 steckt die Abweichung in jeder Aggregation. <em>Korrigieren und neu berechnen</em> verarbeitet die fehlerhaften Tage mit der korrigierten Logik erneut.</p>
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
          "<b>Eine Korrektur ohne Neuberechnung abhängiger Partitionen veröffentlichen.</b> Such das früheste betroffene Datum und bau den Bereich dahinter neu auf.",
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
