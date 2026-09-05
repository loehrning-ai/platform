import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
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
        hook="A successful task can still write incomplete, stale, duplicated, or schema-incompatible data. Quality checks record evidence about selected properties. They do not prove that every value or business definition is correct."
        meta={[
          { k: "Primitive", v: "ExpectationSuite" },
          { k: "Barrier", v: "signal table + ExternalTaskSensor" },
          { k: "Targets", v: "defined per dataset" },
        ]}
      />

      <section className="section">
        <SectionLabel n="6.1">Checks are cheap, bugs are expensive</SectionLabel>
        <h2 className="h2">Four checks for distinct failure modes.</h2>
        <p className="prose">
          <b>Row-count band:</b> compare the current partition with a table-specific baseline and threshold. This can detect empty writes,
          partial writes, or upstream changes.
          <br />
          <b>Schema check:</b> compare the observed schema with the versioned contract and its declared compatibility policy.
          <br />
          <b>Freshness:</b> verify the named partition or event-time cutoff against the dataset&apos;s target.
          <br />
          <b>Uniqueness:</b> verify the declared key at the declared grain. Not every fact table has a single-row primary key.
        </p>
        <TrustMeterSim />
      </section>

      <section className="section">
        <SectionLabel n="6.2">The signal-table barrier</SectionLabel>
        <h2 className="h2">Gate configured consumers on a named quality signal.</h2>
        <p className="prose">
          In this reference design, checks run after a partition write, before dependent tasks proceed. Passing the selected checks writes a
          row to a <b>signal table</b>. Consumers explicitly configured with an <code>ExternalTaskSensor</code> can wait on that signal. The data
          table may still be technically readable. Visibility and access controls need separate enforcement, and alert routing has to be
          configured and tested.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Without the barrier</div>
            <div className="ccard-n">Downstream waits on the data table</div>
            <div className="ccard-d">Partial or corrupt data is readable the moment the write commits. A retry is too late: consumers already ran.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">With the barrier</div>
            <div className="ccard-n">Downstream waits on the signal table</div>
            <div className="ccard-d">Configured tasks wait until the selected checks pass. Other readers remain possible unless access is enforced separately.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="6.3">The operator</SectionLabel>
        <CodeBlock title="pipeline.py · ExpectationSuite + ExternalTaskSensor" lang="Python" html={DQ_OPERATOR_PY} />
      </section>

      <AntiPatterns
        items={[
          `<b>Adding checks without a dataset contract.</b> A threshold has no meaning until its grain, baseline, exception policy, and owner are defined.`,
          "<b>Publishing a signal that consumers do not require.</b> Verify dependency wiring; a signal row does not restrict direct table reads.",
          "<b>Declaring a freshness target without alert ownership.</b> Record the target, measurement point, routing path, and expected response.",
          "<b>Using only <code>assert len(df) &gt; 0</code>.</b> One row satisfies it. Add checks that match plausible source and transformation failures.",
        ]}
      />
      <BestPractices
        items={[
          "Select checks from the table&apos;s <b>grain, key, freshness target, source behavior, and consumer risk</b>.",
          "<b>Signal tables are first-class citizens.</b> Name them <code>&lt;table&gt;__signal</code>. They outlive the pipeline: replays, backfills, and audits all read them.",
          "Set freshness and response targets per dataset, with an owner and tested alert route.",
          "<b>DQ config in version control, not UI.</b> Checks drift. Code reviews catch drift. Dashboards don't.",
        ]}
      />
      <Takeaway
        items={[
          "Quality checks provide evidence about named properties; they do not certify the full business meaning of a dataset.",
          "Row-count, schema, freshness, and uniqueness address different risks and require table-specific configuration.",
          "A signal is useful only when it names the checks that passed and dependent consumers are configured to require it.",
        ]}
      />
    </>
  );
}

export default Ch5Quality;
