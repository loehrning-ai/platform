import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
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
        title="Orchestrate: <span class='accent'>retries are a feature.</span> Only if the write is idempotent."
        hook="Airflow is the scheduler in this course architecture. A task may run again because of configured retries, manual restarts, or backfills. Each task must define what repeated execution does to its outputs and side effects."
        meta={[
          { k: "Scheduler", v: "Airflow · cron + DAG" },
          { k: "Unit", v: "task (op on 1 partition)" },
          { k: "Core primitive", v: "<code>INSERT OVERWRITE</code>" },
        ]}
      />

      <section className="section">
        <SectionLabel n="5.1">Pipelines are graphs</SectionLabel>
        <h2 className="h2">A DAG of tasks, one partition at a time.</h2>
        <p className="prose">
          A scheduled pipeline can be represented as a <b>directed acyclic graph</b>. Nodes are tasks and edges are declared dependencies.
          Airflow schedules ready tasks; retry, clearing, backfill, and downstream behavior depend on DAG configuration and operator semantics.
        </p>
        <DAGDiagram />
        <p className="prose" style={{ marginTop: 18 }}>
          Idempotency is a task contract, not a scheduler guarantee. Given the same logical inputs, repeated execution should converge on the
          intended state or make duplicate side effects detectable and suppressible.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="5.2">Idempotency, visualized</SectionLabel>
        <h2 className="h2">Flip OVERWRITE → INSERT. Watch the rows double.</h2>
        <p className="prose">
          The simulator models a seven-day backfill with repeated attempts. Its deterministic <code>INSERT OVERWRITE</code> branch replaces the
          modeled partition, while its append branch retains rows from earlier attempts. Real idempotency also depends on stable inputs,
          transaction boundaries, and the table format&apos;s publish semantics.
        </p>
        <BackfillSim />
      </section>

      <section className="section">
        <SectionLabel n="5.3">The contract</SectionLabel>
        <CodeBlock title="pipeline.py · the Airflow-approved write" lang="Spark" html={IDEMPOTENT_WRITE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Appending on a retryable path without a stable key.</b> Repeated attempts can preserve duplicate rows unless the sink provides an idempotent merge or deduplication contract.",
          "<b>Mixing external side effects into a data write.</b> Isolate notifications and API writes, then use an idempotency key or delivery ledger.",
          "<b>Reading <code>CURRENT_DATE</code> or <code>NOW()</code> for logical partition selection.</b> Pass the scheduled partition explicitly so backfills target the requested interval.",
          "<b>Assuming alerts exist.</b> Configure deadlines, callbacks, ownership, and routing explicitly, then test the failure path.",
        ]}
      />
      <BestPractices
        items={[
          "Choose <b>overwrite, merge, or upsert</b> from the table's key and partition semantics. Test a repeated attempt against the same logical input.",
          "Pass the logical partition as a run parameter. Also pin code, source snapshots, and nondeterministic inputs when byte-for-byte reproduction is required.",
          "Define deadlines and alerts at the appropriate DAG or task level. Verify that the configured Airflow version and notification path produce the expected escalation.",
          "For unavoidable side effects (emails, pushes, external API writes), <b>isolate them in a dedicated terminal task</b> and maintain an external ledger so replays can skip already-sent work.",
        ]}
      />
      <Takeaway
        items={[
          "Airflow can repeat tasks through retries, clearing, and backfills. Design for that execution model.",
          "A logical date plus deterministic input selection and suitable sink semantics can make a partition write idempotent.",
          "Isolate external side effects and protect them with stable idempotency keys or a delivery ledger.",
        ]}
      />
    </>
  );
}

export default Ch4Orchestrate;
