import type { ReactNode } from "react";
import type { Outcome } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";

interface GlyphProps {
  readonly className?: string;
}

function Svg({ className, children }: GlyphProps & { readonly children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className ?? "fr-glyph"}
    >
      {children}
    </svg>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.5l4 4 8-9" />
    </Svg>
  );
}

export function CrossGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M5 5l10 10M15 5L5 15" />
    </Svg>
  );
}

/** Slipped through: an arrow passing a gate bar. */
export function SlipGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M10 3v14" strokeWidth="1.5" />
      <path d="M3 6l12 8M15 9v5h-5" />
    </Svg>
  );
}

/** Held for nothing: two bars. */
export function PauseGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M7 4v12M13 4v12" />
    </Svg>
  );
}

export function MinusGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M4 10h12" />
    </Svg>
  );
}

export function PlusGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M4 10h12M10 4v12" />
    </Svg>
  );
}

export function OutcomeGlyph({ outcome, className }: GlyphProps & { readonly outcome: Outcome }) {
  switch (outcome) {
    case "right":
      return <CheckGlyph className={className} />;
    case "missed":
      return <SlipGlyph className={className} />;
    case "needless":
      return <PauseGlyph className={className} />;
    case "wrongStep":
      return <CrossGlyph className={className} />;
  }
}
