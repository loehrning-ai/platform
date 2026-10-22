"use client";

import { useEffect, useRef, useState } from "react";

/** Copies with the Clipboard API, else through a hidden textarea. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback (insecure context, denied permission).
  }
  // select() moves focus into the textarea; give it back to the button afterwards.
  const previous = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    area.style.pointerEvents = "none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand?.("copy") ?? false;
    area.remove();
    previous?.focus?.({ preventScroll: true });
    return ok;
  } catch {
    previous?.focus?.({ preventScroll: true });
    return false;
  }
}

interface Props {
  readonly text: string;
  readonly title: string;
  readonly label: string;
  readonly copiedLabel: string;
  /** Speaks through the section's polite live region. */
  readonly onResult: (ok: boolean, title: string) => void;
}

/** "Kopieren", then "Kopiert" for 2 s. The live region in the parent announces it. */
export function CopyButton({ text, title, label, copiedLabel, onResult }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      className="fr-btn fr-btn-copy"
      data-copied={copied ? "" : undefined}
      aria-label={`${copied ? copiedLabel : label}: ${title}`}
      onClick={async () => {
        const ok = await copyText(text);
        onResult(ok, title);
        if (!ok) return;
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
