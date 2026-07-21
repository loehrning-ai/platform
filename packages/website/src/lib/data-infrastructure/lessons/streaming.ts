// Ported from data-infrastructure/lessons/08-streaming.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("streaming");

const lesson: DataInfraLesson = {
  id: "streaming",
  number: 8,
  title: "Streaming: Kafka, Watermarks, Windows",
  subtitle: "Partitions · groups · event time",
  durationMinutes: 15,
  trackId: "movement",
  hook: "Why event time ≠ processing time, and how watermarks let you reason about late data.",
  keyConcepts: ["Event time vs processing time", "Watermark", "Window types", "Delivery semantics", "Flink vs Spark SS"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Two clocks",
      readTimeMinutes: 2,
      content:
        "Streaming systems compute over *unbounded* input. There is no \"end of file.\" The consumer must produce useful answers continuously, with bounded latency, while new data keeps arriving, and arriving out-of-order, and arriving late, and sometimes never arriving at all.\n\nThe whole field is engineered around two clocks that disagree: **event time** (when the thing happened in the real world, encoded in the event) and **processing time** (when your system saw it). They diverge constantly. A user's phone goes offline at 14:32, queues 200 events, comes back online at 14:47 and uploads them all at once. Event time of those events: 14:32. Processing time: 14:47. Your stream job has to choose which one to use, and the choice is almost always event time.",
    },
    {
      id: "s2",
      title: "Kafka, in 5 min",
      readTimeMinutes: 3,
      content:
        "Five concepts fit on the back of a napkin:\n\n- **Topic**, a named append-only log. `orders`, `page_views`.\n- **Partition**, a topic is split into N partitions; each partition is an independent ordered log. Ordering is per-partition, not per-topic.\n- **Producer**, writes records to a topic. Picks a partition by hashing a key, or round-robin if no key.\n- **Consumer group**, a set of consumer processes that share the work of reading a topic. Kafka assigns each partition to exactly one consumer in the group. Add consumers, work spreads, up to the partition count, after which extra consumers idle.\n- **Offset**, each consumer group remembers where it last read in each partition. Read is non-destructive; rewinding to an old offset replays history.\n\nThe two interview gotchas: (1) *Partition count is the parallelism cap.* If you'll ever want 100 consumers, create at least 100 partitions up front, increasing later breaks key-to-partition mappings. (2) *Ordering is per-key, not global.* Two events for `user_id=42` always land in the same partition, so they're ordered. Two events for different users may interleave.",
    },
    {
      id: "s3",
      title: "Event vs processing time",
      readTimeMinutes: 3,
      content:
        "Imagine a \"count of events per minute\" job. At 14:35 (processing time) you see an event with event-time 14:32. Does it count toward the **14:32 bucket** (event time) or the **14:35 bucket** (processing time)? Almost always you want event time, that's what business users mean. But event time is hard, because you don't know when the event-time minute is \"complete.\" An event for 14:32 might still arrive at 14:50.\n\nThis is what **watermarks** exist to solve. A watermark is the system's promise: *\"I think I've seen all events with event-time ≤ T.\"* When the watermark passes 14:33, the engine emits the result for the 14:32 minute and assumes it's done. Late data that arrives after the watermark is either dropped, sent to a dead-letter, or triggers a \"late update\" that revises the result.",
    },
    {
      id: "s4",
      title: "Watermark visualization",
      readTimeMinutes: 2,
      content:
        "Watermark slack is a real knob. Set it tight (1 second behind max event time): low latency, lots of late data dropped. Set it loose (5 minutes behind): few drops, but every result is 5 minutes late. Production systems usually pick something tied to the p99 of observed lateness, and accept a 0.1% drop rate as the cost of timeliness.",
    },
    {
      id: "s5",
      title: "Window types",
      readTimeMinutes: 2,
      content:
        "| Window | Shape | Use for |\n|---|---|---|\n| Tumbling | Fixed, non-overlapping (every minute, every hour) | \"events per minute\" |\n| Hopping (Sliding) | Fixed, overlapping (every 30s, sized 5min) | moving averages, smooth dashboards |\n| Session | Variable, gap-based (closes after T seconds of inactivity) | user sessions, IoT bursts |\n| Global | One window forever; uses custom triggers | running totals with manual flush |",
    },
    {
      id: "s5b",
      title: "Delivery semantics",
      readTimeMinutes: 3,
      content:
        "Every streaming system makes a promise about what happens when something fails. The three levels, in ascending complexity:\n\n- **At-most-once.** Each message is delivered zero or one times. If the consumer crashes after reading but before processing, the message is lost. The consumer advances its offset before processing. Simplest, but data loss is possible. Acceptable only for non-critical metrics (e.g. approximate page-view counters where loss is tolerable).\n- **At-least-once.** Each message is delivered one or more times. The consumer commits its offset only after successfully processing. On crash and restart, unacked messages are redelivered. No data loss, but duplicates are possible. The consumer must be idempotent. This is the default for most Kafka consumers and most streaming frameworks out of the box.\n- **Exactly-once.** Each message is processed exactly once, with no duplicates and no loss. Hard to achieve in a distributed system. Kafka provides the building blocks: (a) idempotent producers (sequence numbers prevent broker-side duplicate writes), (b) transactional producers (atomic multi-partition writes), (c) read-committed consumers (only see committed transactions). Together these form the \"exactly-once semantics\" (EOS) API, but both producer and consumer must participate.\n\n\"Exactly-once\" in streaming usually means \"effectively exactly-once\", the output is as-if each message was processed once, even if it was actually processed multiple times and later deduplicated. True end-to-end exactly-once requires every component (source, stream processor, sink) to participate. In practice, at-least-once + idempotent sink is the pragmatic choice for most production systems.",
      keyTakeaway:
        "At-least-once plus an idempotent sink achieves the same observable result as full exactly-once, at much lower system complexity.",
    },
    {
      id: "s5c",
      title: "Flink vs Spark SS",
      readTimeMinutes: 3,
      content:
        "Two engines dominate production streaming in 2026. Both are mature and capable; the right choice depends on your latency target, team skillset, and existing infrastructure.\n\n| | Apache Flink | Spark Structured Streaming |\n|---|---|---|\n| Processing model | True streaming (record-by-record, pipeline-based) | Micro-batch (small batches at a configured trigger interval) |\n| Latency | Sub-second (milliseconds possible) | Seconds (micro-batch interval, typically 1-30s) |\n| State management | First-class: RocksDB-backed, incremental checkpoints, queryable state | Managed via Spark's structured state store; less flexible for complex stateful ops |\n| Exactly-once | Native EOS via checkpoints + 2-phase commit to sinks | EOS via WAL + idempotent sinks; depends on sink support |\n| Event time / watermarks | First-class, per-operator watermarks, flexible late-data handling | Watermark support in Structured Streaming; less expressive than Flink for complex patterns |\n| Ecosystem fit | Strong for dedicated streaming infrastructure; Confluent Cloud, Kinesis, CDC | Natural for teams already on Spark/Databricks; unified batch+streaming codebase |\n| Sweet spot | Low-latency streaming, complex stateful logic, fraud detection, CEP | Spark shops wanting near-real-time without a separate streaming cluster |\n\nIf latency must be sub-second, or you need complex stateful processing (pattern matching, sessionization, joins across multiple streams), pick Flink. If your team lives in Spark/Databricks and the latency target is >5 seconds, Structured Streaming gets you streaming without paying the operational cost of a separate Flink cluster. Don't pick Flink just because it's \"more real streaming\", it's operationally heavier and the micro-batch model is fine for most analytical use cases.",
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
        "- **Always use event time for business aggregations.** Processing time is non-deterministic, the same event produces different results depending on when it arrived. Event time is what the business means; use it, even though it's harder.\n- **Watermarks are a latency/completeness trade-off knob.** Tight watermark = low latency, more dropped late data. Loose watermark = less dropped data, higher latency on all results. Set to p99 of observed event lateness for your workload.\n- **At-least-once + idempotent sink is usually the right call.** True end-to-end exactly-once requires every component to participate; at-least-once with a deduplicating upsert sink achieves the same observable result at lower complexity.\n- **Flink for sub-second and complex state; Spark Structured Streaming for Spark shops.** Don't over-engineer: the micro-batch model handles most analytical streaming needs.\n- **Kafka partition count is the parallelism ceiling.** You cannot have more active consumers (in a group) than partitions. Size partitions at design time; increasing them later breaks key ordering.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Compacted topic**, a Kafka topic where the broker keeps only the most recent value per key, deleting older versions.\n- **ISR**, in-sync replicas: the replicas of a partition caught up to the leader; `min.insync.replicas` is the durability knob.\n- **At-most-once**, commit offset before processing; a crash loses the in-flight message.\n- **At-least-once**, commit offset after successful processing; redelivery on crash means duplicates are possible, so the consumer must be idempotent.\n- **Exactly-once**, idempotent + transactional producers plus read-committed consumers; both sides must opt in, and the sink must cooperate too.\n- **Backpressure**, in Kafka, lag simply grows; in Flink, slow downstream operators propagate backpressure upstream via the network buffer.\n- **Allowed lateness**, how long after the watermark closes a window the engine still accepts late events, potentially emitting a corrected update.",
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
          "46 of those consumers will be idle. Partition count is the upper bound on consumer-group parallelism, and you can't cleanly increase partition count without breaking key-to-partition consistency.",
          "They need more brokers.",
          "They should use Kinesis.",
        ],
        correct: 1,
        explanation:
          "Each partition is assigned to exactly one consumer per group. With 4 partitions, only 4 consumers can do work. The fix has to come at design time: over-provision partitions. 100-1000 partitions for a high-throughput topic is normal. You can increase partitions later, but it changes which partition a given key hashes to, breaking ordering for already-in-flight keys. Plan up front.",
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
          "Your stream job aggregates \"revenue per minute.\" Watermark is 30 seconds behind max event time. An event with event-time 14:32:15 arrives at 14:34:00 (processing time). What happens?",
        options: [
          "It's included in the 14:32 result.",
          "Depends on policy: drop / dead-letter / late-update. By default most engines drop events past the watermark; the 14:32 window has already been emitted as final.",
          "It's included in the 14:34 result (re-bucketed by processing time).",
          "It triggers a re-computation of all windows.",
        ],
        correct: 1,
        explanation:
          "The event arrived 1m45s after its event time, but the watermark slack was only 30 seconds, so the 14:32 window closed at ~14:32:45 (event-time + slack). By 14:34 the result was already emitted downstream. Default behavior: drop. Configurable behavior: dead-letter for inspection, or \"allowed lateness\" with a re-fire window that emits a corrected late-update result. Picking among these is an SLA decision.",
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
          "You're computing \"user session duration\", a session is a sequence of events with no gap longer than 30 minutes. Which window type fits?",
        options: [
          "Tumbling, every 30 minutes.",
          "Session, with a 30-minute inactivity gap. Tumbling would split a long session across multiple windows; session windows close dynamically when the gap is hit.",
          "Hopping, sized 30 minutes.",
          "Global, with a manual trigger.",
        ],
        correct: 1,
        explanation:
          "Session windows are exactly the right tool. They're per-key (e.g. per user), and the engine maintains an open window that stays alive as long as events keep arriving within the gap. The window closes, and the result is emitted, once watermark - last_event > gap. Tumbling can't do this: a 32-minute session that crosses a tumble boundary becomes two reported sessions.",
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
            a: "A Kafka topic where the broker keeps only the most recent value per key, deleting older versions. Acts like a stream-pretending-to-be-a-table. Good for \"current state of X\" use cases.",
          },
          {
            term: "ISR",
            q: "In-Sync Replicas",
            a: "The replicas of a partition that are caught up to the leader. Writes ack'd by ISR are durable. min.insync.replicas is the durability knob, set ≥ 2 in production.",
          },
          {
            term: "At-most-once",
            q: "How is it achieved, and when is it acceptable?",
            a: "Consumer commits offset before processing. A crash loses the in-flight message. Acceptable only for non-critical, approximate metrics where small data loss is tolerable. Never acceptable for financial data.",
          },
          {
            term: "At-least-once",
            q: "How is it achieved?",
            a: "Consumer commits offset only after successful processing. On crash + restart, unacked messages are redelivered → duplicates possible. Requires an idempotent consumer. Default for most Kafka consumers.",
          },
          {
            term: "Exactly-once",
            q: "How does Kafka achieve it?",
            a: "Three components: (1) idempotent producers (sequence numbers prevent broker duplicate writes), (2) transactional producers (atomic multi-partition writes), (3) read-committed consumers (see only committed transactions). Both producer and consumer must opt in. Sink must also be transactional or idempotent.",
          },
          {
            term: "Backpressure",
            q: "What happens when a consumer is slow?",
            a: "In Kafka the lag grows but the broker is fine, Kafka decouples producer speed from consumer speed. In Flink, slow downstream operators apply backpressure upstream via the network buffer; eventually sources slow.",
          },
          {
            term: "Allowed lateness",
            q: "Window setting",
            a: "How long after the watermark closes a window the engine still accepts late events. Default 0. Setting it to e.g. 5 minutes lets late data emit a \"corrected\" update. Downstream consumers must handle revisions.",
          },
        ],
      },
    },
  ],
};

export default lesson;
