import { expect, test, type Page } from "@playwright/test";
import { chapterPath } from "./fixtures/book";

/**
 * Regression of the clipped stage numeral: "46 %" (chapter 1) lost its "%" beside the figure because the
 * numeral was fitted by a character count, not by the width of its box. Every step of the stage must hold
 * its numeral and its claim whole inside the head box, at a phone width and beside the figure.
 * (The full sweep over all chapters, widths and steps is a scratch detector, not part of the smoke list.)
 */

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

async function overflowOfHeads(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const stage = document.querySelector("[data-chapter-stage]")!;
    const heads = stage.querySelector<HTMLElement>(".cs-heads")!;
    const box = heads.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(heads).paddingRight) || 0;
    for (const el of Array.from(stage.querySelectorAll<HTMLElement>("[data-cs-numeral], [data-cs-claim]"))) {
      if (getComputedStyle(el.parentElement!).visibility === "hidden") continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const r of Array.from(range.getClientRects())) {
        if (r.right > box.right - pad + 1) out.push(`${el.textContent} right +${Math.round(r.right - (box.right - pad))}px`);
        if (r.bottom > box.bottom + 1) out.push(`${el.textContent} bottom +${Math.round(r.bottom - box.bottom)}px`);
      }
    }
    return out;
  });
}

for (const viewport of VIEWPORTS) {
  test(`the stage numeral and claim stay whole at ${viewport.width}px, on every step`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(chapterPath("01_zweimal_gemessen"), { waitUntil: "load" });
    const stage = page.locator("[data-chapter-stage]").first();
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute("data-mode", "scrub");
    const steps = Number(await stage.getAttribute("data-steps"));
    for (let i = 0; i < steps; i += 1) await stage.evaluate((el) => el.querySelector<HTMLElement>('[data-cs="prev"]')?.click());
    for (let i = 0; i < steps; i += 1) {
      await expect(stage).toHaveAttribute("data-step", String(i));
      await page.waitForTimeout(900);
      expect(await overflowOfHeads(page), `step ${i + 1}`).toEqual([]);
      await stage.evaluate((el) => el.querySelector<HTMLElement>('[data-cs="next"]')?.click());
    }
    // The finished step reads "46 %" with its sign.
    await expect(page.locator(".cs-head[data-for='2'] [data-cs-numeral]")).toContainText("%");
  });
}
