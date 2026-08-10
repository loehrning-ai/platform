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
        hook="Before <code>.fit()</code>, inspect distributions, missingness, unusual observations, relationships, units, and time. The goal is to find assumptions and data defects before they enter a model."
        meta={[
          { k: "Topics", v: "Distributions · Outliers · Correlations" },
          { k: "Time", v: "10 min" },
          { k: "Sims", v: "3 interactive" },
          { k: "Level", v: "Core" },
        ]}
      />

      <SectionLabel n="01">Distribution Shapes</SectionLabel>
      <p className="prose">
        A histogram is one useful first view of a numeric variable. Bin choices
        can hide or create apparent structure, so combine it with counts,
        quantiles, an empirical CDF, missingness, and domain-valid ranges. Shape
        alone does not make a parametric test valid or identify a
        transformation.
      </p>
      <p className="prose">
        <strong>Skewness</strong> measures asymmetry. Positive skew (long right
        tail) pushes the mean above the median in many common distributions,
        including income and latency.
        <strong> Excess kurtosis</strong> is based on the fourth moment and is
        highly sensitive to extremes; it does not describe tail risk by itself.
        Change N to inspect sampling variability in these estimates.
      </p>
      <DistributionExplorer />
      <BestPractices
        title="Best practices, distributions"
        items={[
          "<b>Pair summaries with plots.</b> Similar means and variances can hide different distributions, nonlinear structure, or influential observations.",
          "<b>Treat skewness &gt; 1 as a prompt, not a rule.</b> A log transform requires positive values and should serve the model assumptions and interpretation.",
          "<b>Vary bin count.</b> The Freedman-Diaconis width (∝ IQR · n<sup>−1/3</sup>) is one starting rule; inspect sensitivity to bin boundaries.",
          "<b>Compare mean vs. median.</b> A large gap signals skew or heavy outliers contaminating the mean.",
        ]}
      />

      <SectionLabel n="02">Outlier Detection</SectionLabel>
      <p className="prose">
        Outliers are not bugs, they are signals. A transaction 50× the typical
        value could be fraud, a test-account flush, or a genuine whale customer.
        The right move is to detect, investigate, and then decide: remove, cap
        (winsorise), or model separately. Never silently drop outliers without
        documenting why.
      </p>
      <p className="prose">
        Three simple strategies illustrate different assumptions.
        <strong> Z-score</strong> flags distance from a mean in
        standard-deviation units and is sensitive to skew and extremes.
        <strong> IQR fences</strong> (Tukey, 1.5 × IQR) are a nonparametric
        visual flag, not proof that an observation is erroneous.
        <strong> Isolation Forest</strong> recursively partitions the feature
        space at random; points isolated in fewer splits receive higher anomaly
        scores. Performance in high dimensions still depends on sample size,
        contamination, feature representation, and tuning.
      </p>
      <OutlierDetector />
      <AntiPatterns
        title="Outlier anti-patterns"
        items={[
          "<b>Removing outliers to improve R².</b> Outliers contain information. Deleting them without investigation is data falsification.",
          "<b>Using only Z-scores on skewed data.</b> Mean and standard deviation are themselves affected by the long tail, so the chosen cutoff can misclassify observations.",
          "<b>Treating multivariate outliers as univariate ones.</b> A point at (x=1.5σ, y=1.5σ) looks fine on each axis but can be a genuine outlier in 2D joint space (Mahalanobis distance catches this).",
        ]}
      />

      <SectionLabel n="03">Correlation Structure</SectionLabel>
      <p className="prose">
        A correlation matrix gives you a bird&apos;s-eye view of linear
        relationships across all feature pairs. It answers: which features move
        together, which are independent, and which might be proxies for the same
        underlying cause. This matters for feature selection (collinear features
        add noise) and for understanding the domain (high income-satisfaction
        correlation hints at a mechanism worth investigating).
      </p>
      <p className="prose">
        The <strong>noise slider</strong> adds seeded independent noise to this
        constructed linear relationship. Pearson r then moves toward 0. This is
        attenuation under a classical measurement-error setup; other error
        mechanisms can bias correlation differently. Disattenuation requires
        defensible reliability estimates.
      </p>
      <CorrelationMatrix />
      <AntiPatterns
        title="Correlation anti-patterns"
        items={[
          "<b>Equating high correlation with causation.</b> Ask which common causes, selection processes, or time trends could generate the association; see Chapter 09.",
          "<b>Using Pearson r as a general dependence measure.</b> A symmetric U-shaped relation can have r near 0. Inspect the plot and select a measure that matches the question; Spearman captures monotonic association, not every nonlinearity.",
          "<b>Ignoring multicollinearity.</b> Strongly related predictors can destabilize individual coefficients in linear models; impact depends on the estimand, sample, and regularization.",
          "<b>Reading a matrix without the underlying plots.</b> Spot-check important pairs because outliers, clusters, and nonlinearity can change the interpretation of Pearson r.",
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
          "<b>An anomaly score is a review signal.</b> The decision to correct, retain, cap, or segment an observation needs provenance and downstream-impact analysis.",
          "<b>Pearson r measures linear association.</b> Add the underlying plot and choose rank-based or nonlinear measures only when they match the question.",
          "<b>Measurement error needs a model.</b> Classical independent noise attenuates correlation; systematic or differential error can behave differently.",
          "<b>Repeat EDA after material transformations.</b> Joins, imputation, and feature construction can change distributions and data quality.",
        ]}
      />
    </div>
  );
}
