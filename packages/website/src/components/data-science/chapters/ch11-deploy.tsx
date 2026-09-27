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
        hook="Production ties together request handling, feature computation, model serving, monitoring and rollback. Each control lowers one named risk, and none certifies the system."
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
          Production ML is a system of request routing, feature retrieval,
          model serving and monitoring. Give every component an owner,
          timeouts, fallbacks, observability and rollback behavior before you
          trust the end-to-end path.
        </p>
        <ModelServingArchitecture />
      </section>

      <section className="section">
        <SectionLabel n="11.2">Drift detection</SectionLabel>
        <h2 className="h2">
          Data drift and concept drift require different evidence.
        </h2>
        <p className="prose">
          <strong>Data drift</strong> means the input distribution moved: the
          model trained on 2023 users and sees 2025 users behave differently.
          PSI (Population Stability Index) sums (actual − expected) ×
          ln(actual/expected) over buckets and reacts to binning and sample
          size. A threshold like 0.2 is a contextual heuristic, no retraining
          rule, and input drift proves no performance loss.
        </p>
        <p className="prose">
          <strong>Concept drift</strong> is harder to see: the relationship
          between features and labels changes while inputs look the same, so
          the decision boundary is wrong. Detecting it takes outcome labels or
          a defensible proxy, and the monitoring design must state the label
          delay, which ranges from immediate to months.
        </p>
        <DriftSimulator />
      </section>

      <section className="section">
        <SectionLabel n="11.3">Deployment strategies</SectionLabel>
        <h2 className="h2">
          Choose a rollout pattern from the failure cost and reversibility.
        </h2>
        <p className="prose">
          Shadow evaluation compares candidate outputs without acting on them
          and still costs capacity and brings logging, privacy and latency
          risks. A canary exposes an eligible share of traffic to the
          candidate. Blue-green keeps two environments, but state, schemas,
          caches and side effects decide how fast rollback works; the patterns
          combine in any order.
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
          Training-serving skew means training and serving compute a feature
          differently, so the model learned one representation and receives
          another. Shared definitions, versioned transformations,
          point-in-time-correct training joins and parity tests cut that risk.
          A feature store supports the contract but guarantees neither
          freshness and backfills nor dependencies or matching online and
          offline semantics.
        </p>
        <FeatureStoreDiagram />
      </section>

      <AntiPatterns
        items={[
          "<b>No tested rollback path.</b> The old artifact does not help if schemas, state, caches or downstream actions do not roll back with it.",
          "<b>Unobserved candidate behavior.</b> Before promotion, test the candidate on representative inputs via replay, shadow, batch or a staged route.",
          "<b>Monitoring only a delayed outcome metric.</b> Add input quality, feature and prediction distributions, latency, errors and business guardrails, without treating proxies as proof of performance.",
          "<b>Overwriting a model artifact in place.</b> Retraining needs immutable versions, evaluation, approval, staged release and a recoverable rollback path.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Write a rollout contract.</b> Derive eligible traffic, observation window, acceptance metrics, guardrails, label delay, abort authority and rollback from the system's risk.",
          "<b>Calibrate retraining triggers.</b> Set baselines and error budgets, check that an alert is actionable and require outcome evidence when labels exist.",
          "<b>Version data, code, configuration and model.</b> Keep privacy-safe lineage that reproduces training and evaluation.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Model behavior depends on code, data, configuration and context.</b> Monitor every layer and give each alert an owner and a response.",
        ]}
      />
    </>
  );
}
