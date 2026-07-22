import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { ConveyorSim } from "../simulators/conveyor-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch1_5_Streaming ──────────────────────────────
// Ported from `src/chapters/Ch1_5_Streaming.js`. `N.*` term references
// resolve to their real/vendor name (see primitives.tsx's Term doc comment
// on why `internalMode` is dropped): Flink, Kafka Streams, Kafka.

const DEDUP_SQL = `<span class="tok-c">-- Materialize one row per event_id, even when Kafka redelivers.</span>
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
        title="Streaming: <span class='accent'>real-time</span> and <span class='accent'>accurate</span> are pick-two."
        hook="Events arrive continuously: clicks, impressions, heartbeats. <strong>Flink</strong> on top of <strong>Kafka Streams</strong> gives you answers in seconds. Snowflake gives you answers you can bet a launch on. <em>They are not the same number.</em> Your job: know which one your decision needs, and bridge the two cleanly."
        meta={[
          { k: "Streaming engine", v: "Flink" },
          { k: "Bus", v: "Kafka" },
          { k: "Warehouse lag", v: "~4h typical" },
        ]}
      />

      <section className="section">
        <SectionLabel n="2.1">Continuous processing</SectionLabel>
        <h2 className="h2">Micro-batch vs continuous, exactly-once vs at-least-once.</h2>
        <p className="prose">
          Batch engines pull windows of events on a schedule. Streaming engines consume one event at a time, as it arrives. The trade-off is{" "}
          <b>latency vs correctness</b>: streams answer in seconds but hand you partial, possibly-duplicated data; batch settles for hours but
          hands you one row per event, dedupped, joined, and governed.
        </p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">Latency</div>
            <div className="ccard-n">Seconds vs hours</div>
            <div className="ccard-d">Dashboards for on-call humans want seconds. Exec slides want hours (but correct).</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Delivery</div>
            <div className="ccard-n">Exactly-once ⊆ at-least-once + dedup</div>
            <div className="ccard-d">&quot;Exactly-once&quot; is at-least-once with a deterministic dedup key applied at the warehouse boundary.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Window</div>
            <div className="ccard-n">Tumbling · sliding · session</div>
            <div className="ccard-d">Pick a window, commit to the watermark. Late events either land in the next window or drop.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="2.2">The boundary problem</SectionLabel>
        <h2 className="h2">Every stream hitting the warehouse needs a dedup gate and a watermark.</h2>
        <p className="prose">
          The bus re-delivers. Producers retry. Networks flap. Clocks disagree. If you take streaming data and
          <code>INSERT INTO</code> a Snowflake fact table without guards, you will (a) double-count some events and (b) miscount any day whose
          late events arrive after the rollup runs. The two guards are independent: <b>dedup</b> fixes re-delivery, <b>watermark</b> fixes late
          arrival. Toggle each below and watch what it catches.
        </p>
        <ConveyorSim />
      </section>

      <section className="section">
        <SectionLabel n="2.3">The dedup template</SectionLabel>
        <CodeBlock title="fct_events_dedup.sql · the warehouse boundary" lang="SQL" html={DEDUP_SQL} />
      </section>

      <AntiPatterns
        items={[
          '<b>Trusting sampled real-time as ground truth.</b> "Flink says 4.2M, the deck says 4.2M." The deck will be cited in a launch review. The stream will have drifted 90 minutes later. Always reconcile with the warehouse count before anything permanent.',
          '<b>"The producer promised exactly-once" → skipping dedup.</b> Producers lie, retry logic fires, and bus partitions re-order. Dedup at every warehouse boundary: this is non-negotiable.',
          "<b>Processing day N before its watermark closes.</b> A daily rollup that runs at 00:05 will miss an hour of late-arriving events. Schedule against the watermark, not the wall clock.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Signal table per stream.</b> A separate tiny table that records when a watermark closed for a (source, ds) pair. Downstream ExternalTaskSensor waits on the <em>signal</em>, not the data.",
          "<b>Dedup at every boundary.</b> <code>ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY received_ts DESC) = 1</code>. Same template everywhere.",
          "<b>Weekly real-time vs warehouse reconciliation.</b> Compute the delta. Alert on drift &gt; X%. The drift itself is a bug-finder: a producer misbehaving, a bus partition stuck, a watermark misconfigured.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Real-time and accurate are pick-two.</b> Pick what your decision needs, not what feels impressive.",
          "<b>Every stream → warehouse boundary dedups AND watermarks.</b> Two independent guards; both required.",
          "<b>Wait on the signal, not the data.</b> Data can land partial. Signal lands once, correctly, and only when the watermark closes.",
        ]}
      />
    </>
  );
}

export default Ch15Streaming;
