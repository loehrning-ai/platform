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
        "Infrastructure metrics show whether jobs and services are running. Data reliability also needs product-facing signals:\n\n- **Freshness.** How far the available data trails the relevant business time. A useful SLI might compare the latest accepted event time with the current time, but the definition must account for expected source activity, empty periods, and delayed events.\n- **Completeness.** Whether the expected records or aggregates arrived. Row counts can be a useful proxy when compared with an appropriate baseline; they do not prove that every event arrived.\n- **Accuracy.** Whether values satisfy schema, range, relationship, and domain rules. Accuracy is domain-specific and usually needs explicit checks.\n\nA stopped pipeline often appears first as a freshness failure. A transformation defect can leave freshness healthy while corrupting completeness or accuracy. CPU and job-success graphs cannot distinguish those cases.",
      keyTakeaway:
        "Track freshness, completeness, and accuracy separately; a healthy job can still publish incorrect data.",
    },
    {
      id: "s2",
      title: "Reliability model",
      readTimeMinutes: 2,
      content:
        "Use the model below to compare how three failure types affect the available signals. Its values are fixed examples, not production thresholds. A green dashboard means only that the measured conditions are within their configured limits.\n\nDefine each SLO from a user need, a measurement window, an allowed error budget, and the consequence of a miss. For example, a finance close and an exploratory dashboard require different freshness and completeness definitions. Validate thresholds against historical behavior before paging on them.",
    },
    {
      id: "s3",
      title: "Test families",
      readTimeMinutes: 2,
      content:
        "| Family | Detects | Typical trade-off |\n|---|---|---|\n| Schema | added, removed, or retyped fields; nullability changes | Fast when enforced at an interface, but compatibility rules still need ownership |\n| Constraint | null, uniqueness, relationship, and range violations | Cost grows with table size, query shape, and execution frequency |\n| Anomaly / volume | unexpected count or distribution changes | Needs a representative baseline and false-positive review |\n| Reconciliation | disagreements between independently derived totals or record sets | Strong evidence for a defined invariant, but often scans or joins substantial data |\n\nSelect tests from business risk and execution cost. Run interface checks early, sample or incrementally evaluate large datasets where justified, and reserve expensive reconciliation for invariants that matter. No single family proves general end-to-end correctness.",
    },
    {
      id: "s4",
      title: "dbt tests",
      readTimeMinutes: 2,
      content:
        "```yaml\n# models/marts/fact_orders.yml\nmodels:\n  - name: fact_orders\n    columns:\n      - name: order_id\n        tests: [unique, not_null]\n      - name: amount_usd\n        tests:\n          - not_null\n          - dbt_utils.accepted_range:\n              min_value: 0\n              max_value: 1000000\n      - name: status\n        tests:\n          - accepted_values:\n              values: ['pending','paid','shipped','refunded','cancelled']\n    tests:\n      - dbt_utils.equal_rowcount:\n          compare_model: ref('stg_orders')  # reconciliation\n```\n\nGeneric and singular dbt data tests are queries whose failing rows represent a violated assertion. When and where they run depends on the project's commands, selection rules, adapter, and CI configuration. The example checks useful invariants, but `equal_rowcount` is valid only when the two models are expected to contain the same grain and filtering scope. Treat tests as executable contracts with an owner, severity, execution cadence, and documented response.",
    },
    {
      id: "s5",
      title: "Declared and learned checks",
      readTimeMinutes: 3,
      content:
        "Declared checks encode known invariants: a key is unique, an amount is non-negative, or a reconciliation difference stays within a documented tolerance. They are reviewable and deterministic, but they detect only conditions someone specified. Frameworks such as dbt data tests or Great Expectations can execute these checks; their supported data sources, orchestration, and reporting behavior depend on the configured version and integration.\n\nLearned checks estimate an expected range from historical counts, null rates, or value distributions. They can surface changes nobody anticipated, but seasonality, launches, outages, and sparse data can create false alerts. Commercial and open-source observability products implement different versions of this approach.\n\nChoose coverage from requirements rather than brand categories:\n\n- use declared checks for contracts and business invariants;\n- use learned checks where historical behavior is informative and someone can tune the detector;\n- define which datasets may be profiled, because samples and diagnostics can contain sensitive data;\n- evaluate alert precision, warehouse cost, access controls, retention, lineage coverage, and exportability with representative data.\n\nThe methods can complement each other. Neither is mandatory at every layer.",
    },
    {
      id: "s6",
      title: "Lineage & alerts",
      readTimeMinutes: 3,
      content:
        "An anomaly in `fact_orders.amount_usd` identifies a symptom. Lineage can narrow the investigation by showing declared or observed dependencies between jobs and datasets. It does not by itself prove which change caused the defect, and incomplete instrumentation can omit important paths.\n\nA practical incident loop:\n\n1. Define an SLI, target, owner, and response for each important dataset or data product.\n2. Emit test and pipeline outcomes with stable job and dataset identifiers.\n3. Use lineage, recent deployments, source health, and sample reconciliation as investigation evidence.\n4. Route the alert to the responsible team only after the evidence identifies the failing boundary; otherwise route it to the owning triage path.\n\nOpenLineage defines an event model for job runs, datasets, and extensible facets. Integrations and emitted detail vary by tool and version, so verify the actual events before relying on them for routing or impact analysis. Protect lineage metadata as operational information: names, query facets, and failure details can expose internal structure or sensitive values.",
      keyTakeaway:
        "Use lineage as investigation evidence, then route an alert to the owner of the failing boundary rather than assuming the nearest upstream system is at fault.",
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
        "- **SLI / SLO / SLA**, an SLI is a measured reliability signal, an SLO is its target over a window, and an SLA is a service agreement that may define consequences.\n- **Freshness**, the delay between the data available to a consumer and the business time it represents; the exact formula depends on source behavior.\n- **Completeness proxy**, a measurable signal such as a count, coverage ratio, or reconciliation difference; a proxy is not proof that every record arrived.\n- **Anomaly detection**, a method that compares observations with an expected range and needs false-positive and drift management.\n- **Data contract**, a versioned agreement covering structure, semantics, quality expectations, ownership, and compatibility.\n- **Declared check**, an explicit invariant evaluated against data.\n- **Learned check**, an expected range inferred from historical observations.\n- **OpenLineage**, an extensible event model for job, run, and dataset metadata; emitted coverage depends on instrumentation.",
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
          'A pipeline reports green: jobs succeeded, latency normal, no errors. Marketing escalates: "the conversion rate dashboard has been wrong for three days." Most likely cause?',
        options: [
          "A bug in the dashboard.",
          "An accuracy or completeness regression, schema looks fine, jobs run fine, but a value was silently wrong (a join dropped rows, a unit changed, an enum had a new value treated as null). Standard health metrics don't catch this; reconciliation tests do.",
          "CPU saturation.",
          "A network partition.",
        ],
        correct: 1,
        explanation:
          "Successful jobs and normal latency do not validate the result. An enum change, join-key mismatch, or unit conversion can alter the output without failing the pipeline. Add a reconciliation that matches the intended grain and accounting rules, then run it at a cadence justified by risk and cost.",
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
          "The dbt model owner, that's where the test failed.",
          "The dashboard team, they're the ones complaining.",
          "The CDC / source-system team. Lineage shows the gap is at the source; downstream is correctly reflecting nothing-arrived. Paging the dbt owner wastes everyone's time.",
          "Everyone, simultaneously.",
        ],
        correct: 2,
        explanation:
          "The evidence places the first observed gap at the CDC boundary, so its owner should investigate the connector and source health. Lineage narrows the search; it does not prove whether the connector, credentials, source database, or instrumentation caused the gap.",
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
            a: "SLI: a measured reliability signal. SLO: its target over a defined window. SLA: a service agreement that may specify consequences for misses.",
          },
          {
            term: "Freshness",
            q: "How is it computed?",
            a: "Measure the delay between available data and the business time it represents. The formula must account for expected source activity, delayed events, and empty periods.",
          },
          {
            term: "Volume / row count",
            q: "A robust simple alert",
            a: "Compare a count or coverage ratio with a representative baseline and review the tolerance against seasonality. Treat it as a completeness proxy, not proof.",
          },
          {
            term: "Anomaly detection",
            q: "Why isn't it everywhere?",
            a: "Historical behavior can change, and sparse or seasonal data creates false alerts. Use it only where an owner can review and tune the detector.",
          },
          {
            term: "Data contract",
            q: "What is it?",
            a: "A versioned agreement covering structure, field meaning, compatibility, quality expectations, ownership, and change handling between producers and consumers.",
          },
          {
            term: "Great Expectations",
            q: "Declared vs learned?",
            a: "A framework for declared expectations and validation workflows. Supported data sources, actions, and reporting behavior depend on the configured version and integration.",
          },
          {
            term: "Monte Carlo",
            q: "Declared vs learned?",
            a: "A commercial observability product that includes learned monitoring. Evaluate its detector behavior, coverage, access controls, cost, retention, and exportability against requirements.",
          },
          {
            term: "OpenLineage",
            q: "What is it?",
            a: "An extensible event model for job runs, datasets, and metadata facets. Actual lineage coverage depends on the emitting integration and configuration.",
          },
        ],
      },
    },
  ],
};

export default lesson;
