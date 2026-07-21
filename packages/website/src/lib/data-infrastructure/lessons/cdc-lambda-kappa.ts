// Ported from data-infrastructure/lessons/09-cdc-lambda-kappa.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("cdc-lambda-kappa");

const lesson: DataInfraLesson = {
  id: "cdc-lambda-kappa",
  number: 9,
  title: "CDC, Lambda & Kappa",
  subtitle: "Change data capture · two architectures",
  durationMinutes: 14,
  trackId: "movement",
  hook: "How operational DBs become analytical streams, and which architecture is winning in 2026.",
  keyConcepts: ["Change Data Capture", "WAL/binlog", "Debezium", "Lambda architecture", "Kappa architecture"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "CDC, why",
      readTimeMinutes: 3,
      content:
        "You have a Postgres database with 200 tables. Marketing wants those tables in the warehouse, fresh, with every insert/update/delete reflected within seconds. The naive answer is \"select * every 5 minutes.\" That answer scales for about a week.\n\n**Change Data Capture (CDC)** is the right answer. Every database already maintains a write-ahead log, Postgres calls it WAL, MySQL calls it binlog, Oracle calls it redo. CDC tools tail that log, decode every committed transaction into a stream of `{op: insert|update|delete, table, before, after}` events, and ship them to a downstream consumer.\n\nThis is dramatically better than polling because (a) it's near-realtime, milliseconds of lag, (b) it captures deletes (which polling misses entirely), (c) it doesn't load the source DB, and (d) it produces a complete, ordered event stream that any downstream can consume.\n\n**The bootstrap problem.** You can't replay infinite WAL history, most Postgres clusters retain WAL for only hours or days. Debezium solves this with a two-phase bootstrap: (1) *initial snapshot*, a consistent read of every row, emitted as `op: \"r\"` events, using a transaction-level snapshot so no writes are locked; (2) *streaming*, once the snapshot completes, WAL tailing begins from the LSN of that snapshot. New consumers always go through both phases.",
      keyTakeaway:
        "CDC tools always bootstrap in two phases: a consistent initial snapshot, then WAL tailing from that snapshot's exact log position.",
    },
    {
      id: "s2",
      title: "Pipeline visualization",
      readTimeMinutes: 2,
      content:
        "Below: the CDC pipeline visualized end to end, switchable between the Kappa (single-stream) and Lambda (speed + batch) shapes.\n\n**Tools to know.** Debezium is the canonical open-source CDC connector, runs on Kafka Connect, supports Postgres/MySQL/SQL Server/MongoDB. In Postgres, it uses logical replication slots, which require `wal_level = logical` and will hold WAL on disk if the consumer falls behind, a common ops footgun. Managed alternatives: Fivetran (closed, premium), Airbyte (open), AWS DMS (AWS-native, handles cross-DB migrations too). Modern queryable-stream option: Materialize, which exposes the CDC stream as incrementally-maintained SQL views without a separate warehouse hop.",
    },
    {
      id: "s3",
      title: "Payload anatomy",
      readTimeMinutes: 3,
      content:
        "```json\n{\n  \"op\": \"u\",\n  \"ts_ms\": 1714233601000,\n  \"source\": {\n    \"db\": \"shop\", \"schema\": \"public\", \"table\": \"orders\",\n    \"lsn\": 287345128,\n    \"txId\": 442817\n  },\n  \"before\": { \"id\": 42, \"status\": \"pending\", \"amount\": 4890 },\n  \"after\":  { \"id\": 42, \"status\": \"shipped\", \"amount\": 4890 }\n}\n```\n\n`op` is `c` = create, `u` = update, `d` = delete, `r` = read (snapshot). Three things this format gives you:\n\n1. **Both states.** `before` + `after` means the consumer can compute diffs without joining back to source.\n2. **Ordering tokens.** `lsn` and `txId` let you detect gaps and replay from a precise position. If you see `lsn` jump by more than the expected increment, you missed events, alert on this.\n3. **Deletes are first-class.** `op: \"d\"` with `before` populated, `after: null`. Polling can't see deletes.\n\n**Schema evolution and the registry.** In production, Debezium wraps each payload in an Avro (or Protobuf) envelope and registers the schema with Confluent Schema Registry or a compatible alternative. Every consumer deserializes using the schema ID embedded in the message, not a hard-coded struct, so adding a nullable column to the source table propagates automatically without breaking consumers. Set registry compatibility to `BACKWARD` at minimum so new schemas can still read old messages during replay.",
    },
    {
      id: "s4",
      title: "Lambda vs Kappa",
      readTimeMinutes: 3,
      content:
        "From around 2011 to 2017, a popular architecture was **Lambda**: run two parallel pipelines, a \"speed layer\" producing fast-but-approximate results from streams, and a \"batch layer\" producing slow-but-accurate results from a daily re-compute. A serving layer merged them at query time. Nathan Marz proposed it; entire books were written.\n\nLambda solved the problem of streaming engines being immature in 2011. By 2017, streaming engines (Flink, Kafka Streams, Spark Structured Streaming) were robust enough that the speed layer could be the only layer. Jay Kreps (Kafka co-creator) called this **Kappa**: one pipeline, streaming end-to-end, and \"batch\" is just a stream replayed from offset zero.\n\nThe killer flaw of Lambda: **two codebases for the same logic.** Every aggregation has to be expressed twice, once in the streaming framework, once in the batch framework, and they have to produce identical results. They never quite did. Engineers spent years debugging \"why does the realtime number disagree with the daily number?\"\n\nKappa wins by collapsing this: the same code runs over a stream, and \"re-compute everything\" is implemented as a stream consumer that starts from offset zero of a long-retention topic. This requires a streaming engine that's robust enough to be the source of truth, and as of 2026, Flink and Spark Structured Streaming are.\n\nIf asked \"would you use Lambda or Kappa?\", pick Kappa unless you have a specific reason. The specific reasons for keeping Lambda: (1) your stream framework can't express a complex ML scoring transform that your batch framework (Spark MLlib) can; (2) you need to backfill from an external source that doesn't retain a replayable log and only offers bulk exports. Both are increasingly rare as Flink's expressiveness has grown. The more common modern variant is Delta Architecture (Databricks' name for Kappa + streaming Delta Lake writes), which is Lambda with the batch layer replaced by a Spark Structured Streaming job, one codebase, ACID writes, compaction built in.",
      keyTakeaway:
        "Pick Kappa unless you have a specific reason to keep Lambda, two codebases for the same aggregation logic reliably drift apart, they never quite agree.",
    },
    {
      id: "s5",
      title: "Real-time pattern",
      readTimeMinutes: 2,
      content:
        "This is the lakehouse-CDC pattern interviewers expect: CDC reads Postgres' WAL, lands an ordered topic in Kafka, Flink applies upserts and writes to an Iceberg table, same SQL, same governance, queryable from Trino or Snowflake at seconds-of-freshness. For dashboards needing sub-second response, fan out the same Kafka topic into a serving cache like Druid or Pinot. Every layer is replayable from Kafka; nothing is the source of truth except the upstream log.",
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
        "- **WAL / binlog**, the transaction log the DB already writes for crash recovery; CDC's tap point (Postgres WAL, MySQL binlog, SQL Server CDC tables, Mongo oplog).\n- **Snapshot + stream**, CDC's two-phase bootstrap: a consistent snapshot of current rows, then WAL tailing from the snapshot's LSN.\n- **Tombstone**, a Kafka record with a key but null value; in compacted topics it tells the broker to delete the key, and CDC delete events become tombstones in \"current state\" topics.\n- **Schema registry**, stores Avro/Protobuf schemas with compatibility checks (backward, forward, full) so consumers deserialize by schema ID, not a hard-coded struct.\n- **Outbox pattern**, for app-emitted business events, the app writes to a regular DB table inside the transaction and CDC streams that table, solving the dual-write problem.",
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
          "A junior engineer wants to mirror Postgres → warehouse with `SELECT * WHERE updated_at > last_seen` every minute. Why is CDC strictly better?",
        options: [
          "CDC is faster.",
          "Polling misses deletes (no row to select), causes load spikes on the source, and gets the wrong answer when `updated_at` is missing or unreliable. CDC reads the WAL, every commit is captured exactly once, including deletes, with no source load.",
          "Polling is deprecated.",
          "CDC uses less network bandwidth.",
        ],
        correct: 1,
        explanation:
          "Three killer flaws with polling: (1) deletes, there's no row to find, you'd need a tombstone table the source doesn't have. (2) Schema-dependence, you're trusting an updated_at column that may not exist or may be set wrong by application code. (3) Load, every poll is a query against your transactional database, scanning a potentially massive index. CDC reads the WAL (a thing the DB writes anyway), captures every commit including deletes, and adds essentially zero source load.",
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
          "Migrate to Kappa: make the streaming pipeline the source of truth, and \"weekly recompute\" is the same code reading from offset zero of a retained Kafka topic. One implementation, one truth.",
          "Average the two numbers.",
          "Use machine learning to reconcile.",
        ],
        correct: 1,
        explanation:
          "The 0.3% drift is the canonical Lambda failure mode, two codebases drift even when authors are careful. Tests don't fix it (the bug is in the dual-implementation premise). Kappa fixes it by deleting the batch path: there's only one code path. Re-running history is the same code reading older offsets. The drift literally cannot exist.",
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
            a: "You can't replay infinite WAL history. CDC tools take a consistent snapshot of current rows (op: \"r\"), then start tailing WAL from the snapshot LSN. New consumers go through the same two phases.",
          },
          {
            term: "Tombstone",
            q: "Kafka delete marker",
            a: "A record with a key but null value. In compacted topics, tombstones tell the broker to delete the key. CDC delete events become tombstones in compacted \"current state\" topics.",
          },
          {
            term: "Schema registry",
            q: "Why is it needed?",
            a: "CDC payloads carry schemas. If a column is added at the source, the schema changes, consumers have to handle it. Confluent Schema Registry stores Avro/Protobuf schemas with compatibility checks (backward, forward, full).",
          },
          {
            term: "Outbox pattern",
            q: "When CDC isn't enough",
            a: "For app-emitted business events (not just row changes), the app writes to a regular DB table inside the transaction; CDC streams that table. Guarantees the event is captured iff the transaction commits. Solves the dual-write problem.",
          },
        ],
      },
    },
  ],
};

export default lesson;
