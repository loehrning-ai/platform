"use client";

import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { AgentTokenView, RegionOutcome } from "./account-agent-data";
import {
  AGENT_TOKENS_ENDPOINT,
  MAX_ACTIVE_TOKENS,
  TOKEN_NAME_MAX_LENGTH,
} from "./agent-account-contract";
import { agentErrorMessage } from "./error-messages";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";
import { formatUtcMoment } from "./moment";

/**
 * Personal access tokens: mint once, list, revoke.
 *
 * The clear token exists in exactly one place after the mint response: the
 * panel below. It is held in component state, never written to storage, and
 * disappears with the first navigation or reload. That is the whole point of
 * showing it once, so nothing here may make it recoverable.
 */

interface MintedToken {
  readonly id: string;
  readonly token: string;
  readonly name: string;
}

type Busy = { readonly kind: "mint" } | { readonly kind: "revoke"; readonly id: string };

const INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";
const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-50";

export function TokensPanel({
  locale,
  ownerId,
  initial,
  agentAccessReady,
}: {
  readonly locale: Locale;
  readonly ownerId: string;
  readonly initial: RegionOutcome<AgentTokenView>;
  readonly agentAccessReady: boolean;
}) {
  const copy = AGENT_ACCOUNT_COPY[locale];
  const nameFieldId = useId();
  const [tokens, setTokens] = useState<readonly AgentTokenView[]>(
    initial.ok ? initial.items : [],
  );
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minted, setMinted] = useState<MintedToken | null>(null);
  const [copied, setCopied] = useState(false);

  const unavailable = !initial.ok;
  const activeCount = tokens.filter((token) => token.revokedAt === null).length;
  const limitReached = activeCount >= MAX_ACTIVE_TOKENS;

  async function handleMint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(copy.tokenNameRequired);
      return;
    }
    if (limitReached) {
      setError(copy.tokenLimitReached);
      return;
    }
    setBusy({ kind: "mint" });
    setError(null);
    setCopied(false);
    try {
      const response = await fetch(AGENT_TOKENS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedOwnerId: ownerId, name: trimmed }),
      });
      const payload = (await response.json().catch(() => null)) as {
        readonly error?: unknown;
        readonly id?: unknown;
        readonly token?: unknown;
        readonly name?: unknown;
        readonly prefix?: unknown;
        readonly createdAt?: unknown;
      } | null;
      if (!response.ok) {
        setError(
          agentErrorMessage(
            "token",
            payload?.error,
            locale,
            copy.tokenUnknownError,
          ),
        );
        return;
      }
      if (
        typeof payload?.id !== "string" ||
        typeof payload.token !== "string" ||
        typeof payload.name !== "string" ||
        typeof payload.prefix !== "string" ||
        typeof payload.createdAt !== "string"
      ) {
        setError(copy.tokenUnknownError);
        return;
      }
      setMinted({ id: payload.id, token: payload.token, name: payload.name });
      setTokens((current) => [
        {
          id: payload.id as string,
          name: payload.name as string,
          prefix: payload.prefix as string,
          createdAt: payload.createdAt as string,
          lastUsedAt: null,
          revokedAt: null,
        },
        ...current,
      ]);
      setName("");
    } catch {
      setError(copy.tokenUnknownError);
    } finally {
      setBusy(null);
    }
  }

  async function handleRevoke(tokenId: string) {
    setBusy({ kind: "revoke", id: tokenId });
    setError(null);
    try {
      const response = await fetch(AGENT_TOKENS_ENDPOINT, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedOwnerId: ownerId, tokenId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        readonly error?: unknown;
        readonly revokedAt?: unknown;
      } | null;
      if (!response.ok) {
        setError(
          agentErrorMessage(
            "token",
            payload?.error,
            locale,
            copy.tokenUnknownError,
          ),
        );
        return;
      }
      const revokedAt =
        typeof payload?.revokedAt === "string"
          ? payload.revokedAt
          : new Date().toISOString();
      setTokens((current) =>
        current.map((token) =>
          token.id === tokenId ? { ...token, revokedAt } : token,
        ),
      );
      if (minted?.id === tokenId) setMinted(null);
    } catch {
      setError(copy.tokenUnknownError);
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      // Clipboard access can be denied. The token is on screen and
      // selectable, so this stays silent rather than raising an error the
      // student cannot act on.
      setCopied(false);
    }
  }

  return (
    <div className="mt-4">
      {unavailable ? (
        <p role="alert" className="text-sm leading-relaxed text-muted-foreground">
          {copy.tokensUnavailable}
        </p>
      ) : null}

      <form onSubmit={handleMint} className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label
            htmlFor={nameFieldId}
            className="block font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {copy.tokenNameLabel}
          </label>
          <input
            id={nameFieldId}
            name="tokenName"
            type="text"
            value={name}
            maxLength={TOKEN_NAME_MAX_LENGTH}
            autoComplete="off"
            placeholder={copy.tokenNamePlaceholder}
            onChange={(event) => setName(event.target.value)}
            disabled={!agentAccessReady || busy !== null}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </div>
        <button
          type="submit"
          disabled={!agentAccessReady || busy !== null || limitReached}
          className={BUTTON_CLASS}
        >
          {busy?.kind === "mint" ? copy.tokenCreating : copy.tokenCreate}
        </button>
      </form>

      <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
        {copy.tokenActiveCount(activeCount, MAX_ACTIVE_TOKENS)}
      </p>
      {limitReached ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {copy.tokenLimitReached}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
        >
          {error}
        </p>
      ) : null}

      {minted ? (
        <div className="mt-4 border border-border border-l-[3px] border-l-brand-orange bg-kupfer-mist p-4">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
            {copy.tokenOnceTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {copy.tokenOnceBody}
          </p>
          <code className="mt-3 block w-full overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground">
            {minted.token}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCopy(minted.token)}
              className={BUTTON_CLASS}
            >
              {copied ? copy.tokenCopied : copy.tokenCopy}
            </button>
            <button
              type="button"
              onClick={() => {
                setMinted(null);
                setCopied(false);
              }}
              className={BUTTON_CLASS}
            >
              {copy.tokenDismiss}
            </button>
          </div>
        </div>
      ) : null}

      {tokens.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {unavailable ? copy.tokensUnavailable : copy.tokensEmpty}
        </p>
      ) : (
        <ul className="mt-4 grid gap-px border border-border bg-border">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex flex-wrap items-start justify-between gap-3 bg-background p-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{token.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {token.prefix}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {copy.tokenCreated(
                    formatUtcMoment(token.createdAt, locale) ?? token.createdAt,
                  )}
                  {" · "}
                  {token.lastUsedAt
                    ? copy.tokenLastUsed(
                        formatUtcMoment(token.lastUsedAt, locale) ??
                          token.lastUsedAt,
                      )
                    : copy.tokenNeverUsed}
                </p>
              </div>
              {token.revokedAt ? (
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  {copy.tokenRevokedAt(
                    formatUtcMoment(token.revokedAt, locale) ?? token.revokedAt,
                  )}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRevoke(token.id)}
                  disabled={busy !== null}
                  className={BUTTON_CLASS}
                >
                  {busy?.kind === "revoke" && busy.id === token.id
                    ? copy.tokenRevoking
                    : copy.tokenRevoke}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
