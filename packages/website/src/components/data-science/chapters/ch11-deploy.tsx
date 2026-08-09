import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { ModelServingArchitecture } from "@/components/data-science/simulators/model-serving-architecture";
import { DriftSimulator } from "@/components/data-science/simulators/drift-simulator";
import { ShadowDeployment } from "@/components/data-science/simulators/shadow-deployment";
import { FeatureStoreDiagram } from "@/components/data-science/simulators/feature-store-diagram";

// ─── Ch11: Deploy ──────────────────────────────────
//
// Typed port of Ch11_Deploy.js (830 lines in source, over the 800-line
// cap). Split into this narrative-only file plus 4 dedicated simulator
// files — the plan's explicitly-named split target is DriftSimulator
// ("drift narrative + monitoring/retrain simulator").

export default function Ch11Deploy() {
  return (
    <>
      <Hero
        eyebrow="Chapter 11 · Deploy"
        title="A deployed model is a <em>maintained system.</em>"
        hook="Production work connects request handling, feature computation, model serving, monitoring, and rollback. Each control reduces a defined risk; none certifies the system by itself."
        meta={[
          { k: "Read", v: "12 min" },
          {
            k: "Focus",
            v: "Serving · Drift · Deployment strategies · Feature stores",
          },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="11.1">Serving architecture</SectionLabel>
        <h2 className="h2">
          Trace the request path and assign each component a failure response.
        </h2>
        <p className="prose">
          Production ML is not a model. It is a system: request routing, feature
          retrieval, model serving, and monitoring wired together. For each
          component, define ownership, timeouts, fallbacks, observability, and
          rollback behavior before relying on the end-to-end path.
        </p>
        <ModelServingArchitecture />
      </section>

      <section className="section">
        <SectionLabel n="11.2">Drift detection</SectionLabel>
        <h2 className="h2">
          Data drift and concept drift require different evidence.
        </h2>
        <p className="prose">
          <strong>Data drift</strong> is when the input distribution shifts,
          your model was trained on 2023 users, but it&apos;s now seeing 2025
          users with different behaviour. Measure it with PSI (Population
          Stability Index): sum of (actual − expected) × ln(actual/expected)
          over buckets. PSI is sensitive to binning and sample size. A threshold
          such as 0.2 is a contextual heuristic, not a universal retraining
          rule, and input drift does not prove performance loss.
        </p>
        <p className="prose">
          <strong>Concept drift</strong> is subtler: the relationship between
          features and labels changes. Even if inputs look the same, the
          model&apos;s decision boundary is now wrong. Detection requires
          outcome labels or another defensible proxy. Label delay depends on the
          product and can range from immediate to months, so the monitoring
          design must state that delay.
        </p>
        <DriftSimulator />
      </section>

      <section className="section">
        <SectionLabel n="11.3">Deployment strategies</SectionLabel>
        <h2 className="h2">
          Choose a rollout pattern from the failure cost and reversibility.
        </h2>
        <p className="prose">
          Shadow evaluation can compare candidate outputs without using them for
          decisions, but still consumes capacity and may create logging,
          privacy, and latency risks. A canary exposes an eligible traffic
          subset to the candidate. Blue-green keeps two environments, but
          rollback speed still depends on state, schemas, caches, and downstream
          side effects. These patterns can be combined; they are not a mandatory
          sequence.
        </p>
        <ShadowDeployment />
      </section>

      <section className="section">
        <SectionLabel n="11.4">
          Feature stores &amp; training-serving skew
        </SectionLabel>
        <h2 className="h2">
          Training and serving need a tested feature contract.
        </h2>
        <p className="prose">
          Training-serving skew is when your training pipeline and serving
          pipeline compute features differently. The model was trained on one
          representation but receives another. Shared definitions, versioned
          transformations, point-in-time-correct training joins, and parity
          tests can reduce this risk. A feature store can support that contract,
          but does not guarantee matching data freshness, backfills,
          dependencies, or online/offline semantics.
        </p>
        <FeatureStoreDiagram />
      </section>

      <AntiPatterns
        items={[
          "<b>No tested rollback path.</b> A stored previous artifact is insufficient when schemas, state, caches, or downstream actions cannot be reversed with it.",
          "<b>Independent feature logic.</b> Different SQL, scalers, windows, or imputation policies between training and serving create skew unless parity is tested.",
          "<b>Unobserved candidate behavior.</b> Before promotion, evaluate the candidate on representative inputs through a risk-appropriate replay, shadow, batch, or staged route.",
          "<b>Monitoring only a delayed outcome metric.</b> Add input quality, feature and prediction distributions, latency, errors, and business guardrails without treating proxies as performance proof.",
          "<b>Overwriting a model artifact in place.</b> Retraining needs immutable versions, evaluation, approval, staged release, and a recoverable rollback path.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Write a rollout contract.</b> Define eligible traffic, observation window, acceptance metrics, guardrails, label delay, abort authority, and rollback behavior from the system's risk.",
          "<b>Calibrate retraining triggers.</b> Establish baselines and error budgets, confirm that an alert is actionable, and require outcome evidence before retraining when labels are available.",
          "<b>Version data, code, configuration, and model.</b> Retain privacy-safe lineage sufficient to reproduce the training and evaluation path.",
          "<b>Share and test feature definitions.</b> Adopt a feature store only when its consistency, latency, ownership, and operating cost fit the system.",
          "<b>Exercise recovery after material changes and on a risk-based cadence.</b> Record whether artifacts, schemas, state, and dependent services actually recover.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Model behavior depends on code, data, configuration, and context.</b> Monitor each layer and connect alerts to an owner and response.",
          "<b>Deployment strategy is risk management.</b> Select shadow, replay, canary, blue-green, or another pattern from exposure, evidence needs, and reversibility.",
          "<b>Feature parity requires controls.</b> Shared definitions help; versioning, point-in-time joins, freshness checks, and online/offline parity tests remain necessary.",
          "<b>Retraining is a release process.</b> Produce immutable candidates, evaluate them against a contract, approve promotion, and retain a tested recovery path.",
        ]}
      />
    </>
  );
}
