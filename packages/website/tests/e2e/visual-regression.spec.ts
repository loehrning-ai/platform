/**
 * Visual smoke tests for the reputation/open-source program.
 *
 * The 040-047 implementation intentionally changes above-the-fold composition,
 * navigation labels, legal copy, and public resource framing. Pixel baselines
 * from the older commercial/auth model are not a useful gate here. These tests
 * keep browser rendering coverage without treating planned layout/copy changes
 * as regressions.
 */

import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";

interface ScreenshotStats {
  readonly uniqueColorBuckets: number;
  readonly luminanceRange: number;
  readonly luminanceStdDev: number;
  readonly dominantColorRatio: number;
  readonly edgeRatio: number;
  readonly opaqueRatio: number;
}

async function screenshotStats(
  screenshot: Buffer,
): Promise<ScreenshotStats> {
  const { data } = await sharp(screenshot)
    .resize(64, 64, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bucketCounts = new Map<number, number>();
  const luminances: number[] = [];
  let opaque = 0;
  let minLuminance = 255;
  let maxLuminance = 0;
  let luminanceSum = 0;
  let luminanceSquaredSum = 0;
  const pixelCount = data.length / 4;

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];
    if (alpha >= 250) opaque += 1;
    const bucket = (red >> 5) * 64 + (green >> 5) * 8 + (blue >> 5);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    luminances.push(luminance);
    minLuminance = Math.min(minLuminance, luminance);
    maxLuminance = Math.max(maxLuminance, luminance);
    luminanceSum += luminance;
    luminanceSquaredSum += luminance * luminance;
  }

  let edgePairs = 0;
  let contrastingEdges = 0;
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const index = y * 64 + x;
      if (x > 0) {
        edgePairs += 1;
        if (Math.abs(luminances[index] - luminances[index - 1]) >= 12) {
          contrastingEdges += 1;
        }
      }
      if (y > 0) {
        edgePairs += 1;
        if (Math.abs(luminances[index] - luminances[index - 64]) >= 12) {
          contrastingEdges += 1;
        }
      }
    }
  }

  const mean = luminanceSum / pixelCount;
  const variance = Math.max(
    0,
    luminanceSquaredSum / pixelCount - mean * mean,
  );
  return {
    uniqueColorBuckets: bucketCounts.size,
    luminanceRange: maxLuminance - minLuminance,
    luminanceStdDev: Math.sqrt(variance),
    dominantColorRatio: Math.max(...bucketCounts.values()) / pixelCount,
    edgeRatio: contrastingEdges / edgePairs,
    opaqueRatio: opaque / pixelCount,
  };
}

async function assertVisualSmoke(page: Page, route: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route, { waitUntil: "load" });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
  await page.locator('html[data-hydrated="true"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  const visibleContentRegions = await page
    .locator("main h1, main h2, main p, main a, main button, main img")
    .evaluateAll((elements) =>
      elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width >= 2 &&
          rect.height >= 2 &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          style.display !== "none" &&
          style.visibility === "visible" &&
          Number(style.opacity) > 0.05
        );
      }).length,
    );
  expect(
    visibleContentRegions,
    `${route} must render multiple meaningful regions in the viewport`,
  ).toBeGreaterThanOrEqual(2);

  const shot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
  });
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const deviceScaleFactor = await page.evaluate(() => window.devicePixelRatio);
  expect(shot.subarray(1, 4).toString("ascii")).toBe("PNG");
  expect(shot.readUInt32BE(16)).toBe(
    Math.round(viewport!.width * deviceScaleFactor),
  );
  expect(shot.readUInt32BE(20)).toBe(
    Math.round(viewport!.height * deviceScaleFactor),
  );
  expect(
    shot.byteLength,
    `${route} screenshot must contain more than a blank PNG`,
  ).toBeGreaterThan(10_000);

  const stats = await screenshotStats(shot);
  expect(
    stats.uniqueColorBuckets,
    `${route} screenshot must contain meaningful color variation`,
  ).toBeGreaterThanOrEqual(8);
  expect(
    stats.luminanceRange,
    `${route} screenshot must contain meaningful light/dark contrast`,
  ).toBeGreaterThanOrEqual(40);
  expect(
    stats.luminanceStdDev,
    `${route} screenshot must contain meaningful luminance variation`,
  ).toBeGreaterThanOrEqual(8);
  expect(
    stats.dominantColorRatio,
    `${route} screenshot must not collapse to one dominant flat color`,
  ).toBeLessThan(0.95);
  expect(
    stats.edgeRatio,
    `${route} screenshot must contain visible spatial structure`,
  ).toBeGreaterThan(0.01);
  expect(
    stats.opaqueRatio,
    `${route} screenshot must be effectively opaque`,
  ).toBeGreaterThan(0.99);
}

test.describe("visual smoke - public pages", () => {
  test("homepage / above the fold", async ({ page }) => {
    await assertVisualSmoke(page, "/");
  });

  test("/kurse", async ({ page }) => {
    await assertVisualSmoke(page, "/kurse");
  });

  test("/ki-fuehrerschein", async ({ page }) => {
    await assertVisualSmoke(page, "/ki-fuehrerschein");
  });

  test("/buecher", async ({ page }) => {
    await assertVisualSmoke(page, "/buecher");
  });

  test("/demos", async ({ page }) => {
    await assertVisualSmoke(page, "/demos");
  });

  test("/impressum", async ({ page }) => {
    await assertVisualSmoke(page, "/impressum");
  });

  test("/datenschutz", async ({ page }) => {
    await assertVisualSmoke(page, "/datenschutz");
  });
});

test.describe("visual smoke - mobile pages", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage / mobile", async ({ page }) => {
    await assertVisualSmoke(page, "/");
  });

  test("/kurse mobile", async ({ page }) => {
    await assertVisualSmoke(page, "/kurse");
  });
});

test.describe("reviewed desktop pixel baselines", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    contextOptions: { reducedMotion: "reduce" },
  });
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
    "portable reviewed baselines run once in desktop Chromium",
  );

  for (const [name, route] of [
    ["courses", "/kurse"],
    ["books", "/buecher"],
    ["open-source", "/open-source"],
    ["legal", "/impressum"],
  ] as const) {
    test(`${route} matches its reviewed viewport`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await page.locator('html[data-hydrated="true"]').waitFor();
      await expect(page.locator("h1").first()).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });

      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      });
    });
  }
});
