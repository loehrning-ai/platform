// Ported from data-infrastructure/lessons/12-interview-playbook.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("interview-playbook");

const lesson: DataInfraLesson = {
  id: "interview-playbook",
  number: 12,
  title: "The IC5 Interview, Live",
  subtitle: "Design a real-time seller analytics platform · 45 min",
  durationMinutes: 20,
  trackId: "scale",
  hook: "A complete IC5 system design walkthrough — clarification, math, design, deep dives, scoring.",
  keyConcepts: ["Five-act interview structure", "Back-of-envelope estimation", "Trade-off literacy", "Hot-partition follow-up"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Five-act structure",
      readTimeMinutes: 3,
      content:
        "Every data system design interview, regardless of company, is the same five acts. Use this as a template. If the interviewer doesn't lead you through them, lead yourself.\n\n1. **Clarify (5 min).** Don't draw anything yet. Ask what the system is for, who reads the output, what scale, what freshness, what consistency. Write the answers on the board — they're the spec. The three numbers to always extract: writes/sec, reads/sec, freshness target.\n2. **Skeleton (5 min).** Draw the six layers from lesson 1. Mark which layers the question touches. Identify the dominant constraint (usually one of: latency, scale, correctness, or cost).\n3. **Deep dive (20 min).** Pick the hardest 1-2 layers and design them in detail. Schema, partition key, processing topology, SLO targets. This is where the interview is decided. For storage: name the partition key and explain your choice. For streaming: name the watermark strategy. For serving: explain what's on the read path and what's pre-computed.\n4. **Failure modes (10 min).** What breaks? Late data, hot partitions, schema drift, backfills, region failover. Name the monitoring signal for each. The interviewer will probe; surface it yourself first.\n5. **Trade-offs & next steps (5 min).** Recap what you optimized for. Name what you traded away (consistency? cost? simplicity?). Mention what you'd do next quarter — multi-region, GDPR compliance, cost optimization — to show you see past the 45-minute window.\n\nThe single most common mistake: starting to design before clarifying. You'll draw an expensive real-time system when a nightly batch would have been fine. Two minutes of clarifying questions can save twenty minutes of design rework in a 45-minute interview.",
      keyTakeaway:
        "Clarify before you draw — two minutes of requirements questions saves twenty minutes of design rework in a 45-minute interview.",
    },
    {
      id: "s2",
      title: "Real interview",
      readTimeMinutes: 3,
      content:
        "Click through the 45-minute interview walkthrough below. The prompt is the kind you'll actually get: design real-time analytics for a marketplace, where sellers watch live order, revenue, and inventory dashboards. The walkthrough traces the whole arc — mirroring the prompt back, pinning scale and freshness, back-of-envelope math, sketching the read-path contract first, picking the partition key, the CDC → Kafka → Flink pipeline, the dual-sink storage design, the hot read path, naming the consistency trade-off explicitly, handling a hot seller partition, calling out what's deliberately out of scope, and the operational closing move. Each step pairs the concrete move with the meta-commentary on why it works.",
    },
    {
      id: "s3",
      title: "Senior phrases",
      readTimeMinutes: 2,
      content:
        "These are not magic words. They're the verbal markers of someone who's actually built the systems before. Use them when they're true:\n\n- *\"Before we design this, what does the consumer of the output actually need?\"* — Frames the problem in terms of read patterns, not write patterns.\n- *\"What's the cost of this being one minute late versus one hour late?\"* — Surfaces the freshness SLO instead of assuming it.\n- *\"Let me size this before I pick a tool.\"* — 1B events/day at 1KB each is 12KB/sec average, 120KB/sec peak. That's tiny. Many problems are smaller than they look once you do the math.\n- *\"I'd default to Iceberg + dbt + Airflow unless we have a specific reason not to.\"* — Names a sensible boring default. Boring defaults are senior.\n- *\"The risk here is X. The mitigation is Y. The accepted residual risk is Z.\"* — Trade-off literacy. Also, naming residual risk explicitly is a thing only senior engineers do.\n- *\"I'd want to see a prototype before committing to that.\"* — Refusing to over-design when uncertainty is high.",
    },
    {
      id: "s4",
      title: "Junior phrases",
      readTimeMinutes: 2,
      content:
        "- *\"We'd use Kafka.\"* (without saying why)\n- *\"I'd just use machine learning to handle that.\"*\n- *\"It needs to be exactly-once.\"* (when the sink is an HTTP API)\n- *\"I'd put it all in Snowflake.\"* (when scale is unstated)\n- *\"Let me just draw it.\"* (without clarifying first)\n- *\"That edge case is unlikely.\"* (when asked about a failure mode)\n\nNone of these are wrong, exactly. They're all under-specified — they skip the reasoning step that an IC5 is hired for. The fix is the same in all cases: name the assumption you're making out loud, and explain when you'd revisit it.",
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two IC5-level scenario questions.",
    },
    {
      id: "s6",
      title: "30 things",
      readTimeMinutes: 3,
      content:
        "Quick recall. If any of these isn't immediate, go back to the lesson and re-read.\n\n- **Six layers** — Source → Log → Processing → Storage → Serving → Consumption.\n- **CAP** — During a partition, you pick C or A; P is not optional. \"CA\" means a single point of failure.\n- **PACELC** — In normal operation you pick L or C. Cassandra → PA/EL. Spanner → PC/EC.\n- **Star schema** — A fact table (foreign keys + numeric measures) surrounded by dimension tables holding descriptive context.\n- **SCD Type 2** — Insert a new dim row with valid_from/valid_to instead of overwriting; the surrogate key changes, the natural key stays.\n- **Parquet anatomy** — File → row groups → column chunks → pages; the footer holds schema plus per-column-chunk min/max stats.\n- **Predicate pushdown** — Min/max stats per row group let the engine skip entire groups that can't match the filter.\n- **Dictionary encoding** — Replaces low-cardinality values with integer indices into a dictionary; massive compression on columns like country or status.\n- **Iceberg metadata chain** — catalog → metadata.json → manifest list → manifests → data files.\n- **CoW vs MoR** — Copy-on-write suits read-heavy, infrequent updates; merge-on-read suits write-heavy CDC streams. Hudi defaults to MoR; Iceberg/Delta default to CoW.\n- **Time travel** — Free because old snapshots' files survive until VACUUM; reading \"as of timestamp\" just resolves the snapshot active then.\n- **Partition rule of thumb** — Partition by the dominant filter column, aim for ≥128MB per partition file, avoid high-cardinality keys.\n- **Z-order** — Use it when 2-4 columns are filtered with similar frequency; it interleaves bits so min/max pruning works across all of them.\n- **Small file problem** — Cured by compaction, run periodically, targeting roughly 512MB files.\n- **ELT vs ETL** — ELT won because cheap warehouse compute plus raw kept forever makes bug-fix replay free, and tooling democratized to anyone who knows SQL.\n- **Idempotent** — Three ways: MERGE on key, windowed DELETE+INSERT in a transaction, or INSERT ... ON CONFLICT DO NOTHING with a stable event_id.\n- **Kafka partition** — Caps consumer-group parallelism; N partitions means at most N working consumers, so plan high.\n- **Event time vs processing time** — Almost always use event time; processing-time aggregations look right but produce wrong business answers when sources are delayed.\n- **Watermark** — A promise that you've seen all events with event_time ≤ T; crossing T closes the window for emission.\n- **Window types** — Tumbling (fixed, non-overlapping), hopping (fixed, overlapping), session (gap-based), global (custom trigger).\n- **CDC** — Taps the WAL/binlog/oplog the database already writes, capturing inserts, updates, and deletes — including deletes polling can't see.\n- **Lambda vs Kappa** — Kappa won because one codebase is enough once streaming is robust; \"batch\" is just a replay from offset zero.\n- **Outbox pattern** — Used when an app needs to publish a business event atomically with a DB write: write to an outbox table inside the transaction, then let CDC stream it.\n- **Exactly-once truth** — Really at-least-once delivery plus idempotent processing; the system can't prevent duplicate delivery, only duplicate effect.\n- **Backfill design** — Two checks: the same window run twice produces the same output, and adjacent windows run in parallel match the serial result.\n- **Schema compatibility** — Backward: new schema reads old data. Forward: old schema reads new data. Full: both — the default.\n- **Three SLO numbers** — Freshness (how recent), completeness (any missing rows), accuracy (values right).\n- **Lineage** — Auto-routes alerts to the upstream owner of a problem instead of the downstream consumer, saving 30+ minutes per incident.\n- **dbt test families** — Schema tests (registry-enforced) and constraint tests (declarative SQL) are free — run them on every build.\n- **IC5 default stack** — Iceberg on S3 + Trino/Snowflake + dbt + Airflow + Kafka for streams + Debezium for CDC; deviate only with reason.",
    },
    {
      id: "s7",
      title: "Last move",
      readTimeMinutes: 1,
      content:
        "At the end of the interview, when they ask \"any questions for us?\" — ask \"what's the data quality story like here?\" and \"how do you handle backfills today?\"\n\nYou'll get a real answer that tells you whether you'd actually want the job. And the interviewer will note that you cared about the operational reality, not the architecture diagram.\n\nThat's the whole course. Now go interview.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "The clarification move",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "The prompt is: \"Design a data pipeline for fraud detection.\" Before drawing anything, which three numbers must you extract first?",
        options: [
          "\"Which cloud provider?\" \"Do you use Kafka already?\" \"How big is the team?\"",
          "Writes/sec (transaction volume at peak), reads/sec or latency budget for the fraud decision, and freshness target (realtime inference vs. nightly batch scoring). These define the architecture.",
          "\"Do you want batch or streaming?\" — let them decide the design for you.",
          "\"What's the budget?\" and \"How many engineers do we have?\"",
        ],
        correct: 1,
        explanation:
          "Without the three numbers — writes/sec, reads/sec or decision latency, freshness — every architectural choice is a guess. 100 transactions/sec at \"decisions must be synchronous and <200ms\" forces a very different design than 10,000/sec with \"flag and review within 1 hour.\" The interview budget is 45 minutes; spending 5 extracting requirements saves 20 minutes of designing the wrong thing.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "The hot partition problem",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "Your Kafka topic for orders is partitioned by seller_id. One seller drives 40% of all traffic on Black Friday. What exactly breaks, and what is the IC5 fix?",
        options: [
          "Nothing breaks — Kafka handles it automatically.",
          "That partition's consumer thread becomes the bottleneck. Fix: repartition entirely by order_id for even spread. Downstream, re-key to seller_id before the windowed aggregation.",
          "Kafka will rebalance partitions automatically to spread the load.",
          "Add more brokers and the partition will split.",
        ],
        correct: 1,
        explanation:
          "Kafka partitions are the unit of parallelism — one consumer thread per partition. A hot partition makes that one thread the bottleneck for 40% of your throughput. Kafka does NOT rebalance contents; adding brokers moves the partition but not the skew. The fix is two-level keying: hash on (seller_id, order_id % N) to spread across N×more partitions for throughput, then re-key to seller_id before the aggregation stage. This is the canonical hot-partition pattern and shows up in nearly every IC5 streaming interview.",
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "flash",
        copy: DATA_INFRA_FLASHCARDS_COPY,
        cards: [
          { term: "Six layers", q: "In order", a: "Source → Log → Processing → Storage → Serving → Consumption." },
          { term: "CAP", q: "During a partition…", a: "You pick C or A. P is not optional. \"CA\" means you have a single point of failure." },
          { term: "PACELC", q: "In normal operation…", a: "You pick L or C. Latency vs Consistency. Cassandra → PA/EL. Spanner → PC/EC." },
          { term: "Star schema", q: "What's in the middle?", a: "A fact table — foreign keys + numeric measures. Surrounding dimension tables hold descriptive context." },
          { term: "SCD Type 2", q: "How preserve history?", a: "Insert new dim row with valid_from/valid_to instead of overwriting. Surrogate key changes; natural key stays." },
          { term: "Parquet anatomy", q: "Top-down", a: "File → row groups → column chunks → pages. Footer holds schema + per-column-chunk min/max stats." },
          { term: "Predicate pushdown", q: "How does it skip work?", a: "Min/max stats per row group. Query amount > 1000, row group max amount = 50 → entire group skipped." },
          { term: "Dictionary encoding", q: "What does it do?", a: "Replace low-cardinality values with int indices into a dictionary. Massive compression on string columns like country, status." },
          { term: "Iceberg metadata chain", q: "4 levels", a: "catalog → metadata.json → manifest list → manifests → data files." },
          { term: "CoW vs MoR", q: "When each?", a: "CoW: read-heavy, infrequent updates. MoR: write-heavy CDC streams. Hudi is MoR-default; Iceberg/Delta are CoW-default." },
          { term: "Time travel", q: "How is it free?", a: "Old snapshots' files survive until VACUUM. Reading \"as of timestamp\" just resolves the snapshot active then." },
          { term: "Partition rule of thumb", q: "Pick by what?", a: "The dominant filter column. Aim for ≥128MB per partition file. Avoid high-cardinality keys." },
          { term: "Z-order", q: "When use it?", a: "When 2-4 columns are filtered with similar frequency. Interleaves bits so min/max prunes well across all of them." },
          { term: "Small file problem", q: "Cure?", a: "Compaction. Run periodically; aim for ~512MB target file size." },
          { term: "ELT vs ETL", q: "Why ELT won", a: "Cheap warehouse compute + raw kept forever = bug-fix replay is free. Tooling democratized to anyone with SQL." },
          { term: "Idempotent", q: "Three ways to achieve", a: "MERGE on key; windowed DELETE+INSERT in a tx; INSERT ... ON CONFLICT DO NOTHING with stable event_id." },
          { term: "Kafka partition", q: "What does it cap?", a: "Consumer-group parallelism. N partitions = max N working consumers. Plan high." },
          { term: "Event time vs processing time", q: "Which to use?", a: "Almost always event time. Processing-time aggregations look right but produce wrong business answers when sources are delayed." },
          { term: "Watermark", q: "What does it promise?", a: "\"I think I've seen all events with event_time ≤ T.\" Crossing T closes the window for emission." },
          { term: "Window types", q: "Four kinds", a: "Tumbling (fixed non-overlapping), hopping (fixed overlapping), session (gap-based), global (custom trigger)." },
          { term: "CDC", q: "How does it tap source?", a: "Reads the WAL/binlog/oplog the DB already writes. Captures inserts, updates, deletes — including deletes polling can't see." },
          { term: "Lambda vs Kappa", q: "Why Kappa won", a: "One codebase. Streaming is robust enough to be source of truth; \"batch\" is just replay from offset zero." },
          { term: "Outbox pattern", q: "When?", a: "When app needs to publish a business event atomically with a DB write. Write to outbox table inside the tx; CDC streams it." },
          { term: "Exactly-once truth", q: "What is it really?", a: "At-least-once delivery + idempotent processing. The system can't prevent duplicate delivery, only duplicate effect." },
          { term: "Backfill design", q: "Two checks", a: "(1) Same window run twice = same output. (2) Adjacent windows in parallel = same as serial." },
          { term: "Schema compatibility", q: "Backward / forward / full", a: "Backward: new schema reads old data. Forward: old reads new. Full: both. Default to FULL." },
          { term: "Three SLO numbers", q: "For data?", a: "Freshness (how recent), completeness (any missing rows), accuracy (values right)." },
          { term: "Lineage", q: "Why it's essential", a: "Auto-routes alerts to the upstream owner of a problem, not the downstream consumer. Saves 30+ min per incident." },
          { term: "dbt test families", q: "Which two are free?", a: "Schema tests (registry-enforced) + constraint tests (declarative SQL). Run on every build, no excuse not to." },
          { term: "IC5 default stack", q: "Boring is senior", a: "Iceberg on S3 + Trino/Snowflake + dbt + Airflow + Kafka for streams + Debezium for CDC. Deviate only with reason." },
        ],
      },
    },
  ],
};

export default lesson;

/**
 * The 12-entry interview walkthrough, ported verbatim from source's inline
 * `D.InterviewMove(..., { moves: [...] })` call (lesson 12's own <script>
 * block) — trusted static content, never user input, so `body`/`note` are
 * rendered as raw HTML by the InterviewMove widget (real formatting tags
 * like <b>/<code>/<p> in the source, not sanitizable plain text).
 */
export interface InterviewMoveItem {
  readonly tag: string;
  readonly title: string;
  readonly body: string;
  readonly note: string;
}

export const INTERVIEW_MOVES: readonly InterviewMoveItem[] = [
  {
    tag: "clarify",
    title: "00:00 — Mirror the prompt back",
    body: '<p>Prompt: <em>"Design real-time analytics for a marketplace — sellers see live order/revenue/inventory dashboards."</em></p><p>I say back: <b>"So we need second-fresh dashboards for each seller, scoped to their own data, over an event stream of orders. Tell me if I have the shape right."</b></p>',
    note: "This is not throat-clearing. It anchors the contract and gives the interviewer a chance to correct you cheaply, before any architecture.",
  },
  {
    tag: "scope",
    title: "02:00 — Pin scale and freshness",
    body: '<p>Three numbers I always extract: <b>writes/sec, reads/sec, freshness target</b>.</p><p>"How many orders per second at peak?" → ~10k/s. "How many sellers loading dashboards?" → 50k DAU, ~500 concurrent. "How fresh?" → "feels live" → <b>under 5 seconds</b>.</p>',
    note: "Without these, every later choice is a guess. With them, choices defend themselves.",
  },
  {
    tag: "estimate",
    title: "05:00 — Back-of-envelope the data",
    body: '<p>10k orders/s × 86,400 = ~860M/day. At 1KB each → <b>~860GB/day raw</b>. Compressed Parquet ~10× → ~86GB/day on the lakehouse. 7-day hot tier ≈ 600GB.</p><p>Cache fan-out: 50k sellers × 50KB pre-agg ≈ <b>2.5GB hot in Redis/Druid</b>. Fits in one node.</p>',
    note: "Numbers shift the conversation from vibes to engineering. If you don't do this, the interviewer will ask you to.",
  },
  {
    tag: "api",
    title: "08:00 — Sketch the consumer contract first",
    body: "<p>Two endpoints — and I write them on the board:</p><pre>GET /seller/:id/dashboard   → { revenue_24h, orders_24h, top_skus[10] }\nWS  /seller/:id/stream      → { event: 'order', ts, amount, sku }</pre><p>Dashboard load is one cache hit. Live updates push deltas. <b>No SQL on the read path.</b></p>",
    note: "Designing the consumer's shape first prevents the classic mistake of building beautiful infra that nobody can use.",
  },
  {
    tag: "data model",
    title: "12:00 — Pick the event shape",
    body: "<p>One canonical event: <code>order_placed</code>. Fields: <code>order_id, seller_id, ts_event, amount_cents, sku, currency, schema_version</code>.</p><p>Partition key = <b>seller_id</b> — every downstream thing scales with sellers, so co-locate by seller from the source.</p>",
    note: "The partition key is the most consequential decision. Get it wrong and you re-shuffle for the rest of the design.",
  },
  {
    tag: "streaming",
    title: "17:00 — The pipeline · CDC → Kafka → Flink",
    body: "<p>Postgres orders table is source of truth. <b>Debezium CDC</b> → Kafka topic <code>orders.cdc</code> (partitioned by seller_id, 64 partitions). <b>Flink</b> reads, applies upserts, computes 1-minute tumbling windows per seller.</p><p>Watermark = max(event_ts) − 30s. Late events past 30s go to a side output.</p>",
    note: 'Saying "Flink" without saying "watermark" is a tell. Watermarks are the one thing you must pronounce correctly.',
  },
  {
    tag: "storage",
    title: "22:00 — Two sinks, one source",
    body: "<p>Flink writes <b>two places</b>:<br>1. <b>Iceberg</b> <code>fact_orders</code> on S3 — partitioned by <code>day, seller_id_bucket</code>. This is the durable lakehouse layer for ad-hoc/BI.<br>2. <b>Druid</b> rollups — pre-aggregated <code>(seller_id, minute) → revenue, orders, top_skus</code>. This is the dashboard read path.</p>",
    note: "One pipeline, two materializations. Don't make the analyst query Druid; don't make the dashboard query Iceberg.",
  },
  {
    tag: "serving",
    title: "27:00 — The hot read path",
    body: "<p>Dashboard endpoint hits <b>Druid</b> directly: <code>SELECT sum(revenue) WHERE seller_id=? AND minute &gt;= now()-1d</code>. Druid sub-second on rollups.</p><p>WebSocket stream subscribes to a <b>Kafka consumer group per seller-shard</b>, filters server-side, fans out via a thin gateway. <b>No DB on the websocket path.</b></p>",
    note: "Live = stream from the bus. Aggregates = serve from the rollup store. Never confuse the two.",
  },
  {
    tag: "tradeoff",
    title: "32:00 — Call the consistency model",
    body: '<p>This is <b>PA/EL under PACELC</b>: during a partition we stay available and accept stale reads; in normal operation we optimize latency over linearizability.</p><p>The seller seeing "$1,247 revenue" might be 4 seconds behind truth. <b>That is acceptable</b> for this product. I\'d call this out to the interviewer explicitly.</p>',
    note: "Naming the consistency model is a senior signal. Most candidates handwave it.",
  },
  {
    tag: "scale",
    title: "37:00 — Hot sellers and skew",
    body: "<p>One seller (Black Friday top brand) takes 30% of traffic → its Kafka partition melts.</p><p>Fix: <b>two-level keying</b>. Hash <code>(seller_id, order_id % 4)</code> for the bus to spread, then re-key to seller_id before the windowed aggregation. Pre-aggregate per sub-key, then merge.</p>",
    note: "Skew handling is the #1 follow-up at IC5. Have an answer ready before they ask.",
  },
  {
    tag: "tradeoff",
    title: "40:00 — What I'm NOT building",
    body: '<p>Out of scope, called out: multi-region failover, GDPR right-to-delete on the stream, fraud detection, A/B exposure of dashboard variants, mobile push.</p><p>"If we had another 30 minutes I\'d sketch the multi-region story — async replication of Iceberg + Kafka MirrorMaker, with <b>region-local serving</b>."</p>',
    note: "Showing what you cut is as important as what you build. It proves you saw the whole space.",
  },
  {
    tag: "follow-up",
    title: "43:00 — The closing move",
    body: '<p>"The thing I\'d watch in production: the <b>watermark lag</b> on Flink. If event-time falls behind processing-time by more than 60s, dashboards silently go stale even though Druid is healthy. I\'d page on that, not on raw Kafka lag."</p><p>This is the move that wins the loop.</p>',
    note: "End on the operational story. The interviewer is now picturing you on call. That's the hire signal.",
  },
];
