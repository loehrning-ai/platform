import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { DistributionExplorer } from "@/components/data-science/simulators/distribution-explorer";
import { OutlierDetector } from "@/components/data-science/simulators/outlier-detector";
import { CorrelationMatrix } from "@/components/data-science/simulators/correlation-matrix";

// ─── Ch02: Explore ──────────────────────────────────
//
// Typed port of Ch02_Explore.js. Each of its three named simulators
// (DistributionExplorer, OutlierDetector, CorrelationMatrix) lives in its
// own file under simulators/, matching the split established in stage 6.

export default function Ch02Explore() {
  return (
    <div className="chapter-root">
      <Hero
        eyebrow="Chapter 02"
        title="Exploratory Data Analysis, <em>look before you leap.</em>"
        hook="Before <code>.fit()</code> come distributions, missingness, odd observations, relationships, units, time. Find the assumptions and the data defects before they reach a model."
        meta={[
          { k: "Topics", v: "Distributions · Outliers · Correlations" },
          { k: "Time", v: "10 min" },
          { k: "Sims", v: "3 interactive" },
          { k: "Level", v: "Core" },
        ]}
      />

      <SectionLabel n="01">Distribution Shapes</SectionLabel>
      <p className="prose">
        A histogram is a first look at a numeric variable, no more. Bin choices
        hide structure or invent it, so pair the histogram with counts,
        quantiles, an empirical CDF, missingness, and valid domain ranges. Shape
        alone validates no parametric test and picks no transformation.
      </p>
      <p className="prose">
        <strong>Skewness</strong> measures asymmetry. Positive skew, a long
        right tail, pushes the mean above the median in many common
        distributions, income and latency among them.
        <strong> Excess kurtosis</strong> rests on the fourth moment and reacts
        hard to extremes. On its own it describes no tail risk. Change N and
        watch the sampling variability in these estimates.
      </p>
      <DistributionExplorer />
      <BestPractices
        title="Best practices, distributions"
        items={[
          "<b>Pair summaries with plots.</b> Similar means and variances can hide different distributions, nonlinear structure, or influential observations.",
          "<b>Treat skewness &gt; 1 as a prompt, not a rule.</b> A log transform needs positive values and has to serve the model assumptions and the interpretation.",
          "<b>Vary the bin count.</b> The Freedman-Diaconis width (∝ IQR · n<sup>−1/3</sup>) is one starting rule. Then check how much the picture moves with the bin boundaries.",
          "<b>Compare mean vs. median.</b> A large gap signals skew or heavy outliers inside the mean.",
        ]}
      />

      <SectionLabel n="02">Outlier Detection</SectionLabel>
      <p className="prose">
        Outliers are not bugs. They are signals. A transaction 50× the typical
        value can be fraud, a test-account flush, or a real whale customer.
        Detect, investigate, then decide: remove, cap (winsorise), or model
        separately. Dropping an outlier without a written reason is not
        cleaning.
      </p>
      <p className="prose">
        Three strategies, three sets of assumptions.
        <strong> Z-score</strong> flags distance from a mean in
        standard-deviation units and reacts to skew and extremes.
        <strong> IQR fences</strong> (Tukey, 1.5 × IQR) are a nonparametric
        visual flag, no proof that an observation is wrong.
        <strong> Isolation Forest</strong> partitions the feature space at
        random; points isolated in fewer splits get higher anomaly scores. In
        high dimensions its performance still hangs on sample size,
        contamination, feature representation, and tuning.
      </p>
      <OutlierDetector />
      <AntiPatterns
        title="Outlier anti-patterns"
        items={[
          "<b>Removing outliers to improve R².</b> Outliers contain information. Deleting them without investigation is data falsification.",
          "<b>Using only Z-scores on skewed data.</b> The long tail moves the mean and the standard deviation, so your cutoff misclassifies observations.",
          "<b>Treating multivariate outliers as univariate ones.</b> A point at (x=1.5σ, y=1.5σ) looks fine on each axis but can be a genuine outlier in 2D joint space (Mahalanobis distance catches this).",
        ]}
      />

      <SectionLabel n="03">Correlation Structure</SectionLabel>
      <p className="prose">
        A correlation matrix shows the linear relationships across every
        feature pair at once. Which features move together, which are
        independent, which are proxies for one underlying cause. That drives
        feature selection, where collinear features add noise, and it drives
        domain understanding, where a high income-satisfaction correlation
        points at a mechanism worth investigating.
      </p>
      <p className="prose">
        The <strong>noise slider</strong> adds seeded independent noise to this
        constructed linear relationship, and Pearson r drifts toward 0. That is
        attenuation under a classical measurement-error setup. Other error
        mechanisms bias correlation in other directions, and disattenuation
        needs reliability estimates you can defend.
      </p>
      <CorrelationMatrix />
      <AntiPatterns
        title="Correlation anti-patterns"
        items={[
          "<b>Equating high correlation with causation.</b> Ask which common causes, selection processes, or time trends could generate the association; see Chapter 09.",
          "<b>Using Pearson r as a general dependence measure.</b> A symmetric U-shaped relation can have r near 0. Inspect the plot and select a measure that matches the question; Spearman captures monotonic association, not every nonlinearity.",
          "<b>Ignoring multicollinearity.</b> Strongly related predictors destabilize individual coefficients in linear models. How badly depends on the estimand, the sample, and the regularization.",
          "<b>Reading a matrix without the underlying plots.</b> Spot-check the important pairs. Outliers, clusters, and nonlinearity change what Pearson r means.",
        ]}
      />
      <BestPractices
        title="Best practices, correlations"
        items={[
          "<b>Plot the correlation matrix as a heatmap</b>, not a table of numbers. The visual makes high/low clusters obvious at a glance.",
          "<b>For ordinal or monotonic questions, consider Spearman's ρ.</b> Distributional assumptions matter for inference, while the choice of coefficient should match the association of interest.",
          "<b>After finding strong correlations, cluster features</b> (hierarchical clustering on the distance matrix 1−|r|) to reveal groups of redundant predictors.",
          "<b>Check the target variable last.</b> Strong correlation with the target is useful; strong correlation between two features you plan to use together is a red flag.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Plots and summaries answer different questions.</b> Check bin sensitivity, quantiles, missingness, ranges, and domain constraints together.",
          "<b>An anomaly score is a review signal.</b> Correcting, keeping, capping, or segmenting an observation needs provenance and a look at the downstream impact.",
          "<b>Pearson r measures linear association.</b> Add the underlying plot and choose rank-based or nonlinear measures only when they match the question.",
          "<b>Measurement error needs a model.</b> Classical independent noise attenuates correlation; systematic or differential error can behave differently.",
          "<b>Repeat the EDA after every material transformation.</b> Joins, imputation, and feature construction change distributions and data quality.",
        ]}
      />
    </div>
  );
}
