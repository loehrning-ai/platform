import { Hero, SectionLabel, AntiPatterns, BestPractices } from "../primitives";
import { ShuffleSim } from "../simulators/shuffle-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch3_Compute ──────────────────────────────────
// Ported from `src/chapters/Ch3_Compute.js`.

function EngineMatrix() {
  const rows = [
    { n: "Presto", s: "Distributed SQL", d: "Interactive SQL across connectors. Spill, retry and resources depend on engine version and cluster configuration." },
    { n: "Spark", s: "Batch processing", d: "DataFrame and SQL jobs with partitioned execution, shuffle, recomputation and configurable spill." },
    { n: "Snowflake", s: "Managed SQL warehouse", d: "Managed storage and virtual warehouses. Speed and cost depend on warehouse size, query shape, caching and concurrency." },
  ];
  return (
    <div className="cards-3">
      {rows.map((e) => (
        <div key={e.n} className="ccard">
          <div className="ccard-t">{e.s}</div>
          <div className="ccard-n">{e.n}</div>
          <div className="ccard-d">{e.d}</div>
        </div>
      ))}
    </div>
  );
}

export interface Ch3ComputeProps {
  readonly chapter: ChapterMeta;
}

export function Ch3Compute({ chapter }: Ch3ComputeProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Compute: <span class='accent'>the planner relies on statistics.</span>"
        hook="A cost-based planner picks join strategies from table statistics and configuration. Stale statistics can pick a build side that exceeds worker memory or pile work onto a few partitions."
        meta={[
          { k: "Engines", v: '<span class="chip">Presto</span><span class="chip">Spark</span><span class="chip">Snowflake</span>' },
          { k: "Planners", v: "CBO · statistics-driven" },
          { k: "Key risks", v: "skew · stale statistics · memory" },
        ]}
      />

      <section className="section">
        <SectionLabel n="4.1">Pick the engine for the query.</SectionLabel>
        <h2 className="h2">Three engines, one set of bytes.</h2>
        <p className="prose">Engines on the same table format and catalog read the same Parquet data. Choose by measured workload: shuffle volume, memory and spill, operational ownership and cost.</p>
        <EngineMatrix />
      </section>

      <section className="section">
        <SectionLabel n="4.2">The planner, visualized</SectionLabel>
        <h2 className="h2">How a join runs.</h2>
        <p className="prose">
          A partitioned <b>hash join</b> redistributes rows by join key, so one frequent key can leave one worker with far more data. A
          <b> broadcast join</b> copies the build side to every worker and only works if it fits in each worker&apos;s memory with headroom.
        </p>
        <p className="prose">
          Raise the skew slider and worker 0 gets more load. A frequent sentinel value such as <code>user_id = 0</code> in the join key causes
          this.
        </p>
        <ShuffleSim />
      </section>

      <AntiPatterns
        items={[
          '<b>Broadcasting an unmeasured build side.</b> Check compressed and in-memory size, worker count, concurrent work and memory limits before adding a hint.',
          "<b>Hash-joining on a column with one hot key</b>, such as <code>user_id = 0</code> for logged-out traffic. Salt the key or filter first.",
          "<b>Assuming the engine will spill.</b> Check engine version, operator support and cluster settings before giving it a large join.",
          "<b>Using stale table statistics.</b> Refresh them after large data changes and compare plan estimates with runtime rows.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Inspect join-key distributions</b> on representative data and compare the largest key or partition with the median.",
          "For sustained skew, try filtering, pre-aggregation, splitting hot keys or <b>salting</b>. Salting adds replication and a second aggregation step.",
        ]}
      />
    </>
  );
}

export default Ch3Compute;
