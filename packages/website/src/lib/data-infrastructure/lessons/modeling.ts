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
        '"How should this data be modeled?" There is no context-free answer. Start with write behavior, query patterns, required history, ownership, and change frequency. Five options worth naming:\n\n1. **3NF / normalized**, stores facts with controlled redundancy. Transactional updates and integrity constraints get easier. Broader reads pay in joins.\n2. **Star schema (Kimball)**, puts analytical events or measurements in fact tables and descriptive context in dimensions. Common aggregations become explicit.\n3. **Snowflake schema**, normalizes parts of the dimension model. Less duplication, more joins, more ownership boundaries.\n4. **One Big Table (OBT) / wide table**, materializes a read-oriented projection. Query-time joins disappear; build cost, duplication, and schema-change impact rise. Column pruning cuts read I/O for unused columns, but storage and maintenance are never free.\n5. **Data Vault**, splits business keys, relationships, and descriptive history into hubs, links, and satellites. Traceability and parallel ingestion come first; downstream presentation models normally follow.',
    },
    {
      id: "s2",
      title: "Star schema",
      readTimeMinutes: 3,
      content:
        'A Kimball-style star schema puts one or more **fact tables** at a declared grain and connects them to **dimension tables** holding descriptive context. A fact row commonly carries dimension keys and measures. It can also carry timestamps, status fields, or degenerate dimensions when the model needs them.\n\nA query such as *"sum revenue grouped by category, filtered by country and date range"* joins a sales fact to product, customer, and date dimensions. That works while those definitions and grains stay governed consistently.\n\nTwo common patterns:\n\n- **SCD Type 2 (Slowly Changing Dimensions).** Insert a versioned dimension row with effective dates when an attribute changes. A historical fact joins to the version valid at its event time. The history survives only if effective-time boundaries and late corrections are handled consistently.\n- **Surrogate keys.** A warehouse-controlled key can decouple dimension versions from changing or reused source identifiers. Stable natural keys can still be right; source semantics and integration requirements decide.',
      keyTakeaway:
        "Declare fact grain first; use versioned dimensions and surrogate keys only when their history and integration benefits are required.",
    },
    {
      id: "s3",
      title: "Row vs column",
      readTimeMinutes: 2,
      content:
        "Row-oriented engines keep a record's fields close together; Parquet groups values by column inside row groups. The interactive model applies `SELECT SUM(amount) WHERE country='US'` to small fixed layouts and counts the cells it inspects. It is not a database benchmark.\n\nA row layout often suits keyed reads and updates that need many fields from few records. A column layout often suits scans that need few fields from many records. Indexes, compression, caching, execution engines, and workload shape can flip the result.",
    },
    {
      id: "s4",
      title: "Stream-table duality",
      readTimeMinutes: 3,
      content:
        "A change log folds into a current-state table, and changes to a table can sometimes be represented as a stream. Useful relationship. The two representations are still not interchangeable without contracts for keys, ordering, retention, deletion, and schema evolution.\n\n- A **change stream** might record `user 42 set country=US`, then `UK`, then `CA`.\n- A **materialized table** might retain only the selected current result: `user 42 → CA`.\n\nDatabase transaction logs and table storage take part in this pattern, but their recovery semantics are engine-specific. Kafka log compaction retains at least the latest record for each key subject to compaction and tombstone rules; it does not turn a topic into a fully constrained database table.\n\nAsk what consumers need: an ordered history, current state, or both. Then ask how one representation gets rebuilt and verified from the other.",
      keyTakeaway:
        "A change stream can materialize current state only when keys, ordering, retention, deletion, and replay behavior are defined.",
    },
    {
      id: "s5",
      title: "Data Vault",
      readTimeMinutes: 3,
      content:
        "Data Vault integrates multiple sources while retaining source, load-time, key, relationship, and descriptive history. The model supports audit work. Auditability itself still rests on immutable source evidence, access controls, lineage, retention, and reconciliation.\n\nIts core structures are:\n\n1. **Hub.** A distinct business key plus source and load metadata, for example `hub_customer(customer_hk, customer_id, load_dts, rec_src)`.\n2. **Link.** A relationship between hub keys, for example `link_order_product(order_product_hk, order_hk, product_hk, load_dts, rec_src)`.\n3. **Satellite.** Descriptive attributes and their load history for a hub or link, for example `sat_customer_details(customer_hk, load_dts, load_end_dts, email, country, rec_src)`.\n\nRaw Vault patterns are commonly insert-oriented. Hash collisions, duplicate source events, late data, effectivity rules, and concurrent loads still demand explicit idempotency and conflict handling. Business Vault and presentation layers add derived rules and usable query models.\n\nPick this structure when its traceability and multi-source integration justify the extra objects and transformation layers. For a smaller domain with stable sources and direct analytical requirements, a simpler normalized or dimensional model is easier to operate.",
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
        "- **Conformed dimension**, a dimension whose keys and definitions are shared across fact tables so compatible measures can be compared.\n- **Grain**, what one fact row represents. Choose the finest grain the downstream questions require and the expected volume can sustain.\n- **Surrogate key**, a warehouse-controlled identifier that separates dimension versions or integrates changing source keys. A design option, not a universal requirement.\n- **Bridge table**, represents a many-to-many relationship, for example `fact_orders ↔ bridge_order_promo ↔ dim_promo`.\n- **Materialized view**, stores a query result and refreshes it under an engine-specific policy; consumers must know its freshness and its refresh failure behavior.\n- **Data Vault hub**, stores distinct business keys with load and source metadata. Concurrent loading still needs deterministic keys and duplicate handling.\n- **Data Vault satellite**, stores descriptive attributes over load time. Current-state queries depend on the chosen effectivity and end-dating convention.",
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
          "A wide projection removes repeated query-time joins for a feature-serving pattern. It still carries storage, recomputation, schema, ownership, and point-in-time correctness costs. Benchmark the intended engine and access path instead of assuming joins or unused columns are free.",
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
            a: "A dimension whose keys and definitions are shared across compatible fact tables. Cross-fact analysis works only when grain, measures, and join behavior line up too.",
          },
          {
            term: "Grain",
            q: 'What is "grain" of a fact table?',
            a: 'What one fact row represents. "One row per order line item" is finer grain than "one row per order." Choose the finest grain the downstream questions require and the expected volume can sustain.',
          },
          {
            term: "Surrogate key",
            q: "Why not use natural keys?",
            a: "A warehouse-controlled key separates dimension versions and insulates the model from changing source keys. Stable natural keys stay valid when their semantics are controlled.",
          },
          {
            term: "Bridge table",
            q: "When do you need one?",
            a: "It represents a controlled many-to-many relationship between facts and dimensions, such as fact_orders ↔ bridge_order_promo ↔ dim_promo. Allocation rules and effective dates may be needed beyond the 3NF-style join structure.",
          },
          {
            term: "Materialized view",
            q: "How is it different from a normal view?",
            a: "A normal view stores a query definition. A materialized view stores results under an engine-specific refresh and consistency model; consumers must know its data age and failure behavior.",
          },
          {
            term: "Data Vault hub",
            q: "What does a hub contain?",
            a: "A distinct business key plus load and source metadata. Multiple sources can target one hub once key standardization, collision handling, and duplicate behavior are defined.",
          },
          {
            term: "Data Vault satellite",
            q: "How is history preserved?",
            a: "Satellites store descriptive attributes over load time. Insert-oriented patterns preserve versions; current-state queries and audit claims still rest on effectivity, lineage, retention, and controls.",
          },
        ],
      },
    },
  ],
};

export default lesson;
