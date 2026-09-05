import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
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
        hook="No experiment available? Then causal inference. DAGs, backdoor adjustment, difference-in-differences, instrumental variables. The math is harder, and the judgment is harder still."
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
          The synthetic example ties temperature to ice-cream sales and to
          drowning deaths at once. A positive aggregate association appears,
          with no ice-cream effect anywhere in it. Inside the three constructed
          temperature bands the association shrinks. Real data need a causal
          model, measurement checks, and uncertainty. Stratification alone
          proves no confounding was removed.
        </p>
        <ConfoundingSimulator />
      </section>

      <section className="section">
        <SectionLabel n="09.2">Causal graphs</SectionLabel>
        <h2 className="h2">
          Draw the DAG <em>before</em> the regression.
        </h2>
        <p className="prose">
          A Directed Acyclic Graph (DAG) writes down the causal relations you
          assume. Nodes are variables, arrows are direct-effect assumptions.
          With a correct graph and an explicit estimand, the structure hands you
          candidate adjustment sets. Data verify no arrow on their own, and the
          four teaching patterns are no complete causal model.
        </p>
        <DAGBuilder />
      </section>

      <section className="section">
        <SectionLabel n="09.3">Classic DAG patterns</SectionLabel>
        <h2 className="h2">Confounder. Collider. Mediator.</h2>
        <p className="prose">
          Confounders, colliders, and mediators demand different adjustment
          decisions. Regression software reads no causal role out of a
          table. The roles come from the stated graph and domain assumptions.
        </p>
        <DAGViewer />
      </section>

      <section className="section">
        <SectionLabel n="09.4">Quasi-experiments</SectionLabel>
        <h2 className="h2">
          When randomisation is impossible, find the{" "}
          <em>natural experiment.</em>
        </h2>
        <p className="prose">
          Difference-in-Differences (DiD) compares the change in a treated group
          against the change in an untreated control group. Under parallel
          trends, no anticipation, no interference, and stable composition or an
          analysis that accounts for the changes, the control trend identifies
          the treated group&apos;s counterfactual change. Similar pre-trends
          support the design. They prove nothing about the unobserved
          post-treatment counterfactual.
        </p>
        <DifferenceInDifferences />
      </section>

      <section className="section">
        <SectionLabel n="09.5">Instrumental variables</SectionLabel>
        <h2 className="h2">
          Find a source of variation in X with defensible exclusion and
          exogeneity.
        </h2>
        <p className="prose">
          When unmeasured confounders bias OLS, an instrumental-variable design
          identifies an effect only under strong assumptions. Z has to affect X
          (relevance), reach Y through no path except X (exclusion), and stay
          independent of unobserved causes of Y (exogeneity). With heterogeneous
          effects the estimand rests on monotonicity as well. You argue these
          assumptions from design and domain knowledge. The first stage settles
          none of them.
        </p>
        <InstrumentalVariable />
      </section>

      <AntiPatterns
        items={[
          "<b>Controlling for a collider under the assumed DAG.</b> This can open a non-causal association between its causes and introduce selection bias.",
          "<b>Controlling for a mediator when estimating the total effect.</b> That blocks part of the pathway. Mediation analysis needs a different estimand and further assumptions.",
          "<b>Regressing on everything.</b> More controls ≠ better estimate. The DAG determines the adjustment set.",
          "<b>Treating the first-stage F-statistic as an IV validity test.</b> Strength does not establish exclusion or exogeneity, and the conventional value 10 is only a context-dependent weak-instrument screen.",
          "<b>Ignoring pre-treatment dynamics in DiD.</b> Plot event-time estimates and dig into composition changes, anticipation, and other shocks before you read the design.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Draw the DAG first.</b> On paper, before any code. Share it with domain experts, they'll spot wrong arrows.",
          "<b>Use the backdoor criterion on the assumed graph.</b> Find a sufficient adjustment set and run sensitivity analysis for plausible omitted structure.",
          "<b>Diagnose pre-period behavior for DiD.</b> Divergence is a warning. Apparent similarity is no proof of post-treatment parallel trends.",
          "<b>Report first-stage diagnostics and weak-IV-robust inference.</b> An F-statistic above 10 does not validate the instrument, and the relevant diagnostic depends on the design.",
          "<b>Be explicit about which effect you want.</b> Total effect? Direct effect? Local Average Treatment Effect (LATE)?",
        ]}
      />
      <Takeaway
        items={[
          "<b>Draw the DAG before the regression.</b> Use it to expose assumptions and propose an adjustment set. The graph is no evidence that its own arrows are right.",
          `<b>"Controlling for X" is not harmless.</b> It depends entirely on X's structural role.`,
          "<b>Causal inference from observational data requires strong assumptions.</b> State them. Defend them.",
          "<b>Prefer randomization when it is feasible, ethical, and implemented correctly.</b> Otherwise choose the design whose identification assumptions are most defensible and testable.",
        ]}
      />
    </>
  );
}
