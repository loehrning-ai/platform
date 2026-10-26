import { expect, test, type Page } from "@playwright/test";
import { countVisibleGlass, expectGlassBudget, glassTextBelowAA } from "./fixtures/glass";

/**
 * Werkglas: the one glass material, on floating chrome over moving visuals.
 * From 1024px the nav floats as glass over the hub, the demos, the workshop
 * and open-source pages; reading pages keep a solid bar; the phone bar never
 * turns translucent. Text on glass reaches 4.5:1 with no credit for the blur,
 * and every accessibility preference falls back to opaque paper.
 */

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

async function surface(page: Page) {
  return page.locator("[data-nav-surface]").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      display: style.display,
      background: style.backgroundColor,
      filter: style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter"),
      radius: style.borderTopLeftRadius,
      // "all 0s" is the browser default and moves nothing; only a timed transition counts.
      transition: style.transitionDuration.split(",").every((value) => parseFloat(value) === 0) ? "none" : style.transitionProperty,
      animation: style.animationName,
      glass: element.classList.contains("glass"),
    };
  });
}

test.describe("Werkglas desktop nav", () => {
  test.use({ viewport: DESKTOP });
  test.skip(({ isMobile }) => isMobile, "the glass bar is the desktop layout");

  for (const path of ["/demos", "/demos/ki-prognosen-einschaetzen", "/en/demos"]) {
    test(`is square glass over moving content on ${path}, text at AA with no credit for blur`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("nav[data-chrome]")).toHaveAttribute("data-chrome", "glass");
      for (const y of [0, 420, 900]) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        const nav = await surface(page);
        expect(nav.glass).toBe(true);
        expect(nav.display).toBe("block");
        expect(nav.background).toBe("rgba(247, 241, 231, 0.8)");
        expect(nav.filter).toContain("blur(16px)");
        expect(nav.radius).toBe("0px");
        expect(nav.transition).not.toMatch(/backdrop|all/);
        expect(nav.animation).toBe("none");
        const { measured, failures } = await glassTextBelowAA(page);
        expect(measured, "text on the nav glass was measured").toBeGreaterThan(3);
        expect(failures, `${path} at y=${y}`).toEqual([]);
        await expectGlassBudget(page, `${path} at y=${y}`);
      }
    });
  }

  test("keeps reading pages on a solid bar", async ({ page }) => {
    for (const path of ["/blog/eu-ai-act-grundlagen", "/impressum", "/workshops/esg-berichte-mit-ki/kit"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("nav[data-chrome]"), path).toHaveAttribute("data-chrome", "paper");
      const nav = await surface(page);
      expect(nav.glass, path).toBe(false);
      expect(nav.background, path).toBe("rgb(247, 241, 231)");
      expect(nav.filter === "none" || nav.filter === "", path).toBe(true);
      expect((await countVisibleGlass(page)).visible, path).toBe(0);
    }
  });

  for (const media of [
    { name: "more contrast", options: { contrast: "more" as const } },
    { name: "forced colours", options: { forcedColors: "active" as const } },
    { name: "print", options: { media: "print" as const } },
  ]) {
    test(`falls back to an opaque bar under ${media.name}`, async ({ page }) => {
      await page.emulateMedia(media.options);
      await page.goto("/demos", { waitUntil: "networkidle" });
      const nav = await surface(page);
      expect(nav.filter === "none" || nav.filter === "").toBe(true);
      expect(nav.background).not.toMatch(/rgba\(.*, 0\.\d+\)/);
    });
  }
});

test.describe("Werkglas on a phone", () => {
  test.use({ viewport: PHONE });

  test("never puts glass on the fixed top bar, and keeps the demo chrome within one surface", async ({ page }) => {
    for (const path of ["/demos", "/demos/audit-vorbereitung-mit-ki?beat=alle-acht", "/demos/geschaeftsberichte-mit-ki-lesen?beat=deine-kennzahl"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      const nav = await surface(page);
      expect(nav.display, path).toBe("none");
      const row = await page.locator("[data-nav-header-row]").evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, filter: style.backdropFilter };
      });
      expect(row.background, path).toBe("rgb(247, 241, 231)");
      expect(row.filter === "none" || row.filter === "", path).toBe(true);
      for (const y of [0, 700, 1400]) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await expectGlassBudget(page, `${path} at y=${y}`);
      }
    }
  });
});
