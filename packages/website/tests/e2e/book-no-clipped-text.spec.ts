import { expect, test, type Page } from "@playwright/test";
import { chapterPath } from "./fixtures/book";

/**
 * Regression of the clipped stage numeral: "46 %" (chapter 1) lost its "%" beside the figure because the
 * numeral was fitted by a character count, not by the width of its box. Every step of the stage must hold
 * its numerals and its claim whole inside their boxes, at a phone width and beside the figure.
 * (The full sweep over all chapters, widths and steps is a scratch detector, not part of the smoke list.)
 */

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

/**
 * Each numeral and claim must sit whole inside its own box: the pinned numeral inside the head box (beside the
 * figure; hidden below lg), the step numeral and the claim inside their step card (every width).
 */
async function overflowOfHeads(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const stage = document.querySelector("[data-chapter-stage]")!;
    const targets = Array.from(stage.querySelectorAll<HTMLElement>("[data-cs-numeral], .cs-step-numeral, [data-cs-claim]"));
    for (const el of targets) {
      if (getComputedStyle(el.parentElement!).visibility === "hidden") continue;
      const own = el.getBoundingClientRect();
      if (own.width === 0 && own.height === 0) continue;
      const holder = el.closest<HTMLElement>(".cs-heads, .cs-card")!;
      const box = holder.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(holder).paddingRight) || 0;
      const range = document.createRange();
      range.selectNodeContents(el);
      // A numeral is set at line-height 0.88: its font's content area reaches below the line box, its ink (digits
      // and "%", no descenders) does not. Its bottom is the line box; a claim's bottom is its text.
      const numeral = !el.hasAttribute("data-cs-claim");
      for (const r of Array.from(range.getClientRects())) {
        const bottom = numeral ? own.bottom : r.bottom;
        if (r.right > box.right - pad + 1) out.push(`${el.textContent} right +${Math.round(r.right - (box.right - pad))}px`);
        if (bottom > box.bottom + 1) out.push(`${el.textContent} bottom +${Math.round(bottom - box.bottom)}px`);
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
