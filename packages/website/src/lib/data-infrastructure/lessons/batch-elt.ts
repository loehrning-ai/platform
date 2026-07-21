// Ported from data-infrastructure/lessons/07-batch-elt.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("batch-elt");

const lesson: DataInfraLesson = {
  id: "batch-elt",
  number: 7,
  title: "Batch ETL & Orchestration",
  subtitle: "Airflow · dbt · idempotent merges",
  durationMinutes: 13,
  trackId: "movement",
  hook: "DAGs, retries, atomic publishing. The boring parts that pay the bills.",
  keyConcepts: ["ELT", "dbt materializations", "Idempotency", "MERGE vs insert-overwrite", "SCD Type 1/2", "Backfill"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Shape of batch",
      readTimeMinutes: 2,
      content:
        "A batch pipeline is the simplest data system there is: *at some cadence, take bounded input, run a transformation, produce bounded output.* Every nightly job, every hourly aggregate, every \"regenerate the recommendation table at 3 AM\" cron is this shape.\n\nThe interesting questions aren't whether to use batch, for most analytical workloads, batch is the right answer and streaming is overkill. The interesting questions are about *structure*: where transforms live, how dependencies are expressed, what happens when something fails.",
    },
    {
      id: "s2",
      title: "ETL vs ELT",
      readTimeMinutes: 3,
      content:
        "For thirty years the standard order was **Extract → Transform → Load**. You'd pull data from the source, run it through a transform engine (Informatica, SSIS, custom Python), and only then load the cleaned output into the warehouse. The warehouse was expensive; you didn't waste it on raw data.\n\nAround 2015 that flipped. Snowflake and BigQuery made warehouse compute almost free at the margin. Now the standard order is **Extract → Load → Transform**. Dump raw into the warehouse first, transform in-place using SQL (or dbt). Two reasons it won:\n\n- **Replayability.** Raw lives forever in the warehouse. If your transform has a bug, fix the SQL, re-run, the corrected data is there in 10 minutes. With ETL, the bug is in a transform engine and you may have lost the source.\n- **Tooling democracy.** Anyone who writes SQL can write a transform. With ETL, only the data engineering team owns the transformation tier.\n\nThe only places ETL still wins: regulated data that must be cleaned/redacted before landing (HIPAA, PCI), and source systems where extraction is so heavy that pre-aggregating in the source-side process is necessary.",
    },
    {
      id: "s3",
      title: "dbt materializations",
      readTimeMinutes: 3,
      content:
        "dbt is the standard tool for the *T* in ELT. The mental model is small enough to fit on one slide:\n\n- Every transform is a **model**: a single SQL `SELECT` statement in a file. dbt wraps it in `CREATE TABLE` or `CREATE VIEW`.\n- Models reference other models via `{{ ref('upstream_model') }}`. dbt builds a dependency DAG from those references.\n- Materializations are a config: `view`, `table`, `incremental`, `ephemeral`. Same SQL, different physical strategy.\n- Tests are SQL queries that should return zero rows: `not_null`, `unique`, `relationships`, plus arbitrary custom assertions.\n\nThe four materialization types in detail:\n\n- **view**, a SQL view; no data stored; runs the full query at read time. Zero storage cost, but re-computes everything on every query. Use for lightweight staging models that are fast to compute.\n- **table**, materializes the full SELECT into a physical table every run (`CREATE OR REPLACE TABLE`). Expensive: always a full-refresh. Use for small-to-medium dimension tables where correctness trumps cost.\n- **incremental**, on first run, builds the full table. On subsequent runs, computes only the new/changed rows (using the `{% if is_incremental() %}` filter) and merges them in. Use for large fact tables where full rebuilds are prohibitively expensive. Requires a `unique_key` for safe upserts.\n- **ephemeral**, not materialized at all; inlined as a CTE in downstream models. Use for intermediate transformation logic you want to reuse without a separate table. Invisible to BI tools.\n\n```sql\n-- models/marts/fact_orders.sql\n{{ config(materialized='incremental', unique_key='order_id') }}\n\nselect order_id, user_id, amount_usd, status, created_at\nfrom {{ ref('stg_orders') }}\n{% if is_incremental() %}\n  where created_at > (select max(created_at) from {{ this }})\n{% endif %}\n```\n\nThat's a complete production model. Read fresh rows from staging, append to the table, only on the rows newer than what's already there. Idempotent: re-running the same window is a no-op because the MAX filter excludes already-loaded rows.",
    },
    {
      id: "s3b",
      title: "Incremental / SCD",
      readTimeMinutes: 3,
      content:
        "How you apply incremental changes to a target table is one of the most interview-heavy topics in data engineering. Two physical strategies:\n\n- **MERGE (upsert).** For each incoming row, if a row with the same key already exists in the target, UPDATE it; otherwise INSERT it. Idempotent by construction. Requires a unique key. Works well when you want the latest state only and don't need history. This is dbt's `incremental` + `unique_key` strategy.\n- **Insert-overwrite (partition replacement).** For a given partition (e.g. yesterday's date), DROP the old partition and INSERT the new one. Atomic at the partition level. Works well when you process complete partitions at a time and the partition fully defines the window. No key needed; the entire partition is replaced atomically. Preferred in Spark for large-volume date-partitioned tables because it avoids the per-row lookup cost of MERGE.\n\nTrade-off: MERGE is more flexible (handles any key-based update), but expensive at scale (requires a join against the whole target table or a large target partition). Insert-overwrite is simpler and faster for partition-aligned workloads, but requires that each run fully recomputes the partition.\n\n**Slowly Changing Dimensions (SCD).** When a source attribute changes over time (a customer's email, an employee's department), you have to decide how to model that change:\n\n- **SCD Type 1, overwrite.** When the attribute changes, update the row in place. No history preserved. The dimension always reflects the current state. Simple; cheap. Use when historical accuracy doesn't matter.\n- **SCD Type 2, add a new version.** When the attribute changes, close the old row (`valid_to = change_date`, `is_current = false`) and insert a new row (`valid_from = change_date`, `is_current = true`). Full history preserved; fact tables can join to the dimension-as-of-event-date. Expensive: a single customer update creates a new row; high-churn attributes balloon the table.\n\nAlways ask: \"Does any downstream query need to join facts to the dimension as-of-event-time?\" If yes → Type 2. If no → Type 1. A common mistake is defaulting to Type 2 everywhere, then paying a 10× storage and join-complexity cost for attributes nobody ever queries historically.",
      keyTakeaway:
        "Default to SCD Type 1; only pay for Type 2's history when a downstream query genuinely needs to join facts to the dimension as-of-event-time.",
    },
    {
      id: "s4",
      title: "DAG, backfill, retry",
      readTimeMinutes: 2,
      content:
        "Below: three runs of the same 30-day backfill, drawn against a shared time axis, at 1/4/10 workers. The story is concurrency: workers cut wall time roughly linearly, until the per-task variance and retry overhead start to dominate (notice 4×→10× isn't a clean 2.5× speedup). Days `06`, `14`, `22` fail on first attempt, a partial failure mid-backfill is the realistic case, and what makes a pipeline *good* is whether the retry happens without manual intervention and without contaminating downstream tables.\n\nEvery batch job must be idempotent for a given input window. Run it once, run it ten times, the output is the same. Achieve this with: deterministic `WHERE` clauses on the input window, `MERGE`/upsert instead of `INSERT`, and never `DELETE`-then-`INSERT` without a transaction.",
    },
    {
      id: "s5",
      title: "Orchestrators",
      readTimeMinutes: 2,
      content:
        "| | Airflow | Dagster | Prefect |\n|---|---|---|---|\n| Mental model | Tasks in a DAG | Assets that produce data | Flows of tasks |\n| Strength | Ubiquitous, mature, huge ecosystem | Type-safe IO, asset lineage built-in | Pythonic, dynamic flows, modern API |\n| Friction | Operator-heavy boilerplate | Smaller ecosystem | Hosted-first, less mature on-prem |\n\nFor an interview: pick Airflow if the team is already on it. Pick Dagster if you're starting fresh and care about data quality / lineage. The orchestrator is rarely the bottleneck; the design of your jobs is.",
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
        "- **ELT wins because of replayability.** Raw data preserved in the warehouse means transform bugs are fixable by re-running SQL, not by re-extracting from potentially-changed sources.\n- **Idempotency is non-negotiable.** Every batch job will be retried. A job that produces wrong output on retry is not a batch job, it's a time bomb. Achieve idempotency with MERGE on a unique key or insert-overwrite at the partition level.\n- **Choose dbt materialization deliberately.** view for cheap staging; table for small dimensions needing full correctness; incremental for large fact tables; ephemeral for reusable CTEs. The wrong materialization is a performance bug at scale.\n- **SCD Type 1 vs Type 2 is a product decision.** Type 1 is simpler and cheaper; Type 2 preserves history for as-of queries. Default to Type 1 and only use Type 2 when downstream analysts actually need historical dimension state.\n- **MERGE vs insert-overwrite depends on access pattern.** MERGE for key-based upserts with no partition alignment; insert-overwrite for partition-aligned full refreshes at scale where the per-row join cost of MERGE is prohibitive.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Idempotent**, running a job once or ten times produces the same result; the fundamental discipline of batch.\n- **Incremental model**, a dbt materialization that processes only rows newer than what's already in the table, upserting via `unique_key`.\n- **SLA / freshness**, the target latency between source data appearing and a model being available; dbt exposes `warn_after`/`error_after`, Airflow has DAG-level SLA misses.\n- **Lineage**, the map of which upstream model feeds which downstream model, generated automatically by dbt/Dagster from `ref()`.\n- **SCD Type 1**, overwrite the row in place when an attribute changes; no history.\n- **SCD Type 2**, close the old row and insert a new versioned row when an attribute changes; full history preserved.\n- **MERGE vs insert-overwrite**, MERGE is idempotent by key and flexible but costly at scale; insert-overwrite is idempotent by partition and simpler/faster for partition-aligned workloads.\n- **Sensor**, an Airflow task that waits for an external condition (file lands, table updates, API returns 200) before downstream runs.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "The 3 AM page",
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
          "A re-runnable job should be idempotent: running it twice on the same window produces the same result. `INSERT` appends, re-running duplicates. `MERGE` on a unique key (`order_id`) updates if exists, inserts if not. Idempotency is the fundamental discipline of batch. Most production failures involving \"weird duplicate data\" trace back to a job that wasn't idempotent.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Why ELT won",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A skeptical staff engineer asks: \"We have a Python ETL framework that works fine. Why move to ELT/dbt?\" What's the strongest single argument?",
        options: [
          "SQL is easier than Python.",
          "Raw data lives in the warehouse, so transformations become replayable, fix a bug, re-run, get correct historical data without re-extracting from source.",
          "Snowflake is faster.",
          "It's the modern way.",
        ],
        correct: 1,
        explanation:
          "Replayability is the killer feature. With ETL, if you discover a transform bug six months later, you have to re-extract from source, and the source may have changed, deleted, or rate-limited you. With ELT, raw is preserved in cheap warehouse storage and transforms are pure functions over it. Re-running is free. This is also why \"raw landing zone\" is sacred, never modify raw.",
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
            q: "Why is it the only thing that matters?",
            a: "Because retries, partial failures, and backfills are the rule, not the exception. A non-idempotent job is a job that breaks under retries, and you will retry. Build idempotency in from line one.",
          },
          {
            term: "Incremental model",
            q: "How does dbt do it?",
            a: "{% if is_incremental() %} WHERE ts > (SELECT MAX(ts) FROM {{ this }}) {% endif %}, only process rows newer than what's already in the table. With unique_key, dbt does an upsert (MERGE); without it, an append (INSERT). dbt uses Jinja block tags {% %} for control flow, not expression tags {{ }}.",
          },
          {
            term: "SLA / freshness",
            q: "How is freshness specified?",
            a: "A target latency between source data appearing and the model being available. dbt's sources.yml exposes warn_after and error_after. Airflow has DAG-level SLA misses. Both feed alerts.",
          },
          {
            term: "Lineage",
            q: "Why does it matter?",
            a: "When something breaks downstream, lineage tells you which upstream changed. dbt and Dagster generate lineage automatically from ref(). Without lineage, root-cause analysis is grep + intuition.",
          },
          {
            term: "SCD Type 1",
            q: "When to use it?",
            a: "Overwrite the row in place when an attribute changes. No history. Use when historical values don't matter for reporting (e.g. correcting a typo, updating a phone number). Simple and cheap.",
          },
          {
            term: "SCD Type 2",
            q: "When to use it?",
            a: "Close the old row (set valid_to + is_current=false) and insert a new row when an attribute changes. Full history preserved. Use when fact tables need to join to dimension-as-of-event-date (e.g. \"what region was this customer in when they bought?\"). Expensive: one row per version.",
          },
          {
            term: "MERGE vs insert-overwrite",
            q: "Which is idempotent?",
            a: "Both, but for different reasons. MERGE is idempotent by key: running twice inserts once, updates the second time. Insert-overwrite is idempotent by partition: running twice replaces the same partition twice, always with the same result. MERGE: flexible but costly at scale. Insert-overwrite: simpler and faster for partition-aligned workloads.",
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
