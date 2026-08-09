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
          The synthetic example links temperature to both ice-cream sales and
          drowning deaths, creating a positive aggregate association without an
          ice-cream effect. Within its three constructed temperature bands, the
          association is much smaller. Real data need a causal model,
          measurement checks, and uncertainty; stratification alone does not
          prove that all confounding is removed.
        </p>
        <ConfoundingSimulator />
      </section>

      <section className="section">
        <SectionLabel n="09.2">Causal graphs</SectionLabel>
        <h2 className="h2">
          Draw the DAG <em>before</em> the regression.
        </h2>
        <p className="prose">
          A Directed Acyclic Graph (DAG) records assumed causal relations. Nodes
          are variables and arrows are direct-effect assumptions. Given a
          correct graph and an explicit estimand, the structure can identify
          candidate adjustment sets. Data do not verify the arrows by
          themselves, and the four teaching patterns are not an exhaustive
          causal model.
        </p>
        <DAGBuilder />
      </section>

      <section className="section">
        <SectionLabel n="09.3">Classic DAG patterns</SectionLabel>
        <h2 className="h2">Confounder. Collider. Mediator.</h2>
        <p className="prose">
          Confounders, colliders, and mediators require different adjustment
          decisions. Regression software does not infer their causal roles from
          a table; those roles come from the stated graph and domain
          assumptions.
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
          with the change in an untreated control group. Under parallel trends,
          no anticipation, no interference, and stable composition or an
          analysis that accounts for changes, the control trend identifies the
          treated group&apos;s counterfactual change. Similar pre-trends support
          the design but cannot prove the unobserved post-treatment
          counterfactual.
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
          can identify an effect only under strong assumptions. Z must affect X
          (relevance), have no path to Y except through X (exclusion), and be
          independent of unobserved causes of Y (exogeneity). With heterogeneous
          effects, the estimand also depends on monotonicity. These assumptions
          are argued from design and domain knowledge, not established by the
          first stage alone.
        </p>
        <InstrumentalVariable />
      </section>

      <AntiPatterns
        items={[
          "<b>Controlling for a collider under the assumed DAG.</b> This can open a non-causal association between its causes and introduce selection bias.",
          "<b>Controlling for a mediator when estimating the total effect.</b> This blocks part of the pathway; mediation analysis needs a different estimand and additional assumptions.",
          "<b>Regressing on everything.</b> More controls ≠ better estimate. The DAG determines the adjustment set.",
          "<b>Treating the first-stage F-statistic as an IV validity test.</b> Strength does not establish exclusion or exogeneity, and the conventional value 10 is only a context-dependent weak-instrument screen.",
          "<b>Ignoring pre-treatment dynamics in DiD.</b> Plot event-time estimates and investigate composition changes, anticipation, and other shocks before interpreting the design.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Draw the DAG first.</b> On paper, before any code. Share it with domain experts, they'll spot wrong arrows.",
          "<b>Use the backdoor criterion on the assumed graph.</b> Find a sufficient adjustment set and run sensitivity analysis for plausible omitted structure.",
          "<b>Diagnose pre-period behavior for DiD.</b> Divergence is a warning; apparent similarity is not proof of post-treatment parallel trends.",
          "<b>Report first-stage diagnostics and weak-IV-robust inference.</b> An F-statistic above 10 does not validate the instrument, and the relevant diagnostic depends on the design.",
          "<b>Be explicit about which effect you want.</b> Total effect? Direct effect? Local Average Treatment Effect (LATE)?",
        ]}
      />
      <Takeaway
        items={[
          "<b>Draw the DAG before the regression.</b> Use it to expose assumptions and propose an adjustment set; do not treat the graph as evidence that its arrows are correct.",
          `<b>"Controlling for X" is not harmless.</b> It depends entirely on X's structural role.`,
          "<b>Causal inference from observational data requires strong assumptions.</b> State them. Defend them.",
          "<b>Prefer randomization when it is feasible, ethical, and implemented correctly.</b> Otherwise choose the design whose identification assumptions are most defensible and testable.",
        ]}
      />
    </>
  );
}
