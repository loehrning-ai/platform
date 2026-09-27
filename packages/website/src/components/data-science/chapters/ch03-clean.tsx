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
        hook="Missingness, units, timestamps, joins, duplicates and post-outcome information shift the estimand and the signal. Audit every transformation inside the validation boundary."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Missingness · imputation · scaling · leakage" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="03.1">Missingness</SectionLabel>
        <h2 className="h2">Why a value is missing decides how to treat it.</h2>
        <p className="prose">
          <strong>MCAR</strong> (missing completely at random) means
          missingness is independent of all values; complete cases stay
          unbiased for some estimands but lose information.{" "}
          <strong>MAR</strong> (missing at random) means{" "}
          <em>other observed columns</em> explain it: income is missing more
          often for EU users because the German survey skipped a page. Impute
          with those predictors.
        </p>
        <p className="prose">
          <strong>MNAR</strong> (missing not at random) means the missing value
          predicts its own absence, for example when high earners skip the
          income question. Identification then needs extra assumptions,
          sensitivity analysis or a model of the missingness process. All three
          are assumptions about the process; the data do not reveal which
          holds.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Under MNAR the missing rate climbs in the high-value tail, so
          imputing the observed mean underestimates the true mean. A{" "}
          <code>feature_was_missing</code> indicator is a candidate if it
          exists at prediction time, helps in validation and is not a proxy for a
          process change or a sensitive group.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">Fill gaps without distorting the distribution.</h2>
        <p className="prose">
          Mean imputation shrinks the variance, forward-fill invents plateaus
          in time series, and KNN keeps local structure when its distance
          means something. This demo knows the synthetic truth; for real missing
          values, compare methods with designed holdouts and sensitivity
          analysis.
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Imputation anti-patterns"
          items={[
            "<b>Imputing with the full-dataset mean.</b> Fit the imputer on train only.",
            "<b>Picking a fill value without checking the estimand.</b> Mean and median keep neither joint relationships nor imputation uncertainty. Compare methods inside the validation design.",
            "<b>Hiding imputation provenance.</b> Record which values were imputed. Add a missingness indicator only if it exists at inference and helps validation.",
            "<b>KNN with an unsuitable distance.</b> Scale numeric inputs, encode mixed data deliberately and tune neighbors inside validation.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.3">Feature Scaling</SectionLabel>
        <h2 className="h2">
          Income at 150,000. Age at 34.{" "}
          <em>Without scaling, units dominate.</em>
        </h2>
        <p className="prose">
          Regularized linear models penalize coefficient size, so feature units
          change the effective penalty and the coefficient you read. kNN,
          kernel SVMs and PCA suffer too: distances on a 200,000 scale drown
          out age. Scaling puts features on comparable magnitudes.
        </p>
        <ScalerDemo />
        <BestPractices
          title="Scaling rules"
          items={[
            "<b>StandardScaler centers and scales variance.</b> It needs no normality, but outliers bend mean and standard deviation.",
            "<b>MinMaxScaler for a fitted range.</b> Values outside the training range can land beyond [0, 1]; training extremes compress the rest.",
            "<b>RobustScaler for real outliers.</b> Median and IQR keep extreme values from setting the scale.",
            "<b>Tree splits rarely need scaling.</b> Monotonic rescaling keeps the order; shared pipelines, numeric precision or other model parts can still call for it.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.4">Data Leakage</SectionLabel>
        <h2 className="h2">
          Leakage brings future information into training.
        </h2>
        <p className="prose">
          <strong>Leakage</strong> means model development used information
          not available at the defined prediction time. Signs are features
          recorded after the target event, transformations fitted on held-out
          data and a metric that drops under a time- or group-aware split. A
          strong metric does not prove leakage, and an ordinary one does not
          rule it out.
        </p>
        <p className="prose">
          Three forms recur: <strong>target leakage</strong>, where a feature
          encodes the label; <strong>temporal leakage</strong> from data after
          the prediction cutoff; and <strong>train/test contamination</strong>,
          where preprocessing saw held-out data.
        </p>
        <LeakageDetector />
        <AntiPatterns
          items={[
            "<b>Post-event features.</b> <code>total_revenue_lifetime</code> must not count revenue after the cutoff when it predicts <code>will_churn</code>.",
            "<b>Inspecting the test set during EDA.</b> Every change you derive from it pulls test information into development.",
          ]}
        />
        <BestPractices
          items={[
            "<b>Define the evaluation split before learned preprocessing.</b> Keep a final test partition out of model and feature decisions.",
            "<b>Fit a pipeline inside cross-validation.</b> A correct <code>Pipeline</code> keeps learned transformations in each training fold; it does not stop semantic or temporal leakage.",
            "<b>Split by time when deployment predicts the future.</b> Match rolling, expanding or fixed-cutoff splits to the real decision time.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Scaling depends on algorithm and pipeline.</b> Document how out-of-range values are handled.",
          "<b>Cleaning is ongoing.</b> Every new feature, join or aggregation can introduce bugs, leaks or biased imputation.",
        ]}
      />
    </>
  );
}
