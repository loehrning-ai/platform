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
        hook="Missingness, units, timestamps, joins, duplicates, post-outcome information. Each moves the estimand and the signal left to you. Audit every transformation inside the validation boundary."
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
          Missingness mechanisms decide what an analysis can identify.{" "}
          <strong>MCAR</strong>
          (missing completely at random) means missingness is independent of
          observed and unobserved values. Complete-case analysis stays unbiased
          for some estimands there, but it throws information away and still
          leans on the analysis model.
          <strong> MAR</strong> (missing at random) means missingness depends on{" "}
          <em>other observed columns</em>: income is missing more often for EU
          users because the survey skipped a page in German. Impute, yes, but
          model the relationship and bring in the right observed predictors.
          <strong>MNAR</strong> (missing not at random) means missingness still
          depends on unobserved values once you condition on what you see.
          Identification then costs extra assumptions, sensitivity analysis, or
          an explicit missingness model.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Watch MNAR drive up the missing rate in the high-value tail. Impute
          with the observed mean and you underestimate the true mean. The
          pattern of absence itself can carry signal. A{" "}
          <code>feature_was_missing</code> indicator is a candidate when that
          signal exists at prediction time. Validate it, and check whether it
          encodes a process change or a sensitive-group proxy.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">Filling the blanks without lying to your model.</h2>
        <p className="prose">
          The wrong imputation strategy does more than add noise. It bends
          estimates and model behavior one way. Single mean imputation
          compresses the completed-data variance whenever uncertainty is
          ignored. Forward-fill invents temporal artifacts. KNN keeps local
          structure when its distance and its neighbors mean something. The
          masked-value error below exists only because this synthetic demo kept
          the generated truth. Real missing values need designed holdouts and
          sensitivity analysis.
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Imputation anti-patterns"
          items={[
            "<b>Imputing with the full-dataset mean.</b> Fit imputer on train only. The test mean is future information.",
            "<b>Choosing a single fill value without checking the estimand.</b> Mean and median preserve neither joint relationships nor imputation uncertainty. Compare methods inside the validation design.",
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
          Plenty of algorithms react to raw feature magnitude.
          Regularized linear models penalize coefficient magnitude, so feature
          units change the effective penalty and the coefficient you read off.
          Distance-based models such as kNN, kernel SVMs, and PCA are exposed
          too. Euclidean distance in a 200,000-dollar space dwarfs anything in
          age-space. Scaling puts features on one footing.
        </p>
        <ScalerDemo />
        <BestPractices
          title="Scaling rules"
          items={[
            "<b>StandardScaler for centered, variance-scaled inputs.</b> It needs no normality, but mean and standard deviation bend under outliers.",
            "<b>MinMaxScaler when a fitted numeric range is useful.</b> Values outside the training range can map beyond [0, 1], and training extremes compress the remaining values.",
            "<b>RobustScaler when median and IQR are appropriate scale summaries.</b> Extreme values remain in the data but do not determine the fitted scale.",
            "<b>Ordinary decision-tree splits rarely need scaling.</b> Monotonic rescaling keeps the ordering, though shared pipelines, numeric precision, regularization, or another model component can still call for it.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.4">Data Leakage</SectionLabel>
        <h2 className="h2">
          Leakage makes unavailable information look predictive.
        </h2>
        <p className="prose">
          <strong>Leakage</strong> means model development used information
          that is not available at the defined prediction time. The tells:
          features recorded after the target event, transformations fitted on
          held-out data, a metric that moves under a time-aware or group-aware
          split. A strong metric proves no leakage, and an ordinary one rules
          none out.
        </p>
        <p className="prose">
          Three forms recur. <strong>Target leakage</strong>, where a feature
          encodes the label. <strong>Temporal leakage</strong>,
          where a feature uses data recorded after the prediction cutoff. And
          <strong> train/test contamination</strong>, where a learned
          preprocessing step reads held-out data. The panel compares examples
          against a fixed answer key.
        </p>
        <LeakageDetector />
        <AntiPatterns
          items={[
            "<b>Fitting the scaler on the full dataset.</b> This transfers held-out summary statistics into model development. Fit inside each training partition and apply to its held-out partition.",
            '<b>Target encoding without out-of-fold.</b> "Mean target per category" computed across all rows lets each row see its own label.',
            "<b>Post-event features.</b> <code>total_purchases_lifetime</code> cannot predict <code>will_churn</code> at an earlier cutoff if its value includes purchases after that cutoff.",
            "<b>Inspecting the test set during EDA.</b> Any feature or modeling change you derive from held-out patterns pulls test information into development.",
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
          "<b>Missingness provenance is information.</b> Keep it for the audit trail. Use an indicator as a feature only once inference-time availability and validation check out.",
          "<b>The mechanism matters.</b> MCAR, MAR, and MNAR are assumptions about the missingness process, not labels a dataset hands you. Run the sensitivity analysis.",
          "<b>Scaling is algorithm- and pipeline-dependent.</b> Fit it only on training folds and document how out-of-range inference values are handled.",
          "<b>Leakage shows up long before production.</b> Time-aware or group-aware splits, feature timestamps, lineage, and fold-local preprocessing are direct checks, not proof that no leakage remains.",
          "<b>Clean data is a process, not a step.</b> Every new feature, join, or aggregation is a fresh opportunity to introduce bugs, leaks, or biased imputation.",
        ]}
      />
    </>
  );
}
