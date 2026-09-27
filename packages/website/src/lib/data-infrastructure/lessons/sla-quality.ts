// Ported from data-infrastructure/lessons/11-sla-quality.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("sla-quality");

const lesson: DataInfraLesson = {
  id: "sla-quality",
  number: 11,
  title: "SLAs, Observability & Data Quality",
  subtitle: "Freshness · volume · drift · lineage",
  durationMinutes: 16,
  trackId: "scale",
  hook: "Define measurable reliability targets, detect silent data defects, and route incidents with evidence.",
  keyConcepts: [
    "Freshness",
    "Completeness",
    "Accuracy",
    "dbt tests",
    "Data observability",
    "Lineage",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "The three numbers",
      readTimeMinutes: 2,
      content:
        "A pipeline can run perfectly and still publish wrong numbers. Infrastructure metrics show whether jobs run; data reliability needs three product-facing signals:\n\n- **Freshness.** How far the data trails the relevant business time, for example latest accepted event time against now. The definition must handle expected source activity, empty periods and delayed events.\n- **Completeness.** Whether the expected records or aggregates arrived. Row counts against a fitting baseline are a proxy and prove nothing about every event.\n- **Accuracy.** Whether values meet schema, range, relationship and domain rules, checked explicitly.\n\nA stopped pipeline usually shows first as a freshness failure. A transformation defect can keep freshness healthy while it breaks completeness or accuracy, and CPU or job-success graphs miss it.",
    },
    {
      id: "s2",
      title: "Reliability model",
      readTimeMinutes: 2,
      content:
        "The model shows how three failure types move the signals. Its values are fixed examples, not production thresholds, and a green dashboard means only that the measured conditions sit inside their limits.\n\nDerive each SLO from a user need, a measurement window, an error budget and the consequence of a miss; a finance close needs other definitions than an exploratory dashboard. Validate thresholds against history before you page anyone on them.",
    },
    {
      id: "s3",
      title: "Test families",
      readTimeMinutes: 2,
      content:
        "| Family | Detects | Typical trade-off |\n|---|---|---|\n| Schema | added, removed or retyped fields; nullability changes | Fast at an interface; compatibility rules need an owner |\n| Constraint | null, uniqueness, relationship and range violations | Cost grows with table size, query shape and frequency |\n| Anomaly / volume | unexpected count or distribution changes | Needs a representative baseline and false-positive review |\n| Reconciliation | mismatches between independently derived totals or record sets | Strong evidence for an invariant; often scans a lot of data |\n\nPick tests by business risk and execution cost: interface checks early, sampled or incremental checks on large datasets where justified, expensive reconciliation for the invariants that matter. No single family proves end-to-end correctness.",
    },
    {
      id: "s4",
      title: "dbt tests",
      readTimeMinutes: 2,
      content:
        "```yaml\n# models/marts/fact_orders.yml\nmodels:\n  - name: fact_orders\n    columns:\n      - name: order_id\n        tests: [unique, not_null]\n      - name: amount_usd\n        tests:\n          - not_null\n          - dbt_utils.accepted_range:\n              min_value: 0\n              max_value: 1000000\n      - name: status\n        tests:\n          - accepted_values:\n              values: ['pending','paid','shipped','refunded','cancelled']\n    tests:\n      - dbt_utils.equal_rowcount:\n          compare_model: ref('stg_orders')  # reconciliation\n```\n\nA dbt data test is a query whose returned rows are violations; commands, selection rules, adapter and CI decide when it runs. `equal_rowcount` is valid only when both models share grain and filter scope. Give each test an owner, a severity, a cadence and a documented response.",
    },
    {
      id: "s5",
      title: "Declared and learned checks",
      readTimeMinutes: 3,
      content:
        "Declared checks encode known invariants: a key is unique, an amount is non-negative, a reconciliation difference stays within tolerance. They are reviewable and deterministic, and detect only what somebody specified. dbt data tests or Great Expectations run them, with version-dependent sources and reporting.\n\nLearned checks estimate an expected range from historical counts, null rates or distributions. They surface unexpected changes and also fire on seasonality, launches, outages and sparse data.\n\nChoose coverage from requirements:\n\n- declared checks for contracts and business invariants;\n- learned checks where history is informative and someone tunes the detector;\n- a list of datasets that may be profiled, since samples can carry sensitive data;\n- a test of alert precision, warehouse cost, access control, retention, lineage coverage and export on representative data.",
    },
    {
      id: "s6",
      title: "Lineage & alerts",
      readTimeMinutes: 3,
      content:
        "An anomaly in `fact_orders.amount_usd` is a symptom. Lineage narrows the search by showing dependencies between jobs and datasets; it does not prove which change caused the defect, and gaps in instrumentation hide paths.\n\nA practical incident loop:\n\n1. Define SLI, target, owner and response for each important dataset.\n2. Emit test and pipeline outcomes with stable job and dataset identifiers.\n3. Investigate with lineage, recent deployments, source health and sample reconciliation.\n4. Route the alert to the team owning the failing boundary once evidence shows it; until then, to the triage owner.\n\nOpenLineage defines events for job runs, datasets and extensible facets. Coverage varies by tool and version, so inspect the real events before routing on them. Protect lineage metadata: names, query facets and failure details expose internal structure and sometimes sensitive values.",
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on silent defects and routing.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **SLI / SLO / SLA**, measured signal, its target over a window, and an agreement with consequences.\n- **Completeness proxy**, a count, coverage ratio or reconciliation difference.\n- **Anomaly detection**, compares observations with an expected range.\n- **Data contract**, a versioned producer-consumer agreement on structure, meaning and quality.",
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
          'The pipeline is green: jobs succeeded, latency normal, no errors. Marketing says the conversion rate has been wrong for three days. Most likely cause?',
        options: [
          "A rendering bug in the dashboard.",
          "A silent accuracy or completeness regression, such as a join dropping rows.",
          "CPU saturation on the workers.",
          "A network partition between regions.",
        ],
        correct: 1,
        explanation:
          "Job success and latency say nothing about the result; an enum change, join-key mismatch or unit change alters output without failing. A reconciliation test at the right grain catches it.",
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
          "fact_orders is missing 30% of expected rows. Lineage: fact_orders ← stg_orders ← raw_orders ← Postgres CDC. CDC has sent 0 events in 4 hours. Who gets paged?",
        options: [
          "The dbt model owner, where the test failed.",
          "The dashboard team, who noticed.",
          "The CDC or source-system team, where the gap starts.",
          "Everyone, simultaneously.",
        ],
        correct: 2,
        explanation:
          "The first gap appears at the CDC boundary, so its owner checks connector and source health; downstream correctly shows that nothing arrived. Lineage does not say whether connector, credentials, database or instrumentation failed.",
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
            term: "SLA / SLO / SLI",
            q: "The hierarchy",
            a: "SLI: a measured reliability signal. SLO: its target over a window. SLA: an agreement that can set consequences for misses.",
          },
          {
            term: "Freshness",
            q: "How is it computed?",
            a: "Delay between available data and the business time it represents, adjusted for expected source activity, delayed events and empty periods.",
          },
          {
            term: "Volume / row count",
            q: "A robust simple alert",
            a: "Compare a count or coverage ratio with a representative baseline and check the tolerance against seasonality. It is a proxy for completeness.",
          },
          {
            term: "Anomaly detection",
            q: "Why isn't it everywhere?",
            a: "History shifts, and sparse or seasonal data raises false alerts. Use it only where an owner tunes the detector.",
          },
          {
            term: "Data contract",
            q: "What is it?",
            a: "A versioned producer-consumer agreement on structure, field meaning, compatibility, quality, ownership and change handling.",
          },
          {
            term: "Great Expectations",
            q: "Declared vs learned?",
            a: "Declared: a framework for expectations and validation runs. Sources and reporting depend on version and integration.",
          },
          {
            term: "Monte Carlo",
            q: "Declared vs learned?",
            a: "Learned: a commercial observability product. Check its detectors, coverage, access control, cost, retention and export against your needs.",
          },
          {
            term: "OpenLineage",
            q: "What is it?",
            a: "An extensible event model for job runs, datasets and facets. Coverage depends on the emitting integration.",
          },
        ],
      },
    },
  ],
};

export default lesson;
