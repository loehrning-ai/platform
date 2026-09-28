import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../primitives";
import { TrustMeterSim } from "../simulators/trust-meter-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch5_Quality ──────────────────────────────────
// Ported from `src/chapters/Ch5_Quality.js`.

export const DQ_OPERATOR_PY = `<span class="tok-c"># 1) Write the partition (idempotency depends on stable inputs and sink semantics)</span>
<span class="tok-f">InsertOverwriteOperator</span>(
    table=<span class="tok-s">"fct_dau"</span>,
    partition=<span class="tok-s">"&lt;DATEID&gt;"</span>,
    sla_tier=<span class="tok-s">"24h"</span>,                          <span class="tok-c"># routes to the right oncall</span>
)

<span class="tok-c"># 2) Gate it: DQ runs, then the signal table lands</span>
<span class="tok-f">ExpectationSuite</span>(
    table=<span class="tok-s">"fct_dau"</span>,
    checks=[
        <span class="tok-f">RowCountBand</span>(band=<span class="tok-n">0.10</span>),           <span class="tok-c"># illustrative threshold; calibrate per table</span>
        <span class="tok-f">SchemaMatch</span>(ref=<span class="tok-s">"fct_dau.contract"</span>),
        <span class="tok-f">Freshness</span>(max_lag=<span class="tok-s">"PT6H"</span>),
        <span class="tok-f">Unique</span>(columns=[<span class="tok-s">"event_id"</span>]),
    ],
    max_rows_expected=<span class="tok-n">500_000_000</span>,
)

<span class="tok-c"># 3) Configured downstream tasks wait on the named signal.</span>
<span class="tok-f">ExternalTaskSensor</span>(
    signal_table=<span class="tok-s">"fct_dau__signal"</span>,
    partition=<span class="tok-s">"&lt;DATEID&gt;"</span>,
)`;

export interface Ch5QualityProps {
  readonly chapter: ChapterMeta;
}

export function Ch5Quality({ chapter }: Ch5QualityProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Quality: a pipeline that <span class='accent'>ran</span> is not a pipeline that's <span class='accent'>right</span>."
        hook="A successful task can still write incomplete, stale, duplicated or schema-incompatible data. Each check shows whether one named property holds. Passing checks does not prove every value is correct."
        meta={[
          { k: "Primitive", v: "ExpectationSuite" },
          { k: "Barrier", v: "signal table + ExternalTaskSensor" },
          { k: "Targets", v: "defined per dataset" },
        ]}
      />

      <section className="section">
        <SectionLabel n="6.1">The core checks</SectionLabel>
        <h2 className="h2">Each check catches a different failure.</h2>
        <ul className="prose">
          <li>
            <b>Row-count band:</b> compare the partition with a table-specific baseline and threshold to catch empty or partial writes and
            upstream changes.
          </li>
          <li>
            <b>Schema check:</b> compare the observed schema with the versioned contract and its compatibility policy.
          </li>
          <li>
            <b>Freshness:</b> check the named partition or event-time cutoff against the dataset&apos;s target.
          </li>
          <li>
            <b>Uniqueness:</b> check the declared key at the declared grain. Not every fact table has a single-row primary key.
          </li>
        </ul>
        <TrustMeterSim />
      </section>

      <section className="section">
        <SectionLabel n="6.2">The signal-table barrier</SectionLabel>
        <h2 className="h2">Gate configured consumers on a named quality signal.</h2>
        <p className="prose">
          Here, checks run after a partition write and before dependent tasks. If they pass, a row lands in a <b>signal table</b>, and consumers
          with an <code>ExternalTaskSensor</code> wait on it. The data table stays readable, so access control needs separate enforcement, and
          alert routing must be configured and tested.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Without the barrier</div>
            <div className="ccard-n">Downstream waits on the data table</div>
            <div className="ccard-d">Partial or corrupt data is readable once the write commits. A retry comes after consumers already ran.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">With the barrier</div>
            <div className="ccard-n">Downstream waits on the signal table</div>
            <div className="ccard-d">Configured tasks wait until the checks pass. Other readers still get through without separate access control.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="6.3">The operator</SectionLabel>
        <CodeBlock title="pipeline.py · ExpectationSuite + ExternalTaskSensor" lang="Python" html={DQ_OPERATOR_PY} />
      </section>

      <AntiPatterns
        items={[
          `<b>Adding checks without a dataset contract.</b> A threshold needs grain, baseline, exception policy and owner.`,
          "<b>Publishing a signal that consumers do not require.</b> Check the dependency wiring; a signal row does not block direct table reads.",
          "<b>Declaring a freshness target without alert ownership.</b> Record target, measurement point, routing and expected response.",
          "<b>Using only <code>assert len(df) &gt; 0</code>.</b> One row passes it, even after a source outage. Use row-count bands and checks that match likely failures.",
        ]}
      />
      <BestPractices
        items={[
          "Select checks from the table&apos;s <b>grain, key, freshness target, source behavior and consumer risk</b>.",
          "<b>Treat signal tables as lasting interfaces.</b> Name them <code>&lt;table&gt;__signal</code>; replays, backfills and audits read them.",
          "<b>Keep DQ config in version control.</b> Changes get reviewed like code; a rule kept only in a UI drifts unnoticed.",
        ]}
      />
    </>
  );
}

export default Ch5Quality;
