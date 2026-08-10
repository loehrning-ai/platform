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
        "Streaming jobs treat input as *unbounded*: the computation has no natural end-of-file. The system must define when intermediate results are emitted, revised, or considered final enough for a consumer.\n\nTwo timestamps matter. **Event time** describes when an event occurred according to its source. **Processing time** describes when an operator observed it. They can differ because devices buffer events, networks retry, queues accumulate lag, and clocks are imperfect. Use event time when the business rule concerns occurrence time and the source timestamp is trustworthy. Use processing time when the requirement concerns arrival or system handling. Neither is a universal default.",
    },
    {
      id: "s2",
      title: "Kafka's core model",
      readTimeMinutes: 3,
      content:
        "Five concepts define the core model:\n\n- **Topic**, a named sequence of records split into partitions.\n- **Partition**, an ordered log. Kafka ordering is defined within a partition, not across a topic.\n- **Producer**, writes records and selects a partition through an explicit partition, a configured partitioner, or client behavior for keyed or unkeyed records.\n- **Consumer group**, coordinates consumers so that one group member owns a given partition at a time. Active consumption parallelism for that topic is bounded by its partitions.\n- **Offset**, a record position within a partition. A group stores committed offsets; replay is possible only while the required records remain retained and compatible.\n\nA stable key, stable partitioner, and unchanged partition count can keep a key's records in one partition. Increasing the partition count can change the mapping of later records, so key-local history may span partitions. Choose counts from measured throughput, per-partition limits, ordering, recovery, and operational overhead rather than a fixed safety number.",
    },
    {
      id: "s3",
      title: "Event vs processing time",
      readTimeMinutes: 3,
      content:
        "Imagine a count per minute. At processing time 14:35, the job receives an event whose event timestamp is 14:32. An event-time aggregation assigns it to the 14:32 window; a processing-time aggregation assigns it according to arrival. The correct rule comes from the product definition.\n\nA **watermark** is the engine's progress signal for event time. It usually indicates that the system does not expect substantially earlier timestamps, based on a configured or generated policy. It is not proof that every earlier event arrived. When a watermark passes a window boundary, an engine may trigger output and later drop, retain, route, or revise results for late events according to its APIs and configuration.",
    },
    {
      id: "s4",
      title: "Watermark visualization",
      readTimeMinutes: 2,
      content:
        "The visualization uses a fixed four-second lateness threshold and synthetic events. It demonstrates how a threshold changes the model's on-time and late classifications; it is not a production recommendation.\n\nChoose a watermark policy from the observed lateness distribution, idle partitions, clock quality, source behavior, allowed state size, revision semantics, and consumer SLO. A percentile can inform the choice, but the accepted loss or correction policy is a product decision and must be measured after deployment.",
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
        'Delivery and processing claims must name the boundary, failure model, and observable state:\n\n- **At-most-once.** A failure can omit an effect, while the protocol avoids replaying acknowledged work within its scope.\n- **At-least-once.** The system retries or replays work after uncertain failures, so the same logical record can affect processing more than once unless the consumer controls duplicate effects. "No loss" still depends on source durability, retention, acknowledgements, and the stated failures.\n- **Exactly-once.** A scoped system makes the committed output appear as if each input affected that output once. This can be implemented with transactions, checkpoints, replayable sources, idempotent sinks, or coordinated offsets. It does not automatically cover external APIs or every upstream and downstream system.\n\nKafka transactions can atomically publish output records and consumed offsets for a Kafka-to-Kafka read-process-write path when producers, consumers, isolation, and broker configuration participate. Flink documents end-to-end exactly-once as requiring replayable sources and transactional or idempotent sinks. For any design, enumerate every side effect and verify recovery with failure injection.',
      keyTakeaway:
        "A processing guarantee is valid only for the named source, state, sink, configuration, and failure model.",
    },
    {
      id: "s5c",
      title: "Select a streaming engine",
      readTimeMinutes: 3,
      content:
        'Engine capabilities and defaults change. Compare the exact supported version and connectors against a reproducible workload:\n\n| Decision | Evidence |\n|---|---|\n| Processing mode | How records or micro-batches are scheduled, and which APIs change by mode |\n| State | Size, backend, checkpoint duration, recovery time, rescaling, and schema evolution |\n| Event time | Watermark generation, idle inputs, windows, joins, timers, and late-data updates |\n| Guarantees | Source replay, state semantics, sink participation, offset commits, and failure tests |\n| Latency and throughput | Measured percentiles under normal load, backpressure, checkpointing, and recovery |\n| Operations | Deployment, upgrades, savepoints/checkpoints, observability, cost, and team ownership |\n\nCurrent official documentation describes Spark Structured Streaming\'s default micro-batch mode and separate continuous-processing behavior with different guarantees; Flink likewise distinguishes state guarantees from end-to-end sink guarantees. Do not reduce either product to a fixed latency band or a single "exactly-once" label.',
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Three questions on what you just read.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- **Choose event or processing time from the business rule and timestamp quality.** Test delayed, duplicated, and out-of-order input.\n- **A watermark is an event-time progress policy, not proof of completeness.** Define late-data revision, retention, and consumer behavior explicitly.\n- **Scope delivery guarantees.** Name source replay, state, sink, configuration, and failure model; test each external side effect.\n- **Select engines from current versioned capabilities and measured workloads.** Product names do not imply latency or processing guarantees.\n- **Kafka partitions bound active consumers in one group for that topic.** Increasing the count can remap later keyed records; plan migration and ordering accordingly.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Compacted topic**, a Kafka topic where background compaction retains at least the latest value for each key, subject to segment, tombstone, and retention behavior. Older records are not removed immediately.\n- **ISR**, in-sync replicas according to broker rules. Producer acknowledgements, replication settings, leader election, and failure assumptions jointly determine durability.\n- **At-most-once**, a scoped policy that can omit effects after uncertain failure while avoiding replay within that scope.\n- **At-least-once**, retries can repeat effects; idempotency needs a stable operation identity and a sink rule.\n- **Exactly-once**, a scoped committed-output property requiring participating source, processing state, sink, and configuration.\n- **Backpressure**, downstream capacity limits propagate or accumulate according to the broker and processing topology; monitor lag, buffers, checkpoints, and source throttling.\n- **Allowed lateness**, an engine-specific policy for retaining state and accepting or revising results after event-time progress passes a boundary.",
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
          "Within one consumer group, one member owns a partition at a time, so four partitions support at most four active owners for that topic. Increasing the count later is supported, but a default key mapping can change for subsequent records. Select and migrate the count from measured throughput, ordering, recovery, broker limits, and operational overhead.",
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
          "The timestamps suggest the event is behind the stated watermark policy, but the result still depends on how the engine generates watermarks, handles idle partitions, retains window state, and treats late events. The design must define whether downstream output is final, revisable, or accompanied by corrections.",
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
          "A session window groups events for a key when consecutive event-time gaps stay within the configured threshold. Closure and later merging depend on watermark and late-data behavior. A fixed tumbling boundary can split one behavioral session.",
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
            a: "Background compaction retains at least the latest value for each key, subject to segment and tombstone rules. It can support rebuilding keyed state, but it is not an immediate or fully constrained table.",
          },
          {
            term: "ISR",
            q: "In-Sync Replicas",
            a: "Replicas considered in sync under broker rules. Producer acks, min.insync.replicas, replication factor, leader election, and the assumed failures together determine durability.",
          },
          {
            term: "At-most-once",
            q: "How is it achieved, and when is it acceptable?",
            a: "If position is committed before the effect, a crash can omit that effect. Use only when the defined loss risk is explicitly acceptable and independently monitored.",
          },
          {
            term: "At-least-once",
            q: "How is it achieved?",
            a: "Committing position after an effect can replay work when failure occurs between the two. Control duplicate effects with a stable identity and sink semantics; source durability and retention still matter.",
          },
          {
            term: "Exactly-once",
            q: "How does Kafka achieve it?",
            a: "For a Kafka-to-Kafka read-process-write path, transactions can atomically publish output and consumed offsets, with participating producers and read-committed consumers. External sinks need their own transactional or idempotent integration.",
          },
          {
            term: "Backpressure",
            q: "What happens when a consumer is slow?",
            a: "A slow consumer can increase broker retention pressure and lag. In a processing topology, downstream limits can fill buffers and propagate toward sources. Monitor the whole path rather than assuming one component remains unaffected.",
          },
          {
            term: "Allowed lateness",
            q: "Window setting",
            a: "An engine-specific policy for how long state remains available and what late events can do after event-time progress passes a window. Downstream consumers must support any revisions the policy emits.",
          },
        ],
      },
    },
  ],
};

export default lesson;
