import { Hero, SectionLabel, Takeaway } from "../primitives";
import { LivingPipeline } from "../simulators/living-pipeline";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch9_Capstone ─────────────────────────────────
// Ported from `src/chapters/Ch9_Capstone.js`.

export interface Ch9CapstoneProps {
  readonly chapter: ChapterMeta;
}

export function Ch9Capstone({ chapter }: Ch9CapstoneProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Change one of <span class='accent'>six modeled controls</span> and inspect the result."
        hook="Six course controls meet in one simulated <code>dim_users</code> pipeline. Each failure mode shows a plausible output losing completeness, replay protection or publication evidence."
        meta={[
          { k: "Dataset", v: "dim_users" },
          { k: "Controls", v: "6 selected course controls" },
          { k: "Consumers", v: "dashboards · notebooks · analysts" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">The living pipeline</SectionLabel>
        <h2 className="h2">Simulated rows move through six selected controls.</h2>
        <p className="prose">Each dot is a simulated user row. The scenario models an additive merge, replay protection, late-data routing, orchestration, selected quality checks and a registered metric, not a complete production architecture.</p>
        <p className="prose">
          Change a control below a stage, watch the rows and signal state, then run the analyst query and compare the value with its source
          context and check evidence.
        </p>
        <LivingPipeline />
      </section>

      <Takeaway
        items={[
          "A signal separates a completed write from one that passed the named checks.",
          "A plausible number needs source, cutoff, definition version and check evidence before anyone can interpret it.",
          "Trace a failure to the responsible contract and rebuild the affected state instead of masking the symptom downstream.",
        ]}
      />
    </>
  );
}

export default Ch9Capstone;
