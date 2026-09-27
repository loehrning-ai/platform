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
        hook="Without an experiment, causal claims rest on DAGs, backdoor adjustment, difference-in-differences and instrumental variables, and on your judgment about their assumptions."
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
          In the synthetic example, temperature drives both ice-cream sales and
          drowning deaths, so a positive association appears although ice cream
          has no effect. Inside the three temperature bands it shrinks. Real
          data need a causal model, measurement checks and uncertainty;
          stratification alone does not prove all confounding is gone.
        </p>
        <ConfoundingSimulator />
      </section>

      <section className="section">
        <SectionLabel n="09.2">Causal graphs</SectionLabel>
        <h2 className="h2">
          Draw the DAG <em>before</em> the regression.
        </h2>
        <p className="prose">
          A Directed Acyclic Graph (DAG) records the causal relations you
          assume: nodes are variables, arrows are direct-effect assumptions.
          With a correct graph and an explicit estimand, it yields candidate
          adjustment sets. Data alone verify no arrow, and four teaching
          patterns are no complete causal model.
        </p>
        <DAGBuilder />
      </section>

      <section className="section">
        <SectionLabel n="09.3">Classic DAG patterns</SectionLabel>
        <h2 className="h2">Confounder. Collider. Mediator.</h2>
        <p className="prose">
          Confounders, colliders and mediators need different adjustment
          decisions. No software reads a causal role from a table; the roles
          come from the stated graph and domain assumptions.
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
          Difference-in-Differences (DiD) compares the change in a treated
          group with the change in an untreated control group. Under parallel
          trends, no anticipation, no interference and stable composition, the
          control trend gives the treated group&apos;s counterfactual change.
          Similar pre-trends support the design but prove nothing about the
          unobserved post-treatment trend.
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
          identifies an effect only under strong assumptions: Z affects X
          (relevance), reaches Y only through X (exclusion) and is independent
          of unobserved causes of Y (exogeneity). Heterogeneous effects also
          need monotonicity. You argue these from design and domain knowledge;
          the first stage settles relevance at most.
        </p>
        <InstrumentalVariable />
      </section>

      <AntiPatterns
        items={[
          "<b>Regressing on everything.</b> More controls ≠ better estimate; the DAG sets the adjustment set.",
          "<b>Treating the first-stage F-statistic as an IV validity test.</b> Strength shows neither exclusion nor exogeneity, and the value 10 is only a context-dependent weak-instrument screen. Report weak-IV-robust inference.",
          "<b>Ignoring pre-treatment dynamics in DiD.</b> Plot event-time estimates and check composition changes, anticipation and other shocks first.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Draw the DAG first,</b> before any code, and show it to domain experts; they spot wrong arrows.",
          "<b>Use the backdoor criterion on the assumed graph.</b> Find a sufficient adjustment set and test plausible omitted structure with sensitivity analysis.",
          "<b>Be explicit about which effect you want.</b> Total effect? Direct effect? Local Average Treatment Effect (LATE)?",
        ]}
      />
      <Takeaway
        items={[
          "<b>Causal inference from observational data needs strong assumptions.</b> Write them down and defend them.",
          "<b>Prefer randomization when it is feasible, ethical and done correctly.</b> Otherwise pick the design with the most defensible and testable identification assumptions.",
        ]}
      />
    </>
  );
}
