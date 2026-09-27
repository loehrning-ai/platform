import {
  Hero,
  SectionLabel,
  AntiPatterns,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { BiasVarianceSim } from "@/components/data-science/simulators/bias-variance-sim";

// ─── Ch05: Model ────────────────────────────────────
//
// Typed port of Ch05_Model.js. BiasVarianceSim lives in its own file per
// the split established since stage 6.

export default function Ch05Model() {
  return (
    <>
      <Hero
        eyebrow="Chapter 05 · Model"
        title="Model flexibility changes <em>bias and variance.</em>"
        hook="More flexibility usually lowers approximation error, raises estimation variance and costs compute and interpretability. <strong>A validation design that matches deployment decides which trade pays off.</strong>"
        meta={[
          { k: "Read", v: "9 min" },
          { k: "Focus", v: "Fit · CV · tune" },
          { k: "Models", v: "1 synthetic ensemble" },
        ]}
      />

      <section className="section">
        <SectionLabel n="05.1">The tradeoff, made physical</SectionLabel>
        <h2 className="h2">
          Slide the knob. Reshuffle the data. <em>Watch the cloud fan out.</em>
        </h2>
        <p className="prose">
          In this fixed polynomial generator, low degrees give similar curves
          that miss in the same way. Higher degrees hug the sampled points and
          swing more across resamples. With other models, data or losses the
          pattern need not be monotonic.
        </p>
        <BiasVarianceSim />
      </section>

      <section className="section">
        <SectionLabel n="05.2">Choosing a model</SectionLabel>
        <h2 className="h2">
          Start simple. <em>Escalate only with evidence.</em>
        </h2>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Logistic or linear regression:</strong> interpretable, fast
            baselines for tabular data when the functional form fits.
          </li>
          <li>
            <strong>Gradient-boosted trees (XGBoost, LightGBM):</strong> a
            strong default for tabular data; tuning and calibration stay on
            you.
          </li>
          <li>
            <strong>Random forest:</strong> a nonlinear ensemble baseline with
            limits in calibration, latency and extrapolation.
          </li>
          <li>
            <strong>Deep nets:</strong> the standard for text, images and
            audio; on tabular data, compare them with simpler baselines under
            the same budget and split.
          </li>
        </ul>
      </section>

      <AntiPatterns
        items={[
          "<b>Tuning on the test set.</b> The model then fits the test set indirectly, and its score looks too good.",
          "<b>Leaderboard chasing.</b> A 0.01 AUC difference decides nothing without fold-level uncertainty, leakage checks and an untouched confirmation set.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Resampling shows how much the result depends on the split.</b> Cross-validation helps only when folds match the data structure; grouped, temporal or nested designs are often needed.",
          "<b>Bias² + variance + noise decomposes squared error.</b> It holds under a specified data-generating process and does not apply to every metric.",
        ]}
      />
    </>
  );
}
