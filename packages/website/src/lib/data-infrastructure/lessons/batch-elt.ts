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
        "A batch pipeline takes a bounded input set, applies a transformation, and publishes a bounded output. It may run on a schedule, from an event, or on demand.\n\nChoose batch when the freshness objective, source interface, and recovery model tolerate bounded runs. Choose streaming when consumers need incremental results or continuous state updates and the added operational model is justified. In either case, define input boundaries, dependencies, publication, retries, and evidence of completeness.",
    },
    {
      id: "s2",
      title: "ETL vs ELT",
      readTimeMinutes: 3,
      content:
        "**ETL** transforms before loading into the target system. **ELT** lands data before transforming it in the target platform. Both remain valid.\n\nELT can improve replayability when the landed input is immutable, complete, retained, and accessible under suitable controls. It can also put transformations close to analytical compute and expose them to SQL-based tooling. Those benefits are not automatic: raw retention costs money, source deletions and schema changes complicate replay, and sensitive data may not be permitted in the target.\n\nETL can enforce minimization, redaction, format conversion, or aggregation before crossing a security boundary. It can also reduce target load. Choose the boundary from data classification, source limits, retention, required reprocessing, governance, and measured cost, not from a historical winner narrative.",
    },
    {
      id: "s3",
      title: "dbt materializations",
      readTimeMinutes: 3,
      content:
        "dbt is one tool for managing transformations and their dependencies. In a SQL model, `{{ ref('upstream_model') }}` declares an upstream relation and contributes to the DAG. Materializations determine how a model is represented; exact SQL and supported strategies depend on the adapter.\n\n- **view**, creates a view. Storage is limited to metadata, while query work is deferred to readers.\n- **table**, builds a physical relation. Replacement behavior, atomicity, and grants vary by adapter and configuration.\n- **incremental**, processes a selected subset after the initial build. A `unique_key` can enable update/merge behavior for supporting strategies, but it does not by itself make source selection correct.\n- **ephemeral**, inlines SQL into downstream models as a CTE and creates no standalone relation.\n\nA naive `created_at > max(created_at)` filter misses late arrivals and later updates to older records. A safer design uses a source change token or reprocesses an overlap window, then deduplicates deterministically:\n\n```sql\n-- Adapter-specific interval syntax; validate for the target warehouse.\n{{ config(materialized='incremental', unique_key='order_id') }}\n\nselect order_id, user_id, amount_usd, status, created_at, updated_at\nfrom {{ ref('stg_orders') }}\n{% if is_incremental() %}\n  where updated_at >= (\n    select max(updated_at) - interval '2 day' from {{ this }}\n  )\n{% endif %}\n```\n\nThis is still a pattern, not a production guarantee. Define null handling, duplicate source keys, deletion capture, lookback size, transaction boundary, and reconciliation before calling the model replay-safe.",
    },
    {
      id: "s3b",
      title: "Incremental / SCD",
      readTimeMinutes: 3,
      content:
        "Two common strategies apply incremental changes:\n\n- **MERGE (upsert).** Match source and target on a declared key, then update or insert. Replay safety requires unique and deterministic source rows, stable merge logic, correct deletion handling, and an atomic target commit. Adapter implementations can scan different amounts of target data.\n- **Insert-overwrite (partition replacement).** Recompute a complete target partition or window and replace it. Replay safety requires complete, deterministic input for that boundary and an engine operation that publishes the replacement atomically.\n\nMeasure both against update distribution, partition alignment, target size, concurrency, and engine behavior.\n\n**Slowly Changing Dimensions (SCD).**\n\n- **Type 1**, overwrite the modeled attribute. It represents current state and intentionally does not retain the prior modeled value.\n- **Type 2**, close one effective-dated version and insert another. It supports as-of joins when boundaries, late changes, and corrections are handled correctly, at the cost of more rows and more complex joins.\n\nUse Type 2 only for attributes whose historical state is required. The cost depends on change frequency, row width, indexing, and query pattern; it is not a fixed multiplier.",
      keyTakeaway:
        "Choose SCD Type 1 for current-state attributes and Type 2 where a defined consumer needs effective-dated history; neither is a course-wide default.",
    },
    {
      id: "s4",
      title: "DAG, backfill, retry",
      readTimeMinutes: 2,
      content:
        "The diagram uses a deterministic synthetic 30-day workload with 1, 4, and 10 workers. Days `06`, `14`, and `22` receive fixed retry penalties. It illustrates scheduling and diminishing parallel benefit; it is not a runtime estimate or benchmark.\n\nA replayable batch job accepts an explicit input window and publishes deterministic output for the same input version. `MERGE`, partition replacement, or a transaction can support that goal, but external side effects, nondeterministic functions, late input, duplicates, and concurrent live writes still need explicit handling and reconciliation.",
    },
    {
      id: "s5",
      title: "Orchestrators",
      readTimeMinutes: 2,
      content:
        "Airflow, Dagster, Prefect, and other orchestrators expose different abstractions and deployment models. Product capabilities change, so compare current versions against a requirements list:\n\n- dependency and event semantics;\n- retry, timeout, cancellation, and backfill behavior;\n- concurrency and resource controls;\n- secret handling and execution isolation;\n- logs, metrics, lineage, and ownership;\n- deployment, upgrade, and failure recovery;\n- integration with the team's existing runtime.\n\nThe orchestrator schedules work; it does not make the underlying job deterministic, atomic, or complete.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- **ELT supports replay only when landed input is complete, immutable enough for the purpose, retained, and governed.** ETL can be required at a security or minimization boundary.\n- **Design for retry and backfill.** Explicit windows, deterministic source versions, atomic publication, idempotent external effects, and reconciliation are separate requirements.\n- **Choose materialization from read cost, build cost, freshness, atomicity, and adapter behavior.** Names alone do not prove those properties.\n- **SCD Type 1 versus Type 2 is a history requirement.** Use versioning only where as-of analysis needs it and define late corrections.\n- **MERGE versus partition replacement depends on keys, partition alignment, concurrency, and engine implementation.** Test the actual plan and failure behavior.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Idempotent**, repeating an operation with the same identity and input has no additional intended effect. Scope the claim to the state and side effects included.\n- **Incremental model**, a materialization that processes a selected subset after an initial build. Selection and merge strategy are separate design choices.\n- **SLA / freshness**, the contract or objective between source change and usable target data. Tool-specific configuration must be checked against current documentation.\n- **Lineage**, recorded relationships between jobs, datasets, and fields. Automatic extraction is incomplete when dependencies are dynamic or external.\n- **SCD Type 1**, replaces a modeled attribute and omits prior modeled values.\n- **SCD Type 2**, records effective-dated versions for as-of analysis.\n- **MERGE vs insert-overwrite**, keyed change application versus replacement of a complete boundary; both need deterministic input and atomic publication to support replay.\n- **Sensor**, an orchestrator mechanism that waits or defers until an external condition is observed; polling and event semantics vary by implementation.",
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
          "A nightly job inserts yesterday's orders into `fact_orders`. It crashes halfway through. The on-call retries it. They get duplicate rows. What's wrong with the job?",
        options: [
          "Nothing, that's expected behavior.",
          "It uses `INSERT` instead of `MERGE`/upsert keyed on `order_id`. The job is not idempotent.",
          "It needs a try/catch.",
          "It needs more retries.",
        ],
        correct: 1,
        explanation:
          "Plain `INSERT` appends the same rows during a retry. A deterministic `MERGE` keyed by `order_id`, or atomic replacement of a complete window, can avoid duplicate target effects. Source duplicates, deletions, nondeterministic values, and partial external side effects still require tests.",
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
          "A team is evaluating ELT for a dataset that may require historical reprocessing. Which stated benefit is valid only when the landing zone retains complete governed input?",
        options: [
          "SQL is easier than Python.",
          "Retained landed input can let corrected transformations reprocess history without another source extraction.",
          "Snowflake is faster.",
          "It's the modern way.",
        ],
        correct: 1,
        explanation:
          "A retained landing zone can decouple transformation replay from source availability. It is useful only if input is complete, versioned enough for the requirement, retained, authorized, and compatible with corrected logic. Reprocessing still consumes compute and can require downstream reconciliation.",
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
            a: "State which output and external side effects remain unchanged when the same operation identity and input are repeated. A database write can be idempotent while a notification or API call is not.",
          },
          {
            term: "Incremental model",
            q: "How does dbt do it?",
            a: "Use {% if is_incremental() %} to select a bounded change set, then configure an adapter-supported strategy. A max-timestamp filter can miss late updates; use a change token or overlap plus deterministic deduplication. unique_key behavior depends on the strategy and adapter.",
          },
          {
            term: "SLA / freshness",
            q: "How is freshness specified?",
            a: "A target between source change and usable target data. Monitoring configuration and alert behavior are tool- and version-specific; verify the current implementation.",
          },
          {
            term: "Lineage",
            q: "Why does it matter?",
            a: "Lineage narrows which upstream datasets and jobs could affect an output. Automatically derived graphs can miss dynamic SQL, external APIs, and semantic changes, so ownership and run evidence remain necessary.",
          },
          {
            term: "SCD Type 1",
            q: "When to use it?",
            a: "Overwrite the row in place when an attribute changes. No history. Use when historical values don't matter for reporting (e.g. correcting a typo, updating a phone number). Simple and cheap.",
          },
          {
            term: "SCD Type 2",
            q: "When to use it?",
            a: 'Close the old row (set valid_to + is_current=false) and insert a new row when an attribute changes. Full history preserved. Use when fact tables need to join to dimension-as-of-event-date (e.g. "what region was this customer in when they bought?"). Expensive: one row per version.',
          },
          {
            term: "MERGE vs insert-overwrite",
            q: "Which is idempotent?",
            a: "Either can support replay when the input and logic are deterministic and publication is atomic. MERGE also needs unique source rows and stable match logic; replacement needs a complete partition boundary. Cost depends on the engine and layout.",
          },
          {
            term: "Sensor",
            q: "Airflow concept",
            a: "A task that waits for an external condition (file lands, table updates, API returns 200) before downstream runs. The bridge between event-driven sources and time-driven DAGs.",
          },
        ],
      },
    },
  ],
};

export default lesson;
