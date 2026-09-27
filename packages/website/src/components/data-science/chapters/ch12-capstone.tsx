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
        hook="One public dataset with 284,807 transactions and 492 recorded fraud cases ties together exploration, leakage control, evaluation, threshold policy and deployment review."
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
          The public Credit Card Fraud dataset combines severe class imbalance,
          anonymized inputs and hard evaluation choices. A baseline that calls
          every transaction legitimate hits about{" "}
          <strong>99.83% accuracy</strong> and catches no fraud. PR-AUC
          summarizes ranking under imbalance; the operating threshold also
          needs costs, capacity, calibration and time-aware validation.
        </p>
        <DatasetExplorer />
      </section>

      <section className="section">
        <SectionLabel n="12.2">The pipeline, step by step</SectionLabel>
        <h2 className="h2">
          Six steps, each with a decision from the course.
        </h2>
        <p className="prose">
          The log shows where leakage can enter; scaling before the split is
          the classic mistake. The demo lists scaling first but fits the scaler
          on the training split only, and it validates no real pipeline.
        </p>
        <PipelineProgress />
      </section>

      <AntiPatterns
        items={[
          "<b>Leaving imbalance handling untested.</b> Compare weighting, resampling, thresholding and suitable objectives inside the validation design; no single method is mandatory.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Split before learned preprocessing.</b> Fit transformations on the training partition inside validation, then apply them to held-out data; a scaler fitted on all data leaks test statistics.",
          "<b>Treat scale_pos_weight = N_legit / N_fraud as a candidate.</b> Validate weighting and probability calibration against the decision objective.",
          "<b>Evaluate ranking, calibration and the operating threshold separately.</b> At a 0.17% event rate, accuracy alone looks good for a trivial prediction.",
          "<b>Record each experiment.</b> Store data and code versions, parameters, metrics, artifacts and decision notes in a reproducible tracking system.",
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
          A fraud model scores each transaction, and you set the cutoff. If it
          is too low, reviewers check many legitimate customers at high cost;
          if it is too high, real fraud costs revenue and reputation.
          <strong>
            {" "}
            The cost calculator uses a synthetic cost model; real decisions
            need reviewed domain inputs.
          </strong>
        </p>
        <PrecisionRecallTradeoff />
      </section>

      <section className="section">
        <SectionLabel n="12.4">
          Shipping to production, the checklist
        </SectionLabel>
        <h2 className="h2">
          Before going live, collect evidence for every review area.
        </h2>
        <p className="prose">
          These eight teaching items prompt the review; ticking them does not
          remove a failure mode or approve a deployment.
        </p>
        <PostDeployChecklist />
      </section>

      <AntiPatterns
        items={[
          "<b>No model documentation.</b> Record intended use, exclusions, training and evaluation data, metrics, thresholds, owners, limits and known failure modes; a model card does not prove legal compliance, and legal duties need a separate, system-specific check.",
          "<b>No monitoring contract.</b> Fraud patterns, input quality, label delay and operating costs change; give each signal an owner and a response.",
          "<b>A permanent threshold nobody reviews.</b> Reassess on a documented schedule after major changes in cost, prevalence, calibration, policy or capacity.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Model quality, features, services, data contracts, monitoring, incident response and rollback together determine performance in production.</b>",
        ]}
      />

      <div className="ov-cta-band" style={{ marginTop: 40 }}>
        <div className="ov-cta-eyebrow">You&apos;ve reached the end.</div>
        <div className="ov-cta-title">Go build something.</div>
        <div className="ov-cta-sub">
          Pick a real dataset you care about, run the full loop once, ship a
          v1 and iterate on what you observe.
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
