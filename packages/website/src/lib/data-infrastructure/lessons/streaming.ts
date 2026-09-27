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
        "A stream has no end-of-file. Input is *unbounded*, so the system decides when a result is emitted, revised or final enough for a consumer.\n\n**Event time** is when an event occurred according to its source; **processing time** is when an operator saw it. They drift apart because devices buffer, networks retry, queues lag and clocks drift. Use event time when the business rule concerns occurrence and the source timestamp is trustworthy, and processing time when the rule concerns arrival or handling.",
    },
    {
      id: "s2",
      title: "Kafka's core model",
      readTimeMinutes: 3,
      content:
        "- **Topic**, a named sequence of records split into partitions.\n- **Partition**, an ordered log. Kafka orders within a partition, never across a topic.\n- **Producer**, writes records to a partition chosen explicitly, by a partitioner or by client default.\n- **Consumer group**, gives each partition to one member at a time, so partitions cap active parallelism.\n- **Offset**, a record's position in a partition. Replay from committed offsets works only while records stay retained and compatible.\n\nA stable key, partitioner and partition count keep a key's records in one partition. Raise the count and later records can map elsewhere. Size it from measured throughput, per-partition limits, ordering, recovery and operating overhead.",
    },
    {
      id: "s3",
      title: "Event vs processing time",
      readTimeMinutes: 3,
      content:
        "You count events per minute. At processing time 14:35 an event arrives stamped 14:32. Event-time aggregation puts it in the 14:32 window, processing-time aggregation counts it on arrival; the product definition decides which is right.\n\nA **watermark** is the engine's event-time progress signal: it declares that, under a configured or generated policy, much earlier timestamps are no longer expected. It does not prove every earlier event arrived. Past a window boundary, the engine may emit output and then drop, retain, route or revise late events, per its APIs and configuration.",
    },
    {
      id: "s4",
      title: "Choosing a lateness threshold",
      readTimeMinutes: 2,
      content:
        "The watermark model above uses synthetic events and a fixed four-second lateness threshold to show how a threshold shifts on-time and late labels. It is not a production recommendation.\n\nDerive the policy from observed lateness, idle partitions, clock quality, source behavior, allowed state size, revision semantics and consumer SLO. A percentile informs the choice; how much loss or correction is acceptable is a product decision you measure after deployment.",
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
        'Every delivery claim names its boundary, failure model and observable state:\n\n- **At-most-once.** A failure can omit an effect; acknowledged work is not replayed within the scope.\n- **At-least-once.** Retries after uncertain failures can apply a record twice unless the consumer controls duplicates. "No loss" still rests on source durability, retention and acknowledgements.\n- **Exactly-once.** Within a scope, committed output looks as if each input took effect once, through transactions, checkpoints, replayable sources, idempotent sinks or coordinated offsets. External APIs are not covered automatically.\n\nKafka transactions atomically publish output and consumed offsets on a Kafka-to-Kafka read-process-write path when producers, consumers, isolation and brokers all take part. Flink requires replayable sources and transactional or idempotent sinks for end-to-end exactly-once.',
    },
    {
      id: "s5c",
      title: "Select a streaming engine",
      readTimeMinutes: 3,
      content:
        'Engine capabilities and defaults change. Compare the exact version and connectors on a reproducible workload:\n\n| Decision | Evidence |\n|---|---|\n| Processing mode | Record or micro-batch scheduling; APIs per mode |\n| State | Size, backend, checkpoint time, recovery, rescaling, schema evolution |\n| Event time | Watermarks, idle inputs, windows, joins, timers, late updates |\n| Guarantees | Source replay, state semantics, sink participation, offset commits, failure tests |\n| Latency and throughput | Measured percentiles under load, backpressure, checkpoints, recovery |\n| Operations | Deployment, upgrades, savepoints, observability, cost, ownership |\n\nSpark Structured Streaming, for example, defaults to micro-batches and offers a separate continuous mode with other guarantees. Flink likewise separates state guarantees from end-to-end sink guarantees. No engine name implies a latency band or one exactly-once guarantee.',
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
        "- Test with delayed, duplicated and out-of-order input, and inject failures around every external side effect.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Compacted topic**, keeps at least the latest value per key and drops older ones with a delay.\n- **ISR**, replicas in sync under broker rules; with producer acks they set durability.\n- **Backpressure**, downstream limits that slow or pile up upstream work.\n- **Allowed lateness**, how long a window keeps state to accept or revise late events.",
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
          "Nothing; Kafka scales consumers automatically.",
          "Only four consumers work at once; more partitions can later remap keys.",
          "They need more brokers in the cluster.",
          "They should switch to Kinesis.",
        ],
        correct: 1,
        explanation:
          "One group member owns a partition at a time, so four partitions allow four active consumers and 46 stay idle. Adding partitions later works, but keyed records can map differently, so plan an ordering-aware migration.",
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
          'A job sums revenue per minute, watermark 30 seconds behind max event time. An event stamped 14:32:15 arrives at processing time 14:34:00. What happens?',
        options: [
          "It's included in the 14:32 result.",
          "The window and late-data policy decide: drop, route, retain or revise.",
          "It's included in the 14:34 result (re-bucketed by processing time).",
          "It triggers a re-computation of all windows.",
        ],
        correct: 1,
        explanation:
          "The event lands behind the watermark, but watermark generation, idle partitions, state retention and late-event handling decide what the engine does. Your design says whether output is final, revisable or corrected later.",
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
          'You compute "user session duration": a session is a run of events with no gap over 30 minutes. Which window type fits?',
        options: [
          "Tumbling, every 30 minutes.",
          "Session, with a 30-minute inactivity gap.",
          "Hopping, sized 30 minutes.",
          "Global, with a manual trigger.",
        ],
        correct: 1,
        explanation:
          "A session window stays open per key while event-time gaps stay under the threshold, and closes by watermark. A tumbling boundary splits a 32-minute session into two.",
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
            a: "Compaction keeps at least the latest value per key and removes old values with a delay. It supports rebuilding keyed state.",
          },
          {
            term: "ISR",
            q: "In-Sync Replicas",
            a: "Replicas in sync under broker rules. Producer acks, min.insync.replicas, replication factor, leader election and assumed failures together decide durability.",
          },
          {
            term: "At-most-once",
            q: "How is it achieved, and when is it acceptable?",
            a: "Commit the position before the effect; a crash can then omit it. Use it only when someone accepts and monitors that loss risk.",
          },
          {
            term: "At-least-once",
            q: "How is it achieved?",
            a: "Commit the position after the effect; a failure in between replays work. Control duplicates with a stable identity and sink semantics.",
          },
          {
            term: "Exactly-once",
            q: "How does Kafka achieve it?",
            a: "On a Kafka-to-Kafka path, transactions publish output and consumed offsets atomically for read-committed consumers. External sinks need their own transactional or idempotent integration.",
          },
          {
            term: "Backpressure",
            q: "What happens when a consumer is slow?",
            a: "Lag and broker retention pressure grow. In a processing topology, downstream limits fill buffers and propagate toward the sources, so monitor the whole path.",
          },
          {
            term: "Allowed lateness",
            q: "Window setting",
            a: "How long a window keeps state after the watermark passes, and whether late events still count. Consumers must handle the revisions it emits.",
          },
        ],
      },
    },
  ],
};

export default lesson;
