import { Hero, SectionLabel, AntiPatterns, Takeaway } from "@/components/data-science/shared/primitives";
import { BiasVarianceSim } from "@/components/data-science/simulators/bias-variance-sim";

// ─── Ch05: Model (plan 012 stage 8) ────────────────────────────────────
//
// Typed port of Ch05_Model.js. BiasVarianceSim lives in its own file per
// the split established since stage 6.

export default function Ch05Model() {
  return (
    <>
      <Hero
        eyebrow="Chapter 05 · Model"
        title='The <em>bias / variance</em> <span class="accent">dance.</span>'
        hook="Every model lives on a spectrum. Too simple → underfits, misses the pattern. Too flexible → memorizes the noise. <strong>Cross-validation is how you find the sweet spot.</strong>"
        meta={[
          { k: "Read", v: "9 min" },
          { k: "Focus", v: "Fit · CV · tune" },
          { k: "Sims", v: "1 live ensemble" },
        ]}
      />

      <section className="section">
        <SectionLabel n="05.1">The tradeoff, made physical</SectionLabel>
        <h2 className="h2">
          Slide the knob. Reshuffle the data. <em>Watch the cloud fan out.</em>
        </h2>
        <p className="prose">
          At low complexity, every resample lands on almost the same stiff line — low variance,
          but high bias (the line can&apos;t bend to match the truth). At high complexity, each
          resample finds a different wild curve through the same-ish noise — bias falls toward
          zero, but variance explodes.
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
            <strong>Logistic / linear regression</strong> — interpretable, fast, hard to beat on
            tabular with good features.
          </li>
          <li>
            <strong>Gradient-boosted trees (XGBoost, LightGBM)</strong> — the tabular workhorse.
            Rarely a wrong answer.
          </li>
          <li>
            <strong>Random forest</strong> — robust, low-tuning, good first escalation.
          </li>
          <li>
            <strong>Deep nets</strong> — unstructured data (text, images, audio). Rarely the right
            call for tabular.
          </li>
        </ul>
      </section>

      <AntiPatterns
        items={[
          "<b>Tuning on the test set.</b> That's just a slower way to overfit.",
          "<b>Leaderboard chasing.</b> 0.01 AUC on CV is not a real gain if your CV has leakage.",
          "<b>Deep learning as default.</b> For 90% of business tabular problems, GBDT wins on time, metric, and interpretability.",
        ]}
      />

      <Takeaway
        items={[
          "<b>Generalization is the goal, not fit.</b> Always measure on held-out data.",
          "<b>Cross-validation is non-optional</b> — single split lies about variance.",
          "<b>Total error = Bias² + Variance + irreducible noise.</b> You can only move the first two — noise is a floor.",
        ]}
      />
    </>
  );
}
