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
        hook="Before any model, any SQL query, any dashboard, three distinctions come first. <strong>Sample vs population.</strong> <strong>Signal vs noise.</strong> <strong>Correlation vs causation.</strong> Get those three and the rest falls into place."
        meta={[
          { k: "Read", v: "7 min" },
          { k: "Focus", v: "CLT · sampling · the DS loop" },
          { k: "Sims", v: "1 interactive teaching model" },
        ]}
      />

      <section className="section">
        <SectionLabel n="01.1">Sample vs population</SectionLabel>
        <h2 className="h2">
          A sample is evidence about a population. It is not the population.
        </h2>
        <p className="prose">
          A hypothetical service with <strong>44 million users</strong>, and
          inside it an A/B test with <strong>180,000</strong> eligible
          observations. The reported 2.3% retention difference estimates a
          quantity of the population. What it means depends on assignment,
          missing data, measurement, sampling, and uncertainty.
        </p>
        <p className="prose">
          Data science computes on <code>samples</code> and talks about{" "}
          <code>populations</code> or future cases. Confidence intervals, tests,
          validation, and experimental design quantify different parts of that
          uncertainty. None of them repairs a biased sample or an invalid
          measurement.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Push <code>n</code> from 2 to 100. In this independent,
          finite-variance generator the standard error of the mean scales with{" "}
          <code>1/√n</code>, and the sampling distribution approaches a normal
          shape as n grows. The central limit theorem has conditions.
          Dependence, heavy tails, small samples, and shifting populations
          degrade the approximation.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="01.2">The DS loop</SectionLabel>
        <h2 className="h2">
          Six recurring stages. <em>The order depends on the problem.</em>
        </h2>
        <p className="prose">
          The working loop reads
          <strong> Data → Explore → Clean → Feature → Model → Evaluate</strong>,
          then starts over. Experiments, causal reasoning, and operations come
          later.
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
            "<b>Fitting before looking.</b> Run <code>model.fit()</code> on a dataset you never <em>plotted</em> and you ship a model that learned the index column.",
            "<b>Optimizing a number nobody asked for.</b> Great accuracy on the wrong metric is worse than decent accuracy on the right one.",
            '<b>Confusing correlation with causation.</b> "Users who see feature X retain better" does not mean X causes retention.',
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Name the target population.</b> And how sampling, assignment, missingness, and measurement limit the estimate.",
          "<b>The CLT has conditions.</b> In many independent, finite-variance settings sample means become approximately normal as n grows. Check that the approximation fits.",
          "<b>Use the loop as a control system.</b> Explore, validate, and monitor where new data or transformations can invalidate old evidence.",
        ]}
      />
    </>
  );
}
