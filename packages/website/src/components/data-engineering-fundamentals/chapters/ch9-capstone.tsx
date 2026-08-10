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
        hook="The capstone combines six controls from the course in a simulated <code>dim_users</code> pipeline. Each failure mode shows how a plausible output can lose completeness, replay protection, or publication evidence."
        meta={[
          { k: "Dataset", v: "dim_users" },
          { k: "Controls", v: "6 selected course controls" },
          { k: "Consumers", v: "dashboards · notebooks · analysts" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">The living pipeline</SectionLabel>
        <h2 className="h2">Simulated rows move through six selected controls.</h2>
        <p className="prose">
          Each dot represents a simulated user row. The scenario models an additive merge, replay protection, late-data routing, orchestration,
          selected quality checks, and a registered metric. These controls are not an exhaustive production architecture.
        </p>
        <p className="prose">
          Change a control below a stage, observe the modeled rows and signal state, then run the analyst query. Compare the displayed value with
          its source context and check evidence.
        </p>
        <LivingPipeline />
      </section>

      <Takeaway
        items={[
          "A pipeline combines data, execution, quality, access, and serving contracts; these six are a selected teaching set.",
          "A signal distinguishes a completed write from a write that passed the named checks. It does not prove every business value is correct.",
          "A plausible number needs source, cutoff, definition version, and check evidence before a consumer can interpret it.",
          "Trace a failure to the responsible contract and rebuild the affected state instead of masking the downstream symptom.",
        ]}
      />
    </>
  );
}

export default Ch9Capstone;
