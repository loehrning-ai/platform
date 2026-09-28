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
  hook: "Capture row changes with CDC and pick the processing path.",
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
      title: "Why CDC",
      readTimeMinutes: 3,
      content:
        "You want a source database mirrored into an analytical system, deletes included. Polling works while volume, freshness needs and source load stay bounded, and it needs reliable change markers and delete handling.\n\n**Change Data Capture (CDC)** reads a database change interface, often a transaction log or logical replication stream, and emits row-change events. Database, connector and configuration decide event shape, ordering, before-images and delivery guarantees. Snapshots, log decoding, replication slots and retention cost source resources.\n\n**Bootstrap and continuation.** A connector takes a consistent snapshot, then streams from a recorded log position. Debezium's PostgreSQL connector offers several snapshot modes; locking, retries and duration depend on configuration and workload. With durable offsets, consumers need not repeat the snapshot.",
    },
    {
      id: "s2",
      title: "Pipeline visualization",
      readTimeMinutes: 2,
      content:
        "The diagram compares one replayable processing path with separate fast and recomputation paths. It runs no connectors and measures no freshness.\n\nDebezium's PostgreSQL connector uses logical decoding and replication slots. A stalled slot retains WAL and can fill the disk, so monitor retained bytes, connector lag, slot state and snapshot progress. CDC tools differ in sources, snapshots, schemas, security and delivery semantics; read current docs and run failure tests before you choose.",
    },
    {
      id: "s3",
      title: "Payload anatomy",
      readTimeMinutes: 3,
      content:
        '```json\n{\n  "op": "u",\n  "ts_ms": 1714233601000,\n  "source": {\n    "db": "shop", "schema": "public", "table": "orders",\n    "lsn": 287345128,\n    "txId": 442817\n  },\n  "before": { "id": 42, "status": "pending", "amount": 4890 },\n  "after":  { "id": 42, "status": "shipped", "amount": 4890 }\n}\n```\n\n`op` marks creates, updates, deletes and snapshot reads. Three caveats:\n\n1. **Before and after images are conditional.** Replica identity and connector settings decide whether a complete `before` image exists.\n2. **Source positions are opaque progress tokens.** PostgreSQL LSN values are byte positions in WAL, not event numbers, so a numeric gap proves nothing about lost events. Detect real gaps with connector offsets, transaction metadata, source health and reconciliation.\n3. **Deletes need a defined representation.** Propagate and retain delete events, tombstones or source soft-deletes consistently.\n\nSerialization (JSON, Avro, Protobuf) is a deployment choice. A registry compatibility check cannot prove your consumer logic handles a new nullable field, so replay producer and consumer versions before rollout.',
    },
    {
      id: "s4",
      title: "Lambda vs Kappa",
      readTimeMinutes: 3,
      content:
        "**Lambda architecture** runs a low-latency path and a separate recomputation path, reconciled in serving. The batch path can correct or rebuild results; the price is duplicated logic.\n\n**Kappa architecture** uses one stream-processing path for live work and replay. That removes the dual implementation only if the source retains complete replayable history, the same code and dependencies reproduce old semantics, sinks tolerate replay and recovery time is acceptable. Once retention has expired or source data arrived as a bulk snapshot, restarting from offset zero is not a backfill plan.\n\nChoose one path when replay completeness and recovery objectives are proven, and keep a recomputation path for authoritative bulk data, long history, complex batch algorithms or independent reconciliation. Either way, version the business logic and check replay output against the source.",
    },
    {
      id: "s5",
      title: "Real-time pattern",
      readTimeMinutes: 2,
      content:
        "One example topology is PostgreSQL logical decoding → a partitioned log → stateful processing → a lakehouse table plus a query-serving projection.\n\nBefore you use it, define source-of-truth ownership, partition ordering, snapshot bootstrap, schema evolution, log retention, sink guarantees, delete propagation and reconciliation. The log replays only what it retained; the source, snapshots or object storage can hold authoritative state the log never saw.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on capture and replay.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **WAL / binlog**, the database transaction log with ordered source positions that CDC reads; check permissions, retention and failover first.\n- **Tombstone**, a Kafka record with a key and a null value that marks a deletion.\n- **Schema registry**, stores versioned schemas and checks configured compatibility rules.\n- **Outbox pattern**, business state and an outbox row in one transaction, published asynchronously; publisher retries, deduplication and monitoring stay necessary.",
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
          "A team polls Postgres with `SELECT * WHERE updated_at > last_seen`. Which limitation should the design review name before comparing it with CDC?",
        options: [
          "CDC is always faster than polling.",
          "Polling needs reliable change and delete markers; both approaches cost source load.",
          "Polling is deprecated in current Postgres.",
          "CDC always uses less network bandwidth.",
        ],
        correct: 1,
        explanation:
          "Polling works for bounded loads with durable update and delete markers and indexed, measured queries. CDC avoids polling overhead but adds snapshots, log decoding, slot retention, connector offsets and at-least-once or scoped transactional delivery.",
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
          'A Lambda pipeline computes "weekly active users" in Spark and in Flink. Results differ by 0.3%, cause unknown. What\'s the durable fix?',
        options: [
          "Add a unit test to the Spark job.",
          "Keep one versioned calculation and reconcile the other path against it.",
          "Average the two numbers.",
          "Use machine learning to reconcile them.",
        ],
        correct: 1,
        explanation:
          "Two implementations drift through code, state, timing, late data and source differences. Version one calculation contract and reconcile against it; replay can still differ if retention, dependencies, nondeterminism or sinks changed.",
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
            a: "The log the database already writes for crash recovery: WAL in Postgres, binlog in MySQL, CDC tables in SQL Server, oplog in MongoDB.",
          },
          {
            term: "Snapshot + stream",
            q: "How does CDC bootstrap?",
            a: "A consistent snapshot, then streaming from a compatible log position. Configuration and stored offsets decide locking, restarts and whether later consumers snapshot again.",
          },
          {
            term: "Tombstone",
            q: "Kafka delete marker",
            a: "A record with a key and a null value. In compacted topics it removes earlier values for that key after compaction and delete retention, with a delay.",
          },
          {
            term: "Schema registry",
            q: "Why is it needed?",
            a: "A new source column changes the payload schema. A registry stores versioned Avro or Protobuf schemas and checks backward, forward or full compatibility; business meaning you test yourself.",
          },
          {
            term: "Outbox pattern",
            q: "When CDC isn't enough",
            a: "Business state and an outbox row go into one database transaction; a publisher or CDC delivers the row later. That removes the database-plus-broker dual write.",
          },
        ],
      },
    },
  ],
};

export default lesson;
