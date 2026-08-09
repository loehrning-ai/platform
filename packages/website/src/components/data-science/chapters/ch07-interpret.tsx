import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
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
        title="Explanation methods answer <em>specific questions.</em>"
        hook="Predictive performance and explanation answer different questions. SHAP, LIME, and permutation importance describe selected aspects of model behavior under explicit reference data and method assumptions."
        meta={[
          { k: "Read", v: "10 min" },
          { k: "Focus", v: "SHAP · LIME · Permutation" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="07.1">Per-instance explanations, SHAP</SectionLabel>
        <h2 className="h2">SHAP: game theory meets ML.</h2>
        <p className="prose">
          SHAP (SHapley Additive exPlanations) defines additive feature
          attributions using Shapley values and a chosen background
          distribution. The result explains the model relative to that
          reference; correlated features, conditional versus interventional
          assumptions, and approximation method can change the allocation. The
          local panel is a hand-built additive teaching model, not output from a
          fitted SHAP explainer.
        </p>
        <SHAPWaterfallSim />
      </section>

      <section className="section">
        <SectionLabel n="07.2">Local approximation, LIME</SectionLabel>
        <h2 className="h2">Complex model, simple explanation, nearby.</h2>
        <p className="prose">
          LIME (Local Interpretable Model-agnostic Explanations) sidesteps the
          global complexity by asking a simpler question:{" "}
          <em>
            what linear model fits the model&apos;s behavior around this one
            point?
          </em>
          It samples nearby points, weights them by proximity, and fits a
          lightweight proxy. Fidelity depends on perturbation sampling, feature
          representation, kernel width, and local model. Move the query point
          and inspect this fixed teaching surface.
        </p>
        <LIMEExplainer />
      </section>

      <section className="section">
        <SectionLabel n="07.3">
          Global feature importance, permutation
        </SectionLabel>
        <h2 className="h2">Corrupt one column. Measure the damage.</h2>
        <p className="prose">
          Permutation importance breaks the relationship between a feature and
          the target by randomly shuffling its column, the model still runs, but
          that feature is now noise. The metric change estimates reliance on
          that feature under the evaluation distribution. Correlated or
          substitutable predictors can mask one another, and the result changes
          with the metric, dataset, grouping, and permutation scheme. The method
          is model-agnostic but not assumption-free.
        </p>
        <PermutationImportance />
      </section>

      <section className="section">
        <SectionLabel n="07.4">Global ≠ local</SectionLabel>
        <h2 className="h2">
          The model&apos;s average behaviour can be wrong for <em>your</em>{" "}
          user.
        </h2>
        <p className="prose">
          A feature can rank high globally yet barely move a specific
          individual&apos;s prediction , or vice versa. Click any data point and
          compare its local SHAP to the global importance bar. Individual
          attributions, subgroup performance, calibration, and fairness metrics
          are different evidence. Applicable governance may require several of
          them; a local explanation alone does not establish fairness or
          regulatory compliance.
        </p>
        <GlobalVsLocal />
      </section>

      <section className="section">
        <AntiPatterns
          items={[
            "<b>Using feature importance as causation.</b> A high SHAP value means the model <em>uses</em> the feature, not that changing it will change the outcome (see Ch 09).",
            "<b>Trusting global importance alone for individual decisions.</b> Global rankings can completely misrepresent what drives a single prediction.",
            "<b>LIME radius too large.</b> If the locality is too wide, the linear approximation covers non-linear territory and the explanation misleads.",
            "<b>Permutation on training data.</b> Use evaluation data representing deployment; training-set drops mix reliance with overfitting and do not estimate generalization behavior.",
          ]}
        />
        <BestPractices
          items={[
            "<b>SHAP for additive attribution:</b> state the explainer, model output scale, background data, feature-dependence treatment, and approximation error. Efficiency applies to the chosen SHAP formulation, not every implementation output.",
            "<b>Permutation for evaluation-distribution reliance:</b> choose the metric and permutation unit, and interpret correlated features jointly when appropriate.",
            "<b>LIME for a local surrogate:</b> report locality, perturbation distribution, surrogate fit, and stability across seeds.",
            "<b>Show stability of importance estimates.</b> Repeat stochastic procedures, bootstrap when appropriate, and report spread without calling it confidence unless the interval has a justified sampling interpretation.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Define the required explanation before deployment.</b> Specify the audience, decision, output scale, reference data, and acceptable limitations.",
          "<b>Match the explanation to the question.</b> Additive attribution, evaluation-set reliance, and local surrogate fidelity are distinct quantities.",
          "<b>Correlation ≠ mechanism.</b> Feature importance does not equal causal influence; see Chapter 09.",
          "<b>Global, subgroup, and individual evidence differ.</b> Evaluate each level required by the decision and do not infer fairness from an attribution plot.",
        ]}
      />
    </>
  );
}
