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
        "Data platforms differ, but one grid inspects them all: **source, log or ingestion, processing, storage, serving, and consumption**. A system may merge layers, skip a durable log or run several stores. The grid is a diagnostic aid and prescribes no architecture.\n\nFor every dataset, note where it originates, which transformations change it, where durable copies live, which interface serves it and who consumes it. That trace shows ownership, replay limits and where a wrong value entered.",
    },
    {
      id: "s2",
      title: "Watch one event flow",
      readTimeMinutes: 2,
      content:
        "A mobile client creates a `$48.90` order that ends up in an operations report. The interactive model traces that path through six possible layers on fixed sample events. It shows hand-offs and backpressure and does not measure production throughput.",
    },
    {
      id: "s3",
      title: "What each layer is for",
      readTimeMinutes: 3,
      content:
        "A layer earns its place only when it changes the data's shape, durability, ownership, or access contract.\n\n1. **Source.** Where an event is born or mutable state lives: an application database, device, sensor or external API. Its schema and retention limit what a recovery can rebuild.\n2. **Log or ingestion.** An optional durable hand-off between producers and consumers. A partitioned log can offer per-partition ordering, retention, replay and fan-out; configuration and producer discipline decide which you get.\n3. **Processing.** Filters, validates, enriches, joins, aggregates or windows data. A batch job knows where its input ends; a stream job does not.\n4. **Storage.** Holds raw or modeled data. Object stores, table formats and managed warehouses differ in transactions, retention, governance and query behavior.\n5. **Serving.** Delivers data for one access pattern and latency target: analytical SQL, keyed lookup, search, feature retrieval or an API. Measured workload targets pick the implementation.\n6. **Consumption.** Dashboards, alerts, models, billing, fraud controls and product features. Their correctness and freshness needs push back into every upstream contract.\n\nIn a design review, draw only the layers the problem needs, and put ordering, retention, schema, latency and failure behavior on every arrow.",
    },
    {
      id: "s4",
      title: "Two forces",
      readTimeMinutes: 2,
      content:
        "Two tensions come up in every review, and neither is a switch.\n\n- **Latency, throughput, and cost.** Transactional stores usually optimize keyed reads and writes, analytical stores scans and aggregation. Processing and serving bridge the two under a stated freshness objective.\n- **Validation before or after landing.** Schema-on-write rejects records that break the write contract. Schema-on-read leaves some interpretation to readers and still needs ingestion checks, metadata and quarantine rules.\n\nChoose batch or streaming by required freshness, replay model, operating cost and failure recovery. Choose ETL or ELT by security boundaries, source constraints, governance and where a transformation may safely run.",
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
        "- **OLTP**, Online Transactional Processing: keyed reads and writes on current application state.\n- **OLAP**, Online Analytical Processing: scans and aggregation, often columnar.\n- **ETL vs ELT**, transform before loading, or land first and transform in the target. Neither order buys replayability, security or lower cost.\n- **Bronze / Silver / Gold**, medallion names for successive data-quality layers. Your team writes the contract for each.\n- **Lakehouse**, object-store data managed through a table format.\n- **Schema on read vs write**, two points where a data contract can be enforced.",
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
          "The derived stores are lost. A retained log holds every accepted change in the recovery window, with stable keys and schemas. Which layer do you replay from?",
        options: [
          "The source databases, where the truth lives.",
          "The log, which holds the complete retained change history.",
          "The warehouse, which has the cleanest data.",
          "The dashboards, which people actually use.",
        ],
        correct: 1,
        explanation:
          "Under these assumptions the log rebuilds derived stores within its retention window. Omitted events, drifting keys or schemas, expired retention or unlogged side effects break that, so a recovery claim names those limits.",
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
          'An analyst asks: "How many users from each country bought something in the last 24 hours?" Which layer answers, and which should she not hit directly?',
        options: [
          "Query the source Postgres directly; it has the freshest data.",
          "Hit the Kafka log; it is the source of truth.",
          "An analytical serving path; hitting the source DB needs a measured case.",
          "Ask an engineer to export a CSV.",
        ],
        correct: 2,
        explanation:
          "A broad aggregation on the transactional database eats connections, CPU, memory, cache and I/O the application needs, even without row locks. An analytical serving path isolates it; bounded operational reads with measured impact can stay on OLTP.",
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
            a: "Tuned for transactional reads and writes on current application state. A broad analytical scan competes for its connections, CPU, memory and I/O.",
          },
          {
            term: "OLAP",
            q: "Online Analytical Processing",
            a: "Tuned for analytical scans and aggregation. Storage layout, execution model, concurrency and workload isolation decide the real performance.",
          },
          {
            term: "ETL vs ELT",
            q: "Why do we say ELT now?",
            a: "ETL transforms before loading, ELT lands data first and transforms in the target. Pick by security boundaries, source constraints, replay needs, governance and cost.",
          },
          {
            term: "Bronze / Silver / Gold",
            q: "The medallion architecture",
            a: "Names for successive data-quality layers. You define contract, ownership, retention and allowed transformations per layer; the labels supply none of it.",
          },
          {
            term: "Lakehouse",
            q: "What does it describe?",
            a: "Object-store files under a table format that can add snapshots, transactions, schema evolution and planning metadata. Format, catalog, engine and configuration decide what you get.",
          },
          {
            term: "Schema on read vs write",
            q: "Where is the contract enforced?",
            a: "Schema-on-write validates before acceptance; schema-on-read leaves some interpretation to readers. Reliable platforms enforce contracts at several points.",
          },
        ],
      },
    },
  ],
};

export default lesson;
