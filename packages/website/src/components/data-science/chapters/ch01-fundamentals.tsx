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
        hook="Three distinctions come before any model, SQL query or dashboard: <strong>sample vs population</strong>, <strong>signal vs noise</strong> and <strong>correlation vs causation</strong>."
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
          A hypothetical service has <strong>44 million users</strong> and runs
          an A/B test on <strong>180,000</strong> eligible observations. The
          2.3% retention difference estimates a population quantity; its
          meaning depends on assignment, missing data, measurement, sampling
          and uncertainty.
        </p>
        <p className="prose">
          Data science computes on <code>samples</code> and talks about{" "}
          <code>populations</code> or future cases. Intervals, tests,
          validation and experimental design quantify parts of that
          uncertainty; none repairs a biased sample or an invalid measurement.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Push <code>n</code> from 2 to 100. In this independent,
          finite-variance generator the standard error of the mean scales with{" "}
          <code>1/√n</code> and the sampling distribution approaches a normal
          shape. Dependence, heavy tails, small samples and shifting
          populations weaken this central-limit approximation.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="01.2">The DS loop</SectionLabel>
        <h2 className="h2">
          Six recurring stages. <em>The order depends on the problem.</em>
        </h2>
        <p className="prose">
          The loop runs
          <strong> Data → Explore → Clean → Feature → Model → Evaluate</strong>{" "}
          and starts over. Experiments, causal reasoning and operations come
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
            "<b>Fitting before looking.</b> Run <code>model.fit()</code> on data you never <em>plotted</em> and the model can learn the index column.",
            "<b>Optimizing a number nobody asked for.</b> Great accuracy on the wrong metric is worse than decent accuracy on the right one.",
            '<b>Confusing correlation with causation.</b> "Users who see feature X retain better" does not mean X causes retention.',
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Name the target population</b> and how sampling, assignment, missingness and measurement limit the estimate.",
          "<b>Use the loop as a control system.</b> Explore, validate and monitor wherever new data or transformations can invalidate old evidence.",
        ]}
      />
    </>
  );
}
