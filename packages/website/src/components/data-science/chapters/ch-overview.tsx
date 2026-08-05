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
  { id: "fund", n: "01", title: "Fundamentals", tag: "sample vs population", blurb: "The CLT made physical. Watch the sampling distribution converge.", hue: "#5B3EE8" },
  { id: "explore", n: "02", title: "Explore", tag: "look before you leap", blurb: "Distributions, outliers, correlation mazes.", hue: "#1CA5D9" },
  { id: "clean", n: "03", title: "Clean", tag: "missing · drifting · leaky", blurb: "Impute. Scale. Protect the future from the present.", hue: "#1FAF7E" },
  { id: "feature", n: "04", title: "Feature", tag: "information, engineered", blurb: "Encode, interact, bucket, normalize.", hue: "#6BCF3F" },
  { id: "model", n: "05", title: "Model", tag: "the bias/variance dance", blurb: "Fit, cross-validate, tune, watch train and test separate.", hue: "#E8A031" },
  { id: "eval", n: "06", title: "Evaluate", tag: "the honest number", blurb: "Confusion, ROC, calibration, threshold sliders.", hue: "#F25F3A" },
  { id: "interp", n: "07", title: "Interpret", tag: "ask why", blurb: "SHAP waterfalls, permutation, partial dependence.", hue: "#E8318F" },
  { id: "exp", n: "08", title: "Experiment", tag: "the only proof", blurb: "A/B, power, MDE, watch 10k visitors roll in, live.", hue: "#5B3EE8" },
  { id: "causal", n: "09", title: "Causal", tag: "beyond correlation", blurb: "DAGs, confounders, backdoor paths.", hue: "#1CA5D9" },
  { id: "peek", n: "10", title: "Peeking", tag: "how p-values lie", blurb: "Run 50 experiments in parallel, watch false positives bloom.", hue: "#D83A3A" },
  { id: "deploy", n: "11", title: "Deploy", tag: "alive in production", blurb: "Monitor drift. Retrain on signal, not schedule.", hue: "#1FAF7E" },
  { id: "cap", n: "12", title: "Capstone", tag: "the whole loop", blurb: "Ship one end-to-end. Noise → decision → feedback.", hue: "#E8318F" },
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
  { icon: "◇", t: "Explore any dataset without flailing", d: "Distributions, missingness, correlation maps, a mental checklist for your first 30 minutes with new data." },
  { icon: "○", t: "Train a model that doesn't secretly cheat", d: "Spot leakage. Split honestly. Pick the metric before the algorithm." },
  { icon: "△", t: "Read a confusion matrix like a pro", d: "Threshold slider, precision/recall tradeoff, calibration, class imbalance." },
  { icon: "□", t: "Design an A/B test that holds up", d: "Power, MDE, sample size, novelty effects, SRM checks, CUPED." },
  { icon: "◈", t: "Tell correlation from causation", d: "DAGs, confounders, backdoor paths, when regression adjustment saves you." },
  { icon: "✕", t: "Keep a model alive in production", d: "Drift monitoring, retraining cadence, shadow mode, rollback." },
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
            A data scientist is <em>a person who</em>
            <br />
            <span className="accent">turns noise into decisions.</span>
          </h1>
          <p className="ov-hero-hook">
            Twelve chapters. One animated loop. Built for the graduate who wants to ship real work
           , not memorize equations. Every chapter opens with a
            <strong> simulation you can break</strong>, not a wall of text.
          </p>
          <div className="ov-hero-cta">
            <Link
              className="btn btn-primary ov-cta-btn"
              href={dsChapterHref("fund")}
              prefetch={false}
            >
              Begin &nbsp;→
            </Link>
            <Link
              className="ov-cta-ghost"
              href={dsChapterHref("cap")}
              prefetch={false}
            >
              Or skip to the capstone
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
          <div className="ov-kicker">By the end</div>
          <h2 className="ov-h2">
            You&apos;ll know how to <em>do the work</em>,
            <br />
            not just pass the interview.
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
            Twelve chapters. Build the model.
            <br />
            Then prove it works.
          </h2>
          <p className="ov-lede">
            Half the course is how to build a model. The other half is how to
            <em> know if it worked</em>, the part most courses skip.
          </p>
        </div>
        <div className="ov-curriculum">
          {STAGES.map((s) => (
            <Link
              key={s.id}
              className="ov-course"
              style={{ "--hue": s.hue, "--hue-ink": HUE_INK[s.hue] || s.hue } as CSSProperties}
              href={dsChapterHref(s.id)}
              prefetch={false}
            >
              <div className="ov-course-top">
                <span className="ov-course-n">{s.n}</span>
                <span className="ov-course-dot" style={{ background: s.hue, color: s.hue }} />
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
          <div className="ov-kicker">Tools you&apos;ll see</div>
          <h2 className="ov-h2">
            Standard industry kit.
            <br />
            No proprietary gatekeeping.
          </h2>
          <p className="ov-lede">
            The sims render the <em>behavior</em> of these tools. Muscle memory transfers to
            whichever stack your employer uses.
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

      <section className="ov-cta-band">
        <div className="ov-cta-eyebrow">Ready?</div>
        <div className="ov-cta-title">Chapter 01 opens with a falling-ball sampler.</div>
        <div className="ov-cta-sub">
          Drop a thousand samples through a physical Galton board. Watch the central limit
          theorem emerge from chaos. <em>Seven minutes.</em> Then you&apos;re in.
        </div>
        <div className="ov-cta-row">
          <Link
            className="btn btn-primary ov-cta-btn"
            href={dsChapterHref("fund")}
            prefetch={false}
          >
            Begin with Chapter 01 &nbsp;→
          </Link>
          <Link
            className="ov-cta-ghost"
            href={dsChapterHref("exp")}
            prefetch={false}
          >
            Or jump to Experimentation →
          </Link>
        </div>
      </section>
    </>
  );
}
