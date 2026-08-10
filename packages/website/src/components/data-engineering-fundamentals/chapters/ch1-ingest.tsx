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
        <div className="ccard-n">Sampled · operational view</div>
        <div className="ccard-d">
          The course scenario stores one of every N events for an operational view. Any estimate derived from that sample must use the declared
          sampling design and estimator.
        </div>
      </div>
      <div className="ccard">
        <div className="ccard-t">Snowflake</div>
        <div className="ccard-n">Complete · scheduled batch</div>
        <div className="ccard-d">The course batch retains all accepted raw events and rebuilds a partition from fixed inputs. Completeness still depends on source capture and late-data policy.</div>
      </div>
    </div>
  );
}

export const KAFKA_TO_WAREHOUSE_SQL = `<span class="tok-k">INSERT OVERWRITE TABLE</span> events_daily <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
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
        title="Ingest: <span class='accent'>event time, processing time, and late data.</span>"
        hook="The course reference pipeline writes a sampled operational projection to ClickHouse and a complete scheduled batch to Snowflake. A watermark closes each event-time window; the configured late-data policy determines what happens after closure."
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
          In the course architecture, Kafka transports events and a Flink job processes them before separate operational and batch writes. The
          <b> watermark</b> expresses how far event-time processing has progressed. A configured policy may update a window, route late records
          elsewhere, or discard them.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="1.2">The compromise, visualized</SectionLabel>
        <h2 className="h2">When do you stop waiting?</h2>
        <p className="prose">
          Drag the blue line. Green dots arrive before the simulated watermark and amber dots arrive later. This simulator uses a discard-late
          policy. A production pipeline can instead retain raw input and route or reprocess late records. The choice changes both publication
          delay and completeness.
        </p>
        <WatermarkSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Set the watermark from observed lateness distributions and the consumer&apos;s publication tolerance. Record how much data arrives after
          closure and revise the policy when that distribution changes.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="1.3">Two stores, two jobs</SectionLabel>
        <h2 className="h2">
          Separate the operational projection from the complete batch.
        </h2>
        <p className="prose">
          These roles belong to this reference architecture, not to the vendor names themselves. The sampled projection supports operational
          inspection. The scheduled batch supports reproducible reporting once its source, completeness checks, and late-data policy are known.
        </p>
        <IngestStreams />
      </section>

      <section className="section">
        <SectionLabel n="1.4">The course kafka-to-warehouse SQL</SectionLabel>
        <CodeBlock title="kafka_to_warehouse_events.sql" lang="Spark" html={KAFKA_TO_WAREHOUSE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Using raw sample counts as population counts.</b> A 1:1000 sample needs a declared weighting or estimator, plus assumptions about how the sample was selected.",
          "<b>Closing a window without measuring lateness.</b> Use observed event-time and processing-time gaps to choose and monitor the watermark.",
          "<b>Discarding late events without retaining a recovery path.</b> Preserve an immutable raw log or a side output when later correction is required.",
          "<b>Reading <code>NOW()</code> inside an ingest job.</b> A backfill in May for last Tuesday becomes unreproducible. Use <code>&lt;DATEID&gt;</code>.",
        ]}
      />
      <BestPractices
        items={[
          "Emit <b>both timestamps</b> on every event: <code>event_time</code> (device) and <code>processing_time</code> (server). The gap between them is your watermark budget.",
          "Choose the watermark from the <b>observed lateness distribution</b> and a documented completeness-versus-delay requirement.",
          'Label sampled outputs with their sample design. Label scheduled outputs with their cutoff, source coverage, and correction policy.',
        ]}
      />
      <Takeaway
        items={[
          "Every event has two clocks: <b>event time</b> and <b>processing time</b>. Late arrivals live in the gap between them.",
          "A <b>watermark</b> marks event-time progress. The late-data policy decides whether later records update, reroute, or drop.",
          "Vendor choice does not establish freshness or completeness. State those properties for each pipeline output.",
        ]}
      />
    </>
  );
}

export default Ch1Ingest;
