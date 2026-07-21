import { Hero, SectionLabel, AntiPatterns, Takeaway } from "../primitives";
import { LayerCake } from "../simulators/layer-cake";
import { ByteTrace } from "../simulators/byte-trace";
import { Scanner } from "../simulators/scanner";
import { SqlDecoderStage } from "../simulators/sql-decoder-stage";
import { ConnectorSwitcher } from "../simulators/connector-switcher";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch0_Fundamentals (plan 011 stage 9) ─────────────────────────────
// Ported from `src/chapters/Ch0_Fundamentals.js`.

function LakehouseDiagram() {
  return (
    <div className="lh-diagram">
      <div className="lh-side legacy">
        <div className="lh-badge">Legacy · coupled</div>
        <div className="lh-stack">
          <div className="lh-box tight">Oracle · Teradata · on-prem MPP</div>
          <div className="lh-note">One box. Compute tied to its own disks. Scale one, scale both. Upgrade = migration.</div>
        </div>
      </div>
      <div className="lh-arrow">DECOUPLE →</div>
      <div className="lh-side modern">
        <div className="lh-badge mint">Modern · lakehouse</div>
        <div className="lh-stack">
          <div className="lh-box lh-compute">
            <div className="lh-k">Compute (elastic)</div>
            <div className="lh-v">Presto · Spark · Trino</div>
          </div>
          <div className="lh-k-arrow">reads</div>
          <div className="lh-box lh-storage">
            <div className="lh-k">Storage (cheap, shared)</div>
            <div className="lh-v">Parquet · ORC · HDFS · S3</div>
          </div>
          <div className="lh-note">Many engines read the same bytes. Compute spins up per-query, storage costs cents.</div>
        </div>
      </div>
    </div>
  );
}

function FormatSpectrum() {
  const formats = [
    { name: "CSV / JSON", kind: "row", tagline: "Human-readable. No schema. No types. No compression. Fine for hand-off, terrible for analytics.", traits: ["row", "no-schema", "uncompressed"] },
    { name: "Parquet / ORC", kind: "col", tagline: "Columnar on disk. Schema + types embedded. Snappy/ZSTD. The analytical default.", traits: ["columnar", "schema", "compressed"] },
    { name: "Iceberg / Delta / Hudi", kind: "tbl", tagline: "A table format on top of Parquet: metadata manifests that give you ACID, schema evolution, time travel.", traits: ["ACID", "time-travel", "schema-evolution"] },
  ];
  return (
    <div className="fmt-strip">
      {formats.map((f, i) => (
        <div key={f.name} className={`fmt-card k-${f.kind}`}>
          <div className="fmt-n">0{i + 1}</div>
          <div className="fmt-name">{f.name}</div>
          <div className="fmt-tag">{f.tagline}</div>
          <div className="fmt-traits">
            {f.traits.map((t) => (
              <span key={t} className="fmt-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EngineCards() {
  const engines = [
    { n: "Presto / Trino", kind: "MPP, in-memory", fits: "Interactive dashboards. Sub-second to tens of seconds.", not: "Hour-long ETL jobs: it dies, can't retry." },
    { n: "Spark / Databricks", kind: "distributed, fault-tolerant", fits: "Heavy ETL. Big joins. Anything that must finish.", not: "Quick ad-hoc: the JVM spin-up alone eats your latency." },
    { n: "Snowflake", kind: "cloud DW → lakehouse", fits: "Managed. Zero-ops. Good price/perf on mid-scale.", not: "Anywhere you need to read external Parquet from a non-Snowflake engine." },
  ];
  return (
    <div className="eng-cards">
      {engines.map((e) => (
        <div className="eng-card" key={e.n}>
          <div className="eng-n">{e.n}</div>
          <div className="eng-kind">{e.kind}</div>
          <div className="eng-row">
            <span className="eng-k mint">Fits</span> <span className="eng-v">{e.fits}</span>
          </div>
          <div className="eng-row">
            <span className="eng-k amber">Avoid</span> <span className="eng-v">{e.not}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Ch0FundamentalsProps {
  readonly chapter: ChapterMeta;
}

export function Ch0Fundamentals({ chapter }: Ch0FundamentalsProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Core fundamentals: <span class='accent'>storage, formats, engines.</span>"
        hook="Before we talk about engines, we talk about physics. The shape of bytes on disk and the engine that reads them decides whether your query is a sip or a flood. <strong>Everything else is a consequence of this.</strong>"
        meta={[
          { k: "Covers", v: '<span class="chip">Lakehouse</span><span class="chip">Row vs columnar</span><span class="chip">Parquet</span><span class="chip">Iceberg</span>' },
          { k: "Engines", v: "Presto · Spark · Trino · Snowflake" },
          { k: "Outcome", v: "Read 100× less disk per query" },
        ]}
      />

      <section className="section">
        <SectionLabel n="0.1">Decoupling storage from compute</SectionLabel>
        <h2 className="h2">The quiet shift that changed every warehouse.</h2>
        <p className="prose">
          A decade ago, a warehouse was a box. Oracle, Teradata, Vertica: one appliance owned both the disks and the query engine. You bought them
          together, you scaled them together, and if you wanted to try a new engine you migrated terabytes first.
        </p>
        <p className="prose">
          The <b>lakehouse</b> move was to put the bytes in a shared object store: S3, GCS, or Azure Blob — as open columnar files (Parquet, ORC) —
          and let <em>any</em> engine read them. Compute became a job, not a server. Storage became a commodity.
        </p>
        <LakehouseDiagram />
      </section>

      <section className="section">
        <SectionLabel n="0.2">The layers</SectionLabel>
        <h2 className="h2">Seven layers, one query.</h2>
        <p className="prose">
          A warehouse query touches seven layers. Most engineers only think about two - the SQL they wrote and the table they named, and are
          baffled when things break in between. The stack, bottom-up: <b>physical storage</b> (SSD blob tier), <b>blob</b> (S3),<b> file format</b>{" "}
          (Parquet · ORC · Avro), <b>table abstraction</b> (namespaces → tables → partitions),<b> catalog</b> (Glue Catalog), <b>query engine</b>{" "}
          (Presto · Spark), <b>application</b> (Hex · dashboards). Knowing the layer means knowing the failure mode.
        </p>
        <LayerCake />
      </section>

      <section className="section">
        <SectionLabel n="0.3">A byte&apos;s journey</SectionLabel>
        <h2 className="h2">From SELECT to flash tier, and back.</h2>
        <p className="prose">
          Let&apos;s make storage tangible. Here&apos;s a single byte: the value of <code>user_email</code> for one row - traced through every stop
          from the SQL statement to the physical bytes on disk. Cold and warm caches have wildly different latency profiles; metastore and blob
          lookups are the two stops that dominate a cold run.
        </p>
        <ByteTrace />
      </section>

      <section className="section">
        <SectionLabel n="0.4">Row vs columnar, visualized</SectionLabel>
        <h2 className="h2">Why analytics loves columns.</h2>
        <p className="prose">
          In a row layout every record&apos;s fields are stored together: perfect for &quot;fetch user 42&quot; but catastrophic for &quot;average{" "}
          <code>revenue</code> across a billion rows&quot;. The scanner has no choice but to touch every byte just to find the one column you asked
          for.
        </p>
        <p className="prose">
          Columnar flips it: all values of <code>revenue</code> are stored contiguously on disk. The engine can <b>skip 99% of the table</b> and go
          straight to the column it needs. This is called <em>projection pushdown</em>, and it&apos;s the single biggest reason Parquet is the
          analytical default.
        </p>
        <Scanner />
        <p className="prose" style={{ marginTop: 24 }}>
          Columnar storage compresses beautifully because values in one column are homogenous: a column of timestamps, a column of country codes.
          Snappy, ZSTD, and run-length encoding routinely shrink a stripe <b>3–10×</b>. The scan head has less to read <em>and</em> the bytes it
          reads unpack cheaply.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="0.5">The file-format spectrum</SectionLabel>
        <h2 className="h2">From CSV to Iceberg.</h2>
        <p className="prose">
          There&apos;s a layered vocabulary worth getting right. <b>File format</b> is how bytes sit on disk.<b> Table format</b> is a catalog of
          files that makes them behave like a table: transactional, evolvable, time-travelable.
        </p>
        <FormatSpectrum />
        <p className="prose" style={{ marginTop: 18 }}>
          You rarely pick just one. A modern pipeline lands raw JSON, converts to Parquet at ingest, and registers the Parquet in an <b>Iceberg</b>{" "}
          table so <code>SELECT ... FOR VERSION AS OF</code> works and a bad backfill is one SQL away from rolled back.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="0.6">How a query becomes work</SectionLabel>
        <h2 className="h2">Five transformations between your text and your bytes.</h2>
        <p className="prose">
          New hires think SQL &quot;just runs.&quot; In fact a coordinator takes your statement through a pipeline: parser builds an <b>AST</b>,
          analyzer resolves names against the catalog, planner emits a<b> logical</b> tree of relational operators, then a <b>physical</b> plan
          with exchange types and worker counts, and finally a <b>task graph</b> of stages dispatched across the cluster. Every step is inspectable
          via <code>EXPLAIN ANALYZE</code>.
        </p>
        <SqlDecoderStage />
      </section>

      <section className="section">
        <SectionLabel n="0.7">The engine ecosystem</SectionLabel>
        <h2 className="h2">Pick the engine for the query, not the other way round.</h2>
        <p className="prose">
          Decoupled storage means you can run <em>different</em> engines against the <em>same</em> bytes depending on what you&apos;re doing.
          Interactive dashboards want sub-second response; hour-long ETL wants fault tolerance. One engine is rarely best at both.
        </p>
        <EngineCards />
      </section>

      <section className="section">
        <SectionLabel n="0.8">Connectors: same SQL, different physics</SectionLabel>
        <h2 className="h2">The connector chooses the physics.</h2>
        <p className="prose">
          Trino (the open-source MPP query engine, originally PrestoSQL) ships a pluggable connector interface: the same SQL statement can compile
          down to fanning out across a thousand S3 blobs, or reading a few megabytes from local SSD, or answering straight from coordinator memory.
          Latency can vary by <b>six orders of magnitude</b> with no change to the query text.
        </p>
        <ConnectorSwitcher />
      </section>

      <AntiPatterns
        items={[
          "<b>Treating a data lake like a relational DB.</b> <code>UPDATE one_row WHERE id = ...</code> on raw Parquet rewrites an entire file. Use a table format (Iceberg/Delta) that supports row-level changes, or batch the update.",
          "<b>The small-files problem.</b> 10 000 × 1 MB Parquet files is worse than 10 × 1 GB: file-listing overhead, per-file footer reads, and task spin-up dominate. Compact on a schedule.",
          "<b>Landing raw CSV in the warehouse.</b> Types unknown, no column pruning, no compression. Always convert to Parquet at ingest.",
          "<b><code>SELECT *</code> on a 300-column fact table.</b> Undoes everything columnar gave you. Ask for exactly the columns you need.",
          "<b>Treating Trino and PrestoDB as identical.</b> Trino (formerly PrestoSQL) and PrestoDB diverged around 2020 and have since drifted significantly — function names, connector behavior, and optimizer defaults all differ. Check which one your cluster runs before copy-pasting docs.",
          "<b>Treating SQL as opaque magic.</b> Every query has a plan, and the plan is inspectable. <code>EXPLAIN ANALYZE</code> before you tune anything.",
          "<b>Choosing Spark for a job Presto would finish in seconds.</b> Spark cold-start is 2–10× Presto's: the JVM warm-up alone eats any interactive budget.",
        ]}
      />
      <Takeaway
        items={[
          "<b>A warehouse is seven layers.</b> Knowing the layer means knowing the failure mode: metastore down is not the same as SSD tier slow.",
          "<b>SQL → AST → logical → physical → stages → tasks.</b> Five transformations between your text and your bytes. All inspectable.",
          "<b>The connector chooses the physics.</b> Same SQL, 1000× latency range. Snowflake ≠ Redis-backed cache ≠ System tables.",
          "Columnar formats turn analytics into <b>skip-most-of-the-disk</b> operations. Table formats add ACID and time travel on top.",
          "Read the plan before you tune the query. Filter on partition and indexed columns first. Avoid <code>SELECT *</code>.",
        ]}
      />
    </>
  );
}

export default Ch0Fundamentals;
