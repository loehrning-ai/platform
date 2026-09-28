import {
  Hero,
  SectionLabel,
  AntiPatterns,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { ThresholdSim } from "@/components/data-science/simulators/threshold-sim";

// ─── Ch06: Evaluate ─────────────────────────────────
//
// Typed port of Ch06_Evaluate.js. ThresholdSim lives in its own file
// (simulators/threshold-sim.tsx) per the plan's "own component files"
// requirement for the two named-risk simulators.

export default function Ch06Evaluate() {
  return (
    <>
      <Hero
        eyebrow="Chapter 06 · Evaluate"
        title='Pick the metric <em>before</em> <span class="accent">you pick the model.</span>'
        hook="Metric and threshold encode error costs, class prevalence, calibration needs and review capacity. The synthetic score distribution shows these tradeoffs."
        meta={[
          { k: "Read", v: "8 min" },
          { k: "Focus", v: "Confusion · ROC · PR" },
          { k: "Models", v: "1 synthetic sweep" },
        ]}
      />

      <section className="section">
        <SectionLabel n="06.1">The confusion matrix</SectionLabel>
        <h2 className="h2">
          Four cells count every decision at <em>the threshold.</em>
        </h2>
        <p className="prose">
          One threshold turns scores into TP, FP, FN, and TN counts. Precision,
          recall, specificity, and F1 all fall out of that matrix. ROC-AUC and
          PR-AUC summarize across thresholds; log loss and calibration read the
          probability scores directly.
        </p>
        <ThresholdSim />
      </section>

      <section className="section">
        <SectionLabel n="06.2">Picking the right metric</SectionLabel>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Fraud or screening:</strong> when missed cases dominate,
            demand high recall and cap review load and false-positive harm.
          </li>
          <li>
            <strong>Spam filtering:</strong> when flagging legitimate mail is
            costly, cap the false-positive rate or demand precision at the
            operating threshold.
          </li>
          <li>
            <strong>Balanced classes:</strong> prevalence alone selects no
            metric; choose between ranking, probability accuracy, calibration
            and decision cost.
          </li>
          <li>
            <strong>Rare events:</strong> PR curves expose precision at
            attainable recall and depend on prevalence; report base rate,
            ranking and threshold metrics together.
          </li>
        </ul>
        <AntiPatterns
          items={[
            "<b>Reporting accuracy alone on rare events.</b> At a 0.1% event rate, always predicting negative gives 99.9% accuracy and detects nothing.",
            "<b>Confusing the training objective with the decision objective.</b> For a model trained on log loss, pick the threshold from costs, then check calibration and operating metrics separately.",
            "<b>Default τ=0.5.</b> Set the threshold from your cost ratio.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>A metric encodes a value judgment.</b> It decides which error counts more.",
          `<b>Calibration concerns groups of predictions.</b> Among cases scored about 0.7, roughly 70% should be positive over the stated population and time window; it guarantees nothing for one case.`,
        ]}
      />
    </>
  );
}
