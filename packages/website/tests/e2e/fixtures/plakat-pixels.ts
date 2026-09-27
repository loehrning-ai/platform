import { expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { settleFontsAndFrame } from "./settle";

/**
 * Shared pixel tools for the poster-scene checks (SPEC §3.9, §8.3):
 * `plakat-contrast.spec.ts` samples the ground under band text and
 * `plakat-focus.spec.ts` samples focus rings against their neighbours.
 *
 * Colours are read from real screenshots, never from tokens, so a shape,
 * halftone or canvas behind the text counts exactly as a reader sees it.
 */

export type Rgb = readonly [number, number, number];

/** The routes §8.3 names. Every one of them opens with a poster band. */
export const PLAKAT_ROUTES = [
  "/",
  "/workshops",
  "/workshops/ki-prognosen-einschaetzen",
  "/workshops/geschaeftsberichte-mit-ki-lesen",
  "/workshops/datenbereitschaft-fuer-ki",
  "/workshops/esg-berichte-mit-ki",
  "/kurse",
  "/demos",
  "/blog",
  "/ki-fuehrerschein",
  "/kurse/open-source/claude",
] as const;

/** §8.3 viewports: the phone in the mobile project, desktop otherwise. */
export function plakatViewport(isMobile: boolean) {
  return isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
}

/** Bands and posters whose text the checks cover. */
export const BAND_SELECTOR = "[data-cover-band], [data-plakat-band]";
export const POSTER_SELECTOR = "[data-poster]";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio. */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function blend(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) =>
    Math.round(fg[i] * alpha + bg[i] * (1 - alpha)),
  ) as unknown as Rgb;
}

export function hex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export interface RawImage {
  readonly width: number;
  readonly height: number;
  readonly data: Buffer;
}

export async function decodePng(png: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

export function pixel(image: RawImage, x: number, y: number): Rgb | null {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || py < 0 || px >= image.width || py >= image.height) return null;
  const offset = (py * image.width + px) * 3;
  return [image.data[offset], image.data[offset + 1], image.data[offset + 2]];
}

/** Colour share inside a device-pixel box, most common first. */
export function colourShares(
  image: RawImage,
  box: { x0: number; y0: number; x1: number; y1: number },
): Array<{ colour: Rgb; share: number }> {
  const counts = new Map<number, number>();
  let total = 0;
  const x0 = Math.max(0, Math.floor(box.x0));
  const y0 = Math.max(0, Math.floor(box.y0));
  const x1 = Math.min(image.width, Math.ceil(box.x1));
  const y1 = Math.min(image.height, Math.ceil(box.y1));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * image.width + x) * 3;
      const key =
        (image.data[offset] << 16) |
        (image.data[offset + 1] << 8) |
        image.data[offset + 2];
      counts.set(key, (counts.get(key) ?? 0) + 1);
      total += 1;
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      colour: [(key >> 16) & 255, (key >> 8) & 255, key & 255] as Rgb,
      share: count / Math.max(1, total),
    }));
}

/**
 * Open a route in its final state: hydrated, fonts settled, reduced motion
 * (the static globe frame), scrolled to the top.
 */
export async function openPlakatRoute(
  page: Page,
  route: string,
  isMobile: boolean,
): Promise<void> {
  await page.setViewportSize(plakatViewport(isMobile));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto(route, { waitUntil: "load" });
  expect(response?.status(), `${route} must answer 200`).toBe(200);
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await expect(page.locator("h1").first()).toBeVisible();
  await settleFontsAndFrame(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settleFontsAndFrame(page);
}
