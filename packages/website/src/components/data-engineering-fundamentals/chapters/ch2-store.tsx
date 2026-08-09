import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { CumulativeSim } from "../simulators/cumulative-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch2_Store ────────────────────────────────────
// Ported from `src/chapters/Ch2_Store.js`.

export const CUMULATIVE_SQL = `<span class="tok-k">INSERT OVERWRITE TABLE</span> user_lifetime_points <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
<span class="tok-k">SELECT</span>
  <span class="tok-f">COALESCE</span>(y.user_id, t.user_id) <span class="tok-k">AS</span> user_id,
  <span class="tok-f">COALESCE</span>(y.lifetime_pts, <span class="tok-n">0</span>) + <span class="tok-f">COALESCE</span>(t.pts_today, <span class="tok-n">0</span>) <span class="tok-k">AS</span> lifetime_pts
<span class="tok-k">FROM</span> (<span class="tok-k">SELECT</span> * <span class="tok-k">FROM</span> user_lifetime_points <span class="tok-k">WHERE</span> ds = <span class="tok-s">'&lt;DATEID-1&gt;'</span>) y
<span class="tok-k">FULL OUTER JOIN</span> (<span class="tok-k">SELECT</span> * <span class="tok-k">FROM</span> daily_user_points <span class="tok-k">WHERE</span> ds = <span class="tok-s">'&lt;DATEID&gt;'</span>) t
  <span class="tok-k">ON</span> y.user_id = t.user_id;`;

export interface Ch2StoreProps {
  readonly chapter: ChapterMeta;
}

export function Ch2Store({ chapter }: Ch2StoreProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Store: <span class='accent'>cumulative state</span> carries errors forward."
        hook="In this additive example, each partition combines the previous state with the current day's deltas. An error in one partition affects later partitions until the affected range is rebuilt."
        meta={[
          { k: "Pattern", v: "state-carrying" },
          { k: "Engine", v: "Spark (FULL OUTER JOIN)" },
          { k: "Used by", v: '<span class="chip">Analytics</span><span class="chip">Reporting</span><span class="chip">Personalization</span>' },
        ]}
      />

      <section className="section">
        <SectionLabel n="3.1">The pattern</SectionLabel>
        <h2 className="h2">Yesterday + today = today&apos;s cumulative.</h2>
        <p className="prose">
          This additive course example uses a <code>FULL OUTER JOIN</code> between the prior partition and today&apos;s deltas, followed by
          <code> COALESCE</code>. That join preserves keys present on either side. Other cumulative models may require merges, deletions,
          validity intervals, or different conflict rules.
        </p>
        <p className="prose">
          Day 7 depends on day 6, which already contains earlier inputs. If day 3 is wrong, rebuild from the earliest affected partition through
          every dependent partition. A code fix alone does not rewrite stored history.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="3.2">Scrub the week</SectionLabel>
        <h2 className="h2">A bug on Day 3. Caught on Day 4. Backfilled on Day 5.</h2>
        <p className="prose">
          Step through the scrubber below. Day 3 halves every user&apos;s points: a classic unit mix-up. By Day 5 the drift is baked into every
          aggregate. Hit <em>Patch &amp; backfill</em> and watch the bug days replay with the corrected logic.
        </p>
        <CumulativeSim />
      </section>

      <section className="section">
        <SectionLabel n="3.3">The query</SectionLabel>
        <CodeBlock title="user_lifetime_points.sql" lang="Spark" html={CUMULATIVE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Using a left join in this additive pattern.</b> Keys that first appear in today's delta would be omitted. Test new, existing, and missing-key cases.",
          "<b>Deploying a fix without rebuilding dependent partitions.</b> Determine the earliest affected date and recompute the downstream range.",
          "<b>Reading wall-clock time inside a backfill.</b> Pass the logical partition and other run inputs explicitly so the same input selects the same source range.",
          "<b>Publishing partial state.</b> Use the table format's supported atomic replace, merge, or snapshot operation so readers do not observe an incomplete partition.",
        ]}
      />
      <BestPractices
        items={[
          "Pass <code>&lt;DATEID&gt;</code> as the logical partition for this daily model instead of deriving it from the wall clock.",
          "Version cumulative logic and record which version produced each partition. Rebuild the range whose semantics changed.",
          "Define <b>invariants from the business model</b>. Row count may decrease legitimately under deletion or retention, so test expected key transitions rather than assuming monotonic growth.",
        ]}
      />
      <Takeaway
        items={[
          "In this model, cumulative state is <b>prior partition plus current delta</b>. Rebuild every dependent partition after a faulty input or rule.",
          "<code>FULL OUTER JOIN</code> and <code>COALESCE</code> implement the additive example; choose merge semantics from the actual entity lifecycle.",
          "Use an explicit logical date and stable inputs so backfills select the intended source range.",
        ]}
      />
    </>
  );
}

export default Ch2Store;
