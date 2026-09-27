import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../primitives";
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
          Keeps one of every N events. Estimates from it need the declared sampling design and estimator.
        </div>
      </div>
      <div className="ccard">
        <div className="ccard-t">Snowflake</div>
        <div className="ccard-n">Complete · scheduled batch</div>
        <div className="ccard-d">Keeps all accepted raw events and rebuilds a partition from fixed inputs. Completeness still depends on source capture and late-data policy.</div>
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
        hook="A watermark closes each event-time window. The late-data policy decides what happens to records that arrive after it."
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
          Every event carries two timestamps. <b>Event time</b> is when it happened, such as a tap on a phone or a rendered ad.{" "}
          <b>Processing time</b> is when your stream saw it. Mobile clients, retries, weak signal and clock skew pull them apart, and treating
          them as equal gives wrong numbers.
        </p>
        <p className="prose">In the course architecture Kafka transports events and a Flink job processes them before the operational and batch
          writes split. The <b>watermark</b> marks event-time progress. After it, the configured policy updates a window, reroutes late records
          or drops them.</p>
      </section>

      <section className="section">
        <SectionLabel n="1.2">The compromise, visualized</SectionLabel>
        <h2 className="h2">When do you stop waiting?</h2>
        <p className="prose">Drag the blue line. This simulator drops late records; a production pipeline can keep the raw input and reroute or reprocess them. Either way you trade publication delay against completeness.</p>
        <WatermarkSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Set the watermark from observed lateness and the consumer&apos;s delay tolerance. Track how much data arrives after closure and
          revise the policy when that changes.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="1.3">Two stores, two jobs</SectionLabel>
        <h2 className="h2">
          Separate the operational projection from the complete batch.
        </h2>
        <p className="prose">
          These roles belong to this reference architecture, not to the vendors. The sample serves operational inspection. The batch serves
          reproducible reporting once source, completeness checks and late-data policy are known.
        </p>
        <IngestStreams />
      </section>

      <section className="section">
        <SectionLabel n="1.4">The course kafka-to-warehouse SQL</SectionLabel>
        <CodeBlock title="kafka_to_warehouse_events.sql" lang="Spark" html={KAFKA_TO_WAREHOUSE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Treating sample counts as population counts.</b> A 1:1000 sample needs a declared weighting or estimator and selection assumptions.",
          "<b>Dropping late events with no recovery path.</b> Keep an immutable raw log or a side output when later correction is needed.",
          "<b>Reading <code>NOW()</code> inside an ingest job.</b> A backfill in May for last Tuesday becomes unreproducible. Use <code>&lt;DATEID&gt;</code>.",
        ]}
      />
      <BestPractices
        items={[
          "Emit <b>both timestamps</b> on every event: <code>event_time</code> (device) and <code>processing_time</code> (server). The gap is your watermark budget.",
          "Label sampled outputs with their sample design, scheduled outputs with cutoff, source coverage and correction policy.",
        ]}
      />
    </>
  );
}

export default Ch1Ingest;
