/**
 * Poster scenes: text contrast over bands, shapes and posters (SPEC §8.3).
 *
 * axe leaves text over SVG art "incomplete", and Lighthouse cannot see a
 * shape behind a headline. This check reads the real pixels instead: it
 * records every text box inside a band or poster, paints all text
 * transparent, screenshots each band and poster, and measures the text colour
 * against every colour under the box that covers at least 4% of it.
 *
 * Floors (WCAG 1.4.3): 4.5, or 3 for large text (24px, or 18.66px bold).
 * Poster numerals are aria-hidden display marks; they need 3 against the
 * ground that carries them (at least a quarter of their box). Where a numeral
 * crosses a shape, the keyline (`paint-order: stroke`) separates it, as
 * SPEC §3.5 and §7.3 require, so the crossing shape is not the reference.
 *
 * Runs once per engine family in Chromium: the desktop project at 1440x900
 * and the mobile project at 390x844 (DPR 3). Colours do not depend on the
 * engine; WebKit keeps its own a11y and layout specs.
 */

import { expect, test } from "@playwright/test";
import {
  BAND_SELECTOR,
  POSTER_SELECTOR,
  PLAKAT_ROUTES,
  blend,
  colourShares,
  contrast,
  decodePng,
  hex,
  openPlakatRoute,
  type Rgb,
} from "./fixtures/plakat-pixels";

interface TextBox {
  readonly target: number;
  readonly text: string;
  readonly colour: [number, number, number, number];
  readonly opacity: number;
  readonly size: number;
  readonly weight: number;
  readonly numeral: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Target {
  readonly index: number;
  readonly kind: string;
  readonly width: number;
  readonly height: number;
}

const BODY_SHARE = 0.04;
const NUMERAL_SHARE = 0.25;
/**
 * Routes whose H1 sits on paper, with no poster band (docs/experience-system.md:
 * the home hero is the line globe on paper, the workshop hub header is on
 * paper, /kurse keeps its H1 on paper per SPEC §3.4, §4). Their posters, where
 * they have any, are still scenes.
 */
const PAPER_HERO_ROUTES = new Set<string>(["/", "/workshops", "/kurse"]);
/**
 * Routes with no scene text to measure: home shows no band or poster at all,
 * and the /kurse posters are text-free art. The check still runs there, so a
 * band or a poster text added later is measured.
 */
const NO_SCENE_TEXT_ROUTES = new Set<string>(["/", "/kurse"]);

test.describe("poster scenes keep text contrast over bands and posters", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "pixel sampling runs in Chromium (desktop 1440x900, phone 390x844)",
  );

  for (const route of PLAKAT_ROUTES) {
    test(`${route} band and poster text meets AA on its real ground`, async ({
      page,
      isMobile,
    }, testInfo) => {
      test.setTimeout(180_000);
      await openPlakatRoute(page, route, isMobile);

      // Mark the top-level targets: every visible band, and every visible
      // poster that is not already inside a band.
      const targets: Target[] = await page.evaluate(
        ([bandSelector, posterSelector]) => {
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return (
              rect.width >= 8 &&
              rect.height >= 8 &&
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          };
          const found: Element[] = [];
          for (const band of document.querySelectorAll(bandSelector)) {
            if (visible(band) && !band.parentElement?.closest(bandSelector)) {
              found.push(band);
            }
          }
          for (const poster of document.querySelectorAll(posterSelector)) {
            if (visible(poster) && !poster.closest(bandSelector)) {
              found.push(poster);
            }
          }
          return found.map((element, index) => {
            element.setAttribute("data-plakat-check", String(index));
            const rect = element.getBoundingClientRect();
            return {
              index,
              kind: element.matches(bandSelector) ? "band" : "poster",
              width: rect.width,
              height: rect.height,
            };
          });
        },
        [BAND_SELECTOR, POSTER_SELECTOR] as const,
      );
      expect(
        targets.filter((target) => target.kind === "band").length,
        `${route} must render a poster band`,
      ).toBeGreaterThanOrEqual(PAPER_HERO_ROUTES.has(route) ? 0 : 1);
      if (!NO_SCENE_TEXT_ROUTES.has(route)) {
        expect(targets.length, `${route} must render a band or a poster`).toBeGreaterThan(0);
      }

      const boxes: TextBox[] = await page.evaluate(() => {
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
        const out: TextBox[] = [];
        for (const target of document.querySelectorAll("[data-plakat-check]")) {
          const index = Number(target.getAttribute("data-plakat-check"));
          const origin = target.getBoundingClientRect();
          const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
            if (!text) continue;
            const element = node.parentElement;
            if (!element || element.closest("script,style,title,noscript")) continue;
            const numeral = !!element.closest(
              "[data-poster-numeral-text], [data-poster-numeral], [data-poster] text",
            );
            // Decorative aria-hidden text (arrow glyphs, the art) is exempt,
            // except the poster numerals, which carry the sequence.
            if (!numeral && element.closest("[aria-hidden='true']")) continue;
            const style = getComputedStyle(element);
            if (style.visibility === "hidden" || style.display === "none") continue;
            let opacity = 1;
            for (let a: Element | null = element; a; a = a.parentElement) {
              opacity *= Number(getComputedStyle(a).opacity || "1");
            }
            if (opacity < 0.05) continue;
            const isSvg = element instanceof SVGElement;
            const colour = rgba(isSvg ? style.fill : style.color);
            let size = parseFloat(style.fontSize);
            if (isSvg && element instanceof SVGGraphicsElement) {
              const svg = element.ownerSVGElement;
              const viewBox = svg?.viewBox.baseVal;
              if (svg && viewBox && viewBox.width) {
                size *= svg.getBoundingClientRect().width / viewBox.width;
              }
            }
            // Clip to overflow-hidden ancestors, as the painted text is.
            let clip = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
            for (let a = element.parentElement; a; a = a.parentElement) {
              const s = getComputedStyle(a);
              if (/(hidden|clip)/.test(`${s.overflow} ${s.overflowX} ${s.overflowY}`)) {
                const q = a.getBoundingClientRect();
                clip = {
                  l: Math.max(clip.l, q.left),
                  t: Math.max(clip.t, q.top),
                  r: Math.min(clip.r, q.right),
                  b: Math.min(clip.b, q.bottom),
                };
              }
              if (a === target) break;
            }
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const r of range.getClientRects()) {
              const l = Math.max(r.left, clip.l, origin.left, 0);
              const t = Math.max(r.top, clip.t, origin.top);
              const rr = Math.min(r.right, clip.r, origin.right, innerWidth);
              const b = Math.min(r.bottom, clip.b, origin.bottom);
              if (rr - l < 2 || b - t < 2) continue;
              out.push({
                target: index,
                text: text.slice(0, 48),
                colour,
                opacity,
                size: Math.round(size * 10) / 10,
                weight: Number.parseInt(style.fontWeight, 10) || 400,
                numeral,
                x: l - origin.left,
                y: t - origin.top,
                width: rr - l,
                height: b - t,
              });
            }
          }
        }
        return out;
      });
      expect(
        boxes.filter((box) => !box.numeral).length,
        `${route} bands must contain text to check`,
      ).toBeGreaterThanOrEqual(PAPER_HERO_ROUTES.has(route) ? 0 : 1);

      // Paint every glyph transparent (layout unchanged) and take chrome
      // that floats over the page out of the picture.
      await page.addStyleTag({
        content: `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }
svg text, svg tspan { fill: transparent !important; stroke: transparent !important; }`,
      });
      await page.evaluate(() => {
        for (const element of document.querySelectorAll("body *")) {
          const position = getComputedStyle(element).position;
          if (position === "fixed" || position === "sticky") {
            (element as HTMLElement).style.setProperty("visibility", "hidden", "important");
          }
        }
      });

      const failures: string[] = [];
      const report: string[] = [];
      for (const target of targets) {
        const locator = page.locator(`[data-plakat-check="${target.index}"]`);
        await locator.scrollIntoViewIfNeeded();
        const image = await decodePng(
          await locator.screenshot({ animations: "disabled", caret: "hide" }),
        );
        const scaleX = image.width / target.width;
        const scaleY = image.height / target.height;
        for (const box of boxes.filter((b) => b.target === target.index)) {
          const shares = colourShares(image, {
            x0: box.x * scaleX,
            y0: box.y * scaleY,
            x1: (box.x + box.width) * scaleX,
            y1: (box.y + box.height) * scaleY,
          });
          const floorShare = box.numeral ? NUMERAL_SHARE : BODY_SHARE;
          const grounds = shares.filter((entry) => entry.share >= floorShare);
          if (grounds.length === 0) continue;
          const large =
            box.numeral ||
            box.size >= 24 ||
            (box.size >= 18.66 && box.weight >= 700);
          const need = large ? 3 : 4.5;
          const alpha = box.colour[3] * box.opacity;
          const ink: Rgb = [box.colour[0], box.colour[1], box.colour[2]];
          let worst = { ratio: Infinity, ground: grounds[0].colour };
          for (const { colour } of grounds) {
            const fg = alpha < 0.99 ? blend(ink, colour, alpha) : ink;
            const ratio = contrast(fg, colour);
            if (ratio < worst.ratio) worst = { ratio, ground: colour };
          }
          const line = `${target.kind}#${target.index} "${box.text}" ${hex(ink)}${
            alpha < 0.99 ? `@${alpha.toFixed(2)}` : ""
          } on ${hex(worst.ground)} = ${worst.ratio.toFixed(2)} (need ${need}, ${box.size}px/${box.weight})`;
          report.push(line);
          if (worst.ratio < need) failures.push(line);
        }
      }

      await testInfo.attach("plakat-contrast.txt", {
        body: report.join("\n"),
        contentType: "text/plain",
      });
      if (!NO_SCENE_TEXT_ROUTES.has(route)) {
        expect(report.length, `${route}: no text box was sampled`).toBeGreaterThan(0);
      }
      expect(failures, `${route} text below its contrast floor`).toEqual([]);
    });
  }
});
