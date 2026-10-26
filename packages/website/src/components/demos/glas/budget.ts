/**
 * The live backdrop-filter budget (glass-spec 7): at most 3 live glass
 * surfaces on a phone and 5 on a desktop visible at the same time, counting
 * the site's own Werkglas nav, and together at most 40 % of the viewport.
 * Surfaces claim a slot with a priority; the rest are painted in frost (a
 * static copy of the field, no filter), so going over budget never shows.
 */

import { GLAS_DESKTOP_MIN_WIDTH, GLAS_LIVE_BUDGET, GLAS_MAX_AREA_SHARE } from "@/lib/glas";

/** Who gets a live slot first. A builder passes one of these, or a number, as `live` on a panel. */
export const GLAS_PRIORITY = { sheet: 50, intro: 45, dock: 40, caption: 30, readout: 20, panel: 10, chip: 5 } as const;

export interface LiveClaim {
  readonly id: string;
  readonly priority: number;
  /** Intersects the viewport right now. */
  readonly visible: boolean;
  /** Area in CSS pixels. */
  readonly area: number;
}

export interface BudgetLimits {
  /** Live surfaces allowed for this viewport (GLAS_LIVE_BUDGET). */
  readonly budget: number;
  /** Live surfaces outside Glas that already count (the desktop nav). */
  readonly reserved: number;
  readonly viewportArea: number;
  readonly maxShare?: number;
}

/** The live budget for a viewport width. */
export function budgetForWidth(width: number): number {
  return width >= GLAS_DESKTOP_MIN_WIDTH ? GLAS_LIVE_BUDGET.desktop : GLAS_LIVE_BUDGET.phone;
}

/**
 * Pure: the ids that may use a live filter. Visible claims only, highest
 * priority first (ties by id, so the result is stable), while the count stays
 * within budget minus reserved and the area within the share of the viewport.
 */
export function allocateLiveLayers(claims: readonly LiveClaim[], limits: BudgetLimits): ReadonlySet<string> {
  const slots = Math.max(0, limits.budget - limits.reserved);
  const maxArea = limits.viewportArea * (limits.maxShare ?? GLAS_MAX_AREA_SHARE);
  const ordered = claims
    .filter((claim) => claim.visible)
    .sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const live = new Set<string>();
  let area = 0;
  for (const claim of ordered) {
    if (live.size >= slots) break;
    if (area + claim.area > maxArea) continue;
    live.add(claim.id);
    area += claim.area;
  }
  return live;
}

/** True when an element paints a live backdrop-filter and the visitor can see it. */
export function isLiveBackdrop(element: Element, view: Window = window): boolean {
  const style = view.getComputedStyle(element);
  const filter = style.backdropFilter || (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter || "none";
  if (!filter || filter === "none") return false;
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
  const box = element.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return false;
  return box.bottom > 0 && box.right > 0 && box.top < view.innerHeight && box.left < view.innerWidth;
}

/**
 * Counts the live backdrop-filter layers in a document, optionally only those
 * outside a selector (the Glas root counts the site's Werkglas this way).
 */
export function countLiveBackdropLayers(doc: Document = document, outside?: string): number {
  const view = doc.defaultView ?? window;
  let count = 0;
  for (const element of Array.from(doc.querySelectorAll("*"))) {
    if (outside && element.closest(outside)) continue;
    if (isLiveBackdrop(element, view)) count += 1;
  }
  return count;
}
