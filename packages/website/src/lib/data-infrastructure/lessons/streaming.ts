// Ported from data-infrastructure/lessons/08-streaming.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("streaming");

const lesson: DataInfraLesson = {
  id: "streaming",
  number: 8,
  title: "Streaming: Kafka, Watermarks, Windows",
  subtitle: "Partitions · groups · event time",
  durationMinutes: 15,
  trackId: "movement",
  hook: "Why event time ≠ processing time, and how watermarks let you reason about late data.",
  keyConcepts: [
    "Event time vs processing time",
    "Watermark",
    "Window types",
    "Delivery semantics",
    "Engine selection",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Two clocks",
      readTimeMinutes: 2,
      content:
        "A stream has no end-of-file. Input is *unbounded*, so the system itself must define when intermediate results are emitted, revised, or considered final enough for a consumer.\n\nTwo timestamps matter. **Event time** is when an event occurred according to its source; **processing time** is when an operator observed it. They differ because devices buffer events, networks retry, queues accumulate lag, and clocks drift. Use event time when the business rule concerns occurrence and the source timestamp is trustworthy, processing time when the requirement concerns arrival or system handling. Neither is a universal default.",
    },
    {
      id: "s2",
      title: "Kafka's core model",
      readTimeMinutes: 3,
      content:
        "Five concepts define the core model:\n\n- **Topic**, a named sequence of records split into partitions.\n- **Partition**, an ordered log. Kafka ordering is defined within a partition, never across a topic.\n- **Producer**, writes records and selects a partition through an explicit partition, a configured partitioner, or client behavior for keyed or unkeyed records.\n- **Consumer group**, coordinates consumers so one group member owns a given partition at a time. Partitions bound active consumption parallelism for that topic.\n- **Offset**, a record position within a partition. A group stores committed offsets; replay works only while the required records stay retained and compatible.\n\nA stable key, a stable partitioner, and an unchanged partition count keep a key's records in one partition. Raise the partition count and the mapping of later records can change, so key-local history may span partitions. Choose counts from measured throughput, per-partition limits, ordering, recovery, and operational overhead. Not from a fixed safety number.",
    },
    {
      id: "s3",
      title: "Event vs processing time",
      readTimeMinutes: 3,
      content:
        "You are counting events per minute. At processing time 14:35, the job receives an event whose event timestamp is 14:32. An event-time aggregation assigns it to the 14:32 window; a processing-time aggregation assigns it by arrival. The product definition decides which is correct.\n\nA **watermark** is the engine's progress signal for event time. It says the system no longer expects substantially earlier timestamps, based on a configured or generated policy. It is not proof that every earlier event arrived. When a watermark passes a window boundary, an engine may trigger output and later drop, retain, route, or revise results for late events according to its APIs and configuration.",
    },
    {
      id: "s4",
      title: "Watermark visualization",
      readTimeMinutes: 2,
      content:
        "The visualization uses a fixed four-second lateness threshold and synthetic events. It shows how a threshold moves the model's on-time and late classifications. It is not a production recommendation.\n\nChoose a watermark policy from the observed lateness distribution, idle partitions, clock quality, source behavior, allowed state size, revision semantics, and consumer SLO. A percentile informs the choice. The accepted loss or correction policy stays a product decision, and it must be measured after deployment.",
    },
    {
      id: "s5",
      title: "Window types",
      readTimeMinutes: 2,
      content:
        '| Window | Shape | Use for |\n|---|---|---|\n| Tumbling | Fixed, non-overlapping (every minute, every hour) | "events per minute" |\n| Hopping (Sliding) | Fixed, overlapping (every 30s, sized 5min) | moving averages, smooth dashboards |\n| Session | Variable, gap-based (closes after T seconds of inactivity) | user sessions, IoT bursts |\n| Global | One window forever; uses custom triggers | running totals with manual flush |',
    },
    {
      id: "s5b",
      title: "Delivery semantics",
      readTimeMinutes: 3,
      content:
        'Every delivery or processing claim has to name its boundary, failure model, and observable state:\n\n- **At-most-once.** A failure can omit an effect, while the protocol avoids replaying acknowledged work within its scope.\n- **At-least-once.** The system retries or replays work after uncertain failures, so the same logical record can affect processing more than once unless the consumer controls duplicate effects. "No loss" still rests on source durability, retention, acknowledgements, and the stated failures.\n- **Exactly-once.** A scoped system makes the committed output look as if each input affected that output once. Transactions, checkpoints, replayable sources, idempotent sinks, or coordinated offsets implement it. It does not automatically cover external APIs or every upstream and downstream system.\n\nKafka transactions can atomically publish output records and consumed offsets for a Kafka-to-Kafka read-process-write path when producers, consumers, isolation, and broker configuration all participate. Flink documents end-to-end exactly-once as requiring replayable sources and transactional or idempotent sinks. Whatever the design, enumerate every side effect and verify recovery with failure injection.',
      keyTakeaway:
        "A processing guarantee is valid only for the named source, state, sink, configuration, and failure model.",
    },
    {
      id: "s5c",
      title: "Select a streaming engine",
      readTimeMinutes: 3,
      content:
        'Engine capabilities and defaults change. Compare the exact supported version and connectors against a reproducible workload:\n\n| Decision | Evidence |\n|---|---|\n| Processing mode | How records or micro-batches are scheduled, and which APIs change by mode |\n| State | Size, backend, checkpoint duration, recovery time, rescaling, and schema evolution |\n| Event time | Watermark generation, idle inputs, windows, joins, timers, and late-data updates |\n| Guarantees | Source replay, state semantics, sink participation, offset commits, and failure tests |\n| Latency and throughput | Measured percentiles under normal load, backpressure, checkpointing, and recovery |\n| Operations | Deployment, upgrades, savepoints/checkpoints, observability, cost, and team ownership |\n\nCurrent official documentation describes Spark Structured Streaming\'s default micro-batch mode and separate continuous-processing behavior with different guarantees; Flink likewise separates state guarantees from end-to-end sink guarantees. Do not reduce either product to a fixed latency band or a single "exactly-once" label.',
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Three questions on partitions, watermarks, and windows.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- **Choose event or processing time from the business rule and timestamp quality.** Test delayed, duplicated, and out-of-order input.\n- **A watermark is an event-time progress policy, not proof of completeness.** Define late-data revision, retention, and consumer behavior explicitly.\n- **Scope delivery guarantees.** Name source replay, state, sink, configuration, and failure model; test every external side effect.\n- **Select engines from current versioned capabilities and measured workloads.** A product name implies no latency and no processing guarantee.\n- **Kafka partitions bound active consumers in one group for that topic.** Raising the count can remap later keyed records; plan migration and ordering for it.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Compacted topic**, a Kafka topic where background compaction retains at least the latest value for each key, subject to segment, tombstone, and retention behavior. Older records do not disappear immediately.\n- **ISR**, in-sync replicas according to broker rules. Producer acknowledgements, replication settings, leader election, and failure assumptions jointly decide durability.\n- **At-most-once**, a scoped policy that can omit effects after uncertain failure while avoiding replay within that scope.\n- **At-least-once**, retries can repeat effects; idempotency needs a stable operation identity and a sink rule.\n- **Exactly-once**, a scoped committed-output property that requires a participating source, processing state, sink, and configuration.\n- **Backpressure**, downstream capacity limits propagate or accumulate according to the broker and processing topology; monitor lag, buffers, checkpoints, and source throttling.\n- **Allowed lateness**, an engine-specific policy for retaining state and accepting or revising results after event-time progress passes a boundary.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "Partition count",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A team picks 4 partitions for their `page_views` topic. A year later they want 50 consumers in the consumer group for parallelism. What's wrong?",
        options: [
          "Nothing; Kafka auto-scales.",
          "At most four consumers can own those four partitions at once. Increasing partitions is possible, but later keyed records may map differently and require an ordering-aware migration.",
          "They need more brokers.",
          "They should use Kinesis.",
        ],
        correct: 1,
        explanation:
          "Within one consumer group, one member owns a partition at a time, so four partitions support at most four active owners for that topic. Raising the count later is supported, and a default key mapping can change for subsequent records. Select and migrate the count from measured throughput, ordering, recovery, broker limits, and operational overhead.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Late data policy",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'Your stream job aggregates "revenue per minute." Watermark is 30 seconds behind max event time. An event with event-time 14:32:15 arrives at 14:34:00 (processing time). What happens?',
        options: [
          "It's included in the 14:32 result.",
          "It depends on the configured window and late-data policy: the engine may drop, route, retain, or emit a revision.",
          "It's included in the 14:34 result (re-bucketed by processing time).",
          "It triggers a re-computation of all windows.",
        ],
        correct: 1,
        explanation:
          "The timestamps put the event behind the stated watermark policy. The result still depends on how the engine generates watermarks, handles idle partitions, retains window state, and treats late events. Your design must say whether downstream output is final, revisable, or shipped with corrections.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q3",
        title: "Session windows",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'You\'re computing "user session duration", a session is a sequence of events with no gap longer than 30 minutes. Which window type fits?',
        options: [
          "Tumbling, every 30 minutes.",
          "Session, with a 30-minute inactivity gap. Tumbling would split a long session across multiple windows; session windows close dynamically when the gap is hit.",
          "Hopping, sized 30 minutes.",
          "Global, with a manual trigger.",
        ],
        correct: 1,
        explanation:
          "A session window groups events for a key while consecutive event-time gaps stay within the configured threshold. Closure and later merging follow watermark and late-data behavior. A fixed tumbling boundary splits one behavioral session in half.",
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
            term: "Compacted topic",
            q: "What is it?",
            a: "Background compaction retains at least the latest value for each key, subject to segment and tombstone rules. It supports rebuilding keyed state. It is not an immediate or fully constrained table.",
          },
          {
            term: "ISR",
            q: "In-Sync Replicas",
            a: "Replicas considered in sync under broker rules. Producer acks, min.insync.replicas, replication factor, leader election, and the assumed failures together decide durability.",
          },
          {
            term: "At-most-once",
            q: "How is it achieved, and when is it acceptable?",
            a: "Commit the position before the effect and a crash can omit that effect. Use it only when the defined loss risk is explicitly acceptable and independently monitored.",
          },
          {
            term: "At-least-once",
            q: "How is it achieved?",
            a: "Committing position after an effect replays work when failure lands between the two. Control duplicate effects with a stable identity and sink semantics; source durability and retention still matter.",
          },
          {
            term: "Exactly-once",
            q: "How does Kafka achieve it?",
            a: "For a Kafka-to-Kafka read-process-write path, transactions atomically publish output and consumed offsets, with participating producers and read-committed consumers. External sinks need their own transactional or idempotent integration.",
          },
          {
            term: "Backpressure",
            q: "What happens when a consumer is slow?",
            a: "A slow consumer raises broker retention pressure and lag. In a processing topology, downstream limits fill buffers and propagate toward sources. Monitor the whole path instead of assuming one component stays unaffected.",
          },
          {
            term: "Allowed lateness",
            q: "Window setting",
            a: "An engine-specific policy for how long state stays available and what late events may do after event-time progress passes a window. Downstream consumers must support any revisions the policy emits.",
          },
        ],
      },
    },
  ],
};

export default lesson;
