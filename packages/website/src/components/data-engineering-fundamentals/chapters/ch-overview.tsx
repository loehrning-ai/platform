"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { PipelineBar, OV_STAGES } from "../simulators/pipeline-bar";
import type { DefChapterId } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch_Overview ───────
// Ported from `src/chapters/Ch_Overview.js`. Bespoke hero/flow layout
// (not the shared Hero primitive — source builds its own markup here).
//
// Uses `useRouter()` internally instead of accepting a `goTo` callback prop:
// a function prop can't cross the server->client boundary when this
// component is resolved dynamically in `[chapterId]/page.tsx` (a Server
// Component), so every other chapter component takes only `{chapter}` and
// this is the one chapter that needs real navigation, done client-side.

const TOOLS = ["Kafka", "Flink", "Spark", "Trino", "Snowflake", "ClickHouse", "Airflow", "dbt", "Great Expectations", "DataHub", "Cube", "Apache Ranger"];

function chapterHref(id: DefChapterId | string): string {
  return `/kurse/open-source/data-engineering-fundamentals/${id}`;
}

export function ChOverview() {
  const [activeId, setActiveId] = useState("ingest");
  const active = OV_STAGES.find((s) => s.id === activeId) ?? OV_STAGES[0];

  return (
    <>
      <section className="ov2-hero">
        <div className="ov2-eyebrow">
          <span className="ov2-pill">DE · v6</span>
          <span className="ov2-dot">·</span>
          <span>The industry-standard crash course</span>
        </div>
        <h1 className="ov2-title">
          Think like a <em>data engineer</em> by lunch.
        </h1>
        <p className="ov2-sub">
          The system, not the tools. <b>10 chapters · 15 live simulators · one capstone you can break.</b>No slides, no toy code: by the end,
          you&apos;ll know where a pipeline fails before it does.
        </p>
        <div className="ov2-cta">
          <Link className="btn btn-primary ov2-btn-primary" href={chapterHref("fund")}>
            Begin with Chapter 00 →
          </Link>
          <Link className="ov2-btn-ghost" href={chapterHref("cap")}>
            Peek at the capstone
          </Link>
          <span className="ov2-meta">
            <span className="ov2-meta-dot" /> ~90 min · no signup · runs in your browser
          </span>
        </div>
      </section>

      <section className="ov2-flow">
        <div className="ov2-flow-head">
          <div className="ov2-kicker">The conveyor</div>
          <h2 className="ov2-h2">One pipeline. Ten chapters. Every dot is a real row.</h2>
          <p className="ov2-lede">Hover a stop to preview. Click to open. Each stands alone; the capstone stitches all ten together.</p>
        </div>
        <PipelineBar activeId={activeId} setActiveId={setActiveId} />
        <div className="ov2-detail" style={{ "--hex": active.hex, "--ink": active.ink } as CSSProperties}>
          <div className="ov2-detail-n">{active.n}</div>
          <div className="ov2-detail-main">
            <div className="ov2-detail-title">
              {active.title}
              <span className="ov2-detail-tag"> · {active.tag}</span>
            </div>
            <div className="ov2-detail-body">{active.body}</div>
          </div>
          <Link className="btn btn-primary ov2-detail-btn" href={chapterHref(active.chap)}>
            Open chapter →
          </Link>
        </div>
      </section>

      <section className="ov2-tools">
        <span className="ov2-tools-lab">Real tools, real behavior:</span>
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
