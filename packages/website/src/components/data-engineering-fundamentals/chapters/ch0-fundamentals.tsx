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
          <div className="lh-note">Compute is tied to its own disks. Both scale together, and an upgrade means a migration.</div>
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
          <div className="lh-note">Engines share the files and scale apart from storage.</div>
        </div>
      </div>
    </div>
  );
}

function FormatSpectrum() {
  const formats = [
    { name: "CSV / JSON", kind: "row", tagline: "Text for exchange. Types, schema checks and compression depend on the surrounding system.", traits: ["row-oriented", "text", "portable"] },
    { name: "Parquet / ORC", kind: "col", tagline: "Typed columnar files with metadata and compression, for selective analytical reads.", traits: ["columnar", "schema", "compressed"] },
    { name: "Iceberg / Delta / Hudi", kind: "tbl", tagline: "Track data files and add transactions, schema evolution and snapshots.", traits: ["transactions", "snapshots", "schema-evolution"] },
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
    { n: "Presto / Trino", kind: "distributed SQL", fits: "Interactive SQL across configured catalogs and connectors.", not: "Long transformations with unchecked spill, retry and resource settings." },
    { n: "Spark / Databricks", kind: "distributed processing", fits: "Batch transformations, large joins, jobs that recompute or spill.", not: "Latency-sensitive queries with unmeasured startup and scheduling overhead." },
    { n: "Snowflake", kind: "managed cloud warehouse", fits: "Managed SQL with separately sized virtual warehouses.", not: "Workloads that need portability or external-engine access the platform lacks." },
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
        hook="Query cost depends on data layout, metadata and the engine that reads the files."
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
          A decade ago a warehouse was one appliance. Oracle, Teradata or Vertica owned the disks and the query engine, bought and scaled
          together. A different engine meant migrating terabytes first.
        </p>
        <p className="prose">
          A <b>lakehouse</b> keeps data in shared object storage such as S3, GCS or Azure Blob, usually as Parquet or ORC files. Any engine
          that understands the format, table metadata and access rules reads the same files.
        </p>
        <LakehouseDiagram />
      </section>

      <section className="section">
        <SectionLabel n="0.2">The layers</SectionLabel>
        <h2 className="h2">Every query passes the same stack.</h2>
        <p className="prose">
          A warehouse query passes seven layers, bottom-up: <b>physical storage</b>, <b>blob</b>, <b>file format</b>, <b>table
          abstraction</b>, <b>catalog</b>, <b>query engine</b> and <b>application</b>.
        </p>
        <LayerCake />
      </section>

      <section className="section">
        <SectionLabel n="0.3">A byte&apos;s journey</SectionLabel>
        <h2 className="h2">From SELECT to flash tier, and back.</h2>
        <p className="prose">
          The simulator follows one value, <code>user_email</code> in a single row, from the SQL statement to the bytes on disk. On a cold
          run, metastore and blob lookups add work.
        </p>
        <ByteTrace />
      </section>

      <section className="section">
        <SectionLabel n="0.4">Row vs columnar, visualized</SectionLabel>
        <h2 className="h2">Why analytics reads columns.</h2>
        <p className="prose">
          A row layout keeps a record&apos;s fields together, which suits point reads. A query over one column then reads every other field
          too, unless the engine has another access path.
        </p>
        <p className="prose">
          A columnar layout stores the <code>revenue</code> values in their own chunks. With projection pushdown in format and connector,
          the engine fetches only those chunks. The saving depends on selected columns, file layout and query plan.
        </p>
        <Scanner />
        <p className="prose" style={{ marginTop: 24 }}>
          Columns also compress well because neighbouring values share type and distribution. Data, encoding, codec and row-group size decide
          the result, so measure on representative files.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="0.5">The file-format spectrum</SectionLabel>
        <h2 className="h2">From CSV to Iceberg.</h2>
        <p className="prose">
          <b>File format</b> is how bytes sit on disk. A <b>table format</b> catalogs files so they behave like a table.
        </p>
        <FormatSpectrum />
        <p className="prose" style={{ marginTop: 18 }}>
          A pipeline may keep raw JSON for replay, write validated typed records to Parquet and register them in <b>Iceberg</b>. Snapshot
          queries and rollback then depend on the engine and table-format implementation.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="0.6">How a query becomes work</SectionLabel>
        <h2 className="h2">Five transformations between your text and your bytes.</h2>
        <p className="prose">
          A coordinator walks SQL through a chain: the parser builds an <b>AST</b>,
          analyzer resolves names against the catalog, planner emits a<b> logical</b> tree of relational operators, then a <b>physical</b> plan
          with exchange types and worker counts, and finally a <b>task graph</b> of stages dispatched across the cluster. What
          <code>EXPLAIN</code> or <code>EXPLAIN ANALYZE</code> shows depends on the engine.
        </p>
        <SqlDecoderStage />
      </section>

      <section className="section">
        <SectionLabel n="0.7">The engine ecosystem</SectionLabel>
        <h2 className="h2">Pick the engine for the query.</h2>
        <p className="prose">
          Interactive queries and long transformations need different startup time, memory, spill, retries and concurrency. Compare them
          with your engine&apos;s configuration.
        </p>
        <EngineCards />
      </section>

      <section className="section">
        <SectionLabel n="0.8">Connectors: same SQL, different physics</SectionLabel>
        <h2 className="h2">The connector chooses the physics.</h2>
        <p className="prose">
          Trino, the open-source MPP engine formerly called PrestoSQL, has pluggable connectors. The same SQL can become distributed
          object-store reads, local storage access or coordinator metadata. Check connector plan, cache state and data placement before
          you compare latency.
        </p>
        <ConnectorSwitcher />
      </section>

      <AntiPatterns
        items={[
          "<b>Treating a data lake like a relational DB.</b> <code>UPDATE one_row WHERE id = ...</code> on raw Parquet rewrites a whole file. Use a table format (Iceberg/Delta) with row-level changes, or batch updates.",
          "<b>Small files.</b> They add listing, footer-read and scheduling overhead. Set a target file size and compact when measurements justify it.",
          "<b>Raw CSV as an analytical table.</b> Validate types and write a typed columnar copy for selective reads.",
          "<b><code>SELECT *</code> on a 300-column fact table.</b> Reads every column. Select only the columns you need.",
          "<b>Treating Trino and PrestoDB as identical.</b> They split around 2020; function names, connector behavior and optimizer defaults differ. Check which one your cluster runs before copying docs.",
          "<b>Choosing an engine by reputation.</b> Measure startup, scan, memory, spill, retry and concurrency on the target workload.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Each of the seven layers fails differently.</b> A down metastore needs another fix than a slow SSD tier.",
          "Read the plan and runtime statistics before tuning. Filter on partition and indexed columns first and avoid <code>SELECT *</code>.",
        ]}
      />
    </>
  );
}

export default Ch0Fundamentals;
