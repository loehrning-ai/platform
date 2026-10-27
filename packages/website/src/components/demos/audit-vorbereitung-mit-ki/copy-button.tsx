"use client";

import { useState } from "react";
import { GlasButton } from "@/components/demos/glas";

/** Copies a text to the clipboard; the label says when it worked. */
export function CopyButton({ text, label, done, variant = "fill" }: { readonly text: string; readonly label: string; readonly done: string; readonly variant?: "fill" | "plain" | "prominent" }) {
  const [copied, setCopied] = useState<string | null>(null);
  const shown = copied === text;
  return (
    <GlasButton
      variant={variant}
      size="compact"
      icon={shown ? "check" : "copy"}
      data-w05-copy=""
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setCopied(text),
          () => setCopied(null),
        );
      }}
    >
      {shown ? done : label}
    </GlasButton>
  );
}
