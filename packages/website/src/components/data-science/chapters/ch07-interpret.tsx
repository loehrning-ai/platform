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
        hook="Good predictions explain nothing yet. SHAP, LIME and permutation importance each describe one slice of model behavior, under reference data and assumptions you have to state."
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
          SHAP (SHapley Additive exPlanations) splits a prediction additively
          across features, using Shapley values and a chosen background
          distribution, so it explains the model relative to that reference.
          Correlated features, conditional or interventional assumptions and
          the approximation shift the allocation.
        </p>
        <SHAPWaterfallSim />
      </section>

      <section className="section">
        <SectionLabel n="07.2">Local approximation, LIME</SectionLabel>
        <h2 className="h2">Complex model, simple explanation, nearby.</h2>
        <p className="prose">
          LIME (Local Interpretable Model-agnostic Explanations) asks a local
          question:{" "}
          <em>
            what linear model fits the model&apos;s behavior around this one
            point?
          </em>{" "}
          It samples nearby points, weights them by proximity and fits a small
          surrogate. Fidelity depends on perturbation sampling, feature
          representation, kernel width and the local model.
        </p>
        <LIMEExplainer />
      </section>

      <section className="section">
        <SectionLabel n="07.3">
          Global feature importance, permutation
        </SectionLabel>
        <h2 className="h2">Corrupt one column. Measure the damage.</h2>
        <p className="prose">
          Shuffling one column breaks its link to the target while the model
          keeps running. The metric drop estimates how much the model relied
          on that feature under the evaluation distribution. Correlated or
          substitutable predictors mask one another, and the result depends on
          metric, dataset, grouping and permutation scheme.
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
          A feature can rank high globally and barely move one prediction, or
          the reverse. Individual attribution, subgroup performance,
          calibration and fairness metrics are separate evidence, and a local
          explanation alone shows neither fairness nor compliance.
        </p>
        <GlobalVsLocal />
      </section>

      <section className="section">
        <AntiPatterns
          items={[
            "<b>Reading feature importance as causation.</b> A high SHAP value means the model <em>uses</em> the feature; changing it need not change the outcome (see Chapter 09).",
            "<b>LIME radius too large.</b> The linear approximation then spans nonlinear regions and misleads.",
            "<b>Permutation on training data.</b> Use evaluation data that stands in for deployment; training-set drops mix reliance with overfitting.",
          ]}
        />
        <BestPractices
          items={[
            "<b>SHAP for additive attribution:</b> state explainer, output scale, background data, handling of feature dependence and approximation error. Efficiency holds for the chosen SHAP formulation, not every implementation output.",
            "<b>Permutation for reliance on evaluation data:</b> choose metric and permutation unit, and read correlated features jointly when needed.",
            "<b>LIME for a local surrogate:</b> report locality, perturbation distribution, surrogate fit and stability across seeds.",
            "<b>Show how stable importance estimates are.</b> Repeat stochastic procedures and report the spread; call it confidence only with a justified sampling interpretation.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Define the explanation you owe before deployment.</b> Name audience, decision, output scale, reference data and accepted limits.",
        ]}
      />
    </>
  );
}
