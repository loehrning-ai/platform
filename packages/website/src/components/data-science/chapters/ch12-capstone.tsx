"use client";

import Link from "next/link";
import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
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
        hook="284,807 transactions. 0.17% fraud. One complete walkthrough, from raw data to a model in production. Every chapter earns its place here."
        meta={[
          { k: "Dataset", v: "Kaggle · 284K transactions" },
          { k: "Target", v: "Fraud · 0.17% base rate" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="12.1">The data, and why it&apos;s hard</SectionLabel>
        <h2 className="h2">284,807 transactions. 492 frauds. An 578:1 class imbalance.</h2>
        <p className="prose">
          The Kaggle Credit Card Fraud dataset is a classic of applied ML, not because it&apos;s clean, but
          because it <em>isn&apos;t</em>. The imbalance is so extreme that the naive baseline (predict everything
          as legitimate) achieves <strong>99.83% accuracy</strong>while catching zero fraud. Accuracy is the
          wrong metric. The right one is PR-AUC.
        </p>
        <DatasetExplorer />
      </section>

      <section className="section">
        <SectionLabel n="12.2">The pipeline, step by step</SectionLabel>
        <h2 className="h2">Six decisions. Each one a chapter in this course.</h2>
        <p className="prose">
          Run each pipeline step in order. The output of one becomes the input of the next. Watch the log.
          Notice where leakage could enter (scaling before the split is the classic mistake, we prevent it
          here).
        </p>
        <PipelineProgress />
      </section>

      <AntiPatterns
        items={[
          "<b>Fitting the scaler on the full dataset.</b> Scaler must be fit on train only, then applied to test. Fitting on all data leaks test statistics into training.",
          "<b>Stratifying after scaling.</b> Split first, scale after. Order matters.",
          "<b>Using accuracy as the metric.</b> On a 0.17% fraud rate, accuracy is meaningless. Use PR-AUC or F1 at a chosen threshold.",
          "<b>Ignoring class_weight / scale_pos_weight.</b> Without reweighting, the model learns to ignore fraud entirely.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Split → Scale → Fit.</b> Never fit a preprocessor before the split.",
          "<b>Use scale_pos_weight = N_legit / N_fraud.</b> Tells XGBoost the relative importance of the minority class.",
          "<b>Optimise PR-AUC, then choose threshold by cost.</b> The curve is the product; the threshold is the business decision.",
          "<b>Log every experiment.</b> MLflow or wandb. You will forget what you tried.",
        ]}
      />

      <section className="section">
        <SectionLabel n="12.3">Precision-recall tradeoff, choose your threshold</SectionLabel>
        <h2 className="h2">The threshold is a business decision, not a ML decision.</h2>
        <p className="prose">
          Every fraud model produces a probability score per transaction. You decide the cutoff. Too low: you
          flag half your legitimate customers as fraudsters (ops cost explodes). Too high: you miss real fraud
          (revenue loss and reputational damage).
          <strong> Use the cost calculator to find your break-even threshold.</strong>
        </p>
        <PrecisionRecallTradeoff />
      </section>

      <section className="section">
        <SectionLabel n="12.4">Shipping to production, the checklist</SectionLabel>
        <h2 className="h2">A model in a notebook is a demo. A model in prod is an engineering system.</h2>
        <p className="prose">
          Before your fraud model touches a single live transaction, eight things must be true. Work through the
          checklist. Each item represents a class of production failure you have explicitly eliminated.
        </p>
        <PostDeployChecklist />
      </section>

      <AntiPatterns
        items={[
          "<b>Skipping shadow mode.</b> The first time you see a model's live distribution should never be in production.",
          "<b>No model card.</b> Without documentation, the next engineer (or regulator) has no idea what the model was designed for.",
          "<b>No drift monitor.</b> Fraud patterns shift, card skimming, online fraud, pandemic spending. Models stale faster than you think.",
          "<b>One threshold forever.</b> Business costs change. Revisit the threshold quarterly at minimum.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Shadow first, always.</b> Two weeks of shadow mode catches training-serving skew before it harms users.",
          "<b>Champion/challenger every sprint.</b> Always have a challenger in shadow. Replace only on measurable lift.",
          "<b>Tie your alert threshold to business cost, not arbitrary quantiles.</b>",
          "<b>Model cards are compliance.</b> EU AI Act Art. 13 requires transparency documentation for high-risk systems.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Imbalance is the rule, not the exception.</b> PR-AUC over accuracy. Always.",
          "<b>The pipeline order is sacrosanct.</b> Split → scale → fit. Leakage is silent, it only shows up in prod.",
          "<b>The threshold is a business decision.</b> Minimise expected cost, not F1.",
          "<b>Production is a system, not a model.</b> Monitoring, rollback, drift alerts, the model is 20% of the work.",
          "<b>The loop never ends.</b> Retrain cadence, new features, new fraud patterns. Ship. Monitor. Iterate.",
        ]}
      />

      <div className="ov-cta-band" style={{ marginTop: 40 }}>
        <div className="ov-cta-eyebrow">You&apos;ve reached the end.</div>
        <div className="ov-cta-title">Go build something.</div>
        <div className="ov-cta-sub">
          Pick one real dataset. Run the full loop. Ship a v1. Come back and iterate. The fastest way to learn
          data science is to <em>do</em> it on a problem you care about.
        </div>
        <div className="ov-cta-row">
          <Link
            className="btn btn-primary ov-cta-btn"
            href={dsChapterHref("home")}
          >
            Back to the overview &nbsp;↺
          </Link>
        </div>
      </div>
    </>
  );
}
