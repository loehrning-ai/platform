"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import { SOFTWARE_GUIDE_COPY } from "@/lib/open-source/display-copy";

export function CommandCopyButton({
  command,
  label,
  locale = "de",
}: {
  readonly command: string;
  readonly label: string;
  readonly locale?: Locale;
}) {
  const [copied, setCopied] = useState(false);
  const copyText = SOFTWARE_GUIDE_COPY[locale];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={
        copied ? `${label}: ${copyText.copied}` : `${label}: ${copyText.copy}`
      }
      className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-background px-2.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      {copied ? (
        <Check size={12} aria-hidden="true" />
      ) : (
        <Copy size={12} aria-hidden="true" />
      )}
      {copied ? copyText.copied : copyText.copy}
    </button>
  );
}
