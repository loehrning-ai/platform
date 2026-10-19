/**
 * DOM measuring for the overlay hit areas and the sort animation. Everything
 * here reads the rendered SVG; nothing knows a figure kind. Elements the
 * engine marks with data-id are the things a reader can point at.
 */

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface Measured {
  readonly el: Element;
  readonly box: Box;
}

/** Smallest touch target, in CSS px. */
export const MIN_TARGET = 44;
/** Length of the sort animation, within the 120 to 200 ms learner-triggered window. */
export const FLIP_MS = 180;

/** Position of every data-id element of the visible SVG, relative to the stage. */
export function measure(stage: HTMLElement): Map<string, Measured> {
  const out = new Map<string, Measured>();
  const svg = stage.querySelector("svg");
  if (!svg) return out;
  const origin = stage.getBoundingClientRect();
  svg.querySelectorAll("[data-id]").forEach((el) => {
    const id = el.getAttribute("data-id");
    if (!id || out.has(id)) return;
    const r = el.getBoundingClientRect();
    out.set(id, {
      el,
      box: { left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height },
    });
  });
  return out;
}

/** The box widened around its centre to at least `min` in both directions. */
export function atLeast(box: Box, min = MIN_TARGET): Box {
  const width = Math.max(box.width, min);
  const height = Math.max(box.height, min);
  return {
    left: box.left - (width - box.width) / 2,
    top: box.top - (height - box.height) / 2,
    width,
    height,
  };
}

/** Writes the measured boxes onto the hit buttons (data-hit), at least 44px each. */
export function placeHits(stage: HTMLElement, measured: ReadonlyMap<string, Measured>): void {
  stage.querySelectorAll<HTMLElement>("[data-hit]").forEach((button) => {
    const id = button.dataset["hit"];
    const found = id ? measured.get(id) : undefined;
    if (!found) {
      button.style.display = "none";
      return;
    }
    const box = atLeast(found.box);
    button.style.display = "";
    button.style.left = `${Math.round(box.left)}px`;
    button.style.top = `${Math.round(box.top)}px`;
    button.style.width = `${Math.round(box.width)}px`;
    button.style.height = `${Math.round(box.height)}px`;
  });
}

/** SVG user units per CSS pixel of the visible SVG. */
export function unitsPerPixel(stage: HTMLElement): number {
  const svg = stage.querySelector("svg");
  const view = svg?.viewBox?.baseVal;
  const width = svg?.getBoundingClientRect().width ?? 0;
  return view && view.width > 0 && width > 0 ? view.width / width : 1;
}

/**
 * First, Last, Invert, Play for rows that moved: each glides from where it was
 * to where it is. Transform only, one short animation per row.
 */
export function glide(
  before: ReadonlyMap<string, Box>,
  after: ReadonlyMap<string, Measured>,
  unitsPerPx: number,
): number {
  let moved = 0;
  after.forEach(({ el, box }, id) => {
    const was = before.get(id);
    if (!was || typeof (el as Element).animate !== "function") return;
    const dx = (was.left - box.left) * unitsPerPx;
    const dy = (was.top - box.top) * unitsPerPx;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    moved += 1;
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: FLIP_MS, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
  });
  return moved;
}
