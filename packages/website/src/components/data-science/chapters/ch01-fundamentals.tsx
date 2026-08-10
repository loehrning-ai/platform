import {
  Hero,
  SectionLabel,
  AntiPatterns,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { GaltonSim } from "@/components/data-science/simulators/galton-sim";

// ─── Ch01: Fundamentals ─────────────────────────────
//
// Typed port of Ch01_Fundamentals.js. GaltonSim lives in its own file
// (simulators/galton-sim.tsx) per the plan's "own component files"
// requirement for the two named-risk simulators.

export default function Ch01Fundamentals() {
  return (
    <>
      <Hero
        eyebrow="Chapter 01 · Fundamentals"
        title='The data scientist <em>turns noise</em> <span class="accent">into decisions.</span>'
        hook="Before any model, any SQL, any dashboard, there are three ideas. <strong>Sample vs population.</strong> <strong>Signal vs noise.</strong> <strong>Correlation vs causation.</strong> Get these and half the field clicks into place."
        meta={[
          { k: "Read", v: "7 min" },
          { k: "Focus", v: "CLT · sampling · the DS loop" },
          { k: "Sims", v: "1 interactive teaching model" },
        ]}
      />

      <section className="section">
        <SectionLabel n="01.1">Sample vs population</SectionLabel>
        <h2 className="h2">
          A sample is evidence about a population, not the population itself.
        </h2>
        <p className="prose">
          Consider a hypothetical service with <strong>44 million users</strong>{" "}
          and an A/B test containing <strong>180,000</strong> eligible
          observations. A reported 2.3% retention difference estimates a
          population quantity from that sample. Its meaning depends on
          assignment, missing data, measurement, sampling, and statistical
          uncertainty.
        </p>
        <p className="prose">
          Data science often works from <code>samples</code> while making claims
          about <code>populations</code> or future cases. Confidence intervals,
          tests, validation, and experimental design quantify different parts of
          that uncertainty; none repairs a biased sample or an invalid
          measurement.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Move <code>n</code> from 2 to 100. In this independent,
          finite-variance generator, the standard error of the mean scales with{" "}
          <code>1/√n</code> and the sampling distribution approaches a normal
          shape as n grows. The central limit theorem has conditions; heavy
          tails, dependence, small samples, and changing populations can make
          the approximation poor.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="01.2">The DS loop</SectionLabel>
        <h2 className="h2">
          Six recurring stages. <em>The order depends on the problem.</em>
        </h2>
        <p className="prose">
          A useful working loop is
          <strong> Data → Explore → Clean → Feature → Model → Evaluate</strong>,
          then back around. Each chapter covers one stage, plus the meta-skills
          on top, experimentation, causal reasoning, deployment.
        </p>
        <div className="loop-mini">
          {["Data", "Explore", "Clean", "Feature", "Model", "Evaluate"].map(
            (s, i) => (
              <div className="loop-mini-stage" key={s}>
                <div className="loop-mini-n">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="loop-mini-t">{s}</div>
              </div>
            ),
          )}
        </div>
        <AntiPatterns
          items={[
            "<b>Fitting before looking.</b> Running <code>model.fit()</code> on a dataset you haven't <em>plotted</em> is how you ship a model that learned the index column.",
            "<b>Optimizing a number nobody asked for.</b> Great accuracy on the wrong metric is worse than decent accuracy on the right one.",
            '<b>Confusing correlation with causation.</b> "Users who see feature X retain better" does not mean feature X causes retention. It may just mean engaged users see X.',
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>State the target population.</b> Report how sampling, assignment, missingness, and measurement limit the estimate.",
          "<b>The CLT has conditions.</b> For many independent finite-variance settings, sample means become approximately normal as n grows; verify whether that approximation fits.",
          "<b>Use the loop as a control system.</b> Explore, validate, and monitor at the points where new data or transformations can invalidate prior evidence.",
        ]}
      />
    </>
  );
}
