import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { WatermarkSim } from "../simulators/watermark-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch1_Ingest ───────────────────────────────────
// Ported from `src/chapters/Ch1_Ingest.js`.

function IngestStreams() {
  return (
    <div className="cards-2">
      <div className="ccard">
        <div className="ccard-t">ClickHouse</div>
        <div className="ccard-n">Sampled · real-time</div>
        <div className="ccard-d">
          1-in-N rows. Sub-minute freshness. Perfect for <em>&quot;is something on fire?&quot;</em> Never sum raw sample counts and expect truth:
          always multiply by the sample rate.
        </div>
      </div>
      <div className="ccard">
        <div className="ccard-t">Snowflake</div>
        <div className="ccard-n">Exact · batch</div>
        <div className="ccard-d">100% of rows, deterministic. Hours of delay. What you use for finance, policy, and anything a regulator might subpoena.</div>
      </div>
    </div>
  );
}

const KAFKA_TO_WAREHOUSE_SQL = `<span class="tok-k">INSERT OVERWRITE TABLE</span> events_daily <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
<span class="tok-k">SELECT</span>
  user_id,
  event_name,
  event_time,
  <span class="tok-f">COUNT</span>(*) <span class="tok-k">AS</span> n
<span class="tok-k">FROM</span> clickhouse_events
<span class="tok-k">WHERE</span> event_time <span class="tok-k">BETWEEN</span> <span class="tok-s">'&lt;DATEID&gt;'</span> <span class="tok-k">AND</span> <span class="tok-s">'&lt;DATEID&gt; 23:59:59'</span>
  <span class="tok-k">AND</span> processing_time &lt; <span class="tok-s">'&lt;DATEID+1&gt; 00:30:00'</span>  <span class="tok-c">-- watermark: 30m grace</span>
<span class="tok-k">GROUP BY</span> user_id, event_name, event_time;`;

export interface Ch1IngestProps {
  readonly chapter: ChapterMeta;
}

export function Ch1Ingest({ chapter }: Ch1IngestProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Ingest: <span class='accent'>where data is born,</span> and what it costs to trust it."
        hook="Events are captured live on the edge and land in two places: a <strong>sampled, real-time store</strong> (ClickHouse) for on-call; and an <strong>exact, batch warehouse</strong> (Snowflake) for accounting. The bridge between them is a watermark: a line past which late events are dropped. Drag it wrong and you ship wrong numbers."
        meta={[
          { k: "Source", v: '<span class="chip">ClickHouse</span><span class="chip">Loggers</span><span class="chip">CDC</span>' },
          { k: "Sink", v: "Snowflake · Iceberg tables" },
          { k: "Hard problem", v: "late arrivals & clock skew" },
        ]}
      />

      <section className="section">
        <SectionLabel n="1.1">Two clocks, one event</SectionLabel>
        <h2 className="h2">Event time vs processing time.</h2>
        <p className="prose">
          Every event carries two timestamps. <b>Event time</b> is when it happened: a tap on a phone, an ad impression rendered.{" "}
          <b>Processing time</b> is when your stream actually saw it. Mobile clients, retries, weak cell signal, and simple clock skew make these
          diverge. Any system that pretends they&apos;re the same ships the wrong numbers.
        </p>
        <p className="prose">
          Modern logger tiers (Kafka + Flink CDC) emit events into ClickHouse within <em>seconds</em> of event time; Snowflake lands them as
          Parquet minutes to hours later. Between those two, the <b>watermark</b> decides which late events get to join the aggregate and which
          get dropped.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="1.2">The compromise, visualized</SectionLabel>
        <h2 className="h2">When do you stop waiting?</h2>
        <p className="prose">
          Drag the blue line. Green dots are on-time events; amber dots arrived late. Anything past the watermark is <em>dropped</em>: gone from
          Snowflake. Too tight and you lose real data; too loose and dashboards lag by an hour. There is no free correct answer.
        </p>
        <WatermarkSim />
        <p className="prose" style={{ marginTop: 22 }}>
          In production, watermarks are typically <b>15–60 minutes</b> behind real-time: long enough to absorb mobile stragglers, short enough
          that dashboards feel live. Finance-critical pipelines push the watermark out to hours and accept the delay.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="1.3">Two stores, two jobs</SectionLabel>
        <h2 className="h2">
          ClickHouse answers <em>&quot;now&quot;</em>. Snowflake answers <em>&quot;exactly&quot;</em>.
        </h2>
        <p className="prose">
          The rule is not &quot;pick one.&quot; It&apos;s <em>use both, and know which question each one answers</em>. ClickHouse is for live
          debugging, oncall, and broad strokes. Snowflake is for contracts, finance, and any number that has to survive a regulator.
        </p>
        <IngestStreams />
      </section>

      <section className="section">
        <SectionLabel n="1.4">The canonical kafka-to-warehouse SQL</SectionLabel>
        <CodeBlock title="kafka_to_warehouse_events.sql" lang="Spark" html={KAFKA_TO_WAREHOUSE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Summing raw ClickHouse counts without the sample rate.</b> A 1:1000 sample reports 1000× fewer impressions. Always multiply by <code>sample_rate</code>.",
          "<b>Watermark = now.</b> You'll drop every mobile event that round-trips through a cell tower. Give it at least 15 minutes of grace.",
          "<b>Treating the kafka-to-warehouse pipeline as eventually consistent.</b> It isn't. Once the window closes, late events are <em>gone</em>: no backfill, no retry will save them.",
          "<b>Reading <code>NOW()</code> inside an ingest job.</b> A backfill in May for last Tuesday becomes unreproducible. Use <code>&lt;DATEID&gt;</code>.",
        ]}
      />
      <BestPractices
        items={[
          "Emit <b>both timestamps</b> on every event: <code>event_time</code> (device) and <code>processing_time</code> (server). The gap between them is your watermark budget.",
          "Budget your watermark from the <b>p99 network delay</b> for mobile, not the median. 30 minutes is a sane starting point.",
          'Dashboards that demand real-time: read <b>ClickHouse</b>, annotate them <em>"sampled"</em>. Anything cited in a deck: read <b>Snowflake</b>.',
        ]}
      />
      <Takeaway
        items={[
          "Every event has two clocks: <b>event time</b> and <b>processing time</b>. Late arrivals live in the gap between them.",
          "The <b>watermark</b> is the price you pay to close a window. Tighter = lossier. Looser = later.",
          "<b>ClickHouse</b> is sampled and fast; <b>Snowflake</b> is exact and slow. Use both: know which question each one answers.",
        ]}
      />
    </>
  );
}

export default Ch1Ingest;
