// Ported from data-infrastructure/lessons/10-idempotency.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("idempotency");

const lesson: DataInfraLesson = {
  id: "idempotency",
  number: 10,
  title: "Idempotency, Backfills & Exactly-Once",
  subtitle: '"Effectively exactly-once."',
  durationMinutes: 14,
  trackId: "scale",
  hook: "The phrase that separates IC4 from IC5. And the dead-letter queue that proves you mean it.",
  keyConcepts: ["Idempotency", "UPSERT by key", "Backfill", "Two-phase commit", "Dead-letter queue", "Schema compatibility"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Three guarantees",
      readTimeMinutes: 2,
      content:
        "Every messaging or pipeline system promises one of three:\n\n- **At-most-once.** Messages may be lost; never duplicated. Cheap. Used for fire-and-forget metrics.\n- **At-least-once.** Messages are never lost; may be duplicated. The default for almost every distributed system. Cheap to implement; pushes deduplication onto consumers.\n- **Exactly-once.** Messages are processed exactly once. Sounds great. Almost always means something subtler than you think.\n\nThe dirty truth: *\"exactly-once\" is at-least-once delivery + idempotent processing.* The system can't actually prevent the message from being delivered twice — it can only ensure that the second delivery has no observable effect. So \"exactly-once\" really means \"the side effects are idempotent.\" If your sink is a Kafka topic with transactional commits, that idempotency is built in. If your sink is \"POST to a credit card processor,\" exactly-once is your problem to solve.",
      keyTakeaway:
        "Exactly-once delivery across a network is impossible; what's achievable is at-least-once delivery plus idempotent side effects.",
    },
    {
      id: "s2",
      title: "Idempotency patterns",
      readTimeMinutes: 3,
      content:
        "Three patterns to make any operation idempotent — memorize them:\n\n**01 · UPSERT by key** — the common one, for fact tables and dimension updates. Re-runnable, order-independent.\n\n```sql\nMERGE INTO fact_orders dst\nUSING new_orders src\n  ON dst.order_id = src.order_id\nWHEN MATCHED THEN UPDATE SET ...\nWHEN NOT MATCHED THEN INSERT ...\n```\n\n**02 · Windowed overwrite** — for daily aggregates and rolling cohorts. Atomic, safe to retry the whole window.\n\n```sql\nBEGIN;\nDELETE FROM agg_daily WHERE day = '2026-04-15';\nINSERT INTO agg_daily SELECT ... WHERE day = '2026-04-15';\nCOMMIT;\n```\n\n**03 · Dedup by event_id** — for streaming sinks consumed at-least-once. Requires the producer to emit a stable id.\n\n```sql\nINSERT INTO sink (event_id, ...)\nVALUES (...)\nON CONFLICT (event_id) DO NOTHING;\n```",
    },
    {
      id: "s3",
      title: "Backfill, properly",
      readTimeMinutes: 2,
      content:
        "A backfill is the operation of re-running a pipeline over historical input — usually because the original run had a bug, or you need to populate new columns. Backfills are where bad pipelines reveal themselves.\n\nThe IC5 backfill checklist: (1) Does my job take an explicit window parameter, not \"yesterday\"? (2) Will running window N twice produce the same result? (3) Will running windows N and N+1 in parallel produce the same result as serially? (4) Can I run a backfill without breaking the live job? If any answer is no, fix that before you ever push.",
    },
    {
      id: "s4",
      title: "Kafka exactly-once",
      readTimeMinutes: 3,
      content:
        "Kafka's transactional API is the cleanest implementation of streaming exactly-once you'll see. Three pieces:\n\n1. **Idempotent producer.** Every producer gets a producer ID (PID) assigned by the broker on first connection. Every record gets a monotonically increasing sequence number per (PID, partition). The broker deduplicates in-memory: if a record with sequence N arrives and N was already accepted, it's silently dropped. This covers producer-level retries.\n2. **Transactions across topics.** A producer can `beginTransaction()`, write to multiple topics/partitions, then `commitTransaction()` or `abortTransaction()`. Until commit, consumers with `isolation.level=read_committed` don't see any of the records. Atomicity is enforced by a transaction coordinator (a broker-side component keyed by `transactional.id`).\n3. **Consumer offsets in the transaction.** The consumer's offset commit is written to `__consumer_offsets` inside the same transaction as the output records. So \"I read offsets M-N and produced these records\" either both commit or both abort.\n\nResult: a Kafka-to-Kafka pipeline can guarantee exactly-once end-to-end. As soon as the sink is anything other than another Kafka topic — a Postgres DB, an HTTP API, an S3 file — it's back on you to make the side effect idempotent. Flink's two-phase commit sink extends this: Flink checkpoints write a pre-commit to the external sink (e.g., Iceberg stage files), then the commit is triggered only after the Kafka offset commit succeeds.\n\n| Pipeline | Guarantee | Mechanism |\n|---|---|---|\n| Kafka → Kafka | Exactly-once | Transactional API, offset commit in tx |\n| Kafka → Iceberg (via Flink) | Effectively exactly-once | Flink 2PC sink + checkpoint |\n| Kafka → Postgres | At-least-once + idempotent | UPSERT on key or ON CONFLICT DO NOTHING |\n| Kafka → HTTP API | At-least-once only | Idempotency key (client-generated UUID) |",
    },
    {
      id: "s4b",
      title: "Dead-letter queues",
      readTimeMinutes: 2,
      content:
        "A pipeline that claims exactly-once semantics but silently drops malformed records is lying — it's at-most-once with extra steps. The IC5 move is a **dead-letter queue (DLQ)**: any record that fails processing or schema validation is routed to a dedicated topic or table, not discarded.\n\nA well-designed DLQ captures: the original raw bytes of the failed record (don't rely on deserialization succeeding), the exception type and message, the source topic/partition/offset (so you can replay the record once the bug is fixed), and a timestamp and consumer group ID for tracing.\n\nThe DLQ doesn't fix the bug — it makes failures observable and recoverable instead of invisible and permanent. In Kafka, implement this with a try/catch in your consumer loop; in Flink, use `getSideOutput()` with a tagged `OutputTag` for poison records. Alert on non-zero DLQ throughput the same way you'd alert on non-zero error rate in a web API.\n\nIf asked \"how do you handle bad records in your pipeline?\" — \"I drop them with a log line\" is a red flag at IC5. The answer is a DLQ with the original bytes, the exception, and the source offset, plus an alert on non-zero DLQ writes and a documented replay procedure.",
      keyTakeaway:
        "A DLQ doesn't fix the bug — it makes failure observable and recoverable instead of invisible and permanent.",
    },
    {
      id: "s5",
      title: "Schema evolution",
      readTimeMinutes: 2,
      content:
        "A backfill that you didn't anticipate: the schema changed. Six months ago you ingested events with 12 fields. Today's events have 14 — two new fields were added. You want to backfill the new columns into old data.\n\nThree compatibility modes you'll see in schema registries:\n\n- **Backward.** New schema can read old data. (Old field deleted? OK, just ignored. New field added? Must have a default.) Lets you upgrade consumers first.\n- **Forward.** Old schema can read new data. (New field? Old reader ignores. Removed field? Old reader gets a null/default.) Lets you upgrade producers first.\n- **Full.** Both. The strictest, most flexible setting. Default for new pipelines.\n\nSet the registry to `FULL` by default. The day a producer ships a breaking change without coordinating, you'll be glad the registry rejected it.",
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
        "- **Idempotency key** — a client-picked UUID sent as an `Idempotency-Key` header; the server caches the response and returns it unchanged on a duplicate request.\n- **Two-phase commit** — coordinates a transaction across multiple resources; slow and fragile under coordinator failure, mostly avoided today via the outbox pattern.\n- **Outbox** — a single-DB transaction writes the row and the event-to-publish to an outbox table; CDC streams the outbox, avoiding a distributed transaction.\n- **Hot backfill** — a backfill run that touches the same partitions as live writes, risking lock contention or version conflicts; requires row-level idempotency.\n- **Watermark in batch** — the \"high water mark\" (latest input timestamp processed) that batch systems track for incremental jobs; a backfill sets it back and re-runs forward.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "The truth about exactly-once",
        copy: DATA_INFRA_QUIZ_COPY,
        question: "A vendor pitches \"exactly-once delivery.\" What's the right interview-grade response?",
        options: [
          "\"Great, that solves duplicates.\"",
          "\"Exactly-once delivery across a network is impossible. What you really mean is at-least-once delivery + idempotent processing — and for sinks that aren't the same vendor's system, idempotency is still my problem.\"",
          "\"Does it support TLS?\"",
          "\"How does it compare to at-most-once?\"",
        ],
        correct: 1,
        explanation:
          "Distributed systems can't prevent duplicate deliveries — networks fail, ACKs are lost, retries happen. What you can engineer is idempotent side effects: the second delivery produces no incremental change. Within Kafka's transactional ecosystem this is automatic. The moment your sink leaves Kafka — DB, HTTP, S3 — you're responsible for the idempotency. Saying \"exactly-once\" without naming the sink is a tell.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Backfill design",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "You wrote a job that runs daily for \"yesterday's data.\" A bug is found, going back 90 days. What change do you make to the job before backfilling?",
        options: [
          "Just run it 90 times.",
          "Parameterize the date window — accept --start_date/--end_date instead of hard-coding \"yesterday.\" Then verify (a) running any single window twice is a no-op, and (b) running windows in parallel is safe. Then backfill.",
          "Restore from snapshot.",
          "Add more logging.",
        ],
        correct: 1,
        explanation:
          "Hard-coding \"yesterday\" guarantees the job cannot backfill. Parameterizing the window is the structural fix. Then the two idempotency checks — re-run-safe and parallel-safe — let you fan out the backfill across windows efficiently. Production-grade pipelines accept window parameters from day one for exactly this reason.",
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
            term: "Idempotency key",
            q: "How do APIs do it?",
            a: "The client picks a UUID, sends it as an Idempotency-Key header. Server records it; on duplicate request with the same key, returns the cached response without re-executing. Stripe, Square, etc. all do this.",
          },
          {
            term: "Two-phase commit",
            q: "When and why",
            a: "2PC coordinates a transaction across multiple resources (e.g. DB + queue). Slow, fragile under coordinator failure. Modern pipelines avoid it via outbox pattern + idempotent consumers.",
          },
          {
            term: "Outbox",
            q: "Why it beats 2PC",
            a: "Single-DB transaction writes the row and the event-to-publish to an \"outbox\" table. CDC streams the outbox. No distributed transaction, but the event is captured iff the row commits.",
          },
          {
            term: "Hot backfill",
            q: "When is it OK?",
            a: "When backfill runs touch the same partitions as live writes, you risk lock contention or version conflicts. \"Cold\" backfills run during off-peak. \"Hot\" backfills require row-level idempotency + ability to reconcile concurrent writes.",
          },
          {
            term: "Watermark in batch",
            q: "Yes, batch has them too",
            a: "Most batch systems track a \"high water mark\" — the latest input timestamp processed — for incremental jobs. Backfill is \"set the watermark back, re-run forward.\" dbt does this implicitly via {{this}}.max(ts).",
          },
        ],
      },
    },
  ],
};

export default lesson;
