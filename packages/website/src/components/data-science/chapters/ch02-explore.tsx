import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
import { DistributionExplorer } from "@/components/data-science/simulators/distribution-explorer";
import { OutlierDetector } from "@/components/data-science/simulators/outlier-detector";
import { CorrelationMatrix } from "@/components/data-science/simulators/correlation-matrix";

// ─── Ch02: Explore (plan 012 stage 7) ──────────────────────────────────
//
// Typed port of Ch02_Explore.js. Each of its three named simulators
// (DistributionExplorer, OutlierDetector, CorrelationMatrix) lives in its
// own file under simulators/, matching the split established in stage 6.

export default function Ch02Explore() {
  return (
    <div className="chapter-root">
      <Hero
        eyebrow="Chapter 02"
        title="Exploratory Data Analysis — <em>look before you leap.</em>"
        hook="Thirty minutes of plots save thirty days of debugging. Before a single <code>.fit()</code>, answer: what shape, what outliers, what correlations? This chapter is the checklist."
        meta={[
          { k: "Topics", v: "Distributions · Outliers · Correlations" },
          { k: "Time", v: "10 min" },
          { k: "Sims", v: "3 interactive" },
          { k: "Level", v: "Core" },
        ]}
      />

      <SectionLabel n="01">Distribution Shapes</SectionLabel>
      <p className="prose">
        The histogram is the first thing you draw on any new dataset — not a mean, not a scatter
        plot. A histogram tells you at a glance whether your data is roughly bell-shaped (safe to
        use parametric tests), skewed (log-transform candidate), bimodal (hidden
        sub-populations?), or uniform (likely a synthetic key, not a real measurement).
      </p>
      <p className="prose">
        <strong>Skewness</strong> measures asymmetry. Positive skew (long right tail) pushes the
        mean above the median — classic for income, latency, claim sizes.
        <strong> Kurtosis</strong> (excess) measures tail weight. Heavy-tailed distributions
        (kurtosis &gt; 0) produce more extreme events than a normal, which matters for risk and
        anomaly detection. Change N to see how estimation stabilises with more data.
      </p>
      <DistributionExplorer />
      <BestPractices
        title="Best practices — distributions"
        items={[
          "<b>Always plot a histogram before computing statistics.</b> Summary stats can be identical for wildly different distributions (Anscombe's Quartet is the classic proof).",
          "<b>If skewness &gt; 1, consider log-transforming</b> before fitting linear models or computing Pearson r.",
          "<b>Vary bin count.</b> Freedman-Diaconis rule (bin width ∝ IQR · n<sup>−1/3</sup>) is a solid automatic choice.",
          "<b>Compare mean vs. median.</b> A large gap signals skew or heavy outliers contaminating the mean.",
        ]}
      />

      <SectionLabel n="02">Outlier Detection</SectionLabel>
      <p className="prose">
        Outliers are not bugs — they are signals. A transaction 50× the typical value could be
        fraud, a test-account flush, or a genuine whale customer. The right move is to detect,
        investigate, and then decide: remove, cap (winsorise), or model separately. Never silently
        drop outliers without documenting why.
      </p>
      <p className="prose">
        Three detection strategies dominate in practice.
        <strong> Z-score</strong> (threshold = 3σ) is fast but assumes normality — it collapses on
        heavily skewed data.
        <strong> IQR fences</strong> (Tukey, 1.5 × IQR) are distribution-free and robust to skew.
        They are the default in most box-plot implementations.
        <strong> Isolation Forest</strong> recursively partitions the feature space at random;
        anomalies require fewer splits to isolate. It scales to high dimensions where
        distance-based methods fail.
      </p>
      <OutlierDetector />
      <AntiPatterns
        title="Outlier anti-patterns"
        items={[
          "<b>Removing outliers to improve R².</b> Outliers contain information. Deleting them without investigation is data falsification.",
          "<b>Using only Z-score on skewed data.</b> When data is right-skewed, Z-score almost never flags right-tail extremes because the mean and SD are already pulled right.",
          "<b>Treating multivariate outliers as univariate ones.</b> A point at (x=1.5σ, y=1.5σ) looks fine on each axis but can be a genuine outlier in 2D joint space (Mahalanobis distance catches this).",
        ]}
      />

      <SectionLabel n="03">Correlation Structure</SectionLabel>
      <p className="prose">
        A correlation matrix gives you a bird&apos;s-eye view of linear relationships across all
        feature pairs. It answers: which features move together, which are independent, and
        which might be proxies for the same underlying cause. This matters for feature selection
        (collinear features add noise) and for understanding the domain (high income–satisfaction
        correlation hints at a mechanism worth investigating).
      </p>
      <p className="prose">
        Drag the <strong>noise slider</strong> to simulate measurement noise or a smaller
        effective sample. Watch Pearson r decay toward 0 — this is the attenuation bias that
        plagues survey data, wearable sensors, and self-reported measurements. Correcting for
        attenuation (disattenuation) is an underused technique in applied ML.
      </p>
      <CorrelationMatrix />
      <AntiPatterns
        title="Correlation anti-patterns"
        items={[
          "<b>Equating high correlation with causation.</b> Spurious correlates are everywhere. Always ask: is there a common cause? (Ch 09 covers causal graphs.)",
          "<b>Computing Pearson r on non-linear relationships.</b> Two variables with a perfect U-shape have r ≈ 0. Use Spearman rank correlation or mutual information instead.",
          "<b>Ignoring multicollinearity.</b> Two features with r = 0.95 carry almost the same information. Keeping both inflates variance in linear models and makes coefficients unstable.",
          "<b>Reading a correlation matrix and skipping the scatter plots.</b> Always spot-check the highest correlations visually — outliers can manufacture or destroy Pearson r.",
        ]}
      />
      <BestPractices
        title="Best practices — correlations"
        items={[
          "<b>Plot the correlation matrix as a heatmap</b> — not a table of numbers. The visual makes high/low clusters obvious at a glance.",
          "<b>For non-normal or ordinal data, use Spearman's ρ</b> instead of Pearson r.",
          "<b>After finding strong correlations, cluster features</b> (hierarchical clustering on the distance matrix 1−|r|) to reveal groups of redundant predictors.",
          "<b>Check the target variable last.</b> Strong correlation with the target is useful; strong correlation between two features you plan to use together is a red flag.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Histogram first, stats second.</b> Mean and variance are summaries of a shape you haven't seen yet — look at the shape first.",
          "<b>Outliers are signals, not noise.</b> Detect with Z-score for normal data, IQR for skewed data, and Isolation Forest for high-dimensional data. Then investigate before deleting.",
          "<b>Correlation r measures linear association only.</b> Always complement with scatter plots and consider Spearman for ordinal or non-normal data.",
          "<b>Noise attenuates correlations.</b> Measurement error biases r toward zero — the true relationship is stronger than your matrix suggests.",
          "<b>EDA is a checklist, not a one-time event.</b> Rerun it after every data join, imputation step, or feature engineering pass. New transformations create new distributions.",
        ]}
      />
    </div>
  );
}
