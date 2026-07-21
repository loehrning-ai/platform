import { Hero, SectionLabel, AntiPatterns, Takeaway } from "@/components/data-science/shared/primitives";
import { ABSim } from "@/components/data-science/simulators/ab-sim";

// ─── Ch08: Experiment (plan 012 stage 9) ───────────────────────────────
//
// Typed port of Ch08_Experiment.js. ABSim lives in its own file
// (simulators/ab-sim.tsx).

export default function Ch08Experiment() {
  return (
    <>
      <Hero
        eyebrow="Chapter 08 · Experiment"
        title='A/B is <em>how</em> you learn. <span class="accent">Power is how</span> fast.'
        hook="Randomize. Pre-declare metric + MDE + sample size. Don't peek. This is the discipline that separates product from vibes."
        meta={[
          { k: "Read", v: "9 min" },
          { k: "Focus", v: "Power · CI · MDE" },
          { k: "Sims", v: "1 live A/B" },
        ]}
      />

      <section className="section">
        <SectionLabel n="08.1">The experiment, live</SectionLabel>
        <h2 className="h2">
          Run the test <em>before</em> you run the test.
        </h2>
        <p className="prose">
          A single A/B run doesn&apos;t tell you much. Move the <em>true lift</em> slider to 0 —
          watch the CI wobble around zero, never resolve. Now set it to +2pp — watch it drift
          upward and the band finally clear zero. <strong>That is what &quot;we need more
          users&quot; means.</strong>
        </p>
        <ABSim />
      </section>

      <section className="section">
        <SectionLabel n="08.2">The four pre-commits</SectionLabel>
        <ol className="prose" style={{ paddingLeft: 20 }}>
          <li>
            <strong>Primary metric</strong> — one number. Declare it. Log it.
          </li>
          <li>
            <strong>MDE</strong> — the smallest lift you care about. Smaller MDE → huge sample
            size.
          </li>
          <li>
            <strong>Power</strong> — 80% is standard. Below 50% and you&apos;re gambling.
          </li>
          <li>
            <strong>Duration</strong> — at least 1 full week for weekly seasonality. 2 is safer.
          </li>
        </ol>
        <AntiPatterns
          items={[
            "<b>Peeking.</b> Checking p-values daily and stopping when significant inflates FPR to ~25% (see Ch 10).",
            "<b>HARKing.</b> Hypothesizing after results are known — slicing until something pops.",
            "<b>Multiple comparisons without correction.</b> 20 independent metrics at α=0.05 → ~64% chance at least one is a false positive.",
          ]}
        />
      </section>

      <Takeaway
        items={[
          "<b>Sample size = (noise / effect)².</b> Halve the MDE → 4× the users.",
          "<b>CIs beat p-values.</b> A 95% CI shows magnitude AND uncertainty at once.",
          '<b>Neutral result is a result.</b> "No detectable effect at our MDE" is useful information.',
        ]}
      />
    </>
  );
}
