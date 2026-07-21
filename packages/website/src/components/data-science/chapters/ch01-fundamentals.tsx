import { Hero, SectionLabel, AntiPatterns, Takeaway } from "@/components/data-science/shared/primitives";
import { GaltonSim } from "@/components/data-science/simulators/galton-sim";

// ─── Ch01: Fundamentals (plan 012 stage 6) ─────────────────────────────
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
        hook="Before any model, any SQL, any dashboard — there are three ideas. <strong>Sample vs population.</strong> <strong>Signal vs noise.</strong> <strong>Correlation vs causation.</strong> Get these and half the field clicks into place."
        meta={[
          { k: "Read", v: "7 min" },
          { k: "Focus", v: "CLT · sampling · the DS loop" },
          { k: "Sims", v: "1 physics-based · live" },
        ]}
      />

      <section className="section">
        <SectionLabel n="01.1">Sample vs population</SectionLabel>
        <h2 className="h2">
          You never see the truth. <em>You see a shadow of it.</em>
        </h2>
        <p className="prose">
          Your company has <strong>44 million users</strong>. Your A/B test touched{" "}
          <strong>180,000</strong> of them over two weeks. The result you report — &quot;retention
          went up 2.3%&quot; — isn&apos;t a measurement of reality. It&apos;s a <em>guess</em>,
          informed by a sliver of reality, wrapped in uncertainty.
        </p>
        <p className="prose">
          Every data scientist lives in this gap: we work from <code>samples</code>, but we make
          claims about <code>populations</code>. Everything else in this course — confidence
          intervals, p-values, A/B tests, model accuracy — is machinery for honestly quantifying
          how much that gap matters.
        </p>
        <GaltonSim />
        <p className="prose" style={{ marginTop: 22 }}>
          Crank <code>n</code> from 2 to 100. Watch the pink distribution narrow — its spread
          shrinks by
          <code> 1/√n</code>. Switch from <em>bell</em> to <em>skew</em> to <em>bimodal</em>: the{" "}
          <strong>population</strong>can be any ugly shape, yet the <strong>sampling distribution</strong>{" "}
          tracks the violet normal curve. That&apos;s the central limit theorem, and it&apos;s why
          A/B tests work at all.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="01.2">The DS loop</SectionLabel>
        <h2 className="h2">
          Six stages. One feedback loop. <em>No skipping.</em>
        </h2>
        <p className="prose">
          Every serious DS project runs through the same loop:
          <strong> Data → Explore → Clean → Feature → Model → Evaluate</strong>, then back around.
          Each chapter covers one stage, plus the meta-skills on top — experimentation, causal
          reasoning, deployment.
        </p>
        <div className="loop-mini">
          {["Data", "Explore", "Clean", "Feature", "Model", "Evaluate"].map((s, i) => (
            <div className="loop-mini-stage" key={s}>
              <div className="loop-mini-n">{String(i + 1).padStart(2, "0")}</div>
              <div className="loop-mini-t">{s}</div>
            </div>
          ))}
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
          "<b>Sample, not truth.</b> Every number you report is a guess with uncertainty attached. Quantify it.",
          "<b>CLT is a gift.</b> Regardless of ugly populations, sample means trend toward normal. This is why A/B tests work.",
          "<b>The loop is non-negotiable.</b> Skipping explore → leakage. Skipping evaluate → false confidence. Skipping feedback → stale models.",
        ]}
      />
    </>
  );
}
