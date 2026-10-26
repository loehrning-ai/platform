import { expect, type Page } from "@playwright/test";

/** Amendment 27 and Werkglas: at most two `.glass` surfaces on a desktop, one on a phone. */
export const MAX_VISIBLE_GLASS = 2;
export const MAX_VISIBLE_GLASS_PHONE = 1;
/** Below this width the page is a phone layout (the site's lg breakpoint). */
const DESKTOP_MIN_WIDTH = 1024;

export interface GlassCount {
  /** `.glass` elements that are rendered and intersect the viewport. */
  readonly visible: number;
  /** `.glass` elements with a `.glass` ancestor (must be 0). */
  readonly nested: number;
}

/**
 * Counts the glass surfaces the visitor can see right now. One evaluate, no
 * waits: call it after the page settled, at each scroll position you care
 * about.
 */
export async function countVisibleGlass(page: Page): Promise<GlassCount> {
  return page.evaluate(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>(".glass"));
    const visible = all.filter((element) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return false;
      return box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth;
    }).length;
    const nested = all.filter((element) => element.parentElement?.closest(".glass")).length;
    return { visible, nested };
  });
}

/** Fails when too many glass surfaces are visible for this viewport, or one sits inside another. */
export async function expectGlassBudget(page: Page, where = "this view"): Promise<void> {
  const count = await countVisibleGlass(page);
  const width = page.viewportSize()?.width ?? DESKTOP_MIN_WIDTH;
  const max = width >= DESKTOP_MIN_WIDTH ? MAX_VISIBLE_GLASS : MAX_VISIBLE_GLASS_PHONE;
  expect(count.nested, `nested .glass on ${where}`).toBe(0);
  expect(count.visible, `visible .glass on ${where}`).toBeLessThanOrEqual(max);
}

export interface GlassTextReading {
  readonly text: string;
  readonly color: string;
  readonly ratio: number;
}

/**
 * Text on glass, measured with no credit for the blur: every visible text
 * element painted on a `.glass` surface (its descendants, or, for an empty
 * surface layer, the content of the element it lies under) against the
 * surface's own tint composited over pure black, the darkest frame a film or
 * photo can show. Text on its own opaque fill (a pill, a button) is skipped:
 * that fill is what it is read against. The logotype ([data-logo-wordmark],
 * whose ".ai" is the Mennige mark) is a mark, not text (WCAG 1.4.3 exempts
 * logotypes), and is held to the 3:1 a mark needs. Returns every reading
 * under its floor and how many text elements were measured.
 */
export async function glassTextBelowAA(page: Page): Promise<{ measured: number; failures: GlassTextReading[] }> {
  return page.evaluate(() => {
    const parse = (value: string): number[] => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return [0, 0, 0, 0];
      const parts = match[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
    };
    const channel = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (rgb: number[]) => 0.2126 * channel(rgb[0]!) + 0.7152 * channel(rgb[1]!) + 0.0722 * channel(rgb[2]!);
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const failures: { text: string; color: string; ratio: number }[] = [];
    let measured = 0;
    for (const surface of Array.from(document.querySelectorAll<HTMLElement>(".glass"))) {
      const box = surface.getBoundingClientRect();
      if (box.width === 0 || getComputedStyle(surface).display === "none") continue;
      const [r, g, b, alpha] = parse(getComputedStyle(surface).backgroundColor);
      // The tint over black: what is left when a flat black frame sits behind.
      const ground = [r! * alpha!, g! * alpha!, b! * alpha!];
      const empty = surface.childElementCount === 0 && !surface.textContent?.trim();
      const host = empty ? surface.parentElement : surface;
      if (!host) continue;
      for (const element of Array.from(host.querySelectorAll<HTMLElement>("*"))) {
        const ownText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        if (!ownText) continue;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.visibility === "hidden" || rect.width === 0 || rect.height === 0) continue;
        if (element.closest(".sr-only")) continue;
        // Inside the surface's box only.
        if (rect.bottom <= box.top || rect.top >= box.bottom || rect.right <= box.left || rect.left >= box.right) continue;
        // Skip text that sits on its own opaque fill between it and the surface.
        let filled = false;
        for (let node: HTMLElement | null = element; node && node !== host; node = node.parentElement) {
          if (parse(getComputedStyle(node).backgroundColor)[3]! >= 0.99) {
            filled = true;
            break;
          }
        }
        if (filled) continue;
        measured += 1;
        const value = ratio(parse(style.color), ground);
        const floor = element.closest("[data-logo-wordmark]") ? 3 : 4.5;
        if (value < floor) failures.push({ text: element.textContent!.trim().slice(0, 40), color: style.color, ratio: Math.round(value * 100) / 100 });
      }
    }
    return { measured, failures };
  });
}
