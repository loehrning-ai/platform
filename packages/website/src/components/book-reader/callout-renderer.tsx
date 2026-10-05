import { Children, type ReactNode } from "react";

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
 * Label → colour mapping. Every callout is a light sheet with ink text
 * (never a dark block: the site has no black grounds); the left rule and a
 * pastel wash carry the type:
 *   Tipp                → border-brand-orange  bg-brand-peach/25
 *   Achtung             → border-amber-600     bg-amber-50
 *   Rechtlicher Hinweis → border-[#C4431A]     bg-[#C4431A]/10   (Kupfer, not red)
 *   Das Wichtigste      → border-foreground    bg-card
 *   Jetzt bist du dran  → border-green-700     bg-brand-acid/30
 *   Prompt-Vorlage      → border-brand-sand    bg-inset font-mono
 *   Begriff             → border-sky-600       bg-brand-sky/30
 *   Navigation          → border-stone-500     bg-card
 *   (fallback)          → border-border        bg-card/20
 */

export interface CalloutStyle {
  readonly border: string;
  readonly bg: string;
  readonly mono?: boolean;
  readonly icon?: string;
}

const CALLOUT_STYLES: Record<
  string,
  CalloutStyle
> = {
  tipp: {
    border: "border-l-4 border-[var(--color-brand-orange)]",
    bg: "bg-brand-peach/25",
    icon: "💡",
  },
  achtung: {
    border: "border-l-4 border-amber-600",
    bg: "bg-amber-50",
    icon: "⚠️",
  },
  "rechtlicher hinweis": {
    border: "border-l-4 border-[#C4431A]",
    bg: "bg-[#C4431A]/10",
    icon: "⚖️",
  },
  "das wichtigste": {
    border: "border-l-4 border-foreground",
    bg: "bg-card",
  },
  "jetzt bist du dran": {
    border: "border-l-4 border-green-700",
    bg: "bg-brand-acid/30",
    icon: "✏️",
  },
  "prompt-vorlage": {
    border: "border-l-4 border-[var(--color-brand-sand)]",
    bg: "bg-inset",
    mono: true,
  },
  begriff: {
    border: "border-l-4 border-sky-600",
    bg: "bg-brand-sky/30",
  },
  navigation: {
    border: "border-l-4 border-stone-500",
    bg: "bg-card",
  },
  hinweis: {
    border: "border-l-4 border-stone-500",
    bg: "bg-card",
  },
  note: {
    border: "border-l-4 border-stone-500",
    bg: "bg-card",
  },
  "kraft-prompt": {
    border: "border-l-4 border-[var(--color-brand-sand)]",
    bg: "bg-inset",
    mono: true,
  },
};

export function resolveCalloutStyle(label: string | null): CalloutStyle | null {
  const labelKey = label?.toLowerCase() ?? null;
  let style = CALLOUT_STYLES[labelKey ?? ""] ?? null;
  if (!style && labelKey) {
    for (const [key, candidate] of Object.entries(CALLOUT_STYLES)) {
      if (labelKey.startsWith(key) || key.startsWith(labelKey)) {
        style = candidate;
        break;
      }
    }
  }
  return style;
}

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
  const renderedChildren = Children.toArray(children);
  const style = resolveCalloutStyle(label);

  if (!style) {
    // Fallback: standard blockquote styling
    return (
      <blockquote className="not-prose my-4 border-l-4 border-border bg-card/20 px-4 py-3 text-sm text-foreground/80 italic">
        {renderedChildren}
      </blockquote>
    );
  }

  return (
    <div
      className={[
        "not-prose my-4 rounded-r px-4 py-3",
        style.border,
        style.bg,
        style.mono ? "font-mono text-xs" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      role="note"
      aria-label={label ?? undefined}
    >
      <div className="text-sm leading-relaxed text-foreground/90">
        {renderedChildren}
      </div>
    </div>
  );
}
