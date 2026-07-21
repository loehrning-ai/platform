import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
import { SHAPWaterfallSim } from "@/components/data-science/simulators/shap-waterfall-sim";
import { LIMEExplainer } from "@/components/data-science/simulators/lime-explainer";
import { PermutationImportance } from "@/components/data-science/simulators/permutation-importance";
import { GlobalVsLocal } from "@/components/data-science/simulators/global-vs-local";

// ─── Ch07: Interpret ────────────────────────────────
//
// Typed port of Ch07_Interpret.js (710 lines in source). All 4 simulators
// live in their own files under simulators/, which is itself what keeps
// this narrative file under the 800-line cap.

export default function Ch07Interpret() {
  return (
    <>
      <Hero
        eyebrow="Chapter 07 · Interpret"
        title="A model you can&rsquo;t explain is a <em>liability.</em>"
        hook='A 0.91 AUC model is worthless to the business until you can answer <strong>&ldquo;why did it say yes?&rdquo;</strong>. SHAP, LIME, permutation importance — the toolkit for accountability.'
        meta={[
          { k: "Read", v: "10 min" },
          { k: "Focus", v: "SHAP · LIME · Permutation" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="07.1">Per-instance explanations — SHAP</SectionLabel>
        <h2 className="h2">SHAP: game theory meets ML.</h2>
        <p className="prose">
          SHAP (SHapley Additive exPlanations) distributes &quot;prediction credit&quot; across
          features using cooperative game theory. For each prediction, see exactly which features
          pushed it toward approval — and by how much. The waterfall chart shows the running total
          from baseline to final score. Slide each feature to see contributions shift in real time.
        </p>
        <SHAPWaterfallSim />
      </section>

      <section className="section">
        <SectionLabel n="07.2">Local approximation — LIME</SectionLabel>
        <h2 className="h2">Complex model, simple explanation — nearby.</h2>
        <p className="prose">
          LIME (Local Interpretable Model-agnostic Explanations) sidesteps the global complexity
          by asking a simpler question: <em>what linear model fits the model&apos;s behavior around
          this one point?</em>It samples nearby points, weights them by proximity, and fits a
          lightweight proxy. Move the query point and watch the local boundary shift.
        </p>
        <LIMEExplainer />
      </section>

      <section className="section">
        <SectionLabel n="07.3">Global feature importance — permutation</SectionLabel>
        <h2 className="h2">Corrupt one column. Measure the damage.</h2>
        <p className="prose">
          Permutation importance breaks the relationship between a feature and the target by
          randomly shuffling its column — the model still runs, but that feature is now noise. The
          accuracy drop tells you how much the model relied on it. Unlike impurity-based
          importances (which favour high-cardinality features), permutation importance is robust
          across model types.
        </p>
        <PermutationImportance />
      </section>

      <section className="section">
        <SectionLabel n="07.4">Global ≠ local</SectionLabel>
        <h2 className="h2">
          The model&apos;s average behaviour can be wrong for <em>your</em> user.
        </h2>
        <p className="prose">
          A feature can rank high globally yet barely move a specific individual&apos;s prediction
          — or vice versa. Click any data point and compare its local SHAP to the global importance
          bar. This is why fairness audits, regulatory explanations, and high-stakes decisions
          require<em> local</em> explanations, not just global summaries.
        </p>
        <GlobalVsLocal />
      </section>

      <section className="section">
        <AntiPatterns
          items={[
            "<b>Using feature importance as causation.</b> A high SHAP value means the model <em>uses</em> the feature, not that changing it will change the outcome (see Ch 09).",
            "<b>Trusting global importance alone for individual decisions.</b> Global rankings can completely misrepresent what drives a single prediction.",
            "<b>LIME radius too large.</b> If the locality is too wide, the linear approximation covers non-linear territory and the explanation misleads.",
            "<b>Permutation on training data.</b> Always permute on held-out data — shuffling on train can underestimate importance if the model memorised the column.",
          ]}
        />
        <BestPractices
          items={[
            "<b>SHAP for audit trails:</b> per-decision, additive, and guaranteed to sum to the prediction gap.",
            "<b>Permutation for global sense-checking:</b> model-agnostic, catches surprises, scales to any architecture.",
            '<b>LIME for stakeholder demos:</b> easy to explain — "we zoomed in on the neighbourhood around your application."',
            "<b>Always show confidence / variance</b> of importance estimates — run permutation multiple times and report the spread.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Accountability is the price of deployment.</b> Stakeholders will ask why — prepare the answer before launch.",
          "<b>SHAP for audits, permutation for global sense, LIME for local proxies.</b> Tools are complementary, not competing.",
          "<b>Correlation ≠ mechanism.</b> Feature importance does not equal causal influence (Ch 09). Do not confuse them in executive presentations.",
          "<b>Global ≠ local.</b> A model that is fair on average can be unfair for a specific subgroup. Always audit at both levels.",
        ]}
      />
    </>
  );
}
