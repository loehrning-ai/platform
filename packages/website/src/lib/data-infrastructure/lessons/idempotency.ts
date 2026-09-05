// Ported from data-infrastructure/lessons/10-idempotency.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("idempotency");

const lesson: DataInfraLesson = {
  id: "idempotency",
  number: 10,
  title: "Idempotency, Backfills & Processing Guarantees",
  subtitle: "Scope the source, state, sink, and failure model",
  durationMinutes: 14,
  trackId: "scale",
  hook: "Make retries and historical reprocessing safe across every declared side effect.",
  keyConcepts: [
    "Idempotency",
    "UPSERT by key",
    "Backfill",
    "Two-phase commit",
    "Dead-letter queue",
    "Schema compatibility",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Three guarantees",
      readTimeMinutes: 2,
      content:
        "A messaging guarantee means nothing until someone names the boundary and the failure model:\n\n- **At-most-once.** The protocol can omit an effect after an uncertain failure while avoiding replay within its scope.\n- **At-least-once.** Work gets retried or replayed, so duplicate effects are possible unless the consumer controls them. Source durability and retention still bound any loss claim.\n- **Exactly-once.** The committed state inside a defined source-process-sink path looks as if each input affected it once. Implementations use transactions, checkpoints, coordinated offsets, or idempotent effects.\n\nIdempotency is one important mechanism. It is not a universal translation of exactly-once. A Kafka-to-Kafka transaction atomically commits output and consumed offsets under participating configuration. An HTTP payment call needs a stable idempotency contract at the provider, request-identity retention, and reconciliation for unknown outcomes.",
      keyTakeaway:
        "Never accept an exactly-once claim without its source, state, sink, configuration, and failure boundary.",
    },
    {
      id: "s2",
      title: "Idempotency patterns",
      readTimeMinutes: 3,
      content:
        "Three patterns make a bounded effect replay-safe while their assumptions hold:\n\n**01 · UPSERT by key.** The source must carry one deterministic winning row per key, and older events must not overwrite newer state by accident.\n\n```sql\nMERGE INTO fact_orders dst\nUSING new_orders src\n  ON dst.order_id = src.order_id\nWHEN MATCHED THEN UPDATE SET ...\nWHEN NOT MATCHED THEN INSERT ...\n```\n\n**02 · Window replacement.** The transaction or table-format commit must publish a complete deterministic replacement for the window. External readers must never observe the delete without the insert.\n\n```sql\nBEGIN;\nDELETE FROM agg_daily WHERE day = '2026-04-15';\nINSERT INTO agg_daily SELECT ... WHERE day = '2026-04-15';\nCOMMIT;\n```\n\n**03 · Deduplication by event identity.** The producer must emit a stable identity for the logical event, and the sink must enforce uniqueness for at least the retry horizon.\n\n```sql\nINSERT INTO sink (event_id, ...)\nVALUES (...)\nON CONFLICT (event_id) DO NOTHING;\n```\n\nNot one of these patterns makes unrelated API calls, notifications, files, or nondeterministic transformations idempotent.",
    },
    {
      id: "s3",
      title: "Backfill, properly",
      readTimeMinutes: 2,
      content:
        "A backfill reprocesses historical input after a logic change, data correction, or schema addition. Write down six things before you run one: (1) an explicit input window and immutable source version; (2) the operation identity and duplicate-effect policy; (3) dependencies between adjacent windows; (4) interaction with live writes; (5) output validation and rollback; and (6) resource and rate limits.\n\nParallel and repeated windows are safe only when the job's stated invariants prove they commute. When they do not, serialize them, or isolate the output and reconcile before promotion.",
    },
    {
      id: "s4",
      title: "Kafka exactly-once",
      readTimeMinutes: 3,
      content:
        "Kafka provides primitives for a scoped transactional read-process-write path:\n\n1. **Idempotent production.** Producer sequence numbers let brokers deduplicate eligible retries within the producer protocol and configuration.\n2. **Transactions across Kafka partitions.** A transactional producer commits or aborts records atomically. Consumers configured for `read_committed` hide aborted transactional records.\n3. **Consumed offsets in the output transaction.** The application commits consumed offsets together with produced records, so visible Kafka output and progress advance together.\n\nThat delivers exactly-once processing for Kafka input and Kafka output when the application follows the transaction protocol and broker and consumer settings participate. It covers no source before Kafka and no sink outside Kafka.\n\nFlink likewise separates exactly-once managed state from end-to-end output. Its official fault-tolerance documentation requires replayable sources and transactional or idempotent sinks for end-to-end exactly-once. Connector guarantees vary by connector and version. Build a matrix for the exact source, state, sink, and configuration, then inject failures before and after each commit boundary.",
    },
    {
      id: "s4b",
      title: "Dead-letter queues",
      readTimeMinutes: 2,
      content:
        "A **dead-letter path** catches records that cannot be processed under the current contract. It preserves failure evidence without blocking all valid records. It also changes completeness and ordering, which puts it inside the processing guarantee.\n\nStore only what you need: a protected reference or encrypted payload, a safe error code, source identity and position, schema version, first-seen time, retry count, and ownership. Raw records and exception messages carry personal data, credentials, or internal details. Apply access control, minimization, retention, and redaction instead of copying them blindly.\n\nDefine which failures are retryable, which are quarantined, whether a record can bypass ordering, how replay is authorized, and how repaired output is reconciled. Set alert thresholds from expected invalid-input rates and user impact. Non-zero traffic is not automatically an incident.",
      keyTakeaway:
        "A DLQ doesn't fix the bug, it makes failure observable and recoverable instead of invisible and permanent.",
    },
    {
      id: "s5",
      title: "Schema evolution",
      readTimeMinutes: 2,
      content:
        "Schema registries expose **backward**, **forward**, and **full** compatibility modes. What each one means depends on the serialization format, transitive setting, subject strategy, and registry implementation. A syntactically compatible schema still breaks business logic.\n\nSelect compatibility from deployment order, replay requirements, retention, and consumer diversity. Test old data with new readers, and new data with the old readers you must support. A strict mode blocks some incompatible registrations. It cannot populate new historical fields, validate semantics, or coordinate a downstream rollout.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on scope and backfills.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Idempotency key**, a stable identity for one logical operation. Server retention, parameter matching, concurrent requests, response replay, and expiry define its real contract.\n- **Two-phase commit**, coordinates prepare and commit across participating resources. It buys a specific atomicity model and costs availability and recovery work; support varies.\n- **Outbox**, commits business state and an outbox row in one database transaction, then publishes asynchronously with retry and deduplication.\n- **Hot backfill**, overlaps live writes and therefore needs conflict policy, resource isolation, ordering, and reconciliation, not only row-level idempotency.\n- **High-water mark in batch**, a recorded source position for incremental selection. Timestamps alone miss late or corrected data; choose a token and overlap policy from source semantics.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "Scope an exactly-once claim",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'A vendor states "exactly-once delivery." Which response identifies the missing engineering information?',
        options: [
          '"Great, that solves duplicates."',
          '"Name the source, committed state, sink, configuration, failure model, and behavior for external side effects."',
          '"Does it support TLS?"',
          '"How does it compare to at-most-once?"',
        ],
        correct: 1,
        explanation:
          "Exactly-once can be a valid scoped committed-output property. The claim stays incomplete until it identifies the participating source, processing state, sink, transaction or idempotency mechanism, configuration, and covered failures. External APIs and other non-participating effects need their own contracts and reconciliation.",
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
          'You wrote a job that runs daily for "yesterday\'s data." A bug is found, going back 90 days. What change do you make to the job before backfilling?',
        options: [
          "Just run it 90 times.",
          "Parameterize the date window, pin the source version, verify repeated and parallel-window behavior, isolate live writes, and define validation and rollback before execution.",
          "Restore from snapshot.",
          "Add more logging.",
        ],
        correct: 1,
        explanation:
          "An explicit window is necessary and not sufficient. Historical input changes, adjacent windows share state, live writes conflict, and external effects escape rollback. Pin inputs and code, test the invariants, publish atomically, reconcile output, and keep a recovery path.",
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
            a: "The client sends a stable operation identity. The server defines parameter matching, concurrent-request behavior, result retention, expiry, and whether it replays a response or only suppresses an effect.",
          },
          {
            term: "Two-phase commit",
            q: "When and why",
            a: "2PC coordinates prepare and commit across participating resources. It buys atomicity and costs coordination and recovery complexity. An outbox is an alternative for a database-plus-message workflow, not a universal replacement.",
          },
          {
            term: "Outbox",
            q: "Why it beats 2PC",
            a: "One database transaction writes business state and an outbox row. A publisher delivers the outbox asynchronously with retries. That removes the application-level dual write and still needs deduplication, retention, and monitoring.",
          },
          {
            term: "Hot backfill",
            q: "When is it OK?",
            a: 'When backfill runs touch the same partitions as live writes, you risk lock contention or version conflicts. "Cold" backfills run during off-peak. "Hot" backfills require row-level idempotency + ability to reconcile concurrent writes.',
          },
          {
            term: "Watermark in batch",
            q: "Yes, batch has them too",
            a: "An incremental job records a source position. A max timestamp alone misses late or corrected rows; use a source-defined change token or overlap window and deterministic deduplication where needed.",
          },
        ],
      },
    },
  ],
};

export default lesson;
