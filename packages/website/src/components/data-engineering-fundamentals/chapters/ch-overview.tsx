"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { PipelineBar, OV_STAGES } from "../simulators/pipeline-bar";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

// ─── Ch_Overview ───────
// Ported from `src/chapters/Ch_Overview.js`. Bespoke hero/flow layout
// (not the shared Hero primitive — source builds its own markup here).
//
// Uses `useRouter()` internally instead of accepting a `goTo` callback prop:
// a function prop can't cross the server->client boundary when this
// component is resolved dynamically in `[chapterId]/page.tsx` (a Server
// Component), so every other chapter component takes only `{chapter}` and
// this is the one chapter that needs real navigation, done client-side.

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

export function ChOverview() {
  const [activeId, setActiveId] = useState("ingest");
  const active = OV_STAGES.find((s) => s.id === activeId) ?? OV_STAGES[0];

  return (
    <>
      <section className="ov2-hero">
        <div className="ov2-eyebrow">
          <span className="ov2-pill">Data Engineering · v6</span>
          <span className="ov2-dot">·</span>
          <span>Source-to-serving course</span>
        </div>
        <h1 className="ov2-title">
          Trace a <em>data pipeline</em> from source to serving.
        </h1>
        <p className="ov2-sub">
          The system is what matters, not the tool list.{" "}
          <b>
            12 chapters · 17 interactive simulations · one capstone with
            controlled failure cases.
          </b>{" "}
          Every chapter ties one engineering decision to its downstream damage.
        </p>
        <div className="ov2-cta">
          <Link
            className="btn btn-primary ov2-btn-primary"
            href={technicalCourseHref("data-engineering-fundamentals", "en", {
              kind: "chapter",
              chapterId: "fund",
            })}
          >
            Begin with Chapter 00 →
          </Link>
          <Link
            className="ov2-btn-ghost"
            href={technicalCourseHref("data-engineering-fundamentals", "en", {
              kind: "chapter",
              chapterId: "cap",
            })}
          >
            Open the capstone
          </Link>
          <span className="ov2-meta">
            <span className="ov2-meta-dot" /> ~90 min · no signup · runs in your
            browser
          </span>
        </div>
      </section>

      <section className="ov2-flow">
        <div className="ov2-flow-head">
          <div className="ov2-kicker">The conveyor</div>
          <h2 className="ov2-h2">
            One pipeline. Ten operating stages. Each point represents a
            simulated data row.
          </h2>
          <p className="ov2-lede">
            Pick a stage, read its contract, open its chapter. The capstone runs
            all ten stages in a single scenario.
          </p>
        </div>
        <PipelineBar
          activeId={activeId}
          setActiveId={setActiveId}
          locale="en"
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
            href={technicalCourseHref("data-engineering-fundamentals", "en", {
              kind: "chapter",
              chapterId: active.chap,
            })}
          >
            Open chapter →
          </Link>
        </div>
      </section>

      <section className="ov2-tools">
        <span className="ov2-tools-lab">Tools used in the course scenarios:</span>
        {TOOLS.map((n) => (
          <span key={n} className="ov2-chip">
            {n}
          </span>
        ))}
      </section>
    </>
  );
}

export default ChOverview;
