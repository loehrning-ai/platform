import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
import { CUPEDExplainer } from "@/components/data-science/simulators/cuped-explainer";
import { MultipleTesting } from "@/components/data-science/simulators/multiple-testing";
import { PeekingSimulator } from "@/components/data-science/simulators/peeking-simulator";
import { PowerCalculator } from "@/components/data-science/simulators/power-calculator";

// ─── Ch10: Peeking (plan 012 stage 10) ─────────────────────────────────
//
// Typed port of Ch10_Peeking.js. All 4 simulators live in their own
// files under simulators/, which is itself what keeps this narrative
// file well under the 800-line cap.

export default function Ch10Peeking() {
  return (
    <>
      <Hero
        eyebrow="Chapter 10 · Peeking & Experimental Integrity"
        title='How <em>p-values</em> <span class="accent">lie.</span>'
        hook="Peeking. Multiple comparisons. Optional stopping. Variance inflation. The subtle ways significance gets manufactured — and the statistical tools to prevent it."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Peeking · CUPED · Power · MC" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">Peeking &amp; Optional Stopping</SectionLabel>
        <h2 className="h2">Every interim look inflates your false-positive rate.</h2>
        <p className="prose">
          Suppose you run an A/B test and check the p-value each day. If it ever dips below 0.05
          you stop and declare victory. The problem: even when H₀ is <em>exactly true</em>, you
          will find p&lt;0.05 ~22–30% of the time with daily checks over 7 weeks — not the 5% you
          budgeted. This is <strong>optional stopping bias</strong>.
        </p>
        <PeekingSimulator />
        <AntiPatterns
          items={[
            "<strong>Continuous monitoring with naive α</strong> — checking significance every day and stopping at first p&lt;0.05 breaks the Type-I error guarantee.",
            '<strong>"It was significant yesterday"</strong> — the p-value is a random variable; a single dip below threshold is not a discovery.',
            "<strong>HARKing (Hypothesising After Results are Known)</strong> — writing a hypothesis after seeing the data guarantees inflated FPR.",
          ]}
        />
        <BestPractices
          items={[
            "<strong>Pre-register</strong> sample size, primary metric, and test duration before data collection begins.",
            "<strong>Sequential testing</strong> (mSPRT, always-valid p-values) formally allows interim looks with α spending.",
            "<strong>Bayesian A/B testing</strong> with explicit stopping rules is naturally coherent under optional stopping.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.2">Multiple Comparisons</SectionLabel>
        <h2 className="h2">Test 20 metrics. Expect 1 false positive — by construction.</h2>
        <p className="prose">
          The family-wise error rate (FWER) for <em>n</em> independent tests at α = 0.05 is
          1 − (1 − 0.05)ⁿ. At n = 20 that is 64%. Slide the dial below to see how fast this
          compounds.
        </p>
        <MultipleTesting />
        <AntiPatterns
          items={[
            "<strong>Reporting every green metric</strong> without FWER correction turns noise into a press release.",
            "<strong>Post-hoc segmentation fishing</strong> — slicing by 20 segments until one looks good is the same as 20 tests.",
          ]}
        />
        <BestPractices
          items={[
            "<strong>Bonferroni correction</strong>: use α/n per test. Conservative but simple.",
            "<strong>Benjamini-Hochberg</strong> (FDR): less conservative, controls expected proportion of false discoveries.",
            "<strong>Nominate a primary metric</strong> before the test. Secondary metrics inform; they do not decide.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.3">CUPED</SectionLabel>
        <h2 className="h2">Same data, higher power — for free.</h2>
        <p className="prose">
          CUPED (Controlled-experiment Using Pre-Experiment Data) uses a pre-period covariate X
          correlated with the outcome Y to construct an adjusted metric Ŷ with lower variance. The
          point estimate is unbiased and the confidence interval shrinks — you reach significance
          faster or need fewer users. Variance reductions of 20–60% are common.
        </p>
        <CUPEDExplainer />
        <BestPractices
          items={[
            "<strong>Always apply CUPED</strong> when you have pre-period data. It is never harmful.",
            "Good covariates: prior purchase rate, prior visit frequency, account age, prior metric value.",
            "θ is estimated on the <em>combined</em> data (not per arm) to avoid leakage from treatment assignment.",
            "CUPED is compatible with any test statistic — just replace Y with Ŷ.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.4">Statistical Power</SectionLabel>
        <h2 className="h2">Underpowered tests waste time and money.</h2>
        <p className="prose">
          Power = P(reject H₀ | H₁ true). An underpowered study will miss a real effect and waste
          the experiment slot. The minimum detectable effect (MDE) drives everything: halving the
          MDE quadruples the required sample size. Calculate power <em>before</em> you start.
        </p>
        <PowerCalculator />
        <AntiPatterns
          items={[
            "<strong>Running until significant</strong> — equivalent to peeking; confounds effect size and luck.",
            "<strong>Ignoring MDE when setting duration</strong> — a test with 30% power is mostly noise.",
            '<strong>Reporting underpowered null results</strong> as "no effect found" — absence of evidence ≠ evidence of absence.',
          ]}
        />
        <BestPractices
          items={[
            "Target ≥ 80% power (industry standard). 90% for high-stakes decisions.",
            "Use historical variance and conversion rate to size tests ahead of time.",
            "Reduce required n by applying CUPED (lowers σ²) or by increasing α for exploration.",
            "Use a power calculator — not intuition — every time.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Peeking is not harmless curiosity.</b> Each interim look multiplies your false-positive risk. Pre-register or use sequential tests.",
          "<b>Multiple comparisons compound fast.</b> 20 tests at α=0.05 → 64% chance of at least one false positive. Correct with Bonferroni or BH.",
          "<b>CUPED is almost free.</b> Apply it whenever you have pre-period data. Variance drops 20–60% with zero bias cost.",
          "<b>Power first.</b> Calculate minimum sample size before collecting data. Underpowered tests are expensive noise.",
          "<b>The pre-registration contract.</b> Committing to metric, sample size, and duration before seeing data is the single highest-leverage habit in experimentation.",
        ]}
      />
    </>
  );
}
