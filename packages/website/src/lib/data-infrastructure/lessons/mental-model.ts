// Ported from data-infrastructure/lessons/01-mental-model.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("mental-model");

const lesson: DataInfraLesson = {
  id: "mental-model",
  number: 1,
  title: "The Stack, Top to Bottom",
  subtitle: "Source → log → lake → warehouse → mart",
  durationMinutes: 12,
  trackId: "foundations",
  hook: "Trace data from source to consumer, then state the contract at each boundary.",
  keyConcepts: [
    "Source",
    "Log",
    "Processing",
    "Storage",
    "Serving",
    "Consumption",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "A six-layer reference model",
      readTimeMinutes: 2,
      content:
        "Data platforms vary, but a six-layer reference model makes their boundaries easier to inspect: **source, log or ingestion, processing, storage, serving, and consumption**. A system may combine layers, omit a durable log, or use several stores. The model is a diagnostic aid, not a required architecture.\n\nFor each dataset, record where it originates, which transformations change it, where durable copies exist, which interface serves it, and who consumes the result. That trace identifies ownership, replay limits, and the point at which an incorrect value entered the system.",
    },
    {
      id: "s2",
      title: "Watch one event flow",
      readTimeMinutes: 2,
      content:
        "Consider a `$48.90` order created by a mobile client and later included in an operations report. The interactive model traces that example through six possible layers. Its animation uses fixed sample events; it demonstrates hand-offs and backpressure, not production throughput.",
    },
    {
      id: "s3",
      title: "What each layer is for",
      readTimeMinutes: 3,
      content:
        "A layer earns its place when it changes the data's shape, durability, ownership, or access contract.\n\n1. **Source.** The system that records an event or owns mutable state: an application database, device, sensor, or external API. Its schema and retention policy define what downstream recovery can reconstruct.\n2. **Log or ingestion.** An optional durable hand-off between producers and consumers. Partitioned logs can provide ordered records within a partition, retention, replay, and fan-out; those properties depend on configuration and producer discipline.\n3. **Processing.** Filters, validates, enriches, joins, aggregates, or windows data. Batch jobs operate on bounded input. Stream jobs operate on input that is treated as unbounded.\n4. **Storage.** Retains raw or modeled data. Object stores, table formats, and managed warehouses expose different transaction, retention, governance, and query properties.\n5. **Serving.** Presents data for a defined access pattern and latency objective: analytical SQL, keyed lookup, search, feature retrieval, or an API. Measured workload targets determine the implementation.\n6. **Consumption.** Dashboards, alerts, models, billing, fraud controls, and product features use the served result. Their correctness and freshness requirements flow back into every upstream contract.\n\nFor a design review, draw only the layers the problem needs. Annotate each arrow with ordering, retention, schema, latency, and failure behavior instead of treating tool names as the design.",
      keyTakeaway:
        "A layer is justified by a specific change in shape, durability, ownership, or access contract.",
    },
    {
      id: "s4",
      title: "Two forces",
      readTimeMinutes: 2,
      content:
        "Two recurring design tensions are useful, but neither is a binary choice:\n\n- **Latency, throughput, and cost.** Transactional stores often optimize keyed reads and writes; analytical stores often optimize scans and aggregation. Processing and serving layers bridge those access patterns under an explicit freshness objective.\n- **Validation before or after landing.** Schema-on-write rejects records that violate the write contract. Schema-on-read defers some interpretation to readers, but still needs ingestion validation, metadata, and quarantine rules if the data matters.\n\nChoose batch or streaming from the required freshness, replay model, operational cost, and failure recovery. Choose ETL or ELT from security boundaries, source constraints, governance, and where transformations can be executed safely.",
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s6",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **OLTP**, Online Transactional Processing: systems optimized for transactional reads and writes, commonly keyed operations over current application state. Large analytical scans may compete with that workload.\n- **OLAP**, Online Analytical Processing: systems optimized for analytical scans and aggregation, often using columnar execution and storage.\n- **ETL vs ELT**, ETL transforms before loading into the target; ELT lands data before transforming it in the target platform. Neither order guarantees replayability, security, or lower cost; retention and controls must be designed explicitly.\n- **Bronze / Silver / Gold**, a medallion-style naming convention for successive data-quality layers. Teams must define the contract of each layer rather than rely on the labels.\n- **Lakehouse**, object-store data managed through a table format that can add snapshots, transactions, schema evolution, and query-planning metadata. Exact capabilities depend on the format, catalog, engine, and configuration.\n- **Schema on read vs write**, two points at which a data contract can be enforced. Production systems often combine ingestion checks, stored schemas, and reader validation.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "Which layer rebuilds the others?",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A retained event log contains every accepted change for the recovery window, with stable keys and schemas. If derived stores are lost, which layer provides the best replay source?",
        options: [
          "The source databases, they're where the truth lives.",
          "The log, because this scenario explicitly gives it complete retained change history.",
          "The warehouse, it has the cleanest data.",
          "The dashboards, that's what people actually use.",
        ],
        correct: 1,
        explanation:
          "Under the stated assumptions, the retained log can replay derived stores for its retention window. That conclusion does not apply when events are omitted, keys or schemas are unstable, retention has expired, or external side effects are not represented. Recovery claims must name those boundaries.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Where does this query live?",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'Marketing wants to know: "How many users from each country bought something in the last 24 hours?" Which layer should answer this, and which layer should they not hit directly?',
        options: [
          "They should query the source Postgres directly. It has the freshest data.",
          "They should hit the Kafka log. It's the source of truth.",
          "Use an analytical serving path for this broad aggregation; direct source-DB access requires a separately measured operational case.",
          "They should ask an engineer to export a CSV.",
        ],
        correct: 2,
        explanation:
          "A large aggregation on the transactional database can consume connections, CPU, memory, cache, and I/O needed by the application, even when the query does not lock rows. A separate analytical serving path isolates that workload. Direct OLTP queries can still be reasonable for bounded operational reads with measured impact.",
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
            term: "OLTP",
            q: "Online Transactional Processing",
            a: "Systems optimized for transactional reads and writes over current application state. Broad analytical scans can compete with latency-sensitive connections, CPU, memory, and I/O.",
          },
          {
            term: "OLAP",
            q: "Online Analytical Processing",
            a: "Systems optimized for analytical scans and aggregation. Storage layout, execution model, concurrency, and workload isolation determine actual performance.",
          },
          {
            term: "ETL vs ELT",
            q: "Why do we say ELT now?",
            a: "ETL transforms before loading into the target. ELT lands data before transforming it there. Choose from security boundaries, source constraints, replay needs, governance, and execution cost.",
          },
          {
            term: "Bronze / Silver / Gold",
            q: "The medallion architecture",
            a: "A naming convention for successive data-quality layers. Define the contract, ownership, retention, and allowed transformations of each layer; the labels do not supply those properties.",
          },
          {
            term: "Lakehouse",
            q: "What does it describe?",
            a: "Object-store files managed through a table format that can add snapshots, transactions, schema evolution, and planning metadata. Capabilities depend on the format, catalog, engine, and configuration.",
          },
          {
            term: "Schema on read vs write",
            q: "Where is the contract enforced?",
            a: "Schema-on-write validates against a contract before acceptance. Schema-on-read defers some interpretation to readers. Reliable platforms commonly enforce contracts at several points.",
          },
        ],
      },
    },
  ],
};

export default lesson;
