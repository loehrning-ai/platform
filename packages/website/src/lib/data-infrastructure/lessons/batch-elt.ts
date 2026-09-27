// Ported from data-infrastructure/lessons/07-batch-elt.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("batch-elt");

const lesson: DataInfraLesson = {
  id: "batch-elt",
  number: 7,
  title: "Batch ETL & Orchestration",
  subtitle: "Airflow · dbt · idempotent merges",
  durationMinutes: 13,
  trackId: "movement",
  hook: "Make bounded jobs replayable, observable, and safe under partial failure.",
  keyConcepts: [
    "ELT",
    "dbt materializations",
    "Idempotency",
    "MERGE vs insert-overwrite",
    "SCD Type 1/2",
    "Backfill",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Shape of batch",
      readTimeMinutes: 2,
      content:
        "A batch pipeline transforms a bounded input into a bounded output, on a schedule, from an event or on demand.\n\nPick batch when the freshness objective, source interface and recovery model tolerate bounded runs. Pick streaming when consumers need incremental results or continuous state and the extra operations pay off. Either way, define input boundaries, dependencies, publication, retries and evidence of completeness.",
    },
    {
      id: "s2",
      title: "ETL vs ELT",
      readTimeMinutes: 3,
      content:
        "**ETL** transforms before loading into the target, **ELT** lands data first and transforms it in the target platform.\n\nELT helps replay only when the landed input is immutable, complete, retained and accessible under suitable controls. It also brings transformations next to analytical compute and SQL tooling. Raw retention costs money, source deletions and schema changes complicate replay, and sensitive data may not be allowed in the target at all.\n\nETL enforces minimization, redaction, format conversion or aggregation before data crosses a security boundary, and it lowers target load. Set the boundary by data classification, source limits, retention, reprocessing needs, governance and measured cost.",
    },
    {
      id: "s3",
      title: "dbt materializations",
      readTimeMinutes: 3,
      content:
        "dbt manages transformations and their dependencies. In a SQL model, `{{ ref('upstream_model') }}` declares an upstream relation and adds it to the DAG. The materialization decides how a model is stored; exact SQL and strategies depend on the adapter.\n\n- **view**, creates a view. Only metadata is stored, and readers do the query work.\n- **table**, builds a physical relation; replacement, atomicity and grants vary by adapter.\n- **incremental**, processes a selected subset after the first build. A `unique_key` can enable merge behavior but does not make the source selection correct.\n- **ephemeral**, inlines SQL into downstream models as a CTE without its own relation.\n\nA naive `created_at > max(created_at)` filter misses late arrivals and later updates to older records. Use a source change token or reprocess an overlap window, then deduplicate deterministically:\n\n```sql\n-- Adapter-specific interval syntax; validate for the target warehouse.\n{{ config(materialized='incremental', unique_key='order_id') }}\n\nselect order_id, user_id, amount_usd, status, created_at, updated_at\nfrom {{ ref('stg_orders') }}\n{% if is_incremental() %}\n  where updated_at >= (\n    select max(updated_at) - interval '2 day' from {{ this }}\n  )\n{% endif %}\n```\n\nBefore you call the model replay-safe, define null handling, duplicate source keys, deletion capture, lookback size, transaction boundary and reconciliation.",
    },
    {
      id: "s3b",
      title: "Incremental / SCD",
      readTimeMinutes: 3,
      content:
        "- **MERGE (upsert).** Match source and target on a declared key, then update or insert. It is replay-safe only with unique, deterministic source rows, stable merge logic, correct deletes and an atomic commit. Adapters scan different amounts of target data.\n- **Insert-overwrite (partition replacement).** Recompute a complete partition or window and replace it. This needs complete, deterministic input for that boundary and an atomic replacement.\n\nMeasure both against update distribution, partition alignment, target size, concurrency and engine behavior.\n\n**Slowly Changing Dimensions (SCD).**\n\n- **Type 1** overwrites the attribute. It holds current state and drops the prior value on purpose.\n- **Type 2** closes one effective-dated version and inserts the next. It supports as-of joins if boundaries, late changes and corrections are handled, at the cost of more rows and harder joins.\n\nUse Type 2 only for attributes whose history someone needs. Its cost follows change frequency, row width, indexing and query pattern.",
    },
    {
      id: "s4",
      title: "DAG, backfill, retry",
      readTimeMinutes: 2,
      content:
        "The diagram runs a deterministic synthetic 30-day workload with 1, 4 and 10 workers; days `06`, `14`, and `22` carry fixed retry penalties. It shows scheduling and diminishing parallel benefit and estimates no runtime.\n\nA replayable batch job takes an explicit input window and publishes deterministic output for the same input version, backed by `MERGE`, partition replacement or a transaction. External side effects, nondeterministic functions, late input, duplicates and concurrent live writes still need explicit handling and reconciliation.",
    },
    {
      id: "s5",
      title: "Orchestrators",
      readTimeMinutes: 2,
      content:
        "Airflow, Dagster, Prefect and other orchestrators differ in abstractions and deployment models, and their features change. Compare current versions against your requirements:\n\n- dependency and event semantics\n- retry, timeout, cancellation and backfill\n- concurrency and resource controls\n- secrets and execution isolation\n- logs, metrics, lineage and ownership\n- deployment, upgrades and failure recovery\n- fit with your existing runtime\n\nThe orchestrator only schedules; determinism, atomicity and completeness stay the job's responsibility.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on retries and replay.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- Retry and backfill need explicit windows, deterministic source versions, atomic publication, idempotent external effects and reconciliation.\n- A materialization's name proves nothing about read cost, build cost, freshness or atomicity.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Idempotent**, a repeat with the same identity and input changes nothing further.\n- **Incremental model**, processes only a selected subset after the first build.\n- **SLA / freshness**, target time from source change to usable data.\n- **Lineage**, recorded links between jobs, datasets and fields.\n- **SCD Type 1**, overwrites an attribute without history.\n- **SCD Type 2**, keeps effective-dated versions.\n- **MERGE vs insert-overwrite**, keyed changes or replacing a whole boundary.\n- **Sensor**, a task that waits for an external condition.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "Retry after a partial write",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A nightly job inserts yesterday's orders into `fact_orders` and crashes halfway. After the on-call retries it, the table has duplicate rows. What is wrong with the job?",
        options: [
          "Nothing; that is expected behavior.",
          "It uses `INSERT` instead of a `MERGE` keyed on `order_id`.",
          "It needs a try/catch.",
          "It needs more retries.",
        ],
        correct: 1,
        explanation:
          "Plain `INSERT` appends the same rows on every retry, so the job is not idempotent. A deterministic `MERGE` keyed by `order_id`, or atomic replacement of a complete window, avoids the duplicates.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "When ELT improves replay",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A team weighs ELT for a dataset that may need historical reprocessing. Which benefit holds only when the landing zone retains complete, governed input?",
        options: [
          "SQL is easier than Python.",
          "Corrected transformations can reprocess history without re-extracting.",
          "Snowflake is faster.",
          "It is the modern way.",
        ],
        correct: 1,
        explanation:
          "A retained landing zone decouples replay from source availability, if the input is complete, versioned enough, retained, authorized and fits the corrected logic. Reprocessing still costs compute and can force downstream reconciliation.",
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
            term: "Idempotent",
            q: "What boundary must be named?",
            a: "Name the outputs and side effects that stay unchanged when the same operation and input repeat. A database write can be idempotent while a notification or API call is not.",
          },
          {
            term: "Incremental model",
            q: "How does dbt do it?",
            a: "Select a bounded change set with {% if is_incremental() %} and pick an adapter-supported strategy. A max-timestamp filter misses late updates; use a change token or an overlap with deterministic deduplication.",
          },
          {
            term: "SLA / freshness",
            q: "How is freshness specified?",
            a: "As a target time between source change and usable data. Monitoring and alerting are tool- and version-specific, so check your integration.",
          },
          {
            term: "Lineage",
            q: "Why does it matter?",
            a: "It narrows which upstream datasets and jobs could affect an output. Derived graphs miss dynamic SQL, external APIs and semantic changes, so ownership and run evidence stay necessary.",
          },
          {
            term: "SCD Type 1",
            q: "When to use it?",
            a: "Overwrite the row when an attribute changes and keep no history. Use it when past values do not matter to consumers, e.g. a typo fix or a new phone number.",
          },
          {
            term: "SCD Type 2",
            q: "When to use it?",
            a: "Close the old row (valid_to, is_current=false) and insert a new one. Facts can then join to the dimension as of the event date, such as the customer's region at purchase, at one row per version.",
          },
          {
            term: "MERGE vs insert-overwrite",
            q: "Which is idempotent?",
            a: "Both support replay when input and logic are deterministic and publication is atomic. MERGE also needs unique source rows and stable matching; replacement needs a complete partition boundary.",
          },
          {
            term: "Sensor",
            q: "Airflow concept",
            a: "A task that waits for an external condition, such as a landed file, a table update or an API returning 200, before downstream tasks run.",
          },
        ],
      },
    },
  ],
};

export default lesson;
