import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { MetricsSim } from "../simulators/metrics-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch7_Serve ────────────────────────────────────
// Ported from `src/chapters/Ch7_Serve.js`.

const METRICS = [
  { name: "daily_active_users", owner: "analytics_team", grain: "user, day", source: "events_daily", formula: 'COUNT(DISTINCT user_id) WHERE event_name IN ("open","login")' },
  { name: "revenue_usd", owner: "finance_team", grain: "day, country", source: "billable_impressions", formula: "SUM(bid_price * 1e-6) WHERE billable = TRUE" },
  { name: "active_creators", owner: "creators_data", grain: "creator, day", source: "creator_posts_daily", formula: "COUNT(DISTINCT creator_id) WHERE posts >= 1" },
] as const;

function MetricsRegistry() {
  return (
    <div className="cards-3">
      {METRICS.map((m) => (
        <div key={m.name} className="ccard">
          <div className="ccard-t">{m.owner}</div>
          <div className="ccard-n">{m.name}</div>
          <div className="ccard-d" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <div>
              <b>grain:</b> {m.grain}
            </div>
            <div style={{ marginTop: 6 }}>
              <b>source:</b> <code>{m.source}</code>
            </div>
            <div style={{ marginTop: 6 }}>
              <b>formula:</b>
            </div>
            <div style={{ marginTop: 2, color: "var(--fg-2)" }}>{m.formula}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Ch7ServeProps {
  readonly chapter: ChapterMeta;
}

export function Ch7Serve({ chapter }: Ch7ServeProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Serve: <span class='accent'>five teams.</span> Five DAU numbers. One meeting."
        hook="The warehouse has the right number. Nobody can agree what it is. Without a metrics layer, every team defines DAU in their dashboard SQL: independently, slightly differently, each plausible. You cannot reconcile them after the meeting. You can only prevent it before."
        meta={[
          { k: "Contract", v: "one definition per metric · forever" },
          { k: "Owner", v: "the team that produces the source" },
          { k: "Surface", v: "API · dashboards · notebooks" },
        ]}
      />

      <section className="section">
        <SectionLabel n="8.1">What a metrics layer actually is</SectionLabel>
        <h2 className="h2">Every metric, one canonical definition.</h2>
        <p className="prose">
          A metrics layer is a <b>registry</b>: every business metric: DAU, revenue, active creators: is declared once, with an owner, a grain, a
          source table, and a formula. Downstream consumers don&apos;t write SQL against raw tables; they ask for a metric by name, and the system
          composes the SQL, applies access controls, and returns a lineage-traceable answer.
        </p>
        <MetricsRegistry />
        <p className="prose" style={{ marginTop: 18 }}>
          This is also your <b>access surface</b>. Row-level security, PII masking, regional data residency: all enforced at the metrics layer, so
          every consumer (a viewer of a dashboard, an analyst in a notebook, a partner via API) gets the same guarantees.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="8.2">The query story</SectionLabel>
        <h2 className="h2">Same question. Different warehouse.</h2>
        <p className="prose">
          Ask any analyst <em>&quot;what was DAU in the US last week?&quot;</em> Without a metrics layer, they search the warehouse for table
          names that look related, pick one based on intuition, and write ad-hoc SQL. Often they land on a table that looks current but was
          deprecated two years ago. Sometimes they reference column names from memory that have since been renamed.
          <b> You cannot tell from the answer</b>.
        </p>
        <p className="prose">
          With a metrics layer, the consumer&apos;s job is scoped: resolve the question to a registered metric, bind filters, compose SQL from the
          stored formula, execute against the <em>one</em> governed source. The answer is traceable to a row in a table that someone owns.
        </p>
        <MetricsSim />
      </section>

      <section className="section">
        <SectionLabel n="8.3">What the consumer actually sees</SectionLabel>
        <h2 className="h2">One metric, many surfaces.</h2>
        <p className="prose">
          The win of a single registry: the number on the CFO&apos;s deck, the number on the product dashboard, the number quoted in Slack, and
          the number you&apos;d get by writing SQL yourself: <em>are all the same number</em>, because they all resolve through the same
          definition. Drift in any of these is a bug ticket, not an interpretation difference.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Dashboards</div>
            <div className="ccard-n">Hex · Mode · Superset · Trino-backed</div>
            <div className="ccard-d">All read from the same metric. Refreshes are cheap because the compute is shared across viewers.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Notebooks &amp; APIs</div>
            <div className="ccard-n">One resolver, many callers</div>
            <div className="ccard-d">Notebooks call the registry, not raw tables. External partners hit a metric API. Same definition, same numbers everywhere.</div>
          </div>
        </div>
      </section>

      <AntiPatterns
        items={[
          "<b>Defining DAU in five places.</b> Once in a dashboard SQL, once in a pipeline, once in an exec deck, once in Slack, once in a CSV. They will drift. They will be cited in the same meeting. You will not be there to defend any of them.",
          "<b>Letting consumers query raw tables with no governance.</b> Someone will find <code>dau_v3_backup_DO_NOT_USE</code> and quote it. You will not know.",
          "<b>Building a metrics layer without owners.</b> A metric with no owner is a metric that will go stale, then wrong, then cited in a launch review.",
          "<b>Access controls on the table, not the metric.</b> People need access to aggregates without access to underlying PII. Control at the metric, not the source.",
        ]}
      />
      <BestPractices
        items={[
          "Every metric has <b>one row in the registry</b>: name, owner, grain, source, formula. No ambiguity, no branch variants, no 'revenue_final_FINAL'.",
          "Expose the metric layer as an <b>API</b>: let dashboards, notebooks, and external callers all resolve the same way. UI-only metric tools create dashboard/SQL mismatches.",
          "Treat metric changes as <b>breaking changes</b>. Version, announce, deprecate. Don't mutate a live formula.",
          "Audit every served answer with the <b>trace</b> (which metric, which filters, which source partitions). If you can't trace it, you don't ship it.",
        ]}
      />
      <Takeaway
        items={[
          "The metrics layer is the <b>product surface</b> of your warehouse. Without it, a correct pipeline is wasted.",
          "Governance compounds. <b>A governed warehouse produces answers; an ungoverned one produces plausible fiction.</b>",
          "<b>One definition, one owner, one source.</b> That's the whole contract.",
        ]}
      />
    </>
  );
}

export default Ch7Serve;
