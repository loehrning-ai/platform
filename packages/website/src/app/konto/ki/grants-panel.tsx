"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { OAuthGrantView, RegionOutcome } from "./account-agent-data";
import { OAUTH_GRANTS_ENDPOINT } from "./agent-account-contract";
import { agentErrorMessage } from "./error-messages";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";
import { formatUtcMoment } from "./moment";

/**
 * Granted OAuth clients, with the withdrawal that makes the list meaningful.
 *
 * Three outcomes, and they are not interchangeable. `not-configured` means
 * this deployment issues no grants at all, so the region explains the access
 * key path instead of showing an empty list that implies grants exist.
 * `unavailable` means the list could not be read, which must never render as
 * "nothing has access". Only a successful read shows an empty state.
 */

const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-50";

export function GrantsPanel({
  locale,
  ownerId,
  initial,
  oauthServerReady,
}: {
  readonly locale: Locale;
  readonly ownerId: string;
  readonly initial: RegionOutcome<OAuthGrantView>;
  readonly oauthServerReady: boolean;
}) {
  const copy = AGENT_ACCOUNT_COPY[locale];
  const [grants, setGrants] = useState<readonly OAuthGrantView[]>(
    initial.ok ? initial.items : [],
  );
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const notConfigured =
    !oauthServerReady || (!initial.ok && initial.reason === "not-configured");

  if (notConfigured) {
    return (
      <div className="mt-4 border border-border border-l-[3px] border-l-brand-orange p-4">
        <p className="font-semibold text-foreground">{copy.grantsSetupTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {copy.grantsSetupBody}
        </p>
      </div>
    );
  }

  if (!initial.ok) {
    return (
      <p
        role="alert"
        className="mt-4 text-sm leading-relaxed text-muted-foreground"
      >
        {copy.grantsUnavailable}
      </p>
    );
  }

  async function handleRevoke(clientId: string) {
    setRevoking(clientId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(OAUTH_GRANTS_ENDPOINT, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedOwnerId: ownerId, clientId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        readonly error?: unknown;
      } | null;
      if (!response.ok) {
        setError(
          agentErrorMessage(
            "grant",
            payload?.error,
            locale,
            copy.grantUnknownError,
          ),
        );
        return;
      }
      setGrants((current) =>
        current.filter((grant) => grant.clientId !== clientId),
      );
      setNotice(copy.grantRevokedNotice);
    } catch {
      setError(copy.grantUnknownError);
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="mt-4">
      {error ? (
        <p
          role="alert"
          className="mb-3 border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="mb-3 border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
        >
          {notice}
        </p>
      ) : null}

      {grants.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {copy.grantsEmpty}
        </p>
      ) : (
        <ul
          aria-label={copy.grantsListLabel}
          className="grid gap-px border border-border bg-border"
        >
          {grants.map((grant) => (
            <li
              key={grant.clientId}
              className="flex flex-wrap items-start justify-between gap-3 bg-background p-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {grant.clientName ?? grant.clientId}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {grant.clientId}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {copy.grantScopesLabel}
                  {": "}
                  {grant.scopes.length > 0
                    ? grant.scopes.join(", ")
                    : copy.grantNoScopes}
                </p>
                {grant.grantedAt ? (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {copy.grantGranted(
                      formatUtcMoment(grant.grantedAt, locale) ??
                        grant.grantedAt,
                    )}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(grant.clientId)}
                disabled={revoking !== null}
                className={BUTTON_CLASS}
              >
                {revoking === grant.clientId
                  ? copy.grantRevoking
                  : copy.grantRevoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
