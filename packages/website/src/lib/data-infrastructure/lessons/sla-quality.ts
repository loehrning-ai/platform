// Ported from data-infrastructure/lessons/11-sla-quality.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("sla-quality");

const lesson: DataInfraLesson = {
  id: "sla-quality",
  number: 11,
  title: "SLAs, Observability & Data Quality",
  subtitle: "Freshness · volume · drift · lineage",
  durationMinutes: 16,
  trackId: "scale",
  hook: "Five layers of monitoring. What to alert on. What to ignore. How to never debug at 2am again.",
  keyConcepts: ["Freshness", "Completeness", "Accuracy", "dbt tests", "Data observability", "Lineage"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "The three numbers",
      readTimeMinutes: 2,
      content:
        "Software systems are observable through latency, errors, and saturation. Data systems need a different triple. The IC5 framing:\n\n- **Freshness.** How recent is the data? Specifically: what is `now()` minus the max event time of rows currently in the table? \"Lag\" or \"staleness\" are synonyms.\n- **Completeness.** Are we missing rows we should have? Sometimes called \"volume\" — yesterday's row count is a robust proxy for \"did we get all the events.\"\n- **Accuracy.** Are the values right? Schema-conforming, in-range, internally consistent. The hardest of the three to instrument because \"right\" is domain-specific.\n\nAn outage is when freshness goes to infinity (the pipeline is dead). A data quality bug is when freshness is fine but completeness or accuracy is silently wrong. Both wake people up; only one is detectable from a CPU graph.",
      keyTakeaway:
        "Freshness, completeness, accuracy — an outage breaks freshness, but a data quality bug can hide behind a perfectly green freshness metric.",
    },
    {
      id: "s2",
      title: "Live dashboard",
      readTimeMinutes: 2,
      content:
        "Inject failures below and watch how each metric responds. Notice that \"the dashboard is green\" does not mean \"the data is right\" — it means \"the metrics we instrumented look healthy.\"\n\nWhen designing a pipeline, define the SLO before you write the first query — \"Freshness ≤ 15 min, completeness ≥ 99.9% of yesterday's count, schema-conforming row rate ≥ 99.99%.\" Then build the alerts. Anything else is decoration.",
    },
    {
      id: "s3",
      title: "Test families",
      readTimeMinutes: 2,
      content:
        "| Family | Detects | Cost |\n|---|---|---|\n| Schema | column added/removed/retyped, nullability change | Free — registry rejects |\n| Constraint | not_null, unique, foreign-key, range | Cheap — declarative SQL |\n| Anomaly / volume | row count drift, value-distribution drift | Medium — needs history baseline |\n| Reconciliation | downstream sum ≠ upstream sum, FK joins lose rows | High — runs full joins |\n\nRun all four. Schema and constraint tests on every model, every run — they're cheap. Anomaly tests on the high-value tables — they catch the silent bugs. Reconciliation tests for the metrics your CFO looks at — expensive but the only thing that proves correctness end-to-end.",
    },
    {
      id: "s4",
      title: "dbt tests",
      readTimeMinutes: 2,
      content:
        "```yaml\n# models/marts/fact_orders.yml\nmodels:\n  - name: fact_orders\n    columns:\n      - name: order_id\n        tests: [unique, not_null]\n      - name: amount_usd\n        tests:\n          - not_null\n          - dbt_utils.accepted_range:\n              min_value: 0\n              max_value: 1000000\n      - name: status\n        tests:\n          - accepted_values:\n              values: ['pending','paid','shipped','refunded','cancelled']\n    tests:\n      - dbt_utils.equal_rowcount:\n          compare_model: ref('stg_orders')  # reconciliation\n```\n\nEach test is just a SELECT that should return zero rows. dbt runs them all after every build, fails the run if any return rows, and posts the failures to your CI. This is the cheapest \"data quality\" you can buy and the highest-leverage. If you do nothing else from this lesson, do this.",
    },
    {
      id: "s5",
      title: "GX & Monte Carlo",
      readTimeMinutes: 3,
      content:
        "dbt tests are powerful for model-level constraints but they run only when dbt runs. For continuous, production-grade quality monitoring across the whole data platform — including raw ingestion layers that dbt never touches — two frameworks dominate.\n\n**Great Expectations (GX)** is an open-source Python library and platform. You define expectations against a dataset — \"column X is not null,\" \"values are between 0 and 1,000,000,\" \"row count is within 10% of last run\" — and GX generates a data document (rendered HTML report) with pass/fail per expectation per run. Key concepts:\n\n- *Expectation Suite* — a named collection of expectations for a data asset.\n- *Checkpoint* — a run configuration that pairs a suite with a validator (Pandas, Spark, SQL) and an action list (alert, save results, update data docs).\n- *Data Docs* — auto-generated HTML showing expectation pass rates over time.\n\n**Monte Carlo** is a commercial data observability platform. Instead of you writing explicit rules, Monte Carlo learns your tables' statistical baselines automatically — row count distribution, null rate distribution, schema history — and alerts on anomalies without manual threshold setting. The key distinction from GX: GX runs declared rules on pipeline trigger and fails loudly when expectations break; Monte Carlo runs learned baselines continuously and alerts on statistical drift you didn't anticipate.\n\nThe answer to \"which should we use?\" is both, at different layers. GX (or dbt tests) at the model/transform layer for business-logic correctness. Monte Carlo (or an equivalent like Bigeye, Datafold, Soda) at the platform layer for anomaly detection across raw sources and high-value tables. Neither replaces the other.",
    },
    {
      id: "s6",
      title: "Lineage & alerts",
      readTimeMinutes: 3,
      content:
        "An anomaly in `fact_orders.amount_usd` is half a debugging job. The other half is: which upstream change caused this? Lineage answers that. dbt's auto-generated DAG, OpenLineage events, Datahub, Atlan — all provide the same picture: given a problem in a downstream table, walk back to find which upstream model or source last changed.\n\nThe end-to-end loop:\n\n1. SLO defined per table: freshness, volume, schema, constraints.\n2. Tests run on every build. Failures emit events.\n3. Lineage tags every event with upstream context.\n4. Alerts page the team that owns the upstream source, not the downstream consumer.\n\nThat last step is the IC5 move. The default of \"page whoever owns the broken table\" is wrong — usually the broken table is correctly reflecting a broken upstream, and the on-call wastes 40 minutes finding that out manually.\n\n**OpenLineage** is the open standard (CNCF project) for lineage event emission. Airflow, dbt, Spark, and Flink all have OpenLineage integrations — every job emits `RunEvent` messages with input/output dataset names and facets. Marquez is the open-source backend; commercial platforms (Monte Carlo, Datahub, Atlan) also ingest OpenLineage.",
      keyTakeaway:
        "Alerts should page whoever owns the upstream source of the failure, not whoever owns the downstream table that's merely reflecting it correctly.",
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **SLA / SLO / SLI** — SLI is the metric (freshness in minutes), SLO is the target (≤15 min, 99% of the time), SLA is the contract with consequences.\n- **Freshness** — `now() - max(event_time)` in the target table, not `now() - max(load_ts)` which only measures scheduler health.\n- **Volume / row count** — compare today's row count to a rolling-7-day baseline; alert outside a tolerance band.\n- **Anomaly detection** — learned, statistical thresholds; expensive in false positives, so start with hard thresholds first.\n- **Data contract** — an explicit, versioned schema + semantic contract between a source and a downstream consumer.\n- **Great Expectations** — declared rules you write and GX checks; best for model-layer, code-as-config quality rules.\n- **Monte Carlo** — learned baselines inferred from historical data; best for platform-layer anomaly detection across raw sources.\n- **OpenLineage** — a CNCF open standard for lineage event emission, integrated into Airflow, dbt, Spark, and Flink.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "The silent bug",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "A pipeline reports green: jobs succeeded, latency normal, no errors. Marketing escalates: \"the conversion rate dashboard has been wrong for three days.\" Most likely cause?",
        options: [
          "A bug in the dashboard.",
          "An accuracy or completeness regression — schema looks fine, jobs run fine, but a value was silently wrong (a join dropped rows, a unit changed, an enum had a new value treated as null). Standard health metrics don't catch this; reconciliation tests do.",
          "CPU saturation.",
          "A network partition.",
        ],
        correct: 1,
        explanation:
          "This is the classic \"data quality bug\" — the pipeline is technically healthy but the output is wrong. Causes: an upstream enum gained a value that didn't match a CASE statement (silently NULL); a join lost rows because of a key-format change; a unit conversion drifted. The fix is reconciliation: SUM(fact) MUST EQUAL SUM(source), run as a test, every build. Without it, you'll find out from your VP.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Where to alert",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "fact_orders is missing 30% of expected rows today. Lineage shows fact_orders ← stg_orders ← raw_orders ← Postgres CDC. CDC has 0 events for the last 4 hours. Which team gets paged?",
        options: [
          "The dbt model owner — that's where the test failed.",
          "The dashboard team — they're the ones complaining.",
          "The CDC / source-system team. Lineage shows the gap is at the source; downstream is correctly reflecting nothing-arrived. Paging the dbt owner wastes everyone's time.",
          "Everyone, simultaneously.",
        ],
        correct: 2,
        explanation:
          "The IC5 move: walk lineage to the root before paging. The dbt model accurately reflects its input, which is empty — there's no bug there. The bug is at the CDC connector or the source DB. Auto-routing alerts via lineage saves 30+ minutes of \"is it me or is it upstream\" debugging on every incident. This is the bar a real data platform sets.",
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
            term: "SLA / SLO / SLI",
            q: "The hierarchy",
            a: "SLI: the metric (freshness in minutes). SLO: the target (≤15 min, 99% of the time). SLA: the contract with consequences ($X credit if missed). Borrow from SRE.",
          },
          {
            term: "Freshness",
            q: "How is it computed?",
            a: "now() - max(event_time) in the target table. Not now() - max(load_ts) — that just measures pipeline scheduler health, not data lag.",
          },
          {
            term: "Volume / row count",
            q: "A robust simple alert",
            a: "Compare today's row count to a rolling-7-day baseline. Alert if it's outside [-20%, +50%]. Catches \"the API stopped sending events\" failures with one query.",
          },
          {
            term: "Anomaly detection",
            q: "Why isn't it everywhere?",
            a: "Because false positives are expensive. ML-based detectors look great in demos and page you constantly in production. Start with hard thresholds; add anomaly detection only on metrics where the team is willing to tune.",
          },
          {
            term: "Data contract",
            q: "What is it?",
            a: "An explicit, versioned schema + semantic contract between a source and a downstream consumer. Schema registry enforces the schema; the contract adds field semantics, freshness, and ownership. The 2024+ way to stop \"schema drift broke prod\" incidents.",
          },
          {
            term: "Great Expectations",
            q: "Declared vs learned?",
            a: "Declared rules — you write expectations (not_null, in_range, row count ±10%) and GX checks them. Best for model-layer, code-as-config quality rules. Reports via Data Docs HTML. Integrates with dbt, Airflow, Spark.",
          },
          {
            term: "Monte Carlo",
            q: "Declared vs learned?",
            a: "Learned baselines — MC infers distribution, null rate, volume baselines from historical data and alerts on drift without manual threshold setting. Best for platform-layer anomaly detection across raw sources.",
          },
          {
            term: "OpenLineage",
            q: "What is it?",
            a: "A CNCF open standard for lineage event emission. Jobs emit RunEvent messages with input/output datasets. Airflow, dbt, Spark, Flink all have integrations. Marquez is the open-source backend; commercial platforms also ingest it.",
          },
        ],
      },
    },
  ],
};

export default lesson;
