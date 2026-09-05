import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { EncodingComparison } from "@/components/data-science/simulators/encoding-comparison";
import { PolynomialExpansion } from "@/components/data-science/simulators/polynomial-expansion";
import { FeatureSelectionSim } from "@/components/data-science/simulators/feature-selection-sim";
import { InteractionTerms } from "@/components/data-science/simulators/interaction-terms";

// ─── Ch04: Feature Engineering ──────────────────────
//
// Typed port of Ch04_Feature.js. Each of its 4 named simulators lives in
// its own file under simulators/, matching the split established since
// stage 6.

export default function Ch04Feature() {
  return (
    <>
      <Hero
        eyebrow="Chapter 04 · Feature Engineering"
        title="Feature design defines <em>the model input.</em>"
        hook="Feature design decides what information reaches a model, and whether those values exist at inference. Compare encoding, nonlinear terms, selection, and interactions under one leakage-safe validation plan."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Encode · Expand · Select · Interact" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="04.1">Encoding categorical features</SectionLabel>
        <h2 className="h2">Four strategies. One common mistake.</h2>
        <p className="prose">
          Every model eats numbers. Your data is full of strings. How you
          encode a categorical feature decides what the model can learn.{" "}
          <strong>One-hot</strong> handles low-cardinality nominal values
          without an ordering, at the price of many columns.
          <strong> Target encoding</strong> touches labels, so it needs
          fold-local estimation, smoothing, and a rule for unknown categories.
          Integer codes impose an ordering on models that read numeric distance.
          Frequency encoding merges equally frequent categories.
        </p>
        <EncodingComparison />
      </section>

      <AntiPatterns
        items={[
          "<b>Label encoding nominals.</b> Berlin (5) is not 5× New York (1). Breaks linear models silently: training runs without error, the model learns nonsense.",
          "<b>Target encoding before fold construction.</b> Each validation row can leak its own or neighboring labels. Estimate the encoder inside each training fold and define smoothing plus unseen-category behavior.",
          "<b>One-hot encoding high-cardinality identifiers without a resource plan.</b> Compare hashing, grouped categories, learned encoders, or target and frequency methods under memory and validation constraints. No category-count cutoff is universal.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Consider one-hot encoding</b> for nominal features when cardinality and memory are manageable. It avoids an ordinal-distance assumption but still needs unknown-category handling.",
          "<b>Use fold-local target encoding</b> only when label information is justified. Apply smoothing and compute each validation row from its training fold.",
          "<b>Frequency encoding</b> when you need the cardinality signal but cannot risk target leakage.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.2">Polynomial feature expansion</SectionLabel>
        <h2 className="h2">Adding x² teaches the model to bend.</h2>
        <p className="prose">
          A linear model draws straight lines, nothing more. Add{" "}
          <code>x²</code> or <code>x³</code> as explicit features and it fits
          curves, with the model itself untouched. The price is the
          bias-variance knife edge. Too few terms and you underfit. Too many and
          you chase the noise.
        </p>
        <PolynomialExpansion />
      </section>

      <BestPractices
        items={[
          "<b>Select degree on held-out or cross-validated performance.</b> For nested unregularized least-squares models on the same rows, training R² cannot decrease as terms are added; generalization can.",
          "<b>Center or scale when magnitude affects conditioning or regularization.</b> Polynomial terms can differ by many orders of magnitude.",
          "<b>Test polynomial terms where the model needs an explicit basis.</b> Trees can approximate nonlinearities through splits, but depth, sample size, and regularization determine whether they learn an interaction effectively.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.3">Feature selection</SectionLabel>
        <h2 className="h2">More features ≠ better model.</h2>
        <p className="prose">
          Irrelevant features add noise. Correlated duplicates dilute
          coefficients. Dimensions cost memory, slow training, and can genuinely
          hurt generalization. Pick a selection method with a reason instead of
          throwing everything in and hoping regularization sorts it out.
        </p>
        <FeatureSelectionSim />
      </section>

      <AntiPatterns
        items={[
          "<b>Selecting features on the full dataset before train/test split.</b> You have used future information. The selected subset will look better than it is.",
          "<b>Dropping features because they have low correlation.</b> Correlation is linear only. A feature with r=0.04 can have high mutual information (e.g. day_of_week vs. weekend_sales).",
          "<b>Engineering 300 features then hoping LASSO handles it.</b> Add, measure, keep, one or a small batch at a time. Pure noise features still survive regularization now and then.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.4">Interaction terms</SectionLabel>
        <h2 className="h2">When A × B is not A + B.</h2>
        <p className="prose">
          Interaction effects are everywhere in real data. How much an
          ad&apos;s relevance matters depends on who sees it. How much a drug
          works depends on patient age. A linear model cannot see that, so the
          A×B term has to be built as a new feature. Tree models find
          interactions themselves. Linear models need your help.
        </p>
        <InteractionTerms />
      </section>

      <BestPractices
        items={[
          "<b>Hypothesize before you compute.</b> A×B earns its place only when domain knowledge predicts the interaction. Mining every pair is expensive and mostly noise.",
          "<b>Center or scale interactions when interpretation, conditioning, or regularization requires it.</b> This is a modeling choice, not a universal prerequisite.",
          "<b>Use interaction-specific diagnostics.</b> Two-way partial dependence, SHAP interaction values, or explicit nested-model comparisons can suggest candidates; ordinary split importance does not identify a pair by itself.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Encoding is a model choice, not a preprocessing step.</b> Target encoding with leakage is a silent bug: it inflates cross-validation scores and fails in production.",
          "<b>Polynomial expansion changes bias and variance.</b> The local 40-point demo makes higher degrees unstable; select the basis and regularization with fold-local validation on the real design.",
          "<b>Feature selection belongs inside cross-validation.</b> Selecting before splitting is leakage, the same kind as target encoding on the full set.",
          "<b>Interaction searches create multiplicity.</b> Use domain hypotheses, control the search inside validation, and confirm retained terms on untouched data.",
          "<b>Inference parity is the hard constraint.</b> Every feature, encoding, and interaction has to be computable at serve time from the data you will actually have, before the label is known.",
        ]}
      />
    </>
  );
}
