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
        hook="Metric and threshold choices encode error costs, class prevalence, calibration needs, and operating capacity. Use the synthetic score distribution to inspect those tradeoffs."
        meta={[
          { k: "Read", v: "8 min" },
          { k: "Focus", v: "Confusion · ROC · PR" },
          { k: "Models", v: "1 synthetic sweep" },
        ]}
      />

      <section className="section">
        <SectionLabel n="06.1">The confusion matrix</SectionLabel>
        <h2 className="h2">
          Four cells. <em>One thousand decisions.</em>
        </h2>
        <p className="prose">
          At one threshold, binary predictions form TP, FP, FN, and TN counts.
          Precision, recall, specificity, and F1 derive from that matrix.
          ROC-AUC and PR-AUC summarize performance across thresholds; log loss
          and calibration use the probability scores directly.
        </p>
        <ThresholdSim />
      </section>

      <section className="section">
        <SectionLabel n="06.2">Picking the right metric</SectionLabel>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Fraud or screening:</strong> if missed cases dominate,
            require high recall while constraining review load and harm from
            false positives.
          </li>
          <li>
            <strong>Spam filtering:</strong> if flagging legitimate mail is
            costly, constrain the false-positive rate or require precision at
            the operating threshold.
          </li>
          <li>
            <strong>Balanced classes:</strong> prevalence alone does not select
            a metric; choose from ranking, probability accuracy, calibration,
            and decision cost.
          </li>
          <li>
            <strong>Rare events:</strong> PR curves expose precision at
            attainable recall and are sensitive to prevalence. Report the base
            rate and compare both ranking and threshold metrics.
          </li>
        </ul>
        <AntiPatterns
          items={[
            "<b>Reporting accuracy alone on rare events.</b> At a 0.1% event rate, predicting every case as negative yields 99.9% accuracy while detecting no events.",
            "<b>Mixing training and decision objectives without checking them.</b> A model optimized for log loss can still be thresholded for a cost target, but both calibration and operating metrics need validation.",
            "<b>Default τ=0.5.</b> Threshold should reflect your business cost ratio, not library defaults.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Metric = value judgement.</b> You're saying which mistake is worse.",
          "<b>Threshold is a lever, not a default.</b> Move it.",
          `<b>Calibration concerns groups of predictions.</b> Among cases assigned about 0.7, roughly 70% should be positive over the stated population and time window; it is not a guarantee for one case.`,
        ]}
      />
    </>
  );
}
