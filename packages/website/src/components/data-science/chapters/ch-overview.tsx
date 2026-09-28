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
}

const STAGES: readonly StageCard[] = [
  {
    id: "fund",
    n: "01",
    title: "Fundamentals",
    tag: "sample and population",
    blurb: "Draw samples and watch their means converge.",
  },
  {
    id: "explore",
    n: "02",
    title: "Explore",
    tag: "inspect before modelling",
    blurb: "Inspect distributions, outliers, and correlation structures.",
  },
  {
    id: "clean",
    n: "03",
    title: "Clean",
    tag: "missing values · scaling · leakage",
    blurb: "Impute and scale without smuggling in information from the future.",
  },
  {
    id: "feature",
    n: "04",
    title: "Feature",
    tag: "represent information deliberately",
    blurb: "Encode categories, form interactions, and select features.",
  },
  {
    id: "model",
    n: "05",
    title: "Model",
    tag: "bias and variance",
    blurb: "Fit models, then compare training and test error.",
  },
  {
    id: "eval",
    n: "06",
    title: "Evaluate",
    tag: "defensible metrics",
    blurb: "Work with confusion matrices, ROC, calibration, and thresholds.",
  },
  {
    id: "interp",
    n: "07",
    title: "Interpret",
    tag: "explain model behavior",
    blurb: "Use SHAP, permutation importance, and partial dependence.",
  },
  {
    id: "exp",
    n: "08",
    title: "Experiment",
    tag: "measure effects under control",
    blurb: "Plan A/B tests with power and MDE, then read 10,000 visits.",
  },
  {
    id: "causal",
    n: "09",
    title: "Causal",
    tag: "beyond correlation",
    blurb: "Trace DAGs, confounders, and backdoor paths.",
  },
  {
    id: "peek",
    n: "10",
    title: "Peeking",
    tag: "when p-values mislead",
    blurb: "Run 50 experiments in parallel and watch false positives.",
  },
  {
    id: "deploy",
    n: "11",
    title: "Deploy",
    tag: "models in production",
    blurb: "Monitor drift and retrain when a signal fires.",
  },
  {
    id: "cap",
    n: "12",
    title: "Capstone",
    tag: "the complete cycle",
    blurb: "One fraud dataset from audit to deployment review.",
  },
];

const OUTCOMES = [
  "Inspect a dataset and train without hidden leakage",
  "Read confusion matrices, thresholds and calibration",
  "Plan an A/B test with power, MDE and CUPED",
  "Separate correlation from causation with DAGs",
  "Monitor drift, retrain and prepare rollbacks",
] as const;

const TOOLS = [
  { n: "pandas", r: "dataframes" },
  { n: "scikit-learn", r: "classic ML" },
  { n: "numpy", r: "arrays" },
  { n: "PyTorch", r: "deep learning" },
  { n: "statsmodels", r: "inference + GLMs" },
  { n: "scipy.stats", r: "tests + distributions" },
  { n: "SHAP", r: "interpretability" },
  { n: "Jupyter", r: "notebooks" },
  { n: "MLflow", r: "tracking" },
  { n: "Feast", r: "feature store" },
  { n: "Great Expectations", r: "data quality" },
  { n: "A/B testing platform", r: "experiments" },
] as const;

// Werkzeichnung (design direction 7.4): ink roman headings with no italic
// accent, sentence-case kickers, square geometry, hairline lists and a
// gap-px Swiss grid for the chapters. No glyph icons, coloured dots or
// coloured borders; the hero action is the page's one Mennige element.
export default function ChOverview() {
  return (
    <>
      <section className="ov-hero">
        <div className="ov-hero-copy">
          <p className="ov-hero-eyebrow">Data science course · free</p>
          <h1 className="ov-hero-title">
            Turn data into decisions.
          </h1>
          <p className="ov-hero-hook">
            Twelve chapters along one working loop, each built around a simulation you control.
          </p>
          <div className="ov-hero-cta">
            <Link
              className="btn btn-primary ov-cta-btn"
              href={dsChapterHref("fund", "en")}
              prefetch={false}
            >
              Start chapter 1 &nbsp;→
            </Link>
          </div>
          <div className="ov-hero-stats">
            <div className="ov-stat">
              <div className="k">12</div>
              <div className="v">chapters</div>
            </div>
            <div className="ov-stat">
              <div className="k">37</div>
              <div className="v">live simulations</div>
            </div>
            <div className="ov-stat">
              <div className="k">2 h</div>
              <div className="v">approximate study time</div>
            </div>
          </div>
        </div>
        <div className="ov-hero-sim">
          <LazyFlowingPipeline />
        </div>
      </section>

      <section className="section ov-outcomes-section">
        <div className="ov-section-head">
          <p className="ov-kicker">Outcomes</p>
          <h2 className="ov-h2">What you can do afterwards</h2>
        </div>
        <ul className="ov-outcomes">
          {OUTCOMES.map((outcome) => (
            <li className="ov-outcome" key={outcome}>
              <p className="ov-outcome-t">{outcome}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section ov-curriculum-section">
        <div className="ov-section-head">
          <p className="ov-kicker">The curriculum</p>
          <h2 className="ov-h2">Twelve chapters</h2>
        </div>
        <div className="ov-curriculum">
          {STAGES.map((stage) => (
            <Link
              key={stage.id}
              className="ov-course"
              href={dsChapterHref(stage.id, "en")}
              prefetch={false}
            >
              <div className="ov-course-top">
                <span className="ov-course-n">{stage.n}</span>
              </div>
              <h3 className="ov-course-title">{stage.title}</h3>
              <p className="ov-course-tag">{stage.tag}</p>
              <p className="ov-course-blurb">{stage.blurb}</p>
              <p className="ov-course-cta">
                Open chapter <span aria-hidden="true">→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="ov-section-head ov-sh-tight">
          <p className="ov-kicker">Tools in the course</p>
          <h2 className="ov-h2">Tools used in the course.</h2>
        </div>
        <dl className="ov-tools">
          {TOOLS.map((tool) => (
            <div key={tool.n} className="ov-tool">
              <dt className="ov-tool-n">{tool.n}</dt>
              <dd className="ov-tool-r">{tool.r}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
