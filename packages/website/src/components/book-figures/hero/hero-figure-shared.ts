import type { ReactElement } from "react";

/** viewBox of an engine element, for the reserved aspect ratio (no layout shift when the island takes over). */
export function viewBoxOf(node: ReactElement): { readonly w: number; readonly h: number } {
  const raw = String((node.props as { viewBox?: string }).viewBox ?? "0 0 340 340").split(" ").map(Number);
  return { w: raw[2] || 340, h: raw[3] || 340 };
}
