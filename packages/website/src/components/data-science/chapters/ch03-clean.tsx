import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
import { MissingnessSim } from "@/components/data-science/simulators/missingness-sim";
import { ImputationRace } from "@/components/data-science/simulators/imputation-race";
import { ScalerDemo } from "@/components/data-science/simulators/scaler-demo";
import { LeakageDetector } from "@/components/data-science/simulators/leakage-detector";

// ─── Ch03: Clean (plan 012 stage 7) ────────────────────────────────────
//
// Typed port of Ch03_Clean.js. Each of its four named simulators lives
// in its own file under simulators/, matching the split established in
// stage 6.

export default function Ch03Clean() {
  return (
    <>
      <Hero
        eyebrow="Chapter 03 · Clean"
        title='Most of &ldquo;modeling&rdquo; is actually <em><span class="accent">cleaning</span></em>.'
        hook="Missing values. Outliers. Units. Timezones. Leaky joins. The difference between a senior DS and a junior one is <strong>noticing the boring things</strong>."
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
          Rubin (1976) categorized missing data into three mechanisms that completely change how
          you should respond. <strong>MCAR</strong> (missing completely at random) means a sensor
          dropped a packet — the gap is unrelated to any value in the dataset. You can drop or
          impute without bias.
          <strong> MAR</strong> (missing at random) means missingness depends on{" "}
          <em>other observed columns</em>: income data might be missing more often for EU users if
          the survey skipped a page in German. You can impute, but you need to model the
          relationship. <strong>MNAR</strong> (missing not at random) is the dangerous one: the
          missing value predicts its own absence — high earners skip the income field, low
          scorers skip the score. Imputation will be systematically biased unless you model the
          missingness process itself.
        </p>
        <MissingnessSim />
        <p className="prose" style={{ marginTop: 18 }}>
          Notice how MNAR dramatically increases the missing rate in the high-value tail. If you
          impute with the observed mean, you&apos;ll underestimate the true mean. The pattern of
          absence is data — always add a <code>feature_was_missing</code> indicator column before
          you fill any gaps.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="03.2">Imputation</SectionLabel>
        <h2 className="h2">Filling the blanks without lying to your model.</h2>
        <p className="prose">
          The wrong imputation strategy doesn&apos;t just add noise — it systematically biases
          your model toward the wrong answer. Mean imputation compresses variance, making your
          model underestimate uncertainty. Forward-fill in time series creates temporal
          artifacts. KNN imputation is slower but tracks local structure. The benchmark is
          always: how far off are imputed values from the truth?
        </p>
        <ImputationRace />
        <AntiPatterns
          title="Imputation anti-patterns"
          items={[
            "<b>Imputing with the full-dataset mean.</b> Fit imputer on train only. The test mean is future information.",
            "<b>Single-value imputation for skewed distributions.</b> Replacing salary gaps with the mean drags every imputed value toward the center of a right-skewed distribution. Use median.",
            "<b>Not flagging imputed cells.</b> Your model has no way to know which values were synthetic. Add a <code>_was_missing</code> binary feature for every imputed column.",
            "<b>KNN on high-cardinality data without scaling.</b> KNN distances are meaningless when income (range 170k) dominates age (range 50). Scale first.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.3">Feature Scaling</SectionLabel>
        <h2 className="h2">
          Income at 150,000. Age at 34. <em>Same model, totally different worlds.</em>
        </h2>
        <p className="prose">
          Many algorithms are sensitive to the raw magnitude of features. Regularized linear
          models penalize large coefficients — but a coefficient for income in raw dollars will
          naturally be tiny compared to one for age, so L2 regularization ignores income
          entirely. Distance-based models like kNN, SVM, and PCA are even more exposed: Euclidean
          distance in a 200,000-dollar space dwarfs anything in age-space. Scaling puts features
          on comparable footing.
        </p>
        <ScalerDemo />
        <BestPractices
          title="Scaling rules"
          items={[
            "<b>StandardScaler for Gaussian-ish features.</b> Zero mean, unit variance. Works best when the feature's distribution is roughly symmetric. Affected by outliers.",
            "<b>MinMaxScaler when you need bounded output [0, 1].</b> Good for neural networks. A single extreme outlier will crush all other values toward zero.",
            "<b>RobustScaler when outliers are real and informative.</b> Uses median and IQR. The outliers still exist in the data — they're just not ruining the scale for everyone else.",
            "<b>Never scale tree-based models.</b> Decision trees split on threshold values, not distances. Scaling changes nothing for Random Forests, XGBoost, or LightGBM.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="03.4">Data Leakage</SectionLabel>
        <h2 className="h2">The number-one reason your model looks amazing in dev and dies in prod.</h2>
        <p className="prose">
          <strong>Leakage</strong> is when information that wouldn&apos;t be available at
          prediction time sneaks into your training features. It&apos;s invisible until
          deployment. The symptoms are seductive: 99% AUC, SHAP plots that look like they&apos;re
          capturing real signal, stakeholders impressed by the numbers. Then prod accuracy drops
          to 60% and nobody knows why.
        </p>
        <p className="prose">
          There are three main flavors: <strong>target leakage</strong> (a feature encodes the
          label directly),
          <strong> temporal leakage</strong> (you used data from after the event you&apos;re
          predicting), and
          <strong> train/test contamination</strong> (your preprocessing saw the test set). Pick
          features below and audit for leakage.
        </p>
        <LeakageDetector />
        <AntiPatterns
          items={[
            "<b>Fitting the scaler on the full dataset.</b> Your test set just saw the training mean. Fit on train only, transform both.",
            '<b>Target encoding without out-of-fold.</b> "Mean target per category" computed across all rows lets each row see its own label.',
            "<b>Post-event features.</b> <code>total_purchases_lifetime</code> used to predict <code>will_churn</code> — if computed after the churn date, you've time-traveled.",
            "<b>Snooping the test set during EDA.</b> You look at test, see a pattern, adjust train. You just leaked your test set through your eyeballs.",
          ]}
        />
        <BestPractices
          items={[
            "<b>Split before you touch anything.</b> First line of every notebook: <code>train, test = split(df)</code>. Then lock the test set.",
            "<b>Use sklearn Pipelines.</b> <code>Pipeline</code> forces fit-on-train, transform-on-both. It's not boilerplate — it's a safety guarantee.",
            "<b>Time splits for temporal data.</b> Random splits let future data train on past labels. Use <code>TimeSeriesSplit</code> or a fixed cutoff date.",
            `<b>Ask: would this feature exist at prediction time?</b> For every feature, state the exact moment it would be computed in production. If the answer is "after we already know the outcome," it's leaky.`,
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Missingness is information.</b> A <code>was_missing</code> flag is free and often predictive. Never impute silently.",
          "<b>The mechanism matters.</b> MCAR → drop freely. MAR → impute with a model. MNAR → model the missingness itself or accept the bias.",
          "<b>Scaling is algorithm-dependent.</b> Distance-based and regularized models need it. Trees don't care.",
          "<b>Leakage is invisible until prod.</b> Assume it exists; prove it doesn't with time-based splits and feature provenance checks.",
          "<b>Clean data is a process, not a step.</b> Every new feature, join, or aggregation is a fresh opportunity to introduce bugs, leaks, or biased imputation.",
        ]}
      />
    </>
  );
}
