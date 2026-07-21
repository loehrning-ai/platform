import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { TrustMeterSim } from "../simulators/trust-meter-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch5_Quality (plan 011 stage 9) ──────────────────────────────────
// Ported from `src/chapters/Ch5_Quality.js`.

const DQ_OPERATOR_PY = `<span class="tok-c"># 1) Write the partition (idempotent, see Ch5)</span>
<span class="tok-f">InsertOverwriteOperator</span>(
    table=<span class="tok-s">"fct_dau"</span>,
    partition=<span class="tok-s">"&lt;DATEID&gt;"</span>,
    sla_tier=<span class="tok-s">"24h"</span>,                          <span class="tok-c"># routes to the right oncall</span>
)

<span class="tok-c"># 2) Gate it: DQ runs, then the signal table lands</span>
<span class="tok-f">ExpectationSuite</span>(
    table=<span class="tok-s">"fct_dau"</span>,
    checks=[
        <span class="tok-f">RowCountBand</span>(band=<span class="tok-n">0.10</span>),           <span class="tok-c"># ±10% vs 7-day median</span>
        <span class="tok-f">SchemaMatch</span>(ref=<span class="tok-s">"fct_dau.contract"</span>),
        <span class="tok-f">Freshness</span>(max_lag=<span class="tok-s">"PT6H"</span>),
        <span class="tok-f">Unique</span>(columns=[<span class="tok-s">"event_id"</span>]),
    ],
    max_rows_expected=<span class="tok-n">500_000_000</span>,
)

<span class="tok-c"># 3) Every downstream waits on the SIGNAL, not the data table.</span>
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
        hook="The hardest failures to catch are the ones that succeed. The task returns zero, writes a tiny partition, lands on time, and the number on the CFO's deck is wrong. Data-quality gates turn &quot;the pipeline ran&quot; into &quot;the number is trustworthy.&quot; That's the contract the rest of the warehouse depends on."
        meta={[
          { k: "Primitive", v: "ExpectationSuite" },
          { k: "Barrier", v: "signal table + ExternalTaskSensor" },
          { k: "Tiers", v: "6h · 24h · 48h SLA" },
        ]}
      />

      <section className="section">
        <SectionLabel n="6.1">Checks are cheap, bugs are expensive</SectionLabel>
        <h2 className="h2">Four checks that catch 80% of data-incident tickets.</h2>
        <p className="prose">
          <b>Row-count band:</b> today&apos;s row count must sit within ±10% of the trailing 7-day median. Catches empty writes, half-writes,
          upstream source outages.
          <br />
          <b>Schema check:</b> no new nullable column, no type drift. Catches producer schema bumps that silently break downstream joins.
          <br />
          <b>Freshness:</b> partition landed before the SLA. Catches slipped pipelines before a dashboard user notices.
          <br />
          <b>Uniqueness:</b> primary-key has no duplicates. Catches idempotency bugs (see Ch5) before they corrupt a fact table.
        </p>
        <TrustMeterSim />
      </section>

      <section className="section">
        <SectionLabel n="6.2">The signal-table barrier</SectionLabel>
        <h2 className="h2">Downstream waits on the signal, never on the data.</h2>
        <p className="prose">
          A DQ check that <em>runs after the data lands</em> but <em>before anyone reads it</em> is the barrier. When the check passes, the
          pipeline writes a tiny row to a <b>signal table</b>. Every downstream consumer uses <code>ExternalTaskSensor</code> to block on that
          signal: not on the data table itself. If the check fails, the signal never lands, downstreams wait, and oncall is auto-paged with an
          SLA-tier-aware ticket.
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
            <div className="ccard-d">Data exists but is invisible until the signal lands. Failures hold the line; oncall wakes up before a consumer hits a bad number.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="6.3">The operator</SectionLabel>
        <CodeBlock title="pipeline.py · ExpectationSuite + ExternalTaskSensor" lang="Python" html={DQ_OPERATOR_PY} />
      </section>

      <AntiPatterns
        items={[
          `<b>"We'll add DQ later."</b> You won't. The pipeline will ship, the first bad day will hit, someone will chase it manually for a week. Add DQ before the first ship, or ship without the pipeline.`,
          "<b>Waiting on the data table instead of the signal table.</b> This is the most common subtle bug in new pipelines. Partial writes look complete. Downstream reads too early. Use ExternalTaskSensor.",
          "<b>No SLA tier tag.</b> A task that slips silently at 04:00 and pages no one until someone notices at 14:00 is not a 6h-SLA task. Tag the tier; oncall routing depends on it.",
          "<b>Catch-all <code>assert len(df) &gt; 0</code>.</b> It passes when the pipeline writes one row on an outage. Use row-count bands, not sanity asserts.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Every fact table</b> gets row-count band + freshness + uniqueness, minimum. Dimension tables add schema-match.",
          "<b>Signal tables are first-class citizens.</b> Name them <code>&lt;table&gt;__signal</code>. They outlive the pipeline: replays, backfills, and audits all read them.",
          "<b>SLA-tier your tasks.</b> 6h for ads/exec-deck inputs, 24h for most facts, 48h for discovery/rollups. The tier is the pager contract.",
          "<b>DQ config in version control, not UI.</b> Checks drift; code reviews catch drift; dashboards don't.",
        ]}
      />
      <Takeaway
        items={[
          "<b>DQ is the contract.</b> It is the difference between data engineering and data plumbing.",
          "<b>Four checks, four bugs avoided.</b> Row-count, schema, freshness, uniqueness. Every fact table. Every day.",
          "<b>Wait on the signal.</b> If you remember one word from this chapter, make it <em>signal</em>.",
        ]}
      />
    </>
  );
}

export default Ch5Quality;
