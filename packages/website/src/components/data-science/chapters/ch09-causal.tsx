import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "@/components/data-science/shared/primitives";
import { ConfoundingSimulator } from "@/components/data-science/simulators/confounding-simulator";
import { DAGBuilder } from "@/components/data-science/simulators/dag-builder";
import { DAGViewer } from "@/components/data-science/simulators/dag-viewer";
import { DifferenceInDifferences } from "@/components/data-science/simulators/difference-in-differences";
import { InstrumentalVariable } from "@/components/data-science/simulators/instrumental-variable";

// ─── Ch09: Causal ──────────────────────────────────
//
// Typed port of Ch09_Causal.js (833 lines in source, over the 800-line
// cap). All 5 simulators live in their own files under simulators/,
// which is itself the split that keeps this narrative file under the cap.

export default function Ch09Causal() {
  return (
    <>
      <Hero
        eyebrow="Chapter 09 · Causal"
        title='Correlation is a <em>hypothesis.</em><br/>Causation takes <span class="accent">work.</span>'
        hook="When you can't run an experiment, you need causal inference. DAGs, backdoor adjustment, difference-in-differences, instrumental variables. The math is harder; the judgment is harder still."
        meta={[
          { k: "Read", v: "14 min" },
          { k: "Focus", v: "DAGs · DiD · IV" },
          { k: "Sims", v: "4 interactive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="09.1">The lurking variable</SectionLabel>
        <h2 className="h2">
          The correlation that <em>looks</em> causal.
        </h2>
        <p className="prose">
          Ice cream sales and drowning deaths are correlated at r ≈ 0.85, yet nobody believes ice
          cream causes drowning. The driver is temperature: hot weather increases both. Stratify by
          temperature and each group&apos;s correlation collapses toward zero. This is the
          confounder in action.
        </p>
        <ConfoundingSimulator />
      </section>

      <section className="section">
        <SectionLabel n="09.2">Causal graphs</SectionLabel>
        <h2 className="h2">
          Draw the DAG <em>before</em> the regression.
        </h2>
        <p className="prose">
          A Directed Acyclic Graph (DAG) is a causal model. Every node is a variable; every arrow is
          a direct causal claim. The structure tells you which variables to adjust for, and which
          to leave out. The four structural patterns cover almost every mistake you&apos;ll
          encounter.
        </p>
        <DAGBuilder />
      </section>

      <section className="section">
        <SectionLabel n="09.3">Classic DAG patterns</SectionLabel>
        <h2 className="h2">Confounder. Collider. Mediator.</h2>
        <p className="prose">
          Nearly every causal mistake in DS is one of these three. Memorise them. Your regression
          software will never warn you which pattern you&apos;re in.
        </p>
        <DAGViewer />
      </section>

      <section className="section">
        <SectionLabel n="09.4">Quasi-experiments</SectionLabel>
        <h2 className="h2">
          When randomisation is impossible, find the <em>natural experiment.</em>
        </h2>
        <p className="prose">
          Difference-in-Differences (DiD) compares the change in a treated group to the change in an
          untreated control group over the same period. The control&apos;s trend becomes the
          counterfactual for what would have happened to the treated group without treatment. The
          critical assumption: both groups would have followed the same trend in the absence of
          treatment.
        </p>
        <DifferenceInDifferences />
      </section>

      <section className="section">
        <SectionLabel n="09.5">Instrumental variables</SectionLabel>
        <h2 className="h2">
          Find a lever that moves X but <em>nothing else.</em>
        </h2>
        <p className="prose">
          When unmeasured confounders bias OLS, an instrumental variable (IV) can save you. The
          instrument Z must affect X (relevance) without directly affecting Y (exclusion
          restriction) and without being related to the unobserved confounders (exogeneity).
          Angrist and Krueger&apos;s classic: proximity to college as an instrument for years of
          education.
        </p>
        <InstrumentalVariable />
      </section>

      <AntiPatterns
        items={[
          "<b>Controlling for a collider.</b> Opens a fake correlation between its parents, selection bias in disguise.",
          "<b>Controlling for a mediator.</b> Zeros out the very effect you're trying to measure.",
          "<b>Regressing on everything.</b> More controls ≠ better estimate. The DAG determines the adjustment set.",
          "<b>Using a weak instrument.</b> F-stat < 10 means IV estimates inherit OLS bias while adding variance.",
          "<b>Violating parallel trends silently.</b> Always plot the pre-period trends for treatment and control before running DiD.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Draw the DAG first.</b> On paper, before any code. Share it with domain experts, they'll spot wrong arrows.",
          "<b>Use the backdoor criterion.</b> Find the minimal adjustment set that blocks all non-causal paths.",
          "<b>Test pre-period trends for DiD.</b> If control and treated diverge before treatment, the design is invalid.",
          "<b>Always report the first-stage F-stat for IV.</b> Rule of thumb: F > 10 means the instrument is relevant.",
          "<b>Be explicit about which effect you want.</b> Total effect? Direct effect? Local Average Treatment Effect (LATE)?",
        ]}
      />
      <Takeaway
        items={[
          "<b>Draw the DAG before the regression.</b> The DAG tells you what to include, not stepwise selection, not VIF.",
          `<b>"Controlling for X" is not harmless.</b> It depends entirely on X's structural role.`,
          "<b>Causal inference from observational data requires strong assumptions.</b> State them. Defend them.",
          "<b>When in doubt, run an experiment.</b> All quasi-experimental methods are second-best to randomisation.",
        ]}
      />
    </>
  );
}
