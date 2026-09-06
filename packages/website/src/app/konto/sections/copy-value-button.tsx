"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * The one interactive element in the Deine KI region.
 *
 * It exists because an MCP endpoint and two install commands are only useful
 * if they can be transferred without a typo. It is deliberately the smallest
 * possible island: plain strings in, one clipboard call out, no data client
 * and no account state, so the account page keeps shipping no SDK to the
 * browser.
 *
 * The accessible name puts the value's label first and the action last, so it
 * contains the button's visible word ("Kopieren" / "Copy") and a learner
 * navigating by voice or by list hears which of the several buttons this is.
 * A denied or unavailable clipboard leaves the button in its idle state rather
 * than claiming a copy that did not happen.
 */
export function CopyValueButton({
  value,
  label,
  copyAction,
  copiedAction,
}: {
  readonly value: string;
  readonly label: string;
  readonly copyAction: string;
  readonly copiedAction: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      aria-label={`${label}: ${copied ? copiedAction : copyAction}`}
      className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
    >
      {copied ? (
        <Check size={13} aria-hidden="true" />
      ) : (
        <Copy size={13} aria-hidden="true" />
      )}
      {copied ? copiedAction : copyAction}
    </button>
  );
}
