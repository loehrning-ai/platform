import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices } from "../primitives";
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
        hook="Each partition combines yesterday's state with today's deltas. One bad partition corrupts every later one until the range is rebuilt."
        meta={[
          { k: "Pattern", v: "state-carrying" },
          { k: "Engine", v: "Spark (FULL OUTER JOIN)" },
          { k: "Used by", v: '<span class="chip">Analytics</span><span class="chip">Reporting</span><span class="chip">Personalization</span>' },
        ]}
      />

      <section className="section">
        <SectionLabel n="3.1">The pattern</SectionLabel>
        <h2 className="h2">Yesterday + today = today&apos;s cumulative.</h2>
        <p className="prose">The additive example joins the prior partition to today&apos;s deltas with a <code>FULL OUTER JOIN</code> and
          <code> COALESCE</code>, so keys from either side survive. Other cumulative models add merge rules, deletions, validity intervals
          or conflict handling.</p>
        <p className="prose">Day 7 rests on day 6, which already carries everything before it. If day 3 is wrong, rebuild from the earliest affected partition onward; a code fix alone rewrites no stored history.</p>
      </section>

      <section className="section">
        <SectionLabel n="3.2">Scrub the week</SectionLabel>
        <h2 className="h2">A bug on Day 3. Caught on Day 4. Backfilled on Day 5.</h2>
        <p className="prose">
          Step through the days. On Day 3 a unit mix-up halves every user&apos;s points, and by Day 5 the drift is in every aggregate.
          <em> Patch &amp; backfill</em> replays the bad days with the corrected logic.
        </p>
        <CumulativeSim />
      </section>

      <section className="section">
        <SectionLabel n="3.3">The query</SectionLabel>
        <CodeBlock title="user_lifetime_points.sql" lang="Spark" html={CUMULATIVE_SQL} />
      </section>

      <AntiPatterns
        items={[
          "<b>Using a left join here.</b> Keys that first appear in today's delta get dropped. Test new, existing and missing keys.",
          "<b>Deploying a fix without rebuilding dependent partitions.</b> Find the earliest affected date and recompute everything after it.",
          "<b>Reading wall-clock time inside a backfill.</b> Pass <code>&lt;DATEID&gt;</code> and other run inputs explicitly so the same input selects the same source range.",
          "<b>Publishing partial state.</b> Use the table format's atomic replace, merge or snapshot so readers never see an incomplete partition.",
        ]}
      />
      <BestPractices
        items={[
          "Version cumulative logic and record which version produced each partition. Rebuild the range whose semantics changed.",
          "Take <b>invariants from the business model</b>. Deletion or retention can lower the row count, so test expected key transitions instead of steady growth.",
        ]}
      />
    </>
  );
}

export default Ch2Store;
