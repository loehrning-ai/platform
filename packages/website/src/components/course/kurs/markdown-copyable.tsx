"use client";

import { useState, type JSX, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client island for MarkdownRenderer's `copyable` feature: the clipboard
 * button needs useState + navigator.clipboard, so it lives in its own
 * "use client" module while the markdown body renders on the server.
 */

/** Extracts a string of text from a ReactNode tree. */
function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (typeof node === "object" && "props" in node) {
    return nodeToText(
      (node as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

function CopyButton({
  target,
  className,
}: {
  readonly target: () => string;
  readonly className?: string;
}): JSX.Element {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const text = target().trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard not available: silently fail */
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Kopiert" : "Prompt kopieren"}
      className={cn(
        "inline-flex items-center gap-1 border border-border bg-background/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
        className,
      )}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{copied ? "Kopiert" : "Kopieren"}</span>
    </button>
  );
}

export function CopyablePre({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <div className="relative mb-4 group">
      <pre className="overflow-x-auto">{children}</pre>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <CopyButton target={() => nodeToText(children)} />
      </div>
    </div>
  );
}

export function CopyableBlockquote({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  const text = nodeToText(children).trim();
  // Only decorate blockquotes that look like prompts (>= 20 chars). Skip tiny
  // decorative quotes.
  const looksLikePrompt = text.length >= 20;
  return (
    <div className="relative mb-4 group">
      <blockquote className="border-l-2 border-brand-orange pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
      {looksLikePrompt && (
        <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <CopyButton target={() => text} />
        </div>
      )}
    </div>
  );
}
