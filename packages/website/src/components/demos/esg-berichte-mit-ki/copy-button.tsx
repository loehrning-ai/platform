"use client";

import { useState } from "react";
import { GlasButton } from "@/components/demos/glas";

/** Copies a text to the clipboard and says so on the button. */
export function CopyButton({ text, label, done, variant = "fill", data }: { readonly text: string; readonly label: string; readonly done: string; readonly variant?: "fill" | "plain" | "prominent"; readonly data?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <GlasButton
      variant={variant}
      size="compact"
      icon={copied ? "check" : "copy"}
      data-w4-copy={data}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
    >
      {copied ? done : label}
    </GlasButton>
  );
}
