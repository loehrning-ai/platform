"use client";

import Link from "next/link";
import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { DatasetExplorer } from "@/components/data-science/simulators/dataset-explorer";
import { PipelineProgress } from "@/components/data-science/simulators/pipeline-progress";
import { PrecisionRecallTradeoff } from "@/components/data-science/simulators/precision-recall-tradeoff";
import { PostDeployChecklist } from "@/components/data-science/simulators/post-deploy-checklist";
import { dsChapterHref } from "@/lib/data-science/routes";

// ─── Ch12: Capstone ────────────────────────────────
//
// Typed port of Ch12_Capstone.js. The only chapter in this course whose
// source component destructures and calls `goTo` — its final CTA returns
// to the Overview. Ported via useRouter + dsChapterHref, the same
// navigation-replacement pattern ch-overview.tsx established in stage 7.

export default function Ch12Capstone() {
  return (
    <>
      <Hero
        eyebrow="Chapter 12 · Capstone"
        title='<em>Credit card fraud detection:</em> <span class="accent">the full DS loop.</span>'
        hook="A public dataset: 284,807 transactions, 492 recorded fraud cases. Connect exploration, leakage control, evaluation, threshold policy, and deployment review on it. Never mistake the teaching simulation for a production model."
        meta={[
          { k: "Dataset", v: "Kaggle · 284K transactions" },
          { k: "Target", v: "Fraud · 0.17% base rate" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="12.1">The data, and why it&apos;s hard</SectionLabel>
        <h2 className="h2">
          284,807 transactions. 492 recorded frauds. Roughly 578 legitimate
          cases per fraud case.
        </h2>
        <p className="prose">
          The public Credit Card Fraud dataset is built for studying severe
          class imbalance, anonymized inputs, and evaluation choices. A baseline
          that calls every transaction legitimate hits about{" "}
          <strong>99.83% accuracy</strong> and catches no fraud at all. Accuracy
          alone hides the failure. PR-AUC summarizes ranking quality under
          imbalance, and the operating threshold still needs costs, capacity,
          calibration, and time-aware validation.
        </p>
        <DatasetExplorer />
      </section>

      <section className="section">
        <SectionLabel n="12.2">The pipeline, step by step</SectionLabel>
        <h2 className="h2">
          Six decisions. Each one a chapter in this course.
        </h2>
        <p className="prose">
          Run each pipeline step in order. The output of one is the input of
          the next. Watch the log. Notice where leakage could enter: scaling
          before the split is the classic mistake, and this local sequence
          blocks that error while validating no real pipeline.
        </p>
        <PipelineProgress />
      </section>

      <AntiPatterns
        items={[
          "<b>Fitting the scaler on the full dataset.</b> Scaler must be fit on train only, then applied to test. Fitting on all data leaks test statistics into training.",
          "<b>Stratifying after scaling.</b> Split first, scale after. Order matters.",
          "<b>Using accuracy alone.</b> At a 0.17% event rate, the trivial majority prediction looks accurate. Add ranking, calibration, threshold, and cost-sensitive evaluation.",
          "<b>Leaving imbalance handling untested.</b> Compare weighting, resampling, thresholding, and suitable objectives inside the validation design. No single method is mandatory.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Split before learned preprocessing.</b> Fit transformations on the training partition inside the validation procedure, then apply them to held-out data.",
          "<b>Treat scale_pos_weight = N_legit / N_fraud as a candidate, not a rule.</b> Validate weighting and probability calibration against the decision objective.",
          "<b>Evaluate ranking, calibration, and the operating threshold separately.</b> Choose the threshold from explicit error costs and operational capacity.",
          "<b>Record each experiment.</b> Store data and code versions, parameters, metrics, artifacts, and decision notes in a reproducible tracking system.",
        ]}
      />

      <section className="section">
        <SectionLabel n="12.3">
          Precision-recall tradeoff, choose your threshold
        </SectionLabel>
        <h2 className="h2">
          The threshold is a joint statistical, operational, and policy
          decision.
        </h2>
        <p className="prose">
          Every fraud model produces a probability score per transaction. You
          decide the cutoff. Too low and you flag half your legitimate customers
          as fraudsters, and the ops cost explodes. Too high and you miss real
          fraud, which costs revenue and reputation.
          <strong>
            {" "}
            Use the cost calculator on this synthetic cost model, then replace
            its assumptions with reviewed domain inputs.
          </strong>
        </p>
        <PrecisionRecallTradeoff />
      </section>

      <section className="section">
        <SectionLabel n="12.4">
          Shipping to production, the checklist
        </SectionLabel>
        <h2 className="h2">
          A model in a notebook is a demo. A model in prod is an engineering
          system.
        </h2>
        <p className="prose">
          Before a fraud model touches a live transaction, collect evidence for
          every relevant review area. This eight-item teaching checklist
          prompts that review. Ticking it in the browser removes no failure mode
          and approves no deployment.
        </p>
        <PostDeployChecklist />
      </section>

      <AntiPatterns
        items={[
          "<b>No representative pre-promotion evidence.</b> Use replay, batch evaluation, shadowing, or staged exposure according to risk and data constraints.",
          "<b>No model documentation.</b> Record intended use, exclusions, training and evaluation data, metrics, thresholds, owners, limitations, and known failure modes.",
          "<b>No monitoring contract.</b> Fraud patterns, input quality, label delay, and operating costs all change. Wire each monitored signal to an owner and a response.",
          "<b>An unreviewed permanent threshold.</b> Reassess after material cost, prevalence, calibration, policy, or capacity changes on a documented cadence.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Choose rollout evidence from risk.</b> Define representative traffic, observation length, delayed labels, guardrails, and abort behavior instead of using a fixed shadow period.",
          "<b>Promote immutable candidates against a written contract.</b> Require uncertainty-aware outcome metrics and safety guardrails, not a fixed sprint ritual.",
          "<b>Calibrate alerts to business and user impact.</b> Quantiles and drift statistics are inputs, not self-justifying action thresholds.",
          "<b>Use model cards as documentation, not proof of compliance.</b> Applicable legal and governance duties require a separate system-specific assessment.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Class imbalance changes what a metric reveals.</b> Report the base rate, and evaluate ranking, calibration, and threshold behavior next to accuracy.",
          "<b>Learned preprocessing belongs inside validation.</b> Leakage inflates offline results. Provenance and time-aware tests expose it before release.",
          "<b>The threshold encodes consequences.</b> Select it from explicit costs, capacity, policy, and calibrated probabilities, then monitor it.",
          "<b>Production performance is system behavior.</b> Model quality, features, services, data contracts, monitoring, incident response, and rollback all contribute.",
          "<b>Re-evaluate after material change.</b> New data, fraud patterns, costs, policy, and infrastructure can invalidate the previous decision.",
        ]}
      />

      <div className="ov-cta-band" style={{ marginTop: 40 }}>
        <div className="ov-cta-eyebrow">You&apos;ve reached the end.</div>
        <div className="ov-cta-title">Go build something.</div>
        <div className="ov-cta-sub">
          Pick one real dataset. Run the full loop. Ship a v1. Come back and
          iterate. The fastest way to learn data science is to <em>do</em> it on
          a problem you care about.
        </div>
        <div className="ov-cta-row">
          <Link
            className="btn btn-primary ov-cta-btn"
            href={dsChapterHref("home", "en")}
          >
            Back to the overview &nbsp;↺
          </Link>
        </div>
      </div>
    </>
  );
}
