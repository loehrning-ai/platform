import { expect, test } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";

/**
 * A highlight band behind a wrapped headline must never overlap the band on
 * the line above.
 *
 * The /buecher headline is set at the poster leading (0.92), well under the
 * font's content area (ascent + descent, ~1.2em). An inline background
 * therefore overlaps from one wrapped line to the next unless it is painted as
 * an explicitly sized and positioned stripe inside each line's box. This spec
 * used to guard that for one component, HighlightedText, by importing its two
 * em constants. The poster system retired the marker band (plain ink
 * headlines; the printed covers carry the colour), and the component went with
 * it, so the guard no longer depends on any one component: it reads the
 * painted geometry of every inline element in the headline from computed
 * style (background colour and each image layer's size, position, repeat,
 * origin and clip) and asserts that no band on a later line starts above the
 * bottom of a band on an earlier line.
 *
 * So the check cannot pass just because the headline paints nothing, each
 * test also measures two probe headlines set beside the real one, with the
 * same classes, font and leading, forced to wrap. A band painted on the
 * content area must be reported as overlapping there; the sized stripe the
 * retired component used (0.75em at 0.1em) must not. That proves the detector
 * against real font metrics and real wrapping on every route and viewport it
 * guards, which is the part a unit test cannot reach.
 */

const ROUTES = ["/buecher", "/en/buecher"] as const;
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** The retired HighlightedText geometry, kept as the passing probe. */
const STRIPE_HEIGHT_EM = 0.75;
const STRIPE_OFFSET_EM = 0.1;

type ProbeKind = "content-area" | "sized-stripe";

interface PaintedBand {
  readonly element: string;
  readonly line: number;
  readonly top: number;
  readonly bottom: number;
}

interface HeadingBands {
  readonly fontSizePx: number;
  readonly lineCount: number;
  readonly bands: readonly PaintedBand[];
}

interface BandOverlap {
  readonly upper: PaintedBand;
  readonly lower: PaintedBand;
}

/**
 * Runs in the page and is self-contained, because Playwright serialises it.
 *
 * With no probe it measures the headline itself. With a probe it sets a probe
 * headline beside it (same classes and inline custom properties, so the same
 * font, size and leading; one em wide so every word wraps; hidden and out of
 * flow so the page does not move), measures that and removes it again, all in
 * one synchronous task so no render can interleave. Styles go through CSSOM,
 * which CSP does not govern, rather than through a style attribute.
 */
function measureHeadingBands(
  heading: Element,
  probe: {
    readonly kind: ProbeKind | null;
    readonly stripeHeightEm: number;
    readonly stripeOffsetEm: number;
  },
): HeadingBands {
  const splitLayers = (value: string): string[] => {
    const layers: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      if (character === "(") depth += 1;
      else if (character === ")") depth -= 1;
      else if (character === "," && depth === 0) {
        layers.push(value.slice(start, index).trim());
        start = index + 1;
      }
    }
    layers.push(value.slice(start).trim());
    return layers;
  };
  const layerValue = (layers: readonly string[], index: number): string =>
    layers[index % layers.length] ?? "";
  /** A computed length or percentage in px; null for anything else (calc, keywords). */
  const resolve = (value: string, basis: number): number | null => {
    if (/^-?\d*\.?\d+(?:e-?\d+)?px$/.test(value)) {
      return Number.parseFloat(value);
    }
    if (/^-?\d*\.?\d+(?:e-?\d+)?%$/.test(value)) {
      return (Number.parseFloat(value) / 100) * basis;
    }
    if (value === "0") return 0;
    return null;
  };
  const isTransparent = (color: string): boolean => {
    const value = color.trim();
    return (
      value === "transparent" || /(?:,|\/)\s*0(?:\.0+)?%?\s*\)$/.test(value)
    );
  };

  const measure = (target: Element): HeadingBands => {
    const fontSizePx = Number.parseFloat(
      window.getComputedStyle(target).fontSize,
    );

    // Line boxes, from the headline's own text fragments. Two fragments sit
    // on the same line when their centres are closer than a quarter em;
    // wrapped lines are a full line-height stride (0.92em here) apart.
    const centres: number[] = [];
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        if (rect.width > 0 && rect.height > 0) {
          centres.push((rect.top + rect.bottom) / 2);
        }
      }
    }
    centres.sort((a, b) => a - b);
    const lines: number[] = [];
    for (const centre of centres) {
      const previous = lines.at(-1);
      if (previous === undefined || centre - previous > fontSizePx / 4) {
        lines.push(centre);
      }
    }
    const lineOf = (top: number, bottom: number): number => {
      const centre = (top + bottom) / 2;
      let best = 0;
      for (let index = 1; index < lines.length; index += 1) {
        if (Math.abs(lines[index] - centre) < Math.abs(lines[best] - centre)) {
          best = index;
        }
      }
      return best;
    };

    const bands: PaintedBand[] = [];
    for (const element of [target, ...Array.from(target.querySelectorAll("*"))]) {
      const style = window.getComputedStyle(element);
      // A block's background is one rectangle behind every line; only an
      // inline box paints once per line fragment.
      if (style.display !== "inline") continue;

      const images = splitLayers(style.backgroundImage);
      const paintsColour = !isTransparent(style.backgroundColor);
      const paintsImage = images.some((image) => image !== "none");
      if (!paintsColour && !paintsImage) continue;

      const px = (value: string) => Number.parseFloat(value) || 0;
      const borderTop = px(style.borderTopWidth);
      const borderBottom = px(style.borderBottomWidth);
      const paddingTop = px(style.paddingTop);
      const paddingBottom = px(style.paddingBottom);
      const sizes = splitLayers(style.backgroundSize);
      const positions = splitLayers(style.backgroundPositionY);
      const repeats = splitLayers(style.backgroundRepeat);
      const origins = splitLayers(style.backgroundOrigin);
      const clips = splitLayers(style.backgroundClip);
      const className = element.getAttribute("class")?.trim();
      const label = `${element.tagName.toLowerCase()}${
        className ? `.${className.split(/\s+/).join(".")}` : ""
      }`.slice(0, 120);

      for (const rect of Array.from(element.getClientRects())) {
        // background-origin/clip boxes of this line fragment (vertical extent).
        const box = (name: string) => {
          if (name === "content-box") {
            return {
              top: rect.top + borderTop + paddingTop,
              bottom: rect.bottom - borderBottom - paddingBottom,
            };
          }
          if (name === "padding-box") {
            return {
              top: rect.top + borderTop,
              bottom: rect.bottom - borderBottom,
            };
          }
          // border-box, and `text`, conservatively: glyphs stay inside it.
          return { top: rect.top, bottom: rect.bottom };
        };
        const line = lineOf(rect.top, rect.bottom);
        const push = (top: number, bottom: number) => {
          if (bottom > top) bands.push({ element: label, line, top, bottom });
        };

        if (paintsColour) {
          // The colour fills the bottom layer's clip box.
          const clip = box(layerValue(clips, images.length - 1));
          push(clip.top, clip.bottom);
        }

        images.forEach((image, index) => {
          if (image === "none") return;
          const origin = box(layerValue(origins, index));
          const clip = box(layerValue(clips, index));
          const areaHeight = origin.bottom - origin.top;

          const repeat = layerValue(repeats, index).split(/\s+/);
          const repeatsVertically =
            repeat.length === 1
              ? ["repeat", "repeat-y", "round", "space"].includes(repeat[0])
              : repeat[1] !== "no-repeat";

          const size = layerValue(sizes, index).split(/\s+/);
          const heightToken =
            size[0] === "cover" || size[0] === "contain"
              ? "100%"
              : (size[1] ?? "auto");
          // A gradient has no intrinsic size, so `auto` fills the area.
          const height =
            heightToken === "auto"
              ? areaHeight
              : resolve(heightToken, areaHeight);
          const offset =
            height === null
              ? null
              : resolve(layerValue(positions, index), areaHeight - height);

          if (repeatsVertically || height === null || offset === null) {
            // Tiled, or a geometry this parser does not model: assume the
            // layer covers its whole clip box, the least forgiving reading.
            push(clip.top, clip.bottom);
            return;
          }
          const top = origin.top + offset;
          push(Math.max(top, clip.top), Math.min(top + height, clip.bottom));
        });
      }
    }

    return { fontSizePx, lineCount: lines.length, bands };
  };

  if (probe.kind === null) return measure(heading);

  const probeHeading = heading.cloneNode(false) as HTMLElement;
  probeHeading.removeAttribute("id");
  probeHeading.setAttribute("aria-hidden", "true");
  probeHeading.setAttribute("data-heading-band-probe", probe.kind);
  probeHeading.style.cssText = (heading as HTMLElement).style.cssText;
  probeHeading.style.setProperty("position", "absolute");
  probeHeading.style.setProperty("visibility", "hidden");
  probeHeading.style.setProperty("inset-inline-start", "0");
  probeHeading.style.setProperty("top", "0");
  probeHeading.style.setProperty("width", "1em");
  probeHeading.style.setProperty("max-width", "none");

  const band = document.createElement("span");
  band.textContent = "Band Band Band";
  if (probe.kind === "content-area") {
    band.style.setProperty("background-color", "rgb(0 0 0 / 0.25)");
  } else {
    band.style.setProperty(
      "background-image",
      "linear-gradient(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.25))",
    );
    band.style.setProperty("background-size", `100% ${probe.stripeHeightEm}em`);
    band.style.setProperty("background-position", `0 ${probe.stripeOffsetEm}em`);
    band.style.setProperty("background-repeat", "no-repeat");
    band.style.setProperty("box-decoration-break", "clone");
  }
  probeHeading.append(band);
  heading.after(probeHeading);
  try {
    return measure(probeHeading);
  } finally {
    probeHeading.remove();
  }
}

/** Every pair of bands on different lines where the lower one starts above the upper one's bottom. */
function overlaps(bands: readonly PaintedBand[]): BandOverlap[] {
  const found: BandOverlap[] = [];
  for (const upper of bands) {
    for (const lower of bands) {
      if (lower.line > upper.line && lower.top < upper.bottom) {
        found.push({ upper, lower });
      }
    }
  }
  return found;
}

const probeOptions = (kind: ProbeKind | null) => ({
  kind,
  stripeHeightEm: STRIPE_HEIGHT_EM,
  stripeOffsetEm: STRIPE_OFFSET_EM,
});

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`${route} heading band has no line-to-line overlap at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await page
        .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
        .waitFor({ state: "attached" });
      await settleFontsAndFrame(page);

      const heading = page.locator("main h1").first();
      await expect(heading).toBeVisible();

      const measured = await heading.evaluate(
        measureHeadingBands,
        probeOptions(null),
      );
      expect(
        Number.isFinite(measured.fontSizePx) && measured.fontSizePx > 0,
        "font-size must resolve before any band can be derived",
      ).toBe(true);
      expect(
        measured.lineCount,
        "headline must lay out onto at least one line",
      ).toBeGreaterThan(0);
      expect(
        overlaps(measured.bands),
        `painted headline bands overlap across wrapped lines at ${viewport.name}`,
      ).toEqual([]);

      // Detector proof at this route's real headline type.
      const contentArea = await heading.evaluate(
        measureHeadingBands,
        probeOptions("content-area"),
      );
      expect(contentArea.fontSizePx).toBe(measured.fontSizePx);
      expect(
        contentArea.lineCount,
        "probe headline must wrap",
      ).toBeGreaterThanOrEqual(2);
      expect(contentArea.bands, "one band per wrapped line").toHaveLength(
        contentArea.lineCount,
      );
      expect(
        overlaps(contentArea.bands).length,
        "a content-area background at this leading must be reported as overlapping",
      ).toBeGreaterThan(0);

      const sizedStripe = await heading.evaluate(
        measureHeadingBands,
        probeOptions("sized-stripe"),
      );
      expect(sizedStripe.fontSizePx).toBe(measured.fontSizePx);
      expect(sizedStripe.lineCount).toBeGreaterThanOrEqual(2);
      expect(sizedStripe.bands).toHaveLength(sizedStripe.lineCount);
      for (const band of sizedStripe.bands) {
        expect(band.bottom - band.top).toBeCloseTo(
          STRIPE_HEIGHT_EM * sizedStripe.fontSizePx,
          1,
        );
      }
      expect(
        overlaps(sizedStripe.bands),
        "a 0.75em stripe 0.1em down stays inside the line stride",
      ).toEqual([]);
      await expect(page.locator("[data-heading-band-probe]")).toHaveCount(0);
    });
  }
}
