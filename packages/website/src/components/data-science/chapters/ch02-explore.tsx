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
        hook="Before <code>.fit()</code>, look at distributions, missingness, odd observations, relationships, units and time. Data defects are cheap to find here."
        meta={[
          { k: "Topics", v: "Distributions · Outliers · Correlations" },
          { k: "Time", v: "10 min" },
          { k: "Sims", v: "3 interactive" },
          { k: "Level", v: "Core" },
        ]}
      />

      <SectionLabel n="01">Distribution Shapes</SectionLabel>
      <p className="prose">
        Bin choices can hide or invent structure in a histogram, so pair it
        with counts, quantiles, an empirical CDF, missingness and valid domain
        ranges. Shape alone validates no parametric test and justifies no
        transformation.
      </p>
      <p className="prose">
        <strong>Skewness</strong> measures asymmetry: a long right tail pushes
        the mean above the median, as with income or latency.{" "}
        <strong>Excess kurtosis</strong> rests on the fourth moment, reacts
        hard to extremes and describes no tail risk on its own. Change N and
        watch the estimates wobble.
      </p>
      <DistributionExplorer />
      <BestPractices
        title="Best practices, distributions"
        items={[
          "<b>Pair summaries with plots.</b> Similar means and variances can hide different distributions, nonlinearity or influential points.",
          "<b>Treat skewness &gt; 1 as a prompt to check.</b> A log transform needs positive values and must serve model assumptions and interpretation.",
          "<b>Vary the bin count.</b> Start with the Freedman-Diaconis width (∝ IQR · n<sup>−1/3</sup>) and check how the picture moves with bin boundaries.",
        ]}
      />

      <SectionLabel n="02">Outlier Detection</SectionLabel>
      <p className="prose">
        An outlier is an observation first. A transaction at 50× the typical
        value can be fraud, a test account or a real large customer. Detect,
        investigate, then remove, cap (winsorise) or model separately, with a
        written reason.
      </p>
      <p className="prose">
        <strong>Z-score</strong> measures distance from the mean in standard
        deviations and reacts to skew and extremes.{" "}
        <strong>IQR fences</strong> (Tukey, 1.5 × IQR) are a nonparametric
        visual flag, no proof of an error. <strong>Isolation Forest</strong>{" "}
        splits the feature space at random and scores points isolated in fewer
        splits as more anomalous; sample size, contamination, features and
        tuning still drive its quality.
      </p>
      <OutlierDetector />
      <AntiPatterns
        title="Outlier anti-patterns"
        items={[
          "<b>Removing outliers to improve R².</b> Deleting informative observations unchecked falsifies the data.",
          "<b>Using only Z-scores on skewed data.</b> The long tail shifts mean and standard deviation, so the cutoff misclassifies points.",
          "<b>Checking multivariate outliers one variable at a time.</b> A point at (x=1.5σ, y=1.5σ) looks fine on each axis and can still be anomalous in 2D; Mahalanobis distance catches this.",
        ]}
      />

      <SectionLabel n="03">Correlation Structure</SectionLabel>
      <p className="prose">
        A correlation matrix shows linear relationships across all feature
        pairs. It exposes redundant features and hints at domain mechanisms
        without proving causation.
      </p>
      <p className="prose">
        The slider adds independent <strong>measurement noise</strong> to a
        constructed linear relationship, and Pearson r drifts toward 0. That is
        attenuation under classical measurement error; other error mechanisms
        bias differently, and disattenuation needs defensible reliability
        estimates.
      </p>
      <CorrelationMatrix />
      <AntiPatterns
        title="Correlation anti-patterns"
        items={[
          "<b>Using Pearson r as a general dependence measure.</b> A symmetric U-shape can have r near 0. Check the plot and pick a measure that fits the question; Spearman captures monotonic association only.",
          "<b>Ignoring multicollinearity.</b> Strongly related predictors destabilize single coefficients in linear models, depending on estimand, sample and regularization.",
        ]}
      />
      <BestPractices
        title="Best practices, correlations"
        items={[
          "<b>Consider Spearman's ρ for ordinal or monotonic questions.</b> Distribution assumptions affect inference; the coefficient must fit the association you ask about.",
          "<b>Cluster strongly correlated features.</b> Hierarchical clustering on 1−|r| reveals redundant groups.",
          "<b>Separate links to the target from links between inputs.</b> The latter can signal redundancy.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Repeat the EDA after major transformations.</b> Joins, imputation and feature construction change distributions and data quality.",
        ]}
      />
    </div>
  );
}
