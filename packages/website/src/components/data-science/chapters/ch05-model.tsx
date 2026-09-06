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
        hook="Model flexibility moves approximation error, estimation variance, compute, and interpretability at once. <strong>Compare those tradeoffs in a validation design that matches deployment.</strong>"
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
          In this fixed polynomial generator, low degrees give similar curves,
          all wrong in the same way. Higher degrees hug the sampled points
          and swing further across seeded resamples. The picture guarantees
          nothing about how complexity moves bias and variance for another
          model, regularizer, dataset, or loss.
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
            <strong>Logistic / linear regression</strong>, interpretable, fast,
            hard to beat as a baseline on tabular data when the functional form
            fits.
          </li>
          <li>
            <strong>Gradient-boosted trees (XGBoost, LightGBM)</strong>, the
            tabular workhorse, a strong candidate for many tabular tasks, tuning
            and calibration still on you.
          </li>
          <li>
            <strong>Random forest</strong>, a nonlinear ensemble baseline with
            its own calibration, latency, and extrapolation limits.
          </li>
          <li>
            <strong>Deep nets</strong>, the standard for text, images, and
            audio. On tabular data, make them beat simpler baselines under the
            same budget and split.
          </li>
        </ul>
      </section>

      <AntiPatterns
        items={[
          "<b>Tuning on the test set.</b> That's just a slower way to overfit.",
          "<b>Leaderboard chasing.</b> A 0.01 AUC difference decides nothing without fold-level uncertainty, leakage checks, and an untouched confirmation set.",
          "<b>Choosing an architecture by reputation.</b> Compare linear, tree, and neural candidates under the same data, compute budget, latency, calibration, and interpretability requirements.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Generalization is the goal.</b> Keep evaluation data out of model fitting, and build the split to reproduce future entities, groups, or time.",
          "<b>Resampling quantifies split sensitivity.</b> Cross-validation helps when folds respect the data structure; grouped, temporal, or nested designs may be required.",
          "<b>Bias² + variance + noise is a squared-error decomposition.</b> It is a teaching lens under a specified data-generating process, not a universal formula for every metric.",
        ]}
      />
    </>
  );
}
