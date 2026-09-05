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
        hook="Production ties together request handling, feature computation, model serving, monitoring, and rollback. Each control cuts one defined risk. None of them certifies the system."
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
          Production ML is not a model. It is a system: request routing,
          feature retrieval, model serving, monitoring, all wired together. Give
          every component an owner, timeouts, fallbacks, observability, and a
          rollback behavior before you trust the end-to-end path.
        </p>
        <ModelServingArchitecture />
      </section>

      <section className="section">
        <SectionLabel n="11.2">Drift detection</SectionLabel>
        <h2 className="h2">
          Data drift and concept drift require different evidence.
        </h2>
        <p className="prose">
          <strong>Data drift</strong> means the input distribution moved. Your
          model trained on 2023 users and now sees 2025 users behaving
          differently. Measure it with PSI (Population Stability Index): sum of
          (actual − expected) × ln(actual/expected) over buckets. PSI reacts to
          binning and sample size. A threshold like 0.2 is a contextual
          heuristic, no universal retraining rule, and input drift proves no
          performance loss.
        </p>
        <p className="prose">
          <strong>Concept drift</strong> hides better. The relationship between
          features and labels changes while the inputs still look the same, and
          the decision boundary is now wrong. Detecting it takes outcome labels
          or another defensible proxy. Label delay runs from immediate to
          months depending on the product, so the monitoring design has to state
          that delay.
        </p>
        <DriftSimulator />
      </section>

      <section className="section">
        <SectionLabel n="11.3">Deployment strategies</SectionLabel>
        <h2 className="h2">
          Choose a rollout pattern from the failure cost and reversibility.
        </h2>
        <p className="prose">
          Shadow evaluation compares candidate outputs without acting on them,
          and it still burns capacity and can create logging, privacy, and
          latency risks. A canary exposes an eligible traffic subset to the
          candidate. Blue-green keeps two environments, though rollback speed
          still hangs on state, schemas, caches, and downstream side effects.
          Combine these patterns. They are no mandatory sequence.
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
          Training-serving skew means the training pipeline and the serving
          pipeline compute features differently. The model learned one
          representation and receives another. Shared definitions, versioned
          transformations, point-in-time-correct training joins, and parity
          tests cut that risk. A feature store supports the contract. It
          guarantees no matching data freshness, backfills, dependencies, or
          online and offline semantics.
        </p>
        <FeatureStoreDiagram />
      </section>

      <AntiPatterns
        items={[
          "<b>No tested rollback path.</b> A stored previous artifact is insufficient when schemas, state, caches, or downstream actions cannot be reversed with it.",
          "<b>Independent feature logic.</b> Different SQL, scalers, windows, or imputation policies between training and serving create skew until parity is tested.",
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
          "<b>Model behavior depends on code, data, configuration, and context.</b> Monitor every layer and wire each alert to an owner and a response.",
          "<b>Deployment strategy is risk management.</b> Select shadow, replay, canary, blue-green, or another pattern from exposure, evidence needs, and reversibility.",
          "<b>Feature parity requires controls.</b> Shared definitions help; versioning, point-in-time joins, freshness checks, and online/offline parity tests remain necessary.",
          "<b>Retraining is a release process.</b> Build immutable candidates, evaluate them against a contract, approve the promotion, and keep a tested recovery path.",
        ]}
      />
    </>
  );
}
