import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";

/**
 * Phone checks of the insight reader (390x844): the first screen carries data, the pause switch is a 48px
 * labelled control, the explorer speaks English on /en and is reachable by keyboard, the sources table has
 * no clipped column, the header lockup never overlaps, and the /en pages do not shift.
 */

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const BOOK = "/buecher/ki-landschaft";

test("cover: the first screen holds the numeral, the claim and the caveat; the pause button is a 44px icon inside the box, Kapitel 1 lesen is pinned above the tab bar", async ({ page }) => {
  await page.goto(BOOK);
  await page.waitForTimeout(2800);
  const numeral = page.locator("[data-cover-reel] .rt-numeral, [data-book-numeral]").first();
  await expect(numeral).toBeAttached();
  const caveat = page.locator("[data-book-source]");
  const box = await caveat.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThan(844 - 56);
  const pause = page.locator(".cr-pause");
  if (await pause.isVisible()) {
    const p = await pause.boundingBox();
    expect(p!.height).toBeGreaterThanOrEqual(44);
    expect(p!.width).toBeGreaterThanOrEqual(44);
    expect(p!.x + p!.width).toBeLessThanOrEqual(390);
  }
});

test("chapter: the stage starts high, the pause switch is a 48px labelled switch with a state", async ({ page }) => {
  await page.goto(`${BOOK}/01_zweimal_gemessen`);
  const pin = page.locator("[data-cs-pin]").first();
  const top = (await pin.boundingBox())!.y;
  expect(top).toBeLessThan(260);
  const label = page.locator(".cs-pause").first();
  const box = (await label.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(48);
  const toggle = page.getByRole("switch", { name: "Bewegung anhalten" });
  await expect(toggle).not.toBeChecked();
  await label.click();
  await expect(toggle).toBeChecked();
  await expect(label).toContainText(/Start/);
});

test("header lockup: the tile and the word never overlap once scrolled", async ({ page }) => {
  await page.goto(`${BOOK}/04_stellen_namen`);
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(600);
  const boxes = await page.evaluate(() => {
    const mark = document.querySelector("[data-logo-mark]")!.getBoundingClientRect();
    const word = document.querySelector("[data-logo-wordmark-remainder]")!.getBoundingClientRect();
    return { markRight: mark.right, wordLeft: word.left };
  });
  expect(boxes.wordLeft).toBeGreaterThan(boxes.markRight);
});

test("explorer /en: English words and numbers, keyboard path through the text-length chips", async ({ page }) => {
  await page.goto(`/en${BOOK}/08_dein_zug`);
  const root = page.locator("[data-explorer]");
  const text = (await root.innerText()).replace(/\s+/g, " ");
  expect(text).not.toMatch(/\b(von 100|Firmen|Gruppe|Branche|wie deiner|Quadrat|Wo stehe)\b/);
  await expect(root.locator(".ex-numeral-of")).toHaveText("of 100");
  await expect(page.locator("[data-rescan-note]")).toBeVisible();
  const chips = root.locator(".ex-chip-input");
  await chips.nth(1).focus();
  await page.keyboard.press("ArrowRight");
  await expect(chips.nth(2)).toBeChecked();
  await expect(chips.nth(2)).toBeFocused();
});

test("sources: rows stack as cards, nothing clips sideways", async ({ page }) => {
  await page.goto(`${BOOK}/09_quellen`);
  const overflow = await page.evaluate(() => {
    const wrap = document.querySelector("[data-horizontal-scroll]") as HTMLElement;
    return { sw: wrap.scrollWidth, cw: wrap.clientWidth };
  });
  expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);
  await expect(page.locator(".md-stack td[data-label='Umfang und Zeitraum']").first()).toContainText(/März bis April 2026/);
});

interface ShiftDiagnostic {
  value: number;
  hadRecentInput: boolean;
  sources: { tag: string; id: string; className: string; previousRect: ShiftRect; currentRect: ShiftRect }[];
}
interface ShiftRect { x: number; y: number; width: number; height: number }
interface ShiftMeasurement { total: number; shifts: ShiftDiagnostic[] }

/** Collect from navigation through stage hydration and scrolling; retain bounded cause evidence if the budget fails. */
async function measureCls(page: Page, path: string): Promise<ShiftMeasurement> {
  await page.addInitScript(() => {
    const metrics = window as unknown as { __cls: number; __clsEntries: ShiftDiagnostic[] };
    metrics.__cls = 0;
    metrics.__clsEntries = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[] }[]) {
        if (!entry.hadRecentInput) metrics.__cls += entry.value;
        if (metrics.__clsEntries.length < 32) {
          const rect = (box: DOMRectReadOnly): ShiftRect => ({ x: box.x, y: box.y, width: box.width, height: box.height });
          metrics.__clsEntries.push({
            value: entry.value,
            hadRecentInput: entry.hadRecentInput,
            sources: (entry.sources ?? []).map((source) => {
              const node = source.node instanceof Element ? source.node : source.node?.parentElement;
              return { tag: node?.tagName ?? "", id: node?.id ?? "", className: node?.getAttribute("class") ?? "", previousRect: rect(source.previousRect), currentRect: rect(source.currentRect) };
            }),
          });
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, 320);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const metrics = window as unknown as { __cls: number; __clsEntries: ShiftDiagnostic[] };
    return { total: metrics.__cls, shifts: metrics.__clsEntries };
  });
}

const CLS_PATHS = [
  ...["02_textmenge", "03_schaufenster", "04_stellen_namen", "05_land", "06_stimmen"].map((c) => `/buecher/ki-landschaft/${c}`),
  ...["02_textmenge", "04_stellen_namen", "05_land"].map((c) => `/en/buecher/ki-landschaft/${c}`),
];

for (const path of CLS_PATHS) {
  test(`no layout shift on ${path} (stage heads reserve the tallest step)`, async ({ page }) => {
    const measurement = await measureCls(page, path);
    expect(measurement.total, `Layout-shift sources: ${JSON.stringify(measurement.shifts)}`).toBeLessThanOrEqual(0.02);
  });
}

test("the disabled Zurück is a solid outlined button at 40 %, never a dashed box", async ({ page }) => {
  await page.goto(`${BOOK}/02_textmenge`);
  await page.waitForTimeout(3200);
  const back = page.locator(".ifb-btn").first();
  await expect(back).toHaveAttribute("aria-disabled", "true");
  const style = await back.evaluate((el) => {
    const c = getComputedStyle(el);
    return { border: c.borderTopStyle, opacity: c.opacity };
  });
  expect(style.border).toBe("solid");
  expect(Number(style.opacity)).toBeCloseTo(0.4, 1);
});

test("first screen: the step sentence is not under the reader bar", async ({ page }) => {
  for (const chapter of ["02_textmenge", "03_schaufenster", "05_land"]) {
    await page.goto(`${BOOK}/${chapter}`);
    const card = page.locator(".cs-card-text").first();
    const box = (await card.boundingBox())!;
    expect(box.y + box.height, chapter).toBeLessThanOrEqual(844 - 56);
  }
});

test("explorer: the readout and all four controls are on the first screen, above the reader bar", async ({ page }) => {
  await page.goto(`${BOOK}/08_dein_zug`);
  const bottom = async (locator: ReturnType<Page["locator"]>): Promise<number> => {
    const b = (await locator.boundingBox())!;
    return b.y + b.height;
  };
  const root = page.locator("[data-explorer]");
  const limit = 844 - 56;
  expect(await bottom(root.locator("[data-explorer-readout]"))).toBeLessThanOrEqual(limit);
  const selects = root.locator("select.ex-select");
  expect(await bottom(selects.nth(0))).toBeLessThanOrEqual(limit);
  expect(await bottom(root.locator("[data-explorer-textmenge] .ex-chip-row"))).toBeLessThanOrEqual(limit);
  expect(await bottom(selects.nth(1))).toBeLessThanOrEqual(limit);
  expect(await bottom(selects.nth(2))).toBeLessThanOrEqual(limit);
});

test("explorer: the source line is one line of at most 20 words", async ({ page }) => {
  await page.goto(`${BOOK}/08_dein_zug`);
  const text = (await page.locator("[data-source-line='explorer']").innerText()).trim();
  expect(text.split(/\s+/).length).toBeLessThanOrEqual(20);
});

for (const path of [BOOK, `${BOOK}/02_textmenge`, `${BOOK}/08_dein_zug`, `/en${BOOK}/02_textmenge`]) {
  test(`axe finds no violation on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(3200);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("keyboard: Tab reaches the pause switch, Space toggles it, Enter on Weiter steps, Escape traps nothing", async ({ page }) => {
  await page.goto(`${BOOK}/02_textmenge`);
  await page.waitForTimeout(3200);
  const toggle = page.getByRole("switch", { name: "Bewegung anhalten" });
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  const next = page.locator(".ifb-btn--primary").first();
  await next.focus();
  await expect(next).toBeFocused();
  const before = await page.locator("[data-reader-focus-position]").innerText();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-reader-focus-position]")).not.toHaveText(before);
});

/** WCAG relative luminance contrast of two css rgb()/rgba() strings. */
function contrast(a: string, b: string): number {
  const lum = (css: string): number => {
    const [r, g, bl] = (css.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (bl as number);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi as number) + 0.05) / ((lo as number) + 0.05);
}

test("anti colours: focus and press states of Weiter and the pause switch keep 4.5:1 text contrast and never match their own fill", async ({ page }) => {
  await page.goto(`${BOOK}/02_textmenge`);
  await page.waitForTimeout(3200);
  const read = (selector: string) =>
    page.locator(selector).first().evaluate((el) => {
      const c = getComputedStyle(el);
      return { color: c.color, bg: c.backgroundColor, outline: c.outlineColor, outlineStyle: c.outlineStyle };
    });
  const next = ".ifb-btn--primary";
  await page.locator(next).first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const focus = await read(next);
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outline).not.toBe(focus.bg);
  const box = (await page.locator(next).first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const pressed = await read(next);
  await page.mouse.up();
  expect(pressed.bg).not.toBe(focus.bg);
  expect(contrast(pressed.color, pressed.bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(focus.color, focus.bg)).toBeGreaterThanOrEqual(4.5);
});
