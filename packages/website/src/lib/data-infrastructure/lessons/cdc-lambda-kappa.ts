// Ported from data-infrastructure/lessons/09-cdc-lambda-kappa.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("cdc-lambda-kappa");

const lesson: DataInfraLesson = {
  id: "cdc-lambda-kappa",
  number: 9,
  title: "CDC, Lambda & Kappa",
  subtitle: "Change data capture · two architectures",
  durationMinutes: 14,
  trackId: "movement",
  hook: "Capture committed row changes, define bootstrap and replay, then choose one or two processing paths from requirements.",
  keyConcepts: [
    "Change Data Capture",
    "WAL/binlog",
    "Debezium",
    "Lambda architecture",
    "Kappa architecture",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "CDC, why",
      readTimeMinutes: 3,
      content:
        "A source database must be mirrored into an analytical system, including inserts, updates, and deletes. Periodic polling can work when volume, freshness, deletion tracking, and source load are bounded, but timestamp polling needs reliable change markers and explicit delete handling.\n\n**Change Data Capture (CDC)** reads a database change interface, often a transaction log or logical replication stream, and emits row-change events. The event shape, ordering scope, before-images, transaction metadata, and delivery guarantees depend on the database, connector, and configuration. CDC also consumes source resources through snapshots, log decoding, replication slots, network, and retention.\n\n**Bootstrap and continuation.** A connector may take a consistent snapshot and then continue from a recorded log position. Debezium's PostgreSQL connector supports several snapshot modes and isolation settings; its initial workflow reads a log position, scans configured data, records completion, and streams from that point. Snapshot locking, visibility, retries, and duration are configuration- and workload-dependent. Consumers do not necessarily repeat the initial snapshot once durable connector offsets exist.",
      keyTakeaway:
        "A CDC design must specify snapshot mode, log position, ordering scope, retention, restart behavior, and source impact.",
    },
    {
      id: "s2",
      title: "Pipeline visualization",
      readTimeMinutes: 2,
      content:
        "The interactive diagram compares two simplified topologies: a single replayable processing path and separate fast and recomputation paths. It does not execute connectors or measure freshness.\n\nDebezium is one open-source CDC platform and its PostgreSQL connector uses logical decoding and replication slots. A stalled slot can retain WAL and exhaust storage, so monitor retained bytes, connector lag, slot state, snapshot progress, and permission scope. Managed and open alternatives differ in supported sources, snapshot behavior, schemas, security boundaries, and delivery semantics. Verify current connector documentation and run failure tests before selecting one.",
    },
    {
      id: "s3",
      title: "Payload anatomy",
      readTimeMinutes: 3,
      content:
        '```json\n{\n  "op": "u",\n  "ts_ms": 1714233601000,\n  "source": {\n    "db": "shop", "schema": "public", "table": "orders",\n    "lsn": 287345128,\n    "txId": 442817\n  },\n  "before": { "id": 42, "status": "pending", "amount": 4890 },\n  "after":  { "id": 42, "status": "shipped", "amount": 4890 }\n}\n```\n\n`op` values can identify creates, updates, deletes, and snapshot reads. Important caveats:\n\n1. **Before and after images are conditional.** Database replica identity and connector settings determine whether a complete `before` image exists.\n2. **Source positions are opaque progress tokens.** PostgreSQL LSN values are byte positions in WAL, not consecutive event numbers. A numeric jump does not prove a missing event. Use connector offsets, transaction metadata, source health, and reconciliation to detect gaps.\n3. **Deletes need a defined representation.** A delete event, tombstone, or source-side soft-delete policy must be propagated and retained consistently.\n\nSerialization is configurable: JSON, Avro, Protobuf, and registry integrations are deployment choices. A compatibility setting checks schema evolution under format-specific rules; it cannot prove consumer business logic handles a new nullable field. Test producer and consumer versions through replay before rollout.',
    },
    {
      id: "s4",
      title: "Lambda vs Kappa",
      readTimeMinutes: 3,
      content:
        "**Lambda architecture** maintains a low-latency path and a separate recomputation path whose outputs are reconciled in serving. It can use a trusted batch source to correct or rebuild results, but duplicates logic and creates reconciliation work.\n\n**Kappa architecture** uses one stream-processing path for live work and replay. It reduces dual implementations only when the source retains complete replayable history, the same code and dependencies can reproduce old semantics, sinks tolerate replay, and recovery time is acceptable. Starting from offset zero is not a general backfill plan when retention expired or source data came from bulk snapshots.\n\nNeither pattern dominates every workload. Choose one path when replay completeness and recovery objectives are proven. Keep a separate recomputation path when authoritative bulk data, long history, complex batch algorithms, or independent reconciliation justify it. In either design, version business logic and compare replay output against durable source evidence.",
      keyTakeaway:
        "A single processing path reduces duplicate logic only when retained input and versioned code can reproduce the required history.",
    },
    {
      id: "s5",
      title: "Real-time pattern",
      readTimeMinutes: 2,
      content:
        "One possible topology is PostgreSQL logical decoding → a partitioned log → stateful processing → a lakehouse table plus a query-serving projection. It is an example, not a default stack.\n\nBefore using it, define source-of-truth ownership, partition ordering, snapshot bootstrap, schema evolution, log retention, checkpoint and sink guarantees, deletion propagation, serving freshness, and reconciliation. The log can replay only the records it retained; the source database, snapshots, object storage, and external effects may hold authoritative state that the log does not.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **WAL / binlog**, database-specific transaction-log mechanisms that can expose ordered source positions for CDC. Permissions, retention, replica identity, and failover behavior matter.\n- **Snapshot + stream**, a bootstrap pattern that captures a point-in-time view and continues from a compatible log position. Snapshot mode and consistency are configurable.\n- **Tombstone**, a Kafka record with a key and null value. In a compacted topic it participates in key deletion under compaction and retention rules; removal is not immediate.\n- **Schema registry**, stores versioned schemas and applies configured compatibility rules. It does not validate business meaning or every consumer implementation.\n- **Outbox pattern**, writes business state and an outbox row in one database transaction, then publishes the outbox asynchronously. It removes the application-level dual write but still needs publisher retries, deduplication, retention, and monitoring.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "Why not just poll?",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A team polls Postgres with `SELECT * WHERE updated_at > last_seen`. Which limitation should the design review identify before comparing polling with CDC?",
        options: [
          "CDC is always faster.",
          "Timestamp polling needs reliable update markers and a delete representation, and its source-query cost must be measured. CDC has different source, retention, and delivery costs rather than being free.",
          "Polling is deprecated.",
          "CDC uses less network bandwidth.",
        ],
        correct: 1,
        explanation:
          "Polling can be correct for bounded workloads if updates and deletes have durable markers and queries are indexed and measured. CDC can expose committed row changes with lower polling overhead, but it adds snapshot scans, log decoding, replication-slot retention, connector offsets, and at-least-once or scoped transactional semantics. Compare the complete failure and operating model.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Lambda vs Kappa",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A team's Lambda pipeline has two implementations of \"weekly active users\", one in Spark, one in Flink. They disagree by 0.3% and nobody knows why. What's the IC5 fix?",
        options: [
          "Add a unit test.",
          "Remove duplicated logic only if retained input and versioned code can reproduce history; otherwise define one authoritative calculation and reconcile both paths against it.",
          "Average the two numbers.",
          "Use machine learning to reconcile.",
        ],
        correct: 1,
        explanation:
          "Two implementations can diverge through code, state, timing, late data, and source differences. A single versioned path can reduce that risk, but replay can still differ if input retention, dependencies, nondeterminism, or sinks changed. Establish one calculation contract, version it, and reconcile outputs.",
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
            term: "WAL / binlog",
            q: "Where does CDC tap?",
            a: "The transaction log the DB already writes for crash recovery. Postgres: WAL via logical replication. MySQL: binlog. SQL Server: CDC tables. Mongo: oplog.",
          },
          {
            term: "Snapshot + stream",
            q: "How does CDC bootstrap?",
            a: "A connector can take a configured consistent snapshot and continue from a compatible log position. Snapshot modes, locking or isolation, restart behavior, and whether a later consumer snapshots again depend on configuration and stored offsets.",
          },
          {
            term: "Tombstone",
            q: "Kafka delete marker",
            a: "A record with a key and null value. In compacted topics it participates in removing prior values for that key under compaction and delete-retention rules. Connectors can emit delete events and tombstones as separate records.",
          },
          {
            term: "Schema registry",
            q: "Why is it needed?",
            a: "CDC payloads carry schemas. If a column is added at the source, the schema changes, consumers have to handle it. Confluent Schema Registry stores Avro/Protobuf schemas with compatibility checks (backward, forward, full).",
          },
          {
            term: "Outbox pattern",
            q: "When CDC isn't enough",
            a: "The application writes business state and an outbox row in one database transaction. A separate publisher or CDC process delivers the row asynchronously, with retries and deduplication. This removes the application-level database-plus-broker dual write.",
          },
        ],
      },
    },
  ],
};

export default lesson;
