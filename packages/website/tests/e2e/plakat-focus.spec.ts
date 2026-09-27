/**
 * Poster scenes: focus rings on every band control (SPEC §3.9, §8.3).
 *
 * The ring follows the ground: each scope redefines `--color-brand-orange`,
 * so the global 3px outline is Butter, Kobalt, Aubergine or Creme in a band.
 * Lighthouse does not audit this, so the check tabs through each band with
 * the keyboard, screenshots every focused control and samples the pixels:
 *
 * - along the middle of the ring, which must be painted in the computed
 *   outline colour (so a ring still fading in from the ground, or clipped by
 *   the band, fails), and
 * - right next to the ring on the side it separates from: outside for an
 *   outset ring, inside for an inset ring (the §3.9 edge rule, used where the
 *   outside of the ring would land on paper).
 *
 * Ring against that neighbour must be at least 3:1 (WCAG 1.4.11 / 2.4.13).
 * Desktop Chromium at 1440x900 and mobile Chromium at 390x844.
 */

import { expect, test } from "@playwright/test";
import {
  BAND_SELECTOR,
  PLAKAT_ROUTES,
  contrast,
  decodePng,
  hex,
  openPlakatRoute,
  pixel,
  type RawImage,
  type Rgb,
} from "./fixtures/plakat-pixels";

/** §9 row 11 names one demo detail beside the §8.3 routes. */
const FOCUS_ROUTES = [...PLAKAT_ROUTES, "/demos/excel"] as const;
const MAX_TABS = 90;
/** Longer than any colour transition a button could still carry (120ms). */
const RING_SETTLE_MS = 250;
/** Two channels of rounding and anti-aliasing slack for "painted as computed". */
const PAINT_TOLERANCE = 24;

interface Ring {
  readonly label: string;
  readonly inBand: boolean;
  readonly owner: string | null;
  readonly colour: [number, number, number, number];
  readonly width: number;
  readonly offset: number;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly dpr: number;
}

function mode(samples: Rgb[]): Rgb | null {
  const counts = new Map<string, { colour: Rgb; n: number }>();
  for (const sample of samples) {
    const key = sample.join(",");
    const entry = counts.get(key) ?? { colour: sample, n: 0 };
    entry.n += 1;
    counts.set(key, entry);
  }
  let best: { colour: Rgb; n: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.n > best.n) best = entry;
  }
  return best?.colour ?? null;
}

/** Points at `distance` CSS px outside (negative: inside) the owner box. */
function sampleAt(image: RawImage, ring: Ring, distance: number): Rgb[] {
  const out: Rgb[] = [];
  const { left, top, right, bottom, dpr } = ring;
  for (let i = 0; i <= 10; i += 1) {
    const t = 0.2 + (0.6 * i) / 10;
    const x = left + (right - left) * t;
    const y = top + (bottom - top) * t;
    for (const [px, py] of [
      [x, top - distance],
      [x, bottom + distance],
      [left - distance, y],
      [right + distance, y],
    ] as const) {
      const colour = pixel(image, px * dpr, py * dpr);
      if (colour) out.push(colour);
    }
  }
  return out;
}

function distance(a: Rgb, b: Rgb): number {
  return Math.max(...a.map((value, index) => Math.abs(value - b[index])));
}

test.describe("poster scenes show a visible focus ring on every band control", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "ring pixel sampling runs in Chromium (desktop 1440x900, phone 390x844)",
  );

  for (const route of FOCUS_ROUTES) {
    test(`${route} band controls show a 3:1 ring on their ground`, async ({
      page,
      isMobile,
    }, testInfo) => {
      test.setTimeout(180_000);
      await openPlakatRoute(page, route, isMobile);
      const bandControls = await page
        .locator(BAND_SELECTOR)
        .locator("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])")
        .evaluateAll((elements) =>
          elements.filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length,
        );

      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur?.();
        window.scrollTo(0, 0);
      });

      const failures: string[] = [];
      const report: string[] = [];
      const seen = new Set<string>();
      let leftBand = false;
      let checked = 0;
      for (let press = 0; press < MAX_TABS && !leftBand; press += 1) {
        await page.keyboard.press("Tab");
        const key = await page.evaluate(
          ([bandSelector]) => {
            const active = document.activeElement as HTMLElement | null;
            if (!active || active === document.body) return null;
            const band = active.closest(bandSelector);
            if (!band) return { key: "outside", inBand: false };
            active.scrollIntoView({ block: "center", inline: "nearest" });
            const index = [...document.querySelectorAll(bandSelector)].indexOf(band);
            const all = [...band.querySelectorAll("*")].indexOf(active);
            return { key: `${index}:${all}`, inBand: true };
          },
          [BAND_SELECTOR] as const,
        );
        if (!key) continue;
        if (!key.inBand) {
          if (checked > 0) leftBand = true;
          continue;
        }
        if (seen.has(key.key)) break;
        seen.add(key.key);

        await page.waitForTimeout(RING_SETTLE_MS);
        const ring: Ring = await page.evaluate(() => {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          const context = canvas.getContext("2d", { willReadFrequently: true })!;
          const rgba = (value: string): [number, number, number, number] => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = "#000";
            context.fillStyle = value;
            context.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
            return [r, g, b, a / 255];
          };
          const active = document.activeElement as HTMLElement;
          const label = (
            active.getAttribute("aria-label") ||
            active.textContent ||
            active.tagName
          )
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40);
          // The ring may sit on the control or, for whole-row links, on a
          // near ancestor through `has-[a:focus-visible]:outline-*`.
          let owner: HTMLElement | null = null;
          for (
            let candidate: HTMLElement | null = active, depth = 0;
            candidate && depth < 4;
            candidate = candidate.parentElement, depth += 1
          ) {
            const style = getComputedStyle(candidate);
            if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) {
              owner = candidate;
              break;
            }
          }
          const target = owner ?? active;
          const style = getComputedStyle(target);
          const rect = target.getBoundingClientRect();
          return {
            label,
            inBand: true,
            owner: owner ? owner.tagName.toLowerCase() : null,
            colour: rgba(style.outlineColor),
            width: owner ? parseFloat(style.outlineWidth) : 0,
            offset: owner ? parseFloat(style.outlineOffset) : 0,
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            dpr: window.devicePixelRatio,
          };
        });
        checked += 1;

        if (!ring.owner || ring.width < 2) {
          failures.push(`"${ring.label}": no outline ring of 2px or more`);
          continue;
        }
        const image = await decodePng(
          await page.screenshot({ animations: "disabled", caret: "hide" }),
        );
        const computed: Rgb = [ring.colour[0], ring.colour[1], ring.colour[2]];
        const ringSamples = sampleAt(image, ring, ring.offset + ring.width / 2);
        const gapSide =
          ring.offset >= 0
            ? ring.offset + ring.width + 1.5
            : ring.offset - 1.5;
        const neighbourSamples = sampleAt(image, ring, gapSide);
        const painted = mode(ringSamples);
        const neighbour = mode(neighbourSamples);
        if (!painted || !neighbour) {
          failures.push(`"${ring.label}": ring outside the screenshot`);
          continue;
        }
        const ratio = contrast(painted, neighbour);
        const line = `"${ring.label}" ${ring.width}px offset ${ring.offset} ring ${hex(painted)} (computed ${hex(computed)}) next to ${hex(neighbour)} = ${ratio.toFixed(2)}`;
        report.push(line);
        if (distance(painted, computed) > PAINT_TOLERANCE) {
          failures.push(`${line}: ring not painted in its computed colour`);
        } else if (ratio < 3) {
          failures.push(`${line}: below 3:1`);
        }
        await page.evaluate(() => {
          (document.activeElement as HTMLElement | null)?.scrollIntoView({
            block: "nearest",
          });
        });
      }

      await testInfo.attach("plakat-focus.txt", {
        body: report.concat(failures.map((f) => `FAIL ${f}`)).join("\n"),
        contentType: "text/plain",
      });
      if (bandControls > 0) {
        expect(checked, `${route}: Tab never reached a band control`).toBeGreaterThan(0);
      }
      expect(failures, `${route} band focus rings`).toEqual([]);
    });
  }
});
