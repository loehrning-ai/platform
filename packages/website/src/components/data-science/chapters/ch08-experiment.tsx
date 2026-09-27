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
        hook="Fix assignment, estimand, primary metric, minimum relevant effect, analysis plan and stopping rule before the first outcome arrives."
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
          and watch the interim estimates. In this one synthetic Bernoulli
          stream the interval can cross zero several times, and a crossing is
          no valid stopping rule. You see sampling variability, not a planned
          production test.
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
            <strong>Minimum relevant effect:</strong> the smallest effect that
            would change a decision; smaller targets need more information, all
            else fixed.
          </li>
          <li>
            <strong>Power:</strong> set the target from the cost of missed
            effects, false positives and data collection, and document the
            assumptions.
          </li>
          <li>
            <strong>Duration and stopping:</strong> cover relevant operating
            cycles and the planned sample, then apply the prespecified
            fixed-horizon or sequential rule.
          </li>
        </ol>
        <AntiPatterns
          items={[
            "<b>Unadjusted optional stopping.</b> Checking a fixed-horizon p-value repeatedly and stopping at the first crossing changes the error rate, by an amount that depends on look schedule and stopping rule (see Chapter 10).",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Sample size scales roughly with 1 / effect².</b> With variance, allocation, α and power fixed, halving the target effect needs about four times the sample.",
          "<b>Intervals and p-values summarize one model.</b> Report effect size and uncertainty; neither repairs a weak design.",
          '<b>Claim only what the interval rules out.</b> "No effect detected" is not "no effect"; compare the interval with the pre-set relevant range.',
        ]}
      />
    </>
  );
}
