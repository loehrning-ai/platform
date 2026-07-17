"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { trackDemoCta } from "@/lib/analytics";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    const url = `${window.location.origin}/demos/${slug}?source=share`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackDemoCta(slug, "copy-link");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Link kopieren:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-2 border border-foreground/40 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-foreground transition-colors hover:border-foreground hover:bg-card/40"
      aria-label="Link zu diesem Praxisbeispiel kopieren"
    >
      {copied ? (
        <>
          <Check size={12} strokeWidth={2.5} /> Kopiert
        </>
      ) : (
        <>
          <Copy size={12} strokeWidth={2.5} /> Link kopieren
        </>
      )}
    </button>
  );
}
