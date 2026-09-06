import Link from "next/link";
import { isAgentAccessReady } from "@/lib/provider-readiness";
import { DEFAULT_LOCALE, localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  AGENT_ACCESS_COPY,
  agentInstallSnippet,
  agentMcpEndpoint,
} from "./region-copy";
import { CopyValueButton } from "./copy-value-button";

/**
 * Deine KI: the connection panel for the platform's own agent access.
 *
 * The region occupies its slot in the account order after Werkzeuge and
 * renders nothing at all unless `isAgentAccessReady()` in
 * src/lib/provider-readiness.ts confirms the explicit opt-in together with the
 * complete account boundary that stores grants and the audit trail. Handing an
 * external client a view of one learner's account is not something a heading
 * may advertise before that exists, so with the capability off the region
 * emits no markup and the section nav offers no anchor for it.
 *
 * When it is on, the panel stays deliberately static: the endpoint is one
 * constant derived from the site origin, the three install snippets are the
 * same for every learner, and nothing here reads or writes account data. What
 * a connected client may actually see is decided by the grant, which lives on
 * its own page together with the audit trail.
 *
 * `locale` is optional and falls back to the default locale, so a caller that
 * renders the region while the capability is off needs no props at all. A
 * caller that can reach the enabled state passes the request locale.
 */

/**
 * Anchor id for this region. It is intentionally absent from
 * `KONTO_SECTION_IDS`: an anchor may only be offered for an element that
 * renders, and this one renders only where agent access is on.
 */
export const DEINE_KI_SECTION_ID = "konto-deine-ki";

export function DeineKiSection({
  locale = DEFAULT_LOCALE,
}: {
  readonly locale?: Locale;
} = {}) {
  if (!isAgentAccessReady()) return null;

  const copy = AGENT_ACCESS_COPY[locale];
  const endpoint = agentMcpEndpoint();

  return (
    <section
      id={DEINE_KI_SECTION_ID}
      aria-labelledby="konto-deine-ki-heading"
      className="mt-12 scroll-mt-24"
    >
      <h2
        id="konto-deine-ki-heading"
        className="text-2xl font-bold tracking-[-0.03em] text-foreground"
      >
        {copy.heading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.intro}
      </p>

      {/* The endpoint itself. One value, copied far more often than read. */}
      <div className="mt-4 border border-border border-l-[3px] border-l-brand-orange p-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {copy.endpointLabel}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="min-w-0 break-all font-mono text-sm text-foreground">
            {endpoint}
          </code>
          <CopyValueButton
            value={endpoint}
            label={copy.endpointCopyLabel}
            copyAction={copy.copyAction}
            copiedAction={copy.copiedAction}
          />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {copy.endpointNote}
        </p>
      </div>

      {/* One snippet per client. Three alternatives, not three steps. */}
      <h3
        id="konto-deine-ki-install"
        className="mt-8 scroll-mt-24 text-lg font-bold tracking-[-0.02em] text-foreground"
      >
        {copy.installHeading}
      </h3>
      <ul className="mt-4 grid gap-px border border-border bg-border">
        {copy.clients.map((client) => {
          const snippet = agentInstallSnippet(client.id, endpoint);
          return (
            <li
              key={client.id}
              className="border-l-[3px] border-l-brand-orange bg-background p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                {client.client}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {client.where}
              </p>
              <pre className="mt-3 overflow-x-auto border border-border bg-card p-3 font-mono text-xs leading-relaxed text-foreground">
                <code>{snippet}</code>
              </pre>
              <div className="mt-2">
                <CopyValueButton
                  value={snippet}
                  label={copy.snippetCopyLabel(client.client)}
                  copyAction={copy.copyAction}
                  copiedAction={copy.copiedAction}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* What the endpoint does before a grant exists. */}
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {copy.statusLabel}
        </span>{" "}
        {copy.status}
      </p>

      <ul className="mt-4 space-y-1 border-t border-border pt-4">
        <li className="text-sm leading-relaxed text-muted-foreground">
          <Link
            href={localizeHref("/konto/ki", locale)}
            className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {copy.grantsLink}
          </Link>
          {": "}
          {copy.grantsSummary}
        </li>
        <li className="text-sm leading-relaxed text-muted-foreground">
          <Link
            href={localizeHref("/hilfe/eigene-ki", locale)}
            className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {copy.helpLink}
          </Link>
          {": "}
          {copy.helpSummary}
        </li>
      </ul>
    </section>
  );
}
