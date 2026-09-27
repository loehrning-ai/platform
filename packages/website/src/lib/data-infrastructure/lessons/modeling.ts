// Ported from data-infrastructure/lessons/03-modeling.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("modeling");

const lesson: DataInfraLesson = {
  id: "modeling",
  number: 3,
  title: "Modeling: OLTP vs OLAP vs Stream",
  subtitle: "3NF · Kimball · Wide-table · Vault",
  durationMinutes: 13,
  trackId: "foundations",
  hook: "Choose a model from write behavior, query shape, history, lineage, and ownership.",
  keyConcepts: [
    "Star schema",
    "SCD Type 2",
    "Surrogate key",
    "Data Vault",
    "Stream-table duality",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Five philosophies",
      readTimeMinutes: 2,
      content:
        "No data model fits every context. Start from write behavior, query patterns, required history, ownership and change frequency.\n\n1. **3NF / normalized**, stores facts with controlled redundancy. Transactional updates and integrity constraints get easier; broad reads pay in joins.\n2. **Star schema (Kimball)**, puts analytical events or measurements in fact tables and descriptive context in dimensions, so common aggregations become explicit.\n3. **Snowflake schema**, normalizes parts of the dimensions, with less duplication but more joins and ownership boundaries.\n4. **One Big Table (OBT) / wide table**, materializes a read-oriented projection. It removes query-time joins and raises build cost, duplication and schema-change impact; column pruning saves read I/O, not storage or maintenance.\n5. **Data Vault**, splits business keys, relationships and descriptive history into hubs, links and satellites. It favors traceability and parallel ingestion and usually needs presentation models downstream.",
    },
    {
      id: "s2",
      title: "Star schema",
      readTimeMinutes: 3,
      content:
        "A Kimball star schema starts from a declared grain. One or more **fact tables** at that grain join to **dimension tables** with descriptive context. A fact row usually carries dimension keys and measures, plus timestamps, status fields or degenerate dimensions when needed.\n\nA query such as *\"sum revenue by category, filtered by country and date range\"* joins a sales fact to product, customer and date dimensions. That works while definitions and grains stay consistent.\n\n- **SCD Type 2 (Slowly Changing Dimensions).** When an attribute changes, insert a versioned dimension row with effective dates. A historical fact joins to the version valid at its event time, if effective-time boundaries and late corrections are handled consistently.\n- **Surrogate keys.** A warehouse-controlled key decouples dimension versions from changing or reused source IDs. Stable natural keys can still be right, depending on source semantics and integration needs.",
    },
    {
      id: "s3",
      title: "Row vs column",
      readTimeMinutes: 2,
      content:
        "Row-oriented engines keep a record's fields together; Parquet groups values by column inside row groups. The interactive model runs `SELECT SUM(amount) WHERE country='US'` on small fixed layouts and counts the cells it inspects. It is no database benchmark.\n\nRow layouts often suit keyed reads and updates of many fields in few records, column layouts scans of few fields across many records. Indexes, compression, caching, the engine and workload shape can flip that.",
    },
    {
      id: "s4",
      title: "Stream-table duality",
      readTimeMinutes: 3,
      content:
        "A change log folds into a current-state table, and a table's changes can sometimes be represented as a stream. The two are interchangeable only with contracts for keys, ordering, retention, deletion and schema evolution.\n\n- A **change stream** might record `user 42 set country=US`, then `UK`, then `CA`.\n- A **materialized table** might keep only the current result: `user 42 → CA`.\n\nDatabase transaction logs and table storage follow this pattern with engine-specific recovery semantics. Kafka log compaction keeps at least the latest record per key, subject to compaction and tombstone rules, and the topic still lacks a database table's constraints.\n\nAsk whether consumers need ordered history, current state or both, and how you rebuild and verify one from the other.",
    },
    {
      id: "s5",
      title: "Data Vault",
      readTimeMinutes: 3,
      content:
        "Data Vault integrates multiple sources and keeps source, load time, keys, relationships and descriptive history. That supports audits; auditability itself still rests on immutable source evidence, access controls, lineage, retention and reconciliation.\n\n1. **Hub.** A distinct business key plus source and load metadata, for example `hub_customer(customer_hk, customer_id, load_dts, rec_src)`.\n2. **Link.** A relationship between hub keys, for example `link_order_product(order_product_hk, order_hk, product_hk, load_dts, rec_src)`.\n3. **Satellite.** Descriptive attributes and their load history for a hub or link, for example `sat_customer_details(customer_hk, load_dts, load_end_dts, email, country, rec_src)`.\n\nRaw Vault loads are usually insert-oriented. Hash collisions, duplicate source events, late data, effectivity rules and concurrent loads still need explicit idempotency and conflict handling. Business Vault and presentation layers add derived rules and usable query models.\n\nUse Data Vault when traceability and multi-source integration justify the extra objects and layers. A small domain with stable sources and direct analytical questions is easier to run on a normalized or dimensional model.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on grain and history.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **Conformed dimension**, a dimension whose keys and definitions several fact tables share.\n- **Grain**, what one fact row represents.\n- **Surrogate key**, a warehouse-controlled identifier for dimension versions or changing source keys.\n- **Bridge table**, a many-to-many link, for example `fact_orders ↔ bridge_order_promo ↔ dim_promo`.\n- **Materialized view**, a stored query result with an engine-specific refresh policy.\n- **Data Vault hub**, distinct business keys with load and source metadata.\n- **Data Vault satellite**, descriptive attributes over load time.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "When does OBT fit?",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'Your ML team wants a "feature table" with one row per user and 800 columns of pre-computed signals. Star schema or one big table?',
        options: [
          "Star schema. Always normalize.",
          "A wide projection, if consumers fetch many features per user.",
          "Snowflake schema, to save storage.",
          "Data Vault, for auditability.",
        ],
        correct: 1,
        explanation:
          "A wide projection saves repeated query-time joins for feature serving. Check update cost, ownership, point-in-time correctness and whether the engine prunes unused columns, and benchmark the real access path.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "SCD2 in practice",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A user signs up in the US (Jan 1) and moves to the UK (June 1). They buy on March 1 and on Sept 1. With SCD Type 2, the March order joins to country=___ and the Sept order to country=___:",
        options: [
          "US, US; country is fixed at signup.",
          "UK, UK; reports always show the current country.",
          "US, UK; SCD2 joins each order to the row valid then.",
          "NULL, UK; the history is lost.",
        ],
        correct: 2,
        explanation:
          "SCD Type 2 keeps effective-dated versions. With correct boundaries and late-change handling, each fact joins the version valid at event time, so US in March and UK in September.",
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
            term: "Conformed dim",
            q: "What is a conformed dimension?",
            a: "Its keys and definitions are shared across compatible fact tables. Cross-fact analysis also needs matching grain, measures and join behavior.",
          },
          {
            term: "Grain",
            q: 'What is "grain" of a fact table?',
            a: 'What one fact row represents. "One row per order line item" is finer than "one row per order." Choose the finest grain your questions need and your volume can sustain.',
          },
          {
            term: "Surrogate key",
            q: "Why not use natural keys?",
            a: "A warehouse-controlled key separates dimension versions and shields the model from changing source keys. Stable natural keys stay valid when their semantics are controlled.",
          },
          {
            term: "Bridge table",
            q: "When do you need one?",
            a: "For a controlled many-to-many relationship, such as fact_orders ↔ bridge_order_promo ↔ dim_promo. Beyond the 3NF-style join you may need allocation rules and effective dates.",
          },
          {
            term: "Materialized view",
            q: "How is it different from a normal view?",
            a: "A normal view stores a query definition; a materialized view stores results under an engine-specific refresh model. Consumers must know its data age and failure behavior.",
          },
          {
            term: "Data Vault hub",
            q: "What does a hub contain?",
            a: "A distinct business key plus load and source metadata. Several sources can feed one hub once key standardization, collisions and duplicates are defined.",
          },
          {
            term: "Data Vault satellite",
            q: "How is history preserved?",
            a: "Descriptive attributes stored over load time. Inserts preserve versions; current state and audit claims still rest on effectivity, lineage, retention and controls.",
          },
        ],
      },
    },
  ],
};

export default lesson;
