"use client";

import { useState } from "react";
import { copyText } from "./copy-button";
import { TAKEHOME_BUTTON } from "./styles";

/**
 * "Link an dich schicken": the system share sheet where there is one (phones),
 * otherwise the link is copied. Shares only the page address, never data.
 */
export function ShareLink({
  label,
  copiedLabel,
  title,
}: {
  readonly label: string;
  readonly copiedLabel: string;
  readonly title: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={TAKEHOME_BUTTON}
      data-share-link=""
      onClick={async () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        if (typeof navigator.share === "function") {
          try {
            await navigator.share({ title, url });
            return;
          } catch (error) {
            if ((error as DOMException)?.name === "AbortError") return;
          }
        }
        if (await copyText(url)) setCopied(true);
      }}
    >
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
