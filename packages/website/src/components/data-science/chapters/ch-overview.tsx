import type { CSSProperties } from "react";
import Link from "next/link";
import { LazyFlowingPipeline } from "@/components/data-science/lazy-flowing-pipeline";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { DsChapterId } from "@/lib/data-science/types";

// ─── Ch_Overview ────────────────────────────────────
//
// Typed port of Ch_Overview.js. Source's `goTo(id)` callback (passed down
// from App.js's own state) is replaced with semantic links to the real
// course routes (stage 5) instead of source's `current` state.

interface StageCard {
  readonly id: DsChapterId;
  readonly n: string;
  readonly title: string;
  readonly tag: string;
  readonly blurb: string;
  readonly hue: string;
}

const STAGES: readonly StageCard[] = [
  {
    id: "fund",
    n: "01",
    title: "Fundamentals",
    tag: "sample and population",
    blurb: "Generate samples and observe how their means converge.",
    hue: "#5B3EE8",
  },
  {
    id: "explore",
    n: "02",
    title: "Explore",
    tag: "inspect before modelling",
    blurb: "Inspect distributions, outliers, and correlation structures.",
    hue: "#1CA5D9",
  },
  {
    id: "clean",
    n: "03",
    title: "Clean",
    tag: "missing · shifted · leaky",
    blurb: "Impute and scale data without leaking information from the future.",
    hue: "#1FAF7E",
  },
  {
    id: "feature",
    n: "04",
    title: "Feature",
    tag: "represent information deliberately",
    blurb: "Encode categories, form interactions, and select features.",
    hue: "#6BCF3F",
  },
  {
    id: "model",
    n: "05",
    title: "Model",
    tag: "bias and variance",
    blurb: "Fit models and compare training and test error.",
    hue: "#E8A031",
  },
  {
    id: "eval",
    n: "06",
    title: "Evaluate",
    tag: "defensible metrics",
    blurb: "Work with confusion matrices, ROC, calibration, and thresholds.",
    hue: "#F25F3A",
  },
  {
    id: "interp",
    n: "07",
    title: "Interpret",
    tag: "inspect model drivers",
    blurb: "Use SHAP, permutation importance, and partial dependence.",
    hue: "#E8318F",
  },
  {
    id: "exp",
    n: "08",
    title: "Experiment",
    tag: "measure effects under control",
    blurb: "Plan A/B tests, power, and MDE, then analyse 10k visitors.",
    hue: "#5B3EE8",
  },
  {
    id: "causal",
    n: "09",
    title: "Causal",
    tag: "beyond correlation",
    blurb: "DAGs, confounders, backdoor paths.",
    hue: "#1CA5D9",
  },
  {
    id: "peek",
    n: "10",
    title: "Peeking",
    tag: "when p-values mislead",
    blurb: "Run 50 experiments in parallel and observe false positives.",
    hue: "#D83A3A",
  },
  {
    id: "deploy",
    n: "11",
    title: "Deploy",
    tag: "models in production",
    blurb: "Monitor drift and retrain on a signal rather than a schedule.",
    hue: "#1FAF7E",
  },
  {
    id: "cap",
    n: "12",
    title: "Capstone",
    tag: "the complete cycle",
    blurb: "Complete the workflow end to end: noise → decision → feedback.",
    hue: "#E8318F",
  },
];

// AA-readable (>=4.5:1 on cream panel) darkened twin of each bright hue,
// used for small CTA text while the bright hue stays for dots/borders.
const HUE_INK: Record<string, string> = {
  "#5B3EE8": "#4A2FCC",
  "#1CA5D9": "#137A9C",
  "#1FAF7E": "#178060",
  "#6BCF3F": "#447F1C",
  "#E8A031": "#946012",
  "#F25F3A": "#BE4020",
  "#E8318F": "#BE216F",
  "#D83A3A": "#B02A2A",
};

const OUTCOMES = [
  {
    icon: "◇",
    t: "Inspect an unfamiliar dataset systematically",
    d: "Check distributions, missingness, and correlations with a clear first-30-minutes checklist.",
  },
  {
    icon: "○",
    t: "Train a model without hidden leakage",
    d: "Detect leakage, split data correctly, and choose the metric before the algorithm.",
  },
  {
    icon: "△",
    t: "Interpret a confusion matrix correctly",
    d: "Assess thresholds, precision and recall, calibration, and class imbalance.",
  },
  {
    icon: "□",
    t: "Design a defensible A/B test",
    d: "Account for power, MDE, sample size, novelty effects, SRM checks, and CUPED.",
  },
  {
    icon: "◈",
    t: "Distinguish correlation from causation",
    d: "Inspect DAGs, confounders, and backdoor paths, then apply regression deliberately.",
  },
  {
    icon: "✕",
    t: "Operate a model reliably in production",
    d: "Monitor drift, trigger retraining, use shadow mode, and prepare rollbacks.",
  },
] as const;

const TOOLS = [
  { n: "pandas", r: "dataframes" },
  { n: "scikit-learn", r: "classic ML" },
  { n: "numpy", r: "arrays" },
  { n: "PyTorch", r: "deep learning" },
  { n: "statsmodels", r: "inference + GLMs" },
  { n: "scipy.stats", r: "tests + distributions" },
  { n: "SHAP", r: "interpretability" },
  { n: "Jupyter · Hex", r: "notebooks" },
  { n: "MLflow", r: "tracking" },
  { n: "Feast", r: "feature store" },
  { n: "Great Expectations", r: "data quality" },
  { n: "A/B platform", r: "experiments" },
] as const;

export default function ChOverview() {
  return (
    <>
      <section className="ov-hero">
        <div className="ov-hero-copy">
          <div className="ov-hero-eyebrow">Data Science Fundamentals · v8</div>
          <h1 className="ov-hero-title">
            Data Science means
            <br />
            <span className="accent">turning data into decisions.</span>
          </h1>
          <p className="ov-hero-hook">
            Twelve chapters form one connected workflow. Each chapter begins
            with
            <strong> an adjustable simulation</strong> and uses it to explain
            concepts, methods, and limits.
          </p>
          <div className="ov-hero-cta">
            <Link
              className="btn btn-primary ov-cta-btn"
              href={dsChapterHref("fund", "en")}
              prefetch={false}
            >
              Begin &nbsp;→
            </Link>
          </div>
          <div className="ov-hero-stats">
            <div className="ov-stat">
              <div className="k">12</div>
              <div className="v">chapters</div>
            </div>
            <div className="ov-stat">
              <div className="k">22</div>
              <div className="v">live simulations</div>
            </div>
            <div className="ov-stat">
              <div className="k">~2h</div>
              <div className="v">end-to-end</div>
            </div>
          </div>
        </div>
        <div className="ov-hero-sim">
          <LazyFlowingPipeline />
        </div>
      </section>

      <section className="section ov-outcomes-section">
        <div className="ov-section-head">
          <div className="ov-kicker">Outcomes</div>
          <h2 className="ov-h2">
            Apply the methods and inspect
            <br />
            <em> what the evidence supports.</em>
          </h2>
        </div>
        <div className="ov-outcomes">
          {OUTCOMES.map((o, i) => (
            <div className="ov-outcome" key={i}>
              <div className="ov-outcome-icon">{o.icon}</div>
              <div className="ov-outcome-t">{o.t}</div>
              <div className="ov-outcome-d">{o.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section ov-curriculum-section">
        <div className="ov-section-head">
          <div className="ov-kicker">The curriculum</div>
          <h2 className="ov-h2">
            Twelve chapters: build the model,
            <br />
            then test its effect.
          </h2>
          <p className="ov-lede">
            The first half covers model development. The second half tests
            <em> whether the result holds</em>: evaluation, interpretation,
            experiments, and operation.
          </p>
        </div>
        <div className="ov-curriculum">
          {STAGES.map((s) => (
            <Link
              key={s.id}
              className="ov-course"
              style={
                {
                  "--hue": s.hue,
                  "--hue-ink": HUE_INK[s.hue] || s.hue,
                } as CSSProperties
              }
              href={dsChapterHref(s.id, "en")}
              prefetch={false}
            >
              <div className="ov-course-top">
                <span className="ov-course-n">{s.n}</span>
                <span
                  className="ov-course-dot"
                  style={{ background: s.hue, color: s.hue }}
                />
              </div>
              <div className="ov-course-title">{s.title}</div>
              <div className="ov-course-tag">{s.tag}</div>
              <div className="ov-course-blurb">{s.blurb}</div>
              <div className="ov-course-cta">Open chapter &nbsp;→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="ov-section-head ov-sh-tight">
          <div className="ov-kicker">Tools in the course</div>
          <h2 className="ov-h2">
            Common open-source tools
            <br />
            for day-to-day data science.
          </h2>
          <p className="ov-lede">
            The simulations show the <em>behaviour</em> of these tools. The
            concepts can be applied across other technical stacks.
          </p>
        </div>
        <div className="ov-tools">
          {TOOLS.map((t) => (
            <div key={t.n} className="ov-tool">
              <div className="ov-tool-n">{t.n}</div>
              <div className="ov-tool-r">{t.r}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
