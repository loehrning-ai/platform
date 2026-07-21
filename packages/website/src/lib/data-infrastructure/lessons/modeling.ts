// Ported from data-infrastructure/lessons/03-modeling.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("modeling");

const lesson: DataInfraLesson = {
  id: "modeling",
  number: 3,
  title: "Modeling: OLTP vs OLAP vs Stream",
  subtitle: "3NF · Kimball · Wide-table · Vault",
  durationMinutes: 13,
  trackId: "foundations",
  hook: "Five modeling philosophies. When each one is right. When each one ruins your life.",
  keyConcepts: ["Star schema", "SCD Type 2", "Surrogate key", "Data Vault", "Stream-table duality"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Five philosophies",
      readTimeMinutes: 2,
      content:
        '"How should I model this data?" is a question that sounds technical and is actually political. The right answer depends on who reads the data, how often, and how surprised they are willing to be when the schema changes. The working taxonomy:\n\n1. **3NF / normalized** — the OLTP gold standard. Every fact in exactly one place. Updates are cheap, joins are many. *Right for: source-of-truth product DBs.*\n2. **Star schema (Kimball)** — denormalized into *fact* tables (events, measurements) and *dimension* tables (the things being measured). Few wide joins. *Right for: BI on a warehouse.*\n3. **Snowflake schema** — same as star, but dimensions are themselves normalized. Saves space, more joins. *Right for: when dimensions are huge or shared.*\n4. **One Big Table (OBT) / wide tables** — denormalize everything into one mega-table. Joins disappear. Storage explodes. *Right for: ML feature tables, columnar warehouses where storage is free.*\n5. **Data Vault** — hubs, links, satellites. Audit-grade history. *Right for: enterprises that get sued.*',
    },
    {
      id: "s2",
      title: "Star schema",
      readTimeMinutes: 3,
      content:
        "The Kimball star schema is the single most-used analytical model. You should be able to draw it from memory. The center is one or more **fact tables** — one row per business event. The points of the star are **dimension tables** — descriptive context.\n\nThe fact table holds *foreign keys* and *numeric measures*. Nothing else: `user_id`, `product_id`, `date_key`, `amount`, `quantity`. Dimensions hold the descriptive stuff: country, category, price band, day-of-week. A typical analytical query says *\"sum revenue grouped by category, filtered by country and date range\"* — the schema is shaped exactly to make that query a single big aggregation with a few joins.\n\nTwo patterns pay rent for the rest of your career:\n\n- **SCD Type 2 (Slowly Changing Dimensions).** When a user moves from US to UK, you don't overwrite their row — you insert a new row with `valid_from`/`valid_to` dates. Old facts still join to the old row. History is preserved.\n- **Surrogate keys.** Never use the source system's natural key (like an email) as a dim PK. Use a synthetic `user_sk` integer. When the source system changes its mind, you don't cascade.",
      keyTakeaway:
        "A fact table holds only FKs and numeric measures; SCD2 and surrogate keys are what let dimensions change safely over time.",
    },
    {
      id: "s3",
      title: "Row vs column",
      readTimeMinutes: 2,
      content:
        "Postgres stores rows contiguously; Parquet stores columns contiguously. The same byte answers a \"give me everything about user 42\" query in microseconds on Postgres and an \"average over a billion rows\" query in seconds on Parquet. The interactive simulator runs the same `SELECT SUM(amount) WHERE country='US'` query against both layouts and shows how many bytes each has to read.\n\n**Same data, two layouts.** Different shape for different reads — this is the whole reason OLTP and OLAP systems exist as separate things instead of one universal database.",
    },
    {
      id: "s4",
      title: "Stream-table duality",
      readTimeMinutes: 3,
      content:
        "The deepest idea in data modeling is this: **a stream and a table are the same thing, viewed from different angles.**\n\n- A **stream** is the log of every change: `user 42 set country=US`, then `user 42 set country=UK`, then `user 42 set country=CA`.\n- A **table** is the materialized result of folding that stream forward: `user 42 → CA`.\n\nEvery database has both internally — the WAL is the stream, the table pages are the materialized view. CDC pipelines (lesson 9) make this duality the entire architecture. Kafka calls a stream that materializes to a table a **compacted topic**: old keys get garbage-collected, only the latest value survives. That's a stream pretending to be a table.\n\nWhen you internalize this, modeling decisions become easier. *\"Should this be a table or a Kafka topic?\"* stops being binary; it becomes a question of whether you want the history or just the current state, and how you want to materialize between them.",
      keyTakeaway:
        "A stream is the log of every change; a table is that log folded forward to current state — the same data, two views.",
    },
    {
      id: "s5",
      title: "Data Vault",
      readTimeMinutes: 3,
      content:
        "When the requirement is *\"we need a complete, auditable record of every change to every business entity, ever, regardless of source system\"* — 3NF and star schema both lose. 3NF overwrites or loses history on updates. Star schema hides integration logic inside transformations. Data Vault bakes auditability into the structure itself.\n\nData Vault 2.0 has exactly **three object types**:\n\n1. **Hub.** One row per unique business key. No descriptive attributes, no history. Just the key and its source. Example: `hub_customer` with columns `customer_hk` (hash PK), `customer_id` (business key), `load_dts`, `rec_src`.\n2. **Link.** Models a relationship between two or more hubs — captures many-to-many associations. Example: `link_order_product` with `order_product_hk`, `order_hk`, `product_hk`, `load_dts`, `rec_src`. Links never change; only new associations are appended.\n3. **Satellite.** Holds all descriptive context and history for a hub or link. One insert per change, never update. Example: `sat_customer_details` with `customer_hk`, `load_dts` (PK together), `load_end_dts`, `email`, `country`, `rec_src`. Query with `WHERE load_end_dts IS NULL` for current state.\n\n**The key insight.** Hubs and links are append-only and never change. Satellites are append-only too — no UPDATEs, ever. This makes Data Vault naturally idempotent and parallelisable: multiple source systems can load into the same vault concurrently without locking or overwriting each other's data.\n\nA real-world example: a bank's core banking system, CRM, and fraud platform all have different notions of \"customer.\" Data Vault loads each into the same `hub_customer` keyed by a canonical business key. Each source's attributes land in its own satellite. The customer's full history across all three systems is always queryable, auditable, and lineage-tracked — exactly what regulators and auditors need.\n\n**When Data Vault is the wrong choice:** it's verbose (3-5x more tables than star schema), query patterns are complex (hub → satellite → link → satellite), and it requires a mature data engineering team to operate. For a startup with 3 source systems and no regulatory requirement, use Kimball.",
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
        "- **Conformed dim** — a dimension shared across multiple fact tables, with the same keys and definitions everywhere. `dim_date` is the canonical example. Lets you do drill-across reports.\n- **Grain** — the atomic event a fact-table row represents. \"One row per order line item\" is finer grain than \"one row per order.\" Pick the lowest grain you can afford — you can always aggregate up.\n- **Surrogate key** — natural keys (email, account number) change; surrogate keys (auto-incrementing integers, hashes) are stable and let SCD2 work. Always use surrogate PKs in dimensions.\n- **Bridge table** — for many-to-many between fact and dim, e.g. an order has multiple promo codes: `fact_orders ↔ bridge_order_promo ↔ dim_promo`. Same idea as a join table in 3NF.\n- **Materialized view** — a normal view is a saved query, executed each time; a materialized view stores the result and refreshes it. Foundation of pre-aggregated marts and stream-table joins.\n- **Data Vault hub** — one row per unique business key, nothing else. No descriptive attributes, no history. `customer_hk` (hash key), `customer_id` (business key), `load_dts`, `rec_src`. Multiple source systems can insert into the same hub without conflict.\n- **Data Vault satellite** — append-only. Every change to a descriptive attribute inserts a new row with a new `load_dts`. Never UPDATE. Current state = `WHERE load_end_dts IS NULL`. This is the auditability guarantee regulators care about.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "When does OBT win?",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'Your ML team wants a "feature table" — every row is one user, with 800 columns of pre-computed signals. They ask: "Should we model this with star schema or one big table?" What\'s the right answer?',
        options: [
          "Star schema. Always normalize.",
          'OBT. ML feature tables are read with "select all 800 columns for this user_id" — joins would be wasteful, and columnar storage means unused columns cost nothing.',
          "Snowflake schema, to save storage.",
          "Data Vault, for auditability.",
        ],
        correct: 1,
        explanation:
          "OBT is right for read patterns where you take many columns at once on a single key. Storage in a columnar format (Parquet) is cheap-per-column and effectively free for unread columns. Joining 800 features at query time would dominate cost. Feature stores like Tecton and Feast all materialize to wide tables for this reason.",
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
          "US, US — country is fixed at signup.",
          "UK, UK — we always show current country.",
          "US, UK — that's the point of SCD2: the order joins to the dim row that was valid at the time of the order.",
          "NULL, UK — we lose history.",
        ],
        correct: 2,
        explanation:
          "SCD Type 2 keeps a row per version of a dimension, with valid_from/valid_to dates. The fact table joins on user_id AND order_date BETWEEN valid_from AND valid_to. This way historical reports stay correct: \"revenue from US users in March\" still includes the user who later moved to the UK. This is the killer feature vs Type 1 (overwrite) or Type 3 (limited history).",
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
            term: "Conformed dim",
            q: "What is a conformed dimension?",
            a: "A dimension shared across multiple fact tables, with the same keys and definitions everywhere. dim_date is the canonical example. Lets you do drill-across reports.",
          },
          {
            term: "Grain",
            q: 'What is "grain" of a fact table?',
            a: 'The atomic event the row represents. "One row per order line item" is finer grain than "one row per order." Pick the lowest grain you can afford — you can always aggregate up.',
          },
          {
            term: "Surrogate key",
            q: "Why not use natural keys?",
            a: "Natural keys (email, account number) change. Surrogate keys (auto-incrementing integers, hashes) are stable and let SCD2 work. Always use surrogate PKs in dimensions.",
          },
          {
            term: "Bridge table",
            q: "When do you need one?",
            a: "For many-to-many between fact and dim. e.g. an order has multiple promo codes. fact_orders ↔ bridge_order_promo ↔ dim_promo. Same idea as a join table in 3NF.",
          },
          {
            term: "Materialized view",
            q: "How is it different from a normal view?",
            a: "A normal view is a saved query, executed each time. A materialized view stores the result and refreshes it. Foundation of pre-aggregated marts and stream-table joins.",
          },
          {
            term: "Data Vault hub",
            q: "What does a hub contain?",
            a: "A hub holds one row per unique business key — nothing else. No descriptive attributes, no history. customer_hk (hash key), customer_id (business key), load_dts, rec_src. Multiple source systems can insert into the same hub without conflict.",
          },
          {
            term: "Data Vault satellite",
            q: "How is history preserved?",
            a: "Satellites are append-only. Every change to a descriptive attribute inserts a new row with a new load_dts. Never UPDATE. Current state = WHERE load_end_dts IS NULL. This is the auditability guarantee regulators care about.",
          },
        ],
      },
    },
  ],
};

export default lesson;
