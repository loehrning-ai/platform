import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { ShuffleSim } from "../simulators/shuffle-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch3_Compute ──────────────────────────────────
// Ported from `src/chapters/Ch3_Compute.js`.

function EngineMatrix() {
  const rows = [
    { n: "Presto", s: "Distributed SQL", d: "Interactive SQL across connectors. Spill, retry, and resource behavior depend on the engine version and cluster configuration." },
    { n: "Spark", s: "Batch processing", d: "DataFrame and SQL workloads with partitioned execution, shuffle, recomputation, and configurable spill." },
    { n: "Snowflake", s: "Managed SQL warehouse", d: "Managed storage and virtual warehouses. Performance and cost depend on warehouse size, query shape, caching, and concurrency." },
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
        title="Compute: <span class='accent'>the planner bets on statistics.</span> Wrong stats, wrong plan."
        hook="A cost-based planner uses table statistics and configuration to choose join strategies. Stale or incomplete statistics can select a build side or distribution that exceeds worker memory or concentrates work on a few partitions."
        meta={[
          { k: "Engines", v: '<span class="chip">Presto</span><span class="chip">Spark</span><span class="chip">Snowflake</span>' },
          { k: "Planners", v: "CBO · statistics-driven" },
          { k: "Key risks", v: "skew · stale statistics · memory" },
        ]}
      />

      <section className="section">
        <SectionLabel n="4.1">Pick the engine for the query.</SectionLabel>
        <h2 className="h2">Three engines, one set of bytes.</h2>
        <p className="prose">
          Engines that support the same table format and catalog can read the same Parquet data. Choose using measured workload requirements:
          startup and response time, shuffle volume, memory and spill, retry behavior, concurrency, operational ownership, and cost.
        </p>
        <EngineMatrix />
      </section>

      <section className="section">
        <SectionLabel n="4.2">The planner, visualized</SectionLabel>
        <h2 className="h2">Watch a join actually happen.</h2>
        <p className="prose">
          A partitioned <b>hash join</b> redistributes rows by join key. Uneven key frequency can leave one worker with much more data than the
          others. A <b>broadcast join</b> copies the build side to workers and is appropriate only when it fits in each worker&apos;s memory with
          headroom for the rest of the query.
        </p>
        <p className="prose">
          Push the skew slider up and watch worker 0 receive more modeled load. A frequent sentinel value such as
          <code> user_id = 0</code> can produce this distribution when it is included in a join key.
        </p>
        <ShuffleSim />
      </section>

      <AntiPatterns
        items={[
          '<b>Broadcasting an unmeasured build side.</b> Check its compressed and in-memory size, worker count, concurrent work, and configured memory limits before adding a hint.',
          "<b>Hash-joining on a column with a single hot key.</b> Classic: <code>user_id = 0</code> for logged-out traffic. Salt the key, or filter first.",
          "<b>Assuming an engine cannot or will spill.</b> Verify the exact engine version, operator support, and cluster settings before assigning a large join.",
          "<b>Using stale table statistics.</b> Refresh statistics after material data changes and compare estimates with runtime rows in the plan.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Inspect join-key distributions</b> on representative data and compare the largest key or partition with the median.",
          "Use <b>broadcast hints</b> only when you've measured the small side. <code>/*+ BROADCAST(x) */</code> is a contract with the planner.",
          "For sustained skew, evaluate filtering, pre-aggregation, splitting hot keys, or <b>salting</b>. Salting adds replication and a second aggregation step; verify that trade-off.",
        ]}
      />
      <Takeaway
        items={[
          "The planner selects <b>shuffle or broadcast</b> from statistics, configuration, and hints. Validate estimates against runtime evidence.",
          "Skew concentrates work. Inspect key and partition distributions before treating cluster size as the cause.",
          "Engine choice is part of job design. Test the target query with the target engine configuration and data distribution.",
        ]}
      />
    </>
  );
}

export default Ch3Compute;
