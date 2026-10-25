"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/components/werk/cx";
import { TAKEHOME_BUTTON } from "./styles";

/** Writes text to the clipboard, falling back to a hidden textarea where the API is missing. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea path
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/** One copy button: the label turns to "Kopiert" / "Copied" for two seconds after a copy. */
export function CopyButton({
  text,
  label,
  doneLabel,
  className,
}: {
  readonly text: string;
  readonly label: string;
  readonly doneLabel: string;
  readonly className?: string;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={cx(TAKEHOME_BUTTON, className)}
      data-copy-button=""
      onClick={async () => {
        const ok = await copyText(text);
        if (!ok) return;
        setDone(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setDone(false), 2000);
      }}
    >
      <span aria-live="polite">{done ? doneLabel : label}</span>
    </button>
  );
}
