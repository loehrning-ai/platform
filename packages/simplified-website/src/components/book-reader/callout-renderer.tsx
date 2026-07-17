"use client";

import type { ReactNode } from "react";

/**
 * callout-renderer.tsx
 *
 * Custom blockquote renderer for the 8 German callout types used in the
 * imported book manuscripts. Receives the blockquote children as rendered
 * ReactNodes (from react-markdown), then reads the first strong-element text
 * to determine which callout type to render.
 *
 * Usage: pass as `components={{ blockquote: CalloutRenderer }}` to ReactMarkdown.
 *
 * Label → colour mapping (book-library import E9):
 *   Tipp                → border-brand-orange  bg-orange-950/40
 *   Achtung             → border-amber-500     bg-amber-950/40
 *   Rechtlicher Hinweis → border-[#C4431A]     bg-[#C4431A]/10   (Kupfer, not red)
 *   Das Wichtigste      → border-stone-400     bg-stone-900/60
 *   Jetzt bist du dran  → border-green-500     bg-green-950/40
 *   Prompt-Vorlage      → border-brand-sand    bg-stone-900/80 font-mono
 *   Begriff             → border-sky-400       bg-sky-950/40
 *   Navigation          → border-stone-600     bg-stone-900/40
 *   (fallback)          → border-border        bg-card/20
 */

const CALLOUT_STYLES: Record<
  string,
  { border: string; bg: string; mono?: boolean; icon?: string }
> = {
  "tipp": {
    border: "border-l-4 border-[var(--color-brand-orange)]",
    bg: "bg-orange-950/40",
    icon: "💡",
  },
  "achtung": {
    border: "border-l-4 border-amber-500",
    bg: "bg-amber-950/40",
    icon: "⚠️",
  },
  "rechtlicher hinweis": {
    border: "border-l-4 border-[#C4431A]",
    bg: "bg-[#C4431A]/10",
    icon: "⚖️",
  },
  "das wichtigste": {
    border: "border-l-4 border-stone-400",
    bg: "bg-stone-900/60",
  },
  "jetzt bist du dran": {
    border: "border-l-4 border-green-500",
    bg: "bg-green-950/40",
    icon: "✏️",
  },
  "prompt-vorlage": {
    border: "border-l-4 border-[var(--color-brand-sand)]",
    bg: "bg-stone-900/80",
    mono: true,
  },
  "begriff": {
    border: "border-l-4 border-sky-400",
    bg: "bg-sky-950/40",
  },
  "navigation": {
    border: "border-l-4 border-stone-600",
    bg: "bg-stone-900/40",
  },
  "hinweis": {
    border: "border-l-4 border-stone-500",
    bg: "bg-stone-900/40",
  },
  "kraft-prompt": {
    border: "border-l-4 border-[var(--color-brand-sand)]",
    bg: "bg-stone-900/80",
    mono: true,
  },
};

/** Extract the label text from the first strong element in blockquote children. */
function extractLabel(children: ReactNode): string | null {
  // Recursively search through ReactNode tree for first <strong> text
  function search(node: ReactNode): string | null {
    if (!node) return null;
    if (typeof node === "string" || typeof node === "number") return null;
    if (typeof node !== "object") return null;

    // Check if it's a React element
    const el = node as { type?: unknown; props?: { children?: ReactNode } };
    if (el.type === "strong" && el.props?.children) {
      const text = extractText(el.props.children);
      if (text.endsWith(":")) return text.slice(0, -1).trim();
      return text.trim();
    }
    if (el.props?.children) {
      return search(el.props.children);
    }
    if (Array.isArray(node)) {
      for (const child of node) {
        const result = search(child);
        if (result) return result;
      }
    }
    return null;
  }

  return search(children);
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  const el = node as { props?: { children?: ReactNode } } | null;
  if (el?.props?.children) return extractText(el.props.children);
  return "";
}

interface CalloutRendererProps {
  readonly children?: ReactNode;
}

export function CalloutRenderer({ children }: CalloutRendererProps) {
  const label = extractLabel(children);
  const labelKey = label?.toLowerCase() ?? null;

  // Find matching style by prefix match (handles "KRAFT-Prompt: ..." etc.)
  let style = CALLOUT_STYLES[labelKey ?? ""] ?? null;
  if (!style && labelKey) {
    // Try prefix match for compound labels
    for (const [key, val] of Object.entries(CALLOUT_STYLES)) {
      if (labelKey.startsWith(key) || key.startsWith(labelKey)) {
        style = val;
        break;
      }
    }
  }

  if (!style) {
    // Fallback: standard blockquote styling
    return (
      <blockquote className="not-prose my-4 border-l-4 border-border bg-card/20 px-4 py-3 text-sm text-foreground/80 italic">
        {children}
      </blockquote>
    );
  }

  return (
    <div
      className={`not-prose my-4 rounded-r px-4 py-3 ${style.border} ${style.bg} ${style.mono ? "font-mono text-xs" : ""}`}
      role="note"
      aria-label={label ?? undefined}
    >
      <div className="text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </div>
  );
}
