// Ported from data-infrastructure/lessons/12-interview-playbook.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("interview-playbook");

const lesson: DataInfraLesson = {
  id: "interview-playbook",
  number: 12,
  title: "System design review",
  subtitle: "A seller analytics scenario with stated assumptions",
  durationMinutes: 20,
  trackId: "scale",
  hook: "Turn an open prompt into a reviewable system design.",
  keyConcepts: [
    "Review structure",
    "Back-of-envelope estimation",
    "Trade-off analysis",
    "Skew handling",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "A bounded review loop",
      readTimeMinutes: 3,
      content:
        "Work through this loop and spend the most time where the prompt holds the most uncertainty and risk.\n\n1. **Clarify.** Consumers, decisions, peak write and read demand, freshness, correctness, privacy, retention, availability and cost. Write down the assumptions that stay open.\n2. **Frame.** Draw only the boundaries the request involves. Name the main risks and define the read-path contract before you pick products.\n3. **Estimate and design.** Calculate order-of-magnitude throughput, storage and concurrency, then choose partitioning, processing, storage and serving from them.\n4. **Test failure modes.** Late and duplicate data, skew, schema changes, backfills, dependency loss, access isolation and recovery. Pair every risk with detection and recovery evidence.\n5. **Review trade-offs.** State what the design optimizes, what it does not guarantee and which decisions still need a benchmark or prototype.",
    },
    {
      id: "s2",
      title: "About the scenario",
      readTimeMinutes: 1,
      content:
        "The walkthrough above uses a hypothetical marketplace where sellers view order and revenue aggregates. Its traffic, size, lateness and freshness values are exercise inputs, not benchmarks or defaults. A production decision on the named products still needs compatibility checks, security review, cost modeling and representative load tests.",
    },
    {
      id: "s3",
      title: "Precise review language",
      readTimeMinutes: 2,
      content:
        '- *"What decision does the consumer make from this output, and how stale may it be?"* defines the read contract.\n- *"Is freshness measured from event creation, source commit or ingestion?"* prevents an ambiguous SLI.\n- *"Let me estimate before I pick a component."* One billion 1 KB events are about 1 TB per day and 11.6 MB/s on average, before replication, encoding, indexes and protocol overhead. Peak demand needs its own assumption.\n- *"This component is a candidate because it meets these requirements; I would verify connector semantics and benchmark this path."* separates hypothesis from proof.\n- *"The risk is X, the mitigation is Y, and Z remains unmitigated."* makes residual risk reviewable.\n- *"This guarantee holds only between these boundaries."* keeps a local processing guarantee from becoming an end-to-end claim.',
    },
    {
      id: "s4",
      title: "Under-specified language",
      readTimeMinutes: 2,
      content:
        '- *"We would use Kafka."* Which requirement needs a durable partitioned log?\n- *"Machine learning will detect it."* What signal, training data, error cost and fallback are available?\n- *"It must be exactly-once."* Which state transition and sink boundary must avoid duplicate effects?\n- *"Put everything in one warehouse."* What workload, isolation and recovery requirements support that?\n- *"That failure is unlikely."* What evidence supports the probability, and what is the impact?\n\nEach skips a decision boundary. Repair it by naming the requirement, assumption, evidence and the condition that would change the design.',
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on requirement discovery and skew handling.",
    },
    {
      id: "s6",
      title: "Course review",
      readTimeMinutes: 1,
      content:
        "The 30 flashcards at the end of this lesson review the course's core concepts. Test each card against a workload you know.",
    },
    {
      id: "s7",
      title: "Operational close",
      readTimeMinutes: 1,
      content:
        "End the review with the open operating questions: who owns data-quality incidents, how backfills get authorized and isolated, which recovery objectives were exercised and which guarantees are measured in production.",
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
          'The prompt is: "Design a data pipeline for fraud detection." Which three numbers do you pin down before drawing anything?',
        options: [
          '"Which cloud provider?" "Do you use Kafka already?" "How big is the team?"',
          "Peak writes/sec, reads/sec or decision latency budget, and freshness target (real-time vs. nightly scoring).",
          'Ask "Batch or streaming?" and let them pick the design.',
          '"What\'s the budget?" and "How many engineers do we have?"',
        ],
        correct: 1,
        explanation:
          "Peak writes, decision latency and freshness constrain the architecture. Correctness, privacy, retention, availability and recovery requirements still have to be stated before the design is accepted.",
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
          "Your Kafka topic for orders is partitioned by seller_id. One seller drives 40% of all traffic on Black Friday. What breaks, and how do you fix it?",
        options: [
          "Nothing breaks; Kafka handles it automatically.",
          "That partition bottlenecks; sub-key by (seller_id, bucket), then merge per seller.",
          "Kafka will rebalance partitions automatically to spread the load.",
          "Add more brokers and the partition will split.",
        ],
        correct: 1,
        explanation:
          "One consumer per group reads a partition, so the hot one caps throughput. Sub-keys spread the work but add an aggregation stage and change ordering. Size buckets from measured skew and capacity, then test recovery.",
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "flash",
        title: "Flashcards",
        copy: DATA_INFRA_FLASHCARDS_COPY,
        cards: [
          {
            term: "Six layers",
            q: "In order",
            a: "Source → Log → Processing → Storage → Serving → Consumption. Drop layers a workload does not need.",
          },
          {
            term: "CAP",
            q: "During a partition…",
            a: "A distributed register cannot guarantee both linearizable responses and an answer from every non-failing node. State the model and the boundary.",
          },
          {
            term: "PACELC",
            q: "In normal operation…",
            a: "Latency and consistency trade-offs outside partitions. Classify one operation, never a whole vendor product.",
          },
          {
            term: "Star schema",
            q: "What's in the middle?",
            a: "A fact table at a declared grain, with foreign keys and numeric measures. Dimension tables add descriptive context.",
          },
          {
            term: "SCD Type 2",
            q: "How preserve history?",
            a: "A new dim row with valid_from/valid_to instead of an overwrite. Surrogate key changes; natural key stays.",
          },
          {
            term: "Parquet anatomy",
            q: "Top-down",
            a: "File → row groups → column chunks → pages. Footer holds schema + per-column-chunk min/max stats.",
          },
          {
            term: "Predicate pushdown",
            q: "How does it skip work?",
            a: "Min/max stats per row group. Query amount > 1000, row group max amount = 50 → entire group skipped, if predicate, metadata and writer layout allow it.",
          },
          {
            term: "Dictionary encoding",
            q: "What does it do?",
            a: "Replaces repeated values with dictionary references when the writer decides it pays off.",
          },
          {
            term: "Iceberg metadata chain",
            q: "Five stages",
            a: "catalog → metadata.json → manifest list → manifests → data files. Details vary by format version.",
          },
          {
            term: "CoW vs MoR",
            q: "When each?",
            a: "Copy-on-write pays at update time, merge-on-read at read time. Engine support, workload and maintenance decide.",
          },
          {
            term: "Time travel",
            q: "What enables it?",
            a: "Retained snapshots and referenced files. They cost storage and need privacy, retention and access rules.",
          },
          {
            term: "Partitioning",
            q: "Pick by what?",
            a: "Measured filters, data distribution, update patterns and engine behavior. Validate file sizes and pruning with representative data.",
          },
          {
            term: "Clustering",
            q: "When use it?",
            a: "When locality for selected predicates justifies the rewrite and ingestion cost, shown by query evidence.",
          },
          {
            term: "Small file problem",
            q: "Response?",
            a: "Measure planning and metadata overhead, then set compaction and file-size targets for the engine and workload.",
          },
          {
            term: "ELT vs ETL",
            q: "How to choose",
            a: "Place transformations where governance, latency, replay, security and compute constraints support them.",
          },
          {
            term: "Idempotent",
            q: "What must hold?",
            a: "Repeating a defined operation adds no effect. MERGE or conflict handling needs stable keys, deterministic logic and correct transaction semantics.",
          },
          {
            term: "Kafka partition",
            q: "What does it bound?",
            a: "Active consumer parallelism in a group; order holds only inside a partition. Size the count from capacity and ordering needs.",
          },
          {
            term: "Event time vs processing time",
            q: "Which to use?",
            a: "The clock that answers the business question. Event time suits source-time windows; processing time suits questions about arrival and operations.",
          },
          {
            term: "Watermark",
            q: "What does it represent?",
            a: "A progress policy for emitting or revising event-time results. It does not prove all earlier events arrived.",
          },
          {
            term: "Window types",
            q: "Four kinds",
            a: "Tumbling (fixed non-overlapping), hopping (fixed overlapping), session (gap-based), global (custom trigger). Each has its own state cost.",
          },
          {
            term: "CDC",
            q: "What does it read?",
            a: "Database change records. What arrives depends on the connector, snapshots, source-log retention, ordering and source load.",
          },
          {
            term: "Batch vs streaming",
            q: "Which architecture wins?",
            a: "Neither wins everywhere. Compare latency, replay, correctness, operating complexity and recovery.",
          },
          {
            term: "Outbox pattern",
            q: "When?",
            a: "When state and an intent-to-publish row must commit together. Publication and sink effects still need delivery handling.",
          },
          {
            term: "Processing guarantees",
            q: "How to state them",
            a: "Name replay, processor state and sink commit separately. Avoiding end-to-end duplicate effects needs every boundary to cooperate.",
          },
          {
            term: "Backfill design",
            q: "What must be controlled?",
            a: "Pin inputs and code, coordinate live writes, make replacement deterministic, and define validation plus rollback.",
          },
          {
            term: "Schema compatibility",
            q: "Backward / forward / full",
            a: "Compatibility is defined between reader and writer versions. Pick the policy from deployment order and consumer needs.",
          },
          {
            term: "Three SLO numbers",
            q: "For data?",
            a: "Freshness (how recent), completeness (missing rows), accuracy (right values), each with its own SLI, target, owner and response.",
          },
          {
            term: "Lineage",
            q: "What does it provide?",
            a: "Dependency evidence for impact analysis and triage. Coverage and causality still need verification.",
          },
          {
            term: "Data test families",
            q: "How do they differ?",
            a: "Schema, constraint, anomaly and reconciliation checks cover different risks at different execution costs.",
          },
          {
            term: "Stack selection",
            q: "What drives it?",
            a: "Workload, team, security, interoperability, recovery and cost evidence. There is no course-wide default stack.",
          },
        ],
      },
    },
  ],
};

export default lesson;

/** A fixed, hypothetical review exercise. Values are inputs, not benchmarks. */
export interface InterviewMoveItem {
  readonly tag: string;
  readonly title: string;
  readonly body: string;
  readonly note: string;
}

export const INTERVIEW_MOVES: readonly InterviewMoveItem[] = [
  {
    tag: "clarify",
    title: "Restate the problem without adding requirements",
    body: '<p>The prompt reads <em>"Design analytics for a marketplace where sellers view order and revenue dashboards."</em></p><p>Restate it as <b>"The system publishes seller-scoped aggregates from order changes. Freshness, traffic, retention, authorization and consistency are still open."</b></p>',
    note: "This keeps a vague dashboard from quietly becoming a real-time system.",
  },
  {
    tag: "scope",
    title: "Record the exercise assumptions",
    body: "<p>Assume <b>10,000 order changes per second at peak</b>, <b>500 concurrent dashboard sessions</b> and a target to publish accepted events within <b>5 seconds for 99% of events over a rolling hour</b>.</p><p>Also require seller-level authorization, seven years of aggregate retention, 30 days of replayable raw changes and a documented degraded mode.</p>",
    note: "Real reviews take these from product, legal, security and workload evidence.",
  },
  {
    tag: "estimate",
    title: "Estimate before selecting capacity",
    body: "<p>If the peak lasted a full day: 10,000 × 86,400 = <b>864 million changes per day</b>, or <b>864 GB per day</b> at an illustrative 1 KB payload, before replication, indexes, encoding and protocol overhead.</p><p>Measure compression ratio, peak duration, aggregate size and cache residency with representative data before sizing nodes or spend.</p>",
    note: "The arithmetic bounds the problem. Distribution, overhead, failures and benchmarks still need measuring.",
  },
  {
    tag: "api",
    title: "Define the consumer contract",
    body: "<p>Two provisional interfaces:</p><pre>GET /sellers/:id/dashboard  → { as_of, revenue_24h, orders_24h }\nWS  /sellers/:id/updates    → { event_id, occurred_at, aggregate_delta }</pre><p>Both take the seller identity from the authenticated principal, enforce tenant scope server-side and return the data timestamp. Add a cache or query store only after measuring.</p>",
    note: "Freshness and authorization are in the contract; storage stays open.",
  },
  {
    tag: "data model",
    title: "Define event identity and ordering",
    body: "<p>Use an immutable change envelope with <code>event_id, order_id, seller_id, operation, source_commit_position, occurred_at, amount_minor, currency, schema_version</code>.</p><p><code>seller_id</code> keys seller-scoped aggregation. Measure its skew and per-order ordering, since no single key fits every downstream operation.</p>",
    note: "Stable identity enables deduplication; the partition key sets ordering and skew boundaries.",
  },
  {
    tag: "streaming",
    title: "Propose a processing path",
    body: "<p>Candidate path: PostgreSQL change capture → Kafka → a stateful stream processor that applies version-aware changes and publishes aggregate updates. Size partitions from measured throughput, recovery time and ordering needs.</p><p>Set watermark and allowed lateness from observed delays and correction needs. Route invalid or unprocessable records to a restricted, retention-bounded review path.</p>",
    note: "Connector snapshots, source-log retention, replay, processor checkpoints and sink commits are separate boundaries. Test each.",
  },
  {
    tag: "storage",
    title: "Separate history from serving",
    body: "<p>Keep a durable history table for replay and analysis plus a seller-scoped serving view for the dashboard. Iceberg and Druid are candidates here, not requirements.</p><p>Define how both sinks identify attempts, handle retries, expose their committed version and reconcile. A write to one does not make the other atomic.</p>",
    note: "Two materializations isolate workloads and add divergence and recovery work.",
  },
  {
    tag: "serving",
    title: "Protect the read and push paths",
    body: "<p>The API reads a pre-aggregated seller view and returns its <code>as_of</code>. Cache only after defining invalidation, tenant-safe keys and acceptable staleness.</p><p>The push gateway authorizes each subscription, bounds buffers and rates, handles slow clients and revokes access on session change. It reads one shared stream instead of one broker consumer group per seller.</p>",
    note: "A latency claim needs a representative load test with authorization, fan-out, skew and failures.",
  },
  {
    tag: "tradeoff",
    title: "State the consistency boundary",
    body: "<p>The dashboard serves the latest committed aggregate in the serving store and shows its data timestamp. It promises no linearizable reads against the order database.</p><p>During an outage or partition, product must choose: a stale response with a visible timestamp, explicit unavailability or a degraded summary.</p>",
    note: "Describe observable behavior for one read and one failure instead of a product-wide consistency label.",
  },
  {
    tag: "scale",
    title: "Handle measured key skew",
    body: "<p>Assume one seller drives 40% of peak traffic, beyond one partition consumer's tested capacity.</p><p>Key by <code>(seller_id, bucket)</code>, pre-aggregate per bucket, then merge by seller. Derive the bucket count from capacity evidence and document the changed ordering, state and recovery costs.</p>",
    note: "More brokers can move a hot partition. They do not split its records.",
  },
  {
    tag: "tradeoff",
    title: "Record exclusions and residual risk",
    body: "<p>Out of scope here: multi-region recovery, privacy deletion across retained logs and snapshots, fraud decisions and mobile delivery.</p><p>Each exclusion goes into the risk register with an owner and a decision date. No replication product counts as recovery until failover, ordering, data loss and restoration have been exercised.</p>",
    note: "Listing exclusions shows reviewers where the design stops.",
  },
  {
    tag: "follow-up",
    title: "Close with operational evidence",
    body: "<p>Monitor end-to-end publication delay, source-to-sink completeness, invalid-record volume, partition skew, checkpoint and sink-commit failures, reconciliation differences and serving-store data age.</p><p>Page on a user-impacting SLO and use component metrics for diagnosis. Write runbooks for replay, partial sink success, access incidents and backfill rollback.</p>",
    note: "Give each guarantee a measurement, an owner and a recovery procedure.",
  },
];
