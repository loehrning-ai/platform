import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
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
        title="Shipping is <em>chapter one</em>, not chapter twelve."
        hook="A model in a notebook is research. A model in production is engineering. <strong>Architecture, drift, shadow deploys, feature stores</strong>, the craft of keeping a model alive."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Serving · Drift · Deployment strategies · Feature stores" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="11.1">Serving architecture</SectionLabel>
        <h2 className="h2">From notebook to load balancer to feature store, every hop is a failure point.</h2>
        <p className="prose">
          Production ML is not a model. It is a system: request routing, feature retrieval, model serving, and
          monitoring wired together. Understanding each component&apos;s role, and its failure mode, is what
          separates a model that survives its first week from one that silently degrades for months.
        </p>
        <ModelServingArchitecture />
      </section>

      <section className="section">
        <SectionLabel n="11.2">Drift detection</SectionLabel>
        <h2 className="h2">Data drift. Concept drift. Two kinds of rot, one retrain pipeline.</h2>
        <p className="prose">
          <strong>Data drift</strong> is when the input distribution shifts, your model was trained on 2023
          users, but it&apos;s now seeing 2025 users with different behaviour. Measure it with PSI (Population
          Stability Index): sum of (actual − expected) × ln(actual/expected) over buckets. PSI &gt; 0.2 means
          retrain.
        </p>
        <p className="prose">
          <strong>Concept drift</strong> is subtler: the relationship between features and labels changes. Even
          if inputs look the same, the model&apos;s decision boundary is now wrong. Detection requires
          ground-truth labels, a lag of days to weeks in most production systems.
        </p>
        <DriftSimulator />
      </section>

      <section className="section">
        <SectionLabel n="11.3">Deployment strategies</SectionLabel>
        <h2 className="h2">Never ship a model cold. Shadow → canary → blue-green.</h2>
        <p className="prose">
          The goal of a deployment strategy is to reduce the blast radius of a bad model. Shadow deploys give you
          data without risk. Canary gives you real-user signal on a slice. Blue-green gives you instant rollback
          at the cost of doubled infrastructure.
        </p>
        <ShadowDeployment />
      </section>

      <section className="section">
        <SectionLabel n="11.4">Feature stores &amp; training-serving skew</SectionLabel>
        <h2 className="h2">The silent killer: features computed differently at train time vs. serve time.</h2>
        <p className="prose">
          Training-serving skew is when your training pipeline and serving pipeline compute features differently.
          The model was trained on one distribution; it scores on another. The fix is structural: a shared
          feature store that computes transformations once and serves them identically to both pipelines.
        </p>
        <FeatureStoreDiagram />
      </section>

      <AntiPatterns
        items={[
          "<b>No rollback plan.</b> If the new model regresses on day one, you need a one-command revert to the previous artifact.",
          "<b>Training-serving skew.</b> Features computed with different SQL, different scalers, or different imputation strategies at train vs. serve time. A feature store prevents this structurally.",
          "<b>Deploying without shadow.</b> The first time a model runs in production should not be the first time you observe its predictions on live traffic.",
          "<b>Monitoring only accuracy.</b> Accuracy requires labels, which arrive late. Monitor feature distributions (PSI), prediction distribution, and latency as leading indicators.",
          "<b>One monolithic retrain.</b> Retraining is a product: versioned, tested, staged through shadow before promotion. A cron job that overwrites the model artifact is not a retrain pipeline.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Shadow-first, always.</b> Route 100% of live traffic to v2 in shadow mode before any real ramp. Log predictions, compare offline. Only start canary after shadow looks clean.",
          "<b>Define retrain triggers explicitly.</b> PSI &gt; 0.2, AUC &lt; threshold, or label volume dropping below N, pick metrics, set thresholds, automate the alert.",
          "<b>Version everything: data, code, and model.</b> A model artifact without its training data snapshot and feature pipeline commit is not reproducible.",
          "<b>Use a feature store for any feature used in both training and serving.</b> Treat feature definitions as shared library code, not copy-paste SQL.",
          "<b>Test your rollback before you need it.</b> Rollback drills quarterly. If you have never triggered one, you do not know if it works.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Models are code + data + distribution.</b> All three can rot independently. Monitor all three.",
          "<b>Deployment strategy is risk management.</b> Shadow → canary → blue-green is a spectrum of blast-radius control.",
          "<b>Skew is structural, not accidental.</b> Fix it with a shared feature store, not code reviews.",
          "<b>Retrain is a product, not a script.</b> Version it, stage it, roll it back, just like application code.",
        ]}
      />
    </>
  );
}
