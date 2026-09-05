import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { CUPEDExplainer } from "@/components/data-science/simulators/cuped-explainer";
import { MultipleTesting } from "@/components/data-science/simulators/multiple-testing";
import { PeekingSimulator } from "@/components/data-science/simulators/peeking-simulator";
import { PowerCalculator } from "@/components/data-science/simulators/power-calculator";

// ─── Ch10: Peeking ─────────────────────────────────
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
        hook="Peeking, multiple comparisons, optional stopping, covariate adjustment. Unplanned analysis moves your error rates, and every correction carries its own assumptions."
        meta={[
          { k: "Read", v: "12 min" },
          { k: "Focus", v: "Peeking · CUPED · Power · MC" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">Peeking &amp; Optional Stopping</SectionLabel>
        <h2 className="h2">
          Repeated unadjusted looks can inflate the false-positive rate.
        </h2>
        <p className="prose">
          Check a fixed-sample A/B test repeatedly, stop at the first
          p&lt;0.05. The nominal 5% threshold now controls nothing at the
          experiment level. The real rate follows the look schedule, maximum
          sample size, outcome model, and dependence between looks. The
          simulator estimates one configured design. It is no universal peeking
          rate.
        </p>
        <PeekingSimulator />
        <AntiPatterns
          items={[
            "<strong>Continuous monitoring with fixed-sample α:</strong> checking repeatedly and stopping at the first p&lt;0.05 invalidates the fixed-sample error calibration.",
            '<strong>"It was significant yesterday"</strong>, the p-value is a random variable. One dip below the threshold is no discovery.',
            "<strong>HARKing (Hypothesising After Results are Known):</strong> a pattern discovered after looking at the data is exploratory and needs confirmation on new data.",
          ]}
        />
        <BestPractices
          items={[
            "<strong>Pre-register</strong> sample size, primary metric, and test duration before data collection begins.",
            "<strong>Use a planned sequential design</strong>, such as group-sequential boundaries, α-spending, or an mSPRT, and check that its model and stopping assumptions fit the experiment.",
            "<strong>For Bayesian decisions</strong>, predefine the likelihood, prior, loss, and stopping rule; then inspect frequentist operating characteristics when error control matters.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.2">Multiple Comparisons</SectionLabel>
        <h2 className="h2">
          Twenty valid null tests yield one false positive in expectation at
          α=0.05.
        </h2>
        <p className="prose">
          The family-wise error rate (FWER) for <em>n</em> independent tests at
          α = 0.05 is 1 − (1 − 0.05)ⁿ. At n = 20 that is about 64%. The formula
          assumes independent tests with valid null p-values. Dependence moves
          the family-wise rate.
        </p>
        <MultipleTesting />
        <AntiPatterns
          items={[
            "<strong>Reporting every green metric</strong> without FWER correction turns noise into a press release.",
            "<strong>Post-hoc segmentation fishing</strong>, slicing by 20 segments until one looks good is the same as 20 tests.",
          ]}
        />
        <BestPractices
          items={[
            "<strong>Bonferroni correction</strong>: use α/n per test. Conservative but simple.",
            "<strong>Benjamini-Hochberg</strong> (FDR): controls the expected false-discovery proportion under its dependence conditions.",
            "<strong>Nominate a primary metric</strong> before the test. Secondary metrics inform; they do not decide.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.3">CUPED</SectionLabel>
        <h2 className="h2">
          Pre-period information can reduce variance when the assumptions hold.
        </h2>
        <p className="prose">
          CUPED (Controlled-experiment Using Pre-Experiment Data) takes a
          pre-period covariate X correlated with the outcome Y and builds an
          adjusted metric Ŷ. Given randomized assignment, a genuinely
          pre-treatment covariate, and a correctly estimated adjustment, that
          reduces estimator variance. The finite-sample point estimate still
          moves, and the size of the gain follows the predictive correlation and
          the implementation.
        </p>
        <CUPEDExplainer />
        <BestPractices
          items={[
            "<strong>Use covariates measured before assignment.</strong> Post-treatment variables can absorb part of the treatment effect and bias the comparison.",
            "Candidate covariates include a prior value of the outcome or stable pre-period behavior measured consistently for both groups.",
            "Estimate θ with a procedure compatible with the randomization and standard-error calculation; cross-fitting can help when the adjustment model is flexible.",
            "Report raw and adjusted estimates. A weak or unstable covariate buys little precision, and an implementation error makes the result worse.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.4">Statistical Power</SectionLabel>
        <h2 className="h2">Underpowered tests waste time and money.</h2>
        <p className="prose">
          Power = P(reject H₀ | H₁ true). An underpowered study misses a real
          effect and burns the experiment slot. The minimum detectable effect
          (MDE) drives the rest: halve the MDE and the required sample size
          roughly quadruples in common two-arm approximations, with variance, α,
          power, and allocation fixed. Calculate power <em>before</em>{" "}
          collection, and say which model the calculation came from.
        </p>
        <PowerCalculator />
        <AntiPatterns
          items={[
            "<strong>Running until significant</strong>, equivalent to peeking; confounds effect size and luck.",
            "<strong>Ignoring MDE when setting duration</strong>, a test with 30% power is mostly noise.",
            '<strong>Reporting underpowered null results</strong> as "no effect found", absence of evidence ≠ evidence of absence.',
          ]}
        />
        <BestPractices
          items={[
            "Choose a power target, often 80% or 90%, from the cost of missed effects and available sample; neither value is universal.",
            "Use historical variance and conversion rate, then test sensitivity to drift, attrition, unequal allocation, and multiplicity.",
            "A validated pre-treatment adjustment can reduce required n by lowering variance; do not assume the gain before measuring it.",
            "Use a calculator that matches the outcome, allocation, test, and analysis plan.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Unplanned stopping changes the test.</b> Stick to the fixed plan, or use a sequential method built for interim looks.",
          "<b>Multiplicity requires an error target.</b> Bonferroni controls family-wise error; BH targets false discovery rate under stated conditions.",
          "<b>CUPED is conditional, not automatic.</b> Verify timing, assignment independence, predictive value, and standard errors, then report raw and adjusted results.",
          "<b>Power is a design calculation.</b> State the effect, variance, allocation, α, test, attrition, and multiplicity assumptions.",
          "<b>Pre-registration separates confirmation from exploration.</b> Record the primary metric, analysis, stopping rule, and exclusions before anyone looks at outcomes.",
        ]}
      />
    </>
  );
}
