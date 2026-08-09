import { Hero, SectionLabel, AntiPatterns, Takeaway } from "../primitives";
import { LayerCake } from "../simulators/layer-cake";
import { ByteTrace } from "../simulators/byte-trace";
import { Scanner } from "../simulators/scanner";
import { SqlDecoderStage } from "../simulators/sql-decoder-stage";
import { ConnectorSwitcher } from "../simulators/connector-switcher";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch0_Fundamentals ─────────────────────────────
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
          <div className="lh-note">Compatible engines can read the same files. Compute and storage can scale independently.</div>
        </div>
      </div>
    </div>
  );
}

function FormatSpectrum() {
  const formats = [
    { name: "CSV / JSON", kind: "row", tagline: "Text formats suited to exchange and inspection. Types, schema enforcement, and compression depend on the surrounding system.", traits: ["row-oriented", "text", "portable"] },
    { name: "Parquet / ORC", kind: "col", tagline: "Typed columnar files with metadata and compression. Designed for selective analytical reads.", traits: ["columnar", "schema", "compressed"] },
    { name: "Iceberg / Delta / Hudi", kind: "tbl", tagline: "Table formats that track data files and add transaction, schema-evolution, and snapshot semantics.", traits: ["transactions", "snapshots", "schema-evolution"] },
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
    { n: "Presto / Trino", kind: "distributed SQL", fits: "Interactive SQL across configured catalogs and connectors.", not: "Long transformations without checking spill, retry, and resource settings." },
    { n: "Spark / Databricks", kind: "distributed processing", fits: "Batch transformations, large joins, and jobs that benefit from recomputation or spill.", not: "Latency-sensitive queries without measuring startup and scheduling overhead." },
    { n: "Snowflake", kind: "managed cloud warehouse", fits: "Managed SQL compute with independently sized virtual warehouses.", not: "Workloads whose portability or external-engine access requirements conflict with the platform design." },
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
        hook="Query cost starts with data layout, metadata, and the engine that reads the files. This chapter traces those layers before comparing execution models."
        meta={[
          { k: "Covers", v: '<span class="chip">Lakehouse</span><span class="chip">Row vs columnar</span><span class="chip">Parquet</span><span class="chip">Iceberg</span>' },
          { k: "Engines", v: "Presto · Spark · Trino · Snowflake" },
          { k: "Outcome", v: "Compare bytes read by row and column layouts" },
        ]}
      />

      <section className="section">
        <SectionLabel n="0.1">Decoupling storage from compute</SectionLabel>
        <h2 className="h2">Why storage and compute are separated.</h2>
        <p className="prose">
          A decade ago, a warehouse was a box. Oracle, Teradata, Vertica: one appliance owned both the disks and the query engine. You bought them
          together, you scaled them together, and if you wanted to try a new engine you migrated terabytes first.
        </p>
        <p className="prose">
          A <b>lakehouse</b> architecture can place data in shared object storage such as S3, GCS, or Azure Blob, commonly as columnar files such
          as Parquet or ORC. Engines that support the chosen formats, table metadata, and access controls can read those files. Compute and
          storage then scale through separate controls.
        </p>
        <LakehouseDiagram />
      </section>

      <section className="section">
        <SectionLabel n="0.2">The layers</SectionLabel>
        <h2 className="h2">Seven layers, one query.</h2>
        <p className="prose">
          The course reference path separates a warehouse query into seven diagnostic layers. The stack, bottom-up: <b>physical storage</b> (SSD blob tier), <b>blob</b> (S3),<b> file format</b>{" "}
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
          lookups can add substantial work to a cold run. The simulator uses illustrative inputs rather than vendor benchmarks.
        </p>
        <ByteTrace />
      </section>

      <section className="section">
        <SectionLabel n="0.4">Row vs columnar, visualized</SectionLabel>
        <h2 className="h2">Why analytics loves columns.</h2>
        <p className="prose">
          In a row layout, a record&apos;s fields are stored together. That layout supports point reads well, but an analytical query over one column
          may read unrelated fields unless the storage engine has another access path.
        </p>
        <p className="prose">
          In a columnar layout, values of <code>revenue</code> are stored in column chunks. When the format and connector support projection
          pushdown, the engine reads the requested chunks instead of every field. The actual reduction depends on the selected columns, file
          layout, and query plan.
        </p>
        <Scanner />
        <p className="prose" style={{ marginTop: 24 }}>
          Columnar storage can compress efficiently because adjacent values often share a type and distribution. Compression depends on the data,
          encoding, codec, and row-group size; measure the result on representative files.
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
          A pipeline may retain raw JSON for replay, write validated typed records to Parquet, and register those files in a table format such as
          <b> Iceberg</b>. Snapshot queries and rollback behavior then depend on the selected engine and table-format implementation.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="0.6">How a query becomes work</SectionLabel>
        <h2 className="h2">Five transformations between your text and your bytes.</h2>
        <p className="prose">
          New hires think SQL &quot;just runs.&quot; In fact a coordinator takes your statement through a pipeline: parser builds an <b>AST</b>,
          analyzer resolves names against the catalog, planner emits a<b> logical</b> tree of relational operators, then a <b>physical</b> plan
          with exchange types and worker counts, and finally a <b>task graph</b> of stages dispatched across the cluster. Plan and runtime detail
          exposed by <code>EXPLAIN</code> or <code>EXPLAIN ANALYZE</code> depends on the engine.
        </p>
        <SqlDecoderStage />
      </section>

      <section className="section">
        <SectionLabel n="0.7">The engine ecosystem</SectionLabel>
        <h2 className="h2">Pick the engine for the query, not the other way round.</h2>
        <p className="prose">
          Decoupled storage means you can run <em>different</em> engines against the <em>same</em> bytes depending on what you&apos;re doing.
          Interactive queries and long transformations place different demands on startup time, memory, spill, retries, and concurrency. Compare
          those requirements against the engine&apos;s configured behavior.
        </p>
        <EngineCards />
      </section>

      <section className="section">
        <SectionLabel n="0.8">Connectors: same SQL, different physics</SectionLabel>
        <h2 className="h2">The connector chooses the physics.</h2>
        <p className="prose">
          Trino (the open-source MPP query engine, originally PrestoSQL) ships a pluggable connector interface: the same SQL statement can compile
          down to distributed object-store reads, local storage access, or coordinator metadata. The same query text can therefore use different
          I/O paths. Inspect the connector plan, cache state, and data placement before comparing latency.
        </p>
        <ConnectorSwitcher />
      </section>

      <AntiPatterns
        items={[
          "<b>Treating a data lake like a relational DB.</b> <code>UPDATE one_row WHERE id = ...</code> on raw Parquet rewrites an entire file. Use a table format (Iceberg/Delta) that supports row-level changes, or batch the update.",
          "<b>The small-files problem.</b> Many small files can add listing, footer-read, and task-scheduling overhead. Define a target file-size range and compact when measurements justify it.",
          "<b>Using raw CSV as an analytical table.</b> Parse and validate types before writing a typed columnar representation when selective analytical reads are required.",
          "<b><code>SELECT *</code> on a 300-column fact table.</b> Undoes everything columnar gave you. Ask for exactly the columns you need.",
          "<b>Treating Trino and PrestoDB as identical.</b> Trino (formerly PrestoSQL) and PrestoDB diverged around 2020 and have since drifted significantly, function names, connector behavior, and optimizer defaults all differ. Check which one your cluster runs before copy-pasting docs.",
          "<b>Ignoring the execution plan.</b> Use the engine's plan and runtime statistics before changing SQL or cluster settings.",
          "<b>Choosing an engine by reputation alone.</b> Measure startup, scan, memory, spill, retry, and concurrency behavior for the target workload.",
        ]}
      />
      <Takeaway
        items={[
          "<b>A warehouse is seven layers.</b> Knowing the layer means knowing the failure mode: metastore down is not the same as SSD tier slow.",
          "<b>SQL → AST → logical → physical → stages → tasks.</b> Use the engine's available plan and runtime detail to inspect these transformations.",
          "<b>The connector selects the access path.</b> Identical SQL can reach different storage, metadata, and cache layers.",
          "Columnar formats turn analytics into <b>skip-most-of-the-disk</b> operations. Table formats add ACID and time travel on top.",
          "Read the plan before you tune the query. Filter on partition and indexed columns first. Avoid <code>SELECT *</code>.",
        ]}
      />
    </>
  );
}

export default Ch0Fundamentals;
