import { DATASETSPEC_YAML } from "../ch6-discover";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import {
  AntiPatterns,
  BestPractices,
  CodeBlock,
  Hero,
  SectionLabel,
  Takeaway,
} from "../../primitives";
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
        hook="Der Kurs verwendet eine fiktive Befehlspalette, eine DatasetSpec-Datei und einen Lineage-Graphen für typische Ermittlungsaufgaben. Diese Schnittstellen sind Referenzentwürfe und keine Industriestandards."
        meta={[
          { k: "Glossar", v: "Palette + wut" },
          { k: "Metadaten", v: "DatasetSpec" },
          { k: "Lineage", v: "OpenLineage / DataHub" },
        ]}
      />

      <section className="section">
        <SectionLabel n="7.1">Die sechs Kürzel</SectionLabel>
        <h2 className="h2">Vor der Übernahme eines Datensatzes die Kurspalette verwenden.</h2>
        <p className="prose">
          Vor der Nutzung einer Tabelle werden Zweck, Zuständigkeit, Status, vorgelagerter Produzent und registrierte Verbraucher geprüft.
          <code> ht</code> zeigt im Kurs die Tabellenmetadaten, <code>fpl</code> öffnet die erzeugende Datei, <code>ds produce</code> listet
          registrierte Verbraucher, <code>qbgs</code> sucht Beispiele, <code>udf</code> findet eine Funktion und <code>wut</code> öffnet einen Glossareintrag.
        </p>
        <DiscoverySpeedrun />
      </section>

      <section className="section">
        <SectionLabel n="7.2">Die Metadatendatei</SectionLabel>
        <p className="prose">
          Im Referenzdesign besitzt jeder Datensatz eine versionierte <b>DatasetSpec</b> neben dem Pipelinecode. Integrationen können
          Beschreibungen, Zuständigkeit, Status und Akteur-Annotationen lesen. Die Datei ist ein deklarierter Vertrag. Vor der Nutzung muss geprüft
          werden, ob Katalog- und Lineage-Aufnahme aktuell sind.
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
          Ein Lineage-Graph kann übermittelte vor- und nachgelagerte Kanten zeigen, einschließlich Spaltenbeziehungen, wenn die Integrationen sie
          liefern. Er kann unvollständig sein. Vor einer Auswirkungsanalyse werden Graph, Zuständigkeiten, Quellcode, Katalogsuche und Laufzeitdaten kombiniert.
        </p>
        <LineageCamera />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Mit einer breiten Codesuche beginnen.</b> Zuerst Katalogeintrag und Zuständigkeit prüfen, danach Details oder Metadatenlücken im Quellcode verifizieren.",
          "<b>Eine Tabelle ohne Prüfung des Deprecation-Hinweises übernehmen.</b> Eine vorhandene Tabelle mit passendem Schema kann seit Jahren abgekündigt sein.",
          "<b>Den Lineage-Graphen für vollständig halten.</b> Vorgelagerte Zuständigkeit und mindestens einen kritischen Verbraucher gegen Code oder Laufzeitdaten prüfen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Vor explorativem SQL mit der Kurspalette die Metadaten prüfen.",
          "DatasetSpec und beobachtete Tabelle lesen. Deklarierter Vertrag und bereitgestellter Zustand können auseinanderlaufen.",
          "<b>Einen Schritt nach oben und einen nach unten verfolgen.</b> Vor der Nutzung einer Tabelle mindestens Produzent und Verbraucher prüfen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Ein Ermittlungsablauf stellt Zweck, Zuständigkeit, Status, Schema und bekannte Lineage vor der Übernahme bereit.",
          "Eine DatasetSpec ist eine versionierte Deklaration. Bei wichtigen Entscheidungen mit bereitgestelltem Katalog und Daten vergleichen.",
          "Lineage ist Nachweis aus instrumentierten Systemen und kein garantiert vollständiges Abhängigkeitsverzeichnis.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch6DiscoverDe;
