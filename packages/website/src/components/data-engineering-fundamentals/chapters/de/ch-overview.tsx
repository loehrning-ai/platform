"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { OV_STAGES_DE, PipelineBar } from "../../simulators/pipeline-bar";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

const TOOLS = [
  "Kafka",
  "Flink",
  "Spark",
  "Trino",
  "Snowflake",
  "ClickHouse",
  "Airflow",
  "dbt",
  "Great Expectations",
  "DataHub",
  "Cube",
  "Apache Ranger",
];

export function ChOverviewDe() {
  const [activeId, setActiveId] = useState("ingest");
  const active =
    OV_STAGES_DE.find((stage) => stage.id === activeId) ?? OV_STAGES_DE[0];

  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <section className="ov2-hero">
        <div className="ov2-eyebrow">
          <span className="ov2-pill">Data Engineering · v6</span>
          <span className="ov2-dot">·</span>
          <span>Kurs von der Quelle bis zur Bereitstellung</span>
        </div>
        <h1 className="ov2-title">
          Eine <em>Datenpipeline</em> von der Quelle bis zur Bereitstellung,
          Stufe für Stufe.
        </h1>
        <p className="ov2-sub">
          Entscheidend ist das System, nicht die Werkzeugliste.{" "}
          <b>
            12 Kapitel · 17 interaktive Simulationen · ein Abschlussprojekt mit
            kontrollierten Fehlerfällen.
          </b>{" "}
          Jedes Kapitel verbindet eine technische Entscheidung mit ihrer Wirkung
          auf nachgelagerte Datenprodukte.
        </p>
        <div className="ov2-cta">
          <Link
            className="btn btn-primary ov2-btn-primary"
            href={technicalCourseHref("data-engineering-fundamentals", "de", {
              kind: "chapter",
              chapterId: "fund",
            })}
          >
            Mit Kapitel 00 beginnen →
          </Link>
          <Link
            className="ov2-btn-ghost"
            href={technicalCourseHref("data-engineering-fundamentals", "de", {
              kind: "chapter",
              chapterId: "cap",
            })}
          >
            Abschlussprojekt ansehen
          </Link>
          <span className="ov2-meta">
            <span className="ov2-meta-dot" /> ~90 min · ohne Anmeldung · läuft
            im Browser
          </span>
        </div>
      </section>

      <section className="ov2-flow">
        <div className="ov2-flow-head">
          <div className="ov2-kicker">Die Verarbeitungskette</div>
          <h2 className="ov2-h2">
            Eine Pipeline. Zehn Betriebsstufen. Jeder Punkt steht für eine
            simulierte Datenzeile.
          </h2>
          <p className="ov2-lede">
            Wähl eine Stufe, lies ihren Vertrag, öffne das Kapitel dazu. Im
            Abschlussprojekt laufen alle zehn Stufen in einem Szenario
            zusammen.
          </p>
        </div>
        <PipelineBar
          activeId={activeId}
          setActiveId={setActiveId}
          locale="de"
          stages={OV_STAGES_DE}
          chapterLabel="Kapitel"
        />
        <div
          className="ov2-detail"
          style={{ "--hex": active.hex, "--ink": active.ink } as CSSProperties}
        >
          <div className="ov2-detail-n">{active.n}</div>
          <div className="ov2-detail-main">
            <div className="ov2-detail-title">
              {active.title}
              <span className="ov2-detail-tag"> · {active.tag}</span>
            </div>
            <div className="ov2-detail-body">{active.body}</div>
          </div>
          <Link
            className="btn btn-primary ov2-detail-btn"
            href={technicalCourseHref("data-engineering-fundamentals", "de", {
              kind: "chapter",
              chapterId: active.chap,
            })}
          >
            Kapitel öffnen →
          </Link>
        </div>
      </section>

      <section className="ov2-tools">
        <span className="ov2-tools-lab">
          In den Kursszenarien verwendete Werkzeuge:
        </span>
        {TOOLS.map((name) => (
          <span key={name} className="ov2-chip">
            {name}
          </span>
        ))}
      </section>
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default ChOverviewDe;
