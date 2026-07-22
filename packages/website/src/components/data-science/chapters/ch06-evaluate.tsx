import { Hero, SectionLabel, AntiPatterns, Takeaway } from "@/components/data-science/shared/primitives";
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
        hook="Accuracy is lazy. For fraud, cancer, churn, ads, <strong>precision, recall, or F1</strong>. Understand the tradeoff viscerally by sliding τ."
        meta={[
          { k: "Read", v: "8 min" },
          { k: "Focus", v: "Confusion · ROC · PR" },
          { k: "Sims", v: "1 live sweep" },
        ]}
      />

      <section className="section">
        <SectionLabel n="06.1">The confusion matrix</SectionLabel>
        <h2 className="h2">
          Four cells. <em>One thousand decisions.</em>
        </h2>
        <p className="prose">
          Every classifier&apos;s output can be broken into four boxes: TP, FP, FN, TN. Every real
          metric, precision, recall, F1, ROC-AUC, is a ratio of these four.
        </p>
        <ThresholdSim />
      </section>

      <section className="section">
        <SectionLabel n="06.2">Picking the right metric</SectionLabel>
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Fraud / cancer:</strong> high cost of FN → prioritize <em>recall</em>.
          </li>
          <li>
            <strong>Spam filtering:</strong> high cost of FP (flagging real mail) → prioritize{" "}
            <em>precision</em>.
          </li>
          <li>
            <strong>Balanced problem:</strong> <em>F1</em> or <em>AUC</em> is fine.
          </li>
          <li>
            <strong>Imbalanced (fraud at 0.1%):</strong> <em>PR-AUC</em> is more honest than
            ROC-AUC.
          </li>
        </ul>
        <AntiPatterns
          items={[
            '<b>Reporting accuracy on imbalanced data.</b> Predict "not fraud" always → 99.9% accuracy, zero utility.',
            "<b>Tuning on F1 but optimizing logloss.</b> Decide the metric upfront.",
            "<b>Default τ=0.5.</b> Threshold should reflect your business cost ratio, not library defaults.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Metric = value judgement.</b> You're saying which mistake is worse.",
          "<b>Threshold is a lever, not a default.</b> Move it.",
          `<b>Calibration ≠ accuracy.</b> A well-calibrated model's 0.7 means 70%, not just "higher than 0.5".`,
        ]}
      />
    </>
  );
}
