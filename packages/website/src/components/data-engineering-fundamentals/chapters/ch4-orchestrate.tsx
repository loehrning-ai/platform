import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { BackfillSim } from "../simulators/backfill-sim";
import { DAGDiagram } from "../simulators/dag-diagram";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch4_Orchestrate ──────────────────────────────
// Ported from `src/chapters/Ch4_Orchestrate.js`.

const IDEMPOTENT_WRITE_SQL = `<span class="tok-c"># ✓ Idempotent: rerunning produces the same partition.</span>
<span class="tok-k">INSERT OVERWRITE TABLE</span> daily_rollup <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
<span class="tok-k">SELECT</span> user_id, <span class="tok-f">SUM</span>(events) <span class="tok-k">AS</span> n
<span class="tok-k">FROM</span> clean_events <span class="tok-k">WHERE</span> ds = <span class="tok-s">'&lt;DATEID&gt;'</span>
<span class="tok-k">GROUP BY</span> user_id;

<span class="tok-c"># ✗ NEVER do this in a scheduled job:</span>
<span class="tok-k">INSERT INTO</span> daily_rollup
<span class="tok-k">SELECT</span> * <span class="tok-k">FROM</span> clean_events <span class="tok-k">WHERE</span> ds = <span class="tok-f">CURRENT_DATE</span>();
<span class="tok-c"># Two problems: (a) INSERT appends on retry → duplicates.</span>
<span class="tok-c">#               (b) CURRENT_DATE is non-deterministic → backfills are broken.</span>`;

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
        hook="Airflow is the scheduler that runs every pipeline at a modern tech company. Its contract is simple and ruthless: <strong>any task may run more than once.</strong> Crashes, timeouts, backfills: the scheduler will retry. Your job is to make sure retries don't corrupt the table."
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
          Every pipeline is a <b>directed acyclic graph</b>. Nodes are tasks (read a table, write a partition). Edges are data dependencies (
          <em>agg</em> needs <em>clean</em> to have landed). The scheduler walks the graph, runs what&apos;s ready, retries what fails, and
          invalidates downstreams when an upstream is re-materialized.
        </p>
        <DAGDiagram />
        <p className="prose" style={{ marginTop: 18 }}>
          The scheduler has exactly one guarantee: <em>given the same inputs, re-running a task must produce the same output</em>. If you break
          that, every retry, backfill, and late-arriving upstream turns into a silent data bug.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="5.2">Idempotency, visualized</SectionLabel>
        <h2 className="h2">Flip OVERWRITE → INSERT. Watch the rows double.</h2>
        <p className="prose">
          Seven-day backfill. Failure rate knob simulates transient errors: timeouts, spot-instance evictions, OOM kills. With{" "}
          <code>INSERT OVERWRITE</code>, a retry replaces the partition wholesale: the final row count is correct no matter how many attempts
          happened. With plain <code>INSERT</code>, every failed attempt left rows behind, and the successful retry piles more on top.
          That&apos;s how a pipeline silently ships 2× the truth.
        </p>
        <BackfillSim />
      </section>

      <section className="section">
        <SectionLabel n="5.3">The contract</SectionLabel>
        <CodeBlock title="pipeline.py · the Airflow-approved write" lang="Spark" html={IDEMPOTENT_WRITE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Using <code>INSERT INTO</code> in a scheduled task.</b> The scheduler will retry you. You will double-write. Ask every DE who has on-called which bug they've seen most: it's this one.",
          "<b>Side effects with no undo.</b> Sending a push notification inside an ETL task is not re-runnable. Separate side effects into their own dedicated tasks, and log what was sent so replay can skip it.",
          "<b>Reading <code>CURRENT_DATE</code> / <code>NOW()</code> inside task bodies.</b> A backfill in May for last Tuesday will land under this Tuesday's partition. Use the <code>&lt;DATEID&gt;</code> macro.",
          "<b>Skipping SLA annotations.</b> A task that should finish by 06:00 but doesn't tell the scheduler so won't page anyone when it silently slips to 14:00.",
        ]}
      />
      <BestPractices
        items={[
          "Every scheduled task: <b><code>INSERT OVERWRITE TABLE … PARTITION(ds='&lt;DATEID&gt;')</code></b>. Full stop. No exceptions.",
          "Stamp every partition with the <b><code>DATEID</code> macro</b>: never wall clock. A task running today must produce the same bytes as a rerun next year.",
          "Tag SLAs and alerts at the <b>DAG node level</b>. The scheduler pages on missed SLAs; don't rely on dashboards to catch late pipelines.",
          "For unavoidable side effects (emails, pushes, external API writes), <b>isolate them in a dedicated terminal task</b> and maintain an external ledger so replays can skip already-sent work.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Airflow retries tasks.</b> Always. The only question is whether retries corrupt your table.",
          "<code>INSERT OVERWRITE</code> + <code>&lt;DATEID&gt;</code> = idempotent. That pattern is the whole chapter.",
          "<b>Side effects must be isolated and replayable.</b> A pipeline that can email twice will, eventually, email twice.",
        ]}
      />
    </>
  );
}

export default Ch4Orchestrate;
