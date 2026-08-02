"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CommandCopyButton({
  command,
  label,
}: {
  readonly command: string;
  readonly label: string;
}) {
  const [copied, setCopied] = useState(false);

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
      aria-label={copied ? `${label} kopiert` : `${label} kopieren`}
      className="inline-flex min-h-9 items-center gap-1.5 border border-border bg-background px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}
