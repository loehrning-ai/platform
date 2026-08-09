import {
  Hero,
  SectionLabel,
  AntiPatterns,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { ABSim } from "@/components/data-science/simulators/ab-sim";

// ─── Ch08: Experiment ───────────────────────────────
//
// Typed port of Ch08_Experiment.js. ABSim lives in its own file
// (simulators/ab-sim.tsx).

export default function Ch08Experiment() {
  return (
    <>
      <Hero
        eyebrow="Chapter 08 · Experiment"
        title='Design the experiment <em>before</em> collecting data. <span class="accent">Interpret it</span> against that design.'
        hook="Define the assignment, estimand, primary metric, minimum relevant effect, analysis plan, and stopping rule before outcomes are available."
        meta={[
          { k: "Read", v: "9 min" },
          { k: "Focus", v: "Power · CI · MDE" },
          { k: "Models", v: "1 synthetic A/B" },
        ]}
      />

      <section className="section">
        <SectionLabel n="08.1">A synthetic experiment stream</SectionLabel>
        <h2 className="h2">
          Run the test <em>before</em> you run the test.
        </h2>
        <p className="prose">
          Move the data-generating lift between zero and +2 percentage points
          and compare repeated interim estimates. This is one synthetic
          Bernoulli stream: its interval can cross and recross zero, and a
          crossing at an interim look is not a valid stopping rule. The exercise
          shows sampling variability, not the result of a planned production
          test.
        </p>
        <ABSim />
      </section>

      <section className="section">
        <SectionLabel n="08.2">The four pre-commits</SectionLabel>
        <ol className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Primary estimand and metric:</strong> define the population,
            outcome window, unit of analysis, and contrast.
          </li>
          <li>
            <strong>Minimum relevant effect:</strong> choose the smallest effect
            that would change a decision. Smaller targets require more
            information under otherwise fixed inputs.
          </li>
          <li>
            <strong>Power:</strong> choose a target from the costs of missed
            effects, false positives, and sample acquisition; report the
            assumptions used in the calculation.
          </li>
          <li>
            <strong>Duration and stopping:</strong> cover relevant operating
            cycles and the planned sample, then apply the prespecified
            fixed-horizon or sequential rule.
          </li>
        </ol>
        <AntiPatterns
          items={[
            "<b>Unadjusted optional stopping.</b> Repeatedly checking a fixed-horizon p-value and stopping at the first crossing changes its error rate; the amount depends on the look schedule and stopping rule. See Chapter 10.",
            "<b>HARKing.</b> Hypothesizing after results are known, slicing until something pops.",
            "<b>Multiple comparisons without correction.</b> For 20 independent, valid null p-values at α=0.05, the chance of at least one false positive is 1 − 0.95²⁰ ≈ 64%. Dependence changes that calculation.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Sample size often scales approximately with 1 / effect².</b> Under fixed variance, allocation, α, and power inputs, halving the target effect requires about four times the sample.",
          "<b>Intervals and p-values answer different summaries of the same model.</b> Report effect magnitude and uncertainty; neither repairs a weak design.",
          '<b>State what the data exclude.</b> "No effect detected" is not "no effect"; compare the interval with the prespecified relevant-effect range.',
        ]}
      />
    </>
  );
}
