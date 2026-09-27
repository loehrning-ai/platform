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
        hook="Features decide what information reaches the model, and each one must still exist at inference. Compare encoding, nonlinear terms, selection and interactions under one leakage-safe validation plan."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Encode · Expand · Select · Interact" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="04.1">Encoding categorical features</SectionLabel>
        <h2 className="h2">Four encodings and one common mistake</h2>
        <p className="prose">
          <strong>One-hot</strong> maps nominal values without an order and
          costs a column per category. <strong>Target encoding</strong> uses
          labels, so it needs fold-local estimation, smoothing and a rule for
          unknown categories. Integer codes impose an order on models that read
          numeric distance; frequency encoding merges equally frequent
          categories.
        </p>
        <EncodingComparison />
      </section>

      <AntiPatterns
        items={[
          "<b>Label encoding nominals.</b> Berlin (5) is not 5× New York (1); training runs without error and the model learns nonsense.",
          "<b>Target encoding before fold construction.</b> Validation rows then see their own or neighboring labels. Estimate the encoder in each training fold, with smoothing and a rule for unseen categories.",
          "<b>One-hot encoding high-cardinality IDs without a resource plan.</b> Compare hashing, grouped categories and learned encoders under your memory and validation limits; no category count works as a universal cutoff.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Frequency encoding</b> when frequency is informative and target leakage must be ruled out.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.2">Polynomial feature expansion</SectionLabel>
        <h2 className="h2">With x², a linear model can bend.</h2>
        <p className="prose">
          A linear model draws straight lines. Add <code>x²</code> and{" "}
          <code>x³</code> as features and it fits curves without a model
          change. Too few terms underfit, too many learn noise.
        </p>
        <PolynomialExpansion />
      </section>

      <BestPractices
        items={[
          "<b>Pick the degree on held-out or cross-validated performance.</b> For nested unregularized least-squares models on the same rows, training R² cannot drop as terms are added; generalization can.",
          "<b>Center or scale when magnitude affects conditioning or regularization.</b> Polynomial terms can differ by many orders of magnitude.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.3">Feature selection</SectionLabel>
        <h2 className="h2">More features ≠ better model.</h2>
        <p className="prose">
          Irrelevant features add noise and correlated duplicates dilute
          coefficients. More dimensions cost memory and training time and can
          hurt generalization.
        </p>
        <FeatureSelectionSim />
      </section>

      <AntiPatterns
        items={[
          "<b>Selecting features on the full dataset before the train/test split.</b> That uses test information, and the subset looks better than it is.",
          "<b>Dropping features for low correlation.</b> Correlation is linear only; a feature with r=0.04 can have high mutual information (e.g. day_of_week vs. weekend_sales).",
          "<b>Building 300 features and hoping LASSO sorts them.</b> Add features in small, measured batches; pure noise can survive regularization.",
        ]}
      />

      <section className="section">
        <SectionLabel n="04.4">Interaction terms</SectionLabel>
        <h2 className="h2">When A × B is not A + B.</h2>
        <p className="prose">
          In an interaction, the effect of A depends on B: an ad&apos;s
          relevance matters differently for different viewers, and a drug
          works differently by patient age. Linear models need an explicit A×B
          feature; tree models learn interactions themselves.
        </p>
        <InteractionTerms />
      </section>

      <BestPractices
        items={[
          "<b>Use interaction-specific diagnostics.</b> Two-way partial dependence, SHAP interaction values or nested-model comparisons can suggest candidates; split importance alone does not identify a pair.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Polynomial expansion changes bias and variance.</b> The 40-point demo makes higher degrees unstable; pick basis and regularization fold-locally on the real design.",
          "<b>Interaction searches create multiplicity.</b> Start from domain hypotheses, control the search inside validation and confirm kept terms on untouched data.",
        ]}
      />
    </>
  );
}
