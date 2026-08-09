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
  title: "System Design Review",
  subtitle: "A seller analytics scenario with explicit assumptions",
  durationMinutes: 20,
  trackId: "scale",
  hook: "Turn an ambiguous prompt into a reviewable design with estimates, failure boundaries, and stated trade-offs.",
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
        "A design review needs structure, but the order and time allocation depend on the prompt. Use this loop and spend more time where uncertainty or risk is highest:\n\n1. **Clarify.** Identify consumers, decisions, peak write and read demand, freshness, correctness, privacy, retention, availability, and cost constraints. Record assumptions that remain unresolved.\n2. **Frame.** Draw only the boundaries involved in the request. State the dominant risks and define the read-path contract before choosing products.\n3. **Estimate and design.** Calculate order-of-magnitude throughput, storage, and concurrency. Select partitioning, processing, storage, and serving mechanisms from those requirements.\n4. **Test failure modes.** Examine late and duplicate data, skew, schema changes, backfills, dependency loss, access isolation, and recovery. Pair each risk with detection and recovery evidence.\n5. **Review trade-offs.** Restate what the design optimizes, what it does not guarantee, and which decisions require a benchmark or prototype.\n\nClarification prevents a low-frequency reporting need from being turned into an unnecessary streaming system. Estimates prevent product selection from preceding the workload.",
      keyTakeaway:
        "Clarify the consumer contract and quantify the workload before selecting components.",
    },
    {
      id: "s2",
      title: "Worked scenario",
      readTimeMinutes: 3,
      content:
        "The interactive walkthrough uses a hypothetical marketplace in which sellers view order and revenue aggregates. All traffic, size, lateness, and freshness values are exercise inputs, not benchmark results or recommended defaults. The design uses named products to make trade-offs concrete; a production decision still requires current compatibility checks, security review, cost modeling, and representative load tests.",
    },
    {
      id: "s3",
      title: "Precise review language",
      readTimeMinutes: 2,
      content:
        'Use language that exposes assumptions and evidence:\n\n- *"What decision does the consumer make from this output, and how stale may it be?"* defines the read contract.\n- *"Is the freshness target measured from event creation, source commit, or ingestion?"* prevents an ambiguous SLI.\n- *"Let me estimate before selecting a component."* One billion 1 KB events represent about 1 TB per day and 11.6 MB/s on average before replication, encoding, indexes, and protocol overhead. Peak demand needs a separate assumption.\n- *"This component is a candidate because it meets these requirements; I would verify connector semantics and benchmark this path."* separates a design hypothesis from proof.\n- *"The risk is X, the mitigation is Y, and Z remains unmitigated."* makes residual risk reviewable.\n- *"This guarantee holds only between these boundaries."* prevents local processing semantics from becoming an end-to-end claim.',
    },
    {
      id: "s4",
      title: "Under-specified language",
      readTimeMinutes: 2,
      content:
        '- *"We would use Kafka."* Which requirement needs a durable partitioned log?\n- *"Machine learning will detect it."* What signal, training data, error cost, and fallback are available?\n- *"It must be exactly-once."* Which state transition and sink boundary must avoid duplicate effects?\n- *"Put everything in one warehouse."* What workload, isolation, and recovery requirements support that choice?\n- *"That failure is unlikely."* What evidence supports the probability, and what is its impact?\n\nEach statement skips a decision boundary. Repair it by naming the requirement, assumption, evidence, and condition that would change the design.',
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
      readTimeMinutes: 3,
      content:
        "Use these statements as review prompts, not universal rules.\n\n- **Reference layers**, Source → Log → Processing → Storage → Serving → Consumption is one way to locate boundaries; omit layers the workload does not need.\n- **CAP**, Under a network partition, a distributed register cannot provide both linearizable responses and a response from every non-failing node. State the model and failure boundary.\n- **PACELC**, Extends the discussion to normal-operation latency and consistency trade-offs; classify a concrete operation, not a vendor as a whole.\n- **Star schema**, A fact table records events or measurements at a declared grain; dimensions provide descriptive context.\n- **SCD Type 2**, Preserves selected attribute history by adding validity-bounded dimension rows. Surrogate-key behavior depends on the model.\n- **Parquet anatomy**, A file contains row groups, column chunks, and pages; metadata can support selective reads.\n- **Predicate pruning**, Statistics can skip regions only when the predicate, metadata, and writer layout make that safe.\n- **Dictionary encoding**, Replaces repeated values with dictionary references when the writer decides the encoding is useful.\n- **Table metadata**, A table format coordinates snapshots and files through catalog and metadata structures whose details vary by format and version.\n- **Copy-on-write and merge-on-read**, Different update/read trade-offs whose cost depends on engine support, workload, and maintenance.\n- **Time travel**, Retained snapshots enable historical reads while consuming storage and requiring explicit retention and access policy.\n- **Partitioning**, Choose transforms from measured filters, file distribution, update patterns, and engine behavior; validate resulting file sizes.\n- **Clustering**, Can improve data skipping for selected predicates, with rewrite and ingestion cost.\n- **Small files**, Increase metadata and planning overhead; compaction policy should follow observed workload and write behavior.\n- **ETL and ELT**, Place transformations where security, governance, latency, replay, and compute constraints support them.\n- **Idempotence**, Repeating a defined operation has no additional effect; `MERGE` or conflict handling achieves this only with stable keys and correct transaction semantics.\n- **Kafka partitions**, Bound active consumer parallelism within a consumer group for a topic and preserve order only inside a partition. Capacity and ordering drive the count.\n- **Event and processing time**, Choose the clock that matches the business question; some operational use cases intentionally use processing time.\n- **Watermark**, A progress policy used to decide when event-time results may be emitted or revised; it is not proof that all earlier events arrived.\n- **Windows**, Tumbling, hopping, session, and custom windows encode different grouping rules and state costs.\n- **CDC**, Reads database change records subject to connector, source, snapshot, retention, and ordering behavior. It imposes source and operational cost.\n- **Batch and streaming architectures**, One or multiple processing paths can be valid; compare correctness, replay, latency, and operating complexity.\n- **Outbox pattern**, Commits an application state change and an outbox row together, then publishes separately. Delivery and sink effects still need handling.\n- **Processing guarantees**, State source replay, processor state, and sink commit guarantees separately. End-to-end duplicate effects require cooperation across every boundary.\n- **Backfills**, Pin input and code versions, isolate or coordinate live writes, make output replacement deterministic, and define validation and rollback.\n- **Schema compatibility**, Backward, forward, and full compatibility are defined relative to reader and writer versions; the appropriate policy depends on deployment order.\n- **Data reliability**, Freshness, completeness, and accuracy need workload-specific SLIs, targets, owners, and responses.\n- **Lineage**, Provides dependency evidence for impact analysis and triage; coverage and causality must be verified.\n- **Data tests**, Schema, constraint, anomaly, and reconciliation checks have different coverage and execution cost.\n- **Stack selection**, Choose components from workload, team, security, interoperability, recovery, and cost evidence. There is no course-wide default stack.",
    },
    {
      id: "s7",
      title: "Operational close",
      readTimeMinutes: 1,
      content:
        "Close the review with the unresolved operating questions: who owns data-quality incidents, how backfills are authorized and isolated, which recovery objectives have been exercised, and which guarantees are measured in production.\n\nA design is incomplete until its ownership, evidence, failure response, and residual risks are explicit.",
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
          'The prompt is: "Design a data pipeline for fraud detection." Before drawing anything, which three numbers must you extract first?',
        options: [
          '"Which cloud provider?" "Do you use Kafka already?" "How big is the team?"',
          "Writes/sec (transaction volume at peak), reads/sec or latency budget for the fraud decision, and freshness target (realtime inference vs. nightly batch scoring). These define the architecture.",
          '"Do you want batch or streaming?", let them decide the design for you.',
          '"What\'s the budget?" and "How many engineers do we have?"',
        ],
        correct: 1,
        explanation:
          "Peak write demand, read or decision latency, and freshness constrain the architecture. They are not sufficient by themselves: correctness, privacy, retention, availability, and recovery requirements also need to be stated before the design is accepted.",
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
          "Nothing breaks, Kafka handles it automatically.",
          "That partition becomes the bottleneck. Use a controlled sub-key such as (seller_id, bucket) to spread the hot seller, pre-aggregate per bucket, then re-key to seller_id for the final aggregation.",
          "Kafka will rebalance partitions automatically to spread the load.",
          "Add more brokers and the partition will split.",
        ],
        correct: 1,
        explanation:
          "A consumer group cannot process one partition with multiple active consumers at once, so skew can limit throughput even when other partitions are idle. A controlled sub-key spreads work but adds a second aggregation stage and changes ordering. Select the bucket count from measured skew and capacity, then test recovery and re-keying behavior.",
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
            a: "Source → Log → Processing → Storage → Serving → Consumption.",
          },
          {
            term: "CAP",
            q: "During a partition…",
            a: "For a defined distributed register, linearizable responses and a response from every non-failing node cannot both be guaranteed. State the model and boundary.",
          },
          {
            term: "PACELC",
            q: "In normal operation…",
            a: "It highlights latency and consistency trade-offs outside partitions. Classify a concrete operation, not an entire vendor product.",
          },
          {
            term: "Star schema",
            q: "What's in the middle?",
            a: "A fact table, foreign keys + numeric measures. Surrounding dimension tables hold descriptive context.",
          },
          {
            term: "SCD Type 2",
            q: "How preserve history?",
            a: "Insert new dim row with valid_from/valid_to instead of overwriting. Surrogate key changes; natural key stays.",
          },
          {
            term: "Parquet anatomy",
            q: "Top-down",
            a: "File → row groups → column chunks → pages. Footer holds schema + per-column-chunk min/max stats.",
          },
          {
            term: "Predicate pushdown",
            q: "How does it skip work?",
            a: "Min/max stats per row group. Query amount > 1000, row group max amount = 50 → entire group skipped.",
          },
          {
            term: "Dictionary encoding",
            q: "What does it do?",
            a: "Replaces repeated values with dictionary references when the writer determines the encoding is useful.",
          },
          {
            term: "Iceberg metadata chain",
            q: "4 levels",
            a: "catalog → metadata.json → manifest list → manifests → data files.",
          },
          {
            term: "CoW vs MoR",
            q: "When each?",
            a: "They trade update work against read-time merging. Engine support, workload, and maintenance determine the result.",
          },
          {
            term: "Time travel",
            q: "What enables it?",
            a: "Retained snapshots and referenced files enable historical reads, with storage, privacy, and retention consequences.",
          },
          {
            term: "Partitioning",
            q: "Pick by what?",
            a: "Measured filters, data distribution, update patterns, and engine behavior. Validate file sizes and pruning with representative data.",
          },
          {
            term: "Clustering",
            q: "When use it?",
            a: "When selected predicates benefit enough from locality to justify rewrite and ingestion cost. Verify with query evidence.",
          },
          {
            term: "Small file problem",
            q: "Response?",
            a: "Measure planning and metadata overhead, then set compaction policy and file targets for the actual engine and workload.",
          },
          {
            term: "ELT vs ETL",
            q: "How to choose",
            a: "Place transformations where governance, latency, replay, security, and compute constraints support them.",
          },
          {
            term: "Idempotent",
            q: "What must hold?",
            a: "Repeating a defined operation has no additional effect. Stable keys, deterministic logic, and correct transaction semantics are required.",
          },
          {
            term: "Kafka partition",
            q: "What does it bound?",
            a: "Active consumer parallelism within a group and the scope of ordering. Choose counts from capacity and ordering needs.",
          },
          {
            term: "Event time vs processing time",
            q: "Which to use?",
            a: "Use the clock that answers the business question. Event time handles source-time windows; processing time can fit operational arrival-time questions.",
          },
          {
            term: "Watermark",
            q: "What does it represent?",
            a: "A progress policy used to emit or revise event-time results. It is not proof that all earlier events arrived.",
          },
          {
            term: "Window types",
            q: "Four kinds",
            a: "Tumbling (fixed non-overlapping), hopping (fixed overlapping), session (gap-based), global (custom trigger).",
          },
          {
            term: "CDC",
            q: "What does it read?",
            a: "Database change records, subject to connector, snapshot, source-log retention, ordering, and source-load behavior.",
          },
          {
            term: "Batch vs streaming",
            q: "Which architecture wins?",
            a: "Neither universally. Compare latency, replay, correctness, operating complexity, and recovery requirements.",
          },
          {
            term: "Outbox pattern",
            q: "When?",
            a: "When an application must commit state and an intent-to-publish row together. Publication and sink effects still need delivery handling.",
          },
          {
            term: "Processing guarantees",
            q: "How to state them",
            a: "Describe replay, processor state, and sink commit boundaries separately. End-to-end duplicate effects require cooperation across all of them.",
          },
          {
            term: "Backfill design",
            q: "What must be controlled?",
            a: "Pin inputs and code, coordinate live writes, make replacement deterministic, and define validation plus rollback.",
          },
          {
            term: "Schema compatibility",
            q: "Backward / forward / full",
            a: "Define compatibility relative to reader and writer versions. Select policy from deployment order and consumer needs.",
          },
          {
            term: "Three SLO numbers",
            q: "For data?",
            a: "Freshness (how recent), completeness (any missing rows), accuracy (values right).",
          },
          {
            term: "Lineage",
            q: "What does it provide?",
            a: "Dependency evidence for impact analysis and triage. Coverage and causality still require verification.",
          },
          {
            term: "Data test families",
            q: "How do they differ?",
            a: "Schema, constraint, anomaly, and reconciliation checks cover different risks and have different execution costs.",
          },
          {
            term: "Stack selection",
            q: "What drives it?",
            a: "Workload, team, security, interoperability, recovery, and cost evidence. There is no course-wide default stack.",
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
    body: '<p>Prompt: <em>"Design analytics for a marketplace where sellers view order and revenue dashboards."</em></p><p>Restatement: <b>"The system publishes seller-scoped aggregates from order changes. Freshness, traffic, retention, authorization, and consistency are still open requirements."</b></p>',
    note: "A neutral restatement confirms scope without silently turning an unspecified dashboard into a real-time system.",
  },
  {
    tag: "scope",
    title: "Record the exercise assumptions",
    body: "<p>Assume <b>10,000 order changes per second at peak</b>, <b>500 concurrent dashboard sessions</b>, and a product target to publish accepted events within <b>5 seconds for 99% of events over a rolling hour</b>.</p><p>Also require seller-level authorization, seven years of aggregate retention, replayable raw changes for 30 days, and a documented degraded mode.</p>",
    note: "These are scenario inputs. A real review obtains them from product, legal, security, and workload evidence.",
  },
  {
    tag: "estimate",
    title: "Estimate before selecting capacity",
    body: "<p>At the assumed peak sustained for a full day: 10,000 × 86,400 = <b>864 million changes per day</b>. At an illustrative 1 KB payload, that is <b>864 GB per day</b> before replication, indexes, encoding, and protocol overhead.</p><p>Compression ratio, peak duration, aggregate size, and cache residency remain unknown. Measure them with representative data before sizing nodes or spend.</p>",
    note: "Arithmetic bounds the problem. It does not replace distribution, overhead, failure, and benchmark measurements.",
  },
  {
    tag: "api",
    title: "Define the consumer contract",
    body: "<p>Start with two provisional interfaces:</p><pre>GET /sellers/:id/dashboard  → { as_of, revenue_24h, orders_24h }\nWS  /sellers/:id/updates    → { event_id, occurred_at, aggregate_delta }</pre><p>Both derive the seller identity from the authenticated principal, enforce tenant scope server-side, and return the data timestamp. The implementation may use a cache or query store after measurement.</p>",
    note: "The contract exposes freshness and authorization. Storage remains an implementation decision.",
  },
  {
    tag: "data model",
    title: "Define event identity and ordering",
    body: "<p>Use an immutable change envelope with <code>event_id, order_id, seller_id, operation, source_commit_position, occurred_at, amount_minor, currency, schema_version</code>.</p><p><code>seller_id</code> supports seller-scoped aggregation, but its skew and per-order ordering behavior must be measured. Do not assume one key satisfies every downstream operation.</p>",
    note: "Stable identity supports deduplication; the partition key defines ordering and skew boundaries.",
  },
  {
    tag: "streaming",
    title: "Propose a processing path",
    body: "<p>A candidate path is PostgreSQL change capture → Kafka → a stateful stream processor. Partition count comes from measured throughput, recovery time, and ordering constraints. The processor applies version-aware changes and publishes aggregate updates.</p><p>Choose watermark and allowed-lateness policy from the observed delay distribution and correction requirements. Route invalid or unprocessable records to a restricted, retention-bounded review path.</p>",
    note: "Connector snapshots, source-log retention, replay, processor checkpoints, and sink commits must be tested as separate boundaries.",
  },
  {
    tag: "storage",
    title: "Separate history from serving",
    body: "<p>Maintain a durable historical table for replay and analysis, plus a seller-scoped serving materialization for the dashboard. Iceberg and Druid are candidates in this exercise, not required products.</p><p>Define how both sinks identify a processing attempt, handle retries, expose their committed version, and reconcile. A successful write to one sink does not make the other atomic.</p>",
    note: "Multiple materializations improve workload isolation but introduce divergence and recovery work.",
  },
  {
    tag: "serving",
    title: "Protect the read and push paths",
    body: "<p>The API queries a pre-aggregated seller view and returns its <code>as_of</code> value. Cache only after defining invalidation, tenant-safe keys, and acceptable staleness.</p><p>The push gateway authorizes each subscription, applies bounded buffers and rate limits, handles slow clients, and revokes access when the session changes. It consumes a shared stream rather than creating one broker consumer group per seller.</p>",
    note: "Latency claims require a representative load test that includes authorization, fan-out, skew, and failure behavior.",
  },
  {
    tag: "tradeoff",
    title: "State the consistency boundary",
    body: "<p>The dashboard serves the latest committed aggregate available in the serving store and exposes its data timestamp. It does not promise linearizable reads against the order database.</p><p>The exercise target allows bounded publication delay, but outage and partition behavior still need a product decision: stale response with a visible timestamp, explicit unavailability, or a degraded summary.</p>",
    note: "Describe observable behavior for a specific read and failure, not a product-wide consistency label.",
  },
  {
    tag: "scale",
    title: "Handle measured key skew",
    body: "<p>Assume one seller accounts for 40% of peak traffic and exceeds one partition consumer's tested capacity.</p><p>Introduce controlled sub-keys such as <code>(seller_id, bucket)</code>, pre-aggregate per bucket, then merge by seller. Derive the bucket count from capacity evidence and document the changed ordering, state, and recovery costs.</p>",
    note: "Adding brokers can relocate a hot partition; it does not divide that partition's records automatically.",
  },
  {
    tag: "tradeoff",
    title: "Record exclusions and residual risk",
    body: "<p>This pass does not design multi-region recovery, privacy deletion across retained logs and snapshots, fraud decisions, or mobile delivery.</p><p>Each exclusion enters the risk register with an owner and decision date. Do not imply a specific replication product solves recovery until failover, ordering, data loss, and restoration have been exercised.</p>",
    note: "A bounded design names excluded obligations instead of hiding them.",
  },
  {
    tag: "follow-up",
    title: "Close with operational evidence",
    body: "<p>Monitor end-to-end publication delay, source-to-sink completeness, invalid-record volume, partition skew, checkpoint and sink-commit failures, reconciliation differences, and serving-store data age.</p><p>Page from a user-impacting SLO and use component metrics for diagnosis. Define runbooks for replay, partial sink success, access incidents, and backfill rollback.</p>",
    note: "The design is reviewable only when its guarantees have measurements, owners, and recovery procedures.",
  },
];
