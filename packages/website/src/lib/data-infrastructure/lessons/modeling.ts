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
        '"How should this data be modeled?" has no context-free answer. Start with write behavior, query patterns, required history, ownership, and change frequency. A useful taxonomy:\n\n1. **3NF / normalized**, stores facts with controlled redundancy. It supports transactional updates and integrity constraints, at the cost of joins for broader reads.\n2. **Star schema (Kimball)**, organizes analytical events or measurements in fact tables and descriptive context in dimensions. It makes common aggregations explicit.\n3. **Snowflake schema**, normalizes parts of the dimension model. It can reduce duplication but adds joins and ownership boundaries.\n4. **One Big Table (OBT) / wide table**, materializes a read-oriented projection. It can remove query-time joins while increasing build cost, duplication, and schema-change impact. Column pruning reduces read I/O for unused columns but does not make storage or maintenance free.\n5. **Data Vault**, separates business keys, relationships, and descriptive history into hubs, links, and satellites. It emphasizes traceability and parallel ingestion, then normally needs downstream presentation models.',
    },
    {
      id: "s2",
      title: "Star schema",
      readTimeMinutes: 3,
      content:
        'A Kimball-style star schema places one or more **fact tables** at a declared grain and connects them to **dimension tables** containing descriptive context. A fact row commonly holds dimension keys and measures, but it can also contain timestamps, status fields, or degenerate dimensions when the model requires them.\n\nA query such as *"sum revenue grouped by category, filtered by country and date range"* can join a sales fact to product, customer, and date dimensions. The model is useful when those definitions and grains are governed consistently.\n\nTwo common patterns:\n\n- **SCD Type 2 (Slowly Changing Dimensions).** Insert a versioned dimension row with effective dates when an attribute changes. A historical fact joins to the version valid at its event time. This preserves the modeled history only if effective-time boundaries and late corrections are handled consistently.\n- **Surrogate keys.** A warehouse-controlled key can decouple dimension versions from changing or reused source identifiers. Stable natural keys can still be appropriate; the choice depends on source semantics and integration requirements.',
      keyTakeaway:
        "Declare fact grain first; use versioned dimensions and surrogate keys only when their history and integration benefits are required.",
    },
    {
      id: "s3",
      title: "Row vs column",
      readTimeMinutes: 2,
      content:
        "Row-oriented engines keep the fields of a record close together; Parquet groups values by column within row groups. The interactive model applies `SELECT SUM(amount) WHERE country='US'` to small fixed layouts and counts the cells it chooses to inspect. It is not a database benchmark.\n\nA row layout often suits keyed reads and updates that need many fields from a few records. A column layout often suits scans that need a subset of fields from many records. Indexes, compression, caching, execution engines, and workload shape can change the result.",
    },
    {
      id: "s4",
      title: "Stream-table duality",
      readTimeMinutes: 3,
      content:
        "A change log can be folded into a current-state table, and changes to a table can sometimes be represented as a stream. This relationship is useful, but the two representations are not interchangeable without contracts for keys, ordering, retention, deletion, and schema evolution.\n\n- A **change stream** might record `user 42 set country=US`, then `UK`, then `CA`.\n- A **materialized table** might retain only the selected current result: `user 42 → CA`.\n\nDatabase transaction logs and table storage participate in this pattern, but their recovery semantics are engine-specific. Kafka log compaction retains at least the latest record for each key subject to compaction and tombstone rules; it does not turn a topic into a fully constrained database table.\n\nAsk whether consumers need an ordered history, current state, or both, and how one representation will be rebuilt and verified from the other.",
      keyTakeaway:
        "A change stream can materialize current state only when keys, ordering, retention, deletion, and replay behavior are defined.",
    },
    {
      id: "s5",
      title: "Data Vault",
      readTimeMinutes: 3,
      content:
        "Data Vault is one approach for integrating multiple sources while retaining source, load-time, key, relationship, and descriptive history. The model supports audit work, but auditability still depends on immutable source evidence, access controls, lineage, retention, and reconciliation.\n\nIts core structures are:\n\n1. **Hub.** A distinct business key plus source and load metadata, for example `hub_customer(customer_hk, customer_id, load_dts, rec_src)`.\n2. **Link.** A relationship between hub keys, for example `link_order_product(order_product_hk, order_hk, product_hk, load_dts, rec_src)`.\n3. **Satellite.** Descriptive attributes and their load history for a hub or link, for example `sat_customer_details(customer_hk, load_dts, load_end_dts, email, country, rec_src)`.\n\nRaw Vault patterns are commonly insert-oriented, but hash collisions, duplicate source events, late data, effectivity rules, and concurrent loads still require explicit idempotency and conflict handling. Business Vault and presentation layers add derived rules and usable query models.\n\nChoose this structure when its traceability and multi-source integration benefits justify the additional objects and transformation layers. For a smaller domain with stable sources and direct analytical requirements, a simpler normalized or dimensional model can be easier to operate.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **Conformed dimension**, a dimension whose keys and definitions are shared across fact tables so compatible measures can be compared.\n- **Grain**, what one fact row represents. Choose the finest grain required for downstream questions and sustainable at the expected volume.\n- **Surrogate key**, a warehouse-controlled identifier used to separate dimension versions or integrate changing source keys. It is a design option, not a universal requirement.\n- **Bridge table**, represents a many-to-many relationship, for example `fact_orders ↔ bridge_order_promo ↔ dim_promo`.\n- **Materialized view**, stores a query result and refreshes it under an engine-specific policy; consumers must understand its freshness and refresh failure behavior.\n- **Data Vault hub**, stores distinct business keys with load and source metadata. Concurrent loading still needs deterministic keys and duplicate handling.\n- **Data Vault satellite**, stores descriptive attributes over load time. Current-state queries depend on the chosen effectivity and end-dating convention.",
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
          'Your ML team wants a "feature table", every row is one user, with 800 columns of pre-computed signals. They ask: "Should we model this with star schema or one big table?" What\'s the right answer?',
        options: [
          "Star schema. Always normalize.",
          "A read-optimized wide projection can fit if consumers fetch many features by user. Validate update cost, ownership, point-in-time correctness, and whether the serving engine can prune unused columns.",
          "Snowflake schema, to save storage.",
          "Data Vault, for auditability.",
        ],
        correct: 1,
        explanation:
          "A wide projection can remove repeated query-time joins for a feature-serving pattern. It still has storage, recomputation, schema, ownership, and point-in-time correctness costs. Benchmark the intended engine and access path rather than assuming joins or unused columns are free.",
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
          "A user signs up in the US (Jan 1). Moves to the UK (June 1). Buys something on March 1 and again on Sept 1. Using SCD Type 2 dimensions, the March order joins to country=___ and the Sept order joins to country=___:",
        options: [
          "US, US, country is fixed at signup.",
          "UK, UK, we always show current country.",
          "US, UK, that's the point of SCD2: the order joins to the dim row that was valid at the time of the order.",
          "NULL, UK, we lose history.",
        ],
        correct: 2,
        explanation:
          "SCD Type 2 keeps effective-dated versions. With correct boundaries and late-arriving-change handling, the fact joins to the version valid at the event time: US in March and UK in September.",
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
            a: "A dimension whose keys and definitions are shared across compatible fact tables. It supports cross-fact analysis only when grain, measures, and join behavior are also aligned.",
          },
          {
            term: "Grain",
            q: 'What is "grain" of a fact table?',
            a: 'What one fact row represents. "One row per order line item" is finer grain than "one row per order." Choose the finest grain required by downstream questions and sustainable at the expected volume.',
          },
          {
            term: "Surrogate key",
            q: "Why not use natural keys?",
            a: "A warehouse-controlled key can separate dimension versions and insulate the model from changing source keys. Stable natural keys can still be valid when their semantics are controlled.",
          },
          {
            term: "Bridge table",
            q: "When do you need one?",
            a: "Represents a controlled many-to-many relationship between facts and dimensions, such as fact_orders ↔ bridge_order_promo ↔ dim_promo. Allocation rules and effective dates may be required in addition to the 3NF-style join structure.",
          },
          {
            term: "Materialized view",
            q: "How is it different from a normal view?",
            a: "A normal view stores a query definition. A materialized view stores results under an engine-specific refresh and consistency model; consumers must know its data age and failure behavior.",
          },
          {
            term: "Data Vault hub",
            q: "What does a hub contain?",
            a: "A hub stores a distinct business key plus load and source metadata. Multiple sources can target it when key standardization, collision handling, and duplicate behavior are defined.",
          },
          {
            term: "Data Vault satellite",
            q: "How is history preserved?",
            a: "Satellites store descriptive attributes over load time. Insert-oriented patterns preserve versions; current-state queries and audit claims still depend on effectivity, lineage, retention, and controls.",
          },
        ],
      },
    },
  ],
};

export default lesson;
