import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { ShuffleSim } from "../simulators/shuffle-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch3_Compute ──────────────────────────────────
// Ported from `src/chapters/Ch3_Compute.js`.

function EngineMatrix() {
  const rows = [
    { n: "Presto", s: "Interactive SQL", d: "In-memory MPP. Seconds, not minutes. Great for dashboards. Dies on massive joins: no spill-to-disk." },
    { n: "Spark", s: "ETL & pipelines", d: "The workhorse. DataFrame/SQL, spills to disk, fault-tolerant. Most Airflow jobs are Spark." },
    { n: "Snowflake", s: "Cloud OLAP DWH", d: "Columnar storage, virtual warehouses, auto-scale. Great for large ad-hoc queries and batch rewrites; cost scales with compute time." },
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
        hook="Every JOIN is a bet the planner makes against table statistics. Broadcast or shuffle. If the stats are stale, it broadcasts a 5 GB table and OOMs 400 workers simultaneously. The SQL didn't change. The statistics did."
        meta={[
          { k: "Engines", v: '<span class="chip">Presto</span><span class="chip">Spark</span><span class="chip">Snowflake</span>' },
          { k: "Planners", v: "CBO · statistics-driven" },
          { k: "#1 failure", v: "key skew" },
        ]}
      />

      <section className="section">
        <SectionLabel n="4.1">Pick the engine for the query.</SectionLabel>
        <h2 className="h2">Three engines, one set of bytes.</h2>
        <p className="prose">
          Decoupled storage means the same Parquet files can be read by any engine. Pick the one that fits the query. Interactive &amp; &lt; 100
          GB? <b>Presto</b>. Durable and repeatable ETL?<b> Spark</b>. Large ad-hoc rewrites or analyst-heavy workloads? <b>Snowflake</b> — spin up
          a bigger virtual warehouse, run it, tear it down.
        </p>
        <EngineMatrix />
      </section>

      <section className="section">
        <SectionLabel n="4.2">The planner, visualized</SectionLabel>
        <h2 className="h2">Watch a join actually happen.</h2>
        <p className="prose">
          A <b>hash join</b> partitions both sides by the join key and ships each partition to one worker: cheap when keys are uniform, lethal
          when one key is hot. A <b>broadcast join</b> copies the small side to every worker: cheap when one side fits in memory, ruinous when the
          planner thinks 5 GB is &quot;small.&quot;
        </p>
        <p className="prose">
          Push the skew slider up. Watch worker 0 turn red while the rest idle. That&apos;s what
          <code> user_id = 0</code> (unauthenticated traffic) does to every analytics pipeline that forgets to filter it.
        </p>
        <ShuffleSim />
      </section>

      <AntiPatterns
        items={[
          '<b>Broadcasting a 5 GB "small" table.</b> The planner will agree. Then 400 workers OOM at the same instant. Check the build-side size before trusting the hint.',
          "<b>Hash-joining on a column with a single hot key.</b> Classic: <code>user_id = 0</code> for logged-out traffic. Salt the key, or filter first.",
          "<b>Running an exploratory 2 TB scan on Presto.</b> Presto has no spill. It will die at minute 18. Every time. Use Spark.",
          "<b>Stale table statistics.</b> The planner makes decisions on row counts it thinks are right. Re-analyze after every big write or the CBO plans blind.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Inspect your join keys</b> before shipping. A <code>COUNT(*) GROUP BY</code> on the key takes 30 seconds and saves you a Saturday.",
          "Use <b>broadcast hints</b> only when you've measured the small side. <code>/*+ BROADCAST(x) */</code> is a contract with the planner.",
          "For sustained skew, <b>salt the hot key</b> (<code>key || rand(0,N)</code>), join on salted, then aggregate. Classic fix, always works.",
        ]}
      />
      <Takeaway
        items={[
          "The planner decides <b>shuffle vs broadcast</b> from table stats. Bad stats → bad plan → worker explodes.",
          "<b>Skew is the #1 cause of pipeline failure at a modern tech company scale.</b> Always inspect your join keys.",
          "Engine choice is part of job design: it's not the scheduler's job to rescue Presto from a 10 TB rewrite.",
        ]}
      />
    </>
  );
}

export default Ch3Compute;
