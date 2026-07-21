import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { DiscoverySpeedrun } from "../simulators/discovery-speedrun";
import { LineageCamera } from "../simulators/lineage-camera";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch6_Discover (plan 011 stage 9) ─────────────────────────────────
// Ported from `src/chapters/Ch6_Discover.js`.

const DATASETSPEC_YAML = `<span class="tok-k">dataset</span>: <span class="tok-s">dim_users</span>
<span class="tok-k">owner</span>: <span class="tok-s">analytics_oncall</span>
<span class="tok-k">sla_tier</span>: <span class="tok-s">"24h"</span>
<span class="tok-k">partition</span>: <span class="tok-s">ds</span>
<span class="tok-k">description</span>: |
  Dimension table for all active user accounts and their current
  activity posture. One row per (user_id, ds).

<span class="tok-k">columns</span>:
  <span class="tok-k">- name</span>: <span class="tok-s">user_id</span>
    <span class="tok-k">type</span>: <span class="tok-s">STRING</span>
    <span class="tok-k">description</span>: <span class="tok-s">Stable internal device UUID. PK.</span>
  <span class="tok-k">- name</span>: <span class="tok-s">account_id</span>
    <span class="tok-k">type</span>: <span class="tok-s">STRING</span>
    <span class="tok-k">description</span>: <span class="tok-s">Associated account UUID. PII via account ↔ user join.</span>
    <span class="tok-k">actors</span>: [<span class="tok-s">PII_Person</span>]
  <span class="tok-k">- name</span>: <span class="tok-s">event_type</span>
    <span class="tok-k">type</span>: <span class="tok-s">INT</span>
    <span class="tok-k">description</span>: <span class="tok-s">enum: 'view'|'signup'|'convert'|'cancel'. Non-PII.</span>`;

export interface Ch6DiscoverProps {
  readonly chapter: ChapterMeta;
}

export function Ch6Discover({ chapter }: Ch6DiscoverProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Discover: <span class='accent'>six shortcuts</span> replace four hours of code spelunking."
        hook="A consumer's first question is always the same: &quot;is this the right table?&quot; The answer should be instant. palette shortcuts, DatasetSpec metadata files, and OpenLineage lineage turn <em>hours of Snowflake code archaeology</em> into <em>three-character commands</em>. Learn the six and you are faster than 90% of the org."
        meta={[
          { k: "Glossary", v: "palette + wut" },
          { k: "Metadata", v: "DatasetSpec" },
          { k: "Lineage", v: "OpenLineage / DataHub" },
        ]}
      />

      <section className="section">
        <SectionLabel n="7.1">The six shortcuts</SectionLabel>
        <h2 className="h2">Memorize these before writing a single SQL query.</h2>
        <p className="prose">
          Before you write a query, you need to know three things: <em>is this the right table</em>, <em> who owns it</em>, and{" "}
          <em>is it deprecated</em>. The shortcuts get you all three in under three seconds each. <code>ht</code> answers &quot;is this
          it?&quot; <code>fpl</code> answers &quot;who writes it?&quot; <code>ds produce</code> answers &quot;who consumes it?&quot;{" "}
          <code>qbgs</code> searches. <code>udf</code>finds a function. <code>wut</code> defines a term. That&apos;s the whole kit.
        </p>
        <DiscoverySpeedrun />
      </section>

      <section className="section">
        <SectionLabel n="7.2">The metadata file</SectionLabel>
        <p className="prose">
          The reason the shortcuts work is that every dataset ships a <b>DatasetSpec</b> file in the same repo as its pipeline code. Columns have
          descriptions, owners, and actor annotations (see Ch9). The warehouse, the lineage graph, and the metrics layer all read from the same
          file, so there&apos;s one source of truth.
        </p>
        <CodeBlock title="dim_users.spec.yaml · dataset metadata" lang="YAML" html={DATASETSPEC_YAML} />
      </section>

      <section className="section">
        <SectionLabel n="7.3">Lineage as a camera</SectionLabel>
        <p className="prose">
          When someone asks <em>&quot;what would break if we change fct_events?&quot;</em>, you don&apos;t grep the warehouse. You click the node.
          Column-level edges show which downstream metric and dashboard reads which specific column. This is the adoption-safety gate: trace one
          hop up and one hop down before you commit.
        </p>
        <LineageCamera />
      </section>

      <AntiPatterns
        items={[
          "<b>Searching code blindly.</b> <code>ht &lt;table&gt;</code> answers in 2s what <code>grep -R</code> answers in 4 hours (wrong).",
          "<b>Adopting a table without checking the deprecation banner.</b> The table exists, returns data, has the right schema. The banner says 'deprecated 2023-06, migrate to v2.' You won't know until migration week.",
          "<b>Consuming a table whose lineage you've never traced.</b> If you can't answer 'what upstream producer would I page on an outage' in 5s, you haven't adopted: you've borrowed.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Six shortcuts before any question.</b> Reflex, not process.",
          "<b>Read the dbt file, not the table.</b> The file tells you owner, SLA, actor annotations, deprecation. The table just tells you shape.",
          "<b>One hop up, one hop down.</b> Trace the upstream producer and at least one downstream consumer before relying on a table.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Six shortcuts replace four hours of code spelunking.</b> Learn them once; they pay back every day.",
          "<b>DatasetSpec is the contract.</b> Owner, schema, actors, deprecation: one file, one truth.",
          "<b>Lineage is a camera, not a document.</b> You don't read it top-down; you click the node and the view comes to you.",
        ]}
      />
    </>
  );
}

export default Ch6Discover;
