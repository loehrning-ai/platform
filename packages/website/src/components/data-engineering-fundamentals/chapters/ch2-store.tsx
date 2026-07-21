import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { CumulativeSim } from "../simulators/cumulative-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch2_Store ────────────────────────────────────
// Ported from `src/chapters/Ch2_Store.js`.

const CUMULATIVE_SQL = `<span class="tok-k">INSERT OVERWRITE TABLE</span> user_lifetime_points <span class="tok-k">PARTITION</span> (ds=<span class="tok-s">'&lt;DATEID&gt;'</span>)
<span class="tok-k">SELECT</span>
  <span class="tok-f">COALESCE</span>(y.user_id, t.user_id) <span class="tok-k">AS</span> user_id,
  <span class="tok-f">COALESCE</span>(y.lifetime_pts, <span class="tok-n">0</span>) + <span class="tok-f">COALESCE</span>(t.pts_today, <span class="tok-n">0</span>) <span class="tok-k">AS</span> lifetime_pts
<span class="tok-k">FROM</span> user_lifetime_points y                           <span class="tok-c">-- yesterday</span>
  <span class="tok-k">FULL OUTER JOIN</span> daily_user_points t                 <span class="tok-c">-- today's delta</span>
    <span class="tok-k">ON</span> y.user_id = t.user_id
<span class="tok-k">WHERE</span> y.ds = <span class="tok-s">'&lt;DATEID-1&gt;'</span> <span class="tok-k">AND</span> t.ds = <span class="tok-s">'&lt;DATEID&gt;'</span>;`;

export interface Ch2StoreProps {
  readonly chapter: ChapterMeta;
}

export function Ch2Store({ chapter }: Ch2StoreProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Store: <span class='accent'>one bad day</span> poisons every day that follows it."
        hook="Most tables are a photo of yesterday. <strong>Cumulative tables</strong> are the whole photo album: each day, you carry yesterday's state forward and merge in today's deltas. Elegant when clean, catastrophic when broken: one bad day taints every day after it until you backfill."
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
          Every cumulative table has the same shape: <code>FULL OUTER JOIN</code> yesterday&apos;s cumulative with today&apos;s deltas on the
          entity key, then <code>COALESCE</code> to pick the newer value.<b> FULL OUTER</b> is the important part: <code>LEFT JOIN</code> will
          silently drop every user appearing for the first time today.
        </p>
        <p className="prose">
          The magic is compounding: day 7&apos;s cumulative is day 6 + today, which is already day 5 + its today, all the way back. The curse is
          the same: a bug on day 3 lives in every day that follows, forever, until someone catches it and backfills.
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
          "<b>Using <code>LEFT JOIN</code> instead of <code>FULL OUTER</code>.</b> You will silently drop every entity appearing today for the first time. Half your new users: gone.",
          "<b>Forgetting to backfill after a bug.</b> The bad value lives forever in every downstream cumulative. A fix deployed tomorrow does nothing about yesterday.",
          "<b>Depending on wall-clock time.</b> <code>CURRENT_DATE</code>, <code>NOW()</code>, today's timezone: all fatal. A backfill in May must produce identical output to the original run.",
          "<b>Mutating the cumulative table in place.</b> Always write to a new partition and swap. Mutation kills reproducibility and breaks every downstream snapshot reader.",
        ]}
      />
      <BestPractices
        items={[
          "Always key every partition by <code>&lt;DATEID&gt;</code>. The job's clock is the partition, not the wall clock.",
          "Version your cumulative logic. When the formula changes, backfill the whole history: don't let new rules and old rows coexist.",
          "Add a <b>row-count guardrail</b>: today's cumulative row count should never decrease. A shrink means you used <code>LEFT JOIN</code> instead of <code>FULL OUTER</code>.",
        ]}
      />
      <Takeaway
        items={[
          "Cumulative = <b>yesterday ⊕ today</b>. Every broken day taints every future day until you backfill.",
          "<code>FULL OUTER JOIN</code> + <code>COALESCE</code> is the canonical shape. <code>LEFT JOIN</code> drops new entities.",
          "Always key off <code>&lt;DATEID&gt;</code>, never <code>CURRENT_DATE</code>: backfills demand determinism.",
        ]}
      />
    </>
  );
}

export default Ch2Store;
