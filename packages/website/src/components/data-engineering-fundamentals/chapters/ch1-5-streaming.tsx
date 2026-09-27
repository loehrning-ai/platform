import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../primitives";
import { ConveyorSim } from "../simulators/conveyor-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch1_5_Streaming ──────────────────────────────
// Ported from `src/chapters/Ch1_5_Streaming.js`. `N.*` term references
// resolve to their real/vendor name (see primitives.tsx's Term doc comment
// on why `internalMode` is dropped): Flink, Kafka Streams, Kafka.

export const DEDUP_SQL = `<span class="tok-c">-- Materialize one row per event_id, even when Kafka redelivers.</span>
<span class="tok-k">INSERT OVERWRITE TABLE</span> fct_events <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
<span class="tok-k">SELECT</span> event_id, user_id, event_name, event_ts, received_ts
<span class="tok-k">FROM</span> (
  <span class="tok-k">SELECT</span> *,
    <span class="tok-f">ROW_NUMBER</span>() <span class="tok-k">OVER</span> (
      <span class="tok-k">PARTITION BY</span> event_id
      <span class="tok-k">ORDER BY</span> received_ts <span class="tok-k">DESC</span>
    ) <span class="tok-k">AS</span> rn
  <span class="tok-k">FROM</span> stg_events_raw
  <span class="tok-k">WHERE</span> ds = <span class="tok-s">'&lt;DATEID&gt;'</span>
    <span class="tok-k">AND</span> received_ts &gt;= event_ts                  <span class="tok-c">-- guard against clock skew</span>
) <span class="tok-k">WHERE</span> rn = <span class="tok-n">1</span>;                               <span class="tok-c">-- keep the latest copy</span>`;

export interface Ch15StreamingProps {
  readonly chapter: ChapterMeta;
}

export function Ch15Streaming({ chapter }: Ch15StreamingProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Streaming: <span class='accent'>delivery, windows, and publication.</span>"
        hook="Kafka transports events and Flink processes them. Kafka Streams is an alternative library, not a layer beneath Flink."
        meta={[
          { k: "Streaming engine", v: "Flink" },
          { k: "Bus", v: "Kafka" },
          { k: "Batch cadence", v: "defined by the dataset SLO" },
        ]}
      />

      <section className="section">
        <SectionLabel n="2.1">Continuous processing</SectionLabel>
        <h2 className="h2">Micro-batch vs continuous, exactly-once vs at-least-once.</h2>
        <p className="prose">Batch engines process bounded inputs on a schedule. Streaming engines process unbounded input and carry state. Either can produce correct or wrong results; the contract says when a result publishes, when it is final, and how replays, duplicates and late records are handled.</p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">Latency</div>
            <div className="ccard-n">Publication cadence</div>
            <div className="ccard-d">Separate freshness targets for operational views and settled reports.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Delivery</div>
            <div className="ccard-n">Processing boundary</div>
            <div className="ccard-d">Exactly-once claims depend on source offsets, state checkpoints, and transactional or idempotent sinks.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Window</div>
            <div className="ccard-n">Tumbling · sliding · session</div>
            <div className="ccard-d">Late records update a window, enter a later one, go to a side output or get dropped.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="2.2">The boundary problem</SectionLabel>
        <h2 className="h2">Replays and late records at the warehouse boundary.</h2>
        <p className="prose">Retries and recovery deliver records again, and event time drifts from arrival time. At the warehouse boundary an idempotent upsert on a stable event key or a deterministic dedup key absorbs replays. A watermark and late-data policy decide when windows publish and what happens to later records.</p>
        <ConveyorSim />
      </section>

      <section className="section">
        <SectionLabel n="2.3">The dedup template</SectionLabel>
        <CodeBlock title="fct_events_dedup.sql · the warehouse boundary" lang="SQL" html={DEDUP_SQL} />
      </section>

      <AntiPatterns
        items={[
          '<b>Publishing an early estimate without its status.</b> Mark it as sampled, provisional or final and record its source cutoff.',
          '<b>Treating a producer delivery claim as an end-to-end guarantee.</b> Verify source, processor, state and sink across retries and recovery.',
          "<b>Scheduling a rollup independently of event-time progress.</b> Trigger publication from the documented watermark or completeness signal.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Signal table per stream.</b> A tiny table records when a watermark closed for a (source, ds) pair. A downstream ExternalTaskSensor waits on the <em>signal</em>, not the data.",
          "<b>Reconcile provisional and settled outputs.</b> Take cadence and tolerance from the dataset SLO and investigate sustained differences.",
        ]}
      />
    </>
  );
}

export default Ch15Streaming;
