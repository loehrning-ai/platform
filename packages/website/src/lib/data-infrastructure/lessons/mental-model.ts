// Ported from data-infrastructure/lessons/01-mental-model.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("mental-model");

const lesson: DataInfraLesson = {
  id: "mental-model",
  number: 1,
  title: "The Stack, Top to Bottom",
  subtitle: "Source → log → lake → warehouse → mart",
  durationMinutes: 12,
  trackId: "foundations",
  hook: "Where bytes live, why they live there, and what each layer is actually for.",
  keyConcepts: ["Source", "Log", "Processing", "Storage", "Serving", "Consumption"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "The six-layer truth",
      readTimeMinutes: 2,
      content:
        "Open any data-engineering job description, any system-design interview, any \"modern data stack\" diagram from a vendor selling you something. Squint. They are all the same shape. Six layers, top to bottom.\n\nYou will hear different names for them: **Bronze, silver, gold.** **OLTP, OLAP, DWH, mart.** **Source, ingest, transform, store, serve.** The vocabularies differ; the geometry doesn't. Bytes are born somewhere. They flow into a log. Something processes them. They land in storage. A query engine answers questions about them. A human or a model finally consumes the answer.\n\nThe trick to thinking like an IC5 is to hold this whole picture in your head at once — and to know, for any byte in the system, *what layer it is in and why*. Lose track of that and you'll spend your career debugging \"the data is wrong\" tickets that have nothing to do with your code.",
    },
    {
      id: "s2",
      title: "Watch one event flow",
      readTimeMinutes: 2,
      content:
        "A single click on a checkout button — say a `$48.90` order from Brazil — has to make it from a phone all the way to the dashboard a VP looks at on Monday. It crosses every one of the six layers below. The simulator lets you trace a single event, burst ten at once, or storm the pipeline to see production-scale throughput.",
    },
    {
      id: "s3",
      title: "What each layer is for",
      readTimeMinutes: 3,
      content:
        "Each layer exists because the layer below it has the wrong shape for the layer above. That sentence is the entire field, compressed.\n\n1. **Source.** Where bytes are born. App backends writing to Postgres, mobile clients firing analytics events, IoT sensors, third-party webhooks. The schema here is whatever the engineer who shipped the feature picked on a Tuesday. *Optimised for: write throughput, transactional correctness.*\n2. **Log.** An ordered, durable, partitioned, append-only record of everything that happened. Kafka, Kinesis, Pub/Sub. The cleanest abstraction in the whole stack — it decouples producers from consumers in time and space. If the log is healthy, every other layer can be rebuilt. *Optimised for: linear writes, replay, fan-out.*\n3. **Processing.** Where shape changes. Filter, enrich, aggregate, join, window. Spark, Flink, and Beam all live here. The hard distinction is *batch* (jobs over bounded data) vs *stream* (jobs over unbounded data) — same algebra, different runtime.\n4. **Storage.** Bytes that survive the next deploy. Object stores (S3, GCS) for the bulk; open table formats (Iceberg, Delta) for ACID; warehouses (Snowflake, BigQuery) for managed query. *Optimised for: cheap-per-GB, columnar scans, durability.*\n5. **Serving.** Sub-second answers. OLAP engines for BI, vector stores for ML retrieval, key-value stores for online features, search indexes for \"find me X.\" Different shapes for different read patterns.\n6. **Consumption.** Dashboards, alerts, ML model inputs, billing systems, fraud rules. The whole point — the reason any of the lower layers exist.\n\n**The interview move.** When asked to \"design X data system,\" start by drawing this six-layer skeleton on the board, then mark which layers the question is actually about. Most questions live in 2-3 layers; the others are obvious.",
      keyTakeaway:
        "Every layer exists because the layer below has the wrong shape for the layer above — name the layer, name the shape mismatch it fixes.",
    },
    {
      id: "s4",
      title: "Two forces",
      readTimeMinutes: 2,
      content:
        "Every data layer is the result of two forces fighting:\n\n- **Latency vs throughput.** Source systems are tuned for low-latency single-row writes. Storage layers are tuned for high-throughput columnar scans. The gap between them is why processing layers exist.\n- **Schema-on-write vs schema-on-read.** Postgres demands a declared schema before an insert. A data lake lets you dump JSON now and figure out the columns later. Both have a cost; the cost is just paid at different times.\n\nWhen someone asks \"should this be a stream or a batch job?\" — they're asking which side of the latency/throughput spectrum the answer needs to be on. When someone asks \"should we ETL or ELT?\" — they're asking when to pay the schema tax.",
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
        "- **OLTP** — Online Transactional Processing: the source-layer DBs that power a product. Tuned for many small writes and key-lookups. Postgres, MySQL, DynamoDB. Bad at large scans.\n- **OLAP** — Online Analytical Processing: the serving-layer engines for analytics. Tuned for columnar scans over huge tables. Snowflake, BigQuery, Trino, ClickHouse.\n- **ETL vs ELT** — ETL (extract → transform → load) pays the transform cost *before* landing in the warehouse. ELT (extract → load → transform) dumps raw into the warehouse and transforms in-place using its compute. ELT won because warehouses got cheap.\n- **Bronze / Silver / Gold** — the medallion architecture, a naming convention from Databricks. Bronze = raw landed data. Silver = cleaned, deduped, conformed. Gold = aggregated, business-ready.\n- **Lakehouse** — a \"lake\" + \"warehouse\" hybrid: cheap object-store files (Parquet on S3) wrapped in a table format (Iceberg/Delta) that gives ACID, time-travel, and schema evolution — the things lakes used to lack.\n- **Schema on read vs write** — schema-on-write (Postgres) declares structure upfront and rejects violations. Schema-on-read (a lake) accepts whatever is written and lets the reader interpret it. Rigour traded for flexibility.",
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
          'A junior asks: "If we lost everything except one of the six layers, which one would let us rebuild the most of the rest?" What\'s the right answer — and why?',
        options: [
          "The source databases — they're where the truth lives.",
          "The log — it's the ordered record of everything that happened.",
          "The warehouse — it has the cleanest data.",
          "The dashboards — that's what people actually use.",
        ],
        correct: 1,
        explanation:
          "The log is the canonical history. Source DBs only hold current state — you can't reconstruct yesterday's rows from today's table. The warehouse is downstream of transformations that may be lossy. Dashboards are aggregations of aggregations. The log is the only layer where every event lives, in order, durable. This is why \"Kafka as the source of truth\" is a legitimate architecture.",
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
          'Marketing wants to know: "How many users from each country bought something in the last 24 hours?" Which layer should answer this — and which layer should they not hit directly?',
        options: [
          "They should query the source Postgres directly. It has the freshest data.",
          "They should hit the Kafka log. It's the source of truth.",
          "They should query the serving layer (warehouse / OLAP). The source DB shouldn't be touched by analytics.",
          "They should ask an engineer to export a CSV.",
        ],
        correct: 2,
        explanation:
          "Hitting production OLTP for analytics is a classic failure mode — long-running aggregation queries lock rows, hold connections, and degrade the actual product. That's why the storage/serving layers exist: cheap, columnar, isolated from the write path. The whole stack downstream of the source exists precisely so analytics never touches the OLTP DB.",
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "flash",
        copy: DATA_INFRA_FLASHCARDS_COPY,
        cards: [
          {
            term: "OLTP",
            q: "Online Transactional Processing",
            a: "The source-layer DBs that power your product. Tuned for many small writes and key-lookups. Postgres, MySQL, DynamoDB. Bad at large scans.",
          },
          {
            term: "OLAP",
            q: "Online Analytical Processing",
            a: "The serving-layer engines for analytics. Tuned for columnar scans over huge tables. Snowflake, BigQuery, Trino, ClickHouse.",
          },
          {
            term: "ETL vs ELT",
            q: "Why do we say ELT now?",
            a: "ETL (extract → transform → load) means you pay the transform cost before landing in the warehouse. ELT (extract → load → transform) means you dump raw into the warehouse and transform in-place using its compute. ELT won because warehouses got cheap.",
          },
          {
            term: "Bronze / Silver / Gold",
            q: "The medallion architecture",
            a: "A naming convention from Databricks. Bronze = raw landed data. Silver = cleaned, deduped, conformed. Gold = aggregated, business-ready. Useful as a mental model for staging.",
          },
          {
            term: "Lakehouse",
            q: "Why is this word everywhere?",
            a: "A \"lake\" + \"warehouse\" hybrid: cheap object-store files (Parquet on S3) wrapped in a table format (Iceberg/Delta) that gives you ACID, time-travel, and schema evolution — the things lakes used to lack.",
          },
          {
            term: "Schema on read vs write",
            q: "Where you pay the schema tax",
            a: "Schema-on-write (Postgres): structure declared upfront, rejected if violated. Schema-on-read (lake): write whatever, the reader interprets. Trade rigour for flexibility.",
          },
        ],
      },
    },
  ],
};

export default lesson;
