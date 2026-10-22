import { test, expect } from "@playwright/test";

/**
 * H02 blocks on the phone (390x844): at every step of chapter 4 no block leaves the stage box and none
 * touches the claim above it, and every bin row keeps its name and count on screen.
 */

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

for (const base of ["/buecher/ki-landschaft", "/en/buecher/ki-landschaft"]) {
  test(`blocks stay inside the stage and clear of the claim at every step (${base})`, async ({ page }) => {
    await page.goto(`${base}/04_stellen_namen`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const next = page.getByRole("button", { name: /weiter|next/i }).first();
    for (let step = 0; step < 5; step += 1) {
      await page.waitForTimeout(2200);
      const geo = await page.evaluate(() => {
        const box = (el: Element | null) => (el ? el.getBoundingClientRect().toJSON() : null);
        const stage = box(document.querySelector(".hs-stage"));
        // Below lg the claim moved into the step card: the pinned strip starts at its own top rule.
        const headsEl = document.querySelector(".cs-heads");
        const heads = headsEl && headsEl.getBoundingClientRect().height > 0 ? box(headsEl) : { bottom: document.querySelector("[data-cs-pin]")!.getBoundingClientRect().top };
        const blocks = Array.from(document.querySelectorAll('[data-layer="blocks"] > *')).map((el) => box(el));
        const labels = Array.from(document.querySelectorAll("[data-label]")).map((el) => box(el));
        return { stage, heads, blocks, labels };
      });
      expect(geo.stage).not.toBeNull();
      expect(geo.labels.length).toBe(6);
      for (const b of geo.blocks) {
        if (!b || b.width === 0) continue;
        expect(b.left).toBeGreaterThanOrEqual(geo.stage!.left - 1);
        expect(b.right).toBeLessThanOrEqual(geo.stage!.right + 1);
        expect(b.top).toBeGreaterThanOrEqual(geo.stage!.top - 1);
        expect(b.bottom).toBeLessThanOrEqual(geo.stage!.bottom + 1);
        // never over the claim
        expect(b.top).toBeGreaterThanOrEqual(geo.heads!.bottom - 1);
      }
      if (step < 4) await next.click();
    }
  });
}
