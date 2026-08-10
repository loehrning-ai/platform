import { Hero, SectionLabel, AntiPatterns, BestPractices, Takeaway } from "../primitives";
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
        hook="Independent dashboard SQL can encode different grains, filters, and source cutoffs for the same metric name. A shared registry reduces that definition drift when consumers resolve the registered version."
        meta={[
          { k: "Contract", v: "versioned definition per metric" },
          { k: "Owner", v: "declared steward" },
          { k: "Surface", v: "API · dashboards · notebooks" },
        ]}
      />

      <section className="section">
        <SectionLabel n="8.1">What a metrics layer actually is</SectionLabel>
        <h2 className="h2">Declare the metric version and execution context.</h2>
        <p className="prose">
          A metrics layer is a <b>registry</b> of names, versions, owners, grains, sources, formulas, and allowed filters. Consumers that resolve a
          registered metric can share its definition. The query service still needs explicit authentication, authorization, source selection,
          and execution logging.
        </p>
        <MetricsRegistry />
        <p className="prose" style={{ marginTop: 18 }}>
          A metrics service can be an <b>access surface</b>, but a registry alone does not enforce row-level security, masking, or regional
          placement. Implement those controls in the query and data layers, propagate identity, and test each consumer path.
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
          With a registry, a consumer resolves a metric version, binds supported filters, and executes the stored definition against its declared
          source or sources. Record the metric version, filters, source snapshot or partitions, and execution identity with the result.
        </p>
        <MetricsSim />
      </section>

      <section className="section">
        <SectionLabel n="8.3">What the consumer actually sees</SectionLabel>
        <h2 className="h2">One metric, many surfaces.</h2>
        <p className="prose">
          A shared registry removes one source of variation: the metric formula. Results can still differ because of source freshness, filter
          bindings, timezone, permissions, cache state, or definition version. Include that context when comparing consumer outputs.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Dashboards</div>
            <div className="ccard-n">Hex · Mode · Superset · Trino-backed</div>
            <div className="ccard-d">Dashboards resolve the registered metric version and record filters, source cutoff, and cache state.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Notebooks &amp; APIs</div>
            <div className="ccard-n">One resolver, many callers</div>
            <div className="ccard-d">Notebooks and APIs can call the same resolver while retaining caller-specific authorization and audit context.</div>
          </div>
        </div>
      </section>

      <AntiPatterns
        items={[
          "<b>Copying metric SQL into multiple surfaces.</b> Register and version the definition, then track which consumers still use ad-hoc copies.",
          "<b>Publishing ad-hoc table output as a governed metric.</b> Exploration can use raw tables; published metrics need named definitions and execution context.",
          "<b>Registering a metric without a steward.</b> Assign responsibility for definition changes, source changes, and deprecation.",
          "<b>Assuming metric-level authorization replaces source controls.</b> Enforce least privilege across the resolver, query engine, and underlying data.",
        ]}
      />
      <BestPractices
        items={[
          "Each metric version records <b>name, steward, grain, source set, formula, filters, and effective date</b>.",
          "Expose the metric layer as an <b>API</b>: let dashboards, notebooks, and external callers all resolve the same way. UI-only metric tools create dashboard/SQL mismatches.",
          "Treat metric changes as <b>breaking changes</b>. Version, announce, deprecate. Don't mutate a live formula.",
          "Record a <b>trace</b> with metric version, filters, caller, source partitions or snapshot, and execution time.",
        ]}
      />
      <Takeaway
        items={[
          "A metrics layer provides a stable interface between datasets and consumer tools.",
          "A registry reduces definition drift only when consumers use it and source, authorization, and version context are preserved.",
          "Declare the metric version, steward, grain, source set, filters, and effective period.",
        ]}
      />
    </>
  );
}

export default Ch7Serve;
