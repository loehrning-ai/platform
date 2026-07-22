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
        title="<span class='accent'>Break any one</span> of six contracts. Watch exactly what fails."
        hook="<code>dim_users</code> is live. Six gates are running. Sabotage any one: MERGE drops churned users, dedup stops, watermark closes early. The downstream analyst still gets a number. Just the wrong one. That's why every gate exists."
        meta={[
          { k: "Dataset", v: "dim_users" },
          { k: "Contracts", v: "6 · all load-bearing" },
          { k: "Consumers", v: "dashboards · notebooks · analysts" },
        ]}
      />

      <section className="section">
        <SectionLabel n="10.1">The living pipeline</SectionLabel>
        <h2 className="h2">Rows flow left → right. Every gate is a chapter you read.</h2>
        <p className="prose">
          Each dot is a real user row streaming through <code>dim_users</code>: on-time ones pass through all six gates to the analyst. Churned
          rows (from yesterday) only survive if MERGE uses <code>FULL OUTER</code>. Late rows spill to the side-table <em>only</em> if the
          watermark holds. Duplicate rows get dedupped <em>only</em> if you didn&apos;t disable the guard. Every other contract has a twin failure
          mode.
        </p>
        <p className="prose">
          Click any <b>sabotage button</b> below the stage to break that contract. The break happens live: rows start dropping, stalling, or
          lying. Hit &quot;ask the question&quot; to watch what the analyst gets in return.
        </p>
        <LivingPipeline />
      </section>

      <Takeaway
        items={[
          "<b>A pipeline is six contracts, not one SQL file.</b> Break any one and the whole downstream thesis falls.",
          "<b>Wait on the signal, not the data.</b> The signal table is the gate between <em>written</em> and <em>trusted</em>. Without DQ, it never fires.",
          "<b>Wrong answers look identical to right answers.</b> The MERGE/WRITE/WATERMARK breaks still return a number: just the wrong one. That's why the contracts exist.",
          "<b>Every file in this pipeline is a chapter you read.</b> When one feels confusing, re-open its chapter: don't patch around it.",
        ]}
      />
    </>
  );
}

export default Ch9Capstone;
