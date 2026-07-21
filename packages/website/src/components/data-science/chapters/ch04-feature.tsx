import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
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
        title="Better features beat <em>fancier models.</em>"
        hook="A gradient boosted tree with thoughtful features outperforms a transformer on raw inputs 9 times out of 10. <strong>Feature engineering is where domain knowledge becomes competitive advantage.</strong>"
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
          Every ML model ingests numbers, but your data is full of strings. How you encode a
          categorical feature changes what the model can learn. <strong>One-hot</strong> is the
          safe default. <strong>Target encoding</strong> is the sharp knife, powerful but leaks
          the label if done naively. <strong>Label encoding</strong> is almost always wrong for
          nominal categories. <strong>Frequency encoding</strong> is the underrated middle ground.
        </p>
        <EncodingComparison />
      </section>

      <AntiPatterns
        items={[
          "<b>Label encoding nominals.</b> Berlin (5) is not 5× New York (1). Breaks linear models silently, the model trains without error, just learns nonsense.",
          "<b>Target encoding on the full training set.</b> You are telling the model the answer. Always compute target means out-of-fold.",
          "<b>One-hotting 10,000 zip codes.</b> Dimensionality explosion. Use target or frequency encoding above ~50 categories.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Default to one-hot</b> for low-cardinality nominals (&lt;20 categories). Explicit, interpretable, no assumptions.",
          "<b>Target encoding with k-fold</b> for high-cardinality features. Compute means only on out-of-fold rows.",
          "<b>Frequency encoding</b> when you need the cardinality signal but cannot risk target leakage.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.2">Polynomial feature expansion</SectionLabel>
        <h2 className="h2">Adding x² teaches the model to bend.</h2>
        <p className="prose">
          A linear model can only draw straight lines. Adding <code>x²</code> or <code>x³</code>{" "}
          as explicit features lets it fit curves, without changing the model at all. The
          tradeoff is the bias-variance knife edge: too few terms and you underfit (miss the
          signal), too many and you overfit (chase the noise).
        </p>
        <PolynomialExpansion />
      </section>

      <BestPractices
        items={[
          "<b>Use R² on a held-out validation set</b>, not training set, to pick degree. Training R² always improves with degree.",
          "<b>Standardize features before expanding.</b> x² with x ∈ [0, 1000] creates astronomically large values.",
          "<b>Tree models do not need polynomial features.</b> They already model interactions and nonlinearities. This pattern is for linear/logistic regression.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.3">Feature selection</SectionLabel>
        <h2 className="h2">More features ≠ better model.</h2>
        <p className="prose">
          Irrelevant features add noise. Correlated duplicates dilute coefficients.
          Dimensionality increases memory, slows training, and can genuinely hurt
          generalization. Use a principled selection method rather than adding everything
          available and hoping regularization handles it.
        </p>
        <FeatureSelectionSim />
      </section>

      <AntiPatterns
        items={[
          "<b>Selecting features on the full dataset before train/test split.</b> You have used future information. The selected subset will look better than it is.",
          "<b>Dropping features because they have low correlation.</b> Correlation is linear only. A feature with r=0.04 can have high mutual information (e.g. day_of_week vs. weekend_sales).",
          "<b>Engineering 300 features then hoping LASSO handles it.</b> Add, measure, keep, one or a small batch at a time. Random noise features still occasionally survive regularization.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.4">Interaction terms</SectionLabel>
        <h2 className="h2">When A × B is not A + B.</h2>
        <p className="prose">
          Interaction effects are everywhere in real data: the effect of an ad&apos;s relevance
          depends on who is seeing it. The effect of a drug depends on patient age. A linear
          model can&apos;t capture this, the A×B term must be explicitly constructed as a new
          feature. Tree models learn interactions automatically; linear models need your help.
        </p>
        <InteractionTerms />
      </section>

      <BestPractices
        items={[
          "<b>Hypothesize before you compute.</b> A×B only makes sense if domain knowledge predicts the interaction. Mining all pairs is expensive and mostly noise.",
          "<b>Interaction terms require standardization.</b> Multiply two large-scale features and you create numerical instability. Normalize first.",
          "<b>Use tree-based feature importance to find candidates.</b> Split-based importance in a GBDT reveals which pairs of features co-occur at decision boundaries.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Encoding is a model choice, not a preprocessing step.</b> Target encoding with leakage is a silent bug that inflates cross-validation scores and fails in production.",
          "<b>Polynomial expansion ↔ bias-variance tradeoff.</b> Degree 1 = underfit, degree 3+ on 40 points = overfit. Always validate on held-out data.",
          "<b>Feature selection must happen inside cross-validation.</b> Selecting features before splitting is a form of data leakage, the same kind as target encoding on the full set.",
          "<b>Interaction terms encode domain knowledge.</b> You can't mine every pair at scale. Hypothesize, compute one term, measure lift, repeat.",
          "<b>Inference parity is the hard constraint.</b> Every feature, encoding, and interaction must be computable at serve time with the data you will actually have, before the label is known.",
        ]}
      />
    </>
  );
}
