import { Hero, SectionLabel, CodeBlock, AntiPatterns, BestPractices, Takeaway } from "../primitives";
import { PermissionGateSim } from "../simulators/permission-gate-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

// ─── Ch8_Govern ───────────────────────────────────
// Ported from `src/chapters/Ch8_Govern.js`.

export const ANNOTATED_SPEC_YAML = `<span class="tok-k">dataset</span>: <span class="tok-s">dim_users</span>
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
    <span class="tok-k">network</span>: <span class="tok-s">NO_NETWORK</span>  <span class="tok-c"># removes direct network egress in this policy</span>`;

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
        hook="The reference deployment gate checks declared identity classes, ACL metadata, and transform policy. Passing it confirms those configured rules. It does not establish legal compliance."
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
          A column has both a technical type and a policy-relevant subject. <code>employee_email</code> identifies a person.{" "}
          <code>service_account_id</code> identifies an application.
          <code>contractor_id</code> identifies a contingent worker. The three labels below belong to the course taxonomy. A production taxonomy
          must align with the organization&apos;s legal, privacy, security, and records policies.
        </p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">PII_Person</div>
            <div className="ccard-n">Identifies a regular employee</div>
            <div className="ccard-d">Course label for values that directly or indirectly identify a person, subject to the organization&apos;s classification rules.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Service_Identity</div>
            <div className="ccard-n">Identifies an application / service</div>
            <div className="ccard-d">Course label for application or service identifiers. Sensitivity and access policy still require explicit classification.</div>
          </div>
          <div className="ccard">
            <div className="ccard-t">PII_Contractor</div>
            <div className="ccard-n">Identifies a contingent worker</div>
            <div className="ccard-d">Course label for contingent-worker identifiers. Retention and access rules must come from the applicable policy and jurisdiction.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="9.2">The deploy gate</SectionLabel>
        <h2 className="h2">The reference gate evaluates declared metadata.</h2>
        <p className="prose">In the simulator, Access Gateway checks each declared column against the course classification rules, resolves <code> dataset_acl</code>, and optionally checks a Policy Zone binding. The gate catches configured metadata omissions. On its own it detects no sensitive value, no policy conflict, and no legal requirement, without further review and evidence.</p>
        <PermissionGateSim />
      </section>

      <section className="section">
        <SectionLabel n="9.3">Policy zones &amp; opaque transforms</SectionLabel>
        <p className="prose">In the reference design a <b>Policy Zone</b> pins execution to a named compute environment, and an opaque transform can run with <code> network=NO_NETWORK</code> to remove direct egress. Neither setting is enough alone. Identity, storage, logs, dependencies, output controls, and deployment configuration all need enforcement and testing too.</p>
        <CodeBlock title="dim_users.spec.yaml · the shipped annotation" lang="YAML" html={ANNOTATED_SPEC_YAML} />
      </section>

      <AntiPatterns
        items={[
          "<b>Omitting required classification metadata.</b> Fix the declaration and investigate why schema or classification review did not catch the new column earlier.",
          "<b>Treating <code>network=NO_NETWORK</code> as complete isolation.</b> Review dependencies, local storage, logs, outputs, runtime identity, and the enforcement boundary.",
          "<b>Using broad ACL groups.</b> Grant the minimum access needed for the documented purpose and review membership and ownership over time.",
          "<b>Applying a course label as legal advice.</b> Map the taxonomy to approved policy, jurisdiction, retention, and data-subject rules.",
        ]}
      />
      <BestPractices
        items={[
          "Classify sensitive columns with the organization&apos;s approved taxonomy and record the policy source and reviewer.",
          "Reduce transform egress and privileges, then test the full runtime boundary rather than relying on one flag.",
          "Scope ACLs by least privilege and stable ownership. Review both project- and team-based groups when responsibilities change.",
          "Validate region controls across storage, compute, backups, logs, support access, and replication before making residency claims.",
        ]}
      />
      <Takeaway
        items={[
          "Automated deployment checks can enforce declared policy rules, but they do not replace privacy, security, or legal review.",
          "Classification taxonomies are organization-specific. Tie each label to approved policy and enforcement.",
          "Version DatasetSpec metadata as operational evidence; do not treat it as a legal determination by itself.",
        ]}
      />
    </>
  );
}

export default Ch8Govern;
