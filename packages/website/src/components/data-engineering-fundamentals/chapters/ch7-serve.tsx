import { Hero, SectionLabel, AntiPatterns, BestPractices } from "../primitives";
import { MetricsSim } from "../simulators/metrics-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch7_Serve ────────────────────────────────────
// Ported from `src/chapters/Ch7_Serve.js`.

export const METRICS = [
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
        title="Serve: <span class='accent'>versioned metrics</span> across consumer surfaces."
        hook="Two dashboards can show two numbers for one metric name because their SQL uses different grains, filters and cutoffs. A shared registry reduces that drift."
        meta={[
          { k: "Contract", v: "versioned definition per metric" },
          { k: "Owner", v: "declared steward" },
          { k: "Surface", v: "API · dashboards · notebooks" },
        ]}
      />

      <section className="section">
        <SectionLabel n="8.1">What a metrics layer is</SectionLabel>
        <h2 className="h2">Declare the metric version and execution context.</h2>
        <p className="prose">A metrics layer is a <b>registry</b> of names, versions, owners, grains, sources, formulas, allowed filters and effective dates. Consumers that resolve a registered metric share one definition.</p>
        <MetricsRegistry />
        <p className="prose" style={{ marginTop: 18 }}>A registry alone enforces no row-level security, masking or regional placement. Build those controls into the query and data layers, pass identity through and test every consumer path.</p>
      </section>

      <section className="section">
        <SectionLabel n="8.2">The query story</SectionLabel>
        <h2 className="h2">One question, ad-hoc SQL or a registered metric.</h2>
        <p className="prose">
          Ask <em>&quot;what was DAU in the US last week?&quot;</em> Without a metrics layer, an analyst searches for related-looking tables,
          picks one and writes ad-hoc SQL, sometimes on a table deprecated two years ago or with a renamed column.{" "}
          <b>The answer does not show the error.</b>
        </p>
        <p className="prose">With a registry the consumer resolves a metric version, binds supported filters and runs the stored definition against its declared sources. Log version, filters, source snapshot or partitions and execution identity with the result.</p>
        <MetricsSim />
      </section>

      <section className="section">
        <SectionLabel n="8.3">What the consumer sees</SectionLabel>
        <h2 className="h2">One metric, many surfaces.</h2>
        <p className="prose">A shared registry removes one source of variation, the formula. Results still differ by source freshness, filter bindings, timezone, permissions, cache state and definition version, so include that context in every comparison.</p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Dashboards</div>
            <div className="ccard-n">Hex · Mode · Superset · Trino-backed</div>
            <div className="ccard-d">Resolve the registered version and record filters, source cutoff and cache state.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Notebooks &amp; APIs</div>
            <div className="ccard-n">One resolver, many callers</div>
            <div className="ccard-d">Call the same resolver and keep caller-specific authorization and audit context.</div>
          </div>
        </div>
      </section>

      <AntiPatterns
        items={[
          "<b>Copying metric SQL into multiple surfaces.</b> Register and version the definition and track remaining ad-hoc copies.",
          "<b>Publishing ad-hoc table output as a governed metric.</b> Exploration may use raw tables; published metrics need a named definition and execution context.",
          "<b>Registering a metric without a steward.</b> Assign responsibility for definition changes, source changes and deprecation.",
          "<b>Assuming metric-level authorization replaces source controls.</b> Enforce least privilege across resolver, query engine and data.",
        ]}
      />
      <BestPractices
        items={[
          "Expose the metric layer as an <b>API</b> so dashboards, notebooks and external callers resolve metrics the same way.",
          "Treat metric changes as <b>breaking changes</b>: version and announce them and deprecate the old definition.",
        ]}
      />
    </>
  );
}

export default Ch7Serve;
