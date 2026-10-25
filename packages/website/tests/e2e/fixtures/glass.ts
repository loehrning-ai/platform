import { expect, type Page } from "@playwright/test";

/** Amendment 27: at most two `.glass` surfaces on screen at once. */
export const MAX_VISIBLE_GLASS = 2;

export interface GlassCount {
  /** `.glass` elements that are rendered and intersect the viewport. */
  readonly visible: number;
  /** `.glass` elements with a `.glass` ancestor (must be 0). */
  readonly nested: number;
}

/**
 * Counts the glass surfaces the visitor can see right now. One evaluate, no
 * waits: call it after the page settled, at each scroll position you care
 * about.
 */
export async function countVisibleGlass(page: Page): Promise<GlassCount> {
  return page.evaluate(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>(".glass"));
    const visible = all.filter((element) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return false;
      return box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth;
    }).length;
    const nested = all.filter((element) => element.parentElement?.closest(".glass")).length;
    return { visible, nested };
  });
}

/** Fails when more than two glass surfaces are visible or one sits inside another. */
export async function expectGlassBudget(page: Page, where = "this view"): Promise<void> {
  const count = await countVisibleGlass(page);
  expect(count.nested, `nested .glass on ${where}`).toBe(0);
  expect(count.visible, `visible .glass on ${where}`).toBeLessThanOrEqual(MAX_VISIBLE_GLASS);
}
