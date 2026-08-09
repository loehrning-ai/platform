"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { trackDemoCta } from "@/lib/analytics";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

export function CopyLinkButton({ slug, locale = "de" }: { slug: string; locale?: Locale }) {
  const [copied, setCopied] = useState(false);
  const copy = DEMOS_PAGE_COPY[locale].share;

  async function handle() {
    const url = `${window.location.origin}${localizeHref(`/demos/${slug}?source=share`, locale)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackDemoCta(slug, "copy-link");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(copy.copyPrompt, url);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-2 border border-foreground/40 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-foreground transition-colors hover:border-foreground hover:bg-card/40"
      aria-label={copy.aria}
    >
      {copied ? (
        <>
          <Check size={12} strokeWidth={2.5} /> {copy.copied}
        </>
      ) : (
        <>
          <Copy size={12} strokeWidth={2.5} /> {copy.copy}
        </>
      )}
    </button>
  );
}
