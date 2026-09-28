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
        hook="Peeking, multiple comparisons, optional stopping and covariate adjustment shift error rates, and every correction brings its own assumptions."
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
          Check a fixed-sample A/B test repeatedly and stop at the first
          p&lt;0.05, and the nominal 5% no longer holds for the experiment. The
          real rate depends on look schedule, maximum sample, outcome model and
          dependence between looks.
        </p>
        <PeekingSimulator />
        <AntiPatterns
          items={[
            '<strong>"It was significant yesterday":</strong> the p-value is a random variable, and one dip below the threshold is not a discovery.',
            "<strong>HARKing (Hypothesising After Results are Known):</strong> a pattern found after looking at the data is exploratory and needs confirmation on new data.",
          ]}
        />
        <BestPractices
          items={[
            "<strong>Use a planned sequential design</strong> such as group-sequential boundaries, α-spending or mSPRT, and check its model and stopping assumptions.",
            "<strong>For Bayesian decisions,</strong> fix likelihood, prior, loss and stopping rule in advance; when error control matters, also check frequentist operating characteristics.",
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
          α = 0.05 is 1 − (1 − 0.05)ⁿ, about 64% at n = 20.
        </p>
        <MultipleTesting />
        <AntiPatterns
          items={[
            "<strong>Post-hoc segment fishing:</strong> slicing 20 segments until one looks good is 20 tests.",
          ]}
        />
        <BestPractices
          items={[
            "<strong>Bonferroni correction:</strong> use α/n per test; conservative and simple.",
            "<strong>Benjamini-Hochberg</strong> (FDR): controls the expected share of false discoveries under its dependence conditions.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.3">CUPED</SectionLabel>
        <h2 className="h2">
          Pre-period data lowers the estimator's variance.
        </h2>
        <p className="prose">
          CUPED (Controlled-experiment Using Pre-Experiment Data) uses a
          pre-period covariate X correlated with the outcome Y to build an
          adjusted metric Ŷ. With randomized assignment, a true pre-treatment
          covariate and a correct adjustment, estimator variance drops. The
          point estimate can still move in a finite sample, and the gain
          depends on predictive correlation and implementation.
        </p>
        <CUPEDExplainer />
        <BestPractices
          items={[
            "<strong>Use covariates measured before assignment,</strong> such as a prior value of the outcome or stable pre-period behavior. Post-treatment variables can absorb part of the effect and bias the comparison.",
            "Estimate θ with a procedure that fits the randomization and standard-error calculation; cross-fitting helps with flexible adjustment models.",
            "Report raw and adjusted estimates. A weak or unstable covariate buys little precision, and implementation errors make the result worse.",
          ]}
        />
      </section>

      <section className="section">
        <SectionLabel n="10.4">Statistical Power</SectionLabel>
        <h2 className="h2">Underpowered tests waste time and money.</h2>
        <p className="prose">
          Power = P(reject H₀ | H₁ true). An underpowered study misses real
          effects and still uses up an experiment slot. Calculate power <em>before</em> collection and name the model you
          used.
        </p>
        <PowerCalculator />
        <AntiPatterns
          items={[
            "<strong>Ignoring MDE when setting duration:</strong> a test with 30% power misses a real effect of that size 7 times in 10.",
            '<strong>Reporting underpowered null results</strong> as "no effect found": an underpowered null result does not rule out the effect.',
          ]}
        />
        <BestPractices
          items={[
            "Derive the power target, often 80% or 90%, from the cost of missed effects and the available sample; neither value is universal.",
            "Use historical variance and conversion rate, do not assume a CUPED gain before measuring it, and test sensitivity to drift, attrition, unequal allocation and multiplicity.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Pre-registration separates confirmation from exploration.</b> Record primary metric, analysis, stopping rule and exclusions before anyone sees outcomes; secondary metrics inform but do not decide.",
        ]}
      />
    </>
  );
}
