import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { DiscoverySpeedrun } from "../simulators/discovery-speedrun";
import { LineageCamera } from "../simulators/lineage-camera";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch6_Discover ─────────────────────────────────
// Ported from `src/chapters/Ch6_Discover.js`.

export const DATASETSPEC_YAML = `<span class="tok-k">dataset</span>: <span class="tok-s">dim_users</span>
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
        title="Discover: <span class='accent'>find ownership, contract, and lineage.</span>"
        hook="The course uses a fictional command palette, a DatasetSpec metadata file, and a lineage graph to practice common discovery tasks. These interfaces are reference designs, not industry standards."
        meta={[
          { k: "Glossary", v: "palette + wut" },
          { k: "Metadata", v: "DatasetSpec" },
          { k: "Lineage", v: "OpenLineage / DataHub" },
        ]}
      />

      <section className="section">
        <SectionLabel n="7.1">The six shortcuts</SectionLabel>
        <h2 className="h2">Use the course palette before adopting a dataset.</h2>
        <p className="prose">
          Before adopting a table, inspect its purpose, owner, status, upstream producer, and registered consumers. In the course palette,
          <code> ht</code> shows table metadata, <code>fpl</code> opens the producing file, <code>ds produce</code> lists registered consumers,
          <code> qbgs</code> searches examples, <code>udf</code> finds a function, and <code>wut</code> opens a glossary entry.
        </p>
        <DiscoverySpeedrun />
      </section>

      <section className="section">
        <SectionLabel n="7.2">The metadata file</SectionLabel>
        <p className="prose">
          In this reference design, each dataset has a versioned <b>DatasetSpec</b> beside its pipeline code. Integrations can read its
          descriptions, owner, status, and actor annotations. The file is a declared contract; verify that the catalog and lineage ingestion are
          current before relying on them.
        </p>
        <CodeBlock title="dim_users.spec.yaml · dataset metadata" lang="YAML" html={DATASETSPEC_YAML} />
      </section>

      <section className="section">
        <SectionLabel n="7.3">Lineage as a camera</SectionLabel>
        <p className="prose">
          A lineage graph can show emitted upstream and downstream edges, including column-level relationships when the integrations provide
          them. It may be incomplete. Combine the graph with owners, source code, catalog search, and runtime evidence before estimating impact.
        </p>
        <LineageCamera />
      </section>

      <AntiPatterns
        items={[
          "<b>Starting with broad code search.</b> Check the catalog entry and owner first, then use source search to verify details or fill metadata gaps.",
          "<b>Adopting a table without checking the deprecation banner.</b> The table exists, returns data, has the right schema. The banner says 'deprecated 2023-06, migrate to v2.' You won't know until migration week.",
          "<b>Assuming the lineage graph is complete.</b> Confirm the upstream owner and at least one critical consumer against code or runtime evidence.",
        ]}
      />
      <BestPractices
        items={[
          "Use the course palette to inspect metadata before exploratory SQL.",
          "Read both the declared DatasetSpec and the observed table. The contract and deployed state can drift.",
          "<b>One hop up, one hop down.</b> Trace the upstream producer and at least one downstream consumer before relying on a table.",
        ]}
      />
      <Takeaway
        items={[
          "A discovery workflow should expose purpose, owner, status, schema, and known lineage before adoption.",
          "A DatasetSpec is a versioned declaration. Compare it with the deployed catalog and data when accuracy matters.",
          "Lineage is evidence from instrumented systems, not a guaranteed inventory of every dependency.",
        ]}
      />
    </>
  );
}

export default Ch6Discover;
