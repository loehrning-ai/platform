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
        hook="Predictive performance and explanation answer different questions. SHAP, LIME, and permutation importance each describe one slice of model behavior, under assumptions you have to state."
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
          SHAP (SHapley Additive exPlanations) builds additive feature
          attributions from Shapley values and a chosen background distribution.
          It explains the model relative to that reference.
          Correlated features, conditional versus interventional assumptions,
          and the approximation method all shift the allocation. The panel below
          is a hand-built additive teaching model, not output from a fitted SHAP
          explainer.
        </p>
        <SHAPWaterfallSim />
      </section>

      <section className="section">
        <SectionLabel n="07.2">Local approximation, LIME</SectionLabel>
        <h2 className="h2">Complex model, simple explanation, nearby.</h2>
        <p className="prose">
          LIME (Local Interpretable Model-agnostic Explanations) skips the
          global complexity and asks a smaller question:{" "}
          <em>
            what linear model fits the model&apos;s behavior around this one
            point?
          </em>
          It samples nearby points, weights them by proximity, and fits a light
          proxy. Fidelity hangs on perturbation sampling, feature
          representation, kernel width, and the local model. Move the query point
          across this fixed teaching surface.
        </p>
        <LIMEExplainer />
      </section>

      <section className="section">
        <SectionLabel n="07.3">
          Global feature importance, permutation
        </SectionLabel>
        <h2 className="h2">Corrupt one column. Measure the damage.</h2>
        <p className="prose">
          Permutation importance shuffles one column and breaks the link
          between that feature and the target. The model still runs; the feature
          is now noise. The metric drop estimates how much the model leaned on
          it under the evaluation distribution. Correlated or substitutable
          predictors mask one another, and the result moves with the metric,
          dataset, grouping, and permutation scheme. Model-agnostic does not
          mean assumption-free.
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
          A feature can rank high globally and barely move one
          individual&apos;s prediction. Or the reverse. Click any data point and
          hold its local SHAP against the global importance bar. Individual
          attributions, subgroup performance, calibration, and fairness metrics
          are separate evidence. Governance often demands several of them, and a
          local explanation establishes neither fairness nor compliance.
        </p>
        <GlobalVsLocal />
      </section>

      <section className="section">
        <AntiPatterns
          items={[
            "<b>Using feature importance as causation.</b> A high SHAP value means the model <em>uses</em> the feature, not that changing it will change the outcome (see Ch 09).",
            "<b>Trusting global importance alone for individual decisions.</b> A global ranking can misrepresent what drives a single prediction entirely.",
            "<b>LIME radius too large.</b> Widen the locality too far and the linear approximation reaches into non-linear territory. The explanation misleads.",
            "<b>Permutation on training data.</b> Use evaluation data that stands in for deployment. Training-set drops mix reliance with overfitting and estimate no generalization behavior.",
          ]}
        />
        <BestPractices
          items={[
            "<b>SHAP for additive attribution:</b> state the explainer, model output scale, background data, feature-dependence treatment, and approximation error. Efficiency applies to the chosen SHAP formulation, not every implementation output.",
            "<b>Permutation for evaluation-distribution reliance:</b> choose the metric and permutation unit, and interpret correlated features jointly when appropriate.",
            "<b>LIME for a local surrogate:</b> report locality, perturbation distribution, surrogate fit, and stability across seeds.",
            "<b>Show how stable the importance estimates are.</b> Repeat stochastic procedures, bootstrap where appropriate, report the spread. Call it confidence only when the interval has a justified sampling interpretation.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Define the explanation you owe before deployment.</b> Name the audience, decision, output scale, reference data, and accepted limits.",
          "<b>Match the explanation to the question.</b> Additive attribution, evaluation-set reliance, and local surrogate fidelity are distinct quantities.",
          "<b>Correlation ≠ mechanism.</b> Feature importance does not equal causal influence; see Chapter 09.",
          "<b>Global, subgroup, and individual evidence differ.</b> Evaluate every level the decision requires, and infer no fairness from an attribution plot.",
        ]}
      />
    </>
  );
}
