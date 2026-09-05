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
        "No two data platforms look alike. One grid still inspects all of them: **source, log or ingestion, processing, storage, serving, and consumption**. A system may fold layers together, skip a durable log, or run several stores. The grid is a diagnostic aid, not a required architecture.\n\nFor every dataset, write down where it originates, which transformations change it, where durable copies live, which interface serves it, and who consumes the result. That trace names ownership, replay limits, and the point where a wrong value entered the system.",
    },
    {
      id: "s2",
      title: "Watch one event flow",
      readTimeMinutes: 2,
      content:
        "A mobile client creates a `$48.90` order. It lands in an operations report. What happens in between? The interactive model traces that path through six possible layers on fixed sample events. It shows hand-offs and backpressure, not production throughput.",
    },
    {
      id: "s3",
      title: "What each layer is for",
      readTimeMinutes: 3,
      content:
        "A layer earns its place only when it changes the data's shape, durability, ownership, or access contract.\n\n1. **Source.** Where an event is born or mutable state lives: an application database, device, sensor, or external API. Its schema and retention decide what a later recovery can rebuild.\n2. **Log or ingestion.** An optional durable hand-off between producers and consumers. A partitioned log can offer ordering within a partition, retention, replay, and fan-out; configuration and producer discipline decide which of those you get.\n3. **Processing.** Filters, validates, enriches, joins, aggregates, or windows data. A batch job knows where its input ends. A stream job does not.\n4. **Storage.** Holds raw or modeled data. Object stores, table formats, and managed warehouses differ in transactions, retention, governance, and query behavior.\n5. **Serving.** Delivers data for one access pattern and one latency target: analytical SQL, keyed lookup, search, feature retrieval, or an API. Measured workload targets pick the implementation.\n6. **Consumption.** Dashboards, alerts, models, billing, fraud controls, and product features consume the served result. What they need in correctness and freshness pushes back into every upstream contract.\n\nIn a design review, draw only the layers the problem needs. Put ordering, retention, schema, latency, and failure behavior on every arrow. A list of product names is not a design.",
      keyTakeaway:
        "A layer is justified by one concrete change in shape, durability, ownership, or access contract.",
    },
    {
      id: "s4",
      title: "Two forces",
      readTimeMinutes: 2,
      content:
        "Two tensions surface in every review. Neither is a switch.\n\n- **Latency, throughput, and cost.** Transactional stores usually optimize keyed reads and writes; analytical stores usually optimize scans and aggregation. Processing and serving bridge those access patterns under a stated freshness objective.\n- **Validation before or after landing.** Schema-on-write rejects records that violate the write contract. Schema-on-read defers some interpretation to readers, and still needs ingestion validation, metadata, and quarantine rules when the data matters.\n\nBatch or streaming? Decide from required freshness, replay model, operational cost, and failure recovery. ETL or ELT? Decide from security boundaries, source constraints, governance, and where a transformation may safely run.",
    },
    {
      id: "s5",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on the six layers.",
    },
    {
      id: "s6",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **OLTP**, Online Transactional Processing: systems tuned for transactional reads and writes, usually keyed operations over current application state. A large analytical scan competes with that workload.\n- **OLAP**, Online Analytical Processing: systems tuned for analytical scans and aggregation, often columnar in storage and execution.\n- **ETL vs ELT**, ETL transforms before loading into the target; ELT lands data before transforming it in the target platform. Neither order buys replayability, security, or lower cost; retention and controls stay your design work.\n- **Bronze / Silver / Gold**, a medallion-style naming convention for successive data-quality layers. The label carries no contract. Your team writes one per layer.\n- **Lakehouse**, object-store data managed through a table format that can add snapshots, transactions, schema evolution, and query-planning metadata. Format, catalog, engine, and configuration decide what you actually get.\n- **Schema on read vs write**, two points at which a data contract can be enforced. Production systems usually combine ingestion checks, stored schemas, and reader validation.",
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
          "A retained event log holds every accepted change for the recovery window, with stable keys and schemas. The derived stores are gone. Which layer is the best replay source?",
        options: [
          "The source databases, they're where the truth lives.",
          "The log, because this scenario explicitly gives it complete retained change history.",
          "The warehouse, it has the cleanest data.",
          "The dashboards, that's what people actually use.",
        ],
        correct: 1,
        explanation:
          "Under the stated assumptions, the retained log replays derived stores for its retention window. That stops being true when events are omitted, keys or schemas drift, retention has expired, or external side effects are not represented. A recovery claim has to name those boundaries.",
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
          'A marketing analyst asks: "How many users from each country bought something in the last 24 hours?" Which layer should answer that, and which layer should she not hit directly?',
        options: [
          "Query the source Postgres directly. It has the freshest data.",
          "Hit the Kafka log. It's the source of truth.",
          "Use an analytical serving path for this broad aggregation; direct source-DB access requires a separately measured operational case.",
          "Ask an engineer to export a CSV.",
        ],
        correct: 2,
        explanation:
          "A large aggregation on the transactional database consumes connections, CPU, memory, cache, and I/O the application needs, even when the query locks no rows. A separate analytical serving path isolates that workload. Direct OLTP queries stay reasonable for bounded operational reads with measured impact.",
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
            a: "Systems tuned for transactional reads and writes over current application state. A broad analytical scan competes for latency-sensitive connections, CPU, memory, and I/O.",
          },
          {
            term: "OLAP",
            q: "Online Analytical Processing",
            a: "Systems tuned for analytical scans and aggregation. Storage layout, execution model, concurrency, and workload isolation decide the real performance.",
          },
          {
            term: "ETL vs ELT",
            q: "Why do we say ELT now?",
            a: "ETL transforms before loading into the target. ELT lands data before transforming it there. Pick from security boundaries, source constraints, replay needs, governance, and execution cost.",
          },
          {
            term: "Bronze / Silver / Gold",
            q: "The medallion architecture",
            a: "A naming convention for successive data-quality layers. You define the contract, ownership, retention, and allowed transformations per layer. The labels supply none of that.",
          },
          {
            term: "Lakehouse",
            q: "What does it describe?",
            a: "Object-store files managed through a table format that can add snapshots, transactions, schema evolution, and planning metadata. Format, catalog, engine, and configuration decide the capabilities.",
          },
          {
            term: "Schema on read vs write",
            q: "Where is the contract enforced?",
            a: "Schema-on-write validates against a contract before acceptance. Schema-on-read defers some interpretation to readers. Reliable platforms enforce contracts at several points.",
          },
        ],
      },
    },
  ],
};

export default lesson;
