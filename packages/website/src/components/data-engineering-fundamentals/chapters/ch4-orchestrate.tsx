import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../primitives";
import { BackfillSim } from "../simulators/backfill-sim";
import { DAGDiagram } from "../simulators/dag-diagram";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch4_Orchestrate ──────────────────────────────
// Ported from `src/chapters/Ch4_Orchestrate.js`.

export const IDEMPOTENT_WRITE_SQL = `<span class="tok-c"># Idempotent in this example when logical inputs are unchanged.</span>
<span class="tok-k">INSERT OVERWRITE TABLE</span> daily_rollup <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
<span class="tok-k">SELECT</span> user_id, <span class="tok-f">SUM</span>(events) <span class="tok-k">AS</span> n
<span class="tok-k">FROM</span> clean_events <span class="tok-k">WHERE</span> ds = <span class="tok-s">'&lt;DATEID&gt;'</span>
<span class="tok-k">GROUP BY</span> user_id;

<span class="tok-c"># Non-idempotent in this partitioned example:</span>
<span class="tok-k">INSERT INTO</span> daily_rollup
<span class="tok-k">SELECT</span> * <span class="tok-k">FROM</span> clean_events <span class="tok-k">WHERE</span> ds = <span class="tok-f">CURRENT_DATE</span>();
<span class="tok-c"># Two problems here: (a) append preserves rows from earlier attempts.</span>
<span class="tok-c">#                    (b) CURRENT_DATE selects a different logical input later.</span>`;

export interface Ch4OrchestrateProps {
  readonly chapter: ChapterMeta;
}

export function Ch4Orchestrate({ chapter }: Ch4OrchestrateProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Orchestrate: <span class='accent'>retries need idempotent writes.</span>"
        hook="Airflow reruns tasks on retries, manual restarts and backfills. Each task must define what a rerun does to its outputs and side effects."
        meta={[
          { k: "Scheduler", v: "Airflow · cron + DAG" },
          { k: "Unit", v: "task (op on 1 partition)" },
          { k: "Core primitive", v: "<code>INSERT OVERWRITE</code>" },
        ]}
      />

      <section className="section">
        <SectionLabel n="5.1">Pipelines are graphs</SectionLabel>
        <h2 className="h2">A DAG of tasks, one partition at a time.</h2>
        <p className="prose">A scheduled pipeline is a <b>directed acyclic graph</b>. Nodes are tasks, edges are declared dependencies, and Airflow schedules whatever is ready. Retries, clearing and backfills follow the DAG configuration and operator semantics.</p>
        <DAGDiagram />
        <p className="prose" style={{ marginTop: 18 }}>Idempotency is the task&apos;s job; the scheduler does not guarantee it. An idempotent task run twice on the same logical inputs reaches the same state or makes duplicate side effects detectable and suppressible.</p>
      </section>

      <section className="section">
        <SectionLabel n="5.2">Idempotency, visualized</SectionLabel>
        <h2 className="h2">Flip OVERWRITE → INSERT. Watch the rows double.</h2>
        <p className="prose">The simulator runs a seven-day backfill with repeated attempts. <code>INSERT OVERWRITE</code> replaces the partition; append keeps rows from every earlier attempt. Real idempotency also needs stable inputs, transaction boundaries and the table format&apos;s publish semantics.</p>
        <BackfillSim />
      </section>

      <section className="section">
        <SectionLabel n="5.3">The contract</SectionLabel>
        <CodeBlock title="pipeline.py · an idempotent partition write" lang="Spark" html={IDEMPOTENT_WRITE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Appending on a retryable path without a stable key.</b> Retries keep duplicate rows unless the sink merges or deduplicates idempotently.",
          "<b>Mixing external side effects into a data write.</b> Move notifications and API writes into a dedicated final task with an idempotency key or delivery ledger, so replays skip work already sent.",
          "<b>Selecting the partition with <code>CURRENT_DATE</code> or <code>NOW()</code>.</b> Pass the scheduled partition explicitly so backfills hit the requested interval.",
          "<b>Assuming alerts exist.</b> Configure deadlines, callbacks, ownership and routing, then test the failure path.",
        ]}
      />
      <BestPractices
        items={[
          "Choose <b>overwrite, merge or upsert</b> from the table's key and partition semantics, and test a repeated attempt on the same logical input.",
          "For byte-for-byte reproduction, also pin code, source snapshots and nondeterministic inputs.",
        ]}
      />
    </>
  );
}

export default Ch4Orchestrate;
