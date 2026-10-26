"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import { SOFTWARE_GUIDE_COPY } from "@/lib/open-source/display-copy";

/** How long "Kopiert" stays on the button. */
const CONFIRM_MS = 1500;

/** Clipboard API first; the selection fallback covers browsers that refuse it. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}

export function CommandCopyButton({
  command,
  label,
  locale = "de",
  className = "",
}: {
  readonly command: string;
  readonly label: string;
  readonly locale?: Locale;
  readonly className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const copyText = SOFTWARE_GUIDE_COPY[locale];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await writeClipboard(command);
    window.clearTimeout(timer.current);
    setCopied(ok);
    if (ok) timer.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  // Confirmed: the button shows its anti colour and says so; the polite
  // live region announces it once.
  const state = copied
    ? "bg-foreground text-background"
    : "bg-background text-foreground hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background active:bg-foreground active:text-background";

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`${label}: ${copied ? copyText.copied : copyText.copy}`}
        className={`inline-flex min-h-11 min-w-[7.25rem] items-center justify-center gap-1.5 border border-foreground px-2.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-100 ${state} ${className}`}
      >
        {copied ? (
          <Check size={12} aria-hidden="true" />
        ) : (
          <Copy size={12} aria-hidden="true" />
        )}
        {copied ? copyText.copied : copyText.copy}
      </button>
      <span role="status" className="sr-only">
        {copied ? `${label}: ${copyText.copied}` : ""}
      </span>
    </>
  );
}
