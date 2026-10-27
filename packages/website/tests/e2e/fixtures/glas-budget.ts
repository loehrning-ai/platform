import { expect, type Page } from "@playwright/test";
import { GLAS_DESKTOP_MIN_WIDTH, GLAS_LIVE_BUDGET } from "../../../src/lib/glas";

/**
 * The Glas budget on demo routes: live backdrop-filter layers the visitor can
 * see right now, the site's own nav included (glass-spec, budget). One
 * evaluate, no waits: call it after the page settled.
 */
export async function countLiveGlas(page: Page): Promise<number> {
  return page.evaluate(() => {
    let count = 0;
    for (const element of Array.from(document.querySelectorAll("*"))) {
      const style = getComputedStyle(element);
      const filter = style.backdropFilter || (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter || "none";
      if (!filter || filter === "none") continue;
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth) count += 1;
    }
    return count;
  });
}

/** Fails when more live Glas layers are visible than the viewport's budget allows. */
export async function expectGlasBudget(page: Page, where = "this view"): Promise<void> {
  const width = page.viewportSize()?.width ?? GLAS_DESKTOP_MIN_WIDTH;
  const max = width >= GLAS_DESKTOP_MIN_WIDTH ? GLAS_LIVE_BUDGET.desktop : GLAS_LIVE_BUDGET.phone;
  expect(await countLiveGlas(page), `${where}: live Glas layers`).toBeLessThanOrEqual(max);
}
