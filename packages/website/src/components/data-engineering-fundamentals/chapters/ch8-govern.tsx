import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { PermissionGateSim } from "../simulators/permission-gate-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch8_Govern (plan 011 stage 9) ───────────────────────────────────
// Ported from `src/chapters/Ch8_Govern.js`.

const ANNOTATED_SPEC_YAML = `<span class="tok-k">dataset</span>: <span class="tok-s">dim_users</span>
<span class="tok-k">owner</span>: <span class="tok-s">analytics_oncall</span>
<span class="tok-k">dataset_acl</span>: <span class="tok-s">corp_assets</span>
<span class="tok-k">data_classification</span>: <span class="tok-s">pii_secure</span>

<span class="tok-k">columns</span>:
  <span class="tok-k">- name</span>: <span class="tok-s">employee_email</span>
    <span class="tok-k">actors</span>: [<span class="tok-s">PII_Person</span>]
  <span class="tok-k">- name</span>: <span class="tok-s">account_id</span>
    <span class="tok-k">actors</span>: [<span class="tok-s">PII_Person</span>]
  <span class="tok-k">- name</span>: <span class="tok-s">manager_unixname</span>
    <span class="tok-k">actors</span>: [<span class="tok-s">PII_Person</span>]
  <span class="tok-k">- name</span>: <span class="tok-s">event_type</span>
    <span class="tok-c"># non-PII, no actor required</span>

<span class="tok-k">transforms</span>:
  <span class="tok-k">- name</span>: <span class="tok-s">hash_account_id</span>
    <span class="tok-k">kind</span>: <span class="tok-s">opaque</span>
    <span class="tok-k">network</span>: <span class="tok-s">NO_NETWORK</span>  <span class="tok-c"># can't exfiltrate PII</span>`;

export interface Ch8GovernProps {
  readonly chapter: ChapterMeta;
}

export function Ch8Govern({ chapter }: Ch8GovernProps) {
  return (
    <>
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Chapter ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Govern: privacy isn't an audit step. It's the <span class='accent'>deploy gate</span>."
        hook="Every column that names a human, device, or contractor must declare what kind of identity it carries. Access Gateway reads that declaration at deploy time and refuses to ship a DatasetSpec that has unannotated PII. You don't argue with it; you annotate and re-ship. This is the layer that makes the entire warehouse legally safe to query."
        meta={[
          { k: "Deploy gate", v: "Access Gateway" },
          { k: "ACL", v: "dataset_acl" },
          { k: "Actors", v: "PII_Person · Service_Identity" },
        ]}
      />

      <section className="section">
        <SectionLabel n="9.1">Actor annotations</SectionLabel>
        <h2 className="h2">Every column declares what it identifies.</h2>
        <p className="prose">
          A column isn&apos;t just a type: it&apos;s also a <em>subject</em>. <code>employee_email</code>identifies a person.{" "}
          <code>service_account_id</code> identifies an application.
          <code>contractor_id</code> identifies a contingent worker. Three canonical actors cover &gt;95% of cases:
        </p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">PII_Person</div>
            <div className="ccard-n">Identifies a regular employee</div>
            <div className="ccard-d">Emails, unixnames, manager chains, device serials that map 1:1 to a person. Most common PII in corp data.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Service_Identity</div>
            <div className="ccard-n">Identifies an application / service</div>
            <div className="ccard-d">Service account IDs, bot tokens, app UUIDs. Not human PII, but still sensitive: lives in a different ACL bucket.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">PII_Contractor</div>
            <div className="ccard-n">Identifies a contingent worker</div>
            <div className="ccard-d">Legally distinct retention and access rules from regular employees. Mislabelling is a compliance incident.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="9.2">The deploy gate</SectionLabel>
        <h2 className="h2">Access Gateway reads the dbt, not your pull request.</h2>
        <p className="prose">
          Reviewers can miss an unannotated PII column. The deploy gate can&apos;t. When you ship a dbt, Access Gateway walks every column,
          checks the declared actor set against the inferred PII class, resolves the dataset_acl, and (optionally) verifies the Policy Zone
          binding. Any failure: no ship. Patch and re-ship.
        </p>
        <PermissionGateSim />
      </section>

      <section className="section">
        <SectionLabel n="9.3">Policy zones &amp; opaque transforms</SectionLabel>
        <p className="prose">
          A <b>Policy Zone</b> restricts a column so it&apos;s only readable inside a specific compute environment: for example, a
          regionally-isolated cluster that&apos;s approved for PII. Opaque transforms (UDFs that take PII in and emit derived non-PII out) must
          run with<code> network=NO_NETWORK</code> so they can&apos;t exfiltrate. Together these cover the &quot;processing PII without leaking
          PII&quot; case.
        </p>
        <CodeBlock title="dim_users.spec.yaml · the shipped annotation" lang="YAML" html={ANNOTATED_SPEC_YAML} />
      </section>

      <AntiPatterns
        items={[
          "<b>Shipping a dbt without actor annotations.</b> The deploy fails. You'll be tempted to find a workaround. There is no workaround. Annotate the columns.",
          "<b>Opaque transforms without <code>network=NO_NETWORK</code>.</b> A UDF that touches PII AND has network access is an exfil path. The audit team will find it.",
          "<b>Catch-all ACL groups.</b> <code>eng_everyone</code> on a PII dataset is not governance. Scope the dataset_acl to the project that needs it.",
          "<b>Mislabelling contingent-worker columns as employees.</b> Retention windows differ. This is a compliance bug, not a bug.",
        ]}
      />
      <BestPractices
        items={[
          "<b>Every PII column gets a <code>PII_Person</code> / <code>Service_Identity</code> / <code>PII_Contractor</code> actor.</b> No exceptions, no \"we'll add it later.\"",
          "<b>Opaque transforms on PII are network-isolated by default.</b> If you need the network, re-architect so PII never touches that transform.",
          "<b>ACLs scoped per-project, never per-team.</b> Teams reorg; projects don't. A per-project ACL survives reorgs and reads cleanly.",
          "<b>Policy Zones for region-restricted data.</b> EU-only data gets a EU-only zone; the column literally can't be read outside that compute environment.",
        ]}
      />
      <Takeaway
        items={[
          "<b>Privacy isn't an audit step. It's the deploy gate.</b> Access Gateway refuses before the warehouse ever sees the column.",
          "<b>Three actors cover &gt;95% of PII.</b> PII_Person, Service_Identity, PII_Contractor. Know which applies; annotate.",
          "<b>The dbt is the legal document.</b> Version it like code. Review it like a contract.",
        ]}
      />
    </>
  );
}

export default Ch8Govern;
