import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { MissingnessSim } from "@/components/data-science/simulators/missingness-sim";
import { ImputationRace } from "@/components/data-science/simulators/imputation-race";
import { ScalerDemo } from "@/components/data-science/simulators/scaler-demo";
import { LeakageDetector } from "@/components/data-science/simulators/leakage-detector";

// ─── Ch03: Clean ────────────────────────────────────
//
// Typed port of Ch03_Clean.js. Each of its four named simulators lives
// in its own file under simulators/, matching the split established in
// stage 6.

export default function Ch03Clean() {
  return (
    <>
      <Hero
        eyebrow="Chapter 03 · Clean"
        title='Data quality defines <em><span class="accent">what the model can learn.</span></em>'
        hook="Missingness, units, timestamps, joins, duplicates, and post-outcome information change the estimand and the available signal. Audit each transformation inside the validation boundary."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Missingness · imputation · scaling · leakage" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="03.1">Missingness</SectionLabel>
        <h2 className="h2">Not all missing is missing the same way.</h2>
        <p className="prose">
          Missing-data mechanisms change what an analysis can identify.{" "}
          <strong>MCAR</strong>
          (missing completely at random) means missingness is independent of
          observed and unobserved values. Complete-case analysis can remain
          unbiased for some estimands under MCAR, but it loses information and
          still depends on the analysis model.
          <strong> MAR</strong> (missing at random) means missingness depends on{" "}
          <em>other observed columns</em>: income data might be missing more
          often for EU users if the survey skipped a page in German. You can
          impute, but you need to model the relationship and include suitable
          observed predictors. <strong>MNAR</strong> (missing not at random)
          means missingness still depends on unobserved values after
          conditioning on the observed data. Identification then needs
          additional assumptions, sensitivity analysis, or an explicit
          missingness model.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Notice how MNAR dramatically increases the missing rate in the
          high-value tail. If you impute with the observed mean, you&apos;ll
          underestimate the true mean. The pattern of absence may carry
          predictive information. A <code>feature_was_missing</code> indicator
          is a candidate feature when the signal exists at prediction time;
          validate it and inspect whether it encodes a process change or
          sensitive-group proxy.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">Filling the blanks without lying to your model.</h2>
        <p className="prose">
          The wrong imputation strategy doesn&apos;t just add noise, it
          systematically biases estimates and model behavior. Single mean
          imputation compresses the completed-data variance if uncertainty is
          ignored. Forward-fill can create temporal artifacts. KNN can preserve
          local structure when its distance and neighbors are meaningful. The
          masked-value error shown below is available only because this
          synthetic demo retains the generated truth; real missing values
          require validation through designed holdouts and sensitivity analysis.
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Imputation anti-patterns"
          items={[
            "<b>Imputing with the full-dataset mean.</b> Fit imputer on train only. The test mean is future information.",
            "<b>Choosing a single fill value without checking the estimand.</b> Mean and median preserve neither joint relationships nor imputation uncertainty; compare methods inside the validation design.",
            "<b>Hiding imputation provenance.</b> Record which values were imputed. Add a missingness indicator only when it is available at inference and improves a relevant validation metric without unacceptable proxy behavior.",
            "<b>KNN with an unsuitable distance.</b> Scale numeric inputs where units would dominate, encode mixed data deliberately, and tune neighbors inside validation.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.3">Feature Scaling</SectionLabel>
        <h2 className="h2">
          Income at 150,000. Age at 34.{" "}
          <em>Same model, totally different worlds.</em>
        </h2>
        <p className="prose">
          Many algorithms are sensitive to the raw magnitude of features.
          Regularized linear models penalize coefficient magnitude, so feature
          units change the effective penalty and coefficient interpretation.
          Distance-based models such as kNN, kernel SVMs, and PCA are also
          exposed: Euclidean distance in a 200,000-dollar space dwarfs anything
          in age-space. Scaling puts features on comparable footing.
        </p>
        <ScalerDemo />
        <BestPractices
          title="Scaling rules"
          items={[
            "<b>StandardScaler for centered, variance-scaled inputs.</b> It does not require normality, but mean and standard deviation are sensitive to outliers.",
            "<b>MinMaxScaler when a fitted numeric range is useful.</b> Values outside the training range can map beyond [0, 1], and training extremes compress the remaining values.",
            "<b>RobustScaler when median and IQR are appropriate scale summaries.</b> Extreme values remain in the data but do not determine the fitted scale.",
            "<b>Scaling is usually unnecessary for ordinary decision-tree splits.</b> Monotonic rescaling preserves ordering, although shared pipelines, numeric precision, regularization, or other model components may still justify it.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.4">Data Leakage</SectionLabel>
        <h2 className="h2">
          Leakage makes unavailable information look predictive.
        </h2>
        <p className="prose">
          <strong>Leakage</strong> occurs when model development uses
          information unavailable at the defined prediction time. Indicators
          include features recorded after the target event, transformations
          fitted on held-out data, or large changes under a time-aware or
          group-aware split. Strong metrics alone do not prove leakage, and
          ordinary metrics do not rule it out.
        </p>
        <p className="prose">
          Three common forms are <strong>target leakage</strong> (a feature
          encodes the label), <strong>temporal leakage</strong> (a feature uses
          data recorded after the prediction cutoff), and
          <strong> train/test contamination</strong> (a learned preprocessing
          step uses held-out data). The panel uses a fixed answer key to compare
          examples.
        </p>
        <LeakageDetector />
        <AntiPatterns
          items={[
            "<b>Fitting the scaler on the full dataset.</b> This transfers held-out summary statistics into model development. Fit inside each training partition and apply to its held-out partition.",
            '<b>Target encoding without out-of-fold.</b> "Mean target per category" computed across all rows lets each row see its own label.',
            "<b>Post-event features.</b> <code>total_purchases_lifetime</code> cannot predict <code>will_churn</code> at an earlier cutoff if its value includes purchases after that cutoff.",
            "<b>Inspecting the test set during EDA.</b> Any feature or modeling change derived from held-out patterns incorporates test information into development.",
          ]}
        />
        <BestPractices
          items={[
            "<b>Define the evaluation split before learned preprocessing.</b> Keep a final test partition separate from model and feature decisions.",
            "<b>Use a fitted pipeline inside cross-validation.</b> A correctly configured <code>Pipeline</code> helps keep learned transformations within each training fold; it cannot prevent semantic or temporal leakage by itself.",
            "<b>Use time-respecting evaluation when deployment predicts the future.</b> Choose rolling, expanding, or fixed-cutoff splits that match the actual decision time.",
            `<b>Ask: would this feature exist at prediction time?</b> For every feature, state the exact moment it would be computed in production. If the answer is "after we already know the outcome," it's leaky.`,
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Missingness provenance is information.</b> Preserve it for audit; use an indicator as a feature only after inference-time availability and validation checks.",
          "<b>The mechanism matters.</b> MCAR, MAR, and MNAR are assumptions about the missingness process, not labels a dataset reveals automatically; use sensitivity analysis.",
          "<b>Scaling is algorithm- and pipeline-dependent.</b> Fit it only on training folds and document how out-of-range inference values are handled.",
          "<b>Leakage can appear before production.</b> Time-aware or group-aware splits, feature timestamps, lineage, and fold-local preprocessing are direct checks, not a proof that all leakage is absent.",
          "<b>Clean data is a process, not a step.</b> Every new feature, join, or aggregation is a fresh opportunity to introduce bugs, leaks, or biased imputation.",
        ]}
      />
    </>
  );
}
