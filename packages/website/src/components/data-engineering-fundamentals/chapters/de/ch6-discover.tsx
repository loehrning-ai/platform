import { DATASETSPEC_YAML } from "../ch6-discover";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { AntiPatterns, CodeBlock, Hero, SectionLabel } from "../../primitives";
import { DiscoverySpeedrun } from "../../simulators/discovery-speedrun";
import { LineageCamera } from "../../simulators/lineage-camera";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch6DiscoverDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch6DiscoverDe({ chapter }: Ch6DiscoverDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Ermittlung: <span class='accent'>Zuständigkeit, Vertrag und Lineage finden.</span>"
        hook="Du übst mit einer fiktiven Befehlspalette, einer DatasetSpec-Datei und einem Lineage-Graphen. Das sind Referenzentwürfe, keine Industriestandards."
        meta={[
          { k: "Glossar", v: "Palette + wut" },
          { k: "Metadaten", v: "DatasetSpec" },
          { k: "Lineage", v: "OpenLineage / DataHub" },
        ]}
      />

      <section className="section">
        <SectionLabel n="7.1">Die sechs Kürzel</SectionLabel>
        <h2 className="h2">Erst die Kurspalette, dann der Datensatz.</h2>
        <p className="prose">
          Bevor du eine Tabelle nutzt, klärst du Zweck, Zuständigkeit, Status, vorgelagerten Produzenten und registrierte Verbraucher.{" "}
          <code>ht</code> zeigt im Kurs die Tabellenmetadaten, <code>fpl</code> öffnet die erzeugende Datei, <code>ds produce</code> listet
          registrierte Verbraucher, <code>qbgs</code> sucht Beispiele, <code>udf</code> findet eine Funktion, <code>wut</code> öffnet einen Glossareintrag.
        </p>
        <DiscoverySpeedrun />
      </section>

      <section className="section">
        <SectionLabel n="7.2">Die Metadatendatei</SectionLabel>
        <p className="prose">
          Hier liegt neben dem Pipelinecode jedes Datensatzes eine versionierte <b>DatasetSpec</b>, aus der Integrationen Beschreibungen,
          Zuständigkeit, Status und Akteur-Annotationen lesen. Die Datei deklariert den Vertrag nur und kann von der bereitgestellten Tabelle abweichen, also vergleich beide und prüf, ob
          Katalog- und Lineage-Aufnahme aktuell sind.
        </p>
        <CodeBlock
          title="dim_users.spec.yaml · Datensatzmetadaten"
          lang="YAML"
          html={DATASETSPEC_YAML}
        />
      </section>

      <section className="section">
        <SectionLabel n="7.3">Lineage als Kamera</SectionLabel>
        <p className="prose">
          Ein Lineage-Graph zeigt die übermittelten vor- und nachgelagerten Kanten, mit Spaltenbeziehungen, wenn Integrationen sie liefern. Er ist
          selten vollständig, also schätz Auswirkungen auch mit Zuständigkeiten, Quellcode, Katalogsuche und Laufzeitdaten.
        </p>
        <LineageCamera />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Mit einer breiten Codesuche beginnen.</b> Zuerst Katalogeintrag und Zuständigkeit prüfen, dann Details oder Metadatenlücken im Quellcode suchen.",
          "<b>Eine Tabelle ohne Blick auf den Deprecation-Hinweis übernehmen.</b> Eine Tabelle mit Daten und passendem Schema kann trotzdem sagen: 'deprecated 2023-06, migrate to v2.'",
          "<b>Den Lineage-Graphen für vollständig halten.</b> Vorgelagerte Zuständigkeit und mindestens einen kritischen Verbraucher gegen Code oder Laufzeitdaten prüfen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch6DiscoverDe;
