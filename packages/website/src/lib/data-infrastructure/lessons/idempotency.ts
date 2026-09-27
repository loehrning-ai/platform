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
        "A delivery guarantee needs a named boundary and failure model:\n\n- **At-most-once** can omit an effect after an uncertain failure.\n- **At-least-once** can duplicate effects unless the consumer controls them; source durability and retention still bound any loss claim.\n- **Exactly-once** means committed state on a defined source-process-sink path looks as if each input affected it once, through transactions, checkpoints, coordinated offsets or idempotent effects.\n\nIdempotency is one of these mechanisms. An HTTP payment call, for example, needs the provider's idempotency contract, retained request identities and reconciliation for unknown outcomes.",
    },
    {
      id: "s2",
      title: "Idempotency patterns",
      readTimeMinutes: 3,
      content:
        "Three patterns make a bounded effect replay-safe while their assumptions hold:\n\n**01 · UPSERT by key.** The source needs one deterministic winning row per key, and older events must not overwrite newer state.\n\n```sql\nMERGE INTO fact_orders dst\nUSING new_orders src\n  ON dst.order_id = src.order_id\nWHEN MATCHED THEN UPDATE SET ...\nWHEN NOT MATCHED THEN INSERT ...\n```\n\n**02 · Window replacement.** One transaction or table commit publishes a complete, deterministic replacement; readers never see the delete without the insert.\n\n```sql\nBEGIN;\nDELETE FROM agg_daily WHERE day = '2026-04-15';\nINSERT INTO agg_daily SELECT ... WHERE day = '2026-04-15';\nCOMMIT;\n```\n\n**03 · Deduplication by event identity.** The producer emits a stable event identity, and the sink enforces uniqueness for at least the retry horizon.\n\n```sql\nINSERT INTO sink (event_id, ...)\nVALUES (...)\nON CONFLICT (event_id) DO NOTHING;\n```\n\nNone of them makes API calls, notifications, files or nondeterministic transformations idempotent.",
    },
    {
      id: "s3",
      title: "Backfill, properly",
      readTimeMinutes: 2,
      content:
        "A backfill reprocesses historical input after a logic change, data correction or schema addition. Before you run one, write down:\n\n1. input window and immutable source version\n2. operation identity and duplicate-effect policy\n3. dependencies between adjacent windows\n4. interaction with live writes\n5. output validation and rollback\n6. resource and rate limits\n\nRun windows in parallel or repeatedly only when the job's invariants prove they commute. Otherwise serialize them, or isolate the output and reconcile before promotion.",
    },
    {
      id: "s4",
      title: "Kafka exactly-once",
      readTimeMinutes: 3,
      content:
        "Kafka offers three building blocks for a transactional read-process-write path:\n\n1. **Idempotent production.** Producer sequence numbers let brokers deduplicate eligible retries.\n2. **Transactions across partitions.** A transactional producer commits or aborts records atomically; `read_committed` consumers hide aborted records.\n3. **Offsets in the output transaction.** Consumed offsets commit with the produced records, so output and progress advance together.\n\nTogether they give exactly-once from Kafka input to Kafka output if the application follows the protocol; sources before Kafka and sinks outside it are not covered.\n\nFlink separates exactly-once managed state from end-to-end output, which needs replayable sources and transactional or idempotent sinks. Guarantees vary by connector and version, so build a matrix of source, state, sink and configuration and inject failures around each commit boundary.",
    },
    {
      id: "s4b",
      title: "Dead-letter queues",
      readTimeMinutes: 2,
      content:
        "A **dead-letter path** holds records the current contract cannot process, without blocking valid ones. It changes completeness and ordering, so it is part of the processing guarantee.\n\nStore only a protected reference or encrypted payload, a safe error code, source identity and position, schema version, first-seen time, retry count and owner. Raw records and exception messages can carry personal data, credentials or internal details, so apply access control, minimization, retention and redaction.\n\nDefine which failures are retried or quarantined, whether a record may bypass ordering, who authorizes replay and how repaired output is reconciled. Set alert thresholds from expected invalid-input rates and user impact.",
    },
    {
      id: "s5",
      title: "Schema evolution",
      readTimeMinutes: 2,
      content:
        "Schema registries offer **backward**, **forward** and **full** compatibility. Their exact meaning depends on format, transitive setting, subject strategy and registry, and a compatible schema can still break business logic.\n\nChoose the mode from deployment order, replay needs, retention and consumer variety. Test old data with new readers and new data with the old readers you support. A strict mode blocks some incompatible registrations; it does not backfill new fields, check semantics or coordinate downstream rollouts.",
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
        "- **Idempotency key**, a stable identity for one logical operation.\n- **Two-phase commit**, coordinates prepare and commit across participating resources.\n- **Outbox**, business state and an outbox row in one transaction, published asynchronously.\n- **Hot backfill**, a backfill that overlaps live writes.\n- **High-water mark in batch**, a recorded source position for incremental selection.",
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
          '"Which source, state, sink, config, failures and side effects does it cover?"',
          '"Does it support TLS?"',
          '"How does it compare to at-most-once?"',
        ],
        correct: 1,
        explanation:
          "Exactly-once holds only within a named source, state, sink, mechanism, configuration and failure set. External APIs and other effects outside that scope need their own contracts and reconciliation.",
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
          'A daily job processes "yesterday\'s data." A bug affects the last 90 days. What do you change before backfilling?',
        options: [
          "Just run it 90 times.",
          "Parameterize the window, pin the source, test reruns, isolate writes, plan rollback.",
          "Restore from snapshot.",
          "Add more logging.",
        ],
        correct: 1,
        explanation:
          "A date parameter alone is not enough: historical input changes, adjacent windows share state, live writes conflict and external effects escape rollback. Pin inputs and code, publish atomically and reconcile the output.",
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
            a: "The client sends a stable operation identity. The server defines parameter matching, concurrent requests, retention, expiry and whether it replays the response.",
          },
          {
            term: "Two-phase commit",
            q: "When and why",
            a: "2PC buys atomicity across participating resources at the cost of availability, coordination and recovery work; support varies. For database-plus-message flows, an outbox is the usual alternative.",
          },
          {
            term: "Outbox",
            q: "Why it beats 2PC",
            a: "One database transaction writes state and outbox row; a publisher delivers the row with retries. No dual write, but deduplication, retention and monitoring remain.",
          },
          {
            term: "Hot backfill",
            q: "When is it OK?",
            a: 'When a backfill touches partitions with live writes, locks and version conflicts follow. Cold backfills run off-peak; hot ones need conflict rules, resource isolation, row-level idempotency and reconciliation.',
          },
          {
            term: "Watermark in batch",
            q: "Yes, batch has them too",
            a: "An incremental job records a source position. A max timestamp misses late or corrected rows; use a change token or an overlap window with deterministic deduplication.",
          },
        ],
      },
    },
  ],
};

export default lesson;
