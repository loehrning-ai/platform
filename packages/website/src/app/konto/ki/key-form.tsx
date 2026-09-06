"use client";

import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import {
  ACCOUNT_LLM_KEY_MAX_LENGTH,
  isAccountLlmKeyShape,
} from "@/lib/llm-keys/providers";
import {
  ACCOUNT_CHAT_PROVIDER,
  LLM_KEY_ENDPOINT,
} from "./agent-account-contract";
import { agentErrorMessage } from "./error-messages";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";
import { formatUtcMoment } from "./moment";

/**
 * The bring-your-own-key form.
 *
 * The clear key is in component state for the length of one submit and is
 * cleared the moment the server answers, success or failure. It is never put
 * in storage, never placed in a query string, and never echoed back into the
 * field after a rejection: a rejected key is far more likely to be the wrong
 * string than a typo worth preserving.
 *
 * The only clear fragment that ever comes back from the server is the
 * four-character hint, which is what the stored-state line shows.
 */

export interface StoredKeyState {
  readonly hint: string | null;
  readonly validatedAt: string | null;
  /** True when the hint could not be read, which is not the same as absent. */
  readonly unavailable: boolean;
}

const INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";
const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-50";

export function KeyForm({
  locale,
  ownerId,
  stored,
  onStoredChange,
}: {
  readonly locale: Locale;
  readonly ownerId: string;
  readonly stored: StoredKeyState;
  readonly onStoredChange: (next: StoredKeyState) => void;
}) {
  const copy = AGENT_ACCOUNT_COPY[locale];
  const fieldId = useId();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = value.trim();
    setNotice(null);
    if (!isAccountLlmKeyShape(ACCOUNT_CHAT_PROVIDER, candidate)) {
      setError(copy.keyShapeError);
      return;
    }
    setBusy("save");
    setError(null);
    try {
      const response = await fetch(LLM_KEY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedOwnerId: ownerId,
          provider: ACCOUNT_CHAT_PROVIDER,
          apiKey: candidate,
        }),
      });
      // Cleared before anything is rendered, so a failed save leaves no key
      // material in the field for the next person at this machine.
      setValue("");
      const payload = (await response.json().catch(() => null)) as {
        readonly error?: unknown;
        readonly hint?: unknown;
        readonly validatedAt?: unknown;
      } | null;
      if (!response.ok) {
        setError(
          agentErrorMessage("key", payload?.error, locale, copy.keyUnknownError),
        );
        return;
      }
      onStoredChange({
        hint: typeof payload?.hint === "string" ? payload.hint : null,
        validatedAt:
          typeof payload?.validatedAt === "string" ? payload.validatedAt : null,
        unavailable: false,
      });
      setNotice(copy.keySavedNotice);
    } catch {
      setValue("");
      setError(copy.keyUnknownError);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(LLM_KEY_ENDPOINT, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedOwnerId: ownerId,
          provider: ACCOUNT_CHAT_PROVIDER,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        readonly error?: unknown;
      } | null;
      if (!response.ok) {
        setError(
          agentErrorMessage("key", payload?.error, locale, copy.keyUnknownError),
        );
        return;
      }
      onStoredChange({ hint: null, validatedAt: null, unavailable: false });
      setNotice(copy.keyDeletedNotice);
    } catch {
      setError(copy.keyUnknownError);
    } finally {
      setBusy(null);
    }
  }

  const hasKey = stored.hint !== null;

  return (
    <div>
      <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
        {copy.keyHeading}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.keyDisclosure}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-foreground">
        {stored.unavailable
          ? copy.keyStateUnavailable
          : hasKey
            ? copy.keyStored(stored.hint as string)
            : copy.keyMissing}
      </p>
      {hasKey && stored.validatedAt ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {copy.keyValidated(
            formatUtcMoment(stored.validatedAt, locale) ?? stored.validatedAt,
          )}
        </p>
      ) : null}

      <form onSubmit={handleSave} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-72">
          <label
            htmlFor={fieldId}
            className="block font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {copy.keyLabel}
          </label>
          <input
            id={fieldId}
            name="anthropicKey"
            type="password"
            value={value}
            maxLength={ACCOUNT_LLM_KEY_MAX_LENGTH}
            autoComplete="off"
            spellCheck={false}
            placeholder={copy.keyPlaceholder}
            onChange={(event) => setValue(event.target.value)}
            disabled={busy !== null}
            className={`mt-2 ${INPUT_CLASS}`}
          />
        </div>
        <button type="submit" disabled={busy !== null} className={BUTTON_CLASS}>
          {busy === "save"
            ? copy.keySaving
            : hasKey
              ? copy.keyReplace
              : copy.keySave}
        </button>
        {hasKey ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className={BUTTON_CLASS}
          >
            {busy === "delete" ? copy.keyDeleting : copy.keyDelete}
          </button>
        ) : null}
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-3 border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="mt-3 border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
